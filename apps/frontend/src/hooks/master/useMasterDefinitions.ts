import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MasterDefinitionOption {
  id: number;
  name: string;
  code: string;
  tenant_id: number | null;
  project_id: number | null;
  is_active: boolean;
}

/**
 * Fetch master_definition records filtered by tenantId and projectId.
 * Used in the Add/Edit Service form to populate the Department dropdown.
 */
export const useMasterDefinitions = (
  tenantId?: number | null,
  projectId?: number | null,
) => {
  return useQuery<MasterDefinitionOption[]>({
    queryKey: ['master-definitions-dropdown', tenantId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenant_id', String(tenantId));
      if (projectId) params.append('project_id', String(projectId));
      params.append('is_active', 'true');
      const response = await apiClient.get(`/master/definitions?${params.toString()}`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
};
