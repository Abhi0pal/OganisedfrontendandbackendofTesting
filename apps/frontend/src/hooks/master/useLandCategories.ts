import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface LandCategory {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Land Categories
 */
export const useLandCategories = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['land-categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/land-categories?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Land Category
 */
export const useCreateLandCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/land-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-categories'] });
    },
  });
};

/**
 * Update Land Category
 */
export const useUpdateLandCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        effectiveFrom: string;
        effectiveTo: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put(`/master/land-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-categories'] });
    },
  });
};

/**
 * Delete Land Category
 */
export const useDeleteLandCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/land-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-categories'] });
    },
  });
};

/**
 * Toggle Land Category (Active / Inactive)
 */
export const useToggleLandCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/land-categories/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-categories'] });
    },
  });
};
