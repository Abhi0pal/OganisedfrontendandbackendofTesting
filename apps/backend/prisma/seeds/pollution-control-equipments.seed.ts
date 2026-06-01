import { PrismaClient } from '@prisma/client';
import { pollutionControlEquipmentsData } from './data/pollution-control-equipments.data';

export async function seedPollutionControlEquipments(prisma: PrismaClient) {
  try {
    const result = await prisma.pollutionControlEquipment.createMany({
      data: pollutionControlEquipmentsData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Pollution Control Equipment records`);
  } catch (error) {
    console.error('Pollution Control Equipment seeding failed:', error);
    throw error;
  }
}
