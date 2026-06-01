import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Block {
  id: number;
  name: string;
  districtId: number;
  stateId: number;
  unitCategory?: string;
  districtCode?: string;
  lgCodeDistrictId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useBlocks = (filters?: {
  isActive?: boolean;
  search?: string;
  districtId?: number;
  stateId?: number;
}) => {
  return useQuery({
    queryKey: ['blocks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.districtId) {
        params.append('districtId', filters.districtId.toString());
      }
      if (filters?.stateId) {
        params.append('stateId', filters.stateId.toString());
      }

      const response = await apiClient.get(`/master/blocks?${params}`);
      return response.data;
    },
  });
};

export const useBlocksByDistrict = (districtId: number) => {
  return useQuery({
    queryKey: ['blocksByDistrict', districtId],
    queryFn: async () => {
      const response = await apiClient.get(`/master/blocks/by-district/${districtId}`);
      return response.data;
    },
    enabled: !!districtId,
  });
};

export const useBlocksByState = (stateId: number) => {
  return useQuery({
    queryKey: ['blocksByState', stateId],
    queryFn: async () => {
      const response = await apiClient.get(`/master/blocks/by-state/${stateId}`);
      return response.data;
    },
    enabled: !!stateId,
  });
};

export const useCreateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Block, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/blocks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
};

export const useUpdateBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Block> }) => {
      const response = await apiClient.put(`/master/blocks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
};

export const useDeleteBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/blocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
};

export const useToggleBlock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/blocks/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
    },
  });
};
