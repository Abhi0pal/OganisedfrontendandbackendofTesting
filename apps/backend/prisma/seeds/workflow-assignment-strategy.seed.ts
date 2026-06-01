import { PrismaClient } from '@prisma/client';
import { workflowAssignmentStrategiesData } from './data/workflow-assignment-strategies.data';

export async function seedWorkflowAssignmentStrategies(prisma: PrismaClient) {
  try {
    for (const item of workflowAssignmentStrategiesData) {
      await prisma.workflowAssignmentStrategyMaster.upsert({
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
    console.log(`  seeded ${workflowAssignmentStrategiesData.length} workflow assignment strategies`);
  } catch (error) {
    console.error('  workflow assignment strategies seeding failed:', error);
    throw error;
  }
}

