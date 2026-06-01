import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface TenantProject {
  id: number;
  name: string;
  code: string;
  project_ID?: string;
  is_active: boolean;
  tenant_id: number;
}

export function useTenantProjects(tenantId: number | null) {
  return useQuery<TenantProject[]>({
    queryKey: ['tenant-projects', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const res = await apiClient.get(`/projects?tenant_id=${tenantId}`);
      return res.data;
    },
    enabled: !!tenantId,
  });
}
