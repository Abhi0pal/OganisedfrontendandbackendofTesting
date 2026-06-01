import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface UpclSupplySubcategory {
  id: string;
  name: string;
  type: string;
  supplyCategoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUpclSupplySubcategories = (filters?: { isActive?: boolean; search?: string; type?: string; supplyCategoryId?: string }) => {
  return useQuery({
    queryKey: ['upclSupplySubcategories', filters],
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
      if (filters?.supplyCategoryId) {
        params.append('supplyCategoryId', filters.supplyCategoryId);
      }

      const response = await apiClient.get(`/master/upcl-supply-subcategories?${params}`);
      return response.data;
    },
  });
};

export const useCreateUpclSupplySubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UpclSupplySubcategory, 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/upcl-supply-subcategories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplySubcategories'] });
    },
  });
};

export const useUpdateUpclSupplySubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UpclSupplySubcategory> }) => {
      const response = await apiClient.put(`/master/upcl-supply-subcategories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplySubcategories'] });
    },
  });
};

export const useDeleteUpclSupplySubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/master/upcl-supply-subcategories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplySubcategories'] });
    },
  });
};

export const useToggleUpclSupplySubcategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.put(`/master/upcl-supply-subcategories/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclSupplySubcategories'] });
    },
  });
};
