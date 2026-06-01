
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { FbServiceRow } from '@/types/formBuilder';

async function fetchFormBuilderServices(departmentId: number): Promise<FbServiceRow[]> {
  const res = await apiClient.get(`/master/form-builder/departments/${departmentId}/services`);
  return res.data;
}

export function useFormBuilderServices(departmentId?: number) {
  return useQuery({
    queryKey: ['formBuilderServices', departmentId],
    queryFn: () => fetchFormBuilderServices(departmentId as number),
    enabled: !!departmentId,
  });
}
