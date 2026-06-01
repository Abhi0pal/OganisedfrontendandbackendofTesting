import { PrismaClient } from '@prisma/client';
import { projectStatusData } from './data/project-status.data';

export async function seedProjectStatus(prisma: PrismaClient) {
  try {
    const result = await prisma.projectStatus.createMany({
      data: projectStatusData,
      skipDuplicates: true,
    });

    console.log(`Seeded ${result.count} Project Status records`);
  } catch (error) {
    console.error('Project Status seeding failed:', error);
    throw error;
  }
}
