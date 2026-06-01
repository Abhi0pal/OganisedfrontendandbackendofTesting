import { PrismaClient } from '@prisma/client';
import { upclSupplyCategoriesData } from './data/upcl-supply-categories.data';

export async function seedUpclSupplyCategories(prisma: PrismaClient) {
  try {
    const result = await prisma.upclSupplyCategories.createMany({
      data: upclSupplyCategoriesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} UPCL Supply Categories records`);
  } catch (error) {
    console.error('❌ UPCL Supply Categories seeding failed:', error);
    throw error;
  }
}
