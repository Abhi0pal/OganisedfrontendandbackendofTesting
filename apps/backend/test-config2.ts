import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const configs = await prisma.workflowConfiguration.findMany();
  console.log("Found", configs.length, "configs");
  const config = await prisma.workflowConfiguration.findFirst({ where: { code: 'HOSP_REG_001' }});
  if (config) {
    console.log(JSON.stringify(config.configuration, null, 2));
  } else {
    console.log("No config found for HOSP_REG_001");
  }
}
run().finally(() => prisma.$disconnect());
