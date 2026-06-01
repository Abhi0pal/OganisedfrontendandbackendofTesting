import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const role = await prisma.roles.findFirst({
    include: {
      roleResources: {
        include: { resource: true },
      },
    },
  });

  if (!role) {
    console.log('No role found');
    return;
  }

  role.roleResources.forEach((rr) => {
    console.log(
      `[ROLE→RESOURCE] roleId=${rr.role_id} → resource=${rr.resource.code}`,
    );
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
