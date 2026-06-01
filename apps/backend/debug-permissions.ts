
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
    const email = 'raj.sharma@inspector.mp.gov.in';
    const user = await prisma.users.findFirst({
        where: { email },
        include: { role: true }
    });

    if (!user) {
        console.log(`User ${email} not found`);
        return;
    }

    console.log('User found:', user.email);
    if (!user.role_id) {
        console.log('User has no role assigned.');
        return;
    }

    console.log('Role:', user.role?.name, '(ID:', user.role_id, ')');

    // Check resources for this role
    // @ts-ignore
    const permissions = await prisma.roleResource.findMany({
        where: { role_id: user.role_id },
        include: { resource: true }
    });

    console.log('Permissions:');
    // @ts-ignore
    permissions.forEach(p => console.log(` - ${p.resource?.code}`));

    // Check if INSPECTOR_DASHBOARD is present
    // @ts-ignore
    const hasPermission = permissions.some(p => p.resource?.code === 'INSPECTOR_DASHBOARD');
    console.log('Has INSPECTOR_DASHBOARD permission:', hasPermission);
}

checkPermissions()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
