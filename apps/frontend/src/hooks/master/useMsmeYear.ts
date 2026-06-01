import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MsmeYear {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get MSME Years
 */
export const useMsmeYears = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['msmeYears', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/msme-year?${params}`);
      return response.data;
    },
  });
};

/**
 * Create MSME Year
 */
export const useCreateMsmeYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/msme-year', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['msmeYears'] });
    },
  });
};

/**
 * Update MSME Year
 */
export const useUpdateMsmeYear = () => {
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
      const response = await apiClient.put(`/master/msme-year/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['msmeYears'] });
    },
  });
};

/**
 * Delete MSME Year
 */
export const useDeleteMsmeYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/msme-year/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['msmeYears'] });
    },
  });
};

/**
 * Toggle MSME Year (Active / Inactive)
 */
export const useToggleMsmeYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/msme-year/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['msmeYears'] });
    },
  });
};
