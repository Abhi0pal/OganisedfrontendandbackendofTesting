import { PrismaClient } from '@prisma/client';
import { landAllotmentStageData } from './data/land-allotment-stage.data';

export async function seedLandAllotmentStage(prisma: PrismaClient) {
  try {
    const result = await prisma.landAllotmentStage.createMany({
      data: landAllotmentStageData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Land Allotment Stage records`);
  } catch (error) {
    console.error('Land Allotment Stage seeding failed:', error);
    throw error;
  }
}
