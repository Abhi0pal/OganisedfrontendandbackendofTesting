import { PrismaClient } from '@prisma/client';
import { labourFactoryTypeMasterData } from './data/labour-factory-type-master.data';

export async function seedLabourFactoryTypeMaster(prisma: PrismaClient) {
  try {
    const result = await prisma.labourFactoryTypeMaster.createMany({
      data: labourFactoryTypeMasterData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Labour Factory Type Master records`);
  } catch (error) {
    console.error('Labour Factory Type Master seeding failed:', error);
    throw error;
  }
}
