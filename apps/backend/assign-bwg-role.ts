import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const TENANT_ID = 8;
    const ROLE_ID = 219; // BWG
    const EMAIL = 'bwg_investor@example.com';

    console.log(`==========================================================`);
    console.log(`🚀 ASSIGNING ROLE ID ${ROLE_ID} TO INVESTOR`);
    console.log(`==========================================================\n`);

    // 1. Find User
    const user = await prisma.users.findFirst({
        where: { email: EMAIL, tenant_id: TENANT_ID }
    });

    if (!user) {
        console.error(`❌ User ${EMAIL} not found for Tenant ${TENANT_ID}.`);
        console.log(`   Please ensure you have run the investor seeder first.`);
        return;
    }

    console.log(`👤 Found User: ${EMAIL} (ID: ${user.id})`);

    // 2. Update primary role_id in users table
    await prisma.users.update({
        where: { id: user.id },
        data: { role_id: ROLE_ID }
    });
    console.log(`✅ Updated primary 'role_id' in users table to ${ROLE_ID}.`);

    // 3. Ensure User Role Assignment
    const assignment = await prisma.userRoleAssignment.findFirst({
        where: { 
            user_id: user.id, 
            role_id: ROLE_ID, 
            tenant_id: TENANT_ID 
        }
    });

    if (!assignment) {
        await prisma.userRoleAssignment.create({
            data: {
                user_id: user.id,
                role_id: ROLE_ID,
                tenant_id: TENANT_ID,
                is_active: true
            }
        });
        console.log(`✅ Created record in userRoleAssignment table.`);
    } else {
        await prisma.userRoleAssignment.update({
            where: { id: assignment.id },
            data: { is_active: true }
        });
        console.log(`⏭️  UserRoleAssignment record already exists (Ensured active: true).`);
    }

    console.log('\n🎉 Role assigned successfully!');
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
