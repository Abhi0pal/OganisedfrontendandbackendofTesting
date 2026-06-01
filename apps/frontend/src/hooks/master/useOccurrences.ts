import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface Occurrence {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Occurrences
 */
export const useOccurrences = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['occurrences', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/occurrences?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Occurrence
 */
export const useCreateOccurrence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/occurrences', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
  });
};

/**
 * Update Occurrence
 */
export const useUpdateOccurrence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; effectiveFrom: string; effectiveTo: string; isActive?: boolean };
    }) => {
      const response = await apiClient.put(`/master/occurrences/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
  });
};

/**
 * Delete Occurrence
 */
export const useDeleteOccurrence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/occurrences/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
  });
};

/**
 * Toggle Occurrence (Active / Inactive)
 */
export const useToggleOccurrence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/occurrences/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    },
  });
};
