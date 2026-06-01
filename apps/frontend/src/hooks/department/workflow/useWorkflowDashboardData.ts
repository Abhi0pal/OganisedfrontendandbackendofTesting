import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type WorkflowDashboardCounts = {
  all: number;
  pending: number;
  forwarded: number;
  approved: number;
  rejected: number;
};

export type WorkflowDashboardApplication = {
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

export type WorkflowDashboardData = {
  counts: WorkflowDashboardCounts;
  byStatus?: Record<string, number>;
  applications: WorkflowDashboardApplication[];
};

export type WorkflowDashboardQueryParams = {
  serviceId?: string;
  deptId?: number;
  statuses?: string[];
  processingLevel?: string;
};

export const useWorkflowDashboardData = (params: WorkflowDashboardQueryParams) =>
  useQuery<WorkflowDashboardData>({
    queryKey: [
      'workflow-dashboard-data',
      params.serviceId || '',
      params.deptId || 0,
      (params.statuses || []).join(','),
      params.processingLevel || '',
    ],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params.serviceId) qs.set('serviceId', String(params.serviceId));
      if (Number.isFinite(Number(params.deptId)) && Number(params.deptId) > 0) {
        qs.set('deptId', String(params.deptId));
      }
      if (Array.isArray(params.statuses) && params.statuses.length > 0) {
        qs.set(
          'statuses',
          params.statuses
            .map((status) => String(status).trim().toUpperCase())
            .filter(Boolean)
            .join(',')
        );
      }
      if (params.processingLevel) {
        qs.set('processingLevel', String(params.processingLevel).trim());
      }

      const res = await apiClient.get(`/workflow-runtime/role-dashboard?${qs.toString()}`);
      return res.data;
    },
  });
