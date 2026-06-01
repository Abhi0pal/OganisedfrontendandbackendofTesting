import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface LabourFactoryTypeMaster {
  id: number;
  factoryType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useLabourFactoryTypeMaster = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['labourFactoryTypeMaster', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/labour-factory-type-master?${params}`);
      return response.data;
    },
  });
};

export const useCreateLabourFactoryTypeMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LabourFactoryTypeMaster, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/labour-factory-type-master', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactoryTypeMaster'] });
    },
  });
};

export const useUpdateLabourFactoryTypeMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LabourFactoryTypeMaster> }) => {
      const response = await apiClient.put(`/master/labour-factory-type-master/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactoryTypeMaster'] });
    },
  });
};

export const useDeleteLabourFactoryTypeMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/labour-factory-type-master/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactoryTypeMaster'] });
    },
  });
};

export const useToggleLabourFactoryTypeMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/labour-factory-type-master/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labourFactoryTypeMaster'] });
    },
  });
};
