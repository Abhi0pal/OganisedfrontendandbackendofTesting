import { PrismaClient } from '@prisma/client';
import { unitTypesData } from './data/unit-types.data';

export async function seedUnitTypes(prisma: PrismaClient) {
  try {
    const result = await prisma.unitTypes.createMany({
      data: unitTypesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Unit Types records`);
  } catch (error) {
    console.error('❌ Unit Types seeding failed:', error);
    throw error;
  }
}
