import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Workflow V2 test data...');

  // 0. Fix auto-increment sequences (they get out of sync after db push --force-reset)
  const sequenceFixes = [
    `SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 0) + 1, false)`,
    `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 0) + 1, false)`,
    `SELECT setval(pg_get_serial_sequence('m_departments', 'id'), COALESCE((SELECT MAX(id) FROM m_departments), 0) + 1, false)`,
    `SELECT setval(pg_get_serial_sequence('tenants', 'id'), COALESCE((SELECT MAX(id) FROM tenants), 0) + 1, false)`,
  ];
  for (const sql of sequenceFixes) {
    try { await prisma.$executeRawUnsafe(sql); } catch (e) { /* table may not exist yet */ }
  }
  console.log('✅ Fixed auto-increment sequences');

  // 1. Create a Tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug: 'wf-test-tenant' } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Workflow Test Tenant',
        slug: 'wf-test-tenant',
        tenant_ID: 'TN_WF_001',
      },
    });
    console.log(`✅ Created Tenant: ${tenant.name}`);
  } else {
    console.log(`✅ Tenant already exists: ${tenant.name}`);
  }

  // 2. Create the TENANT_ADMIN role for this tenant
  let adminRole = await prisma.roles.findFirst({
    where: { name: 'TENANT_ADMIN', tenant_id: tenant.id },
  });
  if (!adminRole) {
    adminRole = await prisma.roles.create({
      data: {
        name: 'TENANT_ADMIN',
        tenant_id: tenant.id,
        description: 'Tenant Administrator for Workflow V2',
        is_system: true,
      },
    });
    console.log(`✅ Created Role: TENANT_ADMIN`);
  }

  // 3. Create normal roles for workflow processing
  const processingRoles = ['JD', 'Director', 'Secretary'];
  for (const roleName of processingRoles) {
    let r = await prisma.roles.findFirst({ where: { name: roleName, tenant_id: tenant.id } });
    if (!r) {
      await prisma.roles.create({
        data: {
          name: roleName,
          tenant_id: tenant.id,
          description: `${roleName} processing role`,
        },
      });
      console.log(`✅ Created Processing Role: ${roleName}`);
    }
  }

  // 4. Create the Tenant Admin user
  const adminEmail = 'tenantadmin@example.com';
  let adminUser = await prisma.users.findFirst({ where: { email: adminEmail } });
  if (!adminUser) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash('admin@123', salt);
    adminUser = await prisma.users.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        salt: salt,
        user_type: 'DEPARTMENT',
        role_id: adminRole.id,
        tenant_id: tenant.id,
        is_email_verified: 1,
      },
    });
    console.log(`✅ Created User: ${adminEmail} (admin@123)`);
  }

  // 5. Create UserRoleAssignment
  const existingAssignment = await prisma.userRoleAssignment.findFirst({
    where: { user_id: adminUser.id, role_id: adminRole.id, tenant_id: tenant.id },
  });
  if (!existingAssignment) {
    await prisma.userRoleAssignment.create({
      data: {
        user_id: adminUser.id,
        role_id: adminRole.id,
        tenant_id: tenant.id,
        assigned_by: adminUser.id,
        is_active: true,
      },
    });
    console.log(`✅ Assigned TENANT_ADMIN role to user`);
  }

  // 6. Create a Department for Workflow
  let dept = await prisma.department.findFirst({ where: { name: 'Workflow Test Department' } });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Workflow Test Department',
        uniqueTag: 'WF_DEPT_TEST_01',
        ip: '127.0.0.1',
        secretKey: 'secretWf123',
        baseUrl: 'http://localhost',
        publicKey: 'pubWf123',
        abbreviation: 'WFT',
        isActive: true,
      },
    });
    console.log(`✅ Created Department: ${dept.name}`);
  }

  // 7. Seed multiple Dummy Workflow Definitions
  const seedWorkflows = [
    { code: 'WF_DEMO_01', name: 'Demo Approval Workflow', description: 'Seeded test workflow', status: 'DRAFT', version: 1 },
    { code: 'WF_LEGAL_02', name: 'Legal Clearance Form', description: 'Checks legal compliance', status: 'PUBLISHED', version: 2 },
    { code: 'WF_FINANCE_03', name: 'Finance Audit Flow', description: 'Multi-level finance audit', status: 'ARCHIVED', version: 1 },
    { code: 'WF_FINANCE_03', name: 'Finance Audit Flow', description: 'Multi-level finance audit - Updated', status: 'PUBLISHED', version: 2 },
    { code: 'WF_HR_04', name: 'Employee Onboarding', description: 'Onboarding process for new hires', status: 'DRAFT', version: 1 },
    { code: 'WF_DOC_05', name: 'Document Verification', description: 'Standard document verify', status: 'PUBLISHED', version: 3 },
    { code: 'WF_TECH_06', name: 'System Access Request', description: 'Request IT access', status: 'DRAFT', version: 1 },
    { code: 'WF_VENDOR_07', name: 'Vendor Onboarding', description: 'Register new vendor', status: 'ARCHIVED', version: 1 },
    { code: 'WF_VENDOR_07', name: 'Vendor Onboarding', description: 'Register new vendor - V2', status: 'PUBLISHED', version: 2 },
    { code: 'WF_REVIEW_08', name: 'Annual Performance Review', description: 'Yearly employee review', status: 'DRAFT', version: 1 },
  ];

  for (const wf of seedWorkflows) {
    let workflow = await prisma.workflowDefinition.findFirst({
      where: { code: wf.code, version: wf.version, tenantId: tenant.id, departmentId: dept.id },
    });

    if (!workflow) {
      workflow = await prisma.workflowDefinition.create({
        data: {
          tenantId: tenant.id,
          departmentId: dept.id,
          code: wf.code,
          name: wf.name,
          description: wf.description,
          version: wf.version,
          status: wf.status as any,
        },
      });
      console.log(`✅ Created Workflow Definition: ${workflow.name} (v${workflow.version}) - ${workflow.status}`);
    }
  }

  console.log('\n🎉 Seeding complete!');
  console.log('Login with: tenantadmin@example.com / admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
