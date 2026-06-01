import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 6;
  const password = 'password@123';

  console.log(`🚀 Starting seeding for Tenant Users (Tenant ID: ${tenantId})...`);

  // 1. Check if Tenant exists
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.error(`❌ Tenant with ID ${tenantId} not found.`);
    return;
  }
  console.log(`✅ Found Tenant: ${tenant.name} (Slug: ${tenant.slug})`);

  // 2. Find all roles for this tenant
  const roles = await prisma.roles.findMany({
    where: { tenant_id: tenantId },
  });

  if (!roles.length) {
    console.log(`ℹ️ No roles found for Tenant ID ${tenantId}.`);
    return;
  }

  console.log(`✅ Found ${roles.length} roles for Tenant ${tenantId}.`);

  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Loop through roles and ensure a user exists for each
  for (const role of roles) {
    console.log(`\n--- Processing Role: ${role.name} (ID: ${role.id}) ---`);

    // Check if any active assignment exists for this role in this tenant
    const existingAssignment = await prisma.userRoleAssignment.findFirst({
      where: {
        role_id: role.id,
        tenant_id: tenantId,
        is_active: true,
      },
      include: {
        user: true,
      },
    });

    if (existingAssignment && existingAssignment.user) {
      console.log(`ℹ️ User already exists for role "${role.name}": ${existingAssignment.user.email} (User ID: ${existingAssignment.user.id})`);
      continue;
    }

    // No user found, let's create one
    // Generate an email based on the role name
    const safeRoleName = role.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let email = `${safeRoleName}.t${tenantId}@example.com`;

    // Ensure email is unique
    let counter = 1;
    let emailExists = await prisma.users.findFirst({ where: { email } });
    while (emailExists) {
      email = `${safeRoleName}${counter}.t${tenantId}@example.com`;
      emailExists = await prisma.users.findFirst({ where: { email } });
      counter++;
    }

    console.log(`Creating new user for role "${role.name}" with email: ${email}`);

    const user = await prisma.users.create({
      data: {
        email,
        tenant_id: tenantId,
        role_id: role.id,
        user_type: 'DEPARTMENT',
        password_hash: passwordHash,
        password_algo: 'bcrypt',
        is_email_verified: 1,
        is_active: true,
      },
    });
    console.log(`✅ User ${email} (ID: ${user.id}) created.`);

    // Create Department User Profile
    await prisma.department_users.create({
      data: {
        user_id: user.id,
        full_name: `${role.name} User`,
        email: email,
        dept_id: 1, // Defaulting to 1 as per existing seeders
        status: 1,
      },
    });
    console.log(`✅ Department user profile created.`);

    // Create Role Assignment
    const newAssignment = await prisma.userRoleAssignment.create({
      data: {
        user_id: user.id,
        role_id: role.id,
        tenant_id: tenantId,
        valid_from: new Date(),
        is_active: true,
        remarks: `Auto-generated user for role ${role.name} in Tenant ${tenantId}`,
      },
    });

    const identifier = `ASG-${newAssignment.id}-${role.name.replace(/\s+/g, '_')}-TENANT-${tenantId}`;
    await prisma.userRoleAssignment.update({
      where: { id: newAssignment.id },
      data: { assignment_identifier: identifier },
    });
    console.log(`✅ Role assignment created (ID: ${newAssignment.id}, Identifier: ${identifier}).`);
  }

  console.log('\n🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
