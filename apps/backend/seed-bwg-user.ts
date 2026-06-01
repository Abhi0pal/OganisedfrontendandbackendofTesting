import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD_HASH = '$2b$10$puBCmsnTad0PYY7VVWotheV5J8mHuoG.3w1O0ftpStAqB3lxpuatK'; // investor@123
const TENANT_ID = 8;
const PROJECT_ID = 10;
const ROLE_NAME = 'BWG (Bulk Waste Generator)';
const EMAIL = 'bwg_investor@example.com';

async function main() {
    console.log('🚀 Seeding BWG Investor User...');

    // 1. Get Role ID
    const role = await prisma.roles.findFirst({
        where: { name: ROLE_NAME, tenant_id: TENANT_ID }
    });

    if (!role) {
        console.error(`❌ Role "${ROLE_NAME}" not found for tenant ${TENANT_ID}`);
        process.exit(1);
    }

    console.log(`✅ Found Role: ${ROLE_NAME} (ID: ${role.id})`);

    // 2. Create or Update User
    let user = await prisma.users.findFirst({
        where: { email: EMAIL }
    });

    if (!user) {
        user = await prisma.users.create({
            data: {
                email: EMAIL,
                password_hash: PASSWORD_HASH,
                password_algo: 'bcrypt',
                user_type: 'INVESTOR',
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
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
                user_type: 'INVESTOR',
                tenant_id: TENANT_ID,
                project_id: PROJECT_ID,
                role_id: role.id,
                is_active: true
            }
        });
        console.log(`✅ Updated User: ${EMAIL}`);
    }

    // 3. Create or Update Investor Profile
    const profileUid = `BWG_${user.id}`;
    let profile = await prisma.investor_profiles.findUnique({
        where: { user_id: user.id }
    });

    if (!profile) {
        profile = await prisma.investor_profiles.create({
            data: {
                uid: profileUid,
                user_id: user.id,
                first_name: 'BWG',
                last_name: 'Investor',
                mobile_number: BigInt('9999999999'),
                country_name: 'India',
                state_name: 'Telangana',
                city_name: 'Hyderabad',
                district_name: 'Hyderabad',
                pin_code: '500001',
                address: 'Main Street, Hyderabad',
            }
        });
        console.log(`✅ Created Investor Profile: ${profileUid}`);
    } else {
        console.log(`⏭️ Investor Profile already exists.`);
    }

    // 4. Role Assignment
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

    console.log('\n🎉 BWG Investor Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
