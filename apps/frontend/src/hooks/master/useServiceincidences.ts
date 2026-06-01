import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface ServiceIncidence {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useServiceIncidences = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['serviceIncidences', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/serviceincidence?${params}`);
      return response.data;
    },
  });
};

export const useCreateServiceIncidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/master/serviceincidence', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceIncidences'] });
    },
  });
};

export const useUpdateServiceIncidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/master/serviceincidence/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceIncidences'] });
    },
  });
};

export const useDeleteServiceIncidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/serviceincidences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceIncidences'] });
    },
  });
};

export const useToggleServiceIncidence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/serviceincidence/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceIncidences'] });
    },
  });
};
