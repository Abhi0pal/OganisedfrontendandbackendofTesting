import { PrismaClient } from '@prisma/client';
import { workflowJurisdictionLevelsData } from './data/workflow-jurisdiction-levels.data';

export async function seedWorkflowJurisdictionLevels(prisma: PrismaClient) {
  try {
    for (const item of workflowJurisdictionLevelsData) {
      await prisma.workflowJurisdictionLevelMaster.upsert({
        where: { id: item.id },
        update: {
          code: item.code,
          name: item.name,
          description: item.description,
          isActive: item.isActive,
        },
        create: {
          id: item.id,
          code: item.code,
          name: item.name,
          description: item.description,
          isActive: item.isActive,
        },
      });
    }
    console.log(`  seeded ${workflowJurisdictionLevelsData.length} workflow jurisdiction levels`);
  } catch (error) {
    console.error('  workflow jurisdiction levels seeding failed:', error);
    throw error;
  }
}

