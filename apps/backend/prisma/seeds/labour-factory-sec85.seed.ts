import { PrismaClient } from '@prisma/client';
import { labourFactorySec85Data } from './data/labour-factory-sec85.data';

export async function seedLabourFactorySec85(prisma: PrismaClient) {
  try {
    const result = await prisma.labourFactorySec85.createMany({
      data: labourFactorySec85Data,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Labour Factory Sec85 records`);
  } catch (error) {
    console.error('Labour Factory Sec85 seeding failed:', error);
    throw error;
  }
}
