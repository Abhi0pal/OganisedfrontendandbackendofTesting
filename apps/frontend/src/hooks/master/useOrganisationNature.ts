import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface OrganisationNature {
  id: number;
  name: string;
  is_active?: boolean;
  education_is_active?: boolean; 
  created: string;
  updated: string;
}

export const useOrganisationNature = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['organisationnature', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/unit-organisation?${params}`);
      return response.data;
    },
  });
};

export const useCreateOrganisationNature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/master/unit-organisation', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisationnature'] });
    },
  });
};

export const useUpdateOrganisationNature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/master/unit-organisation/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisationnature'] });
    },
  });
};

export const useDeleteOrganisationNature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/unit-organisation/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisationnature'] });
    },
  });
};

export const useToggleOrganisationNature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/unit-organisation/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organisationnature'] });
    },
  });
};
