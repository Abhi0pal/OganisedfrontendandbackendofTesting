import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface PollutionControlEquipment {
  id: number;
  equipmentName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const usePollutionControlEquipments = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['pollutionControlEquipments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/pollution-control-equipments?${params}`);
      return response.data;
    },
  });
};

export const useCreatePollutionControlEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<PollutionControlEquipment, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/pollution-control-equipments', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollutionControlEquipments'] });
    },
  });
};

export const useUpdatePollutionControlEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PollutionControlEquipment> }) => {
      const response = await apiClient.put(`/master/pollution-control-equipments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollutionControlEquipments'] });
    },
  });
};

export const useDeletePollutionControlEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/pollution-control-equipments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollutionControlEquipments'] });
    },
  });
};

export const useTogglePollutionControlEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/pollution-control-equipments/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pollutionControlEquipments'] });
    },
  });
};
