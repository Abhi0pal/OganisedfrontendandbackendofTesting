import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface LandAllotmentStage {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useLandAllotmentStage = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['land-allotment-stage', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/land-allotment-stage?${params}`);
      return response.data;
    },
  });
};

export const useCreateLandAllotmentStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<LandAllotmentStage, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/land-allotment-stage', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-allotment-stage'] });
    },
  });
};

export const useUpdateLandAllotmentStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LandAllotmentStage> }) => {
      const response = await apiClient.put(`/master/land-allotment-stage/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-allotment-stage'] });
    },
  });
};

export const useDeleteLandAllotmentStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/land-allotment-stage/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-allotment-stage'] });
    },
  });
};

export const useToggleLandAllotmentStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/land-allotment-stage/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-allotment-stage'] });
    },
  });
};
