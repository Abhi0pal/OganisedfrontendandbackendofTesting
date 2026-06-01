import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface DocumentType {
  id: number;
  name: string;
  abbreviation: string;
  isDocActive: boolean;
  isFormatRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateDocumentTypeDto {
  name: string;
  abbreviation: string;
  isDocActive: boolean;
  isFormatRequired?: boolean | null;
}

interface UpdateDocumentTypeDto extends Partial<CreateDocumentTypeDto> {}

// Fetch all document types
export const useDocumentTypes = (enabled: boolean = true) => {
  return useQuery<DocumentType[]>({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      const response = await apiClient.get('/document-types');
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch single document type
export const useDocumentType = (id: number) => {
  return useQuery<DocumentType>({
    queryKey: ['documentTypes', id],
    queryFn: async () => {
      const response = await apiClient.get(`/document-types/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create document type
export const useCreateDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentTypeDto) => {
      const response = await apiClient.post('/document-types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
};

// Update document type
export const useUpdateDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDocumentTypeDto }) => {
      const response = await apiClient.patch(`/document-types/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
};

// Delete document type
export const useDeleteDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/document-types/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
};

// Toggle document type status
export const useToggleDocumentType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/document-types/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
};
