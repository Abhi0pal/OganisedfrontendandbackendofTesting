import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
    const TENANT_ID = 8;
    console.log(`==========================================================`);
    console.log(`🧹 CLEANING DUPLICATE ROLES VIA WF_CONFIGURATIONS`);
    console.log(`==========================================================\n`);

    // 1. Get all active role IDs from workflow configurations
    const wfConfigs = await prisma.workflowConfiguration.findMany({
        where: { tenantId: TENANT_ID }
    });

    const activeRoleIds = new Set<number>();
    wfConfigs.forEach(wf => {
        const config = wf.configuration as any;
        const processes = config.processes || [];
        processes.forEach((p: any) => {
            if (p.roleId) activeRoleIds.add(p.roleId);
        });
    });

    console.log(`✅ Identified ${activeRoleIds.size} unique role IDs in use by workflows: [${Array.from(activeRoleIds).join(', ')}]\n`);

    // 2. Find all roles for the tenant
    const roles = await prisma.roles.findMany({ 
        where: { tenant_id: TENANT_ID },
        orderBy: { id: 'asc' }
    });
    
    // 3. Group by name to find duplicates
    const roleGroups: Record<string, number[]> = {};
    roles.forEach(r => {
        const name = r.name.trim();
        if (!roleGroups[name]) roleGroups[name] = [];
        roleGroups[name].push(r.id);
    });

    let deletedCount = 0;

    for (const [name, ids] of Object.entries(roleGroups)) {
        if (ids.length > 1) {
            console.log(`⚠️ Duplicate detected for role "${name}": IDs [${ids.join(', ')}]`);

            for (const id of ids) {
                const isInWorkflow = activeRoleIds.has(id);
                
                if (!isInWorkflow) {
                    console.log(`   ❌ ID ${id} NOT found in any wf_configurations. Deleting...`);
                    try {
                        await prisma.roles.delete({ where: { id } });
                        console.log(`   ✨ Role ID ${id} deleted successfully.`);
                        deletedCount++;
                    } catch (e) {
                        console.error(`   🛑 Could not delete ID ${id} (it may have foreign key dependencies in other tables): ${e.message}`);
                    }
                } else {
                    console.log(`   ✅ ID ${id} IS referenced in wf_configurations. Keeping it.`);
                }
            }
        }
    }

    console.log(`\n🎉 Cleanup finished. Total duplicates removed: ${deletedCount}`);
}

cleanup()
    .catch(e => console.error('💥 Fatal error:', e))
    .finally(() => prisma.$disconnect());
