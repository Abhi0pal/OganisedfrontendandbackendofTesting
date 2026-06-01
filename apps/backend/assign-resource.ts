
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignResource() {
    const roleId = 5; // Inspector Role
    const resourceCode = 'DEPARTMENT_DASHBOARD';

    const resource = await prisma.resources.findUnique({
        where: { code: resourceCode }
    });

    if (!resource) {
        console.error(`Resource ${resourceCode} not found!`);
        return;
    }

    console.log(`Found resource ${resource.name} (ID: ${resource.id})`);

    const existing = await prisma.roleResource.findFirst({
        where: {
            role_id: roleId,
            resource_id: resource.id
        }
    });

    if (!existing) {
        await prisma.roleResource.create({
            data: {
                role_id: roleId,
                resource_id: resource.id
            }
        });
        console.log(`✓ Assigned ${resourceCode} to Role ID ${roleId}`);
    } else {
        console.log(`✓ Role ID ${roleId} already has ${resourceCode}`);
    }
}

assignResource()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
