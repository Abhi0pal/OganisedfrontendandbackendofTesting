import { PrismaClient } from '@prisma/client';
import { regionCategoriesData } from './data/region-categories.data';

export async function seedRegionCategories(prisma: PrismaClient) {
  try {
    const result = await prisma.regionCategories.createMany({
      data: regionCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Region Categories records`);
  } catch (error) {
    console.error('❌ Region Categories seeding failed:', error);
    throw error;
  }
}
