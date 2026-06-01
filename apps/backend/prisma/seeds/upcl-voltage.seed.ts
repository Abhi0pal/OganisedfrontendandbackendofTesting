import { PrismaClient } from '@prisma/client';
import { upclVoltageData } from './data/upcl-voltage.data';

export async function seedUpclVoltage(prisma: PrismaClient) {
  try {
    const result = await prisma.upclVoltage.createMany({
      data: upclVoltageData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} UPCL Voltage records`);
  } catch (error) {
    console.error('UPCL Voltage seeding failed:', error);
    throw error;
  }
}
