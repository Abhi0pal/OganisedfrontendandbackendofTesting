import { PrismaClient } from '@prisma/client';
import { serviceTypesData } from './data/servicetypes.data';

export async function seedServicetypes(prisma: PrismaClient) {
    try {
    console.log('Seeding Form Types...');

    for (const item of serviceTypesData) {
      // Check if this formtype already exists by name
      const exists = await prisma.servicetype.findFirst({
        where: { name: item.service_type.trim() },
      });

      if (!exists) {
        await prisma.servicetype.create({
          data: {
            name: item.service_type.trim(),
            isActive: item.is_active === 'Y',
            createdAt: item.created ?? undefined,
            updatedAt: item.modified ?? undefined,
          },
        });

        console.log(`✔️ Inserted: ${item.service_type}`);
      } else {
        console.log(`⏭️ Skipped (already exists): ${item.service_type}`);
      }
    }

    console.log('Service Types seeding completed.');
  } catch (error) {
    console.error('Error seeding Service Types:', error);
  }
}    