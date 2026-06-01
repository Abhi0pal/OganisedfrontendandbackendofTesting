import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type InvestorApplyService = {
  serviceId: string;
  serviceName: string;
  tenantId: number | null;
  projectId: number | null;
};

async function fetchInvestorApplyServices(
  tenantId?: number | null,
  projectId?: number | null,
) {
  const params = new URLSearchParams();
  if (tenantId) {
    params.append('tenantId', String(tenantId));
  }
  if (projectId) {
    params.append('projectId', String(projectId));
  }

  const query = params.toString();
  const res = await apiClient.get(
    `/master/form-builder/investor/apply-services${query ? `?${query}` : ''}`,
  );
  return Array.isArray(res.data) ? (res.data as InvestorApplyService[]) : [];
}

export function useInvestorApplyServices(
  tenantId?: number | null,
  projectId?: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['investor-apply-services', tenantId ?? null, projectId ?? null],
    queryFn: () => fetchInvestorApplyServices(tenantId, projectId),
    enabled: (options?.enabled ?? true) && Boolean(tenantId),
  });
}
