import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const TENANT_ID = 8;
    const USER_EMAIL = 'spcb@example.com';

    console.log(`\n--- Debugging User: ${USER_EMAIL} ---`);
    const user = await prisma.users.findFirst({ where: { email: USER_EMAIL, tenant_id: TENANT_ID } });
    
    if (!user) {
        console.log('❌ User not found.');
        return;
    }
    console.log(`✅ User ID: ${user.id}`);

    console.log('\n--- Current Role Assignments for this User ---');
    const assignments = await prisma.userRoleAssignment.findMany({
        where: { user_id: user.id },
        include: { role: true }
    });

    if (assignments.length === 0) {
        console.log('❌ No role assignments found.');
    } else {
        assignments.forEach(a => {
            console.log(`🔹 Role: ${a.role.name} (ID: ${a.role_id}) | Active: ${a.is_active}`);
        });
    }

    console.log('\n--- Roles existing for Tenant 8 ---');
    const roles = await prisma.roles.findMany({ where: { tenant_id: TENANT_ID } });
    roles.forEach(r => {
        console.log(`📍 ${r.name} (ID: ${r.id})`);
    });
}

debug().finally(() => prisma.$disconnect());
