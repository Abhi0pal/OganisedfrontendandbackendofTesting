import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD_RAW = 'password123';
const TENANT_ID = 6;
const DEPARTMENT_ID = 16;

async function main() {
    console.log('==========================================================');
    console.log(` SEEDING: RERA Officer Users (Tenant: ${TENANT_ID})`);
    console.log('==========================================================\n');

    const PASSWORD_HASH = await bcrypt.hash(PASSWORD_RAW, 10);
    console.log(`🔑 Generated fresh hash for ${PASSWORD_RAW}`);

    const userMappings = [
        { email: 'joint_director@rera.com', roleId: 244, name: 'Joint Director' },
        { email: 'technical_officer@rera.com', roleId: 229, name: 'Technical Officer' },
        { email: 'legal_officer@rera.com', roleId: 214, name: 'Legal Officer' },
        { email: 'finance_officer@rera.com', roleId: 245, name: 'Finance Officer' },
        { email: 'authority@rera.com', roleId: 233, name: 'Authority' },
    ];

    for (const mapping of userMappings) {
        console.log(`👤 Processing: ${mapping.name} (${mapping.email})`);

        // 1. Ensure User exists
        let user = await prisma.users.findFirst({
            where: { email: mapping.email, tenant_id: TENANT_ID }
        });

        if (!user) {
            user = await prisma.users.create({
                data: {
                    email: mapping.email,
                    password_hash: PASSWORD_HASH,
                    password_algo: 'argon2',
                    user_type: 'DEPARTMENT',
                    is_email_verified: 1,
                    tenant_id: TENANT_ID,
                    department_id: BigInt(DEPARTMENT_ID),
                    is_active: true,
                }
            });
            console.log(`  ✅ Created user record.`);
        } else {
            // Update existing user to ensure they are verified and active
            user = await prisma.users.update({
                where: { id: user.id },
                data: {
                    password_hash: PASSWORD_HASH,
                    password_algo: 'argon2',
                    user_type: 'DEPARTMENT',
                    is_email_verified: 1,
                    is_active: true,
                    deleted_at: null // Ensure not deleted
                }
            });
            console.log(`  🔄 Updated existing user record.`);
        }

        // 2. Ensure Role Assignment exists
        const existingAssignment = await prisma.userRoleAssignment.findFirst({
            where: { user_id: user.id, tenant_id: TENANT_ID, role_id: mapping.roleId }
        });

        if (!existingAssignment) {
            await prisma.userRoleAssignment.create({
                data: {
                    user_id: user.id,
                    tenant_id: TENANT_ID,
                    role_id: mapping.roleId,
                    is_active: true
                }
            });
            console.log(`  🔗 Role (ID: ${mapping.roleId}) assigned.`);
        } else {
            console.log(`  ⏭️  Role assignment already exists.`);
        }
        console.log('');
    }

    console.log('✅ ALL USERS PROVISIONED SUCCESSFULLY');
}

main()
    .catch(e => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
