import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { districtsData } from './data/districts.data';
import {
  LegacySqlDepartmentUserRow,
  loadLegacyDepartmentUsersCsvRows,
  loadLegacySqlDepartmentUserRows,
  loadLegacyUsersCsvRows,
} from './data/legacy-department-users.data';

type UserType = 'DEPARTMENT';

function normalizeName(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isValidEmail(value?: string | null): boolean {
  const email = String(value || '').trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeEmailFromLogin(login?: string | null): string | null {
  const raw = String(login || '').trim();
  if (!raw) return null;
  if (isValidEmail(raw)) return raw;
  const local = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/_+/g, '_');
  if (!local) return null;
  return `${local}@legacy.local`;
}

function resolveLegacyRows(
  sqlRows: LegacySqlDepartmentUserRow[],
): LegacySqlDepartmentUserRow[] {
  if (sqlRows.length > 0) {
    return sqlRows;
  }

  // BUSINESS RULE: if district/department names are not available from legacy SQL CSV,
  // we cannot safely remap to new district IDs by name. We return empty and log from caller.
  return [];
}

export async function seedLegacyDepartmentUsers(prisma: PrismaClient) {
  try {
    console.log('  📦 Seeding legacy department users with district remap...');

    const [departmentUserRole, departments, usersCsv, deptUsersCsv, sqlRows] =
      await Promise.all([
        prisma.roles.findFirst({ where: { name: 'department_user' } }),
        prisma.department.findMany({
          select: { id: true, name: true },
        }),
        Promise.resolve(loadLegacyUsersCsvRows()),
        Promise.resolve(loadLegacyDepartmentUsersCsvRows()),
        Promise.resolve(loadLegacySqlDepartmentUserRows()),
      ]);

    if (!departmentUserRole?.id) {
      console.warn(
        '  ⚠️ Skipping legacy department users seed: role "department_user" not found',
      );
      return;
    }

    const districtNameMap = new Map<string, number>();
    const districtDuplicateNames = new Set<string>();
    for (const district of districtsData) {
      const key = normalizeName(district.name);
      if (!key) continue;
      if (!districtNameMap.has(key)) {
        districtNameMap.set(key, Number(district.id));
      } else {
        districtDuplicateNames.add(key);
      }
    }

    if (districtDuplicateNames.size > 0) {
      console.warn(
        `  ⚠️ Found ${districtDuplicateNames.size} duplicate district names in master data; first ID mapping will be used`,
      );
    }

    const departmentNameMap = new Map<string, number>();
    for (const dept of departments) {
      const key = normalizeName(dept.name);
      if (!key) continue;
      if (!departmentNameMap.has(key)) {
        departmentNameMap.set(key, Number(dept.id));
      }
    }

    const legacyPasswordByEmail = new Map<string, string>();
    for (const row of usersCsv) {
      const email = String(row.email || '').trim().toLowerCase();
      const hash = String(row.password_hash || '').trim();
      if (!email) continue;
      if (!hash) continue;
      legacyPasswordByEmail.set(email, hash);
    }

    const legacyRows = resolveLegacyRows(sqlRows);
    if (!legacyRows.length) {
      console.warn(
        `  ⚠️ No usable legacy rows found (sql rows=${sqlRows.length}, users rows=${usersCsv.length}, department_users rows=${deptUsersCsv.length}).`,
      );
      return;
    }

    const defaultPasswordHash = await bcrypt.hash('user@123', 10);

    let createdUsers = 0;
    let reusedUsers = 0;
    let upsertedProfiles = 0;
    let skippedDistrict = 0;
    let skippedDepartment = 0;
    let skippedIdentity = 0;

    for (const row of legacyRows) {
      const districtName = String(
        row.distric_name || row.district_name || '',
      ).trim();
      const departmentName = String(row.department_name || '').trim();
      const fullName = String(row.full_name || '').trim() || 'Legacy User';
      const login = String(row.login || '').trim();
      const rowEmail = String(row.email || '').trim();

      const districtKey = normalizeName(districtName);
      let districtId = districtNameMap.get(districtKey) || null;
      if (!districtId && districtKey) {
        const fuzzyDistrictMatches = Array.from(districtNameMap.entries()).filter(
          ([name]) => name.includes(districtKey) || districtKey.includes(name),
        );
        if (fuzzyDistrictMatches.length === 1) {
          districtId = fuzzyDistrictMatches[0][1];
        } else if (fuzzyDistrictMatches.length > 1) {
          skippedDistrict += 1;
          console.warn(
            `  ⚠️ Skip row: ambiguous district mapping "${districtName}"`,
          );
          continue;
        } else {
          skippedDistrict += 1;
          console.warn(
            `  ⚠️ Skip row: district not found in new map "${districtName}"`,
          );
          continue;
        }
      } else if (!districtId) {
        skippedDistrict += 1;
        console.warn('  ⚠️ Skip row: district name missing');
        continue;
      }

      const departmentKey = normalizeName(departmentName);
      let deptId = departmentNameMap.get(departmentKey) || null;
      if (!deptId && departmentKey) {
        const fuzzyDepartmentMatches = Array.from(
          departmentNameMap.entries(),
        ).filter(
          ([name]) =>
            name.includes(departmentKey) || departmentKey.includes(name),
        );
        if (fuzzyDepartmentMatches.length === 1) {
          deptId = fuzzyDepartmentMatches[0][1];
        } else if (fuzzyDepartmentMatches.length > 1) {
          skippedDepartment += 1;
          console.warn(
            `  ⚠️ Skip row: ambiguous department mapping "${departmentName}"`,
          );
          continue;
        } else {
          skippedDepartment += 1;
          console.warn(
            `  ⚠️ Skip row: department not found "${departmentName}"`,
          );
          continue;
        }
      } else if (!deptId) {
        skippedDepartment += 1;
        console.warn('  ⚠️ Skip row: department name missing');
        continue;
      }

      let identityEmail: string | null = null;
      if (isValidEmail(rowEmail)) {
        identityEmail = rowEmail.toLowerCase();
      } else if (isValidEmail(login)) {
        identityEmail = login.toLowerCase();
      } else {
        identityEmail = safeEmailFromLogin(login);
      }

      if (!identityEmail) {
        skippedIdentity += 1;
        console.warn(
          `  ⚠️ Skip row: no usable email/login identity (full_name="${fullName}")`,
        );
        continue;
      }

      const legacyPasswordHash = legacyPasswordByEmail.get(identityEmail);
      const userPasswordHash = legacyPasswordHash || defaultPasswordHash;

      const existingByEmail = await prisma.users.findFirst({
        where: { email: identityEmail },
      });

      let userRecord = existingByEmail;
      if (!userRecord && login) {
        const loginAsEmail = String(login).trim().toLowerCase();
        userRecord = await prisma.users.findFirst({
          where: { email: loginAsEmail },
        });
      }

      if (!userRecord) {
        userRecord = await prisma.users.create({
          data: {
            email: identityEmail,
            password_hash: userPasswordHash,
            password_algo: 'bcrypt',
            user_type: 'DEPARTMENT' as UserType,
            is_email_verified: 1,
            role_id: departmentUserRole.id,
          },
        });
        createdUsers += 1;
      } else {
        reusedUsers += 1;
      }

      await prisma.department_users.upsert({
        where: { user_id: userRecord.id },
        update: {
          full_name: fullName,
          email: userRecord.email || identityEmail,
          dept_id: deptId,
          district_id: districtId,
          status: 1,
          np_user_id: String(departmentUserRole.id),
        },
        create: {
          user_id: userRecord.id,
          full_name: fullName,
          email: userRecord.email || identityEmail,
          dept_id: deptId,
          district_id: districtId,
          status: 1,
          np_user_id: String(departmentUserRole.id),
        },
      });
      upsertedProfiles += 1;
    }

    console.log(
      `  ✅ Legacy department users seed done. users(created=${createdUsers}, reused=${reusedUsers}), profiles=${upsertedProfiles}, skipped(district=${skippedDistrict}, department=${skippedDepartment}, identity=${skippedIdentity})`,
    );
  } catch (error) {
    console.error('  ❌ Legacy department users seeding failed:', error);
    throw error;
  }
}
