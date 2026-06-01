import { PrismaClient } from '@prisma/client';
import { occurrencesData } from './data/occurrences.data';

export async function seedOccurrences(prisma: PrismaClient) {
  try {
    const result = await prisma.occurrences.createMany({
      data: occurrencesData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Occurrences records`);
  } catch (error) {
    console.error('❌ Occurrences seeding failed:', error);
    throw error;
  }
}
