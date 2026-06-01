import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 6;
  const roleId = 202;
  const email = 'admin.tenant6@example.com';
  const password = 'admin@123';

  console.log(`🚀 Starting seeding for Tenant Admin (Tenant: ${tenantId}, Role: ${roleId})...`);

  // 1. Check if Tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(`❌ Tenant with ID ${tenantId} not found.`);
    return;
  }
  console.log(`✅ Found Tenant: ${tenant.name} (Slug: ${tenant.slug})`);

  // 2. Check if Role exists
  const role = await prisma.roles.findUnique({ where: { id: roleId } });
  if (!role) {
    console.error(`❌ Role with ID ${roleId} not found.`);
    return;
  }
  console.log(`✅ Found Role: ${role.name}`);

  // 3. Create or Update User
  const passwordHash = await bcrypt.hash(password, 10);
  let user = await prisma.users.findFirst({ where: { email } });

  if (user) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        tenant_id: tenantId,
        role_id: roleId,
        user_type: 'DEPARTMENT',
        password_hash: passwordHash,
        password_algo: 'bcrypt',
        is_email_verified: 1,
        is_active: true,
      },
    });
    console.log(`✅ User ${email} (ID: ${user.id}) updated.`);
  } else {
    user = await prisma.users.create({
      data: {
        email,
        tenant_id: tenantId,
        role_id: roleId,
        user_type: 'DEPARTMENT',
        password_hash: passwordHash,
        password_algo: 'bcrypt',
        is_email_verified: 1,
        is_active: true,
      },
    });
    console.log(`✅ User ${email} (ID: ${user.id}) created.`);
  }

  // 4. Create/Update Department User Profile
  // Note: dept_id in department_users usually refers to a record in m_departments.
  // We'll try to find a relevant department or default to 1.
  await prisma.department_users.upsert({
    where: { user_id: user.id },
    update: {
      full_name: `${tenant.name} Admin`,
      email: email,
      dept_id: 1, 
      status: 1,
    },
    create: {
      user_id: user.id,
      full_name: `${tenant.name} Admin`,
      email: email,
      dept_id: 1,
      status: 1,
    },
  });
  console.log(`✅ Department user profile created/updated.`);

  // 5. Create/Update Role Assignment
  const assignment = await prisma.userRoleAssignment.findFirst({
    where: {
      user_id: user.id,
      role_id: roleId,
      tenant_id: tenantId,
    },
  });

  if (!assignment) {
    const newAssignment = await prisma.userRoleAssignment.create({
      data: {
        user_id: user.id,
        role_id: roleId,
        tenant_id: tenantId,
        valid_from: new Date(),
        is_active: true,
        remarks: `Auto-generated Tenant Admin for ${tenant.name}`,
      },
    });

    const identifier = `ASG-${newAssignment.id}-${role.name.replace(/\s+/g, '_')}-TENANT-${tenantId}`;
    await prisma.userRoleAssignment.update({
      where: { id: newAssignment.id },
      data: { assignment_identifier: identifier },
    });
    console.log(`✅ Role assignment created (ID: ${newAssignment.id}, Identifier: ${identifier}).`);
  } else {
    console.log(`ℹ️ Role assignment already exists.`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
