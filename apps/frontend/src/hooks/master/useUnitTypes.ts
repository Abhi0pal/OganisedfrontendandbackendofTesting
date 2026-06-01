import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface UnitType {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Unit Types
 */
export const useUnitTypes = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['unit-types', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/unit-types?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Unit Type
 */
export const useCreateUnitType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/unit-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-types'] });
    },
  });
};

/**
 * Update Unit Type
 */
export const useUpdateUnitType = () => {
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
      const response = await apiClient.put(`/master/unit-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-types'] });
    },
  });
};

/**
 * Delete Unit Type
 */
export const useDeleteUnitType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/unit-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-types'] });
    },
  });
};

/**
 * Toggle Unit Type (Active / Inactive)
 */
export const useToggleUnitType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/unit-types/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-types'] });
    },
  });
};
