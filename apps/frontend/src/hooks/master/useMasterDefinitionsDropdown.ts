import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Fetches master_definition records filtered by tenant+project for use
 * as dropdown options in the "Select Master Table" field of FieldOptionsModal.
 */
export function useMasterDefinitionsDropdown(filters?: {
  tenantId?: number | null;
  projectId?: number | null;
}) {
  const tenantId = filters?.tenantId ?? null;
  const projectId = filters?.projectId ?? null;

  return useQuery<{ id: number; name: string; code: string }[]>({
    queryKey: ['master-definitions-dropdown', tenantId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('is_active', 'true');
      if (tenantId) params.append('tenant_id', String(tenantId));
      if (projectId) params.append('project_id', String(projectId));
      const res = await apiClient.get(`/master/definitions?${params.toString()}`);
      const raw: any[] = Array.isArray(res.data) ? res.data : [];
      return raw.map((d) => ({
        id: Number(d.id),
        name: d.name ?? d.code ?? `Definition-${d.id}`,
        code: d.code ?? '',
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
