import { PrismaClient } from '@prisma/client';
import { policyData } from './data/policy.data';

export async function seedPolicies(prisma: PrismaClient) {
  try {
    console.log(`  📊 Seeding ${policyData.length} policies...`);

    let totalCreated = 0;

    for (const policy of policyData) {
      try {
        // Check if department exists
        const department = await prisma.department.findUnique({
          where: { id: policy.department_id },
        });

        if (!department) {
          console.warn(
            `  ⚠️  Skipping policy "${policy.policy_name}" - department_id ${policy.department_id} not found`
          );
          continue;
        }

        // Prevent duplicate seeding using policy_code
        const existingPolicy = await prisma.policy_master.findUnique({
          where: { policy_code: policy.policy_code },
        });

        if (existingPolicy) {
          console.log(
            `  ℹ️  Policy "${policy.policy_name}" already exists, skipping...`
          );
          continue;
        }

        await prisma.policy_master.create({
          data: {
            department_id: policy.department_id,
            policy_name: policy.policy_name,
            policy_code: policy.policy_code,
            description: policy.description,
            valid_from: policy.valid_from,
            valid_to: policy.valid_to,
            is_active: policy.is_active,
          },
        });

        totalCreated++;
      } catch (error: any) {
        console.warn(
          `  ⚠️  Skipping policy "${policy.policy_name}" - ${error.message}`
        );
      }
    }

    console.log(`  ✅ Seeded ${totalCreated} policies successfully`);
  } catch (error: any) {
    console.error('  ❌ Policy seeding failed:', error.message);
    if (error.meta) {
      console.error('  📍 Meta info:', error.meta);
    }
    throw error;
  }
}
