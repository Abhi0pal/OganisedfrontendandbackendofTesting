
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRole() {
    const email = 'raj.sharma@inspector.mp.gov.in';

    let inspectorRole = await prisma.roles.findFirst({
        where: { name: 'Inspector' }
    });

    if (!inspectorRole) {
        console.log('⚠️ Inspector role not found. Creating it...');
        inspectorRole = await prisma.roles.create({
            data: {
                id: 5,
                name: 'Inspector'
            }
        });
        console.log(`✓ Created Inspector Role: ${inspectorRole.name} (ID: ${inspectorRole.id})`);
    } else {
        console.log(`✓ Found Inspector Role: ${inspectorRole.name} (ID: ${inspectorRole.id})`);
    }

    // 2. Find the User
    const user = await prisma.users.findFirst({
        where: { email }
    });

    if (!user) {
        console.error(`❌ User ${email} not found!`);
        return;
    }

    console.log(`✓ Found User: ${user.email} (Current Role ID: ${user.role_id})`);

    // 3. Update User Role
    if (user.role_id !== inspectorRole.id) {
        await prisma.users.update({
            where: { id: user.id },
            data: { role_id: inspectorRole.id }
        });
        console.log(`✓ Updated user role to Inspector (ID: ${inspectorRole.id})`);
    } else {
        console.log('✓ User already has Inspector role.');
    }

    // 4. Ensure Inspector Role has INSPECTOR_DASHBOARD resource
    const resource = await prisma.resources.findFirst({
        where: { code: 'INSPECTOR_DASHBOARD' }
    });

    if (resource) {
        const hasPermission = await prisma.roleResource.findFirst({
            where: {
                role_id: inspectorRole.id,
                resource_id: resource.id
            }
        });

        if (!hasPermission) {
            await prisma.roleResource.create({
                data: {
                    role_id: inspectorRole.id,
                    resource_id: resource.id
                }
            });
            console.log('✓ Assigned INSPECTOR_DASHBOARD permission to Inspector role.');
        } else {
            console.log('✓ Inspector role already has INSPECTOR_DASHBOARD permission.');
        }
    } else {
        console.error('❌ INSPECTOR_DASHBOARD resource not found!');
    }
}

fixRole()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
