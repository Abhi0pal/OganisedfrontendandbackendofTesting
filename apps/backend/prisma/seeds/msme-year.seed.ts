import { PrismaClient } from '@prisma/client';
import { msmeYearData } from './data/msme-year.data';

export async function seedMsmeYear(prisma: PrismaClient) {
  try {
    const result = await prisma.msmeYear.createMany({
      data: msmeYearData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} MSME Year records`);
  } catch (error) {
    console.error('❌ MSME Year seeding failed:', error);
    throw error;
  }
}
