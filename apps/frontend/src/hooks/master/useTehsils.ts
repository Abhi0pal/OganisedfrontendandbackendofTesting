import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Tehsil {
  id: number;
  name: string;
  districtId: number;
  stateId: number;
  subDistrictCode?: string;
  deptDivisionId?: number;
  lgDistrictId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateTehsilDto {
  name: string;
  districtId: number;
  stateId: number;
  subDistrictCode?: string | null;
  deptDivisionId?: number | null;
  lgDistrictId?: number | null;
  isActive: boolean;
}

interface UpdateTehsilDto extends Partial<CreateTehsilDto> {}

export const useTehsils = (filters?: {
  districtId?: number;
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery<Tehsil[]>({
    queryKey: ['tehsils', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.districtId) {
        params.append('districtId', String(filters.districtId));
      }

      if (filters?.isActive !== undefined) {
        params.append('isActive', String(filters.isActive));
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/tehsils?${params.toString()}`);
      return response.data;
    },
  });
};

// Fetch single tehsil
export const useTehsil = (id: number) => {
  return useQuery<Tehsil>({
    queryKey: ['tehsils', id],
    queryFn: async () => {
      const response = await apiClient.get(`/tehsils/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create tehsil
export const useCreateTehsil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTehsilDto) => {
      const response = await apiClient.post('/tehsils', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehsils'] });
    },
  });
};

// Update tehsil
export const useUpdateTehsil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTehsilDto }) => {
      const response = await apiClient.patch(`/tehsils/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehsils'] });
    },
  });
};

// Delete tehsil
export const useDeleteTehsil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/tehsils/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehsils'] });
    },
  });
};

// Toggle tehsil status
export const useToggleTehsil = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/tehsils/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tehsils'] });
    },
  });
};
