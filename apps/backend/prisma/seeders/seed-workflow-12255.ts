import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SOURCE_SERVICE_ID = '12222.0';
const TARGET_SERVICE_ID = '12254.0';
const TARGET_TENANT_ID = 6;
const TARGET_DEPARTMENT_ID = 16;

async function main() {
  console.log(`🚀 Starting workflow seeding for service: ${TARGET_SERVICE_ID}`);

  // 1. Delete existing workflow for TARGET_SERVICE_ID (indempotency)
  const existingWf = await prisma.workflowDefinition.findFirst({
    where: { serviceId: TARGET_SERVICE_ID },
  });

  if (existingWf) {
    console.log(`  🗑️  Deleting existing workflow for ${TARGET_SERVICE_ID} (ID: ${existingWf.id})`);
    // Delete runtime data first to avoid FK errors
    const fwdLevels = await prisma.tWorkflowForwardLevel.findMany({
      where: { workflowDefId: existingWf.id },
      select: { id: true },
    });
    if (fwdLevels.length > 0) {
      const fwdIds = fwdLevels.map(f => f.id);
      await prisma.tWorkflowAudit.deleteMany({ where: { forwardLevelId: { in: fwdIds } } });
      await prisma.tWorkflowForwardLevel.deleteMany({ where: { workflowDefId: existingWf.id } });
    }
    await prisma.workflowDefinition.delete({ where: { id: existingWf.id } });
  }

  // 2. Fetch SOURCE workflow data (already done by previous research, but confirming)
  const sourceWf = await prisma.workflowDefinition.findFirst({
    where: { serviceId: SOURCE_SERVICE_ID },
    include: {
      processes: {
        include: {
          actions: {
            include: {
              transitions: true
            }
          }
        }
      }
    }
  });

  if (!sourceWf) {
    console.error(`❌ Source workflow for ${SOURCE_SERVICE_ID} not found!`);
    return;
  }

  // 3. Create TARGET workflow definition
  const newWf = await prisma.workflowDefinition.create({
    data: {
      tenantId: TARGET_TENANT_ID,
      departmentId: TARGET_DEPARTMENT_ID,
      serviceId: TARGET_SERVICE_ID,
      code: 'WF_AGENT_PROGRESS_REPORT',
      name: 'Agent Progress Report',
      description: 'Workflow for Agent Progress Report',
      version: 1,
      status: sourceWf.status,
    }
  });
  console.log(`  ✅ Created WorkflowDefinition: ${newWf.name} (ID: ${newWf.id})`);

  // 4. Create Processes (Nodes)
  const processMap: Record<number, number> = {}; // sourceProcessId -> targetProcessId

  for (const proc of sourceWf.processes) {
    const newProc = await prisma.workflowProcess.create({
      data: {
        workflowDefId: newWf.id,
        processCode: proc.processCode,
        name: proc.name,
        description: proc.description,
        stepOrder: proc.stepOrder,
        nodeType: proc.nodeType,
        assigneeType: proc.assigneeType,
        roleId: proc.roleId,
        formTypeId: proc.formTypeId,
        positionX: proc.positionX,
        positionY: proc.positionY,
        canVerifyDocument: proc.canVerifyDocument,
        canRevertToApplicant: proc.canRevertToApplicant,
      }
    });
    processMap[proc.id] = newProc.id;
    console.log(`    ✅ Created Node: ${newProc.name} (${newProc.processCode})`);
  }

  // 5. Create Actions & Transitions
  for (const proc of sourceWf.processes) {
    for (const action of proc.actions) {
      const newAction = await prisma.workflowProcessAction.create({
        data: {
          processId: processMap[proc.id],
          actionCode: action.actionCode,
          actionLabel: action.actionLabel,
          requiresComment: action.requiresComment,
          requiresDocument: action.requiresDocument,
          requiresReason: action.requiresReason,
          displayOrder: action.displayOrder,
        }
      });
      console.log(`      ⚡ Created Action: ${newAction.actionLabel} for ${proc.name}`);

      // Create transitions for this action
      for (const trans of action.transitions) {
        await prisma.workflowTransition.create({
          data: {
            sourceProcessId: processMap[trans.sourceProcessId],
            targetProcessId: processMap[trans.targetProcessId],
            actionId: newAction.id,
            conditionJson: trans.conditionJson as any,
            conditionLabel: trans.conditionLabel,
            priority: trans.priority,
            label: trans.label,
          }
        });
        console.log(`        🔗 Created Transition: -> ${sourceWf.processes.find(p => p.id === trans.targetProcessId)?.name}`);
      }
    }
  }

  console.log(`\n🎉 Workflow for ${TARGET_SERVICE_ID} seeded successfully!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
