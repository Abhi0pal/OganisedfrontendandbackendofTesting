import { PrismaClient } from '@prisma/client';
import { workflowActionsData } from './data/workflow-actions.data';

export async function seedWorkflowActions(prisma: PrismaClient) {
  try {
    for (const item of workflowActionsData) {
      // Guard against sparse legacy data rows (e.g., accidental double commas in data file).
      if (!item) {
        continue;
      }
      await prisma.workflowActionMaster.upsert({
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
    console.log(`  seeded ${workflowActionsData.length} workflow actions`);
  } catch (error) {
    console.error('  workflow action seeding failed:', error);
    throw error;
  }
}

