import { PrismaClient } from '@prisma/client';
import { incentiveTypesData } from './data/incentive-types.data';

export async function seedIncentiveTypes(prisma: PrismaClient) {
  try {
    const result = await prisma.incentiveTypes.createMany({
      data: incentiveTypesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Incentive Types records`);
  } catch (error) {
    console.error('❌ Incentive Types seeding failed:', error);
    throw error;
  }
}
