import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface IncentiveType {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Incentive Types
 */
export const useIncentiveTypes = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['incentiveTypes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/incentive-types?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Incentive Type
 */
export const useCreateIncentiveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/incentive-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentiveTypes'] });
    },
  });
};

/**
 * Update Incentive Type
 */
export const useUpdateIncentiveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; effectiveFrom: string; effectiveTo: string; isActive?: boolean };
    }) => {
      const response = await apiClient.put(`/master/incentive-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentiveTypes'] });
    },
  });
};

/**
 * Delete Incentive Type
 */
export const useDeleteIncentiveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/incentive-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentiveTypes'] });
    },
  });
};

/**
 * Toggle Incentive Type (Active / Inactive)
 */
export const useToggleIncentiveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/incentive-types/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incentiveTypes'] });
    },
  });
};
