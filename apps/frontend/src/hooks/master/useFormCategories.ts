import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

const base = '/master/form-categories';
const key = ['form-categories'];

export function useFormCategories(filters?: { tenantId?: number | null; projectId?: number | null }) {
  const tenantId = filters?.tenantId ?? null;
  const projectId = filters?.projectId ?? null;
  return useQuery({
    queryKey: ['form-categories', tenantId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Only filter when both tenant and project are known — otherwise return all
      if (tenantId && projectId) {
        params.append('tenantId', String(tenantId));
        params.append('projectId', String(projectId));
      }
      const url = params.toString() ? `${base}?${params.toString()}` : base;
      return (await apiClient.get(url)).data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await apiClient.post(base, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) =>
      (await apiClient.put(`${base}/${id}`, data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await apiClient.delete(`${base}/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-categories'] }),
  });
}

export function useToggleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await apiClient.put(`${base}/${id}/toggle`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['form-categories'] }),
  });
}
