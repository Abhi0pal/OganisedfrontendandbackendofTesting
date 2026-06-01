import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface RegionCategory {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Region Categories
 */
export const useRegionCategories = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['regionCategories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/region-categories?${params}`);
      return response.data;
    },
  });
};

/**
 * Create region Category
 */
export const useCreateRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/region-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionCategories'] });
    },
  });
};

/**
 * Update Region Category
 */
export const useUpdateRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; effectiveFrom: string; effectiveTo: string; isActive?: boolean };
    }) => {
      const response = await apiClient.put(`/master/region-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionCategories'] });
    },
  });
};

/**
 * Delete Region Category
 */
export const useDeleteRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/region-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionCategories'] });
    },
  });
};

/**
 * Toggle Region Category (Active / Inactive)
 */
export const useToggleRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/region-categories/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regionCategories'] });
    },
  });
};
