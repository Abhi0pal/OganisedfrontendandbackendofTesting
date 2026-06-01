import { PrismaClient } from '@prisma/client';
import { pollutionCategoriesData } from './data/pollution-categories.data';

export async function seedPollutionCategories(prisma: PrismaClient) {
  try {
    const result = await prisma.pollutionCategory.createMany({
      data: pollutionCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} pollution category records`);
  } catch (error) {
    console.error('❌ Pollution category seeding failed:', error);
    throw error;
  }
}
