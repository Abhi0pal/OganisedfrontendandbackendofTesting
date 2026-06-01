import { PrismaClient } from '@prisma/client';
import { mappingRegionCategoriesData } from './data/mapping-region-categories.data';

export async function seedMappingRegionCategories(prisma: PrismaClient) {
  try {
    const result = await prisma.mappingRegionCategories.createMany({
      data: mappingRegionCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Mapping Region Categories records`);
  } catch (error) {
    console.error('❌ Mapping Region Categories seeding failed:', error);
    throw error;
  }
}
