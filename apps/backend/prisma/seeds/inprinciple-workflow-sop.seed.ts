import { PrismaClient, WorkflowConfigStatus } from '@prisma/client';

type WorkflowSeedRow = {
  id: number;
  step: number;
  processingLevel: 'District' | 'State';
  roleId: number;
  formTypeId: number;
  nextRoleId: number;
  forwardRoleId: number;
  revertRoleId: number;
  approverId: number;
  actionCodes: string[];
  transitionMapJson: Record<string, any>;
  canRevertToInvestor?: boolean;
  canVerifyDocument?: boolean;
  permissableTabFormId?: string;
  timeInHours?: string;
  isDelayReasonRequired?: 'Y' | 'N';
  assignmentRuleJson?: Record<string, any>;
  nextAllocationRoleId?: number | null;
};

function getSopRows(): WorkflowSeedRow[] {
  return [
    {
      id: 8841,
      step: 1,
      processingLevel: 'District',
      roleId: 7,
      formTypeId: 5,
      nextRoleId: 3,
      forwardRoleId: 3,
      revertRoleId: 0,
      approverId: 33,
      actionCodes: ['FORWARD', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        FORWARD: { next_step: 2, next_roles: [3] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '1,5,6,7',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'DISTRICT',
        routingHint: 'is_msme_sector=true',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: 3,
    },
    {
      id: 8842,
      step: 2,
      processingLevel: 'District',
      roleId: 3,
      formTypeId: 6,
      nextRoleId: 33,
      forwardRoleId: 33,
      revertRoleId: 7,
      approverId: 33,
      actionCodes: ['FORWARD', 'FORWARD_TO_APPROVER', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        FORWARD: { next_step: 2, next_roles: [114] },
        FORWARD_TO_APPROVER: { next_step: 3, next_roles: [33] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '6,8',
      timeInHours: '360',
      isDelayReasonRequired: 'Y',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'DISTRICT',
        stage: 'department_comments',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: 33,
    },
    {
      id: 8843,
      step: 3,
      processingLevel: 'District',
      roleId: 33,
      formTypeId: 7,
      nextRoleId: 33,
      forwardRoleId: 33,
      revertRoleId: 7,
      approverId: 33,
      actionCodes: ['APPROVE', 'REJECT', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        APPROVE: { next_step: 4, next_roles: [] },
        REJECT: { next_step: 4, next_roles: [] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '1,5,6,7',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'DISTRICT',
        stage: 'district_committee_decision',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: null,
    },
    {
      id: 8851,
      step: 1,
      processingLevel: 'State',
      roleId: 4,
      formTypeId: 5,
      nextRoleId: 5,
      forwardRoleId: 5,
      revertRoleId: 0,
      approverId: 34,
      actionCodes: ['FORWARD', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        FORWARD: { next_step: 2, next_roles: [5] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '1,5,6,7',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'STATE',
        routingHint: 'is_msme_sector=false',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: 5,
    },
    {
      id: 8852,
      step: 2,
      processingLevel: 'State',
      roleId: 5,
      formTypeId: 6,
      nextRoleId: 34,
      forwardRoleId: 34,
      revertRoleId: 4,
      approverId: 34,
      actionCodes: ['FORWARD', 'FORWARD_TO_APPROVER', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        FORWARD: { next_step: 2, next_roles: [114] },
        FORWARD_TO_APPROVER: { next_step: 3, next_roles: [34] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '6,8',
      timeInHours: '360',
      isDelayReasonRequired: 'Y',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'STATE',
        stage: 'department_comments',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: 34,
    },
    {
      id: 8853,
      step: 3,
      processingLevel: 'State',
      roleId: 34,
      formTypeId: 7,
      nextRoleId: 34,
      forwardRoleId: 34,
      revertRoleId: 4,
      approverId: 34,
      actionCodes: ['APPROVE', 'REJECT', 'REVERT_TO_INVESTOR'],
      transitionMapJson: {
        APPROVE: { next_step: 4, next_roles: [] },
        REJECT: { next_step: 4, next_roles: [] },
        REVERT_TO_INVESTOR: { next_step: 1, next_roles: ['INVESTOR'] },
      },
      canRevertToInvestor: true,
      canVerifyDocument: true,
      permissableTabFormId: '1,5,6,7',
      assignmentRuleJson: {
        sop: 'inprinciple_2026_v1',
        branch: 'STATE',
        stage: 'state_committee_decision',
        uiSections: ['APPLICATION_VIEW', 'DOCUMENTS_VIEW', 'TIMELINE_VIEW', 'ACTIONABLE_ITEMS'],
      },
      nextAllocationRoleId: null,
    },
  ];
}

export async function seedInprincipleWorkflowSop(
  prisma: PrismaClient,
  options?: { serviceId?: string; configVersion?: number; publish?: boolean }
) {
  const serviceId = options?.serviceId || '943.0';
  const configVersion = options?.configVersion ?? 2;
  const publish = options?.publish === true;
  const status = publish ? WorkflowConfigStatus.PUBLISHED : WorkflowConfigStatus.DRAFT;

  const [districtJurisdiction, stateJurisdiction, roleAssignment] = await Promise.all([
    prisma.workflowJurisdictionLevelMaster.findFirst({ where: { code: 'DISTRICT' } }),
    prisma.workflowJurisdictionLevelMaster.findFirst({ where: { code: 'STATE' } }),
    prisma.workflowAssignmentStrategyMaster.findFirst({ where: { code: 'ROLE' } }),
  ]);

  const actions = await prisma.workflowActionMaster.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });
  const actionIdByCode = new Map(actions.map((a) => [String(a.code || '').toUpperCase(), Number(a.id)]));

  const service = await prisma.service.findFirst({ where: { service_id: serviceId } });
  const departmentId = Number(service?.department_id || 1);

  if (publish) {
    await prisma.applicationWorkflowConfiguration.updateMany({
      where: { serviceId, status: 'PUBLISHED' as any, configVersion: { not: configVersion } },
      data: { status: 'INACTIVE' as any },
    });
  }

  const rows = getSopRows();
  for (const row of rows) {
    const isState = row.processingLevel === 'State';
    const jurisdiction = isState ? stateJurisdiction : districtJurisdiction;
    const actionMasterIds = row.actionCodes
      .map((code) => actionIdByCode.get(String(code).toUpperCase()))
      .filter((id): id is number => Number.isFinite(id as number));

    const payload: any = {
      step: row.step,
      departmentId,
      serviceId,
      configVersion,
      status,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: null,
      roleId: row.roleId,
      jurisdictionLevelId: jurisdiction?.id ?? null,
      assignmentStrategyId: roleAssignment?.id ?? null,
      actionMasterIdsJson: actionMasterIds,
      jurisdictionLevel: isState ? ('STATE' as any) : ('DISTRICT' as any),
      assignmentStrategy: 'ROLE' as any,
      assignmentRuleJson: row.assignmentRuleJson || null,
      actionAllowedJson: row.actionCodes,
      transitionMapJson: row.transitionMapJson,
      slaHours: Number(row.timeInHours || 0),
      slaBreachRequiresReason: (row.isDelayReasonRequired || 'N') === 'Y',
      nextAllocationRoleId: row.nextAllocationRoleId ?? row.nextRoleId ?? null,
      createdBy: 'seed-sop',
      updatedBy: 'seed-sop',

      processingLevel: row.processingLevel as any,
      currentRoleId: row.roleId,
      formTypeId: row.formTypeId,
      nextRoleId: row.nextRoleId,
      approverId: row.approverId,
      forwardRoleId: row.forwardRoleId,
      revertRoleId: row.revertRoleId,
      isDelayReasonRequired: (row.isDelayReasonRequired || 'N') as any,
      timeInHours: row.timeInHours || '0',
      canRevertToInvestor: row.canRevertToInvestor ? ('Y' as any) : ('N' as any),
      canVerifyDocument: row.canVerifyDocument ? ('Y' as any) : ('N' as any),
      canForwardToMultipleRoleId: '',
      canForwardToMultipleUserId: '',
      isOwnDepartment: 'N' as any,
      permissableTabFormId: row.permissableTabFormId || '',
      documentShowLast: 'N' as any,
      processAnytime: 'Y' as any,
      showLiceneceList: '0',
      showFieldEditableOrNot: '0',
      formServiceJs: 'subformwizard_newcaf_service.js',
      formActionController: 'subFormNewCaf',
      subformActionName: '',
      licenceNumberFormat: null,
    };

    await prisma.applicationWorkflowConfiguration.upsert({
      where: { id: row.id },
      update: payload,
      create: { id: row.id, ...payload },
    });
  }

  console.log(
    `  seeded SOP workflow rows for service ${serviceId} (version ${configVersion}, status ${status})`
  );
}

