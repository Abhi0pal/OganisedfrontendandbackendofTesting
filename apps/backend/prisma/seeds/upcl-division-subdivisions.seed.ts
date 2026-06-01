import { PrismaClient } from '@prisma/client';
import { upclDivisionSubdivisionsData } from './data/upcl-division-subdivisions.data';

export async function seedUpclDivisionSubdivisions(prisma: PrismaClient) {
  try {
    const result = await prisma.upclDivisionSubdivision.createMany({
      data: upclDivisionSubdivisionsData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} UPCL Division Subdivisions records`);
  } catch (error) {
    console.error('UPCL Division Subdivisions seeding failed:', error);
    throw error;
  }
}
