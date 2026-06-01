import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Village {
  id: number;
  name: string;
  tehsilId: number;
  villageCode: string;
  subDistrictCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateVillageDto {
  name: string;
  tehsilId: number;
  villageCode: string;
  subDistrictCode?: string | null;
  isActive: boolean;
}

interface UpdateVillageDto extends Partial<CreateVillageDto> {}

// Fetch all villages
export const useVillages = () => {
  return useQuery<Village[]>({
    queryKey: ['villages'],
    queryFn: async () => {
      const response = await apiClient.get('/villages');
      return response.data;
    },
  });
};

// Fetch single village
export const useVillage = (id: number) => {
  return useQuery<Village>({
    queryKey: ['villages', id],
    queryFn: async () => {
      const response = await apiClient.get(`/villages/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create village
export const useCreateVillage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVillageDto) => {
      const response = await apiClient.post('/villages', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
  });
};

// Update village
export const useUpdateVillage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateVillageDto }) => {
      const response = await apiClient.patch(`/villages/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
  });
};

// Delete village
export const useDeleteVillage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/villages/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
  });
};

// Toggle village status
export const useToggleVillage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/villages/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['villages'] });
    },
  });
};
