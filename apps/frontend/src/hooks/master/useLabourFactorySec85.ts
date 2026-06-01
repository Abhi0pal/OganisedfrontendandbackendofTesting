import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface LabourFactorySec85 {
  id: number;
  specialProvisionName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useLabourFactorySec85 = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['labourFactorySec85', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/labour-factory-sec85?${params}`);
      return response.data;
    },
  });
};

export const useCreateLabourFactorySec85 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LabourFactorySec85, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/labour-factory-sec85', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactorySec85'] });
    },
  });
};

export const useUpdateLabourFactorySec85 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LabourFactorySec85> }) => {
      const response = await apiClient.put(`/master/labour-factory-sec85/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactorySec85'] });
    },
  });
};

export const useDeleteLabourFactorySec85 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/labour-factory-sec85/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactorySec85'] });
    },
  });
};

export const useToggleLabourFactorySec85 = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/labour-factory-sec85/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactorySec85'] });
    },
  });
};
