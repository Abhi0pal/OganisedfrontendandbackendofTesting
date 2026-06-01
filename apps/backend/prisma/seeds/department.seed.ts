import { PrismaClient } from '@prisma/client';
import { departmentsData } from './data/departments.data';

interface DepartmentInput {
  name: string;
  uniqueTag: string;
  ip: string;
  secretKey: string;
  baseUrl: string;
  publicKey: string;
  abbreviation: string;
  boDeptId?: string | number | null;
  order?: string | number | null;
  icon?: string | null;
  issuerId?: string | number | null;
  isActive: boolean;
}

export async function seedDepartments(prisma: PrismaClient) {
  try {
    const existingDepartments = await prisma.department.count();

    if (existingDepartments > 0) {
      console.log('  ℹ️  Departments already exist, skipping...');
      return;
    }

    console.log(`  📊 Seeding ${departmentsData.length} departments...`);

    let totalCreated = 0;

    for (const department of departmentsData as DepartmentInput[]) {
      try {
        const boDeptId =
          typeof department.boDeptId === 'string'
            ? department.boDeptId === '' || department.boDeptId === 'NULL'
              ? null
              : parseInt(department.boDeptId)
            : department.boDeptId ?? null;

        if (boDeptId == null) {
          console.warn(
            `  ⚠️  Skipping department "${department.name}" - boDeptId is null/invalid`
          );
          continue;
        }

        const sanitizedDepartment = {
          id: boDeptId, // <- use boDeptId as primary key
          name: department.name,
          uniqueTag: department.uniqueTag,
          ip: department.ip,
          secretKey: department.secretKey,
          baseUrl: department.baseUrl,
          publicKey: department.publicKey,
          abbreviation: department.abbreviation,
          boDeptId: boDeptId, // optional: keep as column if desired
          order:
            typeof department.order === 'string'
              ? department.order === '' || department.order === 'NULL'
                ? null
                : parseInt(department.order)
              : department.order ?? null,
          icon:
            department.icon === '' || department.icon === 'NULL'
              ? null
              : department.icon,
          issuerId:
            typeof department.issuerId === 'string'
              ? department.issuerId === '' || department.issuerId === 'NULL'
                ? null
                : parseInt(department.issuerId)
              : department.issuerId ?? null,
          isActive: department.isActive,
        };

        await prisma.department.create({
          data: sanitizedDepartment,
        });

        totalCreated++;
      } catch (error: any) {
        console.warn(
          `  ⚠️  Skipping department "${department.name}" - ${error.message}`
        );
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} departments successfully`);
  } catch (error: any) {
    console.error('  ❌ Department seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}

