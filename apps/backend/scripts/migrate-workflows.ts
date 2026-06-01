import { PrismaClient, WorkflowDefinitionStatus } from '@prisma/client';
import { 
  WorkflowConfigJSON, 
  WorkflowProcessJSON, 
  WorkflowActionJSON, 
  WorkflowTransitionJSON,
  WorkflowFieldPermissionJSON,
  ForkJoinMetadata
} from '../src/modules/workflow-builder/workflow-config-resolver';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting Workflow Data Migration...');

  // 1. Fetch all legacy definitions
  const legacyDefs = await prisma.workflowDefinition.findMany({
    include: {
      processes: {
        include: {
          actions: {
            include: {
              transitions: true
            }
          },
          fieldPermissions: true,
          forkBranches: true,
          forkJoinsAsFork: true,
          forkJoinsAsJoin: true
        }
      },
      forkJoins: {
        include: {
          branches: true
        }
      }
    }
  });

  console.log(`📦 Found ${legacyDefs.length} legacy definitions to migrate.`);

  const migrationStats = {
    processed: 0,
    successful: 0,
    failed: 0,
    runtimeUpdated: 0
  };

  for (const def of legacyDefs) {
    try {
      console.log(`\n🔄 Migrating: ${def.name} (ID: ${def.id}, Code: ${def.code})...`);

      // 2. Create a map of Process ID -> Process Code for transition resolution
      const processIdToCode = new Map<number, string>();
      def.processes.forEach(p => processIdToCode.set(p.id, p.processCode));

      // 3. Build Process JSON list
      const processesJSON: WorkflowProcessJSON[] = def.processes.map(p => {
        // Map actions
        const actionsJSON: WorkflowActionJSON[] = p.actions.map(a => {
          // Map transitions for this action
          const transitionsJSON: WorkflowTransitionJSON[] = a.transitions.map(t => ({
            targetProcessCode: processIdToCode.get(t.targetProcessId) || `LEGACY_ID_${t.targetProcessId}`,
            label: t.label || undefined,
            priority: t.priority,
            conditionJson: t.conditionJson,
            conditionLabel: t.conditionLabel || undefined
          }));

          return {
            actionCode: a.actionCode,
            actionLabel: a.actionLabel,
            requiresComment: a.requiresComment,
            requiresDocument: a.requiresDocument,
            requiresReason: a.requiresReason,
            displayOrder: a.displayOrder,
            transitions: transitionsJSON
          };
        });

        // Resolve Fork/Join metadata
        let forkJoinMetadata: ForkJoinMetadata | null = null;
        if (p.nodeType === 'FORK') {
          const fj = def.forkJoins.find(f => f.forkProcessId === p.id);
          if (fj) {
            forkJoinMetadata = {
              type: 'FORK' as const,
              partnerProcessCode: processIdToCode.get(fj.joinProcessId) || 'UNKNOWN',
              branchProcessCodes: fj.branches.map(b => processIdToCode.get(b.branchProcessId) || 'UNKNOWN'),
            };
          }
        } else if (p.nodeType === 'JOIN') {
          const fj = def.forkJoins.find(f => f.joinProcessId === p.id);
          if (fj) {
            forkJoinMetadata = {
              type: 'JOIN' as const,
              partnerProcessCode: processIdToCode.get(fj.forkProcessId) || 'UNKNOWN',
              joinStrategy: (fj.joinStrategy as 'ALL' | 'ANY') || 'ALL',
            };
          }
        }

        return {
          processCode: p.processCode,
          stepOrder: p.stepOrder,
          name: p.name,
          nodeType: p.nodeType,
          assigneeType: p.assigneeType,
          roleId: p.roleId,
          userId: p.userId,
          formTypeId: p.formTypeId,
          slaHours: p.slaHours,
          slaBreachAction: p.slaBreachAction,
          canVerifyDocument: p.canVerifyDocument,
          canRevertToApplicant: p.canRevertToApplicant,
          positionX: p.positionX,
          positionY: p.positionY,
          actions: actionsJSON,
          forkJoinMetadata
        };
      });

      // 4. Build Field Permission JSON list
      const fieldPermissionsJSON: WorkflowFieldPermissionJSON[] = def.processes.flatMap(p => 
        p.fieldPermissions.map(fp => ({
          processCode: p.processCode,
          fieldId: fp.fieldId,
          roleId: fp.roleId,
          permission: fp.permission
        }))
      );

      const configuration: WorkflowConfigJSON = {
        processes: processesJSON,
        fieldPermissions: fieldPermissionsJSON
      };

      // 5. Upsert into new table for idempotency
      const newConfig = await prisma.workflowConfiguration.upsert({
        where: {
          tenantId_departmentId_code_version: {
            tenantId: def.tenantId,
            departmentId: def.departmentId,
            code: def.code,
            version: def.version
          }
        },
        update: {
          configuration: configuration as any,
          status: def.status as WorkflowDefinitionStatus,
          updatedBy: def.updatedBy,
          name: def.name,
          description: def.description
        },
        create: {
          tenantId: def.tenantId,
          departmentId: def.departmentId,
          subDepartmentId: def.subDepartmentId,
          serviceId: def.serviceId,
          projectId: def.projectId,
          moduleId: def.moduleId,
          code: def.code,
          name: def.name,
          description: def.description,
          version: def.version,
          status: def.status as WorkflowDefinitionStatus,
          createdBy: def.createdBy,
          updatedBy: def.updatedBy,
          configuration: configuration as any
        }
      });

      console.log(`  ✅ Successfully migrated to WorkflowConfiguration ID: ${newConfig.id}`);
      migrationStats.successful++;

      // 6. Update Runtime Data (TWorkflowForwardLevel)
      const updateResult = await prisma.tWorkflowForwardLevel.updateMany({
        where: { workflowDefId: def.id },
        data: { configId: newConfig.id }
      });

      if (updateResult.count > 0) {
        console.log(`  🔗 Linked ${updateResult.count} active workflow instances.`);
        migrationStats.runtimeUpdated += updateResult.count;
      }

    } catch (error) {
      console.error(`  ❌ Failed to migrate ${def.code}:`, error);
      migrationStats.failed++;
    }
    migrationStats.processed++;
  }

  console.log('\n==========================================================');
  console.log('🏁 MIGRATION COMPLETE');
  console.log('==========================================================');
  console.log(`Total Definitions: ${migrationStats.processed}`);
  console.log(`Successful:        ${migrationStats.successful}`);
  console.log(`Failed:            ${migrationStats.failed}`);
  console.log(`Instances Linked:  ${migrationStats.runtimeUpdated}`);
  console.log('==========================================================\n');
}

main().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});

async function main() {
  await migrate();
  await prisma.$disconnect();
}
