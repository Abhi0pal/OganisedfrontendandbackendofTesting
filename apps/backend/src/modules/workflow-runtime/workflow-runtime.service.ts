import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProcessingLevel } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WorkflowRuntimeService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly STATUS_GROUPS = {
    pending: ['P', 'PENDING'],
    forwarded: ['F', 'FA', 'FORWARDED'],
    approved: ['A', 'APPROVED'],
    rejected: ['R', 'REJECT', 'REJECTED', 'RBI', 'REVERTED'],
  } as const;

  private static getFriendlyStatus(status?: string) {
    const code = String(status || '').toUpperCase();
    if (
      WorkflowRuntimeService.hasStatus(
        WorkflowRuntimeService.STATUS_GROUPS.pending,
        code,
      )
    )
      return 'Pending';
    if (['FA'].includes(code)) return 'Forwarded to Approver';
    if (['F', 'FORWARDED'].includes(code)) return 'Forwarded';
    if (
      WorkflowRuntimeService.hasStatus(
        WorkflowRuntimeService.STATUS_GROUPS.approved,
        code,
      )
    )
      return 'Approved';
    if (['RBI', 'REVERTED'].includes(code)) return 'Reverted to Investor';
    if (
      WorkflowRuntimeService.hasStatus(
        WorkflowRuntimeService.STATUS_GROUPS.rejected,
        code,
      )
    )
      return 'Rejected';
    return code || 'Unknown';
  }

  private static hasStatus(statuses: readonly string[], code: string): boolean {
    return statuses.includes(code);
  }

  // BUSINESS RULE: all workflow actions must be validated using canonical short codes.
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
      REVERT: 'RBI',
      FORWARD_APPROVER: 'FA',
    };
    return aliasMap[raw] || raw;
  }

  // BUSINESS RULE: normalize form type labels/codes into canonical workflow form keys.
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
      PFA: 'APPROVER_LEVEL_PROCESSING_FORM',
      PFAL: 'APPROVER_LEVEL_PROCESSING_FORM',
      APPROVER_LEVEL_PROCESSING_FORM: 'APPROVER_LEVEL_PROCESSING_FORM',
      PROCESSING_FORM_APPROVER_LEVEL: 'APPROVER_LEVEL_PROCESSING_FORM',
    };
    return aliasMap[raw] || raw;
  }

  private static extractTaskCompanyName(
    fieldValue: unknown,
    fallbackUnitName?: string | null,
  ): string | null {
    const src = (fieldValue || {}) as Record<string, any>;
    const company = (src.company || {}) as Record<string, any>;
    const corp = (company.corp || {}) as Record<string, any>;
    return (
      corp.name ||
      corp.company_name ||
      company.company_name ||
      src.company_name ||
      src.companyName ||
      fallbackUnitName ||
      null
    );
  }

  private static extractTaskApplicantName(fieldValue: unknown): string | null {
    const src = (fieldValue || {}) as Record<string, any>;
    const applicant = (src.applicant || {}) as Record<string, any>;
    const firstName =
      applicant.firstName || applicant.first_name || applicant.fname || '';
    const lastName =
      applicant.lastName || applicant.last_name || applicant.lname || '';
    const fullName =
      applicant.fullName ||
      applicant.full_name ||
      applicant.name ||
      `${firstName} ${lastName}`.trim();
    return fullName || null;
  }

  async getTasks(options: {
    roleId: number;
    jurisdictionLevel?: string;
    status?: string;
    serviceId?: string;
    page?: number;
    limit?: number;
  }) {
    const status = String(options.status || 'ACTIVE').trim().toUpperCase();
    const jurisdictionLevel = options.jurisdictionLevel
      ? String(options.jurisdictionLevel).trim()
      : undefined;
    const serviceId = options.serviceId
      ? String(options.serviceId).trim()
      : undefined;
    const page =
      Number.isFinite(Number(options.page)) && Number(options.page) > 0
        ? Number(options.page)
        : 1;
    const limit =
      Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
        ? Math.min(Number(options.limit), 100)
        : 20;
    const skip = (page - 1) * limit;

    return this.prisma.$transaction(async (tx) => {
      const baseWhere: Prisma.WorkflowInstanceWhereInput = {
        currentRoleId: options.roleId,
        status,
        ...(jurisdictionLevel ? { jurisdictionLevel } : {}),
      };

      let where: Prisma.WorkflowInstanceWhereInput = baseWhere;
      if (serviceId) {
        const serviceSubmissions = await tx.applicationSubmission.findMany({
          where: { serviceId },
          select: { submissionId: true },
        });
        const applicationIds = serviceSubmissions
          .map((item) => {
            const id = Number(item.submissionId);
            return Number.isFinite(id) && id > 0 ? BigInt(id) : null;
          })
          .filter((value): value is bigint => value !== null);

        if (!applicationIds.length) {
          return {
            items: [],
            page,
            limit,
            total: 0,
          };
        }

        where = {
          ...baseWhere,
          applicationId: { in: applicationIds },
        };
      }

      const total = await tx.workflowInstance.count({ where });
      const rows = await tx.workflowInstance.findMany({
        where,
        orderBy: [{ dueAt: 'asc' }, { id: 'desc' }],
        skip,
        take: limit,
      });

      if (!rows.length) {
        return {
          items: [],
          page,
          limit,
          total,
        };
      }

      const submissionIds = rows
        .map((row) => Number(row.applicationId))
        .filter((id) => Number.isFinite(id) && id > 0);
      const submissions = await tx.applicationSubmission.findMany({
        where: { submissionId: { in: submissionIds } },
        select: {
          submissionId: true,
          serviceId: true,
          unitName: true,
          fieldValue: true,
        },
      });
      const submissionMap = new Map(
        submissions.map((item) => [Number(item.submissionId), item]),
      );
      const now = new Date();

      return {
        items: rows.map((row) => {
          const applicationId = Number(row.applicationId);
          const submission = submissionMap.get(applicationId);
          const dueAt = row.dueAt || null;
          return {
            applicationId,
            submissionId: applicationId,
            serviceId: submission?.serviceId || null,
            applicantName: WorkflowRuntimeService.extractTaskApplicantName(
              submission?.fieldValue,
            ),
            companyName: WorkflowRuntimeService.extractTaskCompanyName(
              submission?.fieldValue,
              submission?.unitName || null,
            ),
            currentStep: row.currentStep,
            currentRoleId: row.currentRoleId,
            jurisdictionLevel: row.jurisdictionLevel,
            status: row.status,
            dueAt,
            slaBreached: Boolean(dueAt && now > dueAt),
            workflowDefinitionVersion: row.workflowDefinitionVersion,
          };
        }),
        page,
        limit,
        total,
      };
    });
  }

  async previewForwardRecipients(options: {
    appSubId: number;
    step: number;
    action: 'FORWARD';
    forwardedDeptIds: number[];
    jurisdictionLevel?: string;
    forwardedDistId?: number;
    stateId?: number;
  }) {
    if (!options.forwardedDeptIds.length) return [];

    return this.prisma.$transaction(async (tx) => {
      return this.resolveForwardPreviewRecipients(tx, options);
    });
  }

  private async resolveForwardPreviewRecipients(
    prisma: PrismaService | Prisma.TransactionClient,
    options: {
      appSubId: number;
      step: number;
      action: 'FORWARD';
      forwardedDeptIds: number[];
      jurisdictionLevel?: string;
      forwardedDistId?: number;
      stateId?: number;
    },
  ) {
    const submission = await prisma.applicationSubmission.findUnique({
      where: { submissionId: options.appSubId },
      select: {
        submissionId: true,
        serviceId: true,
        processingLevel: true,
        formId: true,
        landrigionId: true,
      },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const workflowConfig =
      await prisma.applicationWorkflowConfiguration.findFirst({
        where: {
          serviceId: submission.serviceId,
          step: options.step,
          status: 'PUBLISHED' as any,
          processingLevel: submission.processingLevel,
        },
        orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
      });
    if (!workflowConfig) {
      throw new BadRequestException(
        'Workflow configuration not found for the selected step',
      );
    }

    const normalizedAction = this.normalizeActionCode(
      String(options.action || 'FORWARD'),
    );
    const transitionMap = (workflowConfig.transitionMapJson || {}) as Record<
      string,
      any
    >;
    const transition = transitionMap[normalizedAction] || null;
    let roleIds = Array.isArray(transition?.next_roles)
      ? transition.next_roles
          .map((value: any) => Number(value))
          .filter((value: number) => Number.isFinite(value) && value > 0)
      : [];
    const nextStep =
      Number.isFinite(Number(transition?.next_step)) &&
      Number(transition?.next_step) > 0
        ? Number(transition.next_step)
        : null;
    if (nextStep) {
      const nextStepConfigs = await prisma.applicationWorkflowConfiguration.findMany({
        where: {
          serviceId: submission.serviceId,
          status: 'PUBLISHED' as any,
          processingLevel: submission.processingLevel,
          configVersion: workflowConfig.configVersion,
          step: nextStep,
        },
        select: {
          roleId: true,
          currentRoleId: true,
          formTypeId: true,
        },
      });
      if (nextStepConfigs.length) {
        const submissionFormTypeId =
          Number.isFinite(Number(submission.formId)) && Number(submission.formId) > 0
            ? Number(submission.formId)
            : null;
        const formMatchedConfigs = submissionFormTypeId
          ? nextStepConfigs.filter(
              (config) => Number(config.formTypeId || 0) === submissionFormTypeId,
            )
          : [];
        const configsForRoleValidation = formMatchedConfigs.length
          ? formMatchedConfigs
          : nextStepConfigs;
        const configuredRoleIds = new Set<number>();
        configsForRoleValidation.forEach((config) => {
          [config.roleId, config.currentRoleId]
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0)
            .forEach((value) => configuredRoleIds.add(value));
        });
        roleIds = roleIds.filter((roleId) => configuredRoleIds.has(Number(roleId)));
      }
    }
    if (!roleIds.length) {
      throw new BadRequestException(
        `No next_roles configured for FORWARD in workflow config for step ${options.step}`,
      );
    }

    const departments = await prisma.department.findMany({
      where: { id: { in: options.forwardedDeptIds } },
      select: { id: true, name: true },
    });
    const departmentMap = new Map(
      departments.map((department) => [department.id, department.name || null]),
    );

    const roles = await prisma.roles.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true },
    });
    const roleMap = new Map(roles.map((role) => [role.id, role.name || null]));

    const jurisdictionLevel = String(
      options.jurisdictionLevel || workflowConfig.jurisdictionLevel || '',
    ).toUpperCase();
    const districtId =
      Number.isFinite(Number(options.forwardedDistId)) &&
      Number(options.forwardedDistId) > 0
        ? Number(options.forwardedDistId)
        : Number.isFinite(Number(submission.landrigionId)) &&
            Number(submission.landrigionId) > 0
          ? Number(submission.landrigionId)
          : undefined;
    const stateId =
      Number.isFinite(Number(options.stateId)) && Number(options.stateId) > 0
        ? Number(options.stateId)
        : undefined;
    if (jurisdictionLevel === 'DISTRICT' && !districtId) {
      throw new BadRequestException(
        'District context is required for district-level forwarding',
      );
    }
    const stateDistrictIds =
      jurisdictionLevel === 'STATE' && stateId
        ? (
            await prisma.district.findMany({
              where: { stateId },
              select: { id: true },
            })
          )
            .map((item) => Number(item.id))
            .filter((value) => Number.isFinite(value) && value > 0)
        : [];

    const rows: Array<{
      forwardedDeptId: number;
      departmentName: string | null;
      nextRoleId: number;
      roleName: string | null;
      nextUserId: number | null;
      userName: string | null;
      forwardedDistId: number | null;
      jurisdictionLevel: string;
      departmentId: number;
      roleId: number;
      userId: number | null;
      districtId: number | null;
      districtName: string | null;
    }> = [];

    for (const departmentId of options.forwardedDeptIds) {
      for (const roleId of roleIds) {
        const users = await prisma.department_users.findMany({
          where: {
            dept_id: departmentId,
            ...(jurisdictionLevel === 'DISTRICT' && districtId
              ? { district_id: districtId }
              : {}),
            ...(jurisdictionLevel === 'STATE' && stateDistrictIds.length
              ? { district_id: { in: stateDistrictIds } }
              : {}),
            user: { role_id: roleId },
          },
          select: { user_id: true, full_name: true, district_id: true },
          orderBy: { user_id: 'asc' },
        });

        const districtIds = Array.from(
          new Set(
            users
              .map((user) => Number(user.district_id))
              .filter((value) => Number.isFinite(value) && value > 0),
          ),
        );
        const districts = districtIds.length
          ? await prisma.district.findMany({
              where: { id: { in: districtIds } },
              select: { id: true, name: true },
            })
          : [];
        const districtNameMap = new Map(
          districts.map((item) => [Number(item.id), item.name || null]),
        );

        if (!users.length) {
          rows.push({
            forwardedDeptId: departmentId,
            departmentName: departmentMap.get(departmentId) || null,
            nextRoleId: roleId,
            roleName: roleMap.get(roleId) || null,
            nextUserId: null,
            userName: null,
            forwardedDistId: districtId ?? null,
            jurisdictionLevel: jurisdictionLevel || 'DISTRICT',
            departmentId,
            roleId,
            userId: null,
            districtId: districtId ?? null,
            districtName: null,
          });
          continue;
        }

        users.forEach((user) =>
          rows.push({
            forwardedDeptId: departmentId,
            departmentName: departmentMap.get(departmentId) || null,
            nextRoleId: roleId,
            roleName: roleMap.get(roleId) || null,
            nextUserId: Number(user.user_id),
            userName: user.full_name || null,
            forwardedDistId: districtId ?? null,
            jurisdictionLevel: jurisdictionLevel || 'DISTRICT',
            departmentId,
            roleId,
            userId: Number(user.user_id),
            districtId:
              Number.isFinite(Number(user.district_id)) &&
              Number(user.district_id) > 0
                ? Number(user.district_id)
                : districtId ?? null,
            districtName:
              Number.isFinite(Number(user.district_id)) &&
              Number(user.district_id) > 0
                ? districtNameMap.get(Number(user.district_id)) || null
                : null,
          }),
        );
      }
    }

    return rows;
  }

  async processAction(options: {
    submissionId: number;
    step?: number;
    serviceId: string;
    action:
      | 'forward'
      | 'pending'
      | 'approve'
      | 'reject'
      | 'revert'
      | 'hold'
      | 'PENDING'
      | 'FORWARD'
      | 'APPROVE'
      | 'REJECT'
      | 'REVERT_TO_INVESTOR'
      | 'HOLD'
      | 'FORWARD_TO_APPROVER'
      | 'F'
      | 'FA'
      | 'RBI'
      | 'A'
      | 'R'
      | 'P'
      | 'H';
    processingLevel?: string;
    comments?: string;
    nextRoleId?: number;
    nextRoleIds?: number[];
    nextUserId?: number;
    nextUserIds?: number[];
    reasonForDelay?: string;
    supportiveDocument?: string;
    forwardedDeptIds?: number[];
    forwardedDistId?: number;
    stateId?: number;
    blockPayload?: Record<string, any>;
    selectedRecipients?: Array<{
      forwardedDeptId: number;
      nextRoleId: number;
      nextUserId: number;
    }>;
    userId: bigint;
    userRoleId: number;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const actionRaw = String(options.action || '');
    const normalizedAction = this.normalizeActionCode(actionRaw);
    if (normalizedAction === 'RBI' && !(options.comments || '').trim()) {
      throw new BadRequestException(
        'Comments are required for Revert Back to Investor action.',
      );
    }
    const txResult = await this.prisma.$transaction(async (tx) => {
      const prisma = tx;
      const submission = await prisma.applicationSubmission.findUnique({
        where: { submissionId: options.submissionId },
      });

      if (!submission) {
        throw new BadRequestException('Submission not found');
      }

      const workflowInstance = await this.loadWorkflowInstance(
        prisma,
        options.submissionId,
      );
      if (!workflowInstance) {
        throw new NotFoundException(
          'Workflow instance not found for this submission',
        );
      }
      const prevStep = Number(workflowInstance.currentStep || 0);
      const prevRoleId = Number(workflowInstance.currentRoleId || 0);

      const actionAccess = await this.resolveActionAccess(prisma, {
        submissionId: options.submissionId,
        userId: options.userId,
        userRoleId: options.userRoleId,
        currentRoleId: prevRoleId,
      });
      if (!actionAccess.allowed) {
        throw new BadRequestException(
          actionAccess.message ||
            'Application is currently pending with another role.',
        );
      }

      let workflowDefinitionVersion = Number(
        submission.workflowConfigVersion ||
          workflowInstance.workflowDefinitionVersion ||
          0,
      );
      if (!workflowDefinitionVersion) {
        const latestPublished =
          await prisma.applicationWorkflowConfiguration.findFirst({
            where: {
              serviceId: submission.serviceId,
              status: 'PUBLISHED' as any,
            },
            select: { configVersion: true },
            orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
          });
        workflowDefinitionVersion = Number(latestPublished?.configVersion || 0);
        if (!workflowDefinitionVersion) {
          throw new BadRequestException(
            'Published workflow version not found for service',
          );
        }
        await prisma.applicationSubmission.update({
          where: { submissionId: submission.submissionId },
          data: { workflowConfigVersion: workflowDefinitionVersion },
        });
      }
      // BUSINESS RULE: validate using the exact current workflow instance stage.
      const workflowConfigMatches =
        await prisma.applicationWorkflowConfiguration.findMany({
          where: {
            serviceId: submission.serviceId,
            status: 'PUBLISHED' as any,
            configVersion: workflowDefinitionVersion,
            step: Number(workflowInstance.currentStep),
            currentRoleId: Number(workflowInstance.currentRoleId),
          },
          orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        });
      let resolvedWorkflowConfigCandidates = workflowConfigMatches;
      if (
        !resolvedWorkflowConfigCandidates.length &&
        Number(options.userRoleId || 0) !==
          Number(workflowInstance.currentRoleId || 0) &&
        actionAccess.allowed
      ) {
        const delegatedStep = this.getExpectedStepByRole(options.userRoleId);
        if (delegatedStep) {
          resolvedWorkflowConfigCandidates =
            await prisma.applicationWorkflowConfiguration.findMany({
              where: {
                serviceId: submission.serviceId,
                status: 'PUBLISHED' as any,
                configVersion: workflowDefinitionVersion,
                step: delegatedStep,
                currentRoleId: Number(options.userRoleId || 0),
              },
              orderBy: [
                { startDate: 'desc' },
                { createdAt: 'desc' },
                { id: 'desc' },
              ],
            });
        }
      }

      if (!resolvedWorkflowConfigCandidates.length) {
        throw new BadRequestException(
          'Workflow configuration not found for current workflow stage',
        );
      }

      const submissionFormTypeId = Number(submission.formId || 0);
      let resolvedWorkflowConfigMatches = resolvedWorkflowConfigCandidates;
      if (resolvedWorkflowConfigCandidates.length > 1) {
        if (submissionFormTypeId > 0) {
          const formTypeMatchedConfigs = resolvedWorkflowConfigCandidates.filter(
            (row) => Number(row.formTypeId || 0) === submissionFormTypeId,
          );
          if (formTypeMatchedConfigs.length === 1) {
            resolvedWorkflowConfigMatches = formTypeMatchedConfigs;
          } else if (formTypeMatchedConfigs.length > 1) {
            throw new BadRequestException(
              'Multiple workflow configs found for this step/role; please fix configuration',
            );
          } else {
            throw new BadRequestException(
              'Multiple workflow configs found for this step/role; please fix configuration',
            );
          }
        } else {
          throw new BadRequestException(
            'Multiple workflow configs found for this step/role; please fix configuration',
          );
        }
      }
      const workflowConfig = resolvedWorkflowConfigMatches[0];

      // BUSINESS RULE: action_allowed_json and transition_map_json are stored with short action codes (F/FA/RBI...).
      const normalizeConfiguredActionKey = (value: string) => {
        const raw = String(value || '').trim().toUpperCase();
        if (raw === 'FORWARD') return 'F';
        if (raw === 'APPROVE') return 'A';
        if (raw === 'REJECT') return 'R';
        if (raw === 'REVERT_TO_INVESTOR') return 'RBI';
        if (raw === 'FORWARD_TO_APPROVER') return 'FA';
        if (raw === 'F') return 'F';
        if (raw === 'A') return 'A';
        if (raw === 'R') return 'R';
        if (raw === 'RBI') return 'RBI';
        if (raw === 'FA') return 'FA';
        return raw;
      };

      const rawTransitionMap = (workflowConfig.transitionMapJson as any) || {};
      const transitionMap: Record<string, any> = {};
      Object.keys(rawTransitionMap).forEach((key) => {
        const normalizedKey = normalizeConfiguredActionKey(key);
        transitionMap[normalizedKey] = rawTransitionMap[key];
      });
      const transitionMapKeys = Object.keys(transitionMap || {});
      const allowedActions = Array.isArray(workflowConfig.actionAllowedJson)
        ? (workflowConfig.actionAllowedJson as any[])
            .map((entry) =>
              normalizeConfiguredActionKey(String(entry).trim().toUpperCase()),
            )
            .filter(Boolean)
        : [];
      let isAllowed =
        !allowedActions.length || allowedActions.includes(normalizedAction);
      // BUSINESS RULE: when nodal ownership is retained during parallel forward,
      // nodal must still be able to Forward / Forward to Approver / Revert to Investor.
      if (
        !isAllowed &&
        Number(options.userRoleId || 0) === 7 &&
        Number(workflowInstance.currentRoleId || 0) === 7 &&
        Number(workflowConfig.step || 0) === 2 &&
        ['F', 'FA', 'RBI'].includes(normalizedAction) &&
        this.isParallelForwardEnabled(workflowConfig.assignmentRuleJson) &&
        this.isParallelForwardRetainOwnershipEnabled(
          workflowConfig.assignmentRuleJson,
        )
      ) {
        const hasPendingDepartmentAssignments =
          (await prisma.forwardApplication.count({
            where: {
              appSubId: options.submissionId,
              nextRoleId: 3,
              approvStatus: 'P',
              actionTaken: { in: ['FORWARD', 'F', 'ASSIGNED'] },
            },
          })) > 0;
        if (hasPendingDepartmentAssignments) {
          isAllowed = true;
        }
      }
      const transition = transitionMap[normalizedAction] || null;
      let disallowReason = 'ok';
      if (!isAllowed) {
        disallowReason = 'action_not_allowed';
      } else if (!transition || typeof transition !== 'object') {
        disallowReason = 'transition_missing';
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log('[workflow-action] validation trace', {
          requestActionRaw: actionRaw,
          normalizedAction,
          submissionId: options.submissionId,
          workflowInstance: {
            currentStep: Number(workflowInstance.currentStep),
            currentRoleId: Number(workflowInstance.currentRoleId),
            configVersion: Number(workflowInstance.workflowDefinitionVersion),
          },
          stepConfig: {
            id: workflowConfig.id,
            step: workflowConfig.step,
            roleId: workflowConfig.roleId,
            currentRoleId: workflowConfig.currentRoleId,
            configVersion: workflowConfig.configVersion,
          },
          actionAllowedJson: allowedActions,
          transitionMapKeys,
          isAllowed,
          reason: disallowReason,
        });
      }
      if (!isAllowed) {
        throw new BadRequestException('This action is not allowed at this stage.');
      }
      if (!transition || typeof transition !== 'object') {
        throw new BadRequestException(
          'No workflow transition is configured for this action. Please contact admin.',
        );
      }
      const transitionResult = {
        nextStep:
          Number.isFinite(Number((transition as any).next_step)) &&
          Number((transition as any).next_step) > 0
            ? Number((transition as any).next_step)
            : null,
        nextRoles: Array.isArray((transition as any).next_roles)
          ? (transition as any).next_roles
              .map((value: any) => Number(value))
              .filter((value: number) => Number.isFinite(value) && value > 0)
          : [],
        isTerminal:
          (transition as any).next_step == null ||
          [98, 99, 100].includes(Number((transition as any).next_step)),
        requiresSlaValidation: Boolean(
          Number(workflowConfig.slaHours || 0) > 0,
        ),
      };
      await this.assertTransitionConfigAlignment(prisma, {
        serviceId: submission.serviceId,
        workflowVersion: workflowDefinitionVersion,
        nextStep: transitionResult.nextStep,
        nextRoles: transitionResult.nextRoles,
        submissionFormTypeId,
      });
      if (
        transitionResult.requiresSlaValidation &&
        workflowInstance?.dueAt &&
        new Date() > workflowInstance.dueAt &&
        !(options.reasonForDelay || '').trim()
      ) {
        throw new BadRequestException('SLA breached. Reason required.');
      }

      if (normalizedAction === 'F') {
        const pendingPayment = await tx.paymentDetail.findFirst({
          where: { applicationId: Number(options.submissionId), statusCode: 'P' },
        });
        if (pendingPayment) {
          throw new BadRequestException('A pending payment demand must be completed before forwarding this application.');
        }
      }

      if (options.blockPayload?.paymentDemand) {
        const demand = options.blockPayload.paymentDemand;
        await tx.paymentDetail.create({
          data: {
            applicationId: Number(options.submissionId),
            appSubId: 0,
            userId: Number(options.userId),
            amount: Number(demand.amount || 0),
            totalAmount: Number(demand.amount || 0),
            trnReqDate: new Date().toISOString(),
            statusCode: 'P',
            bifurcationDetails: demand.bifurcation || [],
            statusDescription: 'Payment demand generated by department',
            txnMsg: 'PENDING',
            txnStatus: 'PENDING',
            txnErrMsg: '',
            clntTxnRef: `DEMAND_${options.submissionId}_${Date.now()}`,
            clntRqstMeta: '{}',
            worldlineMerchantTransactionId: '',
            hashToken: '',
            token: '',
            worldlineMerchantTransactionTime: new Date(),
            created: new Date(),
          }
        });
      }

      if (!submission.workflowConfigVersion && workflowConfig.configVersion) {
        await prisma.applicationSubmission.update({
          where: { submissionId: submission.submissionId },
          data: { workflowConfigVersion: workflowConfig.configVersion },
        });
      }

      const department = submission.deptId
        ? await prisma.department.findUnique({
            where: { id: submission.deptId },
          })
        : null;

      const deptUserProfile = await prisma.department_users.findFirst({
        where: { user_id: options.userId },
        select: { full_name: true },
      });
      const actionUser = await prisma.users.findUnique({
        where: { id: options.userId },
        include: {
          department_user: { select: { full_name: true } },
          investor_profile: { select: { first_name: true, last_name: true } },
          role: { select: { name: true } },
        },
      });
      const roleRecord = await prisma.roles.findUnique({
        where: { id: options.userRoleId },
        select: { name: true },
      });
      const resolvedFormTypeId = Number(workflowConfig.formTypeId || submission.formId);
      const formTypeRecord =
        Number.isFinite(resolvedFormTypeId) && resolvedFormTypeId > 0
          ? await prisma.formType.findUnique({
              where: { id: resolvedFormTypeId },
              select: { name: true, abbr: true },
            })
          : null;
      const normalizedFormType = String(
        formTypeRecord?.abbr || formTypeRecord?.name || '',
      )
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
      const canonicalFormType = this.normalizeWorkflowFormType(normalizedFormType);
      // BUSINESS RULE: temporary compatibility for legacy PF at nodal verifier step (role 7, step 2).
      const isNodalVerifierFallback =
        canonicalFormType === 'PROCESSING_FORM' &&
        Number(workflowConfig.step) === 2 &&
        Number(workflowConfig.roleId || workflowConfig.currentRoleId) === 7;
      const effectiveFormType = isNodalVerifierFallback
        ? 'PROCESSING_FORM_VERIFIER_LEVEL'
        : canonicalFormType;
      const investorNameParts = [
        actionUser?.investor_profile?.first_name,
        actionUser?.investor_profile?.last_name,
      ].filter((part) => !!part);
      const investorDisplayName = investorNameParts.join(' ').trim();
      const actorName =
        actionUser?.department_user?.full_name ||
        investorDisplayName ||
        deptUserProfile?.full_name ||
        null;
      const actorRoleName =
        actionUser?.role?.name || roleRecord?.name || 'Investor';

      const actionStatusMap: Record<string, string> = {
        P: 'P',
        F: 'F',
        FA: 'FA',
        A: 'A',
        R: 'R',
        RBI: 'RBI',
        H: 'H',
      };
      const forwardDestinationStrings = Array.isArray(
        options.blockPayload?.forwardDestinations,
      )
        ? options.blockPayload.forwardDestinations
        : [];
      const parsedForwardDestinations = forwardDestinationStrings
        .map((value) => {
          if (!value) return null;
          const [rolePart, deptPart, distPart] = String(value).split('-');
          const roleId = Number(rolePart);
          const deptId = Number(deptPart);
          const districtId = Number(distPart);
          return {
            roleId: Number.isFinite(roleId) && roleId > 0 ? roleId : null,
            deptId: Number.isFinite(deptId) && deptId > 0 ? deptId : null,
            districtId:
              Number.isFinite(districtId) && districtId > 0 ? districtId : null,
          };
        })
        .filter(
          (dest): dest is {
            roleId: number;
            deptId: number | null;
            districtId: number | null;
          } => Boolean(dest?.roleId),
        );
      const explicitForwardedDeptIds =
        options.forwardedDeptIds
          ?.map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0) || [];
      const forwardedDeptIdsFromDestinations = Array.from(
        new Set(
          parsedForwardDestinations
            .map((dest) => Number(dest.deptId))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      const forwardedDeptIds = explicitForwardedDeptIds.length
        ? explicitForwardedDeptIds
        : forwardedDeptIdsFromDestinations;
      const forwardedDistId =
        Number.isFinite(Number(options.forwardedDistId)) &&
        Number(options.forwardedDistId) > 0
          ? Number(options.forwardedDistId)
          : Number.isFinite(Number(submission.landrigionId)) &&
              Number(submission.landrigionId) > 0
            ? Number(submission.landrigionId)
            : undefined;
      const stateId =
        Number.isFinite(Number(options.stateId)) && Number(options.stateId) > 0
          ? Number(options.stateId)
          : undefined;
      const parsedSelectedRecipients = Array.isArray(options.selectedRecipients)
        ? options.selectedRecipients
            .map((item) => ({
              forwardedDeptId: Number(item?.forwardedDeptId),
              nextRoleId: Number(item?.nextRoleId),
              nextUserId: Number(item?.nextUserId),
            }))
            .filter(
              (item) =>
                Number.isFinite(item.forwardedDeptId) &&
                item.forwardedDeptId > 0 &&
                Number.isFinite(item.nextRoleId) &&
                item.nextRoleId > 0 &&
                Number.isFinite(item.nextUserId) &&
                item.nextUserId > 0,
            )
        : [];
      const hasExplicitDepartmentForwardTargets =
        forwardedDeptIds.length > 0 || parsedSelectedRecipients.length > 0;
      const parallelForwardEnabled = this.isParallelForwardEnabled(
        workflowConfig.assignmentRuleJson,
      );
      const isProcessingForwardToMany =
        normalizedAction === 'F' &&
        (hasExplicitDepartmentForwardTargets ||
          effectiveFormType === 'PROCESSING_FORM' ||
          effectiveFormType === 'PROCESSING_FORM_VERIFIER_LEVEL');
      let resolvedRecipientsForAudit: Array<{
        forwardedDeptId: number;
        nextRoleId: number;
        nextUserId: number;
      }> = [];
      let forwardedDeptIdsForAudit: number[] = [];
      const requiresDocCheck = ['F', 'FA'];
      const serviceIdsRequiringDocGuard = new Set(['943.0']);
      const shouldEnforceDocumentGuard = submission?.serviceId
        ? serviceIdsRequiringDocGuard.has(String(submission.serviceId))
        : false;
      const requiresDocumentVerificationGuard =
        effectiveFormType === 'PROCESSING_FORM_VERIFIER_LEVEL';
      if (
        requiresDocCheck.includes(normalizedAction) &&
        shouldEnforceDocumentGuard &&
        requiresDocumentVerificationGuard
      ) {
        if (
          await this.hasPendingMandatoryDocuments(prisma, options.submissionId)
        ) {
          throw new BadRequestException(
            'All mandatory documents must be verified before forwarding the application',
          );
        }
      }

      const transitionRoles = Array.isArray(transition?.next_roles)
        ? (transition.next_roles as any[])
            .map((x: any) => Number(x))
            .filter((x: number) => Number.isFinite(x) && x > 0)
        : [];
      const explicitRoleIds =
        options.nextRoleIds?.filter(
          (x) => Number.isFinite(Number(x)) && Number(x) > 0,
        ) || [];
      const forwardDestinationRoleIds = Array.from(
        new Set(parsedForwardDestinations.map((dest) => dest.roleId)),
      ).filter((value) => Number.isFinite(value) && value > 0);
      const selectedRecipientRoleIds = Array.from(
        new Set(parsedSelectedRecipients.map((recipient) => recipient.nextRoleId)),
      ).filter((value) => Number.isFinite(value) && value > 0);
      const fallbackRoleIds = transitionRoles.length
        ? transitionRoles
        : [
            workflowConfig.nextAllocationRoleId ||
              workflowConfig.forwardRoleId ||
              workflowConfig.nextRoleId,
          ].filter(Boolean);
      const baseRoleIds = explicitRoleIds.length
        ? explicitRoleIds.map((x) => Number(x))
        : options.nextRoleId
          ? [Number(options.nextRoleId)]
          : fallbackRoleIds;
      const nextRoleIds = Array.from(
        new Set([
          ...baseRoleIds,
          ...forwardDestinationRoleIds,
          ...selectedRecipientRoleIds,
        ]),
      ).filter((value) => Number.isFinite(value) && value > 0);
      const nextRoleId = nextRoleIds[0] || null;
      const forwardDestinationsSummary = forwardDestinationStrings.length
        ? forwardDestinationStrings.join(', ')
        : null;

      const explicitUserIds =
        options.nextUserIds
          ?.filter((x) => Number.isFinite(Number(x)) && Number(x) > 0)
          .map((x) => Number(x)) || [];
      const nextUserIds = explicitUserIds.length
        ? explicitUserIds
        : options.nextUserId
          ? [Number(options.nextUserId)]
          : [];

      const now = new Date();
      const spApp = await prisma.spApplication.findFirst({
        where: { appId: BigInt(options.submissionId) },
        select: { sno: true },
      });
      const submissionStatus = actionStatusMap[normalizedAction] || normalizedAction;
      const actionStatus = actionStatusMap[normalizedAction] || normalizedAction;
      const spStatus = actionStatus;
      let pendingDeptTasksBefore = 0;
      let pendingDeptTasksAfter = 0;
      let shouldKeepCurrentStage = false;
      const pendingTaskRoleId =
        Number(workflowConfig.currentRoleId || 0) > 0
          ? Number(workflowConfig.currentRoleId || 0)
          : Number(workflowInstance.currentRoleId || 0);

      if (normalizedAction === 'F') {
        const pendingDeptRows = await prisma.forwardApplication.findMany({
          where: {
            appSubId: options.submissionId,
            nextRoleId: pendingTaskRoleId,
            approvStatus: { startsWith: 'P' },
          },
          select: {
            apprLvlId: true,
            nextUserId: true,
            forwardedDeptId: true,
            forwardedDistId: true,
          },
        });
        pendingDeptTasksBefore = pendingDeptRows.length;
        if (pendingDeptRows.length > 0) {
          const actorDeptProfile = await prisma.department_users.findFirst({
            where: { user_id: options.userId },
            select: { dept_id: true, district_id: true },
          });
          const actorDeptId =
            Number.isFinite(Number(actorDeptProfile?.dept_id)) &&
            Number(actorDeptProfile?.dept_id) > 0
              ? Number(actorDeptProfile?.dept_id)
              : null;
          const actorDistrictId =
            Number.isFinite(Number(actorDeptProfile?.district_id)) &&
            Number(actorDeptProfile?.district_id) > 0
              ? Number(actorDeptProfile?.district_id)
              : null;
          const actorUserId = Number(options.userId);
          const matchedPendingRow = pendingDeptRows.find((row) => {
            const rowUserId =
              Number.isFinite(Number(row.nextUserId)) && Number(row.nextUserId) > 0
                ? Number(row.nextUserId)
                : null;
            if (rowUserId && rowUserId === actorUserId) {
              return true;
            }
            if (!actorDeptId) return false;
            const rowDeptId =
              Number.isFinite(Number(row.forwardedDeptId)) &&
              Number(row.forwardedDeptId) > 0
                ? Number(row.forwardedDeptId)
                : null;
            if (!rowDeptId || rowDeptId !== actorDeptId) {
              return false;
            }
            const rowDistrictId =
              Number.isFinite(Number(row.forwardedDistId)) &&
              Number(row.forwardedDistId) > 0
                ? Number(row.forwardedDistId)
                : null;
            if (rowDistrictId && actorDistrictId && rowDistrictId !== actorDistrictId) {
              return false;
            }
            return true;
          });

          if (matchedPendingRow?.apprLvlId) {
            await prisma.forwardApplication.update({
              where: { apprLvlId: matchedPendingRow.apprLvlId },
              data: {
                approvStatus: 'C',
                updatedDateTime: now,
                verifierUserComment: options.comments || null,
                actionStatus: 'C',
              },
            });
          }

          pendingDeptTasksAfter = await prisma.forwardApplication.count({
            where: {
              appSubId: options.submissionId,
              nextRoleId: pendingTaskRoleId,
              approvStatus: { startsWith: 'P' },
            },
          });
          if (pendingDeptTasksAfter > 0) {
            shouldKeepCurrentStage = true;
          }
        }
      }
      const isForwardFromPendingDepartmentTask =
        normalizedAction === 'F' && pendingDeptTasksBefore > 0;
      const isNodalStep2ParallelForwardToDept =
        normalizedAction === 'F' &&
        Number(options.userRoleId || 0) === 7 &&
        Number(workflowConfig.step || workflowInstance.currentStep || 0) === 2 &&
        forwardedDeptIds.length > 0 &&
        transitionRoles.includes(3);
      const shouldCreateParallelDepartmentTasks =
        parallelForwardEnabled &&
        isProcessingForwardToMany &&
        (!isForwardFromPendingDepartmentTask ||
          isNodalStep2ParallelForwardToDept);
      const retainOwnershipForParallelForward =
        normalizedAction === 'F'
          ? await this.shouldRetainOwnershipForParallelForward(prisma, {
              serviceId: submission.serviceId,
              workflowVersion: workflowDefinitionVersion,
              step: Number(workflowConfig.step || workflowInstance.currentStep || 0),
              currentRoleId: Number(
                workflowConfig.currentRoleId || workflowInstance.currentRoleId || 0,
              ),
              assignmentRuleJson: workflowConfig.assignmentRuleJson,
            })
          : false;
      const shouldRetainOwnershipOnParallelForward =
        normalizedAction === 'F' &&
        shouldCreateParallelDepartmentTasks &&
        ((Number(options.userRoleId || 0) ===
          Number(workflowConfig.currentRoleId || workflowConfig.roleId || 0) &&
          retainOwnershipForParallelForward) ||
          isNodalStep2ParallelForwardToDept);
      if (shouldRetainOwnershipOnParallelForward) {
        shouldKeepCurrentStage = true;
      }

      await prisma.applicationSubmission.update({
        where: { submissionId: options.submissionId },
        data: {
          applicationStatus: submissionStatus,
          approvalId:
            normalizedAction === 'P'
              ? submission.approvalId
              : nextRoleId || submission.approvalId,
          applicationUpdatedDateTime: now,
        },
      });

      await prisma.spApplication.updateMany({
        where: { appId: BigInt(options.submissionId) },
        data: {
          appStatus: spStatus,
          updatedOn: now,
        },
      });

      if (
        !shouldCreateParallelDepartmentTasks &&
        !isForwardFromPendingDepartmentTask
      ) {
        await prisma.forwardApplication.create({
          data: {
            nextRoleId: nextRoleId || null,
            nextUserId: nextUserIds[0] || options.nextUserId || null,
            verifierUserId: Number(options.userId),
            appSubId: options.submissionId,
            forwardedDeptId: submission.deptId,
            forwardedDistId: submission.landrigionId,
            formId: submission.formId || null,
            postInfo: options.comments || null,
            actionTaken: normalizedAction,
            actionStatus,
            verifierUserComment: options.comments || null,
            supportiveDocument: options.supportiveDocument || null,
            createdOn: now,
            userAgent: options.userAgent || '',
            reasonForDelay: options.reasonForDelay || null,
            supportDocument: options.blockPayload
              ? JSON.stringify(options.blockPayload)
              : null,
            ipAddress: options.ipAddress || null,
          },
        });
      }

      if (normalizedAction === 'F') {
        if (shouldCreateParallelDepartmentTasks) {
          if (!forwardedDeptIds.length) {
            throw new BadRequestException(
              'forwardedDeptIds is required for processing/verifier forward action',
            );
          }

          const previewRows = await this.resolveForwardPreviewRecipients(prisma, {
            appSubId: options.submissionId,
            step: workflowConfig.step,
            action: 'FORWARD',
            forwardedDeptIds,
            jurisdictionLevel: workflowConfig.jurisdictionLevel,
            forwardedDistId,
            stateId,
          });

          const groupedRecipients = new Map<
            string,
            Array<{
              forwardedDeptId: number;
              nextRoleId: number;
              nextUserId: number;
            }>
          >();
          previewRows.forEach((row) => {
            if (!row.nextUserId) return;
            const key = `${row.forwardedDeptId}-${row.nextRoleId}`;
            if (!groupedRecipients.has(key)) {
              groupedRecipients.set(key, []);
            }
            groupedRecipients.get(key)!.push({
              forwardedDeptId: row.forwardedDeptId,
              nextRoleId: row.nextRoleId,
              nextUserId: row.nextUserId,
            });
          });

          const selectedRecipientMap = new Map(
            parsedSelectedRecipients.map((recipient) => [
              `${recipient.forwardedDeptId}-${recipient.nextRoleId}-${recipient.nextUserId}`,
              recipient,
            ]),
          );

          const resolvedRecipients = parsedSelectedRecipients.length
            ? parsedSelectedRecipients.map((recipient) => {
                const groupKey = `${recipient.forwardedDeptId}-${recipient.nextRoleId}`;
                const allowed = groupedRecipients.get(groupKey) || [];
                const isAllowed = allowed.some(
                  (candidate) =>
                    candidate.nextUserId === recipient.nextUserId,
                );
                if (!isAllowed) {
                  throw new BadRequestException(
                    `Selected recipient is not allowed for dept ${recipient.forwardedDeptId}, role ${recipient.nextRoleId}`,
                  );
                }
                return {
                  forwardedDeptId: recipient.forwardedDeptId,
                  nextRoleId: recipient.nextRoleId,
                  nextUserId: recipient.nextUserId,
                };
              })
            : Array.from(groupedRecipients.entries()).map(([, recipients]) => {
                const sorted = [...recipients].sort(
                  (a, b) => a.nextUserId - b.nextUserId,
                );
                const firstRecipient = sorted[0];
                if (!firstRecipient?.nextUserId) {
                  throw new BadRequestException(
                    'No mapped user found for one or more forwarded department-role combinations',
                  );
                }
                return firstRecipient;
              });

          if (!resolvedRecipients.length) {
            throw new BadRequestException(
              'No recipients resolved for FORWARD in processing/verifier step',
            );
          }

          const dedupedResolvedRecipients = Array.from(
            new Map(
              resolvedRecipients.map((recipient) => [
                `${recipient.forwardedDeptId}-${recipient.nextRoleId}`,
                recipient,
              ]),
            ).values(),
          );
          resolvedRecipientsForAudit = dedupedResolvedRecipients.map((item) => ({
            forwardedDeptId: item.forwardedDeptId,
            nextRoleId: item.nextRoleId,
            nextUserId: item.nextUserId,
          }));
          forwardedDeptIdsForAudit = Array.from(
            new Set(dedupedResolvedRecipients.map((item) => item.forwardedDeptId)),
          );

          for (const recipient of dedupedResolvedRecipients) {
            await prisma.forwardApplication.create({
              data: {
                appSubId: options.submissionId,
                nextRoleId: recipient.nextRoleId,
                // Keep department forwarding in role queue so mapped officers of that
                // department/role can pick it from inbox, instead of pinning to one user.
                nextUserId: null,
                verifierUserId: Number(options.userId),
                forwardedDeptId: recipient.forwardedDeptId,
                forwardedDistId:
                  String(workflowConfig.jurisdictionLevel || '').toUpperCase() ===
                  'DISTRICT'
                    ? forwardedDistId || null
                    : null,
                formId: submission.formId || null,
                actionTaken: 'FORWARD',
                actionStatus: 'F',
                approvStatus: 'P',
                verifierUserComment: options.comments || null,
                reasonForDelay: options.reasonForDelay || null,
                createdOn: now,
                updatedDateTime: now,
                ipAddress: options.ipAddress || 'NA',
                userAgent: options.userAgent || 'NA',
              },
            });
          }
        } else if (shouldKeepCurrentStage) {
          // No parallel task creation required for this action path, keep audit clean.
          resolvedRecipientsForAudit = [];
          forwardedDeptIdsForAudit = [];
        } else {
        const descriptorKeys = new Set<string>();
        const targetDescriptors: Array<{
          roleId: number | null;
          userId: number | null;
          deptId: number | null;
          districtId: number | null;
        }> = [];

        const normalizeDescriptor = (descriptor: {
          roleId?: number | null;
          userId?: number | null;
          deptId?: number | null;
          districtId?: number | null;
        }) => {
          if (!descriptor.roleId && !descriptor.userId) return;
          const deptId =
            Number.isFinite(Number(descriptor.deptId ?? NaN)) &&
            descriptor.deptId &&
            descriptor.deptId > 0
              ? descriptor.deptId
              : submission.deptId ?? null;
          const districtId =
            Number.isFinite(Number(descriptor.districtId ?? NaN)) &&
            descriptor.districtId &&
            descriptor.districtId > 0
              ? descriptor.districtId
              : submission.landrigionId ?? null;
          const key = `${descriptor.roleId ?? 'null'}-${descriptor.userId ?? 'null'}-${deptId ?? 'null'}-${districtId ?? 'null'}`;
          if (descriptorKeys.has(key)) return;
          descriptorKeys.add(key);
          targetDescriptors.push({
            roleId: descriptor.roleId ?? null,
            userId: descriptor.userId ?? null,
            deptId,
            districtId,
          });
        };

        if (nextUserIds.length) {
          nextUserIds.forEach((id) =>
            normalizeDescriptor({
              roleId: null,
              userId: id,
              deptId: submission.deptId ?? null,
              districtId: submission.landrigionId ?? null,
            }),
          );
        }

        parsedForwardDestinations.forEach((dest) =>
          normalizeDescriptor({
            roleId: dest.roleId,
            userId: null,
            deptId: dest.deptId ?? submission.deptId ?? null,
            districtId: dest.districtId ?? submission.landrigionId ?? null,
          }),
        );

        if (!targetDescriptors.length && nextRoleIds.length) {
          nextRoleIds.forEach((roleId) =>
            normalizeDescriptor({
              roleId,
              deptId: submission.deptId ?? null,
              districtId: submission.landrigionId ?? null,
            }),
          );
        }

        if (!targetDescriptors.length && !parsedSelectedRecipients.length) {
          throw new BadRequestException(
            'No next assignee found for forward action',
          );
        }

        const resolvedAssignmentTargets: Array<{
          roleId: number | null;
          userId: number | null;
          deptId: number | null;
          districtId: number | null;
        }> = [];
        const submissionDistrictId =
          Number.isFinite(Number(submission.landrigionId)) &&
          Number(submission.landrigionId) > 0
            ? Number(submission.landrigionId)
            : null;

        if (parsedSelectedRecipients.length) {
          if (!transitionRoles.length) {
            throw new BadRequestException(
              'No next_roles configured for FORWARD in workflow transition map',
            );
          }

          const destinationMatrix = parsedForwardDestinations.length
            ? parsedForwardDestinations.map((dest) => ({
                roleId: dest.roleId,
                deptId: dest.deptId ?? submission.deptId ?? null,
                districtId: dest.districtId ?? submissionDistrictId,
              }))
            : forwardedDeptIds.length
              ? forwardedDeptIds.flatMap((deptId) =>
                  transitionRoles.map((roleId) => ({
                    roleId,
                    deptId: Number(deptId),
                    districtId: submissionDistrictId,
                  })),
                )
              : transitionRoles.map((roleId) => ({
                  roleId,
                  deptId: submission.deptId ?? null,
                  districtId: submissionDistrictId,
                }));

          for (const selected of parsedSelectedRecipients) {
            const expectedDestination = destinationMatrix.find(
              (dest) =>
                Number(dest.roleId) === Number(selected.nextRoleId) &&
                Number(dest.deptId) === Number(selected.forwardedDeptId),
            );
            if (!expectedDestination) {
              throw new BadRequestException(
                `Invalid selected recipient for dept ${selected.forwardedDeptId} and role ${selected.nextRoleId}`,
              );
            }

            const mappedUser = await prisma.department_users.findFirst({
              where: {
                user_id: BigInt(selected.nextUserId),
                dept_id: Number(selected.forwardedDeptId),
                ...(expectedDestination.districtId
                  ? { district_id: Number(expectedDestination.districtId) }
                  : {}),
                user: { role_id: Number(selected.nextRoleId) },
              },
              select: { user_id: true },
            });
            if (!mappedUser) {
              throw new BadRequestException(
                `Selected user ${selected.nextUserId} is not allowed for dept ${selected.forwardedDeptId}, role ${selected.nextRoleId}, jurisdiction`,
              );
            }

            const duplicate = resolvedAssignmentTargets.some(
              (target) =>
                Number(target.roleId) === Number(selected.nextRoleId) &&
                Number(target.userId) === Number(selected.nextUserId) &&
                Number(target.deptId) === Number(selected.forwardedDeptId) &&
                Number(target.districtId) ===
                  Number(expectedDestination.districtId ?? NaN),
            );
            if (duplicate) continue;

            resolvedAssignmentTargets.push({
              roleId: Number(selected.nextRoleId),
              userId: Number(selected.nextUserId),
              deptId: Number(selected.forwardedDeptId),
              districtId: expectedDestination.districtId,
            });
          }
        }

        if (!parsedSelectedRecipients.length) {
          for (const descriptor of targetDescriptors) {
            if (descriptor.userId) {
              resolvedAssignmentTargets.push(descriptor);
              continue;
            }
            if (!descriptor.roleId) continue;
            const deptFilter =
              descriptor.deptId && Number.isFinite(descriptor.deptId)
                ? { dept_id: descriptor.deptId }
                : {};
            const districtFilter =
              descriptor.districtId && Number.isFinite(descriptor.districtId)
                ? { district_id: descriptor.districtId }
                : {};
            const mappedUsers = await prisma.department_users.findMany({
              where: {
                ...deptFilter,
                ...districtFilter,
                user: { role_id: descriptor.roleId },
              },
              select: { user_id: true },
            });
            if (mappedUsers.length) {
              mappedUsers.forEach((item) =>
                resolvedAssignmentTargets.push({
                  roleId: descriptor.roleId,
                  userId: Number(item.user_id),
                  deptId: descriptor.deptId,
                  districtId: descriptor.districtId,
                }),
              );
            } else {
              resolvedAssignmentTargets.push({
                roleId: descriptor.roleId,
                userId: null,
                deptId: descriptor.deptId,
                districtId: descriptor.districtId,
              });
            }
          }
        }

        if (!resolvedAssignmentTargets.length) {
          throw new BadRequestException(
            'No next assignee found for forward action',
          );
        }

        for (const target of resolvedAssignmentTargets) {
          const forwardedDeptId = target.deptId ?? submission.deptId ?? null;
          const forwardedDistId =
            target.districtId ?? submission.landrigionId ?? null;
          await prisma.forwardApplication.create({
            data: {
              nextRoleId: target.roleId,
              nextUserId: target.userId,
              verifierUserId: Number(options.userId),
              appSubId: options.submissionId,
              forwardedDeptId,
              forwardedDistId,
              formId: submission.formId || null,
              postInfo: options.comments || null,
              actionTaken: 'ASSIGNED',
              actionStatus: 'P',
              verifierUserComment: null,
              supportiveDocument: null,
              createdOn: now,
              ipAddress: options.ipAddress || null,
              userAgent: options.userAgent || '',
              reasonForDelay: null,
            },
          });
          const targetLabelParts: string[] = [];
          if (forwardedDeptId) targetLabelParts.push(`Dept ${forwardedDeptId}`);
          if (forwardedDistId) targetLabelParts.push(`Dist ${forwardedDistId}`);
          if (target.roleId) targetLabelParts.push(`Role ${target.roleId}`);
          const targetLabel = targetLabelParts.length
            ? targetLabelParts.join(' / ')
            : 'Role queue';
          await prisma.applicationHistory.create({
            data: {
              sno: spApp?.sno ?? null,
              serviceId: options.serviceId,
              spTag: department?.uniqueTag || '',
              appId: String(options.submissionId),
              applicationStatus: 'F',
              comments:
                `Forwarded to ${targetLabel}` +
                (options.comments ? ` - ${options.comments}` : ''),
              approverId: String(options.userRoleId),
              approverDetails: actorName || null,
              nextApprover: target.roleId ? String(target.roleId) : null,
              addedDateTime: now,
              sentDatedTime: null,
              roleId: String(options.userRoleId),
              roleName: actorRoleName || null,
              roleUserInfo: actorName || null,
              nextRoleId: target.roleId ? String(target.roleId) : null,
            },
          });
        }
      }
      }

      if (normalizedAction !== 'F') {
        await prisma.forwardApplication.updateMany({
          where: {
            appSubId: options.submissionId,
            nextRoleId: 3,
            approvStatus: { startsWith: 'P' },
            actionTaken: { in: ['FORWARD', 'F', 'ASSIGNED'] },
          },
          data: {
            approvStatus: 'C',
            actionStatus: 'C',
            updatedDateTime: now,
          },
        });
      }

      await prisma.applicationHistory.create({
        data: {
          sno: spApp?.sno ?? null,
          serviceId: options.serviceId,
          spTag: department?.uniqueTag || '',
          appId: String(options.submissionId),
          applicationStatus: submissionStatus,
          comments: options.comments || null,
          approverId: String(options.userRoleId),
          approverDetails: actorName || null,
          nextApprover: nextRoleId ? String(nextRoleId) : null,
          addedDateTime: now,
          sentDatedTime: null,
          roleId: String(options.userRoleId),
          roleName: actorRoleName || null,
          roleUserInfo: actorName || null,
          nextRoleId: nextRoleId ? String(nextRoleId) : null,
          param1: forwardDestinationsSummary,
        },
      });

      const assignedRoleId =
        normalizedAction === 'F' && shouldKeepCurrentStage
          ? Number(workflowInstance.currentRoleId || 0)
          : normalizedAction === 'F'
          ? nextRoleIds[0] ||
            workflowConfig.nextRoleId ||
            workflowConfig.forwardRoleId ||
            workflowConfig.nextAllocationRoleId ||
            null
          : nextRoleIds[0] ||
            workflowConfig.nextRoleId ||
            workflowConfig.forwardRoleId ||
            workflowConfig.roleId ||
            workflowConfig.currentRoleId ||
            options.userRoleId ||
            null;
      const currentStepValue =
        normalizedAction === 'F' && shouldKeepCurrentStage
          ? Number(workflowConfig.step)
          : transitionResult.nextStep ?? workflowConfig.step;
      const nextDueAt = await this.calculateDueAtForStep(
        prisma,
        normalizedAction === 'F' && shouldKeepCurrentStage
          ? Number(workflowConfig.step)
          : transitionResult.nextStep,
        options.serviceId,
        workflowDefinitionVersion,
      );
      await this.upsertWorkflowInstance(prisma, {
        applicationId: options.submissionId,
        workflowDefinitionVersion,
        currentStep: currentStepValue,
        currentRoleId: assignedRoleId,
        jurisdictionLevel:
          workflowConfig.jurisdictionLevel ||
          submission.processingLevel ||
          workflowConfig.assignmentStrategy ||
          '',
        status: transitionResult.isTerminal ? 'COMPLETED' : 'PENDING',
        dueAt: nextDueAt,
      });
      const auditPayload = {
        ...(options.blockPayload || {}),
        ...(resolvedRecipientsForAudit.length
          ? {
              forwardedDeptIds: forwardedDeptIdsForAudit,
              resolvedRecipients: resolvedRecipientsForAudit,
            }
          : {}),
      };
      await prisma.workflowAudit.create({
        data: {
          applicationId: options.submissionId,
          fromStep: workflowConfig.step,
          toStep:
            normalizedAction === 'F' && shouldKeepCurrentStage
              ? Number(workflowConfig.step)
              : transitionResult.nextStep ?? null,
          action: normalizedAction,
          actorUserId: Number(options.userId),
          remarks: options.comments || null,
          payload: Object.keys(auditPayload).length ? auditPayload : undefined,
        },
      });
      return {
        status: 'ok' as const,
        trace: {
          submissionId: options.submissionId,
          prevStep,
          prevRoleId,
          action: normalizedAction,
          nextStep:
            normalizedAction === 'F' && shouldKeepCurrentStage
              ? Number(workflowConfig.step)
              : transitionResult.nextStep ?? null,
          nextRoles: nextRoleIds,
          pendingDeptTasksBefore,
          pendingDeptTasksAfter,
          keptAtCurrentStage: shouldKeepCurrentStage,
        },
      };
    });
    const persistedInstance = await this.loadWorkflowInstance(
      this.prisma,
      options.submissionId,
    );
    console.log('[workflow-action] persisted state', {
      submissionId: txResult.trace.submissionId,
      prevStep: txResult.trace.prevStep,
      prevRoleId: txResult.trace.prevRoleId,
      action: txResult.trace.action,
      nextStep: txResult.trace.nextStep,
      nextRoles: txResult.trace.nextRoles,
      persistedCurrentStep: Number(persistedInstance?.currentStep || 0),
      persistedCurrentRoleId: Number(persistedInstance?.currentRoleId || 0),
      pendingDeptTasksBefore: txResult.trace.pendingDeptTasksBefore,
      pendingDeptTasksAfter: txResult.trace.pendingDeptTasksAfter,
      keptAtCurrentStage: txResult.trace.keptAtCurrentStage,
    });
    return { status: txResult.status };
  }
  private async hasPendingMandatoryDocuments(
    prisma: PrismaService | Prisma.TransactionClient,
    submissionId: number,
  ) {
    const submission = await prisma.applicationSubmission.findUnique({
      where: { submissionId },
      select: { serviceId: true },
    });
    const requiredDocIds = await this.getRequiredDocumentIdsForService(
      submission?.serviceId,
    );
    if (!requiredDocIds.size) return false;

    const spApp = await prisma.spApplication.findFirst({
      where: { appId: BigInt(submissionId) },
      select: { sno: true },
    });
    const resolvedSno = spApp?.sno ? BigInt(spApp.sno) : BigInt(submissionId);
    if (!resolvedSno) return false; // should never happen but keeps types happy

    const mappingDocs = await prisma.applicationDmsDocumentsMapping.findMany({
      where: {
        sno: resolvedSno,
        serviceId: submission?.serviceId || undefined,
      },
      select: { mappingId: true, documentsId: true },
      orderBy: [{ mappingId: 'desc' }],
    });
    const docIds = Array.from(
      new Set(mappingDocs.map((m) => Number(m.documentsId))).values(),
    ).filter((id) => Number.isFinite(id) && id > 0);
    if (!docIds.length) return true;

    const investorDocs = await prisma.investorDocument.findMany({
      where: { id: { in: docIds.map((id) => BigInt(id)) } },
      select: {
        id: true,
        documentStatus: true,
        documentMasterId: true,
      },
    });
    const docById = new Map(
      investorDocs.map((doc) => [Number(doc.id), doc] as const),
    );
    const latestStatusByMaster = new Map<number, string>();
    for (const map of mappingDocs) {
      const doc = docById.get(Number(map.documentsId));
      if (!doc) continue;
      const masterId = Number(doc.documentMasterId);
      if (!Number.isFinite(masterId) || masterId <= 0) continue;
      // mapping rows are ordered latest-first; first row per master is current version.
      if (latestStatusByMaster.has(masterId)) continue;
      latestStatusByMaster.set(
        masterId,
        String(doc.documentStatus || '').toUpperCase(),
      );
    }

    for (const requiredMasterId of requiredDocIds) {
      const status = latestStatusByMaster.get(requiredMasterId);
      if (!status) return true;
      if (status !== 'V') return true;
    }
    return false;
  }

  async getActivities(options: {
    userId: bigint;
    userRoleId: number;
    serviceId?: string;
  }) {
    const userIdNumber = Number(options.userId);
    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { dept_id: true, district_id: true },
    });

    const rows = await this.prisma.forwardApplication.findMany({
      where: {
        appSubId: { not: null },
        actionStatus: 'P',
        OR: [
          { nextUserId: userIdNumber },
          {
            nextUserId: null,
            nextRoleId: options.userRoleId,
            ...(deptUser?.dept_id ? { forwardedDeptId: deptUser.dept_id } : {}),
            ...(deptUser?.district_id
              ? { forwardedDistId: deptUser.district_id }
              : {}),
          },
        ],
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });

    const submissionIds = Array.from(
      new Set(
        rows
          .map((r) => Number(r.appSubId))
          .filter((x) => Number.isFinite(x) && x > 0),
      ),
    );
    if (!submissionIds.length) return [];

    const submissions = await this.prisma.applicationSubmission.findMany({
      where: { submissionId: { in: submissionIds } },
      select: {
        submissionId: true,
        serviceId: true,
        unitName: true,
        applicationStatus: true,
        deptId: true,
        processingLevel: true,
        applicationUpdatedDateTime: true,
      },
    });

    const serviceFilter = options.serviceId ? String(options.serviceId) : '';
    const serviceIds = Array.from(new Set(submissions.map((s) => s.serviceId)));
    const services = await this.prisma.service.findMany({
      where: { service_id: { in: serviceIds } },
      select: { service_id: true, service_name: true },
    });
    const serviceNameMap = new Map(
      services.map((s) => [s.service_id || '', s.service_name || s.service_id]),
    );

    return submissions
      .filter((s) => !serviceFilter || s.serviceId === serviceFilter)
      .map((s) => {
        const row = rows.find((x) => Number(x.appSubId) === s.submissionId);
        return {
          submissionId: s.submissionId,
          serviceId: s.serviceId,
          serviceName: serviceNameMap.get(s.serviceId) || s.serviceId,
          unitName: s.unitName || `Application #${s.submissionId}`,
          status: s.applicationStatus,
          assignedOn: row?.createdOn || s.applicationUpdatedDateTime,
          nextRoleId: row?.nextRoleId || null,
          nextUserId: row?.nextUserId || null,
          processingLevel: s.processingLevel,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.assignedOn as any).getTime() -
          new Date(a.assignedOn as any).getTime(),
      );
  }

  async listInbox(options: {
    userId: bigint;
    userRoleId: number;
    serviceId?: string;
    tab?: string;
    page?: number;
    limit?: number;
  }) {
    const page =
      Number.isFinite(Number(options.page)) && Number(options.page) > 0
        ? Number(options.page)
        : 1;
    const limit =
      Number.isFinite(Number(options.limit)) && Number(options.limit) > 0
        ? Math.min(Number(options.limit), 100)
        : 20;
    const skip = (page - 1) * limit;
    const expectedStep = this.getExpectedStepByRole(options.userRoleId);
    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { dept_id: true, district_id: true },
    });
    const actorDeptId =
      Number.isFinite(Number(deptUser?.dept_id)) && Number(deptUser?.dept_id) > 0
        ? Number(deptUser?.dept_id)
        : null;
    const actorDistrictId =
      Number.isFinite(Number(deptUser?.district_id)) &&
      Number(deptUser?.district_id) > 0
        ? Number(deptUser?.district_id)
        : null;
    const actorUserId = Number(options.userId);
    const normalizeStatusCode = (value?: string | null) =>
      String(value || '').trim().toUpperCase();
    const normalizedTab = String(options.tab || '')
      .trim()
      .toLowerCase();
    const tabStatusMap: Record<string, string[]> = {
      pending: ['P', 'PENDING'],
      forwarded: ['F', 'FORWARDED'],
      forward_to_approver: ['FA'],
      approved: ['A', 'APPROVED'],
      rejected: ['R', 'REJECT', 'REJECTED', 'RBI', 'REVERTED'],
      completed: ['A', 'APPROVED', 'R', 'REJECT', 'REJECTED', 'RBI', 'REVERTED'],
    };
    const applyTabFilter = <T extends { status?: string | null }>(rows: T[]) => {
      if (!normalizedTab || normalizedTab === 'history' || normalizedTab === 'all') {
        return rows;
      }
      const allowed = tabStatusMap[normalizedTab] || [];
      if (!allowed.length) return rows;
      return rows.filter((row) =>
        WorkflowRuntimeService.hasStatus(allowed, normalizeStatusCode(row.status)),
      );
    };
    if (Number(options.userRoleId) === 3) {
      const pendingAssignments = await this.prisma.forwardApplication.findMany({
        where: {
          appSubId: { not: null },
          nextRoleId: 3,
          approvStatus: { startsWith: 'P' },
        },
        select: {
          appSubId: true,
          nextUserId: true,
          forwardedDeptId: true,
          forwardedDistId: true,
          createdOn: true,
        },
        orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
      });
      const matchedAssignments = pendingAssignments.filter((row) =>
        this.matchPendingAssignmentForUser(row, {
          actorUserId,
          actorDeptId,
          actorDistrictId,
        }),
      );
      const submissionIds = Array.from(
        new Set(
          matchedAssignments
            .map((row) => Number(row.appSubId))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      if (!submissionIds.length) {
        return {
          counts: { pending: 0, total: 0 },
          items: [],
          page,
          limit,
          total: 0,
        };
      }
      const submissions = await this.prisma.applicationSubmission.findMany({
        where: {
          submissionId: { in: submissionIds },
          ...(options.serviceId ? { serviceId: String(options.serviceId) } : {}),
        },
        select: {
          submissionId: true,
          serviceId: true,
          unitName: true,
          fieldValue: true,
          applicationStatus: true,
          deptId: true,
        },
      });
      const submissionMap = new Map(
        submissions.map((submission) => [
          Number(submission.submissionId),
          submission,
        ]),
      );
      const workflowRows = await this.prisma.workflowInstance.findMany({
        where: { applicationId: { in: submissionIds } },
        select: {
          applicationId: true,
          currentStep: true,
          currentRoleId: true,
          dueAt: true,
          updatedAt: true,
        },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      });
      const workflowMap = new Map(
        workflowRows.map((row) => [Number(row.applicationId), row]),
      );
      const serviceIds = Array.from(
        new Set(submissions.map((submission) => submission.serviceId)),
      );
      const services = serviceIds.length
        ? await this.prisma.service.findMany({
            where: { service_id: { in: serviceIds } },
            select: { service_id: true, service_name: true },
          })
        : [];
      const serviceMap = new Map(
        services.map((service) => [
          service.service_id || '',
          service.service_name || service.service_id,
        ]),
      );
      const deptIds = Array.from(
        new Set(
          submissions
            .map((submission) => Number(submission.deptId || 0))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      const departments = deptIds.length
        ? await this.prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true },
          })
        : [];
      const departmentMap = new Map(
        departments.map((department) => [
          department.id,
          department.name || `Department ${department.id}`,
        ]),
      );
      const rows = matchedAssignments
        .map((assignment) => {
          const submissionId = Number(assignment.appSubId);
          const submission = submissionMap.get(submissionId);
          if (!submission) return null;
          const workflowRow = workflowMap.get(submissionId);
          const dueAt = workflowRow?.dueAt || null;
          return {
            id: submissionId,
            submissionId,
            serviceId: submission.serviceId,
            serviceName:
              serviceMap.get(submission.serviceId) || submission.serviceId,
            unitName: submission.unitName || `Application #${submissionId}`,
            investorName:
              WorkflowRuntimeService.extractTaskApplicantName(
                submission.fieldValue,
              ) || 'N/A',
            department:
              departmentMap.get(Number(submission.deptId || 0)) || 'N/A',
            receivedDate: assignment.createdOn || workflowRow?.updatedAt || new Date(),
            currentStep: Number(workflowRow?.currentStep || 3),
            currentRoleId: Number(workflowRow?.currentRoleId || 3),
            dueAt,
            slaBreached: Boolean(dueAt && new Date() > dueAt),
            // Role-3 inbox is queue-driven; pending assignments must appear as
            // pending-with-me regardless of global submission status (F/FA/etc).
            status: 'P',
            statusLabel: 'Pending',
            actionUrl: this.resolveWorkflowActionUrlByRole(
              Number(options.userRoleId),
              submissionId,
            ),
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort(
          (a, b) =>
            new Date(b.receivedDate as any).getTime() -
            new Date(a.receivedDate as any).getTime(),
        );
      const filteredRows = applyTabFilter(rows);
      const total = filteredRows.length;
      const items = filteredRows.slice(skip, skip + limit);
      return {
        counts: {
          pending: total,
          total,
        },
        items,
        page,
        limit,
        total,
      };
    }

    const workflowRows = await this.prisma.workflowInstance.findMany({
      where: {
        currentRoleId: Number(options.userRoleId),
        status: 'PENDING',
        ...(expectedStep ? { currentStep: expectedStep } : {}),
      },
      select: {
        applicationId: true,
        currentStep: true,
        currentRoleId: true,
        dueAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    const applicationIds = Array.from(
      new Set(
        workflowRows
          .map((row) => Number(row.applicationId))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
    if (!applicationIds.length) {
      return {
        counts: { pending: 0, total: 0 },
        items: [],
        page,
        limit,
        total: 0,
      };
    }

    const pendingAssignments = await this.prisma.forwardApplication.findMany({
      where: {
        appSubId: { in: applicationIds },
        nextRoleId: Number(options.userRoleId),
        approvStatus: { startsWith: 'P' },
      },
      select: {
        appSubId: true,
        nextUserId: true,
        forwardedDeptId: true,
        forwardedDistId: true,
        createdOn: true,
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });
    const assignmentsBySubmission = new Map<
      number,
      Array<{
        appSubId: number | null;
        nextUserId: number | null;
        forwardedDeptId: number | null;
        forwardedDistId: number | null;
        createdOn: Date | null;
      }>
    >();
    pendingAssignments.forEach((row) => {
      const submissionId = Number(row.appSubId);
      if (!Number.isFinite(submissionId) || submissionId <= 0) return;
      if (!assignmentsBySubmission.has(submissionId)) {
        assignmentsBySubmission.set(submissionId, []);
      }
      assignmentsBySubmission.get(submissionId)!.push(row);
    });

    const submissions = await this.prisma.applicationSubmission.findMany({
      where: {
        submissionId: { in: applicationIds },
        ...(options.serviceId ? { serviceId: String(options.serviceId) } : {}),
      },
      select: {
        submissionId: true,
        serviceId: true,
        unitName: true,
        fieldValue: true,
        applicationStatus: true,
        applicationUpdatedDateTime: true,
        deptId: true,
      },
    });
    const submissionMap = new Map(
      submissions.map((submission) => [Number(submission.submissionId), submission]),
    );
    const filteredRowsRaw = workflowRows.map((workflowRow) => {
      const submissionId = Number(workflowRow.applicationId);
      const submission = submissionMap.get(submissionId);
      if (!submission) return null;
      const assignmentRows = assignmentsBySubmission.get(submissionId) || [];
      const hasMatchingAssignment = assignmentRows.some((row) =>
        this.matchPendingAssignmentForUser(row, {
          actorUserId,
          actorDeptId,
          actorDistrictId,
        }),
      );
      const isActionable =
        Number(options.userRoleId) === 3
          ? hasMatchingAssignment
          : !assignmentRows.length || hasMatchingAssignment;
      if (!isActionable) return null;
      const lastAssignedAt = assignmentRows.length
        ? assignmentRows[0]?.createdOn || workflowRow.updatedAt
        : workflowRow.updatedAt;
      return {
        submissionId,
        workflowRow,
        submission,
        assignedAt: lastAssignedAt || workflowRow.updatedAt,
      };
    });
    const filteredRows = filteredRowsRaw
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
      );
    const tabFilteredRows = applyTabFilter(
      filteredRows.map((row) => ({
        ...row,
        status: row.submission?.applicationStatus || '',
      })),
    );
    const total = tabFilteredRows.length;
    if (!total) {
      return {
        counts: { pending: 0, total: 0 },
        items: [],
        page,
        limit,
        total: 0,
      };
    }

    const pageRows = tabFilteredRows.slice(skip, skip + limit);
    const serviceIds = Array.from(
      new Set(pageRows.map((row) => row.submission.serviceId)),
    );
    const services = serviceIds.length
      ? await this.prisma.service.findMany({
          where: { service_id: { in: serviceIds } },
          select: { service_id: true, service_name: true },
        })
      : [];
    const serviceMap = new Map(
      services.map((service) => [
        service.service_id || '',
        service.service_name || service.service_id,
      ]),
    );
    const deptIds = Array.from(
      new Set(
        pageRows
          .map((row) => Number(row.submission.deptId || 0))
          .filter((value) => Number.isFinite(value) && value > 0),
      ),
    );
    const departments = deptIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        })
      : [];
    const departmentMap = new Map(
      departments.map((department) => [
        department.id,
        department.name || `Department ${department.id}`,
      ]),
    );

    const items = pageRows.map((row) => {
      const dueAt = row.workflowRow.dueAt || null;
      return {
        id: row.submissionId,
        submissionId: row.submissionId,
        serviceId: row.submission.serviceId,
        serviceName:
          serviceMap.get(row.submission.serviceId) || row.submission.serviceId,
        unitName: row.submission.unitName || `Application #${row.submissionId}`,
        investorName:
          WorkflowRuntimeService.extractTaskApplicantName(
            row.submission.fieldValue,
          ) || 'N/A',
        department:
          departmentMap.get(Number(row.submission.deptId || 0)) || 'N/A',
        receivedDate: row.assignedAt,
        currentStep: Number(row.workflowRow.currentStep || 0),
        currentRoleId: Number(row.workflowRow.currentRoleId || 0),
        dueAt,
        slaBreached: Boolean(dueAt && new Date() > dueAt),
        status: row.submission.applicationStatus,
        statusLabel: WorkflowRuntimeService.getFriendlyStatus(
          row.submission.applicationStatus,
        ),
        actionUrl: this.resolveWorkflowActionUrlByRole(
          Number(options.userRoleId),
          row.submissionId,
        ),
      };
    });

    return {
      counts: {
        pending: total,
        total,
      },
      items,
      page,
      limit,
      total,
    };
  }

  async getRoleDashboard(options: {
    userId: bigint;
    userRoleId?: number;
    serviceId?: string;
    deptId?: number;
    statuses?: string[];
    processingLevel?: string;
  }) {
    const normalizeServiceId = (value?: string | null) =>
      String(value || '')
        .trim()
        .replace(/\.0+$/, '');
    if (Number(options.userRoleId || 0) === 7) {
      const workflowRows = await this.prisma.workflowInstance.findMany({
        where: {
          currentRoleId: 7,
          currentStep: 2,
          status: 'PENDING',
        },
        select: { applicationId: true },
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      });
      const forwardedRows = await this.prisma.forwardApplication.findMany({
        where: {
          verifierUserId: Number(options.userId),
          actionTaken: { in: ['FORWARD', 'F', 'ASSIGNED'] },
          approvStatus: { startsWith: 'P' },
          appSubId: { not: null },
        },
        select: { appSubId: true },
        orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
      });
      const actionRows = await this.prisma.workflowAudit.findMany({
        where: {
          actorUserId: options.userId,
          action: { in: ['P', 'F', 'FA', 'A', 'R', 'RBI', 'H'] },
        },
        select: { applicationId: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      const targetSubmissionIds = Array.from(
        new Set(
          [
            ...workflowRows.map((row) => Number(row.applicationId)),
            ...forwardedRows.map((row) => Number(row.appSubId)),
            ...actionRows.map((row) => Number(row.applicationId)),
          ].filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      if (!targetSubmissionIds.length) {
        return {
          counts: {
            all: 0,
            pending: 0,
            forwarded: 0,
            forwardToApprover: 0,
            approved: 0,
            rejected: 0,
            reverted: 0,
          },
          applications: [],
        };
      }
      const targetServiceId = options.serviceId
        ? normalizeServiceId(String(options.serviceId))
        : undefined;
      const allowedStatuses =
        Array.isArray(options.statuses) && options.statuses.length > 0
          ? options.statuses.map((s) => String(s).toUpperCase())
          : undefined;
      const submissions = await this.prisma.applicationSubmission.findMany({
        where: {
          submissionId: { in: targetSubmissionIds },
          ...(allowedStatuses
            ? { applicationStatus: { in: allowedStatuses } }
            : {}),
        },
        select: {
          submissionId: true,
          unitName: true,
          fieldValue: true,
          submittedOn: true,
          applicationCreatedDate: true,
          applicationStatus: true,
          deptId: true,
          serviceId: true,
        },
        orderBy: { submissionId: 'asc' },
      });
      const latestRole7Actions = await this.prisma.workflowAudit.findMany({
        where: {
          applicationId: { in: targetSubmissionIds.map((id) => BigInt(id)) },
          actorUserId: options.userId,
          action: { in: ['P', 'F', 'FA', 'A', 'R', 'RBI', 'H'] },
        },
        select: {
          applicationId: true,
          action: true,
          createdAt: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      const latestActionBySubmission = new Map<number, string>();
      latestRole7Actions.forEach((row) => {
        const submissionId = Number(row.applicationId);
        if (!Number.isFinite(submissionId) || submissionId <= 0) return;
        if (latestActionBySubmission.has(submissionId)) return;
        latestActionBySubmission.set(submissionId, String(row.action || '').toUpperCase());
      });
      const pendingSubmissionIds = new Set(
        workflowRows
          .map((row) => Number(row.applicationId))
          .filter((value) => Number.isFinite(value) && value > 0),
      );
      const activeForwardedSubmissionIds = new Set(
        forwardedRows
          .map((row) => Number(row.appSubId))
          .filter((value) => Number.isFinite(value) && value > 0),
      );
      const filteredSubmissions = targetServiceId
        ? submissions.filter(
            (row) => normalizeServiceId(row.serviceId) === targetServiceId,
          )
        : submissions;
      const deptIds = Array.from(
        new Set(
          filteredSubmissions
            .map((s) => Number(s.deptId))
            .filter((x) => Number.isFinite(x) && x > 0),
        ),
      );
      const departments = deptIds.length
        ? await this.prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, name: true },
          })
        : [];
      const deptMap = new Map(
        departments.map((d) => [d.id, d.name || `Department ${d.id}`]),
      );
      const getStatusLabel = (status: string) =>
        WorkflowRuntimeService.getFriendlyStatus(status);
      const getCompanyName = (
        fieldValue: unknown,
        fallbackUnitName?: string | null,
      ) => {
        const src = (fieldValue || {}) as Record<string, unknown>;
        const company = (src.company || {}) as Record<string, unknown>;
        const corp = (company.corp || {}) as Record<string, unknown>;
        const applicant = (src.applicant || {}) as Record<string, unknown>;
        return (
          (corp.name as string) ||
          (corp.company_name as string) ||
          (company.company_name as string) ||
          (src.company_name as string) ||
          (src.companyName as string) ||
          (applicant.companyName as string) ||
          fallbackUnitName ||
          'N/A'
        );
      };
      const applications = filteredSubmissions.map((s) => {
        const submissionId = Number(s.submissionId);
        const lastRole7Action = latestActionBySubmission.get(submissionId);
        const resolvedStatus = pendingSubmissionIds.has(submissionId)
          ? activeForwardedSubmissionIds.has(submissionId)
            ? 'F'
            : 'P'
          : lastRole7Action || s.applicationStatus;
        return {
          id: s.submissionId,
          submissionId: s.submissionId,
          unitName: s.unitName || `Application #${s.submissionId}`,
          companyName: getCompanyName(s.fieldValue, s.unitName),
          submissionDate: s.submittedOn || s.applicationCreatedDate,
          department: deptMap.get(Number(s.deptId)) || `Department ${s.deptId}`,
          status: resolvedStatus,
          statusLabel: getStatusLabel(resolvedStatus),
          serviceId: s.serviceId,
        };
      });
      const normalized = applications.map((a) =>
        String(a.status || '').toUpperCase(),
      );
      const counts = {
        all: applications.length,
        pending: normalized.filter((s) =>
          WorkflowRuntimeService.hasStatus(
            WorkflowRuntimeService.STATUS_GROUPS.pending,
            s,
          ),
        ).length,
        // In role-7 dashboard, forwarded must exclude FA so it represents
        // only forwarding to departments.
        forwarded: normalized.filter((s) =>
          WorkflowRuntimeService.hasStatus(['F', 'FORWARDED'], s),
        ).length,
        forwardToApprover: normalized.filter((s) => s === 'FA').length,
        approved: normalized.filter((s) =>
          WorkflowRuntimeService.hasStatus(
            WorkflowRuntimeService.STATUS_GROUPS.approved,
            s,
          ),
        ).length,
        reverted: normalized.filter((s) =>
          WorkflowRuntimeService.hasStatus(['RBI', 'REVERTED'], s),
        ).length,
        rejected: normalized.filter((s) =>
          WorkflowRuntimeService.hasStatus(
            ['R', 'REJECT', 'REJECTED'],
            s,
          ),
        ).length,
      };
      const byStatus: Record<string, number> = {};
      normalized.forEach((code) => {
        byStatus[code] = (byStatus[code] || 0) + 1;
      });
      return { counts, byStatus, applications };
    }

    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { dept_id: true, district_id: true },
    });

    if (!deptUser?.district_id) {
      return {
        counts: {
          all: 0,
          pending: 0,
          forwarded: 0,
          approved: 0,
          rejected: 0,
        },
        applications: [],
      };
    }

    const targetServiceId = options.serviceId
      ? String(options.serviceId)
      : undefined;
    const targetDeptId =
      Number.isFinite(Number(options.deptId)) && Number(options.deptId) > 0
        ? Number(options.deptId)
        : undefined;
    const allowedStatuses =
      Array.isArray(options.statuses) && options.statuses.length > 0
        ? options.statuses.map((s) => String(s).toUpperCase())
        : undefined;
    const requestedProcessingLevel = options.processingLevel
      ? String(options.processingLevel).trim().toLowerCase()
      : '';
    const targetProcessingLevel = requestedProcessingLevel
      ? (Object.values(ProcessingLevel).find(
          (level) => String(level).toLowerCase() === requestedProcessingLevel,
        ) as ProcessingLevel | undefined)
      : undefined;

    const submissions = await this.prisma.applicationSubmission.findMany({
      where: {
        ...(targetServiceId ? { serviceId: targetServiceId } : {}),
        ...(targetDeptId ? { deptId: targetDeptId } : {}),
        ...(targetProcessingLevel
          ? { processingLevel: targetProcessingLevel }
          : {}),
        landrigionId: Number(deptUser.district_id),
        ...(allowedStatuses
          ? { applicationStatus: { in: allowedStatuses } }
          : {}),
      },
      select: {
        submissionId: true,
        unitName: true,
        fieldValue: true,
        submittedOn: true,
        applicationCreatedDate: true,
        applicationStatus: true,
        deptId: true,
        serviceId: true,
      },
      orderBy: { submissionId: 'asc' },
    });

    const deptIds = Array.from(
      new Set(
        submissions
          .map((s) => Number(s.deptId))
          .filter((x) => Number.isFinite(x) && x > 0),
      ),
    );
    const departments = deptIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true },
        })
      : [];
    const deptMap = new Map(
      departments.map((d) => [d.id, d.name || `Department ${d.id}`]),
    );

    const getStatusLabel = (status: string) =>
      WorkflowRuntimeService.getFriendlyStatus(status);

    const getCompanyName = (
      fieldValue: unknown,
      fallbackUnitName?: string | null,
    ) => {
      const src = (fieldValue || {}) as Record<string, unknown>;
      const company = (src.company || {}) as Record<string, unknown>;
      const corp = (company.corp || {}) as Record<string, unknown>;
      const applicant = (src.applicant || {}) as Record<string, unknown>;
      return (
        (corp.name as string) ||
        (corp.company_name as string) ||
        (company.company_name as string) ||
        (src.company_name as string) ||
        (src.companyName as string) ||
        (applicant.companyName as string) ||
        fallbackUnitName ||
        'N/A'
      );
    };

    const applications = submissions.map((s) => ({
      id: s.submissionId,
      submissionId: s.submissionId,
      unitName: s.unitName || `Application #${s.submissionId}`,
      companyName: getCompanyName(s.fieldValue, s.unitName),
      submissionDate: s.submittedOn || s.applicationCreatedDate,
      department: deptMap.get(Number(s.deptId)) || `Department ${s.deptId}`,
      status: s.applicationStatus,
      statusLabel: getStatusLabel(s.applicationStatus),
      serviceId: s.serviceId,
    }));

    const normalized = applications.map((a) =>
      String(a.status || '').toUpperCase(),
    );
    const counts = {
      all: applications.length,
      pending: normalized.filter((s) =>
        WorkflowRuntimeService.hasStatus(
          WorkflowRuntimeService.STATUS_GROUPS.pending,
          s,
        ),
      ).length,
      forwarded: normalized.filter((s) =>
        WorkflowRuntimeService.hasStatus(
          WorkflowRuntimeService.STATUS_GROUPS.forwarded,
          s,
        ),
      ).length,
      approved: normalized.filter((s) =>
        WorkflowRuntimeService.hasStatus(
          WorkflowRuntimeService.STATUS_GROUPS.approved,
          s,
        ),
      ).length,
      rejected: normalized.filter((s) =>
        WorkflowRuntimeService.hasStatus(
          WorkflowRuntimeService.STATUS_GROUPS.rejected,
          s,
        ),
      ).length,
    };
    const byStatus: Record<string, number> = {};
    normalized.forEach((code) => {
      byStatus[code] = (byStatus[code] || 0) + 1;
    });

    return { counts, byStatus, applications };
  }

  async getActivityDetail(options: {
    userId: bigint;
    userRoleId: number;
    submissionId: number;
  }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }

    const workflowInstance = await this.loadWorkflowInstance(
      this.prisma,
      options.submissionId,
    );
    if (!workflowInstance) {
      throw new BadRequestException('Workflow instance not found for this submission');
    }

    const currentStep = Number(workflowInstance.currentStep || 1);
    const currentRoleId = Number(workflowInstance.currentRoleId || 0);
    const actionAccess = await this.resolveActionAccess(this.prisma, {
      submissionId: options.submissionId,
      userId: options.userId,
      userRoleId: options.userRoleId,
      currentRoleId,
    });
    let workflowVersion = Number(
      submission.workflowConfigVersion ||
        workflowInstance.workflowDefinitionVersion ||
        0,
    );
    if (!workflowVersion) {
      const latestPublished =
        await this.prisma.applicationWorkflowConfiguration.findFirst({
          where: {
            serviceId: submission.serviceId,
            status: 'PUBLISHED' as any,
          },
          select: { configVersion: true },
          orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
        });
      workflowVersion = Number(latestPublished?.configVersion || 0);
      if (!workflowVersion) {
        throw new BadRequestException(
          'Published workflow version not found for service',
        );
      }
      await this.prisma.applicationSubmission.update({
        where: { submissionId: submission.submissionId },
        data: { workflowConfigVersion: workflowVersion },
      });
    }

    // Always resolve the active step config from the current workflow instance step/role.
    const workflowConfigMatches =
      await this.prisma.applicationWorkflowConfiguration.findMany({
        where: {
          serviceId: submission.serviceId,
          status: 'PUBLISHED' as any,
          configVersion: workflowVersion,
          step: currentStep,
          currentRoleId,
        },
        orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
        include: {
          formType: true,
          jurisdictionLevelMaster: true,
          assignmentStrategyMaster: true,
        },
      });
    let resolvedWorkflowConfigCandidates = workflowConfigMatches;
    if (
      !resolvedWorkflowConfigCandidates.length &&
      Number(options.userRoleId || 0) !== Number(currentRoleId || 0) &&
      actionAccess.allowed
    ) {
      const delegatedStep = this.getExpectedStepByRole(options.userRoleId);
      if (delegatedStep) {
        resolvedWorkflowConfigCandidates =
          await this.prisma.applicationWorkflowConfiguration.findMany({
            where: {
              serviceId: submission.serviceId,
              status: 'PUBLISHED' as any,
              configVersion: workflowVersion,
              step: delegatedStep,
              currentRoleId: Number(options.userRoleId || 0),
            },
            orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
            include: {
              formType: true,
              jurisdictionLevelMaster: true,
              assignmentStrategyMaster: true,
            },
          });
      }
    }
    if (!resolvedWorkflowConfigCandidates.length) {
      throw new BadRequestException(
        `Workflow configuration not found for step ${currentStep}`,
      );
    }

    const submissionFormTypeId = Number(submission.formId || 0);
    let resolvedWorkflowConfigMatches = resolvedWorkflowConfigCandidates;
    if (resolvedWorkflowConfigCandidates.length > 1) {
      if (submissionFormTypeId > 0) {
        const formTypeMatchedConfigs = resolvedWorkflowConfigCandidates.filter(
          (row) => Number(row.formTypeId || 0) === submissionFormTypeId,
        );
        if (formTypeMatchedConfigs.length === 1) {
          resolvedWorkflowConfigMatches = formTypeMatchedConfigs;
        } else if (formTypeMatchedConfigs.length > 1) {
          throw new BadRequestException(
            'Multiple workflow configs found for this step/role; please fix configuration',
          );
        } else {
          throw new BadRequestException(
            'Multiple workflow configs found for this step/role; please fix configuration',
          );
        }
      } else {
        throw new BadRequestException(
          'Multiple workflow configs found for this step/role; please fix configuration',
        );
      }
    }
    const workflowConfig = resolvedWorkflowConfigMatches[0];

    const workflowStepConfigs =
      await this.prisma.applicationWorkflowConfiguration.findMany({
        where: {
          serviceId: submission.serviceId,
          status: 'PUBLISHED' as any,
          processingLevel: submission.processingLevel,
          configVersion: workflowConfig.configVersion,
        },
        orderBy: [{ step: 'asc' }, { id: 'asc' }],
        include: {
          formType: true,
        },
      });

    const forwardRows = await this.prisma.forwardApplication.findMany({
      where: { appSubId: options.submissionId },
      orderBy: { createdOn: 'desc' },
      take: 50,
    });
    const pendingRows = forwardRows.filter(
      (r) => r.actionStatus === 'P' && r.actionTaken === 'ASSIGNED',
    );
    const effectiveActionAllowedJson = (() => {
      const raw = Array.isArray(workflowConfig.actionAllowedJson)
        ? (workflowConfig.actionAllowedJson as any[]).map((entry) =>
            this.normalizeActionCode(String(entry || '')),
          )
        : [];
      const normalized = Array.from(
        new Set(
          raw
            .map((code) => String(code || '').trim().toUpperCase())
            .filter(Boolean),
        ),
      );
      const shouldExposeRetainedParallelActions =
        Number(options.userRoleId || 0) === 7 &&
        Number(currentRoleId || 0) === 7 &&
        Number(currentStep || 0) === 2 &&
        pendingRows.length > 0 &&
        this.isParallelForwardEnabled(workflowConfig.assignmentRuleJson) &&
        this.isParallelForwardRetainOwnershipEnabled(
          workflowConfig.assignmentRuleJson,
        );
      if (shouldExposeRetainedParallelActions) {
        ['F', 'FA', 'RBI'].forEach((code) => {
          if (!normalized.includes(code)) normalized.push(code);
        });
      }
      return normalized;
    })();

    const transitionMap = (workflowConfig.transitionMapJson as any) || {};
    const candidateRoleIds = Array.from(
      new Set(
        Object.values(transitionMap)
          .flatMap((entry: any) =>
            Array.isArray(entry?.next_roles) ? entry.next_roles : [],
          )
          .map((x: any) => Number(x))
          .filter((x: number) => Number.isFinite(x) && x > 0),
      ),
    );
    const assignableUsers = candidateRoleIds.length
      ? await this.prisma.department_users.findMany({
          where: {
            dept_id: submission.deptId,
            ...(submission.landrigionId
              ? { district_id: submission.landrigionId }
              : {}),
            user: { role_id: { in: candidateRoleIds } },
          },
          select: {
            user_id: true,
            full_name: true,
            district_id: true,
            dept_id: true,
            user: { select: { role_id: true } },
          },
        })
      : [];

    const uiSections = (() => {
      const fromConfig = (workflowConfig.assignmentRuleJson as any)?.uiSections;
      if (Array.isArray(fromConfig) && fromConfig.length) return fromConfig;
      return [
        'APPLICATION_VIEW',
        'DOCUMENTS_VIEW',
        'TIMELINE_VIEW',
        'ACTIONABLE_ITEMS',
      ];
    })();

    // UI must use form type from the current step config, not submission form id.
    const rawResolvedFormType =
      workflowConfig.formType?.abbr || workflowConfig.formType?.name || null;
    // BUSINESS RULE: expose canonical verifier form type for nodal step fallback.
    const resolvedFormType = (() => {
      const canonical = this.normalizeWorkflowFormType(rawResolvedFormType);
      if (
        canonical === 'PROCESSING_FORM' &&
        Number(workflowConfig.step) === 2 &&
        Number(workflowConfig.roleId || workflowConfig.currentRoleId) === 7
      ) {
        return 'PROCESSING_FORM_VERIFIER_LEVEL';
      }
      return canonical;
    })();
    const currentStepConfig = {
      id: workflowConfig.id,
      step: workflowConfig.step,
      configVersion: workflowConfig.configVersion,
      roleId: workflowConfig.roleId || workflowConfig.currentRoleId,
      currentRoleId: workflowConfig.currentRoleId || workflowConfig.roleId,
      status: workflowConfig.status,
      formTypeId: workflowConfig.formTypeId,
      formType: resolvedFormType,
      form_type: resolvedFormType,
      subResponsibility: workflowConfig.subformActionName || null,
      sub_responsibility: workflowConfig.subformActionName || null,
      jurisdictionLevel: workflowConfig.jurisdictionLevel,
      jurisdiction_level: workflowConfig.jurisdictionLevel,
      assignmentStrategy: workflowConfig.assignmentStrategy,
      assignment_strategy: workflowConfig.assignmentStrategy,
      assignmentRuleJson: workflowConfig.assignmentRuleJson || null,
      assignment_rule_json: workflowConfig.assignmentRuleJson || null,
      actionAllowedJson: actionAccess.allowed
        ? effectiveActionAllowedJson
        : [],
      action_allowed_json: actionAccess.allowed
        ? effectiveActionAllowedJson
        : [],
      transitionMapJson: workflowConfig.transitionMapJson || {},
      transition_map_json: workflowConfig.transitionMapJson || {},
      slaHours: workflowConfig.slaHours,
      sla_hours: workflowConfig.slaHours,
      slaBreachRequiresReason: workflowConfig.slaBreachRequiresReason,
      sla_breach_requires_reason: workflowConfig.slaBreachRequiresReason,
      processingLevel: workflowConfig.processingLevel,
    };

    return {
      submission: {
        submissionId: submission.submissionId,
        serviceId: submission.serviceId,
        formId: submission.formId,
        status: submission.applicationStatus,
        unitName: submission.unitName,
        processingLevel: submission.processingLevel,
        departmentId: submission.deptId,
        districtId: submission.landrigionId,
      },
      currentStep,
      currentRoleId,
      currentStepConfig,
      workflowStepConfigs: workflowStepConfigs.map((config) => ({
        id: config.id,
        step: config.step,
        configVersion: config.configVersion,
        roleId: config.roleId,
        currentRoleId: config.currentRoleId,
        status: config.status,
        formTypeId: config.formTypeId,
        formType: this.normalizeWorkflowFormType(
          config.formType?.abbr || config.formType?.name || null,
        ),
        subResponsibility: config.subformActionName || null,
        jurisdictionLevel: config.jurisdictionLevel,
        actionAllowedJson: config.actionAllowedJson || [],
        transitionMapJson: config.transitionMapJson || {},
        slaHours: config.slaHours,
        assignmentRuleJson: config.assignmentRuleJson || null,
      })),
      workflow: {
        id: workflowConfig.id,
        step: currentStep,
        configVersion: workflowConfig.configVersion,
        status: workflowConfig.status,
        roleId: currentRoleId,
        jurisdictionLevelId: workflowConfig.jurisdictionLevelId,
        assignmentStrategyId: workflowConfig.assignmentStrategyId,
        jurisdictionLevel: workflowConfig.jurisdictionLevel,
        jurisdictionLevelName:
          workflowConfig.jurisdictionLevelMaster?.name ||
          workflowConfig.jurisdictionLevel,
        assignmentStrategy: workflowConfig.assignmentStrategy,
        assignmentStrategyName:
          workflowConfig.assignmentStrategyMaster?.name ||
          workflowConfig.assignmentStrategy,
        assignmentRuleJson: workflowConfig.assignmentRuleJson || null,
        actionMasterIdsJson: workflowConfig.actionMasterIdsJson || [],
        actionAllowedJson: actionAccess.allowed
          ? effectiveActionAllowedJson
          : [],
        transitionMapJson: workflowConfig.transitionMapJson || {},
        slaHours: workflowConfig.slaHours,
        slaBreachRequiresReason: workflowConfig.slaBreachRequiresReason,
        subformActionName: workflowConfig.subformActionName || null,
        uiSections,
      },
      actionAccess: {
        allowed: actionAccess.allowed,
        message: actionAccess.allowed
          ? null
          : actionAccess.message ||
            'Application is currently pending with another role.',
      },
      pendingAssignments: pendingRows.map((row) => ({
        apprLvlId: row.apprLvlId,
        nextRoleId: row.nextRoleId,
        nextUserId: row.nextUserId,
        createdOn: row.createdOn,
      })),
      assignableByRole: candidateRoleIds.map((roleId) => ({
        roleId,
        users: assignableUsers
          .filter((u) => Number(u.user?.role_id || 0) === roleId)
          .map((u) => ({
            userId: Number(u.user_id),
            fullName: u.full_name,
            deptId: u.dept_id,
            districtId: u.district_id,
          })),
      })),
      recentFlow: forwardRows.slice(0, 10),
    };
  }

  async getApplicationView(options: { submissionId: number }) {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.submissionId },
    });
    if (!submission) {
      throw new BadRequestException('Submission not found');
    }
    return {
      submissionId: submission.submissionId,
      status: submission.applicationStatus,
      formData: submission.fieldValue || {},
      unitName: submission.unitName || '',
      serviceId: submission.serviceId,
      departmentId: submission.deptId || null,
      formTypeId: submission.formId || null,
      ubuId: submission.ubuId || null,
      submittedOn: submission.submittedOn || null,
      applicationCreatedDate: submission.applicationCreatedDate || null,
      updatedAt: submission.applicationUpdatedDateTime,
    };
  }

  private getExpectedStepByRole(roleId: number) {
    if (Number(roleId) === 7) return 2;
    if (Number(roleId) === 3) return 3;
    if (Number(roleId) === 33) return 4;
    return null;
  }

  private matchPendingAssignmentForUser(
    row: {
      nextUserId: number | null;
      forwardedDeptId: number | null;
      forwardedDistId: number | null;
    },
    actor: {
      actorUserId: number;
      actorDeptId: number | null;
      actorDistrictId: number | null;
    },
  ) {
    const nextUserId =
      Number.isFinite(Number(row.nextUserId)) && Number(row.nextUserId) > 0
        ? Number(row.nextUserId)
        : null;
    if (nextUserId) {
      return nextUserId === actor.actorUserId;
    }
    if (!actor.actorDeptId) return false;
    const rowDeptId =
      Number.isFinite(Number(row.forwardedDeptId)) &&
      Number(row.forwardedDeptId) > 0
        ? Number(row.forwardedDeptId)
        : null;
    if (!rowDeptId || rowDeptId !== actor.actorDeptId) {
      return false;
    }
    const rowDistrictId =
      Number.isFinite(Number(row.forwardedDistId)) &&
      Number(row.forwardedDistId) > 0
        ? Number(row.forwardedDistId)
        : null;
    if (rowDistrictId && actor.actorDistrictId && rowDistrictId !== actor.actorDistrictId) {
      return false;
    }
    return true;
  }

  private resolveWorkflowActionUrlByRole(roleId: number, submissionId: number) {
    return `/department/workflow/${submissionId}`;
  }

  async getTimeline(options: { submissionId: number }) {
    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });

    const history = await this.prisma.applicationHistory.findMany({
      where: spApp?.sno
        ? { sno: spApp.sno }
        : { appId: String(options.submissionId) },
      orderBy: { historyId: 'desc' },
    });

    const forwardRows = await this.prisma.forwardApplication.findMany({
      where: { appSubId: options.submissionId },
      select: {
        createdOn: true,
        nextRoleId: true,
        nextUserId: true,
        forwardedDeptId: true,
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });

    const parseForwardTargets = (value?: string | null) => {
      const raw = String(value || '').trim();
      if (!raw) return [] as Array<{ roleId?: number; deptId?: number; userId?: number }>;
      return raw
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => {
          const compact = token.replace(/\s+/g, '');
          const triple = compact.match(/^(\d+)-(\d+)-(\d+)$/);
          if (triple) {
            return {
              roleId: Number(triple[1]),
              deptId: Number(triple[2]),
              userId: Number(triple[3]),
            };
          }
          const pair = compact.match(/^(\d+)-(\d+)$/);
          if (pair) {
            return {
              roleId: Number(pair[1]),
              deptId: Number(pair[2]),
            };
          }
          return {} as { roleId?: number; deptId?: number; userId?: number };
        })
        .filter((item) => item.roleId || item.deptId || item.userId);
    };
    const parseForwardHintFromComment = (comment?: string | null) => {
      const raw = String(comment || '');
      const deptMatch = raw.match(/dept\s*(\d+)/i);
      const roleMatch = raw.match(/role\s*(\d+)/i);
      return {
        deptId:
          deptMatch && Number.isFinite(Number(deptMatch[1])) && Number(deptMatch[1]) > 0
            ? Number(deptMatch[1])
            : null,
        roleId:
          roleMatch && Number.isFinite(Number(roleMatch[1])) && Number(roleMatch[1]) > 0
            ? Number(roleMatch[1])
            : null,
      };
    };

    const roleIds = new Set<number>();
    const deptIds = new Set<number>();
    const userIds = new Set<number>();
    history.forEach((item) => {
      const nextRoleId = Number(item.nextRoleId || 0);
      if (Number.isFinite(nextRoleId) && nextRoleId > 0) roleIds.add(nextRoleId);
      parseForwardTargets(item.param1).forEach((target) => {
        if (Number.isFinite(Number(target.roleId)) && Number(target.roleId) > 0) {
          roleIds.add(Number(target.roleId));
        }
        if (Number.isFinite(Number(target.deptId)) && Number(target.deptId) > 0) {
          deptIds.add(Number(target.deptId));
        }
        if (Number.isFinite(Number(target.userId)) && Number(target.userId) > 0) {
          userIds.add(Number(target.userId));
        }
      });
    });
    forwardRows.forEach((row) => {
      const nextRoleId = Number(row.nextRoleId || 0);
      const nextUserId = Number(row.nextUserId || 0);
      const forwardedDeptId = Number(row.forwardedDeptId || 0);
      if (Number.isFinite(nextRoleId) && nextRoleId > 0) roleIds.add(nextRoleId);
      if (Number.isFinite(nextUserId) && nextUserId > 0) userIds.add(nextUserId);
      if (Number.isFinite(forwardedDeptId) && forwardedDeptId > 0) deptIds.add(forwardedDeptId);
    });

    const [roleRows, deptRows, userRows, deptUserRows] = await Promise.all([
      roleIds.size
        ? this.prisma.roles.findMany({
            where: { id: { in: Array.from(roleIds) } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as Array<{ id: number; name: string | null }>),
      deptIds.size
        ? this.prisma.department.findMany({
            where: { id: { in: Array.from(deptIds) } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as Array<{ id: number; name: string | null }>),
      userIds.size
        ? this.prisma.users.findMany({
            where: { id: { in: Array.from(userIds) } },
            select: { id: true, email: true },
          })
        : Promise.resolve([] as Array<{ id: bigint; email: string | null }>),
      userIds.size
        ? this.prisma.department_users.findMany({
            where: { user_id: { in: Array.from(userIds).map((id) => BigInt(id)) } },
            select: { user_id: true, full_name: true },
          })
        : Promise.resolve([] as Array<{ user_id: bigint; full_name: string | null }>),
    ]);
    const roleMap = new Map<number, string>(
      roleRows.map((row) => [Number(row.id), String(row.name || `Role ${row.id}`)] as const),
    );
    const deptMap = new Map<number, string>(
      deptRows.map((row) => [Number(row.id), String(row.name || `Dept ${row.id}`)] as const),
    );
    const deptUserNameMap = new Map<number, string>(
      deptUserRows.map((row) => [Number(row.user_id), String(row.full_name || '')] as const),
    );
    const userMap = new Map<number, string>(
      userRows.map((row) => [
        Number(row.id),
        String(
          deptUserNameMap.get(Number(row.id)) ||
            row.email ||
            `User ${row.id}`,
        ),
      ] as const),
    );

    const toMinuteKey = (value: Date) => {
      const d = new Date(value);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    };
    const forwardRowsByMinuteAndRole = new Map<string, typeof forwardRows>();
    forwardRows.forEach((row) => {
      if (!row.createdOn) return;
      const roleId = Number(row.nextRoleId || 0);
      const minute = toMinuteKey(row.createdOn);
      const key = `${minute}|${roleId}`;
      const bucket = forwardRowsByMinuteAndRole.get(key) || [];
      bucket.push(row);
      forwardRowsByMinuteAndRole.set(key, bucket);
    });

    const buildForwardedLabel = (
      target: { roleId?: number; deptId?: number; userId?: number },
    ) => {
      const parts: string[] = [];
      const deptLabel =
        target.deptId && deptMap.get(Number(target.deptId))
          ? deptMap.get(Number(target.deptId))
          : target.deptId
            ? `Dept ${target.deptId}`
            : null;
      const roleLabel =
        target.roleId && roleMap.get(Number(target.roleId))
          ? roleMap.get(Number(target.roleId))
          : target.roleId
            ? `Role ${target.roleId}`
            : null;
      const userLabel =
        target.userId && userMap.get(Number(target.userId))
          ? userMap.get(Number(target.userId))
          : target.userId
            ? `User ${target.userId}`
            : null;
      if (deptLabel) parts.push(deptLabel);
      if (roleLabel) parts.push(roleLabel);
      if (userLabel) parts.push(userLabel);
      return parts.join(' / ');
    };

    const getStatusCode = (
      item?: { applicationStatus?: string | null } | null,
    ) => String(item?.applicationStatus || '').toUpperCase();

    const applicantTransitions = new Set([
      'I|DP',
      'DP|PD',
      'PD|I',
      'I|P',
      'RBI|I',
    ]);
    const departmentTransitions = new Set([
      'P|F',
      'F|FA',
      'F|A',
      'F|R',
      'F|RBI',
      'P|RBI',
    ]);

    const resolveActorRoleId = (item: {
      roleId?: string | null;
      roleName?: string | null;
      actionBy?: string | null;
      approverDetails?: string | null;
      roleUserInfo?: string | null;
    }) => {
      const parsedRoleId = Number(item.roleId || 0);
      if (Number.isFinite(parsedRoleId) && parsedRoleId > 0) {
        return parsedRoleId;
      }
      const roleName = String(item.roleName || '').trim().toLowerCase();
      if (roleName.includes('nodal')) return 7;
      if (roleName.includes('approver')) return 33;
      if (roleName.includes('department_user') || roleName.includes('line department'))
        return 3;
      if (roleName.includes('investor')) return -1;
      const actorText = String(
        item.actionBy || item.approverDetails || item.roleUserInfo || '',
      ).toLowerCase();
      if (actorText.includes('(investor)')) return -1;
      return null;
    };

    const perRow = history.map((item, index) => {
      const next = index + 1 < history.length ? history[index + 1] : null;
      const currentStatus = getStatusCode(item);
      const previousStatus = getStatusCode(next);
      const key = `${previousStatus}|${currentStatus}`;
      const seconds = next
        ? Math.abs(
            item.addedDateTime.getTime() - next.addedDateTime.getTime(),
          ) / 1000
        : 0;
      const actorRoleId = resolveActorRoleId({
        roleId: item.roleId as any,
        roleName: item.roleName as any,
        approverDetails: item.approverDetails as any,
        roleUserInfo: item.roleUserInfo as any,
      });
      let applicantSeconds = 0;
      let departmentSeconds = 0;
      let lineDepartmentSeconds = 0;
      if (actorRoleId === 3) {
        lineDepartmentSeconds = seconds;
      } else if (actorRoleId === 7 || actorRoleId === 33) {
        departmentSeconds = seconds;
      } else if (actorRoleId === -1) {
        applicantSeconds = seconds;
      } else {
        // Fallback for legacy/missing actor-role rows.
        applicantSeconds = applicantTransitions.has(key) ? seconds : 0;
        departmentSeconds = departmentTransitions.has(key) ? seconds : 0;
      }
      return {
        applicantSeconds,
        departmentSeconds,
        lineDepartmentSeconds,
      };
    });

    const totalApplicantSeconds = perRow.reduce(
      (sum, row) => sum + row.applicantSeconds,
      0,
    );
    const totalDepartmentSeconds = perRow.reduce(
      (sum, row) => sum + row.departmentSeconds,
      0,
    );
    const totalLineDepartmentSeconds = perRow.reduce(
      (sum, row) => sum + row.lineDepartmentSeconds,
      0,
    );

    const rows = history.map((item, index) => {
      const actorName = item.approverDetails || item.roleUserInfo || null;
      const actorRole = item.roleName || null;
      const formattedActionBy =
        actorName && actorRole
          ? actorName.includes(actorRole)
            ? actorName
            : `${actorName} (${actorRole})`
          : actorName || actorRole || 'System';
      return {
        id: item.historyId,
        sequence: index + 1,
        actionBy: formattedActionBy,
        actorName,
        actorRole,
        actionOn: item.addedDateTime,
        status: item.applicationStatus,
        comments: item.comments || '',
        nextRoleId: item.nextRoleId || null,
        param1: (() => {
          const commentHint = parseForwardHintFromComment(item.comments);
          const explicitTargets = parseForwardTargets(item.param1);
          if (explicitTargets.length) {
            const narrowedTargets = explicitTargets.filter((target) => {
              if (
                commentHint.deptId &&
                Number(target.deptId || 0) > 0 &&
                Number(target.deptId) !== commentHint.deptId
              ) {
                return false;
              }
              if (
                commentHint.roleId &&
                Number(target.roleId || 0) > 0 &&
                Number(target.roleId) !== commentHint.roleId
              ) {
                return false;
              }
              return true;
            });
            const labels = Array.from(
              new Set(
                (narrowedTargets.length ? narrowedTargets : explicitTargets)
                  .map((target) => buildForwardedLabel(target))
                  .filter(Boolean),
              ),
            ).sort((a, b) => a.localeCompare(b));
            if (labels.length) return labels.join(', ');
          }
          const nextRoleId = Number(item.nextRoleId || 0);
          if (Number.isFinite(nextRoleId) && nextRoleId > 0) {
            const key = `${toMinuteKey(item.addedDateTime)}|${nextRoleId}`;
            const rowsAtMinute = (forwardRowsByMinuteAndRole.get(key) || []).filter((row) => {
              if (!commentHint.deptId) return true;
              const deptId = Number(row.forwardedDeptId || 0);
              return Number.isFinite(deptId) && deptId > 0 && deptId === commentHint.deptId;
            });
            if (rowsAtMinute.length) {
              const labels = Array.from(
                new Set(
                  rowsAtMinute
                    .map((row) =>
                      buildForwardedLabel({
                        roleId: Number(row.nextRoleId || 0) || undefined,
                        deptId: Number(row.forwardedDeptId || 0) || undefined,
                        userId: Number(row.nextUserId || 0) || undefined,
                      }),
                    )
                    .filter(Boolean),
                ),
              ).sort((a, b) => a.localeCompare(b));
              if (labels.length) return labels.join(', ');
            }
            return roleMap.get(nextRoleId) || `Role ${nextRoleId}`;
          }
          return null;
        })(),
        timeTakenByApplicantSeconds: perRow[index]?.applicantSeconds || 0,
        timeTakenByDepartmentSeconds: perRow[index]?.departmentSeconds || 0,
        timeTakenByLineDepartmentSeconds:
          perRow[index]?.lineDepartmentSeconds || 0,
      };
    });

    rows.push({
      id: 0,
      sequence: rows.length + 1,
      actionBy: '',
      actorName: null,
      actorRole: null,
      actionOn: new Date(0),
      status: '',
      comments: 'Total',
      nextRoleId: null,
      param1: null,
      timeTakenByApplicantSeconds: totalApplicantSeconds,
      timeTakenByDepartmentSeconds: totalDepartmentSeconds,
      timeTakenByLineDepartmentSeconds: totalLineDepartmentSeconds,
    });

    return rows;
  }

  async getDocuments(options: { submissionId: number; serviceId?: string }) {
    // determine serviceId from submission if not provided
    let serviceId = options.serviceId;
    let submission: { serviceId?: string } | null = null;
    if (!serviceId) {
      submission = await this.prisma.applicationSubmission.findUnique({
        where: { submissionId: options.submissionId },
        select: { serviceId: true },
      });
      serviceId = submission?.serviceId || undefined;
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });
    const resolvedSno = spApp?.sno ? BigInt(spApp.sno) : BigInt(options.submissionId);
    if (!resolvedSno) {
      throw new BadRequestException('Application mapping not found');
    }

    const mappings = await this.prisma.applicationDmsDocumentsMapping.findMany({
      where: {
        sno: resolvedSno,
        serviceId,
      },
      orderBy: { mappingId: 'desc' },
    });
    if (!mappings.length) return [];

    const docIds = mappings
      .map((m) => Number(m.documentsId))
      .filter(Number.isFinite);
    const investorDocs = await this.prisma.investorDocument.findMany({
      where: { id: { in: docIds.map((id) => BigInt(id)) } },
      select: {
        id: true,
        documentMasterId: true,
        documentName: true,
        documentStatus: true,
        documentVersion: true,
        documentPath: true,
        createdAt: true,
      },
    });
    const masterIds = Array.from(
      new Set(investorDocs.map((d) => d.documentMasterId)),
    );
    const masters = await this.prisma.documentMaster.findMany({
      where: { id: { in: masterIds } },
      select: {
        id: true,
        checklistId: true,
        checklistDocumentName: true,
        documentType: {
          select: { name: true },
        },
      },
    });
    const masterMap = new Map(masters.map((m) => [m.id, m]));
    const docMap = new Map(investorDocs.map((d) => [Number(d.id), d]));
    const requiredDocIds = await this.getRequiredDocumentIdsForService(
      submission?.serviceId,
    );

    const rows = mappings
      .map((map) => {
        const doc = docMap.get(Number(map.documentsId));
        if (!doc) return null;
        const master = masterMap.get(doc.documentMasterId);
        const isMandatory = requiredDocIds.has(Number(doc.documentMasterId));
        return {
          mappingId: Number(map.mappingId),
          documentsId: Number(map.documentsId),
          documentMasterId: doc.documentMasterId,
          checklistId: master?.checklistId || null,
          checklistDocumentName:
            master?.checklistDocumentName || doc.documentName,
          isMandatory,
          fileName: doc.documentName,
          filePath: doc.documentPath,
          mappingStatus: map.status,
          documentStatus: doc.documentStatus,
          comments: map.comments || '',
          createdOn: map.createdOn,
          documentTypeName: master?.documentType?.name || null,
          documentVersion: doc.documentVersion || null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    const latestByMaster = new Map<number, (typeof rows)[number]>();
    const latestWithoutMaster: (typeof rows)[number][] = [];
    rows.forEach((row) => {
      const masterId = Number(row.documentMasterId || 0);
      if (Number.isFinite(masterId) && masterId > 0) {
        // mappings are sorted by mappingId desc, so first seen is latest.
        if (!latestByMaster.has(masterId)) {
          latestByMaster.set(masterId, row);
        }
        return;
      }
      latestWithoutMaster.push(row);
    });

    return [...latestByMaster.values(), ...latestWithoutMaster];
  }

  private async getRequiredDocumentIdsForService(serviceId?: string) {
    if (!serviceId) return new Set<number>();

    const service = await this.prisma.service.findFirst({
      where: { service_id: serviceId },
      select: { document_checklist_mapping: true },
    });
    if (!service?.document_checklist_mapping) return new Set<number>();

    const mapping = this.normalizeChecklistMapping(
      service.document_checklist_mapping,
    );
    const requiredIds = new Set<number>();
    mapping.forEach((entry) => {
      const docId = Number(entry?.doc_id ?? entry?.docId);
      const isRequired =
        String(entry?.is_required || entry?.isRequired || 'N').toUpperCase() ===
        'Y';
      if (isRequired && Number.isFinite(docId) && docId > 0) {
        requiredIds.add(docId);
      }
    });
    return requiredIds;
  }

  private normalizeChecklistMapping(
    value: unknown,
  ): Array<Record<string, any>> {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  async verifyDocument(options: {
    submissionId: number;
    documentsId: number;
    status: 'V' | 'U' | 'R' | 'M';
    comments?: string;
    isDraft?: '0' | '1';
    userId: bigint;
    remoteIp?: string | null;
    userAgent?: string | null;
    // optional service identifier to scope lookup when applicationSubmission row
    // might not exist (incentive flows).
    serviceId?: string;
  }) {
    const deptUser = await this.prisma.department_users.findFirst({
      where: { user_id: options.userId },
      select: { id: true, full_name: true },
    });
    if (!deptUser?.id) {
      throw new BadRequestException('Department user not found');
    }

    // try to infer serviceId from applicationSubmission when not explicitly
    // passed (most of the existing code paths don't supply serviceId). This
    // is required for incentive applications which live in a different table.
    if (!options.serviceId) {
      const sub = await this.prisma.applicationSubmission.findUnique({
        where: { submissionId: options.submissionId },
        select: { serviceId: true },
      });
      options.serviceId = sub?.serviceId || undefined;
    }

    const spApp = await this.prisma.spApplication.findFirst({
      where: { appId: BigInt(options.submissionId) },
      select: { sno: true },
    });
    const resolvedSno = spApp?.sno ? BigInt(spApp.sno) : BigInt(options.submissionId);
    if (!resolvedSno) {
      throw new BadRequestException('Application mapping not found');
    }

    const mapping = await this.prisma.applicationDmsDocumentsMapping.findFirst({
      where: {
        sno: resolvedSno,
        serviceId: options.serviceId,
        documentsId: options.documentsId,
      },
      select: { mappingId: true },
    });
    if (!mapping?.mappingId) {
      throw new BadRequestException('Document mapping not found');
    }

    const now = new Date();
    await this.prisma.applicationDmsDocumentsMapping.update({
      where: { mappingId: Number(mapping.mappingId) },
      data: {
        status: options.status,
        comments: options.comments || null,
        lastUpdated: now,
      },
    });

    await this.prisma.investorDocument.update({
      where: { id: BigInt(options.documentsId) },
      data: { documentStatus: options.status as any },
    });

    await (this.prisma as any).applicationDmsDocumentsMappingLog.create({
      data: {
        mappingId: BigInt(mapping.mappingId),
        documentsId: BigInt(options.documentsId),
        status: options.status,
        deptUserId: Number(deptUser.id),
        verifierName: deptUser.full_name || null,
        verifierDesignation: null,
        verifierComments: options.comments || null,
        createdTime: now,
        isDraft: options.isDraft || '0',
        remoteIp: options.remoteIp || null,
        userAgent: options.userAgent || null,
      },
    });

    return { status: 'ok' };
  }

  private async loadWorkflowInstance(
    prisma: PrismaService | Prisma.TransactionClient,
    applicationId: number,
  ) {
    return prisma.workflowInstance.findFirst({
      where: { applicationId },
      orderBy: { id: 'desc' },
    });
  }

  private async upsertWorkflowInstance(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      applicationId: number;
      workflowDefinitionVersion: number;
      currentStep: number;
      currentRoleId: number | null;
      jurisdictionLevel: string;
      status: string;
      dueAt: Date | null;
    },
  ) {
    const existing = await this.loadWorkflowInstance(prisma, args.applicationId);
    const data = {
      workflowDefinitionVersion: args.workflowDefinitionVersion,
      currentStep: args.currentStep,
      currentRoleId: args.currentRoleId ?? 0,
      jurisdictionLevel: args.jurisdictionLevel,
      status: args.status,
      dueAt: args.dueAt,
    };

    if (existing) {
      return prisma.workflowInstance.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.workflowInstance.create({
      data: {
        applicationId: args.applicationId,
        ...data,
      },
    });
  }

  private async calculateDueAtForStep(
    prisma: PrismaService | Prisma.TransactionClient,
    step: number | null,
    serviceId: string,
    configVersion?: number,
  ) {
    if (!step || !serviceId) return null;
    const where: any = {
      serviceId,
      step,
      status: 'PUBLISHED',
    };
    if (Number.isFinite(Number(configVersion))) {
      where.configVersion = Number(configVersion);
    }
    const config = await prisma.applicationWorkflowConfiguration.findFirst({
      where,
      orderBy: [{ configVersion: 'desc' }, { id: 'asc' }],
    });
    if (!config?.slaHours || config.slaHours <= 0) return null;
    const due = new Date();
    due.setHours(due.getHours() + config.slaHours);
    return due;
  }

  private async resolveActionAccess(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      submissionId: number;
      userId: bigint;
      userRoleId: number;
      currentRoleId: number;
    },
  ) {
    const deptUser = await prisma.department_users.findFirst({
      where: { user_id: args.userId },
      select: { dept_id: true, district_id: true },
    });
    const pendingRows = await prisma.forwardApplication.findMany({
      where: {
        appSubId: args.submissionId,
        nextRoleId:
          Number(args.userRoleId || 0) !== Number(args.currentRoleId || 0)
            ? Number(args.userRoleId || 0)
            : Number(args.currentRoleId || 0),
        approvStatus: { startsWith: 'P' },
      },
      select: {
        nextUserId: true,
        forwardedDeptId: true,
        forwardedDistId: true,
      },
    });
    const role7RetainedOwnershipAccess =
      await this.hasRole7RetainedOwnershipActionAccess(prisma, {
        submissionId: args.submissionId,
        userId: args.userId,
        userRoleId: args.userRoleId,
      });

    const pendingMessage = await this.resolveNotPendingMessage(prisma, {
      submissionId: args.submissionId,
      fallbackRoleId: Number(args.currentRoleId || 0),
    });
    if (Number(args.userRoleId || 0) !== Number(args.currentRoleId || 0)) {
      if (!pendingRows.length && !role7RetainedOwnershipAccess) {
        return { allowed: false, message: pendingMessage };
      }
    }

    if (!pendingRows.length) {
      return { allowed: true, message: null };
    }

    const userIdNumber = Number(args.userId);
    const actorDeptId =
      Number.isFinite(Number(deptUser?.dept_id)) && Number(deptUser?.dept_id) > 0
        ? Number(deptUser?.dept_id)
        : null;
    const actorDistrictId =
      Number.isFinite(Number(deptUser?.district_id)) &&
      Number(deptUser?.district_id) > 0
        ? Number(deptUser?.district_id)
        : null;

    const matchesPending = pendingRows.some((row) => {
      const nextUserId =
        Number.isFinite(Number(row.nextUserId)) && Number(row.nextUserId) > 0
          ? Number(row.nextUserId)
          : null;
      if (nextUserId) {
        return nextUserId === userIdNumber;
      }
      // Non-department roles (e.g., investor) can act on role-queue assignments
      // when current role already matches and no explicit next user is set.
      if (!actorDeptId) {
        return Number(args.userRoleId || 0) !== 3;
      }
      const rowDeptId =
        Number.isFinite(Number(row.forwardedDeptId)) &&
        Number(row.forwardedDeptId) > 0
          ? Number(row.forwardedDeptId)
          : null;
      if (!rowDeptId || rowDeptId !== actorDeptId) {
        return false;
      }
      const rowDistId =
        Number.isFinite(Number(row.forwardedDistId)) &&
        Number(row.forwardedDistId) > 0
          ? Number(row.forwardedDistId)
          : null;
      if (rowDistId && actorDistrictId && rowDistId !== actorDistrictId) {
        return false;
      }
      return true;
    });

    if (!matchesPending) {
      return { allowed: false, message: pendingMessage };
    }
    return { allowed: true, message: null };
  }

  private async hasRole7RetainedOwnershipActionAccess(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      submissionId: number;
      userId: bigint;
      userRoleId: number;
    },
  ) {
    if (Number(args.userRoleId || 0) !== 7) return false;
    const submission = await prisma.applicationSubmission.findUnique({
      where: { submissionId: args.submissionId },
      select: { serviceId: true, processingLevel: true },
    });
    if (!submission?.serviceId) return false;

    const role7StepConfig =
      await prisma.applicationWorkflowConfiguration.findFirst({
        where: {
          serviceId: submission.serviceId,
          status: 'PUBLISHED' as any,
          step: 2,
          currentRoleId: 7,
          ...(submission.processingLevel
            ? { processingLevel: submission.processingLevel }
            : {}),
        },
        select: {
          assignmentRuleJson: true,
        },
        orderBy: [{ configVersion: 'desc' }, { id: 'desc' }],
      });
    if (!role7StepConfig?.assignmentRuleJson) return false;

    const parallelEnabled = this.isParallelForwardEnabled(
      role7StepConfig.assignmentRuleJson,
    );
    const retainEnabled = this.isParallelForwardRetainOwnershipEnabled(
      role7StepConfig.assignmentRuleJson,
    );
    if (!parallelEnabled || !retainEnabled) return false;

    const activeForwardedAssignment = await prisma.forwardApplication.findFirst({
      where: {
        appSubId: args.submissionId,
        verifierUserId: Number(args.userId),
        nextRoleId: 3,
        actionTaken: { in: ['FORWARD', 'F', 'ASSIGNED'] },
        approvStatus: { startsWith: 'P' },
      },
      select: { apprLvlId: true },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });

    return Boolean(activeForwardedAssignment?.apprLvlId);
  }

  private isParallelForwardRetainOwnershipEnabled(
    assignmentRuleJson: unknown,
  ): boolean {
    const rule = (assignmentRuleJson || {}) as Record<string, any>;
    return Boolean(
      rule?.allowParallelForwardWhileRetainOwnership === true ||
        rule?.parallelForwardRetainOwnership === true ||
        rule?.forwardBehavior?.retainOwnershipOnParallelForward === true ||
        rule?.actionRules?.F?.retainOwnership === true,
    );
  }

  private isParallelForwardEnabled(assignmentRuleJson: unknown): boolean {
    const rule = (assignmentRuleJson || {}) as Record<string, any>;
    return Boolean(
      rule?.allowParallelForward === true ||
        rule?.parallelForwardEnabled === true ||
        rule?.forwardBehavior?.parallelForward === true ||
        rule?.actionRules?.F?.parallelEnabled === true,
    );
  }

  private async shouldRetainOwnershipForParallelForward(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      serviceId: string;
      workflowVersion: number;
      step: number;
      currentRoleId: number;
      assignmentRuleJson: unknown;
    },
  ) {
    if (this.isParallelForwardRetainOwnershipEnabled(args.assignmentRuleJson)) {
      return true;
    }
    const siblingConfigs = await prisma.applicationWorkflowConfiguration.findMany({
      where: {
        serviceId: args.serviceId,
        status: 'PUBLISHED' as any,
        configVersion: Number(args.workflowVersion),
        step: Number(args.step),
        currentRoleId: Number(args.currentRoleId),
      },
      select: {
        assignmentRuleJson: true,
      },
    });
    return siblingConfigs.some((config) =>
      this.isParallelForwardRetainOwnershipEnabled(config.assignmentRuleJson),
    );
  }

  private async assertTransitionConfigAlignment(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      serviceId: string;
      workflowVersion: number;
      nextStep: number | null;
      nextRoles: number[];
      submissionFormTypeId: number;
    },
  ) {
    if (!Number.isFinite(Number(args.nextStep)) || Number(args.nextStep) <= 0) {
      return;
    }
    if (!Array.isArray(args.nextRoles) || !args.nextRoles.length) {
      return;
    }
    const nextStepConfigs = await prisma.applicationWorkflowConfiguration.findMany({
      where: {
        serviceId: args.serviceId,
        status: 'PUBLISHED' as any,
        configVersion: Number(args.workflowVersion),
        step: Number(args.nextStep),
      },
      select: {
        roleId: true,
        currentRoleId: true,
        formTypeId: true,
      },
    });
    if (!nextStepConfigs.length) {
      throw new BadRequestException(
        `Workflow configuration missing for next_step ${args.nextStep}`,
      );
    }
    const formMatchedConfigs =
      Number(args.submissionFormTypeId) > 0
        ? nextStepConfigs.filter(
            (config) =>
              Number(config.formTypeId || 0) ===
              Number(args.submissionFormTypeId),
          )
        : [];
    const configsForRoleValidation = formMatchedConfigs.length
      ? formMatchedConfigs
      : nextStepConfigs;
    const configuredRoleIds = new Set<number>();
    configsForRoleValidation.forEach((config) => {
      const roleIds = [config.roleId, config.currentRoleId]
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0);
      roleIds.forEach((value) => configuredRoleIds.add(value));
    });
    const invalidNextRoles = args.nextRoles.filter(
      (roleId) => !configuredRoleIds.has(Number(roleId)),
    );
    if (invalidNextRoles.length) {
      throw new BadRequestException(
        `Transition config mismatch: next_roles ${invalidNextRoles.join(',')} do not match configured role for step ${args.nextStep}`,
      );
    }
  }

  private async resolveNotPendingMessage(
    prisma: PrismaService | Prisma.TransactionClient,
    args: {
      submissionId: number;
      fallbackRoleId: number;
    },
  ) {
    const pendingAssignment = await prisma.forwardApplication.findFirst({
      where: {
        appSubId: args.submissionId,
        approvStatus: { startsWith: 'P' },
      },
      select: {
        nextRoleId: true,
        forwardedDeptId: true,
      },
      orderBy: [{ createdOn: 'desc' }, { apprLvlId: 'desc' }],
    });
    const pendingRoleId =
      Number.isFinite(Number(pendingAssignment?.nextRoleId)) &&
      Number(pendingAssignment?.nextRoleId) > 0
        ? Number(pendingAssignment?.nextRoleId)
        : Number.isFinite(Number(args.fallbackRoleId)) && args.fallbackRoleId > 0
          ? Number(args.fallbackRoleId)
          : null;
    const role =
      pendingRoleId && pendingRoleId > 0
        ? await prisma.roles.findUnique({
            where: { id: pendingRoleId },
            select: { name: true },
          })
        : null;
    const pendingDeptId =
      Number.isFinite(Number(pendingAssignment?.forwardedDeptId)) &&
      Number(pendingAssignment?.forwardedDeptId) > 0
        ? Number(pendingAssignment?.forwardedDeptId)
        : null;
    const pendingDept =
      pendingDeptId && pendingDeptId > 0
        ? await prisma.department.findUnique({
            where: { id: pendingDeptId },
            select: { name: true },
          })
        : null;
    const roleLabel =
      role?.name || (pendingRoleId ? `Role ${pendingRoleId}` : 'another role');
    const deptLabel = pendingDept?.name
      ? ` (${pendingDept.name})`
      : pendingDeptId
        ? ` (Department ${pendingDeptId})`
        : '';
    return `Application is currently pending with ${roleLabel}${deptLabel}.`;
  }
}
