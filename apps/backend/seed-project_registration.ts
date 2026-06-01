import { PrismaClient, YnFlag, WorkflowDefinitionStatus } from '@prisma/client';

const prisma = new PrismaClient();

const PASSWORD_HASH = '$2b$10$ybFOeLK.lQ8DYx/f9wfNa.GtRlyp2NA6JN7gfu8NNQk3zhc9tC7Lq'; // password: password@123

const TENANT_ID = 8;
const DEPARTMENT_ID = 20;
const SERVICE_ID = '12244.0';

async function main() {
    console.log('==========================================================');
    console.log(` SEEDING: ULB Registration Workflow (${SERVICE_ID})`);
    console.log('==========================================================\n');

    // ── Step 1: Create Roles ─────────────────────────────────────
    console.log('📋 Step 1: Creating roles...');

    const roleNames = ['SPCB'];
    const roleMap: Record<string, number> = {};

    for (const name of roleNames) {
        let role = await prisma.roles.findFirst({
            where: { name, tenant_id: TENANT_ID },
        });

        if (!role) {
            role = await prisma.roles.create({
                data: { name, tenant_id: TENANT_ID },
            });
            console.log(`  ✅ Created role: ${name} (id: ${role.id})`);
        } else {
            console.log(`  ⏭️  Role exists: ${name} (id: ${role.id})`);
        }
        roleMap[name] = role.id;
    }

    // ── Step 2: Create Users ─────────────────────────────────────
    console.log('\n👤 Step 2: Creating users...');

    for (const name of roleNames) {
        const email = `${name.toLowerCase().replace(' ', '_')}@example.com`;
        let user = await prisma.users.findFirst({ where: { email, tenant_id: TENANT_ID } });

        if (!user) {
            user = await prisma.users.create({
                data: {
                    email,
                    password_hash: PASSWORD_HASH,
                    password_algo: 'bcrypt',
                    user_type: 'DEPARTMENT',
                    tenant_id: TENANT_ID,
                    department_id: BigInt(DEPARTMENT_ID),
                    is_active: true,
                    is_email_verified: 1,
                },
            });
            console.log(`  ✅ Created user: ${email}`);
        } else {
            console.log(`  ⏭️  User exists: ${email}`);
        }

        // Assign role
        const existingAssignment = await prisma.userRoleAssignment.findFirst({
            where: { user_id: user.id, tenant_id: TENANT_ID, role_id: roleMap[name] }
        });

        if (!existingAssignment) {
            await prisma.userRoleAssignment.create({
                data: { user_id: user.id, tenant_id: TENANT_ID, role_id: roleMap[name], is_active: true }
            });
            console.log(`  🔗 Assigned role ${name} to user ${email}`);
        } else {
            console.log(`  ⏭️  Role assignment exists for ${email}`);
        }
    }

    // ── Step 3: Cleanup Existing Workflows ───────────────────────
    console.log('\n🧹 Step 3: Cleaning existing workflows...');

    const existingWfs = await prisma.workflowDefinition.findMany({
        where: { serviceId: SERVICE_ID },
        select: { id: true, name: true },
    });

    for (const wf of existingWfs) {
        const levels = await prisma.tWorkflowForwardLevel.findMany({
            where: { workflowDefId: wf.id },
            select: { id: true },
        });

        if (levels.length) {
            await prisma.tWorkflowAudit.deleteMany({
                where: { forwardLevelId: { in: levels.map(l => l.id) } },
            });
            await prisma.tWorkflowForwardLevel.deleteMany({
                where: { workflowDefId: wf.id },
            });
        }

        await prisma.workflowDefinition.delete({ where: { id: wf.id } });
        console.log(`  🗑️  Deleted workflow: ${wf.name} (id: ${wf.id})`);
    }

    await prisma.workflowConfiguration.deleteMany({ where: { serviceId: SERVICE_ID } });
    console.log(`  🗑️  Cleaned wf_configurations.`);

    // ── Step 4: Workflow Definition ──────────────────────────────
    console.log('\n🧩 Step 4: Creating workflow definition...');

    const wfDef = await prisma.workflowDefinition.create({
        data: {
            tenantId: TENANT_ID,
            departmentId: DEPARTMENT_ID,
            serviceId: SERVICE_ID,
            code: 'WF_ULB_REGISTRATION',
            name: 'ULB Registration Workflow',
            description: 'Applicant → SPCB',
            version: 1,
            status: WorkflowDefinitionStatus.PUBLISHED,
        },
    });

    // ── Step 5: Nodes ────────────────────────────────────────────
    console.log('\n🧩 Step 5: Creating nodes...');

    const applicant = await prisma.workflowProcess.create({
        data: { workflowDefId: wfDef.id, processCode: 'P_001', stepOrder: 1, name: 'Applicant Submission', nodeType: 'START', assigneeType: 'ROLE', positionX: 100, positionY: 200 }
    });

    const technical = await prisma.workflowProcess.create({
        data: { workflowDefId: wfDef.id, processCode: 'P_002', stepOrder: 2, name: 'SPCB', nodeType: 'STANDARD', assigneeType: 'ROLE', roleId: roleMap['SPCB'], positionX: 400, positionY: 200 }
    });

    const endNode = await prisma.workflowProcess.create({
        data: { workflowDefId: wfDef.id, processCode: 'P_003', stepOrder: 3, name: 'End', nodeType: 'END', assigneeType: 'ROLE', positionX: 1300, positionY: 200 }
    });

    // ── Step 6: Actions ──────────────────────────────────────────
    console.log('\n⚡ Step 6: Creating actions...');

    const submit = await prisma.workflowProcessAction.create({ data: { processId: applicant.id, actionCode: 'FORWARD', actionLabel: 'Submit', displayOrder: 0 } });
    
    const technicalReturn = await prisma.workflowProcessAction.create({ data: { processId: technical.id, actionCode: 'REVERT', actionLabel: 'Return to Applicant', displayOrder: 1 } });
    const approve = await prisma.workflowProcessAction.create({ data: { processId: technical.id, actionCode: 'APPROVE', actionLabel: 'Approve', displayOrder: 0 } });
    const reject = await prisma.workflowProcessAction.create({ data: { processId: technical.id, actionCode: 'REJECT', actionLabel: 'Reject', displayOrder: 1 } });

    // ── Step 7: Transitions ──────────────────────────────────────
    console.log('\n🔗 Step 7: Creating transitions...');

    await prisma.workflowTransition.create({ data: { sourceProcessId: applicant.id, targetProcessId: technical.id, actionId: submit.id, label: 'Submit', priority: 0 } });
    await prisma.workflowTransition.create({ data: { sourceProcessId: technical.id, targetProcessId: technical.id, actionId: technicalReturn.id, label: 'Return', priority: 0 } });
    await prisma.workflowTransition.create({ data: { sourceProcessId: technical.id, targetProcessId: endNode.id, actionId: approve.id, label: 'Approve', priority: 0 } });
    await prisma.workflowTransition.create({ data: { sourceProcessId: technical.id, targetProcessId: endNode.id, actionId: reject.id, label: 'Reject', priority: 0 } });

    // ── Step 8: Configuration JSON ────────────────────────────────
    console.log('\n🏗️  Step 8: Generating configuration JSON...');

    const processData = [
        { proc: applicant, code: 'P_001', role: null, actions: [{ act: submit, target: 'P_002' }] },
        { proc: technical, code: 'P_002', role: roleMap['SPCB'], actions: [{ act: technicalReturn, target: 'P_001' }, { act: approve, target: 'P_003' }, { act: reject, target: 'P_003' }] },
        { proc: endNode, code: 'P_003', role: null, actions: [] },
    ];

    const processesJson = processData.map(p => ({
        name: p.proc.name,
        roleId: p.role || null,
        userId: null,
        actions: p.actions.map(a => ({
            actionCode: a.act.actionCode,
            actionLabel: a.act.actionLabel,
            transitions: [{ label: a.act.actionLabel, priority: 0, conditionJson: null, targetProcessCode: a.target }],
            displayOrder: a.act.displayOrder,
            requiresReason: false, requiresComment: false, requiresDocument: false
        })),
        nodeType: p.proc.nodeType,
        slaHours: 0,
        positionX: p.proc.positionX,
        positionY: p.proc.positionY,
        stepOrder: p.proc.stepOrder,
        formTypeId: p.proc.nodeType === 'STANDARD' ? 2 : null,
        processCode: p.code,
        assigneeType: 'ROLE',
        slaBreachAction: 'NONE',
        forkJoinMetadata: null,
        canVerifyDocument: false,
        canRevertToApplicant: false
    }));

    await prisma.workflowConfiguration.create({
        data: {
            tenantId: TENANT_ID,
            departmentId: DEPARTMENT_ID,
            serviceId: SERVICE_ID,
            code: 'WF_ULB_REGISTRATION',
            name: 'ULB Registration Workflow',
            description: 'Applicant → SPCB',
            version: 1,
            status: WorkflowDefinitionStatus.PUBLISHED,
            configuration: { processes: processesJson, fieldPermissions: [] },
        },
    });

    console.log('\n✅ ULB Registration WORKFLOW SEEDED SUCCESSFULLY');
}

main()
    .catch(e => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });