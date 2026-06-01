import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface UpclDivisionSubdivision {
  id: number;
  divisionId: string;
  divisionCode: string;
  divisionName: string;
  subdivisionId: string;
  subdivisionCode: string;
  subdivisionName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useUpclDivisionSubdivisions = (filters?: { isActive?: boolean; search?: string }) => {
  return useQuery({
    queryKey: ['upclDivisionSubdivisions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(`/master/upcl-division-subdivisions?${params}`);
      return response.data;
    },
  });
};

export const useCreateUpclDivisionSubdivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<UpclDivisionSubdivision, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/master/upcl-division-subdivisions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclDivisionSubdivisions'] });
    },
  });
};

export const useUpdateUpclDivisionSubdivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<UpclDivisionSubdivision, 'id'>> }) => {
      const response = await apiClient.put(`/master/upcl-division-subdivisions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclDivisionSubdivisions'] });
    },
  });
};

export const useDeleteUpclDivisionSubdivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/upcl-division-subdivisions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclDivisionSubdivisions'] });
    },
  });
};

export const useToggleUpclDivisionSubdivision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/master/upcl-division-subdivisions/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upclDivisionSubdivisions'] });
    },
  });
};
