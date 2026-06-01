import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const TENANT_ID = 8;
const DEPARTMENT_ID = 20;
const SERVICE_ID = process.argv[2] || '12245.0'; // Take from command line or default to BWG
const PASSWORD_HASH = '$2b$10$ybFOeLK.lQ8DYx/f9wfNa.GtRlyp2NA6JN7gfu8NNQk3zhc9tC7Lq'; // password: password@123

async function main() {
    console.log('==========================================================');
    console.log(`🔍 SYNCING ROLES FOR SERVICE: ${SERVICE_ID}`);
    console.log('==========================================================\n');

    // 1. Fetch Workflow Configuration
    const wfConfig = await prisma.workflowConfiguration.findFirst({
        where: {
            tenantId: TENANT_ID,
            departmentId: DEPARTMENT_ID,
            serviceId: SERVICE_ID
        }
    });

    if (!wfConfig) {
        console.error(`❌ No workflow configuration found for Service ${SERVICE_ID}, Tenant ${TENANT_ID}, Dept ${DEPARTMENT_ID}`);
        return;
    }

    const config = wfConfig.configuration as any;
    const processes = config.processes || [];
    
    // 2. Extract unique Role IDs from processes
    const roleIds = Array.from(new Set(
        processes
            .map((p: any) => p.roleId)
            .filter((id: any) => id !== null && id !== undefined)
    )) as number[];

    if (roleIds.length === 0) {
        console.log('ℹ️ No roles found in the workflow configuration.');
        return;
    }

    console.log(`✅ Found ${roleIds.length} unique roles in workflow processes.`);

    // 3. Process each Role
    for (const roleId of roleIds) {
        const role = await prisma.roles.findUnique({ where: { id: roleId } });
        if (!role) {
            console.error(`⚠️ Role ID ${roleId} not found in database.`);
            continue;
        }

        const roleName = role.name;
        const email = `${roleName.toLowerCase().replace(/\s+/g, '_')}@example.com`;
        
        console.log(`\n🔹 Role: ${roleName} (ID: ${roleId})`);
        console.log(`   Target User: ${email}`);

        // 4. Ensure User Exists
        let user = await prisma.users.findFirst({
            where: { email, tenant_id: TENANT_ID }
        });

        if (!user) {
            user = await prisma.users.create({
                data: {
                    email,
                    password_hash: PASSWORD_HASH,
                    password_algo: 'bcrypt',
                    user_type: 'DEPARTMENT',
                    tenant_id: TENANT_ID,
                    department_id: BigInt(DEPARTMENT_ID),
                    role_id: role.id, // Set primary role
                    is_active: true,
                    is_email_verified: 1
                }
            });
            console.log(`   ✨ Created new user: ${email}`);
        } else {
            console.log(`   ⏭️  User already exists.`);
            // Update role_id if it's missing or different
            if (user.role_id !== role.id) {
                await prisma.users.update({
                    where: { id: user.id },
                    data: { role_id: role.id }
                });
                console.log(`   🔄 Updated user's primary role_id to ${role.id}`);
            }
        }

        // 5. Ensure Role Assignment
        const assignment = await prisma.userRoleAssignment.findFirst({
            where: {
                user_id: user.id,
                role_id: role.id,
                tenant_id: TENANT_ID
            }
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
            console.log(`   🔗 Role assigned successfully.`);
        } else {
            console.log(`   ⏭️  Role already assigned to this user.`);
        }
    }

    console.log('\n✅ Workflow role synchronization complete!');
}

main()
    .catch(e => {
        console.error('❌ Error during execution:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
