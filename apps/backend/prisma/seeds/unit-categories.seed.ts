import { PrismaClient } from '@prisma/client';
import { unitCategoriesData } from './data/unit-categories.data';

export async function seedUnitCategories(prisma: PrismaClient) {
  try {
    const result = await prisma.unitCategories.createMany({
      data: unitCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Unit Categories records`);
  } catch (error) {
    console.error('❌ Unit Categories seeding failed:', error);
    throw error;
  }
}
