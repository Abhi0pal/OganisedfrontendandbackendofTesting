import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = 5;

async function main() {
  console.log(`🧹 Cleaning up unused roles for Tenant ${TENANT_ID}...`);

  // 1. Get all roles for the tenant
  const allRoles = await prisma.roles.findMany({
    where: { tenant_id: TENANT_ID }
  });
  const allRoleIds = allRoles.map(r => r.id);
  console.log(`   Found ${allRoles.length} total roles for the tenant.`);

  // 2. Get role IDs used in Workflow Configurations
  const workflowConfigs = await prisma.workflowConfiguration.findMany({
    where: { tenantId: TENANT_ID }
  });

  const usedRoleIdsInWorkflows = new Set<number>();
  for (const config of workflowConfigs) {
    const configuration = config.configuration as any;
    if (configuration && Array.isArray(configuration.processes)) {
      for (const process of configuration.processes) {
        if (process.roleId) {
          usedRoleIdsInWorkflows.add(Number(process.roleId));
        }
      }
    }
  }
  console.log(`   Found ${usedRoleIdsInWorkflows.size} unique role IDs used in workflow definitions.`);

  // 3. Get role IDs used by Users
  const users = await prisma.users.findMany({
    where: { tenant_id: TENANT_ID }
  });
  const usedRoleIdsInUsers = new Set(users.map(u => u.role_id).filter(id => id !== null) as number[]);
  console.log(`   Found ${usedRoleIdsInUsers.size} unique role IDs assigned to users.`);

  // 4. Identify roles to keep (used in workflows OR used by users OR is System Administrator)
  const rolesToKeep = new Set([...usedRoleIdsInWorkflows, ...usedRoleIdsInUsers]);
  
  // Also keep "System Administrator" or "TENANT_ADMIN" roles just in case
  const protectedRoleNames = ['System Administrator', 'TENANT_ADMIN', 'Investor'];
  const protectedRoles = allRoles.filter(r => protectedRoleNames.includes(r.name));
  protectedRoles.forEach(r => rolesToKeep.add(r.id));

  // 5. Identify roles to delete
  const rolesToDelete = allRoles.filter(r => !rolesToKeep.has(r.id));

  if (rolesToDelete.length === 0) {
    console.log('   ✅ No unused roles found.');
    return;
  }

  console.log(`   Found ${rolesToDelete.length} unused roles to delete:`);
  rolesToDelete.forEach(r => console.log(`     - [${r.id}] ${r.name}`));

  // 6. Delete roles
  // Note: We might encounter foreign key issues if they are used elsewhere not covered above.
  for (const role of rolesToDelete) {
    try {
      await prisma.roles.delete({ where: { id: role.id } });
      console.log(`   ✅ Deleted role: ${role.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete role ${role.name}:`, (error as any).message);
    }
  }

  console.log('\n✨ Cleanup complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
