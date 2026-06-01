import { PrismaClient, ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

const prisma = new PrismaClient();

// Password hashes
const INVESTOR_PASSWORD_HASH =
  '$2b$10$Ose3z7i0PjQH9glSXYTg3e1xPvTD109KINoM37h6oU0.oJ4Ar/9jS'; // investor@123
const DEPARTMENT_PASSWORD_HASH =
  '$2b$10$9r/4VeHAZZrjyx88Hy8duuyibI0VahpVd/hkq15bZqPTTJoSdcg06'; // password@123

const TENANT_ID = 5;
const DEPARTMENT_ID = 2;
const SERVICE_ID = '12228.0'; // Water New Connection

async function main() {
  console.log('==========================================================');
  console.log(` SEEDING: Water New Connection Workflow for Tenant ${TENANT_ID}`);
  console.log('==========================================================\n');

  // ── Step 1: Roles ───────────────────────────────────────────
  console.log('📋 Step 1: Creating roles...');

  const roleDefinitions = [
    { name: 'Citizen' },
    { name: 'Document Verifier' },
    { name: 'Field Inspector' },
    { name: 'W&S Connection Approver' },
    { name: 'Head Office' },
    { name: 'Divisional Officer' },
    { name: 'Clerk' },
  ];

  const roleMap: Record<string, number> = {};

  for (const r of roleDefinitions) {
    let role = await prisma.roles.findFirst({ where: { name: r.name, tenant_id: TENANT_ID } });
    if (!role) {
      role = await prisma.roles.create({
        data: { name: r.name, tenant_id: TENANT_ID },
      });
      console.log(`  ✅ Created role: ${r.name} (id: ${role.id})`);
    } else {
      console.log(`  ⏭️  Role exists: ${r.name} (id: ${role.id})`);
    }
    roleMap[r.name] = role.id;
  }

  // ── Step 2: Users ───────────────────────────────────────────
  console.log('\n👤 Step 2: Mapping roles to existing users...');

  const userDefinitions = [
    { email: 'citizen@test.com', fullName: 'Citizen User', role: 'Citizen', type: 'INVESTOR' },
    { email: 'document.verifier@test.com', fullName: 'Document Verifier', role: 'Document Verifier', type: 'DEPARTMENT' },
    { email: 'field.inspector@test.com', fullName: 'Field Inspector', role: 'Field Inspector', type: 'DEPARTMENT' },
    { email: 'w.s.connection.approver@test.com', fullName: 'Approver', role: 'W&S Connection Approver', type: 'DEPARTMENT' },
    { email: 'head-office@test.com', fullName: 'Head Office User', role: 'Head Office', type: 'DEPARTMENT' },
    { email: 'divisional.officer.do@test.com', fullName: 'Divisional Officer', role: 'Divisional Officer', type: 'DEPARTMENT' },
    { email: 'clerk@test.com', fullName: 'Clerk User', role: 'Clerk', type: 'DEPARTMENT' },
    { email: 'watertaxdepartment@example.com', fullName: 'Water Tax User', role: 'Clerk', type: 'DEPARTMENT' },
  ];

  for (const u of userDefinitions) {
    const roleId = roleMap[u.role];
    if (!roleId) {
      console.warn(`  ⚠️  Role not found for: ${u.role}`);
      continue;
    }

    const existingUser = await prisma.users.findFirst({ where: { email: u.email } });

    if (existingUser) {
      // Update existing user to map to the correct role and tenant
      await prisma.users.update({
        where: { id: existingUser.id },
        data: {
          role_id: roleId,
          tenant_id: TENANT_ID,
          user_type: u.type as any,
        },
      });
      console.log(`  🔄  Mapped existing user: ${u.email} → ${u.role}`);
    } else {
      // Create fresh user if not found
      await prisma.users.create({
        data: {
          email: u.email,
          password_hash: u.type === 'INVESTOR' ? INVESTOR_PASSWORD_HASH : DEPARTMENT_PASSWORD_HASH,
          password_algo: 'bcrypt',
          user_type: u.type as any,
          role_id: roleId,
          tenant_id: TENANT_ID,
          is_email_verified: 1,
          department_user:
            u.type === 'DEPARTMENT'
              ? {
                  create: {
                    full_name: u.fullName,
                    email: u.email,
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
      console.log(`  ✅ Created new user: ${u.email} → ${u.role}`);
    }
  }

  // ── Step 3: Workflow Configuration ───────────────────────────
  console.log('\n🔧 Step 3: Creating workflow configuration...');

  const wfCode = 'WATER_NEW_CONNECTION_001';

  // Cleanup old config for this service
  await prisma.workflowConfiguration.deleteMany({
    where: { tenantId: TENANT_ID, serviceId: SERVICE_ID },
  });

  const nodesData = [
    { code: 'P_001', name: 'Level 0: Citizen Submit', type: 'START', role: 'Citizen', x: 100, y: 100 },
    { code: 'P_002', name: 'Level 1: Document Verification', type: 'STANDARD', role: 'Document Verifier', x: 300, y: 100 },
    { code: 'P_003', name: 'Level 2: Field Inspection', type: 'STANDARD', role: 'Field Inspector', x: 500, y: 100 },
    { code: 'P_004', name: 'Level 3: Approver & Demand', type: 'STANDARD', role: 'W&S Connection Approver', x: 700, y: 100, allowPayment: true },
    { code: 'P_005', name: 'Level 4: Head Office Approval', type: 'STANDARD', role: 'Head Office', x: 900, y: 100 },
    { code: 'P_006', name: 'Level 5: DO Approval', type: 'STANDARD', role: 'Divisional Officer', x: 1100, y: 100 },
    { code: 'P_007', name: 'Level 6: Activation', type: 'END', role: 'Clerk', x: 1300, y: 100 },
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
    formTypeId: 1,
    slaHours: 48,
    slaBreachAction: 'NONE' as SlaBreach,
    slaBreachPercentage: null,
    canVerifyDocument: nd.role === 'Document Verifier',
    canRevertToApplicant: true,
    allowPaymentDemand: nd.allowPayment || false, // CRITICAL: Enabled for P_004
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

  // Citizen
  addAction('P_001', 'FORWARD', 'Submit Application', [
    { targetProcessCode: 'P_002', label: 'Submitted', priority: 0 },
  ]);

  // Document Verifier
  addAction('P_002', 'FORWARD', 'Verify & Forward', [
    { targetProcessCode: 'P_003', label: 'Verified', priority: 0 },
  ]);
  addAction('P_002', 'SEND_BACK', 'Send Back to Citizen', [
    { targetProcessCode: 'P_001', label: 'Correction Required', priority: 1 },
  ]);
  addAction('P_002', 'REJECT', 'Reject Application', [
    { targetProcessCode: 'P_007', label: 'Rejected', priority: 2 },
  ]);

  // Field Inspector
  addAction('P_003', 'FORWARD', 'Forward to Approver', [
    { targetProcessCode: 'P_004', label: 'Inspected', priority: 0 },
  ]);
  addAction('P_003', 'SEND_BACK', 'Send Back to DV', [
    { targetProcessCode: 'P_002', label: 'Clarification', priority: 1 },
  ]);

  // Approver (Payment Generation Point)
  addAction('P_004', 'CHALLAN', 'Generate Demand & Forward', [
    { targetProcessCode: 'P_005', label: 'Demand Generated', priority: 0 },
  ]);
  addAction('P_004', 'SEND_BACK', 'Send Back to FI', [
    { targetProcessCode: 'P_003', label: 'Reinspection', priority: 1 },
  ]);
  addAction('P_004', 'REJECT', 'Reject Application', [
    { targetProcessCode: 'P_007', label: 'Rejected', priority: 2 },
  ]);

  // Head Office
  addAction('P_005', 'FORWARD', 'Forward to DO', [
    { targetProcessCode: 'P_006', label: 'HO Approved', priority: 0 },
  ]);
  addAction('P_005', 'SEND_BACK', 'Send Back to Approver', [
    { targetProcessCode: 'P_004', label: 'Clarification', priority: 1 },
  ]);

  // Divisional Officer
  addAction('P_006', 'APPROVE', 'Approve Application', [
    { targetProcessCode: 'P_007', label: 'Approved', priority: 0 },
  ]);
  addAction('P_006', 'REJECT', 'Reject Application', [
    { targetProcessCode: 'P_007', label: 'Rejected', priority: 1 },
  ]);

  const wfDef = await prisma.workflowConfiguration.create({
    data: {
      tenantId: TENANT_ID,
      departmentId: DEPARTMENT_ID,
      serviceId: SERVICE_ID,
      code: wfCode,
      name: 'Water New Connection Workflow',
      description: 'End-to-end Water New Connection Workflow with Demand Generation',
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
  console.log(' 🔑 Login Credentials:');
  console.log(' ┌──────────────────────────────────┬─────────────────────────────┐');
  console.log(' │ Email                            │ Role                        │');
  console.log(' ├──────────────────────────────────┼─────────────────────────────┤');
  console.log(' │ citizen@test.com                 │ Citizen                     │');
  console.log(' │ document-verifier@test.com       │ Document Verifier           │');
  console.log(' │ field-inspector@test.com         │ Field Inspector             │');
  console.log(' │ ws-approver@test.com             │ W&S Connection Approver     │');
  console.log(' │ head-office@test.com             │ Head Office                 │');
  console.log(' │ do@test.com                      │ Divisional Officer          │');
  console.log(' │ clerk@test.com                   │ Clerk                       │');
  console.log(' └──────────────────────────────────┴─────────────────────────────┘');
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
