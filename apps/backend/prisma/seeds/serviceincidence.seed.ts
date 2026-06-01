import { PrismaClient } from '@prisma/client';
import { serviceIncidencesData } from './data/serviceincidences.data';

export async function seedServiceincidences(prisma: PrismaClient) {
    try {
    console.log('Seeding Service Incidences...');

    for (const item of serviceIncidencesData) {
      // Check if this formtype already exists by name
      const exists = await prisma.serviceincidence.findFirst({
        where: { name: item.service_incidence.trim() },
      });

      if (!exists) {
        await prisma.serviceincidence.create({
          data: {
            name: item.service_incidence.trim(),
            isActive: item.is_active === 'Y',
            createdAt: item.created ?? undefined,
            updatedAt: item.modified ?? undefined,
          },
        });

        console.log(`✔️ Inserted: ${item.service_incidence}`);
      } else {
        console.log(`⏭️ Skipped (already exists): ${item.service_incidence}`);
      }
    }

    console.log('Service Incidence seeding completed.');
  } catch (error) {
    console.error('Error seeding Service Incidences:', error);
  }
}    