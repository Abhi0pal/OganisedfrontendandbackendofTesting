import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface ProjectStatus {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useProjectStatus = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['projectStatus', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/project-status?${params}`);
      return response.data;
    },
  });
};

export const useCreateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProjectStatus, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/project-status', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatus'] });
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectStatus> }) => {
      const response = await apiClient.put(`/master/project-status/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatus'] });
    },
  });
};

export const useDeleteProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/project-status/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatus'] });
    },
  });
};

export const useToggleProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/project-status/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectStatus'] });
    },
  });
};
