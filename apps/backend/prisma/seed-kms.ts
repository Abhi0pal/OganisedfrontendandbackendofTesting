import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hash (same as other dev users)
const PASSWORD_HASH = '$2b$10$jDGAlAO1.K2xBD3CTLRE7uFffWc49Dn6mybMc/rWBDoPS3arGHze2';

const TENANT_ID = 8;
const DEPARTMENT_ID = 412886; //field operations department
const SERVICE_ID = '12222.0';

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Aarogyasri KMS Workflow for Tenant ${TENANT_ID}`);
  console.log('==========================================================\n');

  // ── Step 1: Create Roles ─────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');

  const roleDefinitions = [
    { name: 'Content-Admin' },
    { name: 'Content-Approver' },
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
    { email: 'content.admin@aarogyasri.com', fullName: 'Content Creator - Admin', roleName: 'Content-Admin' },
    { email: 'content.approver@aarogyasri.com', fullName: 'Content Approver - Super Admin', roleName: 'Content-Approver' },
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
  
  const existingWfs = await prisma.workflowDefinition.findMany({
    where: { serviceId: SERVICE_ID },
    select: { id: true, name: true, status: true },
  });

  if (existingWfs.length > 0) {
    for (const wf of existingWfs) {
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
      code: `WF_${SERVICE_ID.replace('.', '_')}_CONTENT_UPLOAD_APPROVAL`,
      name: 'Aarogyasri Content Upload → Approval Workflow',
      description: 'Admin uploads content → Content Approver reviews, approves/rejects, or deactivates',
      version: 1,
      status: 'PUBLISHED',
    },
  });
  console.log(`  ✅ Created: ${wfDef.name} (id: ${wfDef.id})`);

  // ── Step 4: Nodes ────────────────────────────────────────────
  console.log('\n🧩 Step 4: Creating nodes...');

  const adminNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, 
      processCode: 'P_001', 
      stepOrder: 1,
      name: 'Admin Content Upload', 
      nodeType: 'START', 
      assigneeType: 'ROLE',
      roleId: roleMap['Content-Admin'],
      formTypeId: 1,
      positionX: 100, 
      positionY: 200,
    },
  });
  console.log(`  ✅ #1 Admin Content Upload (START) → Role: Content-Admin (id: ${roleMap['Content-Admin']})`);

  const approverNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, 
      processCode: 'P_002', 
      stepOrder: 2,
      name: 'Content Approver Review', 
      nodeType: 'STANDARD', 
      assigneeType: 'ROLE',
      roleId: roleMap['Content-Approver'],
      formTypeId: 2,
      positionX: 450, 
      positionY: 200,
    },
  });
  console.log(`  ✅ #2 Content Approver Review → Role: Content-Approver (id: ${roleMap['Content-Approver']})`);

  const endNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, 
      processCode: 'P_003', 
      stepOrder: 3,
      name: 'End', 
      nodeType: 'END', 
      assigneeType: 'ROLE',
      positionX: 800, 
      positionY: 200,
    },
  });
  console.log('  ✅ #3 End (END)');

  // ── Step 5: Actions ──────────────────────────────────────────
  console.log('\n⚡ Step 5: Creating actions...');

  // Admin: Submit
  const adminSubmit = await prisma.workflowProcessAction.create({
    data: { 
      processId: adminNode.id, 
      actionCode: 'FORWARD', 
      actionLabel: 'Submit for Approval', 
      displayOrder: 0 
    },
  });

  // Approver: Approve, Reject, Deactivate
  const approverApprove = await prisma.workflowProcessAction.create({
    data: { 
      processId: approverNode.id, 
      actionCode: 'APPROVE', 
      actionLabel: 'Approve Content', 
      displayOrder: 0 
    },
  });
  const approverReject = await prisma.workflowProcessAction.create({
    data: { 
      processId: approverNode.id, 
      actionCode: 'REJECT', 
      actionLabel: 'Reject Content', 
      displayOrder: 1 
    },
  });
  const approverDeactivate = await prisma.workflowProcessAction.create({
    data: { 
      processId: approverNode.id, 
      actionCode: 'DEACTIVATE', 
      actionLabel: 'Deactivate Content', 
      displayOrder: 2 
    },
  });
  const approverRevert = await prisma.workflowProcessAction.create({
    data: { 
      processId: approverNode.id, 
      actionCode: 'REVERT', 
      actionLabel: 'Revert to Admin', 
      displayOrder: 3 
    },
  });

  console.log('  ✅ Admin: Submit for Approval');
  console.log('  ✅ Approver: Approve Content, Reject Content, Deactivate Content, Revert to Admin');

  // ── Step 6: Transitions ──────────────────────────────────────
  console.log('\n🔗 Step 6: Creating transitions...');

  // Admin Submit → Approver
  await prisma.workflowTransition.create({
    data: { 
      sourceProcessId: adminNode.id, 
      targetProcessId: approverNode.id, 
      actionId: adminSubmit.id, 
      label: 'Submit', 
      priority: 0 
    },
  });
  console.log('  ✅ Admin → [Submit for Approval] → Content Approver');

  // Approver Approve → End
  await prisma.workflowTransition.create({
    data: { 
      sourceProcessId: approverNode.id, 
      targetProcessId: endNode.id, 
      actionId: approverApprove.id, 
      label: 'Approve', 
      priority: 0 
    },
  });
  console.log('  ✅ Approver → [Approve] → End ✓');

  // Approver Reject → End
  await prisma.workflowTransition.create({
    data: { 
      sourceProcessId: approverNode.id, 
      targetProcessId: endNode.id, 
      actionId: approverReject.id, 
      label: 'Reject', 
      priority: 0 
    },
  });
  console.log('  ✅ Approver → [Reject] → End ✗');

  // Approver Deactivate → End
  await prisma.workflowTransition.create({
    data: { 
      sourceProcessId: approverNode.id, 
      targetProcessId: endNode.id, 
      actionId: approverDeactivate.id, 
      label: 'Deactivate', 
      priority: 0 
    },
  });
  console.log('  ✅ Approver → [Deactivate] → End (soft deactivation)');

  // Approver Revert → Admin
  await prisma.workflowTransition.create({
    data: { 
      sourceProcessId: approverNode.id, 
      targetProcessId: adminNode.id, 
      actionId: approverRevert.id, 
      label: 'Revert', 
      priority: 0 
    },
  });
  console.log('  ✅ Approver → [Revert] → Admin (for modifications)');

  printSummary();
}

