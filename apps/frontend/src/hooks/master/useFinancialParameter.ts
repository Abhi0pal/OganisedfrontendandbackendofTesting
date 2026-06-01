import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface FinancialParameter {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit?: string;
  dataType?: string;
  isCalculable: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Financial Parameters
 */
export const useFinancialParameters = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['financialParameters', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/financial-parameters?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Financial Parameter
 */
export const useCreateFinancialParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      unit?: string;
      dataType?: string;
      isCalculable?: boolean;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/financial-parameters', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialParameters'] });
    },
  });
};

/**
 * Update Financial Parameter
 */
export const useUpdateFinancialParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        code: string;
        name: string;
        description?: string;
        unit?: string;
        dataType?: string;
        isCalculable?: boolean;
        effectiveFrom: string;
        effectiveTo: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put(`/master/financial-parameters/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialParameters'] });
    },
  });
};

/**
 * Delete Financial Parameter
 */
export const useDeleteFinancialParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/financial-parameters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialParameters'] });
    },
  });
};

/**
 * Toggle Financial Parameter (Active / Inactive)
 */
export const useToggleFinancialParameter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/financial-parameters/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialParameters'] });
    },
  });
};
