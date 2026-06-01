import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface DocumentCheckpoint {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  created?: string;
  modified?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateDocumentCheckpointDto {
  name: string;
  code: string;
  isActive: boolean;
  created?: string | null;
  modified?: string | null;
  filePath?: string | null;
}

interface UpdateDocumentCheckpointDto extends Partial<CreateDocumentCheckpointDto> {}

// Fetch all document checkpoints
export const useDocumentCheckpoints = () => {
  return useQuery<DocumentCheckpoint[]>({
    queryKey: ['documentCheckpoints'],
    queryFn: async () => {
      const response = await apiClient.get('/document-checkpoints');
      return response.data;
    },
  });
};

// Fetch single document checkpoint
export const useDocumentCheckpoint = (id: number) => {
  return useQuery<DocumentCheckpoint>({
    queryKey: ['documentCheckpoints', id],
    queryFn: async () => {
      const response = await apiClient.get(`/document-checkpoints/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create document checkpoint
export const useCreateDocumentCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentCheckpointDto) => {
      const response = await apiClient.post('/document-checkpoints', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCheckpoints'] });
    },
  });
};

// Update document checkpoint
export const useUpdateDocumentCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDocumentCheckpointDto }) => {
      const response = await apiClient.patch(`/document-checkpoints/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCheckpoints'] });
    },
  });
};

// Delete document checkpoint
export const useDeleteDocumentCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/document-checkpoints/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCheckpoints'] });
    },
  });
};

// Toggle document checkpoint status
export const useToggleDocumentCheckpoint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/document-checkpoints/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentCheckpoints'] });
    },
  });
};
