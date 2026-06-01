import { PrismaClient } from '@prisma/client';
import { currentLanduseData } from './data/current-landuse.data';

export async function seedCurrentLanduse(prisma: PrismaClient) {
  try {
    const result = await prisma.currentLanduse.createMany({
      data: currentLanduseData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Current Landuse records`);
  } catch (error) {
    console.error('Current Landuse seeding failed:', error);
    throw error;
  }
}
