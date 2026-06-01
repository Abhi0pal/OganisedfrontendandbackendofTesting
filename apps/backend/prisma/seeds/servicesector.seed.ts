import { PrismaClient } from '@prisma/client';
import { serviceSectorsData } from './data/servicesectors.data';

export async function seedServicesectors(prisma: PrismaClient) {
    try {
    console.log('Seeding Service Sectors...');

    for (const item of serviceSectorsData) {
      // Check if this formtype already exists by name
      const exists = await prisma.servicesector.findFirst({
        where: { name: item.service_sector.trim() },
      });

      if (!exists) {
        await prisma.servicesector.create({
          data: {
            name: item.service_sector.trim(),
            isActive: item.is_active === 'Y',
            createdAt: item.created ?? undefined,
            updatedAt: item.modified ?? undefined,
          },
        });

        console.log(`✔️ Inserted: ${item.service_sector}`);
      } else {
        console.log(`⏭️ Skipped (already exists): ${item.service_sector}`);
      }
    }

    console.log('Service Types seeding completed.');
  } catch (error) {
    console.error('Error seeding Service Sectors:', error);
  }
}    