import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingJd = await prisma.users.findMany({ where: { email: 'verifier.jd@example.com' } });
  if (existingJd && existingJd.length > 0) {
    console.log('JD user already exists (email: verifier.jd@example.com). You can use this account.');
    return;
  }

  // Find JD role
  const role = await prisma.roles.findFirst({ where: { name: 'JD' } });
  if (!role) {
    console.log('Role JD not found in database!');
    return;
  }

  // Create User
  const newUser = await prisma.users.create({
    data: {
      email: 'verifier.jd@example.com',
      password_hash: '$2b$10$jDGAlAO1.K2xBD3CTLRE7uFffWc49Dn6mybMc/rWBDoPS3arGHze2', // Standard hashed password used in dev
      password_algo: 'bcrypt',
      user_type: 'DEPARTMENT',
      role_id: role.id,
      department_id: 16,
      department_user: {
        create: {
          full_name: 'Workflow Verifier (JD)',
          email: 'verifier.jd@example.com',
          dept_id: 16,
          tahsil_id: 1,
          block_id: 1,
          office_id: 1,
          division_id: 1,
        }
      }
    }
  });

  console.log('=============================================');
  console.log('✅ TEST USER CREATED SUCCESSFULLY');
  console.log('=============================================');
  console.log('Email: verifier.jd@example.com');
  console.log('Password is the same as your standard other test users (e.g. password / 123456).');
  console.log('Role: JD (Joint Director)');
  console.log('=============================================');
}

main()
  .catch(e => {
    console.error('Error seeding JD user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
