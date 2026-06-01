import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const SERVICE_ID = '12256.0';
    const TENANT_ID = 8;

    console.log(`\n--- Checking Workflow Definition for ${SERVICE_ID} ---`);
    const wf = await prisma.workflowDefinition.findFirst({
        where: { serviceId: SERVICE_ID, tenantId: TENANT_ID },
        include: { processes: true }
    });

    if (!wf) {
        console.log('❌ Workflow Definition not found.');
    } else {
        console.log(`✅ Workflow: ${wf.name} (ID: ${wf.id})`);
        wf.processes.forEach(p => {
            if (p.roleId) {
                console.log(`   📍 Node: ${p.name} | Role ID: ${p.roleId}`);
            }
        });
    }

    console.log(`\n--- Checking Workflow Configuration for ${SERVICE_ID} ---`);
    const config = await prisma.workflowConfiguration.findFirst({
        where: { serviceId: SERVICE_ID, tenantId: TENANT_ID }
    });

    if (!config) {
        console.log('❌ Workflow Configuration not found.');
    } else {
        const processes = (config.configuration as any).processes || [];
        processes.forEach((p: any) => {
            if (p.roleId) {
                console.log(`   📍 Config Node: ${p.name} | Role ID: ${p.roleId}`);
            }
        });
    }
}

check().finally(() => prisma.$disconnect());
