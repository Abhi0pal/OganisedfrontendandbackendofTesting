import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkflowConfigDto, UpdateWorkflowConfigDto } from './dto';

const toProcessingLevel = (jurisdictionCode?: string) =>
  String(jurisdictionCode || '').toUpperCase() === 'STATE'
    ? 'State'
    : 'District';

const toActiveStatus = (value?: boolean) => (value ? 'Y' : 'N');

@Injectable()
export class WorkflowConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeActionCode(action: string): string {
    const raw = String(action || '').trim().toUpperCase();
    const aliasMap: Record<string, string> = {
      FORWARD: 'F',
      F: 'F',
      FORWARD_TO_APPROVER: 'FA',
      FA: 'FA',
      REVERT_TO_INVESTOR: 'RBI',
      RBI: 'RBI',
      APPROVE: 'A',
      A: 'A',
      REJECT: 'R',
      R: 'R',
      PENDING: 'P',
      P: 'P',
      HOLD: 'H',
      H: 'H',
    };
    return aliasMap[raw] || raw;
  }

  private normalizeWorkflowFormType(formTypeValue?: string | null): string {
    const raw = String(formTypeValue || '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    const aliasMap: Record<string, string> = {
      AF: 'APPLICANT_FORM',
      APPLICANT_FORM: 'APPLICANT_FORM',
      PF: 'PROCESSING_FORM',
      PROCESSING_FORM: 'PROCESSING_FORM',
      PV: 'PROCESSING_FORM_VERIFIER_LEVEL',
      PFVL: 'PROCESSING_FORM_VERIFIER_LEVEL',
      PROCESSING_FORM_VERIFICATION_LEVEL: 'PROCESSING_FORM_VERIFIER_LEVEL',
      PROCESSING_FORM_VERIFIER_LEVEL: 'PROCESSING_FORM_VERIFIER_LEVEL',
      AL: 'APPROVER_LEVEL_PROCESSING_FORM',
      PFAL: 'APPROVER_LEVEL_PROCESSING_FORM',
      APPROVER_LEVEL_PROCESSING_FORM: 'APPROVER_LEVEL_PROCESSING_FORM',
    };
    return aliasMap[raw] || raw;
  }

  private async resolveVerifierLevelFormTypeId() {
    const verifier = await this.prisma.formType.findFirst({
      where: {
        OR: [
          { abbr: { in: ['PV', 'PFVL', 'PROCESSING_FORM_VERIFIER_LEVEL'] } },
          { name: { contains: 'Verification Level', mode: 'insensitive' } },
          { name: { contains: 'Verifier Level', mode: 'insensitive' } },
        ],
      },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    return verifier?.id ?? null;
  }

  // BUSINESS RULE: nodal verifier step (step 2, role 7) must use verifier-level processing form type.
  private async normalizeWorkflowFormTypeId(params: {
    formTypeId?: number;
    step?: number;
    roleId?: number;
    currentRoleId?: number;
  }) {
    const inputFormTypeId = Number(params.formTypeId || 0);
    if (!Number.isFinite(inputFormTypeId) || inputFormTypeId <= 0) {
      return params.formTypeId;
    }
    const formType = await this.prisma.formType.findUnique({
      where: { id: inputFormTypeId },
      select: { id: true, name: true, abbr: true },
    });
    if (!formType) return inputFormTypeId;

    const canonical = this.normalizeWorkflowFormType(
      formType.abbr || formType.name || '',
    );
    const step = Number(params.step || 0);
    const roleId = Number(params.roleId || params.currentRoleId || 0);
    if (step === 2 && roleId === 7 && canonical === 'PROCESSING_FORM') {
      const verifierFormTypeId = await this.resolveVerifierLevelFormTypeId();
      return verifierFormTypeId || inputFormTypeId;
    }
    return inputFormTypeId;
  }

  private async resolveJurisdiction(id?: number) {
    if (id) {
      return this.prisma.workflowJurisdictionLevelMaster.findUnique({
        where: { id },
      });
    }
    return this.prisma.workflowJurisdictionLevelMaster.findFirst({
      where: { code: 'DISTRICT', isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  private async resolveAssignmentStrategy(id?: number) {
    if (id) {
      return this.prisma.workflowAssignmentStrategyMaster.findUnique({
        where: { id },
      });
    }
    return this.prisma.workflowAssignmentStrategyMaster.findFirst({
      where: { code: 'ROLE', isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  private async resolveActions(input?: {
    actionMasterIds?: number[];
    actionAllowedJson?: string[];
  }) {
    const actionIds =
      input?.actionMasterIds
        ?.map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0) || [];
    const actionCodesFromPayload =
      input?.actionAllowedJson
        ?.map((x) =>
          String(x || '')
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean) || [];

    let actions = [] as Array<{ id: number; code: string }>;
    if (actionIds.length) {
      actions = await this.prisma.workflowActionMaster.findMany({
        where: { id: { in: actionIds } },
        select: { id: true, code: true },
      });
    } else if (actionCodesFromPayload.length) {
      actions = await this.prisma.workflowActionMaster.findMany({
        where: { code: { in: actionCodesFromPayload } },
        select: { id: true, code: true },
      });
    } else {
      actions = await this.prisma.workflowActionMaster.findMany({
        where: {
          code: { in: ['F', 'A', 'R', 'FORWARD', 'APPROVE', 'REJECT'] },
          isActive: true,
        },
        orderBy: { id: 'asc' },
        select: { id: true, code: true },
      });
    }

    return {
      actionMasterIds: actions.map((a) => Number(a.id)),
      actionAllowedJson: actions
        .map((a) => this.normalizeActionCode(String(a.code || '')))
        .filter(Boolean),
    };
  }

  private normalizeTransitionMap(transitionMapJson: any) {
    if (!transitionMapJson || typeof transitionMapJson !== 'object') {
      return transitionMapJson;
    }
    const normalized: Record<string, any> = {};
    Object.entries(transitionMapJson as Record<string, any>).forEach(
      ([actionCode, payload]) => {
        const canonicalAction = this.normalizeActionCode(actionCode);
        normalized[canonicalAction] = payload;
      },
    );
    return normalized;
  }

  findAll(filters?: {
    serviceId?: string;
    departmentId?: number;
    processingLevel?: string;
    formTypeId?: number;
    configVersion?: number;
    status?: string;
    jurisdictionLevelId?: number;
    assignmentStrategyId?: number;
  }) {
    return this.prisma.applicationWorkflowConfiguration.findMany({
      where: {
        serviceId: filters?.serviceId,
        departmentId: filters?.departmentId,
        processingLevel: filters?.processingLevel as any,
        formTypeId: filters?.formTypeId,
        configVersion: filters?.configVersion,
        status: filters?.status as any,
        jurisdictionLevelId: filters?.jurisdictionLevelId,
        assignmentStrategyId: filters?.assignmentStrategyId,
      },
      orderBy: [
        { serviceId: 'asc' },
        { configVersion: 'desc' },
        { step: 'asc' },
        { id: 'asc' },
      ],
      include: {
        department: true,
        service: true,
        formType: true,
        jurisdictionLevelMaster: true,
        assignmentStrategyMaster: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.applicationWorkflowConfiguration.findUnique({
      where: { id },
      include: {
        department: true,
        service: true,
        formType: true,
        jurisdictionLevelMaster: true,
        assignmentStrategyMaster: true,
      },
    });
  }

  async create(data: CreateWorkflowConfigDto) {
    const [jurisdiction, assignmentStrategy, actionInfo] = await Promise.all([
      this.resolveJurisdiction(data.jurisdictionLevelId),
      this.resolveAssignmentStrategy(data.assignmentStrategyId),
      this.resolveActions({
        actionMasterIds: data.actionMasterIds,
        actionAllowedJson: data.actionAllowedJson,
      }),
    ]);

    const jurisdictionCode = String(
      jurisdiction?.code || 'DISTRICT',
    ).toUpperCase();
    const assignmentCode = String(
      assignmentStrategy?.code || 'ROLE',
    ).toUpperCase();
    const currentStep = data.step ?? 0;
    const nextAllocationRoleId = data.nextAllocationRoleId ?? null;
    const normalizedFormTypeId = await this.normalizeWorkflowFormTypeId({
      formTypeId: data.formTypeId,
      step: data.step,
      roleId: data.roleId,
      currentRoleId: data.currentRoleId,
    });

    const createPayload: any = {
      step: currentStep,
      departmentId: data.departmentId,
      serviceId: data.serviceId,
      formTypeId: normalizedFormTypeId,

      configVersion: data.configVersion ?? 1,
      status: (data.status as any) || 'DRAFT',
      startDate: data.startDate ? new Date(data.startDate as any) : new Date(),
      endDate: data.endDate ? new Date(data.endDate as any) : null,
      roleId: data.roleId ?? data.currentRoleId ?? 0,
      jurisdictionLevelId: jurisdiction?.id ?? null,
      assignmentStrategyId: assignmentStrategy?.id ?? null,
      actionMasterIdsJson: actionInfo.actionMasterIds,
      jurisdictionLevel: jurisdictionCode as any,
      assignmentStrategy: assignmentCode as any,
      assignmentRuleJson: data.assignmentRuleJson ?? null,
      actionAllowedJson: actionInfo.actionAllowedJson,
      transitionMapJson:
        this.normalizeTransitionMap(data.transitionMapJson) ??
        ({
          F: {
            next_step: currentStep + 1,
            next_roles: [nextAllocationRoleId || data.nextRoleId || 0].filter(
              Boolean,
            ),
          },
          A: {
            next_step: currentStep + 1,
            next_roles: [data.nextRoleId || 0].filter(Boolean),
          },
          R: { next_step: currentStep, next_roles: [] },
        } as any),
      slaHours: data.slaHours ?? 0,
      slaBreachRequiresReason: data.slaBreachRequiresReason ?? true,
      nextAllocationRoleId,
      createdBy: data.createdBy ?? null,
      updatedBy: data.updatedBy ?? null,

      // Legacy compatibility fields
      processingLevel:
        (data.processingLevel as any) || toProcessingLevel(jurisdictionCode),
      currentRoleId: data.currentRoleId ?? data.roleId ?? 0,
      nextRoleId: data.nextRoleId ?? data.nextAllocationRoleId ?? 0,
      approverId: data.approverId ?? 0,
      forwardRoleId: data.forwardRoleId ?? data.nextAllocationRoleId ?? 0,
      revertRoleId: data.revertRoleId ?? 0,
      isDelayReasonRequired:
        (data.isDelayReasonRequired as any) ||
        toActiveStatus(data.slaBreachRequiresReason ?? true),
      timeInHours: data.timeInHours ?? String(data.slaHours ?? 0),
      canRevertToInvestor: (data.canRevertToInvestor as any) || 'N',
      canVerifyDocument: (data.canVerifyDocument as any) || 'N',
      canForwardToMultipleRoleId: data.canForwardToMultipleRoleId || null,
      canForwardToMultipleUserId: data.canForwardToMultipleUserId || null,
      isOwnDepartment: (data.isOwnDepartment as any) || 'N',
      permissableTabFormId: data.permissableTabFormId ?? '',
      documentShowLast: (data.documentShowLast as any) || 'N',
      processAnytime: (data.processAnytime as any) || 'N',
      showLiceneceList: data.showLiceneceList ?? '0',
      showFieldEditableOrNot: data.showFieldEditableOrNot ?? '0',
      formServiceJs: data.formServiceJs ?? '',
      formActionController: data.formActionController ?? '',
      subformActionName: data.subformActionName ?? '',
      licenceNumberFormat: data.licenceNumberFormat || null,
    };

    if (createPayload.status === 'PUBLISHED') {
      await this.prisma.applicationWorkflowConfiguration.updateMany({
        where: {
          serviceId: data.serviceId,
          status: 'PUBLISHED' as any,
          configVersion: { not: createPayload.configVersion },
        },
        data: { status: 'INACTIVE' as any },
      });
    }

    return this.prisma.applicationWorkflowConfiguration.create({
      data: createPayload,
    });
  }

  async update(id: number, data: UpdateWorkflowConfigDto) {
    const existing =
      await this.prisma.applicationWorkflowConfiguration.findUnique({
        where: { id },
        select: {
          serviceId: true,
          configVersion: true,
          jurisdictionLevelId: true,
          assignmentStrategyId: true,
          actionMasterIdsJson: true,
          jurisdictionLevel: true,
          step: true,
          roleId: true,
          currentRoleId: true,
          formTypeId: true,
        },
      });

    const serviceId = data.serviceId ?? existing?.serviceId ?? '';
    const configVersion = data.configVersion ?? existing?.configVersion ?? 1;

    if (data.status === 'PUBLISHED') {
      await this.prisma.applicationWorkflowConfiguration.updateMany({
        where: {
          serviceId,
          status: 'PUBLISHED' as any,
          configVersion: { not: configVersion },
        },
        data: { status: 'INACTIVE' as any },
      });
    }

    const jurisdiction =
      data.jurisdictionLevelId !== undefined
        ? await this.resolveJurisdiction(data.jurisdictionLevelId)
        : existing?.jurisdictionLevelId
          ? await this.resolveJurisdiction(existing.jurisdictionLevelId)
          : null;
    const assignmentStrategy =
      data.assignmentStrategyId !== undefined
        ? await this.resolveAssignmentStrategy(data.assignmentStrategyId)
        : existing?.assignmentStrategyId
          ? await this.resolveAssignmentStrategy(existing.assignmentStrategyId)
          : null;

    const shouldRebuildActions =
      data.actionMasterIds !== undefined ||
      data.actionAllowedJson !== undefined;
    const actionInfo = shouldRebuildActions
      ? await this.resolveActions({
          actionMasterIds: data.actionMasterIds,
          actionAllowedJson: data.actionAllowedJson,
        })
      : null;

    const jurisdictionCode = String(
      jurisdiction?.code || existing?.jurisdictionLevel || 'DISTRICT',
    ).toUpperCase();
    const assignmentCode = String(
      assignmentStrategy?.code || 'ROLE',
    ).toUpperCase();
    const resolvedNextRoleId =
      data.nextRoleId !== undefined
        ? data.nextRoleId
        : (data.nextAllocationRoleId ?? undefined);
    const resolvedForwardRoleId =
      data.forwardRoleId !== undefined
        ? data.forwardRoleId
        : (data.nextAllocationRoleId ?? undefined);
    const normalizedFormTypeId = await this.normalizeWorkflowFormTypeId({
      formTypeId: data.formTypeId ?? existing?.formTypeId,
      step: data.step ?? existing?.step,
      roleId: data.roleId ?? existing?.roleId,
      currentRoleId: data.currentRoleId ?? existing?.currentRoleId,
    });

    return this.prisma.applicationWorkflowConfiguration.update({
      where: { id },
      data: {
        step: data.step,
        departmentId: data.departmentId,
        serviceId: data.serviceId,
        formTypeId: normalizedFormTypeId,

        configVersion: data.configVersion,
        status: data.status as any,
        startDate: data.startDate ? new Date(data.startDate as any) : undefined,
        endDate:
          data.endDate !== undefined
            ? data.endDate
              ? new Date(data.endDate as any)
              : null
            : undefined,
        roleId: data.roleId,
        jurisdictionLevelId: data.jurisdictionLevelId,
        assignmentStrategyId: data.assignmentStrategyId,
        actionMasterIdsJson: actionInfo
          ? actionInfo.actionMasterIds
          : undefined,
        jurisdictionLevel: jurisdictionCode as any,
        assignmentStrategy: assignmentCode as any,
        assignmentRuleJson:
          data.assignmentRuleJson === undefined
            ? undefined
            : data.assignmentRuleJson === null
              ? Prisma.JsonNull
              : (data.assignmentRuleJson as any),
        actionAllowedJson: actionInfo
          ? (actionInfo.actionAllowedJson as any)
          : undefined,
        transitionMapJson:
          data.transitionMapJson === undefined
            ? undefined
            : (this.normalizeTransitionMap(data.transitionMapJson) as any),
        slaHours: data.slaHours,
        slaBreachRequiresReason: data.slaBreachRequiresReason,
        nextAllocationRoleId: data.nextAllocationRoleId,
        createdBy: data.createdBy,
        updatedBy: data.updatedBy,

        // Legacy compatibility
        processingLevel:
          data.processingLevel !== undefined
            ? (data.processingLevel as any)
            : data.jurisdictionLevelId !== undefined
              ? (toProcessingLevel(jurisdictionCode) as any)
              : undefined,
        currentRoleId: data.currentRoleId ?? data.roleId,
        nextRoleId: resolvedNextRoleId,
        approverId: data.approverId,
        forwardRoleId: resolvedForwardRoleId,
        revertRoleId: data.revertRoleId,
        isDelayReasonRequired:
          data.isDelayReasonRequired !== undefined
            ? (data.isDelayReasonRequired as any)
            : data.slaBreachRequiresReason !== undefined
              ? (toActiveStatus(data.slaBreachRequiresReason) as any)
              : undefined,
        timeInHours:
          data.timeInHours !== undefined
            ? data.timeInHours
            : data.slaHours !== undefined
              ? String(data.slaHours)
              : undefined,
        canRevertToInvestor: data.canRevertToInvestor as any,
        canVerifyDocument: data.canVerifyDocument as any,
        canForwardToMultipleRoleId: data.canForwardToMultipleRoleId,
        canForwardToMultipleUserId: data.canForwardToMultipleUserId,
        isOwnDepartment: data.isOwnDepartment as any,
        permissableTabFormId: data.permissableTabFormId,
        documentShowLast: data.documentShowLast as any,
        processAnytime: data.processAnytime as any,
        showLiceneceList: data.showLiceneceList,
        showFieldEditableOrNot: data.showFieldEditableOrNot,
        formServiceJs: data.formServiceJs,
        formActionController: data.formActionController,
        subformActionName: data.subformActionName,
        licenceNumberFormat: data.licenceNumberFormat,
      },
    });
  }

  delete(id: number) {
    return this.prisma.applicationWorkflowConfiguration.delete({
      where: { id },
    });
  }
}
