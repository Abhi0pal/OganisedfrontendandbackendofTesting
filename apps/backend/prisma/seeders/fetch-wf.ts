import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const serviceId = '12222.0';
  const wf = await prisma.workflowDefinition.findFirst({
    where: { serviceId },
    include: {
      processes: {
        include: {
          actions: {
            include: {
              transitions: true
            }
          },
          outgoingTransitions: true,
          incomingTransitions: true,
        }
      }
    }
  });

  if (!wf) {
    console.log(`No workflow found for serviceId: ${serviceId}`);
    return;
  }

  console.log(JSON.stringify(wf, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  , 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
