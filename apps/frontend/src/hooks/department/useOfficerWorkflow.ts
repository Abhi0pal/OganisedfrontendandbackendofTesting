import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { TimelineEntry, WorkflowDocument } from '@/components/(department)/workflow/types';
import type { SelectedRecipient } from '@/components/(department)/workflow/types';

export type OfficerActivity = {
  submissionId: number;
  serviceId: string;
  serviceName: string;
  unitName: string;
  status: string;
  assignedOn: string;
  nextRoleId?: number | null;
  nextUserId?: number | null;
  processingLevel?: string;
};

export type OfficerActivityDetail = {
  submission: {
    submissionId: number;
    serviceId: string;
    formId?: number | null;
    status: string;
    unitName?: string | null;
    processingLevel?: string;
    departmentId?: number;
    districtId?: number;
  };
  workflow: {
    id: number;
    step: number;
    configVersion: number;
    status: string;
    roleId: number;
    jurisdictionLevel: string;
    assignmentStrategy: string;
    assignmentRuleJson?: Record<string, unknown> | null;
    actionAllowedJson: string[];
    transitionMapJson: Record<string, unknown>;
    slaHours: number;
    slaBreachRequiresReason: boolean;
    subformActionName?: string | null;
    uiSections: string[];
  };
  currentStep?: number;
  currentRoleId?: number;
  currentStepConfig?: {
    id: number;
    step: number;
    configVersion: number;
    roleId: number;
    currentRoleId: number;
    status: string;
    formTypeId?: number | null;
    formType?: string | null;
    form_type?: string | null;
    subResponsibility?: string | null;
    sub_responsibility?: string | null;
    jurisdictionLevel?: string | null;
    jurisdiction_level?: string | null;
    assignmentRuleJson?: Record<string, unknown> | null;
    assignment_rule_json?: Record<string, unknown> | null;
    actionAllowedJson?: string[];
    action_allowed_json?: string[];
    transitionMapJson?: Record<string, unknown>;
    transition_map_json?: Record<string, unknown>;
    slaHours?: number;
    sla_hours?: number;
    slaBreachRequiresReason?: boolean;
    sla_breach_requires_reason?: boolean;
  };
  workflowStepConfigs?: Array<{
    id: number;
    step: number;
    configVersion: number;
    roleId: number;
    currentRoleId: number;
    status: string;
    formTypeId?: number | null;
    formType?: string | null;
    subResponsibility?: string | null;
    jurisdictionLevel?: string | null;
    assignmentRuleJson?: Record<string, unknown> | null;
    actionAllowedJson?: string[];
    transitionMapJson?: Record<string, unknown>;
    slaHours?: number;
  }>;
  pendingAssignments: Array<{
    apprLvlId: number;
    nextRoleId?: number | null;
    nextUserId?: number | null;
    createdOn: string;
  }>;
  assignableByRole: Array<{
    roleId: number;
    users: Array<{
      userId: number;
      fullName: string;
      deptId?: number | null;
      districtId?: number | null;
    }>;
  }>;
  actionAccess?: {
    allowed: boolean;
    message?: string | null;
  };
  recentFlow: unknown[];
};

export type RoleDashboardCounts = {
  all: number;
  pending: number;
  forwarded: number;
  forwardToApprover?: number;
  approved: number;
  rejected: number;
  reverted?: number;
};

export type RoleDashboardApplication = {
  id: number;
  submissionId: number;
  unitName: string;
  companyName: string;
  submissionDate: string;
  department: string;
  status: string;
  statusLabel: string;
  serviceId: string;
};

export type RoleDashboardData = {
  counts: RoleDashboardCounts;
  applications: RoleDashboardApplication[];
};

export type OfficerApplicationView = {
  submissionId: number;
  status: string;
  statusLabel?: string;
  formData: Record<string, unknown>;
  fieldSchema?: any[];
  unitName?: string | null;
  companyName?: string | null;
  serviceId: string;
  serviceName?: string;
  departmentId?: number | null;
  formTypeId?: number | null;
  ubuId?: string | null;
  submittedOn?: string | null;
  applicationCreatedDate?: string | null;
  applicationUpdatedDateTime?: string | null;
  updatedAt?: string | null;
};

