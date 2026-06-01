import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { WorkflowBuilderConditionService } from './workflow-builder-condition.service';
import { WorkflowConfigJSON, WorkflowConfigResolver, WorkflowProcessJSON } from './workflow-config-resolver';

@Injectable()
export class WorkflowBuilderEngineService {
  private readonly logger = new Logger(WorkflowBuilderEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionService: WorkflowBuilderConditionService,
  ) { }

  /**
   * Start a new workflow instance when an application is submitted.
   * Finds the published definition for the given service, creates a forward level row,
   * and auto-transitions from START to the first real process step.
   */
  async startInstance(params: {
    tenantId: number;
    departmentId: number;
    serviceId: string;
    applicationId: bigint;
    actorUserId?: bigint;
  }) {
    const { tenantId, departmentId, serviceId, applicationId, actorUserId } = params;

    // Find the PUBLISHED definition for this service (service-level lookup)
    const definition = await this.prisma.workflowConfiguration.findFirst({
      where: {
        serviceId,
        status: 'PUBLISHED',
      },
      orderBy: { version: 'desc' }
    });

    if (!definition) {
      throw new NotFoundException('No published workflow found for this service');
    }

    const config = definition.configuration as any as WorkflowConfigJSON;
    const resolver = new WorkflowConfigResolver(config);

    // Find the START node via resolver
    const startProcess = resolver.getStartProcess();
    if (!startProcess) {
      throw new BadRequestException('Workflow has no START node');
    }

    // Find the first real process to auto-transition to (from START's first action → first transition)
    const startAction = startProcess.actions?.[0];
    const firstTransition = startAction?.transitions?.[0];
    const firstProcess = firstTransition
      ? resolver.getProcessByCode(firstTransition.targetProcessCode)
      : null;

    const targetProcess = firstProcess || startProcess;

    // Create runtime forward level row
    const instance = await this.prisma.tWorkflowForwardLevel.create({
      data: {
        configId: definition.id,
        tenantId,
        departmentId,
        applicationId,
        currentProcessCode: targetProcess.processCode,
        currentProcessName: targetProcess.name,
        forwardLevel: 1,
        currentRoleId: targetProcess.roleId || null,
        activeProcessIds: [targetProcess.processCode] as any,
        status: 'ACTIVE',
      },
    });

    // Create initial audit log
    await this.prisma.tWorkflowAudit.create({
      data: {
        forwardLevelId: instance.id,
        fromProcessCode: startProcess.processCode,
        fromProcessName: startProcess.name,
        toProcessCode: targetProcess.processCode,
        toProcessName: targetProcess.name,
        actionCode: 'START',
        actorUserId: actorUserId || BigInt(0),
        remarks: 'Application submitted. Workflow started.',
      },
    });

    // Also create a t_forward_application entry so the officer inbox can find this application
    const now = new Date();
    await this.prisma.forwardApplication.create({
      data: {
        appSubId: Number(applicationId),
        nextRoleId: targetProcess.roleId || null,
        forwardedDeptId: departmentId,
        actionStatus: 'P',
        approvStatus: 'P',
        createdOn: now,
        userAgent: 'WorkflowEngineV2',
      },
    });

    // ─── Sync with legacy ApplicationHistory ───
    await this.logHistory({
      applicationId,
      serviceId,
      departmentId,
      statusName: targetProcess.name,
      remarks: 'Application submitted. Workflow started.',
      actorUserId,
      nextRoleId: targetProcess.roleId || undefined,
    });

    this.logger.log(`Forward level ${instance.id} created for application ${applicationId} at step "${targetProcess.name}"`);
    return {
      id: instance.id.toString(),
      applicationId: instance.applicationId.toString(),
      status: instance.status,
      currentStep: targetProcess.name,
      forwardLevel: instance.forwardLevel,
    };
  }

