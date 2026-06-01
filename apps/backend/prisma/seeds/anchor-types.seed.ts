import { PrismaClient } from '@prisma/client';
import { anchorTypesData } from './data/anchor-types.data';

export async function seedAnchorTypes(prisma: PrismaClient) {
  try {
    const result = await prisma.anchorTypes.createMany({
      data: anchorTypesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Anchor Types records`);
  } catch (error) {
    console.error('❌ Anchor Types seeding failed:', error);
    throw error;
  }
}
