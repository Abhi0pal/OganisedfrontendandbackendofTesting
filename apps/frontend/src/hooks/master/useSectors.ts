import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface Sector {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Sectors
 */
export const useSectors = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['sectors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/sectors?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Sector
 */
export const useCreateSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/sectors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
};

/**
 * Update Sector
 */
export const useUpdateSector = () => {
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
      const response = await apiClient.put(`/master/sectors/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
};

/**
 * Delete Sector
 */
export const useDeleteSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/sectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
};

/**
 * Toggle Sector (Active / Inactive)
 */
export const useToggleSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/sectors/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sectors'] });
    },
  });
};
