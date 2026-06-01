import { PrismaClient } from '@prisma/client';
import { subSectorsData } from './data/sub-sectors.data';

export async function seedSubSector(prisma: PrismaClient) {
  try {
    const result = await prisma.subSectors.createMany({
      data: subSectorsData,
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${result.count} Sub Sector records`);
  } catch (error) {
    console.error('❌ Sub Sector seeding failed:', error);
    throw error;
  }
}
