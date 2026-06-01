import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AssigneeType } from '@prisma/client';
import { CreateWorkflowDefDto, UpdateWorkflowDefDto, BulkSaveCanvasDto } from './dto/workflow-builder.dto';
import { WorkflowConfigJSON, WorkflowProcessJSON, WorkflowActionJSON, WorkflowTransitionJSON } from './workflow-config-resolver';

@Injectable()
export class WorkflowBuilderService {
  private readonly logger = new Logger(WorkflowBuilderService.name);

  constructor(private readonly prisma: PrismaService) { }

  async getHierarchy(tenantId: number) {
    // 1. Fetch departments from Dynamic Master system
    const deptDef = await this.prisma.masterDefinition.findFirst({
      where: {
        code: { contains: 'DEPARTMENT', mode: 'insensitive' },
        NOT: { code: { contains: 'SUB_DEPARTMENT', mode: 'insensitive' } },
        is_active: true
      }
    });

    let departments: any[] = [];
    let departmentMasterIds: bigint[] = [];
    if (deptDef) {
      const deptData = await this.prisma.masterData.findMany({
        where: { master_id: deptDef.id, is_active: true },
        select: { id: true, data: true }
      });
      departmentMasterIds = deptData.map(d => d.id);
      departments = deptData.map(d => ({
        id: Number(d.id),
        name: (d.data as any)?.name || (d.data as any)?.name_en || 'Unknown Department',
      }));
    }

    // 2. Fetch sub-departments from Dynamic Master system
    const subDeptDef = await this.prisma.masterDefinition.findFirst({
      where: { code: { contains: 'SUB_DEPARTMENT', mode: 'insensitive' }, is_active: true }
    });

    let subDepartments: any[] = [];
    if (subDeptDef) {
      const subDeptData = await this.prisma.masterData.findMany({
        where: { master_id: subDeptDef.id, is_active: true },
        select: { id: true, data: true, referencesTo: true }
      });

      // To get the linked department_id, check references (or if stored directly in data)
      subDepartments = subDeptData.map(sd => {
        const data = sd.data as any;
        // The frontend expects name_en and department_id
        return {
          id: Number(sd.id),
          name_en: data.name || data.name_en || 'Unknown Sub Dept',
          department_id: Number(data.department_id || sd.referencesTo?.[0]?.to_data_id || sd.id) // Fallback mapping
        };
      });
    }

    // 3. Fetch projects for this tenant
    const projects = await this.prisma.tenantProject.findMany({
      where: {
        is_active: true,
        tenant_id: tenantId
      },
      select: { id: true, name: true, code: true, department_id: true, sub_department_id: true }
    });

    // 4. Fetch modules for this tenant
    const modules = await this.prisma.module.findMany({
      where: {
        is_active: true,
        OR: [
          { tenant_id: tenantId },
          { tenant_id: null },
        ],
      },
      select: { id: true, name: true, code: true, department_id: true, tenant_project_id: true },
    });

    // 5. Fetch services
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
      select: { id: true, service_id: true, service_name: true, department_id: true },
    });

    return { departments, subDepartments, projects, modules, services };
  }

  async getFormTypes() {
    return this.prisma.formType.findMany({
      where: { isActive: true },
      select: { id: true, name: true, abbr: true },
      orderBy: { id: 'asc' },
    });
  }

  async getRoles(tenantId: number) {
    return this.prisma.roles.findMany({
      where: { tenant_id: tenantId },
      select: { id: true, name: true, description: true }
    });
  }

  async createDefinition(tenantId: number, userId: bigint, dto: CreateWorkflowDefDto) {
    const existing = await this.prisma.workflowConfiguration.findFirst({
      where: {
        tenantId,
        departmentId: dto.departmentId,
        code: dto.code,
      }
    });

    if (existing) {
      throw new BadRequestException('Workflow code already exists for this department');
    }

    return this.prisma.workflowConfiguration.create({
      data: {
        tenantId,
        departmentId: dto.departmentId,
        subDepartmentId: dto.subDepartmentId,
        projectId: dto.projectId,
        moduleId: dto.moduleId,
        serviceId: dto.serviceId || null,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        version: 1,
        status: 'DRAFT',
        createdBy: userId,
        configuration: {
          processes: [],
          fieldPermissions: []
        }
      }
    });
  }

  async getDefinitions(tenantId: number, departmentId?: number) {
    const where: any = { tenantId };
    if (departmentId) where.departmentId = Number(departmentId);

    const definitions = await this.prisma.workflowConfiguration.findMany({
      where,
      orderBy: { updatedAt: 'desc' }
    });

    // Stitch department name from Dynamic Master system
    const deptDef = await this.prisma.masterDefinition.findFirst({
      where: {
        code: { contains: 'DEPARTMENT', mode: 'insensitive' },
        NOT: { code: { contains: 'SUB_DEPARTMENT', mode: 'insensitive' } },
        is_active: true
      }
    });

    let deptDataMap = new Map<number, string>();
    if (deptDef) {
      const deptData = await this.prisma.masterData.findMany({
        where: { master_id: deptDef.id, is_active: true },
        select: { id: true, data: true }
      });
      deptData.forEach(d => {
        const name = (d.data as any)?.name || (d.data as any)?.name_en || 'Unknown Department';
        deptDataMap.set(Number(d.id), name);
      });
    }

    return definitions.map(def => {
      const config = def.configuration as any as WorkflowConfigJSON;
      return {
        ...def,
        department: {
          name: deptDataMap.get(Number(def.departmentId)) || 'Unknown Department'
        },
        processes: config.processes || []
      };
    });
  }

  async getDefinitionById(id: number, tenantId: number) {
    const def = await this.prisma.workflowConfiguration.findFirst({
      where: { id, tenantId },
    });

    if (!def) throw new NotFoundException('Workflow definition not found');
    
    // Map JSON back to the legacy shape for frontend compat if needed
    // or just return the record.
    const config = def.configuration as any as WorkflowConfigJSON;
    return {
      ...def,
      processes: config.processes.map(p => ({
        ...p,
        id: p.processCode, // Use code as ID for frontend compat
        actions: p.actions,
        outgoingTransitions: p.actions.flatMap(a => a.transitions.map(t => ({
          ...t,
          sourceProcessId: p.processCode,
          targetProcessId: t.targetProcessCode,
          actionCode: a.actionCode
        })))
      }))
    };
  }

  async updateDefinition(id: number, tenantId: number, dto: UpdateWorkflowDefDto) {
    return this.prisma.workflowConfiguration.update({
      where: { id },
      data: dto
    });
  }

  async archiveDefinition(id: number, tenantId: number) {
    // Soft delete / Archive
    return this.prisma.workflowConfiguration.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }

  private async validateGraph(def: any): Promise<string[]> {
    const errors: string[] = [];
    const processes = (def.configuration as any).processes as WorkflowProcessJSON[];
    
    if (!processes || processes.length === 0) {
      errors.push('Workflow has no processes.');
      return errors;
    }

    const startNodes = processes.filter((p) => p.nodeType === 'START');
    const endNodes = processes.filter((p) => p.nodeType === 'END');

    if (startNodes.length === 0) {
      errors.push('Workflow must have exactly one START process.');
    } else if (startNodes.length > 1) {
      errors.push('Workflow cannot have more than one START process.');
    }

    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one END process.');
    }

    // Process-level validations
    for (const process of processes) {
      if (process.nodeType !== 'END') {
        // Assignee validation for non-APPLICANT steps
        if (process.assigneeType !== AssigneeType.APPLICANT) {
          if (!process.roleId && !process.userId && !process.roleName) {
            errors.push(`Process "${process.name}" must have an assigned role or user.`);
          }
        }

        // Action validation: START, STANDARD, and CONDITIONAL nodes must have actions to move forward
        if (!process.actions || process.actions.length === 0) {
          errors.push(`Process "${process.name}" must have at least one permitted action.`);
        } else {
          for (const action of process.actions) {
            if (!action.transitions || action.transitions.length === 0) {
              errors.push(`Action "${action.actionLabel}" in process "${process.name}" does not connect to any target process.`);
            }
          }
        }
      }
    }

    return errors;
  }

  async publishDefinition(id: number, tenantId: number) {
    const def = await this.prisma.workflowConfiguration.findFirst({
      where: { id, tenantId }
    });
    if (!def) throw new NotFoundException('Workflow not found');

    const errors = await this.validateGraph(def);
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Workflow validation failed',
        errors: errors
      });
    }

    // Mark old versions as ARCHIVED
    await this.prisma.workflowConfiguration.updateMany({
      where: { tenantId, code: def.code, id: { not: id }, status: 'PUBLISHED' },
      data: { status: 'ARCHIVED' }
    });

    return this.prisma.workflowConfiguration.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });
  }

  async bulkSaveCanvas(tenantId: number, dto: BulkSaveCanvasDto) {
    const { workflowDefId, nodes, edges } = dto;

    // Begin transaction to replace the entire graph for this version
    return this.prisma.$transaction(async (tx) => {
      // 1. Convert React Flow structure to consolidated JSON
      const processes: WorkflowProcessJSON[] = nodes.map((node) => {
        const processCode = node.id;
        
        // Find matching transitions for THIS node from edges
        const nodeActions: WorkflowActionJSON[] = (node.data?.actions || []).map((action: any, index: number) => {
          // Strictly match handle if it exists, otherwise fallback to all edges for legacy/manual connections
          const hasSpecificEdges = edges.some(e => e.source === node.id && e.sourceHandle === action.actionCode);
          const actionEdges = edges.filter(e => 
            e.source === node.id && 
            (hasSpecificEdges ? e.sourceHandle === action.actionCode : !e.sourceHandle)
          );
          
          const transitions = actionEdges.map(e => ({
            targetProcessCode: e.target,
            label: e.label,
            priority: e.data?.priority || 0,
            conditionJson: e.data?.conditionJson,
            conditionLabel: e.data?.conditionLabel,
          }));

          // Deduplicate transitions by creating a unique key for each
          const uniqueTransitions = transitions.filter((t, i, self) => 
            i === self.findIndex((x) => (
              x.targetProcessCode === t.targetProcessCode && 
              x.label === t.label && 
              JSON.stringify(x.conditionJson) === JSON.stringify(t.conditionJson) &&
              x.priority === t.priority
            ))
          );

          return {
            actionCode: action.actionCode,
            actionLabel: action.actionLabel || action.actionCode,
            requiresComment: action.requiresComment || false,
            requiresDocument: action.requiresDocument || false,
            requiresReason: action.requiresReason || false,
            displayOrder: index,
            transitions: uniqueTransitions
          };
        });

        return {
          processCode,
          stepOrder: Number(node.data?.stepOrder || 0),
          name: node.data?.label || node.id,
          nodeType: node.data?.nodeType || 'STANDARD',
          assigneeType: node.data?.assigneeType || 'ROLE',
          roleId: node.data?.roleId ? Number(node.data.roleId) : null,
          roleName: node.data?.roleName,
          userId: node.data?.userId ? BigInt(node.data.userId) : null,
          formTypeId: node.data?.formTypeId ? Number(node.data.formTypeId) : null,
          slaHours: Number(node.data?.slaHours || 0),
          slaBreachAction: node.data?.slaBreachAction || 'NONE',
          slaBreachPercentage: node.data?.slaBreachPercentage ? Number(node.data.slaBreachPercentage) : null,
          canVerifyDocument: !!node.data?.canVerifyDocument,
          canRevertToApplicant: !!node.data?.canRevertToApplicant,
          allowPaymentDemand: !!node.data?.allowPaymentDemand,
          challanRules: node.data?.challanRules || [],
          positionX: Number(node.position?.x || 0),
          positionY: Number(node.position?.y || 0),
          actions: nodeActions,
          forkJoinMetadata: null, // Will populate below
        };
      });

      // 2. Map Fork/Join Metadata from DTO
      if (dto.forkJoins && Array.isArray(dto.forkJoins)) {
        for (const fj of dto.forkJoins) {
          const forkNode = processes.find(p => p.processCode === fj.forkNodeId);
          const joinNode = processes.find(p => p.processCode === fj.joinNodeId);

          if (forkNode) {
            forkNode.forkJoinMetadata = {
              type: 'FORK',
              partnerProcessCode: fj.joinNodeId,
              branchProcessCodes: fj.branches?.map((b: any) => b.branchProcessId),
            };
          }

          if (joinNode) {
            joinNode.forkJoinMetadata = {
              type: 'JOIN',
              partnerProcessCode: fj.forkNodeId,
              joinStrategy: fj.joinStrategy || 'ALL',
            };
          }
        }
      }

      const configuration: WorkflowConfigJSON = {
        processes,
        fieldPermissions: [], // TODO: Map permissions if available in DTO
      };

      // 3. Validate Relational IDs (Role, FormType)
      const roleIds = Array.from(new Set(processes.map(p => p.roleId).filter(id => id !== null && id !== undefined))) as number[];
      if (roleIds.length > 0) {
        const existingRoles = await tx.roles.findMany({ where: { id: { in: roleIds } } });
        if (existingRoles.length !== roleIds.length) {
          const foundIds = existingRoles.map(r => r.id);
          const missingIds = roleIds.filter(id => !foundIds.includes(id));
          throw new BadRequestException(`Following role IDs are invalid: ${missingIds.join(', ')}`);
        }
      }

      // 3. Update the configuration record
      return tx.workflowConfiguration.update({
        where: { id: workflowDefId },
        data: {
          configuration: configuration as any,
        }
      });
    });
  }

  // ─── ORPHANED INSTANCES ──────────────────────────────
  async getOrphanedInstances(tenantId: number) {
    return this.prisma.tWorkflowForwardLevel.findMany({
      where: {
        tenantId,
        status: 'ORPHANED',
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async reassignOrphanedInstance(instanceId: bigint, newProcessCode: string, tenantId: number, actorUserId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.tWorkflowForwardLevel.findFirst({
        where: { id: instanceId, tenantId, status: 'ORPHANED' },
        include: { configuration: true }
      });
      if (!instance || !instance.configuration) throw new NotFoundException('Orphaned instance with config not found');

      const config = instance.configuration.configuration as any as WorkflowConfigJSON;
      const targetProcess = config.processes.find(p => p.processCode === newProcessCode);
      if (!targetProcess) throw new BadRequestException(`Process ${newProcessCode} not found in configuration`);

      await tx.tWorkflowForwardLevel.update({
        where: { id: instanceId },
        data: {
          currentProcessCode: newProcessCode,
          currentProcessName: targetProcess.name,
          status: 'ACTIVE',
          orphanReason: null,
          currentRoleId: targetProcess.roleId || null,
        },
      });

      await tx.tWorkflowAudit.create({
        data: {
          forwardLevelId: instanceId,
          fromProcessCode: instance.currentProcessCode,
          fromProcessName: instance.currentProcessName,
          toProcessCode: newProcessCode,
          toProcessName: targetProcess.name,
          actionCode: 'REASSIGN',
          actorUserId,
          remarks: 'Reassigned from orphaned state by Tenant Admin',
        },
      });

      return { success: true };
    });
  }

  async bulkActionOrphaned(tenantId: number, instanceIds: bigint[], action: 'REASSIGN' | 'FORCE_COMPLETE' | 'CANCEL', targetProcessCode: string | null, actorUserId: bigint) {
    const results: any[] = [];

    for (const id of instanceIds) {
      try {
        if (action === 'REASSIGN' && targetProcessCode) {
          await this.reassignOrphanedInstance(id, targetProcessCode, tenantId, actorUserId);
        } else if (action === 'FORCE_COMPLETE') {
          // ... similarly update forward level status
        }
        results.push({ id: id.toString(), success: true });
      } catch (err: any) {
        results.push({ id: id.toString(), success: false, error: err.message });
      }
    }

    return { results };
  }
}
