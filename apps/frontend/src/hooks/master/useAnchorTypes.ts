import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface AnchorType {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Anchor Types
 */
export const useAnchorTypes = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['anchorTypes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/anchor-types?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Anchor Type
 */
export const useCreateAnchorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/anchor-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anchorTypes'] });
    },
  });
};

/**
 * Update Anchor Type
 */
export const useUpdateAnchorType = () => {
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
      const response = await apiClient.put(`/master/anchor-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anchorTypes'] });
    },
  });
};

/**
 * Delete Anchor Type
 */
export const useDeleteAnchorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/anchor-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anchorTypes'] });
    },
  });
};

/**
 * Toggle Anchor Type (Active / Inactive)
 */
export const useToggleAnchorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/anchor-types/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anchorTypes'] });
    },
  });
};
