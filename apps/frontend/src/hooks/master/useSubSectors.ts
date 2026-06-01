import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface SubSector {
  id: number;
  name: string;
  sectorId: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get SubSectors
 */
export const useSubSectors = (filters?: { sectorId?: number; isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['subSectors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.sectorId !== undefined) {
        params.append('sectorId', filters.sectorId.toString());
      }
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/sub-sectors?${params}`);
      return response.data;
    },
  });
};

/**
 * Create SubSector
 */
export const useCreateSubSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      sectorId: number;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/sub-sectors', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subSectors'] });
    },
  });
};

/**
 * Update SubSector
 */
export const useUpdateSubSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        sectorId: number;
        effectiveFrom: string;
        effectiveTo: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put(`/master/sub-sectors/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subSectors'] });
    },
  });
};

/**
 * Delete SubSector
 */
export const useDeleteSubSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/sub-sectors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subSectors'] });
    },
  });
};

/**
 * Toggle SubSector (Active / Inactive)
 */
export const useToggleSubSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/sub-sectors/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subSectors'] });
    },
  });
};