export type OfficerSubmitActionPayload = {
  submissionId: number;
  step?: number;
  serviceId: string;
  processingLevel?: string;
  action:
    | 'F'
    | 'FA'
    | 'RBI'
    | 'A'
    | 'R'
    | 'P'
    | 'H'
    | 'FORWARD'
    | 'FORWARD_TO_APPROVER'
    | 'REVERT_TO_INVESTOR'
    | 'APPROVE'
    | 'REJECT'
    | 'PENDING'
    | 'HOLD';
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
  blockPayload?: Record<string, unknown>;
  selectedRecipients?: SelectedRecipient[];
};

export const useOfficerActivities = (serviceId?: string) =>
  useQuery<OfficerActivity[]>({
    queryKey: ['officer-workflow-activities', serviceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceId) params.set('serviceId', serviceId);
      const res = await apiClient.get(`/workflow-runtime/activities?${params.toString()}`);
      return res.data;
    },
  });

export const useRoleDashboard = (serviceId?: string) =>
  useQuery<RoleDashboardData>({
    queryKey: ['officer-role-dashboard', serviceId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (serviceId) params.set('serviceId', serviceId);
      const res = await apiClient.get(`/workflow-runtime/role-dashboard?${params.toString()}`);
      return res.data;
    },
  });

export const useOfficerActivityDetail = (submissionId?: number) =>
  useQuery<OfficerActivityDetail>({
    queryKey: ['officer-workflow-activity-detail', submissionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/workflow-runtime/activity?submissionId=${submissionId}`
      );
      return res.data;
    },
    enabled: !!submissionId,
  });

export const useOfficerSubmitAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OfficerSubmitActionPayload) => {
      const res = await apiClient.post('/workflow-runtime/action', payload);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['officer-workflow-activities'] });
      if (vars?.submissionId) {
        queryClient.invalidateQueries({
          queryKey: ['officer-workflow-activity-detail', vars.submissionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['officer-workflow-documents', vars.submissionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['officer-workflow-timeline', vars.submissionId],
        });
      }
    },
  });
};

export const useOfficerApplicationView = (submissionId?: number) =>
  useQuery<OfficerApplicationView>({
    queryKey: ['officer-workflow-application-view', submissionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/workflow-runtime/application-view?submissionId=${submissionId}`
      );
      return res.data;
    },
    enabled: !!submissionId,
  });

export const useOfficerDocuments = (
  submissionId?: number,
  serviceId?: string,
) =>
  useQuery<WorkflowDocument[]>({
    queryKey: ['officer-workflow-documents', submissionId, serviceId],
    queryFn: async () => {
      let url = `/workflow-runtime/documents?submissionId=${submissionId}`;
      if (serviceId) {
        url += `&serviceId=${encodeURIComponent(serviceId)}`;
      }
      const res = await apiClient.get(url);
      return res.data;
    },
    enabled: !!submissionId,
  });

export const useOfficerTimeline = (submissionId?: number) =>
  useQuery<TimelineEntry[]>({
    queryKey: ['officer-workflow-timeline', submissionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/workflow-runtime/timeline?submissionId=${submissionId}`
      );
      return res.data;
    },
    enabled: !!submissionId,
  });

export const useOfficerVerifyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      submissionId: number;
      documentsId: number;
      status: 'V' | 'U' | 'R' | 'M';
      comments?: string;
      isDraft?: '0' | '1';
      serviceId?: string;
    }) => {
      const res = await apiClient.post('/workflow-runtime/documents/verify', payload);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['officer-workflow-activities'] });
      if (vars?.submissionId) {
        queryClient.invalidateQueries({
          queryKey: ['officer-workflow-activity-detail', vars.submissionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['officer-workflow-documents', vars.submissionId],
        });
      }
    },
  });
};
