import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD_HASH = '$2b$10$ybFOeLK.lQ8DYx/f9wfNa.GtRlyp2NA6JN7gfu8NNQk3zhc9tC7Lq'; // password: password@123
const TENANT_ID = 8;
const DEPARTMENT_ID = 20;
const ROLE_NAME = 'TENANT_ADMIN';
const EMAIL = 'tenant_admin_8@example.com';

async function main() {
    console.log('🚀 Seeding Tenant Admin User...');

    // 1. Create or Get Role
    let role = await prisma.roles.findFirst({
        where: { name: ROLE_NAME, tenant_id: TENANT_ID }
    });

    if (!role) {
        role = await prisma.roles.create({
            data: {
                name: ROLE_NAME,
                tenant_id: TENANT_ID,
                description: 'Administrator for Tenant 8',
                is_active: true
            }
        });
        console.log(`✅ Created Role: ${ROLE_NAME} (ID: ${role.id})`);
    } else {
        console.log(`⏭️ Role exists: ${ROLE_NAME} (ID: ${role.id})`);
    }

    // 2. Create or Update User
    let user = await prisma.users.findFirst({
        where: { email: EMAIL, tenant_id: TENANT_ID }
    });

    if (!user) {
        user = await prisma.users.create({
            data: {
                email: EMAIL,
                password_hash: PASSWORD_HASH,
                password_algo: 'bcrypt',
                user_type: 'DEPARTMENT',
                tenant_id: TENANT_ID,
                department_id: BigInt(DEPARTMENT_ID),
                role_id: role.id,
                is_active: true,
                is_email_verified: 1,
            }
        });
        console.log(`✅ Created User: ${EMAIL} (ID: ${user.id})`);
    } else {
        user = await prisma.users.update({
            where: { id: user.id },
            data: {
                password_hash: PASSWORD_HASH,
                password_algo: 'bcrypt',
                user_type: 'DEPARTMENT',
                tenant_id: TENANT_ID,
                department_id: BigInt(DEPARTMENT_ID),
                role_id: role.id,
                is_active: true
            }
        });
        console.log(`✅ Updated User: ${EMAIL}`);
    }

    // 3. Role Assignment
    const assignment = await prisma.userRoleAssignment.findFirst({
        where: { user_id: user.id, role_id: role.id, tenant_id: TENANT_ID }
    });

    if (!assignment) {
        await prisma.userRoleAssignment.create({
            data: {
                user_id: user.id,
                role_id: role.id,
                tenant_id: TENANT_ID,
                is_active: true
            }
        });
        console.log(`✅ Assigned Role to User.`);
    } else {
        console.log(`⏭️ Role assignment already exists.`);
    }

    console.log('\n🎉 Tenant Admin Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
