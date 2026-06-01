import { PrismaClient, ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hashes
const INVESTOR_PASSWORD_HASH =
  '$2b$10$Ose3z7i0PjQH9glSXYTg3e1xPvTD109KINoM37h6oU0.oJ4Ar/9jS'; // investor@123
const DEPARTMENT_PASSWORD_HASH =
  '$2b$10$9r/4VeHAZZrjyx88Hy8duuyibI0VahpVd/hkq15bZqPTTJoSdcg06'; // password@123

const TENANT_ID = 5;
const DEPARTMENT_ID = 2; // matches m_service.department_id
const SERVICE_ID = '12230.0'; // Water Reconnection

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Water Reconnection Workflow for Tenant ${TENANT_ID}`);
  console.log('==========================================================\n');

  // ── Step 1: Create Roles ─────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');

  const roleDefinitions = [
    { name: 'Citizen' },
    { name: 'Document Verifier' },
    { name: 'W&S Connection Approver' },
    { name: 'Divisional Officer' },
    { name: 'Field Inspector' },
    { name: 'Water Tax Department' },
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
  console.log('\n👤 Step 2: Mapping users...');

  const userDefinitions = [
    { email: 'citizen@test.com', fullName: 'Citizen User', roleName: 'Citizen', type: 'INVESTOR' },
    { email: 'document.verifier@test.com', fullName: 'Document Verifier', roleName: 'Document Verifier', type: 'DEPARTMENT' },
    { email: 'w.s.connection.approver@test.com', fullName: 'Approver', roleName: 'W&S Connection Approver', type: 'DEPARTMENT' },
    { email: 'divisional.officer.do@test.com', fullName: 'DO User', roleName: 'Divisional Officer', type: 'DEPARTMENT' },
    { email: 'field.inspector@test.com', fullName: 'Field Inspector', roleName: 'Field Inspector', type: 'DEPARTMENT' },
    { email: 'watertaxdepartment@example.com', fullName: 'Water Tax User', roleName: 'Water Tax Department', type: 'DEPARTMENT' },
  ];

  for (const userDef of userDefinitions) {
    const existing = await prisma.users.findFirst({ where: { email: userDef.email } });
    if (existing) {
      await prisma.users.update({
        where: { id: existing.id },
        data: {
          role_id: roleMap[userDef.roleName],
          tenant_id: TENANT_ID,
          user_type: userDef.type as any,
        }
      });
      console.log(`  🔄  Updated existing user: ${userDef.email} → ${userDef.roleName}`);
    } else {
      await prisma.users.create({
        data: {
          email: userDef.email,
          password_hash: userDef.type === 'INVESTOR' ? INVESTOR_PASSWORD_HASH : DEPARTMENT_PASSWORD_HASH,
          password_algo: 'bcrypt',
          user_type: userDef.type as any,
          role_id: roleMap[userDef.roleName],
          tenant_id: TENANT_ID,
          is_email_verified: 1,
          department_user: userDef.type === 'DEPARTMENT'
            ? {
                create: {
                  full_name: userDef.fullName,
                  email: userDef.email,
                  dept_id: DEPARTMENT_ID,
                  tahsil_id: 0,
                  block_id: 0,
                  office_id: 0,
                  division_id: 0,
                },
              }
            : undefined,
        },
      });
      console.log(`  ✅ Created user: ${userDef.email} → ${userDef.roleName}`);
    }
  }

  // ── Step 3: Create Workflow Configuration ─────────────────────
  console.log('\n🔧 Step 3: Creating workflow configuration...');

  const wfCode = 'WATER_RECONNECTION_001';

  await prisma.workflowConfiguration.deleteMany({
    where: { tenantId: TENANT_ID, serviceId: SERVICE_ID },
  });

  const nodesData = [
    { code: 'R_001', name: 'Citizen Submit', type: 'START', role: 'Citizen', x: 100, y: 100 },
    { code: 'R_002', name: 'Document Verification', type: 'STANDARD', role: 'Document Verifier', x: 300, y: 100 },
    { code: 'R_003', name: 'Approver Review', type: 'STANDARD', role: 'W&S Connection Approver', x: 500, y: 100, allowPayment: true },
    { code: 'R_004', name: 'DO Approval', type: 'STANDARD', role: 'Divisional Officer', x: 700, y: 100 },
    { code: 'R_005', name: 'Field Reconnection', type: 'STANDARD', role: 'Field Inspector', x: 900, y: 100 },
    { code: 'R_006', name: 'Final Closure', type: 'STANDARD', role: 'Water Tax Department', x: 1100, y: 100 },
    { code: 'R_007', name: 'Closed', type: 'END', role: 'Water Tax Department', x: 1300, y: 100 },
  ];

  const processes = nodesData.map((nd, index) => ({
    processCode: nd.code,
    stepOrder: index + 1,
    name: nd.name,
    nodeType: nd.type as ProcessNodeType,
    assigneeType: 'ROLE' as AssigneeType,
    roleId: roleMap[nd.role],
    roleName: nd.role,
    userId: null,
    formTypeId: nd.type === 'START' ? 1 : 2, // 2 for Department
    slaHours: 48,
    slaBreachAction: 'NONE' as SlaBreach,
    slaBreachPercentage: null,
    canVerifyDocument: nd.role === 'Document Verifier',
    canRevertToApplicant: true,
    allowPaymentDemand: nd.allowPayment || false,
    positionX: nd.x,
    positionY: nd.y,
    actions: [] as any[],
  }));

  const addAction = (
    processCode: string,
    actionCode: string,
    label: string,
    transitions: any[]
  ) => {
    const process = processes.find(p => p.processCode === processCode);
    if (process) {
      process.actions.push({
        actionCode,
        actionLabel: label,
        requiresComment: actionCode === 'SEND_BACK' || actionCode === 'REJECT',
        requiresDocument: false,
        requiresReason: false,
        displayOrder: process.actions.length,
        transitions,
      } as any);
    }
  };

  addAction('R_001', 'FORWARD', 'Submit Reconnection Request', [{ targetProcessCode: 'R_002', label: 'Submitted', priority: 0 }]);

  addAction('R_002', 'FORWARD', 'Verify & Forward', [{ targetProcessCode: 'R_003', label: 'Verified', priority: 0 }]);
  addAction('R_002', 'SEND_BACK', 'Send Back to Citizen', [{ targetProcessCode: 'R_001', label: 'Correction Required', priority: 1 }]);
  addAction('R_002', 'REJECT', 'Reject Request', [{ targetProcessCode: 'R_007', label: 'Rejected', priority: 2 }]);

  addAction('R_003', 'CHALLAN', 'Approve & Generate Demand', [{ targetProcessCode: 'R_004', label: 'Approved', priority: 0 }]);
  addAction('R_003', 'SEND_BACK', 'Send Back to DV', [{ targetProcessCode: 'R_002', label: 'Clarification Required', priority: 1 }]);

  addAction('R_004', 'FORWARD', 'Approve for Field Action', [{ targetProcessCode: 'R_005', label: 'Approved', priority: 0 }]);
  addAction('R_004', 'REJECT', 'Reject Request', [{ targetProcessCode: 'R_007', label: 'Rejected', priority: 1 }]);

  addAction('R_005', 'FORWARD', 'Reconnect Connection', [{ targetProcessCode: 'R_006', label: 'Reconnected', priority: 0 }]);
  
  addAction('R_006', 'APPROVE', 'Approve & Close', [{ targetProcessCode: 'R_007', label: 'Closed', priority: 0 }]);

  const wfDef = await prisma.workflowConfiguration.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      serviceId: SERVICE_ID,
      code: wfCode,
      name: 'Water Reconnection Workflow',
      description: 'End-to-end Water Reconnection Workflow with Demand Generation',
      version: 1,
      status: 'PUBLISHED',
      createdBy: BigInt(1),
      configuration: { processes, fieldPermissions: [] } as any,
    },
  });

  console.log(`  ✅ Created Workflow Configuration: ${wfDef.name} (id: ${wfDef.id})`);

  console.log('\n==========================================================');
  console.log(' ✅ SEEDING COMPLETE!');
  console.log('==========================================================');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
