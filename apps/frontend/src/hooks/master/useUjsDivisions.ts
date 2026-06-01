import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface UjsDivision {
  id: number;
  divisionId: number;
  officeName: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUjsDivisions = (filters?: { isActive?: boolean; search?: string; divisionId?: number }) => {
  return useQuery({
    queryKey: ['ujsDivisions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.divisionId !== undefined) {
        params.append('divisionId', filters.divisionId.toString());
      }

      const response = await apiClient.get(`/master/ujs-divisions?${params}`);
      return response.data;
    },
  });
};

export const useCreateUjsDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UjsDivision, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/ujs-divisions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ujsDivisions'] });
    },
  });
};

export const useUpdateUjsDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<UjsDivision, 'id'>> }) => {
      const response = await apiClient.put(`/master/ujs-divisions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ujsDivisions'] });
    },
  });
};

export const useDeleteUjsDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/ujs-divisions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ujsDivisions'] });
    },
  });
};

export const useToggleUjsDivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/ujs-divisions/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ujsDivisions'] });
    },
  });
};
