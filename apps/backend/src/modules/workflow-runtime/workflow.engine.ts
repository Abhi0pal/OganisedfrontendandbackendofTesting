import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface WorkflowEngineOptions {
  applicationId: number;
  currentStep: number;
  action: string;
  actorUserId: bigint;
  workflowConfigVersion?: number | null;
}

export interface WorkflowTransitionResult {
  nextStep: number | null;
  nextRoles: number[];
  isTerminal: boolean;
  requiresSlaValidation: boolean;
}

const ACTION_CANONICAL_MAP: Record<string, string> = {
  pending: 'PENDING',
  forward: 'FORWARD',
  approve: 'APPROVE',
  reject: 'REJECT',
  revert: 'REVERT_TO_INVESTOR',
  hold: 'HOLD',
  f: 'FORWARD',
  fa: 'FORWARD_TO_APPROVER',
  a: 'APPROVE',
  r: 'REJECT',
  p: 'PENDING',
  h: 'HOLD',
  rbi: 'REVERT_TO_INVESTOR',
  FORWARD_TO_APPROVER: 'FORWARD_TO_APPROVER',
};
const ACTION_NORMALIZATION_MAP: Record<string, string> = {
  PENDING: 'P',
  APPROVE: 'A',
  REJECT: 'R',
  FORWARD: 'F',
  FORWARD_TO_APPROVER: 'FA',
  REVERT_TO_INVESTOR: 'RBI',
  HOLD: 'H',
  SUBMIT: 'P',
};
const TERMINAL_STEPS = new Set([98, 99, 100]);

export class WorkflowEngine {
  constructor(
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async evaluateTransition(
    options: WorkflowEngineOptions,
  ): Promise<WorkflowTransitionResult> {
    const submission = await this.prisma.applicationSubmission.findUnique({
      where: { submissionId: options.applicationId },
      select: {
        serviceId: true,
        workflowConfigVersion: true,
        processingLevel: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    const workflowConfig = await this.resolveWorkflowConfig(
      submission.serviceId,
      options.currentStep,
      options.workflowConfigVersion ?? submission.workflowConfigVersion ?? undefined,
    );

    const actor = await this.prisma.users.findUnique({
      where: { id: options.actorUserId },
      select: { role_id: true },
    });
    if (!actor?.role_id) {
      throw new BadRequestException('Actor role is not defined');
    }

    const normalizedAction = this.normalizeAction(options.action);
    this.validateActionAllowed(workflowConfig, normalizedAction);
    this.validateRole(workflowConfig, Number(actor.role_id));
    this.validateJurisdiction(workflowConfig, submission.processingLevel);

    const transition = this.extractTransition(
      workflowConfig.transitionMapJson,
      normalizedAction,
    );
    const nextStep = transition?.next_step ?? null;
    const nextRoles = (transition?.next_roles || [])
      .map((r) => Number(r))
      .filter((r) => Number.isFinite(r) && r > 0);

    return {
      nextStep,
      nextRoles,
      isTerminal: nextStep === null || TERMINAL_STEPS.has(nextStep),
      requiresSlaValidation: Boolean(
        workflowConfig.slaHours && workflowConfig.slaHours > 0,
      ),
    };
  }

  private normalizeAction(rawAction: string): string {
    if (!rawAction) return '';
    const key = String(rawAction).trim();
    const canonical = ACTION_CANONICAL_MAP[key] || key.toUpperCase();
    return ACTION_NORMALIZATION_MAP[canonical] || canonical;
  }

  private async resolveWorkflowConfig(
    serviceId: string,
    step: number,
    configVersion?: number,
  ) {
    const conditions: any = {
      serviceId,
      status: 'PUBLISHED',
      step,
    };
    if (Number.isFinite(Number(configVersion))) {
      conditions.configVersion = Number(configVersion);
    }
    const workflowConfig =
      await this.prisma.applicationWorkflowConfiguration.findFirst({
        where: conditions,
        orderBy: [{ configVersion: 'desc' }, { step: 'asc' }],
      });
    if (!workflowConfig) {
      throw new NotFoundException('Workflow configuration not found');
    }
    return workflowConfig;
  }

  private validateActionAllowed(workflowConfig: any, actionCode: string) {
    const allowed = Array.isArray(workflowConfig.actionAllowedJson)
      ? workflowConfig.actionAllowedJson
          .map((entry: any) => this.normalizeAction(String(entry)))
          .filter(Boolean)
      : [];
    if (allowed.length && !allowed.includes(actionCode)) {
      throw new BadRequestException(
        `Action ${actionCode} is not allowed for this workflow step`,
      );
    }
  }

  private validateRole(workflowConfig: any, actorRoleId: number) {
    const allowedRoles = new Set<number>();
    [workflowConfig.roleId, workflowConfig.currentRoleId]
      .filter((value) => Number.isFinite(Number(value)) && Number(value) > 0)
      .forEach((role) => allowedRoles.add(Number(role)));
    if (allowedRoles.size && !allowedRoles.has(actorRoleId)) {
      throw new BadRequestException(
        'Actor role is not permitted for this workflow step',
      );
    }
  }

  private validateJurisdiction(workflowConfig: any, processingLevel?: string) {
    if (!workflowConfig.jurisdictionLevel) return;
    const expected = String(workflowConfig.jurisdictionLevel).toUpperCase();
    const actual = String(processingLevel || '').toUpperCase();
    if (actual && expected && !actual.includes(expected)) {
      throw new BadRequestException(
        'Jurisdiction mismatch for this workflow step',
      );
    }
  }

  private extractTransition(mapJson: any, actionCode: string) {
    if (!mapJson || typeof mapJson !== 'object') return null;
    const keyCandidates = [actionCode];
    if (actionCode === 'F') keyCandidates.push('FORWARD');
    if (actionCode === 'FA') keyCandidates.push('FORWARD_TO_APPROVER');
    if (actionCode === 'A') keyCandidates.push('APPROVE');
    if (actionCode === 'R') keyCandidates.push('REJECT');
    if (actionCode === 'RBI') keyCandidates.push('REVERT_TO_INVESTOR');
    if (actionCode === 'P') keyCandidates.push('PENDING');
    if (actionCode === 'H') keyCandidates.push('HOLD');
    const transition = keyCandidates
      .map((key) => mapJson[key])
      .find((value) => value && typeof value === 'object');
    if (transition && typeof transition === 'object') {
      return {
        next_step: transition.next_step ?? null,
        next_roles: Array.isArray(transition.next_roles)
          ? transition.next_roles
          : [],
      };
    }
    return null;
  }
}
