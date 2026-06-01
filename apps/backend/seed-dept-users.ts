import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEPT_ID = 20; // Tenant 8's established department ID

const USERS_TO_SEED = [
    { id: 783, email: 'cpcb@example.com', name: 'CPCB Officer' },
    { id: 746, email: 'ulb@example.com', name: 'ULB Officer' },
    { id: 775, email: 'spcb@example.com', name: 'SPCB Officer' }
];

async function main() {
    console.log('==========================================================');
    console.log('🚀 SEEDING: Department Users');
    console.log('==========================================================\n');

    for (const data of USERS_TO_SEED) {
        console.log(`👤 Processing ${data.email} (ID: ${data.id})...`);

        // Check if user exists in the primary 'users' table first
        const userExists = await prisma.users.findUnique({
            where: { id: BigInt(data.id) }
        });

        if (!userExists) {
            console.error(`  ❌ User ID ${data.id} not found in 'users' table. Skipping.`);
            continue;
        }

        // Upsert into department_users
        const deptUser = await prisma.department_users.upsert({
            where: { user_id: BigInt(data.id) },
            update: {
                full_name: data.name,
                email: data.email,
                dept_id: DEPT_ID,
                status: 1
            },
            create: {
                user_id: BigInt(data.id),
                full_name: data.name,
                email: data.email,
                dept_id: DEPT_ID,
                status: 1
            }
        });

        console.log(`  ✅ ${deptUser.id ? 'Synced' : 'Created'} department user record.`);
    }

    console.log('\n🎉 Department User Seeding Complete!');
}

main()
    .catch(e => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
