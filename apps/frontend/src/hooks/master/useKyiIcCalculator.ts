import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Interface representing the full object as returned by the Backend
 */
export interface KyiIcCalculator {
  id: number;
  benefit_percent_amount?: number;
  cap_limit?: number;
  extra_fixed_amount?: number;
  above_calculating_amount?: number;
  years_of_recurring?: number;
  eligibility_notes?: string;
  description?: string;
  limitation?: string;
  policy_id?: string;
  policy?: {
    id: string;
    policy_name: string;
  };
  msme_year_value?: number;
  unit_category_value?: number;
  unit_type_value?: number;
  sector_value?: number;
  sub_sector_value?: number;
  ocurrance_value?: number;
  block_value?: number;
  region_category_value?: number;
  land_type_value?: number;
  beneficiary_type_value?: number;
  anchor_unit_value?: number;
  incentive_mapping_id?: number;
  incentive_value?: number;
  effectiveFrom: string; // ISO String from API
  effectiveTo: string;   // ISO String from API
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface representing the Payload to be sent (Matching the DTO)
 */
export interface CreateKyiIcCalculatorPayload {
  benefit_percent_amount?: number;
  cap_limit?: number;
  extra_fixed_amount?: number;
  above_calculating_amount?: number;
  years_of_recurring?: number;
  eligibility_notes?: string;
  description?: string;
  limitation?: string;
  policy_id?: string;
  policy?: {
    id: string;
    name: string;
  };
  msme_year_value?: number;
  unit_category_value?: number;
  unit_type_value?: number;
  sector_value?: number;
  sub_sector_value?: number;
  ocurrance_value?: number;
  block_value?: number;
  region_category_value?: number;
  land_type_value?: number;
  beneficiary_type_value?: number;
  anchor_unit_value?: number;
  incentive_mapping_id?: number;
  incentive_value?: number;
  effectiveFrom: Date | string;
  effectiveTo: Date | string;
  isActive?: boolean;
}

/**
 * Fetch All KyiIcCalculators with optional filters
 */
export const useKyiIcCalculators = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['kyiIcCalculators', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get(`/master/kyi-ic-calculator`, { params });
      return response.data;
    },
  });
};

/**
 * Create KyiIcCalculator
 * Uses CreateKyiIcCalculatorPayload to match the Class Validator DTO
 */
export const useCreateKyiIcCalculator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateKyiIcCalculatorPayload) => {
      const response = await apiClient.post('/master/kyi-ic-calculator', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyiIcCalculators'] });
    },
  });
};

/**
 * Update KyiIcCalculator
 */
export const useUpdateKyiIcCalculator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateKyiIcCalculatorPayload> }) => {
      const response = await apiClient.put(`/master/kyi-ic-calculator/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyiIcCalculators'] });
    },
  });
};

/**
 * Delete KyiIcCalculator
 */
export const useDeleteKyiIcCalculator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/kyi-ic-calculator/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyiIcCalculators'] });
    },
  });
};

/**
 * Toggle Active Status
 */
export const useToggleKyiIcCalculator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/kyi-ic-calculator/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyiIcCalculators'] });
    },
  });
};