import { ProcessNodeType, AssigneeType, SlaBreach } from '@prisma/client';

export interface WorkflowTransitionJSON {
  targetProcessCode: string;
  label?: string;
  priority: number;
  conditionJson?: any;
  conditionLabel?: string;
}

export interface WorkflowActionJSON {
  actionCode: string;
  actionLabel: string;
  requiresComment: boolean;
  requiresDocument: boolean;
  requiresReason: boolean;
  displayOrder: number;
  transitions: WorkflowTransitionJSON[];
  payload?: any;
}

export interface ForkJoinMetadata {
  type: 'FORK' | 'JOIN';
  partnerProcessCode: string; // The matching JOIN for a FORK, or matching FORK for a JOIN
  joinStrategy?: 'ALL' | 'ANY';
  branchProcessCodes?: string[]; // For FORK: processes that start parallel branches
}

export interface WorkflowProcessJSON {
  processCode: string;
  stepOrder: number;
  name: string;
  nodeType: ProcessNodeType;
  assigneeType: AssigneeType;
  roleId?: number | null;
  roleName?: string | null;
  userId?: bigint | null;
  formTypeId?: number | null;
  slaHours: number;
  slaBreachAction: SlaBreach;
  slaBreachPercentage?: number | null;
  canVerifyDocument: boolean;
  canRevertToApplicant: boolean;
  allowPaymentDemand: boolean;
  challanRules?: any[];
  positionX: number;
  positionY: number;
  actions: WorkflowActionJSON[];
  forkJoinMetadata?: ForkJoinMetadata | null;
}

export interface WorkflowFieldPermissionJSON {
  processCode: string;
  fieldId: number;
  roleId?: number | null;
  permission: string; // EDITABLE, READ_ONLY, HIDDEN
}

export interface WorkflowConfigJSON {
  processes: WorkflowProcessJSON[];
  fieldPermissions: WorkflowFieldPermissionJSON[];
}

export class WorkflowConfigResolver {
  constructor(private readonly config: WorkflowConfigJSON) {}

  /**
   * Get a process by its unique code
   */
  getProcessByCode(code: string): WorkflowProcessJSON | null {
    return this.config.processes.find((p) => p.processCode === code) || null;
  }

  /**
   * Get the START node of the workflow
   */
  getStartProcess(): WorkflowProcessJSON | null {
    return this.config.processes.find((p) => p.nodeType === 'START') || null;
  }

  /**
   * Get all END nodes of the workflow
   */
  getEndProcesses(): WorkflowProcessJSON[] {
    return this.config.processes.filter((p) => p.nodeType === 'END');
  }

  /**
   * Get actions permitted for a specific process
   */
  getActionsForProcess(processCode: string): WorkflowActionJSON[] {
    const process = this.getProcessByCode(processCode);
    return process ? process.actions : [];
  }

  /**
   * Get transitions for a specific action within a process
   */
  getTransitionsForAction(processCode: string, actionCode: string): WorkflowTransitionJSON[] {
    const process = this.getProcessByCode(processCode);
    if (!process) return [];

    const action = process.actions.find((a) => a.actionCode === actionCode);
    return action ? action.transitions : [];
  }

  /**
   * Get field permissions for a specific process
   */
  getFieldPermissions(processCode: string): WorkflowFieldPermissionJSON[] {
    return this.config.fieldPermissions.filter((fp) => fp.processCode === processCode);
  }
}
