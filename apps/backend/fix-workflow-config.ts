import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Workflow Configuration ---');

  // 1. Find the active workflow configuration for 969.0
  const wfConfig = await prisma.workflowConfiguration.findFirst({
    where: { serviceId: '969.0', status: 'PUBLISHED' },
    orderBy: { version: 'desc' }
  });

  if (!wfConfig) {
    console.error('No published workflow configuration found for service 969.0');
    return;
  }

  console.log(`Found workflow configuration: ${wfConfig.name} (id: ${wfConfig.id})`);

  // 2. Update formTypeId in the JSON configuration
  const configJson = wfConfig.configuration as any;
  if (configJson && Array.isArray(configJson.processes)) {
    let updated = false;
    for (const process of configJson.processes) {
      if (process.roleName !== 'Investor' && process.formTypeId === 1) {
        process.formTypeId = 2;
        updated = true;
      }
    }
    
    if (updated) {
      await prisma.workflowConfiguration.update({
        where: { id: wfConfig.id },
        data: { configuration: configJson }
      });
      console.log('Successfully updated formTypeId to 2 in the configuration JSON.');
    } else {
      console.log('No processes with formTypeId 1 found in configuration to update.');
    }
  }

  // 3. Link the broken application task to this configId
  const appId = 10213;
  const forwardLevel = await prisma.tWorkflowForwardLevel.findFirst({
    where: { applicationId: BigInt(appId), status: 'ACTIVE' }
  });

  if (forwardLevel) {
    await prisma.tWorkflowForwardLevel.update({
      where: { id: forwardLevel.id },
      data: { configId: wfConfig.id }
    });
    console.log(`Successfully linked application ${appId} (task id: ${forwardLevel.id}) to configId ${wfConfig.id}.`);
  } else {
    console.log(`No active workflow task found for application ${appId}.`);
  }

  console.log('--- Done ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
