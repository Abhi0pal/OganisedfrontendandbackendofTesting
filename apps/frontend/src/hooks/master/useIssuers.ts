import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Issuer {
  id: number;
  name: string;
  isIssuerActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateIssuerDto {
  name: string;
  isIssuerActive: boolean;
}

interface UpdateIssuerDto extends Partial<CreateIssuerDto> {}

// Fetch all issuers
export const useIssuers = (enabled: boolean = true) => {
  return useQuery<Issuer[]>({
    queryKey: ['issuers'],
    queryFn: async () => {
      const response = await apiClient.get('/issuers');
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch single issuer
export const useIssuer = (id: number) => {
  return useQuery<Issuer>({
    queryKey: ['issuers', id],
    queryFn: async () => {
      const response = await apiClient.get(`/issuers/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create issuer
export const useCreateIssuer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIssuerDto) => {
      const response = await apiClient.post('/issuers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuers'] });
    },
  });
};

// Update issuer
export const useUpdateIssuer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateIssuerDto }) => {
      const response = await apiClient.patch(`/issuers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuers'] });
    },
  });
};

// Delete issuer
export const useDeleteIssuer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/issuers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuers'] });
    },
  });
};

// Toggle issuer status
export const useToggleIssuer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/issuers/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuers'] });
    },
  });
};
