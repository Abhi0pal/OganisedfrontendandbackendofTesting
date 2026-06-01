
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/** Generate an 8-digit Investor UID (e.g., 85586670) */
function generateIuid(): string {
  const n = Math.floor(10_000_000 + Math.random() * 89_999_999);
  return String(n);
}

/*
 * Local string union to avoid relying on Prisma enum typings in seeds.
 * Matches enum user_type in schema.prisma: INVESTOR | DEPARTMENT
 */
type UserType = 'INVESTOR' | 'DEPARTMENT' | 'INSPECTOR' | 'CIS_USER';

export async function seedUsers(prisma: PrismaClient) {
  try {
    const [adminRole, investorRole, departmentUserRole, jdRole, nodalRole, cisAdminRole, inspectorRole] = await Promise.all([
      prisma.roles.findFirst({ where: { name: 'admin' } }),
      prisma.roles.findFirst({ where: { name: 'investor' } }),
      prisma.roles.findFirst({ where: { name: 'department_user' } }),
      prisma.roles.findFirst({ where: { name: 'Joint_Director' } }),
      prisma.roles.findFirst({ where: { id: 7 } }),
      prisma.roles.findFirst({ where: { name: 'CIS_Admin' } }),
      prisma.roles.findFirst({ where: { name: 'Inspector' } }),
    ]);

    if (!adminRole || !investorRole || !departmentUserRole || !jdRole) {
      console.log("Warning: Basic roles missing. Make sure role seed runs first.");
      // return; // Or throw error
    }

    const adminPassword = await bcrypt.hash('admin@123', 10);
    const deptUserPassword = await bcrypt.hash('user@123', 10);
    const investorPassword = await bcrypt.hash('investor@123', 10);

    // Helper to create user if not exists
    const createUser = async (email: string, type: UserType, roleId: number | undefined) => {
      const existing = await prisma.users.findFirst({ where: { email } });
      if (existing) return existing;
      return prisma.users.create({
        data: {
          email,
          password_hash: deptUserPassword, // Default password
          password_algo: 'bcrypt',
          user_type: type,
          is_email_verified: 1,
          role_id: roleId,
        }
      });
    };

    const adminUser = await createUser('admin@example.com', 'DEPARTMENT', adminRole?.id);
    const deptUser = await createUser('user@example.com', 'DEPARTMENT', departmentUserRole?.id);
    const invUser = await prisma.users.findFirst({ where: { email: 'investor@example.com' } }) || await prisma.users.create({
      data: {
        email: 'investor@example.com',
        password_hash: investorPassword,
        password_algo: 'bcrypt',
        user_type: 'INVESTOR',
        is_email_verified: 1,
        role_id: investorRole?.id,
      }
    });

    const jdUser = await createUser('jd@example.com', 'DEPARTMENT', jdRole?.id);
    const nodalUser = await createUser('nodal@example.com', 'DEPARTMENT', nodalRole?.id || 7);
    const inspectorUser = await createUser('inspector@example.com', 'INSPECTOR', departmentUserRole?.id);
    const cisUser = await createUser('cis@example.com', 'CIS_USER', adminRole?.id);
    const deptLabourUser = await createUser('dept.labour@example.com', 'DEPARTMENT', departmentUserRole?.id);
    const deptPcbUser = await createUser('dept.pcb@example.com', 'DEPARTMENT', departmentUserRole?.id);

    // PROFILES
    const upsertDeptProfile = async (user: any, name: string, deptId: number = 1) => {
      const existing = await prisma.department_users.findUnique({ where: { user_id: user.id } });
      if (!existing) {
        await prisma.department_users.create({
          data: {
            user_id: user.id,
            full_name: name,
            email: user.email!,
            dept_id: deptId,
            status: 1,
            np_user_id: String(user.role_id || '0'),
          }
        });
      }
    };

    await upsertDeptProfile(adminUser, 'Admin User', 1);
    await upsertDeptProfile(deptUser, 'Department User', 1);
    await upsertDeptProfile(jdUser, 'Joint Director', 1);
    await upsertDeptProfile(nodalUser, 'Nodal Officer', 1);
    await upsertDeptProfile(inspectorUser, 'Inspector Sharma', 1);
    await upsertDeptProfile(cisUser, 'CIS Admin', 1);
    await upsertDeptProfile(deptLabourUser, 'Labour Official', 1); // 1 is Labour based on cis-inspections.seed.ts DEPARTMENTS
    await upsertDeptProfile(deptPcbUser, 'PCB Official', 2); // 2 is PCB based on cis-inspections.seed.ts DEPARTMENTS

    // Investor Profile
    const invProfile = await prisma.investor_profiles.findUnique({ where: { user_id: invUser.id } });
    if (!invProfile) {
      await prisma.investor_profiles.create({
        data: {
          uid: generateIuid(),
          user_id: invUser.id,
          first_name: 'John',
          last_name: 'Investor',
          country_name: 'India',
          state_name: 'Madhya Pradesh',
          city_name: 'Bhopal',
          district_name: 'Bhopal',
          pin_code: '462001',
          address: 'Some address',
          mobile_number: BigInt('9999999999'),
          pan_card: null,
          adhaar_number: null,
          legal_entity_name: null,
          cons_pan_card: null,
          cons_first_name: null,
          cons_last_name: null,
          cons_mobile_number: null,
          cons_email: null,
          cons_country_name: null,
          cons_state_name: null,
          project_id: null,
        },
      });
    }

    console.log('  ✅ Users seeded successfully');
  } catch (error) {
    console.error('  ❌ user seeding failed:', error);
    throw error;
  }
}
