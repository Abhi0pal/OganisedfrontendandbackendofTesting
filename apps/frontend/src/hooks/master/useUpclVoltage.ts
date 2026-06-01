import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface UpclVoltage {
  id: string;
  voltageGroup: string;
  voltageDesc: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUpclVoltage = (filters?: { isActive?: boolean; search?: string; voltageGroup?: string }) => {
  return useQuery({
    queryKey: ['upclVoltage', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.voltageGroup) {
        params.append('voltageGroup', filters.voltageGroup);
      }

      const response = await apiClient.get(`/master/upcl-voltage?${params}`);
      return response.data;
    },
  });
};

export const useCreateUpclVoltage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UpclVoltage, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/upcl-voltage', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclVoltage'] });
    },
  });
};

export const useUpdateUpclVoltage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UpclVoltage> }) => {
      const response = await apiClient.put(`/master/upcl-voltage/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclVoltage'] });
    },
  });
};

export const useDeleteUpclVoltage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/master/upcl-voltage/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclVoltage'] });
    },
  });
};

export const useToggleUpclVoltage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/master/upcl-voltage/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclVoltage'] });
    },
  });
};
