import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const config = await prisma.workflowConfiguration.findFirst({ where: { code: 'HOSP_REG_001' }});
  console.log(JSON.stringify(config?.configuration, null, 2));
}
run().finally(() => prisma.$disconnect());
