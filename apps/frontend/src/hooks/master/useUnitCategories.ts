import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface UnitCategory {
  id: number;
  name: string;
  msmeYearId: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Unit Categories
 */
export const useUnitCategories = (filters?: { isActive?: boolean; search?: string; msmeYearId?: number }) => {
  return useQuery({
    queryKey: ['unitCategories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.msmeYearId) {
        params.append('msmeYearId', filters.msmeYearId.toString());
      }

      const response = await apiClient.get(`/master/unit-categories?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Unit Category
 */
export const useCreateUnitCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      msmeYearId: number;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/unit-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitCategories'] });
    },
  });
};

/**
 * Update Unit Category
 */
export const useUpdateUnitCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        msmeYearId: number;
        effectiveFrom: string;
        effectiveTo: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put(`/master/unit-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitCategories'] });
    },
  });
};

/**
 * Delete Unit Category
 */
export const useDeleteUnitCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/unit-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitCategories'] });
    },
  });
};

/**
 * Toggle Unit Category (Active / Inactive)
 */
export const useToggleUnitCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/unit-categories/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unitCategories'] });
    },
  });
};