  /**
   * Executes an action on a workflow instance (FORWARD, APPROVE, REJECT, REVERT, HOLD).
   * Evaluates conditional transitions and moves the instance to the next process.
   */
  async executeAction(params: {
    forwardLevelId: bigint;
    actionCode: string;
    actorUserId: bigint;
    actorRoleId?: number;
    remarks?: string;
    applicationData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { forwardLevelId, actionCode, actorUserId, actorRoleId, remarks, applicationData, ipAddress, userAgent } = params;

    const instance = await this.prisma.tWorkflowForwardLevel.findUnique({
      where: { id: forwardLevelId },
      include: { configuration: true }
    });

    if (!instance || !instance.configuration) throw new NotFoundException('Workflow instance or configuration not found');
    if (instance.status !== 'ACTIVE' && instance.status !== 'WAITING_JOIN') {
      throw new BadRequestException(`Cannot execute action on instance with status ${instance.status}`);
    }

    const config = instance.configuration.configuration as any as WorkflowConfigJSON;
    const resolver = new WorkflowConfigResolver(config);
    const currentProcess = resolver.getProcessByCode(instance.currentProcessCode || '');

    if (!currentProcess) throw new NotFoundException('Current process step not found in configuration');

    // Verify the action is available at this step
    const processAction = currentProcess.actions.find((a) => a.actionCode === actionCode);
    if (!processAction) {
      throw new BadRequestException(`Action "${actionCode}" is not available at step "${currentProcess.name}"`);
    }

    // Find matching transitions for this action
    const transitions = processAction.transitions;

    if (transitions.length === 0) {
      throw new BadRequestException(`No transition defined for action "${actionCode}" from step "${currentProcess.name}"`);
    }

    // Evaluate conditions to find the right transition
    let matchedTransition: any = null;
    let conditionMatchedLabel = '';

    for (const transition of transitions) {
      if (!transition.conditionJson) {
        // Unconditional fallback (priority 0)
        if (!matchedTransition) {
          matchedTransition = transition;
          conditionMatchedLabel = 'Default (unconditional)';
        }
      } else {
        // Evaluate condition against application data
        const matches = this.conditionService.evaluateCondition(
          transition.conditionJson,
          applicationData || {},
        );
        if (matches) {
          matchedTransition = transition;
          conditionMatchedLabel = transition.conditionLabel || JSON.stringify(transition.conditionJson);
          break; // First matching condition wins (sorted by priority desc)
        }
      }
    }

    if (!matchedTransition) {
      throw new BadRequestException('No matching transition found. Check conditions.');
    }

    const targetProcess = resolver.getProcessByCode(matchedTransition.targetProcessCode);
    if (!targetProcess) throw new BadRequestException(`Target process ${matchedTransition.targetProcessCode} not found`);

    // ─── Handle FORK node ─────────────────────────
    if (targetProcess.nodeType === 'FORK') {
      return this.handleFork(instance, currentProcess, targetProcess, actorUserId, actorRoleId, remarks, conditionMatchedLabel, ipAddress, userAgent);
    }

    // ─── Handle JOIN node ─────────────────────────
    if (targetProcess.nodeType === 'JOIN') {
      return this.handleJoin(instance, currentProcess, targetProcess, actorUserId, actorRoleId, remarks, conditionMatchedLabel, ipAddress, userAgent);
    }

    // ─── Standard transition ─────────────────────
    const demand = applicationData?._paymentDemand || applicationData?.paymentDemand;
    const isChallanAction = actionCode.toUpperCase() === 'CHALLAN';
    
    // Force self-transition if payment demand exists, so it stays with the current role during PD status
    const isSelfChallan = (isChallanAction && targetProcess.processCode === currentProcess.processCode) || !!demand;
    
    const newForwardLevel = isSelfChallan ? Number(instance.forwardLevel) : Number(instance.forwardLevel) + 1;

    if (!isSelfChallan) {
      await this.prisma.tWorkflowForwardLevel.update({
        where: { id: forwardLevelId },
        data: {
          currentProcessCode: targetProcess.processCode,
          currentProcessName: targetProcess.name,
          forwardLevel: newForwardLevel,
          currentRoleId: targetProcess.roleId || null,
          activeProcessIds: [targetProcess.processCode] as any,
          status: targetProcess.nodeType === 'END' ? 'COMPLETED' : 'ACTIVE',
          completedAt: targetProcess.nodeType === 'END' ? new Date() : undefined,
        },
      });
    }

    // Create audit log
    await this.prisma.tWorkflowAudit.create({
      data: {
        forwardLevelId,
        fromProcessCode: currentProcess.processCode,
        fromProcessName: currentProcess.name,
        toProcessCode: targetProcess.processCode,
        toProcessName: targetProcess.name,
        actionCode,
        actorUserId,
        actorRoleId,
        remarks,
        conditionMatched: conditionMatchedLabel || undefined,
        ipAddress,
        userAgent,
      },
    });

    // ─── Sync with legacy ApplicationHistory ───
    await this.logHistory({
      applicationId: instance.applicationId,
      serviceId: instance.configuration.serviceId || '',
      departmentId: instance.departmentId,
      statusName: targetProcess.name,
      remarks: remarks || undefined,
      actorUserId,
      actorRoleId,
      nextRoleId: targetProcess.roleId || undefined,
    });

    // Sync t_forward_application: mark current row as actioned
    const now = new Date();
    if (!isSelfChallan) {
      await this.prisma.forwardApplication.updateMany({
        where: {
          appSubId: Number(instance.applicationId),
          nextRoleId: actorRoleId || null,
          approvStatus: 'P',
        },
        data: {
          verifierUserId: Number(actorUserId),
          actionStatus: actionCode.slice(0, 10), // Truncate to match DB schema (VarChar 10)
          verifierUserComment: remarks || null,
          approvStatus: 'V',
          updatedDateTime: now,
          commentDate: now,
        },
      });

      // If not END, create a new forward row for the next step's role
      if (targetProcess.nodeType !== 'END') {
        await this.prisma.forwardApplication.create({
          data: {
            appSubId: Number(instance.applicationId),
            nextRoleId: targetProcess.roleId || null,
            forwardedDeptId: instance.departmentId,
            actionStatus: actionCode,
            approvStatus: 'P',
            createdOn: now,
            userAgent: userAgent || 'WorkflowEngineV2',
          },
        });
      }
    } else {
      // Just update current row for challan generation
      await this.prisma.forwardApplication.updateMany({
        where: {
          appSubId: Number(instance.applicationId),
          nextRoleId: actorRoleId || null,
          approvStatus: 'P',
        },
        data: {
          verifierUserComment: remarks || null,
          updatedDateTime: now,
        },
      });
    }

    // Sync t_application_submission status so investor dashboard reflects the correct state
    const V2_TO_SUB_STATUS: Record<string, string> = {
      FORWARD: 'F',
      APPROVE: 'A',
      REJECT: 'R',
      REVERT: 'H',
      RBI: 'H',
    };
    // If target is START node (reject/revert back to applicant), mark as 'H' (reverted)
    const subStatus = targetProcess.nodeType === 'START'
      ? 'H'
      : targetProcess.nodeType === 'END'
        ? (V2_TO_SUB_STATUS[actionCode.toUpperCase()] || 'A')
        : (actionCode.toUpperCase() === 'REVERT' || actionCode.toUpperCase() === 'RBI' ? 'F' : (V2_TO_SUB_STATUS[actionCode.toUpperCase()] || 'F'));

    // ─── Save Application Data (Officer Form Fields) ─────────────────────
    if (applicationData && Object.keys(applicationData).length > 0) {
      await this.saveSubmissionData({
        applicationId: instance.applicationId,
        serviceId: instance.configuration.serviceId || '',
        departmentId: instance.departmentId,
        userId: actorUserId,
        formData: applicationData,
      });
    }

    // ─── Handle Payment Demand Generation ────────────────────────────────
    let finalSubStatus = subStatus;

    if (demand && (currentProcess.allowPaymentDemand || (processAction.payload as any)?.allowPaymentDemand)) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Create Payment Detail record
        await tx.paymentDetail.create({
          data: {
            applicationId: Number(instance.applicationId),
            appSubId: Number(instance.applicationId),
            userId: Number(actorUserId),
            amount: Number(demand.totalAmount || 0),
            totalAmount: Number(demand.totalAmount || 0),
            trnReqDate: new Date().toISOString(),
            statusCode: 'P',
            bifurcationDetails: demand.bifurcations || [],
            statusDescription: 'Payment demand generated by department (V2)',
            txnMsg: 'PENDING',
            txnStatus: 'PENDING',
            txnErrMsg: '',
            clntTxnRef: `DEMAND_${instance.applicationId}_${Date.now()}`,
            clntRqstMeta: '{}',
            worldlineMerchantTransactionId: '',
            hashToken: '',
            token: '',
            worldlineMerchantTransactionTime: new Date(),
            created: new Date(),
          }
        });

        // 2. Sync t_forward_application (Audit Trail)
        await tx.forwardApplication.create({
          data: {
            appSubId: Number(instance.applicationId),
            nextRoleId: actorRoleId || currentProcess.roleId || null,
            forwardedDeptId: instance.departmentId,
            actionStatus: 'CHALLAN',
            approvStatus: 'PD',
            createdOn: now,
            userAgent: userAgent || 'WorkflowEngineV2',
          }
        });

        // 3. Sync t_sp_applications (Single Window Sync)
        await tx.spApplication.updateMany({
          where: { spAppId: String(instance.applicationId) },
          data: { 
            appStatus: 'PD',
            updatedOn: now
          }
        });

        // 4. Sync t_application_history (Timeline View)
        await tx.applicationHistory.create({
          data: {
            spTag: 'CHALLAN',
            appId: String(instance.applicationId),
            applicationStatus: 'PD',
            comments: `Payment demand generated for amount ₹${demand.totalAmount}.`,
            roleId: String(currentProcess.roleId || 0),
            addedDateTime: now,
          }
        });

        // Force final status to PD
        finalSubStatus = 'PD';
      });
    }

    await this.prisma.applicationSubmission.update({
      where: { submissionId: Number(instance.applicationId) },
      data: {
        applicationStatus: finalSubStatus,
        applicationUpdatedDateTime: now,
      },
    });

    this.logger.log(`Instance ${forwardLevelId}: ${actionCode} from "${currentProcess.name}" → "${targetProcess.name}"`);

    return {
      success: true,
      fromStep: currentProcess.name,
      toStep: targetProcess.name,
      status: targetProcess.nodeType === 'END' ? 'COMPLETED' : 'ACTIVE',
      conditionMatched: conditionMatchedLabel,
    };
  }

  /**
   * Handle FORK: split into parallel branches
   */
  private async handleFork(
    instance: any,
    fromProcess: any,
    forkProcess: any,
    actorUserId: bigint,
    actorRoleId?: number,
    remarks?: string,
    conditionMatchedLabel?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const forkMetadata = forkProcess.forkJoinMetadata;

    if (!forkMetadata || forkMetadata.type !== 'FORK' || !forkMetadata.branchProcessCodes) {
      throw new BadRequestException(`Process ${forkProcess.processCode} is not correctly configured as a FORK`);
    }

    const branchProcessCodes = forkMetadata.branchProcessCodes;

    await this.prisma.tWorkflowForwardLevel.update({
      where: { id: instance.id },
      data: {
        currentProcessCode: forkProcess.processCode,
        currentProcessName: forkProcess.name,
        activeProcessIds: branchProcessCodes as any,
        status: 'ACTIVE',
      },
    });

    await this.prisma.tWorkflowAudit.create({
      data: {
        forwardLevelId: instance.id,
        fromProcessCode: fromProcess.processCode,
        fromProcessName: fromProcess.name,
        toProcessCode: forkProcess.processCode,
        toProcessName: forkProcess.name,
        actionCode: 'FORK',
        actorUserId,
        actorRoleId,
        remarks: remarks || `Forked into ${branchProcessCodes.length} parallel branches`,
        conditionMatched: conditionMatchedLabel,
        ipAddress,
        userAgent,
      },
    });

    // ─── Sync with legacy ApplicationHistory ───
    await this.logHistory({
      applicationId: instance.applicationId,
      serviceId: instance.configuration.serviceId || '',
      departmentId: instance.departmentId,
      statusName: forkProcess.name,
      remarks: remarks || `Forked into ${branchProcessCodes.length} parallel branches`,
      actorUserId,
      actorRoleId,
    });

    return {
      success: true,
      action: 'FORK',
      branches: branchProcessCodes,
    };
  }

  /**
   * Handle JOIN: wait for all parallel branches to complete
   */
  private async handleJoin(
    instance: any,
    fromProcess: any,
    joinProcess: any,
    actorUserId: bigint,
    actorRoleId?: number,
    remarks?: string,
    conditionMatchedLabel?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const joinMetadata = joinProcess.forkJoinMetadata;

    if (!joinMetadata || joinMetadata.type !== 'JOIN') {
      throw new BadRequestException(`Process ${joinProcess.processCode} is not correctly configured as a JOIN`);
    }

    // Remove fromProcess from active list
    const activeCodes: string[] = (instance.activeProcessIds as string[]) || [];
    const remaining = activeCodes.filter((code) => code !== fromProcess.processCode);

    if (remaining.length > 0 && joinMetadata.joinStrategy === 'ALL') {
      // Still waiting for other branches
      await this.prisma.tWorkflowForwardLevel.update({
        where: { id: instance.id },
        data: {
          activeProcessIds: remaining as any,
          status: 'WAITING_JOIN',
        },
      });

      await this.prisma.tWorkflowAudit.create({
        data: {
          forwardLevelId: instance.id,
          fromProcessCode: fromProcess.processCode,
          fromProcessName: fromProcess.name,
          toProcessCode: joinProcess.processCode,
          toProcessName: joinProcess.name,
          actionCode: 'JOIN_WAIT',
          actorUserId,
          actorRoleId,
          remarks: `Branch completed. Waiting for ${remaining.length} more branch(es).`,
          ipAddress,
          userAgent,
        },
      });

      // ─── Sync with legacy ApplicationHistory ───
      await this.logHistory({
        applicationId: instance.applicationId,
        serviceId: instance.configuration.serviceId || '',
        departmentId: instance.departmentId,
        statusName: joinProcess.name,
        remarks: `Branch completed. Waiting for ${remaining.length} more branch(es).`,
        actorUserId,
        actorRoleId,
      });

      return {
        success: true,
        action: 'JOIN_WAIT',
        remaining: remaining.length,
      };
    }

    // All branches done (or ANY strategy) → proceed past JOIN
    // In consolidated version, JOIN transition is resolved from config
    const config = instance.configuration.configuration as any as WorkflowConfigJSON;
    const resolver = new WorkflowConfigResolver(config);
    const joinedProcess = resolver.getProcessByCode(joinProcess.processCode);
    const firstAction = joinedProcess?.actions?.[0];
    const firstTransition = firstAction?.transitions?.[0];

    const nextProcessCode = firstTransition?.targetProcessCode || joinProcess.processCode;
    const nextProcess = resolver.getProcessByCode(nextProcessCode);

    await this.prisma.tWorkflowForwardLevel.update({
      where: { id: instance.id },
      data: {
        currentProcessCode: nextProcessCode,
        currentProcessName: nextProcess?.name || 'Next Step',
        activeProcessIds: [nextProcessCode] as any,
        status: 'ACTIVE',
      },
    });

    await this.prisma.tWorkflowAudit.create({
      data: {
        forwardLevelId: instance.id,
        fromProcessCode: fromProcess.processCode,
        fromProcessName: fromProcess.name,
        toProcessCode: nextProcessCode,
        toProcessName: nextProcess?.name || 'Next Step',
        actionCode: 'JOIN_COMPLETE',
        actorUserId,
        actorRoleId,
        remarks: remarks || 'All branches completed. Join resolved.',
        conditionMatched: conditionMatchedLabel,
        ipAddress,
        userAgent,
      },
    });

    // ─── Sync with legacy ApplicationHistory ───
    await this.logHistory({
      applicationId: instance.applicationId,
      serviceId: instance.configuration.serviceId || '',
      departmentId: instance.departmentId,
      statusName: nextProcess?.name || 'Next Step',
      remarks: remarks || 'All branches completed. Join resolved.',
      actorUserId,
      actorRoleId,
      nextRoleId: nextProcess?.roleId || undefined,
    });

    return {
      success: true,
      action: 'JOIN_COMPLETE',
      nextProcess: nextProcessCode,
    };
  }

  /**
   * Mark instances as ORPHANED when a role is removed from a workflow.
   */
  async orphanInstancesByRole(workflowDefId: number, roleId: number) {
    // Find all processes that used this role
    const processes = await this.prisma.workflowProcess.findMany({
      where: { workflowDefId, roleId },
    });

    const processIds = processes.map((p) => p.id);

    // Find active instances at those processes
    const result = await this.prisma.tWorkflowForwardLevel.updateMany({
      where: {
        workflowDefId,
        currentProcessId: { in: processIds },
        status: 'ACTIVE',
      },
      data: {
        status: 'ORPHANED',
        orphanReason: 'ROLE_REMOVED',
      },
    });

    this.logger.warn(`Orphaned ${result.count} instances for workflow ${workflowDefId} due to role ${roleId} removal`);
    return { orphanedCount: result.count };
  }

  // ─── TASK & QUERY METHODS ─────────────────────────────────

  /**
   * Find the PUBLISHED workflow definition for a given organizational context.
   */
  async findPublishedWorkflow(tenantId: number, departmentId: number, serviceId?: string, moduleId?: number) {
    const where: any = {
      tenantId,
      departmentId,
      status: 'PUBLISHED',
    };
    if (serviceId) where.serviceId = serviceId;
    if (moduleId) where.moduleId = moduleId;

    const config = await this.prisma.workflowConfiguration.findFirst({
      where,
      orderBy: { version: 'desc' }
    });

    if (!config) return null;

    // Map for frontend compatibility
    const json = config.configuration as any as WorkflowConfigJSON;
    return {
      ...config,
      processes: json.processes.map(p => ({
        ...p,
        actions: p.actions,
      })),
    };
  }

  /**
   * Get pending tasks (ACTIVE forward levels) for a specific role within a tenant.
   * This powers the Task Dashboard for department officers.
   */
  async getTasks(params: {
    tenantId: number;
    roleId?: number;
    userId?: bigint;
    departmentId?: number;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, roleId, userId, departmentId, status, page = 1, limit = 20 } = params;

    const where: any = {
      tenantId,
      status: status || 'ACTIVE',
    };

    if (departmentId) where.departmentId = departmentId;
    if (roleId) where.currentRoleId = roleId;

    const [items, total] = await Promise.all([
      this.prisma.tWorkflowForwardLevel.findMany({
        where,
        include: {
          configuration: {
            select: { id: true, name: true, code: true, configuration: true },
          },
          role: { select: { id: true, name: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tWorkflowForwardLevel.count({ where }),
    ]);

    return {
      items: items.map((item) => {
        const config = (item.configuration as any)?.configuration as WorkflowConfigJSON;
        const currentStep = config?.processes?.find(p => p.processCode === item.currentProcessCode);

        return {
          ...item,
          id: item.id.toString(),
          applicationId: item.applicationId.toString(),
          workflowDef: item.configuration,
          process: currentStep ? {
            ...currentStep,
            actions: currentStep.actions
          } : { name: item.currentProcessName }, // Fallback to snapshot
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get full detail of a single workflow instance (forward level).
   */
  async getInstanceDetail(forwardLevelId: bigint) {
    const instance = await this.prisma.tWorkflowForwardLevel.findUnique({
      where: { id: forwardLevelId },
      include: {
        configuration: {
          select: { id: true, name: true, code: true, version: true, configuration: true },
        },
        role: { select: { id: true, name: true } },
        auditLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('Workflow instance not found');
    }

    const config = (instance.configuration as any)?.configuration as WorkflowConfigJSON;
    const currentStep = config?.processes?.find(p => p.processCode === instance.currentProcessCode);

    return {
      ...instance,
      id: instance.id.toString(),
      applicationId: instance.applicationId.toString(),
      workflowDef: instance.configuration,
      process: currentStep ? {
        ...currentStep,
        actions: currentStep.actions,
        outgoingTransitions: currentStep.actions.flatMap(a => a.transitions.map(t => ({
          ...t,
          targetProcess: config.processes.find(p => p.processCode === t.targetProcessCode)
        })))
      } : { name: instance.currentProcessName },
      auditLogs: instance.auditLogs.map((log) => ({
        ...log,
        id: log.id.toString(),
        forwardLevelId: log.forwardLevelId.toString(),
        actorUserId: log.actorUserId.toString(),
      })),
    };
  }

  /**
   * Get audit trail for a workflow instance.
   */
  async getAuditTrail(forwardLevelId: bigint) {
    const logs = await this.prisma.tWorkflowAudit.findMany({
      where: { forwardLevelId },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
      forwardLevelId: log.forwardLevelId.toString(),
      actorUserId: log.actorUserId.toString(),
    }));
  }

  /**
   * Get a summary of all workflow instances for a specific application.
   */
  async getInstancesByApplication(applicationId: bigint) {
    const instances = await this.prisma.tWorkflowForwardLevel.findMany({
      where: { applicationId },
      include: {
        configuration: { select: { id: true, name: true, code: true } },
        role: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });

    return instances.map((inst) => ({
      ...inst,
      id: inst.id.toString(),
      applicationId: inst.applicationId.toString(),
      workflowDef: inst.configuration,
      process: { name: inst.currentProcessName, processCode: inst.currentProcessCode },
    }));
  }

  /**
   * Dashboard stats: count instances by status for a tenant.
   */
  async getDashboardStats(tenantId: number, departmentId?: number) {
    const where: any = { tenantId };
    if (departmentId) where.departmentId = departmentId;

    const [active, completed, orphaned, waitingJoin, total] = await Promise.all([
      this.prisma.tWorkflowForwardLevel.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.tWorkflowForwardLevel.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.tWorkflowForwardLevel.count({ where: { ...where, status: 'ORPHANED' } }),
      this.prisma.tWorkflowForwardLevel.count({ where: { ...where, status: 'WAITING_JOIN' } }),
      this.prisma.tWorkflowForwardLevel.count({ where }),
    ]);

    return { active, completed, orphaned, waitingJoin, total };
  }

  // ---------------------------------------------------------
  // FORM BINDING & SUBMISSION (PHASE 3)
  // ---------------------------------------------------------

  /**
   * Get the full form structure (pages, categories, fields) for a service and form type.
   */
  async getFormStructure(serviceId: string, formTypeId: number) {
    const mapping = await this.prisma.formMapping.findFirst({
      where: { service_id: serviceId, form_type_id: formTypeId },
      include: {
        service: { select: { service_name: true } },
      },
    });

    if (!mapping) {
      throw new NotFoundException(`No form mapping found for service ${serviceId} and form type ${formTypeId}`);
    }

    const pages = await this.prisma.formPageMaster.findMany({
      where: { service_id: serviceId, form_id: formTypeId, is_active: 'Y' },
      orderBy: { preference: 'asc' },
    });

    const pageCategoryMappings = await this.prisma.formPageCategoryMapping.findMany({
      where: { page_id: { in: pages.map((p) => p.id) }, is_active: 'Y' },
      orderBy: { preference: 'asc' },
    });

    const categories = await this.prisma.formCategory.findMany({
      where: { id: { in: pageCategoryMappings.map((m) => m.category_id) } },
    });

    const builderFields = await this.prisma.formBuilderField.findMany({
      where: {
        service_id: serviceId,
        form_id: formTypeId,
        is_active: 'Y',
      },
      include: {
        formField: { select: { name: true, formCheckId: true } },
        optionConfig: true,
      },
      orderBy: { preference: 'asc' },
    });

    return {
      serviceId,
      serviceName: mapping.service?.service_name,
      formTypeId,
      pages: pages.map((page) => {
        const pageMappings = pageCategoryMappings.filter((m) => m.page_id === page.id);
        return {
          id: page.id,
          pageName: page.page_name,
          preference: page.preference,
          categories: pageMappings.map((m) => {
            const cat = categories.find((c) => c.id === m.category_id);
            const fields = builderFields.filter(
              (f) => f.page_id === page.id && f.category_id === m.category_id
            );
            return {
              categoryId: m.category_id,
              categoryName: cat?.categoryName || cat?.nameAlt || `Category ${m.category_id}`,
              preference: m.preference,
              fields: fields.map((f) => ({
                id: f.id,
                field_code: f.formField?.formCheckId,
                builderFieldId: f.id,
                label: f.custom_label || f.formField?.name,
                input_type: f.input_type || 'TEXT',
                is_required: f.is_required === 'Y' ? 'Y' : 'N',
                is_readonly: f.is_readonly === 'Y' ? 'Y' : 'N',
                gridSpan: f.gridSpan,
                placeholder: f.placeholder,
                help_text: f.help_text,
                option_config: f.optionConfig,
                options: f.optionConfig?.static_options || null,
                validation_rule: f.validation_rule,
                component_props: f.component_props,
              })),
            };
          }),
        };
      }),
    };
  }

  /**
   * Helper to get the applicant form (FormType ID 1) for a workflow definition
   */
  async getApplicantForm(workflowDefId: number) {
    const wfDef = await this.prisma.workflowDefinition.findUnique({
      where: { id: workflowDefId },
      select: { serviceId: true },
    });

    if (!wfDef || !wfDef.serviceId) {
      throw new NotFoundException('Workflow definition does not have an associated service');
    }

    return this.getFormStructure(wfDef.serviceId, 1);
  }

  /**
   * Helper to get the processing form for a specific workflow instance step
   */
  async getProcessingForm(forwardLevelId: bigint) {
    const instance = await this.prisma.tWorkflowForwardLevel.findUnique({
      where: { id: forwardLevelId },
      include: {
        configuration: { select: { serviceId: true, configuration: true } },
      },
    });

    if (!instance || !instance.configuration) throw new NotFoundException('Instance not found');
    if (!instance.configuration.serviceId) throw new Error('Workflow has no service mapped');

    const configJSON = instance.configuration.configuration as any as WorkflowConfigJSON;
    const currentStep = configJSON.processes.find(p => p.processCode === instance.currentProcessCode);

    // 1. Try to use the form override on the specific workflow process node
    if (currentStep?.formTypeId) {
      return this.getFormStructure(instance.configuration.serviceId, currentStep.formTypeId);
    }

    // 2. Default to 'Processing Form' (ID 2)
    return this.getFormStructure(instance.configuration.serviceId, 2);
  }

  /**
   * Save submission data to the ApplicationSubmission table.
   */
  async saveSubmissionData(params: {
    applicationId: bigint;
    serviceId: string;
    departmentId: number;
    userId: bigint;
    formData: any;
    formTypeId?: number;
  }) {
    const appIdNum = Number(params.applicationId);

    const existing = await this.prisma.applicationSubmission.findFirst({
      where: { applicationId: appIdNum, serviceId: params.serviceId },
    });

    if (existing) {
      const currentData = (existing.fieldValue as Record<string, any>) || {};
      const mergedData = { ...currentData, ...params.formData };

      return this.prisma.applicationSubmission.update({
        where: { submissionId: existing.submissionId },
        data: {
          fieldValue: mergedData,
          formId: params.formTypeId || existing.formId,
        },
      });
    }

    return this.prisma.applicationSubmission.create({
      data: {
        applicationId: appIdNum,
        parentSubId: 0,
        serviceId: params.serviceId,
        deptId: params.departmentId,
        userId: params.userId,
        formId: params.formTypeId,
        fieldValue: params.formData,
        landrigionId: 0,
        ipAddress: '127.0.0.1',
        userAgent: 'WorkflowEngineV2',
      },
    });
  }

  /**
   * Internal helper to log workflow movements to the legacy ApplicationHistory table.
   * This ensures backward compatibility with dashboards and reporting that rely on t_application_history.
   */
  private async logHistory(params: {
    applicationId: bigint;
    serviceId: string;
    departmentId: number;
    statusName: string;
    remarks?: string;
    actorUserId?: bigint;
    actorRoleId?: number;
    nextRoleId?: number;
  }) {
    try {
      const { applicationId, serviceId, departmentId, statusName, remarks, actorUserId, actorRoleId, nextRoleId } = params;

      // 1. Resolve spTag from Department
      const department = await this.prisma.department.findUnique({
        where: { id: departmentId },
        select: { uniqueTag: true }
      });
      const spTag = department?.uniqueTag || 'SINGLE_WINDOW';

      // 2. Resolve sno from spApplication (mapping legacy appId to submissionId)
      const spApp = await this.prisma.spApplication.findFirst({
        where: { appId: applicationId },
        select: { sno: true }
      });

      // 3. Create ApplicationHistory entry
      await this.prisma.applicationHistory.create({
        data: {
          sno: spApp?.sno || null,
          serviceId,
          spTag,
          appId: applicationId.toString(),
          applicationStatus: statusName,
          comments: remarks || null,
          approverId: actorUserId ? actorUserId.toString() : null,
          roleId: actorRoleId ? actorRoleId.toString() : null,
          nextRoleId: nextRoleId ? nextRoleId.toString() : null,
          addedDateTime: new Date(),
        }
      });
    } catch (error) {
      this.logger.error(`Failed to log application history for app ${params.applicationId}:`, error);
      // We don't want to fail the entire workflow transaction if history logging fails
    }
  }
}
