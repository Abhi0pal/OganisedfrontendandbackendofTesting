import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Country {
  id: number;
  name: string;
  abbreviation?: string;
  boCountryId?: number;
  lrId?: number;
  hadbastNumber?: number;
  vtcCode?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useCountries = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['countries', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/countries?${params}`);
      return response.data;
    },
  });
};

export const useCreateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/master/countries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useUpdateCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/master/countries/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useDeleteCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/countries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};

export const useToggleCountry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/countries/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['countries'] });
    },
  });
};