function printSummary() {
  console.log('\n==========================================================');
  console.log(' ✅ SEEDING COMPLETE!');
  console.log('==========================================================');
  console.log('');
  console.log(' Workflow:');
  console.log(' ┌──────────────────────┐     ┌──────────────────────────────┐');
  console.log(' │ Admin Content Upload │────►│ Content Approver Review      │───► END');
  console.log(' │      (START)         │◄────│ Approve/Reject/Deactivate/  │');
  console.log(' └──────────────────────┘     │ Revert to Admin             │');
  console.log('                              └──────────────────────────────┘');
  console.log('');
  console.log(' 🔑 Login Credentials:');
  console.log(' ┌──────────────────────────────┬──────────────────┐');
  console.log(' │ Email                        │ Role             │');
  console.log(' ├──────────────────────────────┼──────────────────┤');
  console.log(' │ content.admin@aarogyasri.com │ Content-Admin    │');
  console.log(' │content.approver@aarogyasri.com│ Content-Approver│');
  console.log(' └──────────────────────────────┴──────────────────┘');
  console.log(' Password: same as your other dev users');
  console.log(`\n Tenant: ${TENANT_ID} | Service ID: ${SERVICE_ID}`);
  console.log(' Status: PUBLISHED');
  console.log(' Forms: Page 1 (formTypeId: 1) - Content Upload');
  console.log('        Page 2 (formTypeId: 2) - Content Approval');
  console.log('');
  console.log(' Master Tables to Configure:');
  console.log(' 1. Content Category Master (Knowledge, Training, Compliance, Material, Assessments)');
  console.log(' 2. Language Master (English, Hindi, Telugu)');
  console.log(' 3. Role Master (Admin, Admin Approver, Mithra, Medco, DC, DM)');
  console.log(' 4. Action Status Master (Submitted, Approved, Rejected, Inactive, Expired)');
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