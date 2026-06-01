import { PrismaClient } from '@prisma/client';
import { sectorsData } from './data/sectors.data';

export async function seedSector(prisma: PrismaClient) {
  try {
    const result = await prisma.sectors.createMany({
      data: sectorsData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Sector records`);
  } catch (error) {
    console.error('❌ Sector seeding failed:', error);
    throw error;
  }
}
