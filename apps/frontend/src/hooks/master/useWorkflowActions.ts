import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface WorkflowActionMaster {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

const base = '/master/workflow-actions';

export const useWorkflowActions = (filters?: { isActive?: boolean; search?: string }) =>
  useQuery<WorkflowActionMaster[]>({
    queryKey: ['workflow-actions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
      if (filters?.search) params.append('search', filters.search);
      const res = await apiClient.get(`${base}?${params.toString()}`);
      return res.data;
    },
  });

