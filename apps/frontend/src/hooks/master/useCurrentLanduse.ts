import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface CurrentLanduse {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useCurrentLanduse = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['currentLanduse', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/current-landuse?${params}`);
      return response.data;
    },
  });
};

export const useCreateCurrentLanduse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<CurrentLanduse, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/current-landuse', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLanduse'] });
    },
  });
};

export const useUpdateCurrentLanduse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CurrentLanduse> }) => {
      const response = await apiClient.put(`/master/current-landuse/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLanduse'] });
    },
  });
};

export const useDeleteCurrentLanduse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/current-landuse/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLanduse'] });
    },
  });
};

export const useToggleCurrentLanduse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/current-landuse/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLanduse'] });
    },
  });
};
