import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface District {
  id: number;
  name: string;
  abbreviation?: string;
  stateCode?: string;
  districtCode?: string;
  latlong?: string;
  isActive: boolean;
  stateId: number;
  createdAt: string;
  updatedAt: string;
}

export const useDistricts = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['Districts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/districts?${params}`);
      return response.data;
    },
  });
};

export const useCreateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<District, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/districts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Districts'] });
    },
  });
};

export const useUpdateDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<District> }) => {
      const response = await apiClient.put(`/master/districts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Districts'] });
    },
  });
};

export const useDeleteDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/districts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Districts'] });
    },
  });
};

export const useToggleDistrict = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/districts/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Districts'] });
    },
  });
};
