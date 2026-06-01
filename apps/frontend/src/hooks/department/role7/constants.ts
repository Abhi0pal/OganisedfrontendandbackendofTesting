import type { WorkflowDashboardQueryParams } from '@/hooks/department/workflow/useWorkflowDashboardData';

export const ROLE7_DASHBOARD_STATUSES = ['P', 'F', 'FA', 'A'] as const;

export const ROLE7_DASHBOARD_QUERY: WorkflowDashboardQueryParams = {
  serviceId: '943.0',
  deptId: 1,
  processingLevel: 'District',
  statuses: [...ROLE7_DASHBOARD_STATUSES],
};
