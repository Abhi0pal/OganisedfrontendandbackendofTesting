import { PrismaClient, ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hashes
const INVESTOR_PASSWORD_HASH = '$2b$10$Ose3z7i0PjQH9glSXYTg3e1xPvTD109KINoM37h6oU0.oJ4Ar/9jS'; // investor@123
const DEPARTMENT_PASSWORD_HASH = '$2b$10$9r/4VeHAZZrjyx88Hy8duuyibI0VahpVd/hkq15bZqPTTJoSdcg06'; // password@123

const TENANT_ID = 5;
const DEPARTMENT_ID = 2; // matches m_service.department_id
const SERVICE_ID = '12223.0'; // Tree Trimming

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Tree Trimming Workflow for Tenant ${TENANT_ID}`);
  console.log('==========================================================\n');

  // ── Step 1: Create Roles ─────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');

  const roleDefinitions = [
    { name: 'Investor' },
    { name: 'Garden-Inspector' },
    { name: 'Tree-Officer' },
    { name: 'Garden-Superintendent' },
    { name: 'Additional-Commissioner' },
    { name: 'Commissioner' },
  ];

  const roleMap: Record<string, number> = {};

  for (const roleDef of roleDefinitions) {
    let role = await prisma.roles.findFirst({ where: { name: roleDef.name } });
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

  // Assign all permissions to Investor
  console.log('  Assigning all permissions to Investor role...');
  const allPermissions = await prisma.permission.findMany();
  for (const p of allPermissions) {
    const exists = await prisma.rolePermission.findFirst({
      where: { role_id: roleMap['Investor'], permission_id: p.id }
    });
    if (!exists) {
      await prisma.rolePermission.create({
        data: { role_id: roleMap['Investor'], permission_id: p.id, effect: 'ALLOW' }
      });
    }
  }
  console.log(`  ✅ Assigned ${allPermissions.length} permissions to Investor role`);

  // ── Step 2: Create Users ─────────────────────────────────────
  console.log('\n👤 Step 2: Creating users...');

  const userDefinitions = [
    { email: 'investor@test.com', fullName: 'Investor User', roleName: 'Investor', type: 'INVESTOR' },
    { email: 'garden.inspector@test.com', fullName: 'Garden Inspector User', roleName: 'Garden-Inspector', type: 'DEPARTMENT' },
    { email: 'tree.officer@test.com', fullName: 'Tree Officer User', roleName: 'Tree-Officer', type: 'DEPARTMENT' },
    { email: 'garden.superintendent@test.com', fullName: 'Garden Superintendent User', roleName: 'Garden-Superintendent', type: 'DEPARTMENT' },
    { email: 'additional.commissioner@test.com', fullName: 'Additional Commissioner User', roleName: 'Additional-Commissioner', type: 'DEPARTMENT' },
    { email: 'commissioner@test.com', fullName: 'Commissioner User', roleName: 'Commissioner', type: 'DEPARTMENT' },
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

  // ── Step 3: Create Workflow Configuration (JSON format) ──
  console.log('\n🔧 Step 3: Creating workflow configuration...');

  const wfCode = 'TREE_TRIMMING_001';

  // Clean up any existing config to avoid conflicts during seeding
  const deleteResult = await prisma.workflowConfiguration.deleteMany({
    where: {
      OR: [
        { code: wfCode, tenantId: TENANT_ID },
        { serviceId: SERVICE_ID, tenantId: TENANT_ID }
      ]
    }
  });

  if (deleteResult.count > 0) {
    console.log(`  🗑️  Deleted ${deleteResult.count} existing workflow configuration(s)`);
  }

  const nodesData = [
    { code: 'P_001', name: 'Level 0: Citizen Submit', type: 'START', role: 'Investor', x: 100, y: 100 },
    { code: 'P_002', name: 'Level 1: Garden Inspector', type: 'STANDARD', role: 'Garden-Inspector', x: 300, y: 100 },
    { code: 'P_003', name: 'Level 2: Tree Officer', type: 'STANDARD', role: 'Tree-Officer', x: 500, y: 100 },
    { code: 'P_004', name: 'Level 3: Garden Inspector Recheck', type: 'STANDARD', role: 'Garden-Inspector', x: 700, y: 100 },
    { code: 'P_005', name: 'Level 4: Garden Superintendent', type: 'STANDARD', role: 'Garden-Superintendent', x: 900, y: 100 },
    { code: 'P_006', name: 'Level 5: Additional Commissioner', type: 'STANDARD', role: 'Additional-Commissioner', x: 1100, y: 100 },
    { code: 'P_007', name: 'Level 6: Commissioner', type: 'STANDARD', role: 'Commissioner', x: 1300, y: 100 },
    { code: 'P_008', name: 'Level 7: Final Closure', type: 'END', role: 'Investor', x: 1500, y: 100 },
  ];

  const processes = nodesData.map((nd, index) => {
    return {
      processCode: nd.code,
      stepOrder: index + 1,
      name: nd.name,
      nodeType: nd.type as ProcessNodeType,
      assigneeType: 'ROLE' as AssigneeType,
      roleId: roleMap[nd.role],
      roleName: nd.role,
      userId: null,
      formTypeId: nd.role === 'Investor' ? 1 : 2,
      slaHours: 48,
      slaBreachAction: 'NONE' as SlaBreach,
      slaBreachPercentage: null,
      canVerifyDocument: false,
      canRevertToApplicant: true,
      positionX: nd.x,
      positionY: nd.y,
      actions: [] as any[],
    };
  });

  // Helper to add action to a process
  const addAction = (processCode: string, actionCode: string, label: string, transitions: any[], payload?: any) => {
    const process = processes.find(p => p.processCode === processCode);
    if (process) {
      process.actions.push({
        actionCode,
        actionLabel: label,
        requiresComment: actionCode === 'REVERT' || actionCode === 'REJECT',
        requiresDocument: false,
        requiresReason: false,
        displayOrder: process.actions.length,
        transitions,
        payload
      } as any);
    }
  };

  // Maps based on approval matrix
  // L0
  addAction('P_001', 'FORWARD', 'Submit Request', [{ targetProcessCode: 'P_002', label: 'Submit Request', priority: 0 }]);

  // L1
  addAction('P_002', 'FORWARD', 'Forward to Tree Officer', [{ targetProcessCode: 'P_003', label: 'Forward', priority: 0 }]);
  addAction('P_002', 'REVERT', 'Return to Citizen', [{ targetProcessCode: 'P_001', label: 'Return', priority: 1 }]);

  // L2
  addAction('P_003', 'FORWARD', 'Forward to Garden Inspector', [{ targetProcessCode: 'P_004', label: 'Forward', priority: 0 }], { allowPaymentDemand: true });
  addAction('P_003', 'REVERT', 'Return to Garden Inspector', [{ targetProcessCode: 'P_002', label: 'Return', priority: 1 }]);

  // L3
  addAction('P_004', 'FORWARD', 'Forward to Garden Supt', [{ targetProcessCode: 'P_005', label: 'Forward', priority: 0 }]);
  addAction('P_004', 'REVERT', 'Return to Tree Officer', [{ targetProcessCode: 'P_003', label: 'Return', priority: 1 }]);

  // L4
  addAction('P_005', 'FORWARD', 'Forward to Addl Commissioner', [{ targetProcessCode: 'P_006', label: 'Forward', priority: 0 }]);
  addAction('P_005', 'REVERT', 'Return to Garden Inspector', [{ targetProcessCode: 'P_004', label: 'Return', priority: 1 }]);

  // L5
  addAction('P_006', 'FORWARD', 'Forward to Commissioner', [{ targetProcessCode: 'P_007', label: 'Forward', priority: 0 }]);
  addAction('P_006', 'REVERT', 'Return to Garden Supt', [{ targetProcessCode: 'P_005', label: 'Return', priority: 1 }]);

  // L6
  addAction('P_007', 'APPROVE', 'Approve Application', [{ targetProcessCode: 'P_008', label: 'Approve', priority: 0 }]);
  addAction('P_007', 'REJECT', 'Reject Application', [{ targetProcessCode: 'P_008', label: 'Reject', priority: 1 }]);
  addAction('P_007', 'REVERT', 'Return to Addl Commissioner', [{ targetProcessCode: 'P_006', label: 'Return', priority: 2 }]);

  // L7 (END node) - No forward transitions

  const configurationJson = {
    processes,
    fieldPermissions: []
  };

  const adminUserId = BigInt(1); // Mocked creator ID for seeding

  const wfDef = await prisma.workflowConfiguration.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      subDepartmentId: null,
      projectId: null,
      moduleId: null,
      serviceId: SERVICE_ID,
      code: wfCode,
      name: 'Tree Trimming Workflow',
      description: '8-Step Tree Trimming Workflow process',
      version: 1,
      status: 'PUBLISHED',
      createdBy: adminUserId,
      configuration: configurationJson as any,
    },
  });

  console.log(`  ✅ Created Workflow Configuration: ${wfDef.name} (id: ${wfDef.id})`);

  console.log('\n==========================================================');
  console.log(' ✅ SEEDING COMPLETE!');
  console.log('==========================================================');
  console.log(' 🔑 Login Credentials:');
  console.log(' ┌──────────────────────────────────┬─────────────────────────────┐');
  console.log(' │ Email                            │ Role                        │');
  console.log(' ├──────────────────────────────────┼─────────────────────────────┤');
  console.log(' │ investor@test.com                │ Investor (Citizen)          │');
  console.log(' │ garden.inspector@test.com        │ Garden-Inspector            │');
  console.log(' │ tree.officer@test.com            │ Tree-Officer                │');
  console.log(' │ garden.superintendent@test.com   │ Garden-Superintendent       │');
  console.log(' │ additional.commissioner@test.com │ Additional-Commissioner     │');
  console.log(' │ commissioner@test.com            │ Commissioner                │');
  console.log(' └──────────────────────────────────┴─────────────────────────────┘');
  console.log(' Passwords:');
  console.log('   - Investor: investor@123');
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
