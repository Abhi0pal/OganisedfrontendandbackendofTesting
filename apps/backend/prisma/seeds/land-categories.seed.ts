import { PrismaClient } from '@prisma/client';
import { landCategoriesData } from './data/land-categories.data';

export async function seedLandCategory(prisma: PrismaClient) {
  try {
    const result = await prisma.landCategories.createMany({
      data: landCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} land category records`);
  } catch (error) {
    console.error('❌ Land Category seeding failed:', error);
    throw error;
  }
}
