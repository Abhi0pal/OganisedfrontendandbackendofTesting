import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating Admin Resources...');

    // 1. Get Resource ID
    const resource = await prisma.resources.findUnique({ where: { code: 'INSPECTOR_DASHBOARD' } });
    if (!resource) {
        console.log('INSPECTOR_DASHBOARD resource not found.');
        return;
    }
    const inspectorDashId = resource.id;

    // 2. Find Admin Role
    const adminRole = await prisma.roles.findFirst({ where: { name: 'admin' } });

    if (!adminRole) {
        console.error('Admin role not found!');
        return;
    }

    // 3. Assign
    await prisma.roleResource.upsert({
        where: {
            role_id_resource_id: {
                role_id: adminRole.id,
                resource_id: inspectorDashId,
            },
        },
        update: {},
        create: {
            role_id: adminRole.id,
            resource_id: inspectorDashId,
        },
    });

    console.log('Assigned INSPECTOR_DASHBOARD to Admin role.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
