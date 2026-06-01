import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface FormType {
  id: number;
  name: string;
  abbr?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useFormTypes = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery<FormType[]>({
    queryKey: ['formtypes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.search) params.append('search', filters.search);
      const response = await apiClient.get(`/master/form-types?${params.toString()}`);
      return response.data;
    },
  });
};

export const useCreateFormType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/master/form-types', data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formtypes'] }),
  });
};

export const useUpdateFormType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // 🔁 use PATCH to match controller
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.patch(`/master/form-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formtypes'] }),
  });
};

export const useDeleteFormType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/form-types/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formtypes'] }),
  });
};

export const useToggleFormType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // 🔁 use PATCH (controller has @Patch(':id/toggle'))
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/master/form-types/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['formtypes'] }),
  });
};
