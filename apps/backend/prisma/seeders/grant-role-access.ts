import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roleId = 213;
  const resourceCode = 'INVESTOR_DEPARTMENTAL_SERVICES_APPLY';

  console.log(`🚀 Granting access for role ${roleId} to resource ${resourceCode}...`);

  // 1. Fetch the resource
  const resource = await prisma.resources.findUnique({
    where: { code: resourceCode }
  });

  if (!resource) {
    console.error(`❌ Resource with code "${resourceCode}" not found.`);
    return;
  }

  console.log(`✅ Found resource: ${resource.name} (ID: ${resource.id})`);

  // 2. Grant access (upsert into role_resources)
  try {
    await prisma.roleResource.upsert({
      where: {
        role_id_resource_id: {
          role_id: roleId,
          resource_id: resource.id,
        },
      },
      update: {}, // Nothing to update if it already exists
      create: {
        role_id: roleId,
        resource_id: resource.id,
      },
    });
    console.log(`✅ Access granted successfully for role ${roleId}.`);
  } catch (error) {
    console.error(`❌ Error granting access:`, error.message);
  }

  console.log('🎉 Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
