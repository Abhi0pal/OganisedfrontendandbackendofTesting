import { PrismaClient, ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hashes
const INVESTOR_PASSWORD_HASH = '$2b$10$Ose3z7i0PjQH9glSXYTg3e1xPvTD109KINoM37h6oU0.oJ4Ar/9jS'; // investor@123
const DEPARTMENT_PASSWORD_HASH = '$2b$10$9r/4VeHAZZrjyx88Hy8duuyibI0VahpVd/hkq15bZqPTTJoSdcg06'; // password@123

const TENANT_ID = 5;
const DEPARTMENT_ID = 2;
const SERVICE_ID = '12235.0';

async function main() {
    console.log('==========================================================');
    console.log(` SEEDING: Hospital Registration Workflow for Tenant ${TENANT_ID}`);
    console.log('==========================================================\n');

    // ────────────────────────────────────────────────
    // STEP 1: ROLES
    // ────────────────────────────────────────────────
    console.log('📋 Step 1: Creating roles...');
    const roles = [
        'Institution',
        'Supervisor',
        'Medical Officer of Health (MOH)',
        'Assistant Medical Officer of Health (AMOH)',
    ];

    const roleMap: any = {};

    for (const r of roles) {
        let role = await prisma.roles.findFirst({ where: { name: r } });
        if (!role) {
            role = await prisma.roles.create({
                data: { name: r, tenant_id: TENANT_ID },
            });
            console.log(`  ✅ Created Role: ${r} (id: ${role.id})`);
        } else {
            console.log(`  ⏭️  Role exists: ${r} (id: ${role.id})`);
        }
        roleMap[r] = role.id;
    }

    // Assign all permissions to Institution
    console.log('  Assigning all permissions to Institution role...');
    const allPermissions = await prisma.permission.findMany();
    for (const p of allPermissions) {
        const exists = await prisma.rolePermission.findFirst({
            where: { role_id: roleMap['Institution'], permission_id: p.id }
        });
        if (!exists) {
            await prisma.rolePermission.create({
                data: { role_id: roleMap['Institution'], permission_id: p.id, effect: 'ALLOW' }
            });
        }
    }
    console.log(`  ✅ Assigned ${allPermissions.length} permissions to Institution role`);

    // ────────────────────────────────────────────────
    // STEP 2: USERS
    // ────────────────────────────────────────────────
    console.log('\n👤 Step 2: Creating users...');

    const userDefinitions = [
        { email: 'institution@test.com', fullName: 'Institution User', roleName: 'Investor', type: 'INVESTOR' },
        { email: 'supervisor@test.com', fullName: 'Supervisor User', roleName: 'Supervisor', type: 'DEPARTMENT' },
        { email: 'moh@test.com', fullName: 'MOH User', roleName: 'Medical Officer of Health (MOH)', type: 'DEPARTMENT' },
        { email: 'amoh@test.com', fullName: 'AMOH User', roleName: 'Assistant Medical Officer of Health (AMOH)', type: 'DEPARTMENT' },
    ];

    for (const userDef of userDefinitions) {
        const roleId = roleMap[userDef.roleName];
        const existing = await prisma.users.findFirst({ where: { role_id: roleId, tenant_id: TENANT_ID } });
        if (existing) {
            console.log(`  ⏭️  User for role ${userDef.roleName} exists: ${existing.email}`);
            continue;
        }
        await prisma.users.create({
            data: {
                email: userDef.email,
                password_hash: userDef.type === 'INVESTOR' ? INVESTOR_PASSWORD_HASH : DEPARTMENT_PASSWORD_HASH,
                password_algo: 'bcrypt',
                user_type: userDef.type as any,
                role_id: roleMap[userDef.roleName],
                tenant_id: TENANT_ID,
                is_email_verified: 1,
                department_user: userDef.type === 'DEPARTMENT' ? {
                    create: {
                        full_name: userDef.fullName,
                        email: userDef.email,
                        dept_id: DEPARTMENT_ID,
                        tahsil_id: 0, block_id: 0, office_id: 0, division_id: 0,
                    },
                } : undefined,
            },
        });
        console.log(`  ✅ Created user: ${userDef.email} → ${userDef.roleName}`);
    }

    // ────────────────────────────────────────────────
    // STEP 3: WORKFLOW
    // ────────────────────────────────────────────────
    console.log('\n🔧 Step 3: Creating workflow configuration...');
    const wfCode = 'HOSP_REG_001';

    const deleteResult = await prisma.workflowConfiguration.deleteMany({
        where: {
            OR: [
                { code: wfCode, tenantId: TENANT_ID },
                { serviceId: SERVICE_ID, tenantId: TENANT_ID },
            ],
        },
    });

    if (deleteResult.count > 0) {
        console.log(`  🗑️  Deleted ${deleteResult.count} existing workflow configuration(s)`);
    }

    const nodes = [
        { code: 'P_001', name: 'Submit Application', role: 'Institution', type: 'START', x: 100, y: 100 },
        { code: 'P_002', name: 'Supervisor Review', role: 'Supervisor', type: 'STANDARD', x: 300, y: 100 },
        { code: 'P_003', name: 'MOH Review', role: 'Medical Officer of Health (MOH)', type: 'STANDARD', x: 500, y: 100 },
        { code: 'P_004', name: 'AMOH Inspection', role: 'Assistant Medical Officer of Health (AMOH)', type: 'STANDARD', x: 700, y: 100 },
        { code: 'P_005', name: 'MOH Final Decision', role: 'Medical Officer of Health (MOH)', type: 'STANDARD', x: 900, y: 100 },
        { code: 'P_006', name: 'End', role: 'Institution', type: 'END', x: 1100, y: 100 },
    ];

    const processes: any[] = nodes.map((n, i) => ({
        processCode: n.code,
        stepOrder: i + 1,
        name: n.name,
        nodeType: n.type as ProcessNodeType,
        assigneeType: 'ROLE' as AssigneeType,
        roleId: roleMap[n.role],
        roleName: n.role,
        userId: null,
        formTypeId: n.role === 'Institution' ? 1 : 2,
        slaHours: 24,
        slaBreachAction: 'NONE' as SlaBreach,
        slaBreachPercentage: null,
        canVerifyDocument: false,
        canRevertToApplicant: true,
        positionX: n.x,
        positionY: n.y,
        actions: [],
    }));

    const addAction = (processCode: string, actionCode: string, label: string, transitions: any[], payload?: any) => {
        const p = processes.find(x => x.processCode === processCode);
        if (p) {
            p.actions.push({
                actionCode,
                actionLabel: label,
                requiresComment: actionCode === 'REVERT' || actionCode === 'REJECT',
                requiresDocument: false,
                requiresReason: false,
                displayOrder: p.actions.length,
                transitions,
                payload
            });
        }
    };

    // 🤍 P_001 - Submit
    addAction('P_001', 'FORWARD', 'Submit Application', [{ targetProcessCode: 'P_002', label: 'Submit Request', priority: 0 }]);

    // ✅ Supervisor (Level 1)
    addAction('P_002', 'FORWARD', 'Validate & Generate Challan', [{ targetProcessCode: 'P_003', label: 'Forward', priority: 0 }], { allowPaymentDemand: true });
    addAction('P_002', 'REVERT', 'Return to Applicant', [{ targetProcessCode: 'P_001', label: 'Return', priority: 1 }]);

    // ✅ MOH (Level 2)
    addAction('P_003', 'FORWARD', 'Forward to AMOH', [{ targetProcessCode: 'P_004', label: 'Forward', priority: 0 }]);
    addAction('P_003', 'REVERT', 'Return to Supervisor', [{ targetProcessCode: 'P_002', label: 'Return', priority: 1 }]);

    // ✅ AMOH (Level 3)
    addAction('P_004', 'FORWARD', 'Submit Inspection', [{ targetProcessCode: 'P_005', label: 'Forward', priority: 0 }]);
    addAction('P_004', 'REVERT', 'Return to MOH', [{ targetProcessCode: 'P_003', label: 'Return', priority: 1 }]);

    // ✅ MOH FINAL (Level 4)
    addAction('P_005', 'APPROVE', 'Approve Application', [{ targetProcessCode: 'P_006', label: 'Approve', priority: 0 }]);
    addAction('P_005', 'REJECT', 'Reject Application', [{ targetProcessCode: 'P_006', label: 'Reject', priority: 1 }]);

    const wf = await prisma.workflowConfiguration.create({
        data: {
            tenantId: TENANT_ID,
            departmentId: DEPARTMENT_ID,
            subDepartmentId: null,
            projectId: null,
            moduleId: null,
            serviceId: SERVICE_ID,
            code: wfCode,
            name: 'Hospital Registration Workflow',
            description: '4 Level Approval Workflow for Hospital Registration',
            version: 1,
            status: 'PUBLISHED',
            createdBy: BigInt(1),
            configuration: { processes, fieldPermissions: [] } as any,
        },
    });

    console.log(`  ✅ Workflow Created: ${wf.name} (id: ${wf.id})`);

    console.log('\n==========================================================');
    console.log(' ✅ SEEDING COMPLETE!');
    console.log('==========================================================');
    console.log(' 🔑 Login Credentials:');
    console.log(' ┌──────────────────────┬────────────────────────────────────────────┐');
    console.log(' │ Email                │ Role                                       │');
    console.log(' ├──────────────────────┼────────────────────────────────────────────┤');
    console.log(' │ institution@test.com │ Institution                                │');
    console.log(' │ supervisor@test.com  │ Supervisor                                 │');
    console.log(' │ moh@test.com         │ Medical Officer of Health (MOH)            │');
    console.log(' │ amoh@test.com        │ Assistant Medical Officer of Health (AMOH) │');
    console.log(' └──────────────────────┴────────────────────────────────────────────┘');
    console.log(' Passwords:');
    console.log('   - Institution: investor@123');
    console.log('   - Department: password@123');
    console.log(` Tenant: ${TENANT_ID} | Workflow Code: ${wfCode} | Status: PUBLISHED`);
    console.log('==========================================================');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });