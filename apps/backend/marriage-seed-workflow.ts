import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hash (same as other dev users)
const PASSWORD_HASH = '$2b$10$jDGAlAO1.K2xBD3CTLRE7uFffWc49Dn6mybMc/rWBDoPS3arGHze2';

const TENANT_ID = 5;
const DEPARTMENT_ID = 2; // matches m_service.department_id for service 12222.0
const SERVICE_ID = '968.0';

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: 3-Step Workflow for Tenant ${TENANT_ID}`);
  console.log('==========================================================\n');

  // ── Step 1: Create Roles ─────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');

  const roleDefinitions = [
    { name: 'Divisional-Verifier' },
    { name: 'Divisional-Approver' },
  ];

  const roleMap: Record<string, number> = {};

  for (const roleDef of roleDefinitions) {
    let role = await prisma.roles.findFirst({ where: { name: roleDef.name, tenant_id: TENANT_ID } });
    if (!role) {
      role = await prisma.roles.create({
        data: { name: roleDef.name, tenant_id: TENANT_ID },
      });
      console.log(`  ✅ Created role: ${roleDef.name} (id: ${role.id})`);
    } else {
      console.log(`  ⏭️  Role exists: ${roleDef.name} (id: ${role.id})`);
    }
    roleMap[roleDef.name] = role.id;
  }

  // ── Step 2: Create Users ─────────────────────────────────────
  console.log('\n👤 Step 2: Creating users...');

  const userDefinitions = [
    { email: 'divisional.verifier@test.com', fullName: 'Divisional Verifier User', roleName: 'Divisional-Verifier' },
    { email: 'divisional.approver@test.com', fullName: 'Divisional Approver User', roleName: 'Divisional-Approver' },
  ];

  for (const userDef of userDefinitions) {
    const existing = await prisma.users.findFirst({ where: { email: userDef.email } });
    if (existing) {
      console.log(`  ⏭️  User exists: ${userDef.email}`);
      continue;
    }
    await prisma.users.create({
      data: {
        email: userDef.email,
        password_hash: PASSWORD_HASH,
        password_algo: 'bcrypt',
        user_type: 'DEPARTMENT',
        role_id: roleMap[userDef.roleName],
        tenant_id: TENANT_ID,
        is_email_verified: 1,
        department_user: {
          create: {
            full_name: userDef.fullName,
            email: userDef.email,
            dept_id: DEPARTMENT_ID,
            tahsil_id: 0, block_id: 0, office_id: 0, division_id: 0,
          },
        },
      },
    });
    console.log(`  ✅ Created user: ${userDef.email} → ${userDef.roleName}`);
  }

  // ── Step 3: Create Workflow ──────────────────────────────────
  console.log('\n🔧 Step 3: Creating workflow...');
  // Delete ALL existing workflows for this service (and their runtime data)
  const existingWfs = await prisma.workflowDefinition.findMany({
    where: { serviceId: SERVICE_ID },
    select: { id: true, name: true, status: true },
  });

  if (existingWfs.length > 0) {
    for (const wf of existingWfs) {
      // Delete runtime audit logs first
      const fwdLevels = await prisma.tWorkflowForwardLevel.findMany({
        where: { workflowDefId: wf.id },
        select: { id: true },
      });
      if (fwdLevels.length > 0) {
        const fwdIds = fwdLevels.map(f => f.id);
        await prisma.tWorkflowAudit.deleteMany({ where: { forwardLevelId: { in: fwdIds } } });
        await prisma.tWorkflowForwardLevel.deleteMany({ where: { workflowDefId: wf.id } });
        console.log(`  🗑️  Deleted ${fwdLevels.length} runtime instance(s) for workflow ${wf.id}`);
      }
      // Now delete the definition (cascades to processes, actions, transitions)
      await prisma.workflowDefinition.delete({ where: { id: wf.id } });
      console.log(`  🗑️  Deleted: "${wf.name}" (id: ${wf.id}, status: ${wf.status})`);
    }
  } else {
    console.log('  ℹ️  No existing workflows found for this service');
  }

  const wfDef = await prisma.workflowDefinition.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      serviceId: SERVICE_ID,
      code: 'WF_MR_CITIZEN_CLERK_OFFICER',
      name: ' Marriage Registration Workflow',
      description: 'Citizen submits → Division Clerk reviews → Division Officer approves/rejects',
      version: 1,
      status: 'PUBLISHED',
    },
  });
  console.log(`  ✅ Created: ${wfDef.name} (id: ${wfDef.id})`);

  // ── Step 4: Nodes ────────────────────────────────────────────
  console.log('\n🧩 Step 4: Creating nodes...');

  const citizenNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_001', stepOrder: 1,
      name: 'Citizen Submit', nodeType: 'START', assigneeType: 'ROLE',
      positionX: 100, positionY: 200,
    },
  });
  console.log('  ✅ #1 Citizen Submit (START)');

  const verifierNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_002', stepOrder: 2,
      name: 'Divisional Verifier', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Divisional-Verifier'],
      formTypeId: 1,
      positionX: 450, positionY: 200,
    },
  });
  console.log(`  ✅ #2 Divisional Verifier → Role: Divisional-Verifier (id: ${roleMap['Divisional-Verifier']})`);

  const approverNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_003', stepOrder: 3,
      name: 'Divisional Approver', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Divisional-Approver'],
      formTypeId: 1,
      positionX: 800, positionY: 200,
    },
  });
  console.log(`  ✅ #3 Divisional Approver → Role: Divisional-Approver (id: ${roleMap['Divisional-Approver']})`);

  const endNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_004', stepOrder: 4,
      name: 'End', nodeType: 'END', assigneeType: 'ROLE',
      positionX: 1150, positionY: 200,
    },
  });
  console.log('  ✅ #4 End (END)');

  // ── Step 5: Actions ──────────────────────────────────────────
  console.log('\n⚡ Step 5: Creating actions...');

  // Citizen: Submit
  const citizenSubmit = await prisma.workflowProcessAction.create({
    data: { processId: citizenNode.id, actionCode: 'FORWARD', actionLabel: 'Submit Application', displayOrder: 0 },
  });

  // Verifier: Forward, Revert
  const verifierForward = await prisma.workflowProcessAction.create({
    data: { processId: verifierNode.id, actionCode: 'FORWARD', actionLabel: 'Forward to Divisional Approver', displayOrder: 0 },
  });
  const verifierRevert = await prisma.workflowProcessAction.create({
    data: { processId: verifierNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Citizen', displayOrder: 1 },
  });

  // Approver: Approve, Reject, Revert
  const approverApprove = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'APPROVE', actionLabel: 'Approve', displayOrder: 0 },
  });
  const approverReject = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'REJECT', actionLabel: 'Reject', displayOrder: 1 },
  });
  const approverRevert = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Verifier', displayOrder: 2 },
  });

  console.log('  ✅ Citizen: Submit Application');
  console.log('  ✅ Verifier: Forward to Divisional Approver, Revert to Citizen');
  console.log('  ✅ Approver: Approve, Reject, Revert to Verifier');

  // ── Step 6: Transitions ──────────────────────────────────────
  console.log('\n🔗 Step 6: Creating transitions...');

  // Citizen Submit → Verifier
  await prisma.workflowTransition.create({
    data: { sourceProcessId: citizenNode.id, targetProcessId: verifierNode.id, actionId: citizenSubmit.id, label: 'Submit', priority: 0 },
  });
  console.log('  ✅ Citizen → [Submit] → Divisional Verifier');

  // Verifier Forward → Approver
  await prisma.workflowTransition.create({
    data: { sourceProcessId: verifierNode.id, targetProcessId: approverNode.id, actionId: verifierForward.id, label: 'Forward', priority: 0 },
  });
  console.log('  ✅ Verifier → [Forward] → Divisional Approver');

  // Verifier Revert → Citizen
  await prisma.workflowTransition.create({
    data: { sourceProcessId: verifierNode.id, targetProcessId: citizenNode.id, actionId: verifierRevert.id, label: 'Revert', priority: 0 },
  });
  console.log('  ✅ Verifier → [Revert] → Citizen (resubmit)');

  // Approver Approve → End
  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: endNode.id, actionId: approverApprove.id, label: 'Approve', priority: 0 },
  });
  console.log('  ✅ Approver → [Approve] → End ✓');

  // Approver Reject → End
  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: endNode.id, actionId: approverReject.id, label: 'Reject', priority: 0 },
  });
  console.log('  ✅ Approver → [Reject] → End ✗');

  // Approver Revert → Verifier
  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: verifierNode.id, actionId: approverRevert.id, label: 'Revert', priority: 0 },
  });
  console.log('  ✅ Approver → [Revert] → Divisional Verifier');

  printSummary();
}

function printSummary() {
  console.log('\n==========================================================');
  console.log(' ✅ SEEDING COMPLETE!');
  console.log('==========================================================');
  console.log('');
  console.log(' Workflow:');
  console.log(' ┌──────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐');
  console.log(' │  Citizen Submit  │────►│ Divisional Verifier │────►│ Divisional Approver │───► END');
  console.log(' │     (START)      │◄────│   Forward/Revert    │◄────│ Approve/Reject/     │');
  console.log(' └──────────────────┘     └─────────────────────┘     │ Revert to Verifier  │');
  console.log('                                                      └─────────────────────┘');
  console.log('');
  console.log(' 🔑 Login Credentials:');
  console.log(' ┌──────────────────────────────┬─────────────────────┐');
  console.log(' │ Email                        │ Role                │');
  console.log(' ├──────────────────────────────┼─────────────────────┤');
  console.log(' │ divisional.verifier@test.com │ Divisional-Verifier │');
  console.log(' │ divisional.approver@test.com │ Divisional-Approver │');
  console.log(' └──────────────────────────────┴─────────────────────┘');
  console.log(' Password: same as your other dev users');
  console.log(` Tenant: ${TENANT_ID} | Service: ${SERVICE_ID} | Status: PUBLISHED`);
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
