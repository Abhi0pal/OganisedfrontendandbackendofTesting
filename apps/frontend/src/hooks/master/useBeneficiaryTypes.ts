import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface BeneficiaryType {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Beneficiary Types
 */
export const useBeneficiaryTypes = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['beneficiaryTypes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/beneficiary-types?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Beneficiary Type
 */
export const useCreateBeneficiaryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/beneficiary-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaryTypes'] });
    },
  });
};

/**
 * Update Beneficiary Type
 */
export const useUpdateBeneficiaryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; effectiveFrom: string; effectiveTo: string; isActive?: boolean };
    }) => {
      const response = await apiClient.put(`/master/beneficiary-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaryTypes'] });
    },
  });
};

/**
 * Delete Beneficiary Type
 */
export const useDeleteBeneficiaryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/beneficiary-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaryTypes'] });
    },
  });
};

/**
 * Toggle Beneficiary Type (Active / Inactive)
 */
export const useToggleBeneficiaryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/beneficiary-types/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaryTypes'] });
    },
  });
};
