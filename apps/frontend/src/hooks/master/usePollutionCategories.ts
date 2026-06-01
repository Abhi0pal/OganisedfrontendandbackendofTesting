import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface PollutionCategory {
  id: number;
  activityName: string;
  category: string;
  isActive: boolean;
}

export const usePollutionCategories = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['pollution-categories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      const response = await apiClient.get(`/master/pollution-categories?${params}`);
      return response.data as PollutionCategory[];
    },
  });
};
