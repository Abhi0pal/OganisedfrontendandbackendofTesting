import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface ServiceSector {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useServiceSectors = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['serviceSectors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/servicesector?${params}`);
      return response.data;
    },
  });
};

export const useCreateServiceSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/master/servicesector', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSectors'] });
    },
  });
};

export const useUpdateServiceSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/master/servicesector/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSectors'] });
    },
  });
};

export const useDeleteServiceSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/servicesectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSectors'] });
    },
  });
};

export const useToggleServiceSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/servicesector/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['serviceSectors'] });
    },
  });
};
