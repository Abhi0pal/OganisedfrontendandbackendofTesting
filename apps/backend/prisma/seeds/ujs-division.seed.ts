import { PrismaClient } from '@prisma/client';
import { ujsDivisionData } from './data/ujs-division.data';

export async function seedUjsDivision(prisma: PrismaClient) {
  try {
    const result = await prisma.ujsDivision.createMany({
      data: ujsDivisionData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} UJS Division records`);
  } catch (error) {
    console.error('UJS Division seeding failed:', error);
    throw error;
  }
}
