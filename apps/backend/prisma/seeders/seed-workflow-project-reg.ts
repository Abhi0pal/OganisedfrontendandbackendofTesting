import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hash (same as other dev users)
const PASSWORD_HASH = '$2b$10$jDGAlAO1.K2xBD3CTLRE7uFffWc49Dn6mybMc/rWBDoPS3arGHze2';

const TENANT_ID = 6;
const DEPARTMENT_ID = 16;

/**
 * Configuration for services to seed. 
 * Add or modify this list to seed workflows for different services with custom names/codes.
 */
const SERVICES_CONFIG = [
  {
    id: '12262.0',
    name: 'Project Registration Workflow',
    code: 'WF_PROJECT_REGISTRATION'
  },
];

async function createWorkflowForService(config: typeof SERVICES_CONFIG[0], roleMap: Record<string, number>) {
  const serviceId = config.id;
  const workflowName = config.name;
  const workflowCode = `${config.code}_${serviceId.replace('.', '_')}`;

  console.log(`\n🔧 Creating workflow for Service: ${serviceId}...`);

  // Idempotency: Delete existing workflow for this service
  const existingWf = await prisma.workflowDefinition.findFirst({
    where: { serviceId: serviceId },
  });

  if (existingWf) {
    console.log(`  🗑️  Deleting existing workflow for ${serviceId} (ID: ${existingWf.id})`);
    const fwdLevels = await prisma.tWorkflowForwardLevel.findMany({
      where: { workflowDefId: existingWf.id },
      select: { id: true },
    });
    if (fwdLevels.length > 0) {
      const fwdIds = fwdLevels.map(f => f.id);
      await prisma.tWorkflowAudit.deleteMany({ where: { forwardLevelId: { in: fwdIds } } });
      await prisma.tWorkflowForwardLevel.deleteMany({ where: { workflowDefId: existingWf.id } });
    }
    await prisma.workflowDefinition.delete({ where: { id: existingWf.id } });
  }

  const wfDef = await prisma.workflowDefinition.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      serviceId: serviceId,
      code: workflowCode, // Dynamic code based on mapping + ID
      name: workflowName, // Dynamic name from mapping
      description: `Workflow for ${workflowName} (Service ${serviceId})`,
      version: 1,
      status: 'PUBLISHED',
    },
  });
  console.log(`  ✅ Created WorkflowDefinition: ${wfDef.name} (id: ${wfDef.id}, code: ${wfDef.code})`);

  // ── Nodes ────────────────────────────────────────────
  const promoterNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_PROMOTER', stepOrder: 1,
      name: 'Promoter Submit', nodeType: 'START', assigneeType: 'ROLE',
      roleId: roleMap['Promoter'], formTypeId: 1,
      positionX: 100, positionY: 200,
    },
  });

  const technicalNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_TECHNICAL', stepOrder: 2,
      name: 'Technical Officer', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Technical-Officer'], formTypeId: 2,
      positionX: 400, positionY: 200,
    },
  });

  const legalNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_LEGAL', stepOrder: 3,
      name: 'Legal Officer', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Legal-Officer'], formTypeId: 2,
      positionX: 700, positionY: 200,
    },
  });

  const financeNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_FINANCE', stepOrder: 4,
      name: 'Finance Officer', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Finance-Officer'], formTypeId: 2,
      positionX: 1000, positionY: 200,
    },
  });

  const approverNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_APPROVER', stepOrder: 5,
      name: 'Approving Authority', nodeType: 'STANDARD', assigneeType: 'ROLE',
      roleId: roleMap['Approving-Authority'], formTypeId: 2,
      positionX: 1300, positionY: 200,
    },
  });

  const endNode = await prisma.workflowProcess.create({
    data: {
      workflowDefId: wfDef.id, processCode: 'P_END', stepOrder: 6,
      name: 'Project Registered', nodeType: 'END', assigneeType: 'ROLE',
      positionX: 1600, positionY: 200,
    },
  });
  console.log('  ✅ Nodes created.');

  // ── Actions ──────────────────────────────────────────
  const actionPromoterSubmit = await prisma.workflowProcessAction.create({
    data: { processId: promoterNode.id, actionCode: 'FORWARD', actionLabel: 'Submit Application', displayOrder: 1 },
  });

  const actionTechnicalForward = await prisma.workflowProcessAction.create({
    data: { processId: technicalNode.id, actionCode: 'FORWARD', actionLabel: 'Forward to Legal Officer', displayOrder: 1 },
  });
  const actionTechnicalRevert = await prisma.workflowProcessAction.create({
    data: { processId: technicalNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Promoter', displayOrder: 2 },
  });

  const actionLegalForward = await prisma.workflowProcessAction.create({
    data: { processId: legalNode.id, actionCode: 'FORWARD', actionLabel: 'Forward to Finance Officer', displayOrder: 1 },
  });
  const actionLegalRevert = await prisma.workflowProcessAction.create({
    data: { processId: legalNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Technical Officer', displayOrder: 2 },
  });

  const actionFinanceForward = await prisma.workflowProcessAction.create({
    data: { processId: financeNode.id, actionCode: 'FORWARD', actionLabel: 'Forward to Approving Authority', displayOrder: 1 },
  });
  const actionFinanceRevert = await prisma.workflowProcessAction.create({
    data: { processId: financeNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Legal Officer', displayOrder: 2 },
  });

  const actionApproverApprove = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'APPROVE', actionLabel: 'Approve Project', displayOrder: 1 },
  });
  const actionApproverRevert = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'REVERT', actionLabel: 'Revert to Finance Officer', displayOrder: 2 },
  });
  const actionApproverRevertToPromoter = await prisma.workflowProcessAction.create({
    data: { processId: approverNode.id, actionCode: 'REVERT_TO_PROMOTER', actionLabel: 'Revert to Promoter', displayOrder: 3 },
  });
  console.log('  ✅ Actions created.');

  // ── Transitions ──────────────────────────────────────
  await prisma.workflowTransition.create({
    data: { sourceProcessId: promoterNode.id, targetProcessId: technicalNode.id, actionId: actionPromoterSubmit.id, label: 'Submit', priority: 0 },
  });

  await prisma.workflowTransition.create({
    data: { sourceProcessId: technicalNode.id, targetProcessId: legalNode.id, actionId: actionTechnicalForward.id, label: 'Forward', priority: 0 },
  });
  await prisma.workflowTransition.create({
    data: { sourceProcessId: technicalNode.id, targetProcessId: promoterNode.id, actionId: actionTechnicalRevert.id, label: 'Revert', priority: 0 },
  });

  await prisma.workflowTransition.create({
    data: { sourceProcessId: legalNode.id, targetProcessId: financeNode.id, actionId: actionLegalForward.id, label: 'Forward', priority: 0 },
  });
  await prisma.workflowTransition.create({
    data: { sourceProcessId: legalNode.id, targetProcessId: technicalNode.id, actionId: actionLegalRevert.id, label: 'Revert', priority: 0 },
  });

  await prisma.workflowTransition.create({
    data: { sourceProcessId: financeNode.id, targetProcessId: approverNode.id, actionId: actionFinanceForward.id, label: 'Forward', priority: 0 },
  });
  await prisma.workflowTransition.create({
    data: { sourceProcessId: financeNode.id, targetProcessId: legalNode.id, actionId: actionFinanceRevert.id, label: 'Revert', priority: 0 },
  });

  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: endNode.id, actionId: actionApproverApprove.id, label: 'Approve', priority: 0 },
  });
  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: financeNode.id, actionId: actionApproverRevert.id, label: 'Revert', priority: 0 },
  });
  await prisma.workflowTransition.create({
    data: { sourceProcessId: approverNode.id, targetProcessId: promoterNode.id, actionId: actionApproverRevertToPromoter.id, label: 'Revert to Promoter', priority: 0 },
  });
  console.log('  ✅ Transitions linked.');
}

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Project Registration Workflows (Dynamic Mapping)`);
  console.log('==========================================================\n');

  // ── Step 1: Create Roles ─────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');
  const roleDefinitions = [
    { name: 'Promoter' },
    { name: 'Technical-Officer' },
    { name: 'Legal-Officer' },
    { name: 'Finance-Officer' },
    { name: 'Approving-Authority' },
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
    { email: 'promoter.reg@test.com', fullName: 'Promoter User', roleName: 'Promoter', userType: 'INVESTOR' as const },
    { email: 'technical.officer@test.com', fullName: 'Technical Officer', roleName: 'Technical-Officer', userType: 'DEPARTMENT' as const },
    { email: 'legal.officer@test.com', fullName: 'Legal Officer', roleName: 'Legal-Officer', userType: 'DEPARTMENT' as const },
    { email: 'finance.officer@test.com', fullName: 'Finance Officer', roleName: 'Finance-Officer', userType: 'DEPARTMENT' as const },
    { email: 'approving.authority@test.com', fullName: 'Approving Authority', roleName: 'Approving-Authority', userType: 'DEPARTMENT' as const },
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
        user_type: userDef.userType,
        role_id: roleMap[userDef.roleName],
        tenant_id: TENANT_ID,
        is_email_verified: 1,
        department_user: userDef.userType === 'DEPARTMENT' ? {
          create: {
            full_name: userDef.fullName,
            email: userDef.email,
            dept_id: DEPARTMENT_ID,
            tahsil_id: 0, block_id: 0, office_id: 0, division_id: 0,
          },
        } : undefined,
        investor_profile: userDef.userType === 'INVESTOR' ? {
          create: {
            uid: crypto.randomUUID(),
            first_name: userDef.fullName,
            last_name: 'Investor',
            country_name: 'India',
            state_name: 'Odisha',
            city_name: 'Bhubaneswar',
            district_name: 'Khordha',
            pin_code: '751024',
            address: 'Test Address',
            mobile_number: 9999999999n,
          }
        } : undefined,
      },
    });
    console.log(`  ✅ Created user: ${userDef.email} → ${userDef.roleName} (${userDef.userType})`);
  }

  // ── Step 3: Seed Workflows ──────────────────────────────────
  for (const config of SERVICES_CONFIG) {
    await createWorkflowForService(config, roleMap);
  }

  console.log('\n==========================================================');
  console.log(' 🎉 ALL SEEDING COMPLETE!');
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
