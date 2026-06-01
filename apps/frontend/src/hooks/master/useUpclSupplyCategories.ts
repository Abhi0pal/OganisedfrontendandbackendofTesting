import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface UpclSupplyCategory {
  id: string;
  name: string;
  type: string;
  parent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUpclSupplyCategories = (filters?: { isActive?: boolean; search?: string; type?: string }) => {
  return useQuery({
    queryKey: ['upclSupplyCategories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.type) {
        params.append('type', filters.type);
      }

      const response = await apiClient.get(`/master/upcl-supply-categories?${params}`);
      return response.data;
    },
  });
};

export const useCreateUpclSupplyCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UpclSupplyCategory, 'createdAt' | 'updatedAt' | 'id'>) => {
      const response = await apiClient.post('/master/upcl-supply-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplyCategories'] });
    },
  });
};

export const useUpdateUpclSupplyCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UpclSupplyCategory> }) => {
      const response = await apiClient.put(`/master/upcl-supply-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplyCategories'] });
    },
  });
};

export const useDeleteUpclSupplyCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/master/upcl-supply-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplyCategories'] });
    },
  });
};

export const useToggleUpclSupplyCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/master/upcl-supply-categories/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplyCategories'] });
    },
  });
};
