import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  const user = await prisma.users.findFirst({ where: { email: 'tenantadmin@example.com' } });
  if (user) {
    await prisma.users.update({
      where: { id: user.id },
      data: { user_type: 'DEPARTMENT' },
    });
    console.log('✅ Updated user_type to DEPARTMENT for', user.email, '(id:', user.id.toString(), ')');
  } else {
    console.log('❌ User not found');
  }
  await prisma.$disconnect();
}

fix();
