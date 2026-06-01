import { PrismaClient, ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

const prisma = new PrismaClient();

// Standard bcrypt hashes
const INVESTOR_PASSWORD_HASH =
  '$2b$10$Ose3z7i0PjQH9glSXYTg3e1xPvTD109KINoM37h6oU0.oJ4Ar/9jS'; // investor@123
const DEPARTMENT_PASSWORD_HASH =
  '$2b$10$9r/4VeHAZZrjyx88Hy8duuyibI0VahpVd/hkq15bZqPTTJoSdcg06'; // password@123

const TENANT_ID = 5;
const DEPARTMENT_ID = 2;
const SERVICE_ID = '12229.0'; // Water Disconnection

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Water Disconnection Workflow for Tenant ${TENANT_ID}`);
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
      console.log(`  ✅ Created role: ${roleDef.name}`);
    } else {
      console.log(`  ⏭️  Role exists: ${roleDef.name}`);
    }
    roleMap[roleDef.name] = role.id;
  }

  // ── Step 2: Create Users ─────────────────────────────────────
  console.log('\n👤 Step 2: Creating users...');

  const userDefinitions = [
    { email: 'citizen@test.com', fullName: 'Citizen User', roleName: 'Citizen', type: 'INVESTOR' },
    { email: 'document.verifier@test.com', fullName: 'Document Verifier User', roleName: 'Document Verifier', type: 'DEPARTMENT' },
    { email: 'w.s.connection.approver@test.com', fullName: 'Approver User', roleName: 'W&S Connection Approver', type: 'DEPARTMENT' },
    { email: 'divisional.officer.do@test.com', fullName: 'DO User', roleName: 'Divisional Officer', type: 'DEPARTMENT' },
    { email: 'field.inspector@test.com', fullName: 'Field Inspector User', roleName: 'Field Inspector', type: 'DEPARTMENT' },
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
          password_hash: userDef.type === 'INVESTOR'
            ? INVESTOR_PASSWORD_HASH
            : DEPARTMENT_PASSWORD_HASH,
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

  const wfCode = 'WATER_DISCONNECTION_001';

  await prisma.workflowConfiguration.deleteMany({
    where: { tenantId: TENANT_ID, serviceId: SERVICE_ID },
  });

  const nodesData = [
    { code: 'D_001', name: 'Citizen Submission', type: 'START', role: 'Citizen', x: 100, y: 100 },
    { code: 'D_002', name: 'Document Verification', type: 'STANDARD', role: 'Document Verifier', x: 300, y: 100 },
    { code: 'D_003', name: 'Approver Review', type: 'STANDARD', role: 'W&S Connection Approver', x: 500, y: 100, allowPayment: true },
    { code: 'D_004', name: 'DO Approval', type: 'STANDARD', role: 'Divisional Officer', x: 700, y: 100 },
    { code: 'D_005', name: 'Field Disconnection', type: 'STANDARD', role: 'Field Inspector', x: 900, y: 100 },
    { code: 'D_006', name: 'Final Closure', type: 'END', role: 'Water Tax Department', x: 1100, y: 100 },
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
    formTypeId: nd.type === 'START' ? 1 : 2,
    slaHours: 48,
    slaBreachAction: 'NONE' as SlaBreach,
    slaBreachPercentage: null,
    canVerifyDocument: nd.role === 'Document Verifier',
    canRevertToApplicant: true,
    allowPaymentDemand: nd.allowPayment || false, // CRITICAL: Enabled for D_003
    positionX: nd.x,
    positionY: nd.y,
    actions: [] as any[],
  }));

  const addAction = (processCode, actionCode, label, to) => {
    const p = processes.find(x => x.processCode === processCode);
    if (!p) return;
    p.actions.push({
      actionCode,
      actionLabel: label,
      requiresComment: actionCode === 'SEND_BACK' || actionCode === 'REJECT',
      requiresDocument: false,
      requiresReason: false,
      displayOrder: p.actions.length,
      transitions: [{ targetProcessCode: to, priority: 0 }],
    });
  };

  addAction('D_001', 'FORWARD', 'Submit Request', 'D_002');
  addAction('D_002', 'FORWARD', 'Verify & Forward', 'D_003');
  addAction('D_002', 'SEND_BACK', 'Send Back to Citizen', 'D_001');

  // Approver generates Challan
  addAction('D_003', 'CHALLAN', 'Approve & Generate Demand', 'D_004');

  addAction('D_004', 'FORWARD', 'Approve for Field Action', 'D_005');
  addAction('D_005', 'FORWARD', 'Disconnect Connection', 'D_006');

  const configurationJson = { processes, fieldPermissions: [] };

  const wfDef = await prisma.workflowConfiguration.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      serviceId: SERVICE_ID,
      code: wfCode,
      name: 'Water Disconnection Workflow',
      description: 'End-to-end Water Disconnection workflow with Demand Generation',
      version: 1,
      status: 'PUBLISHED',
      createdBy: BigInt(1),
      configuration: configurationJson as any,
    },
  });

  console.log(`  ✅ Created Workflow Configuration: ${wfDef.name} (id: ${wfDef.id})`);

  console.log('\n==========================================================');
  console.log(' ✅ SEEDING COMPLETE!');
  console.log('==========================================================');
  console.log(' 🔑 Login Credentials:');
  console.log(' ┌──────────────────────────────┬──────────────────────────┐');
  console.log(' │ Email                        │ Role                     │');
  console.log(' ├──────────────────────────────┼──────────────────────────┤');
  console.log(' │ citizen@test.com             │ Citizen                  │');
  console.log(' │ document.verifier@test.com   │ Document Verifier        │');
  console.log(' │ w.s.connection.approver@test.com │ W&S Connection Approver  │');
  console.log(' │ divisional.officer.do@test.com │ Divisional Officer       │');
  console.log(' │ field.inspector@test.com     │ Field Inspector          │');
  console.log(' │ watertaxdepartment@example.com │ Water Tax Department     │');
  console.log(' └──────────────────────────────┴──────────────────────────┘');
  console.log(' Passwords:');
  console.log('   - Citizen: investor@123');
  console.log('   - Department: password@123');
  console.log(` Tenant: ${TENANT_ID} | Workflow Code: ${wfCode} | Status: PUBLISHED`);
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
