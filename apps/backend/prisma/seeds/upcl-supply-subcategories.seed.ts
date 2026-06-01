import { PrismaClient } from '@prisma/client';
import { upclSupplySubcategoriesData } from './data/upcl-supply-subcategories.data';

export async function seedUpclSupplySubcategories(prisma: PrismaClient) {
  try {
    const result = await prisma.upclSupplySubcategories.createMany({
      data: upclSupplySubcategoriesData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} UPCL Supply Subcategories records`);
  } catch (error) {
    console.error('UPCL Supply Subcategories seeding failed:', error);
    throw error;
  }
}
