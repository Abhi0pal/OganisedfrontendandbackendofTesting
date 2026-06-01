import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface DocumentMaster {
  id: number;
  checklistId: string;
  stateId: number;
  issuerId: number;
  departmentId: number;
  documentTypeId?: number | null;
  issuerById?: number | null;
  checklistDocumentName: string;
  checklistDocumentExtension: string;
  checklistDocumentMaxSize: number;
  prescribedDocumentPath?: string | null;
  
  // 7 NEW FIELDS
  services: number[];
  documentCheckpoints: number[];
  isMultiVersionAllowed: boolean;
  isDocValidityRequired: boolean;
  isDocReferenceNumberRequired: boolean;
  isAutoInsertAllowed: boolean;
  
  isDocActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  state?: any;
  issuer?: any;
  department?: any;
  documentType?: any;
}

interface CreateDocumentMasterDto {
  stateId: number;
  issuerId: number;
  departmentId: number;
  documentTypeId?: number | null;
  issuerById?: number | null;
  checklistDocumentName: string;
  checklistDocumentExtension: string;
  checklistDocumentMaxSize: number;
  prescribedDocumentPath?: string | null;
  
  // 7 NEW FIELDS
  services?: number[];
  documentCheckpoints?: number[];
  isMultiVersionAllowed?: boolean;
  isDocValidityRequired?: boolean;
  isDocReferenceNumberRequired?: boolean;
  isAutoInsertAllowed?: boolean;
  
  isDocActive?: boolean;
}

interface UpdateDocumentMasterDto extends Partial<CreateDocumentMasterDto> {}

export const useDocumentMasters = (enabled: boolean = true) => {
  return useQuery<DocumentMaster[]>({
    queryKey: ['documentMasters'],
    queryFn: async () => {
      const response = await apiClient.get('/document-masters');
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDocumentMaster = (id: number) => {
  return useQuery<DocumentMaster>({
    queryKey: ['documentMasters', id],
    queryFn: async () => {
      const response = await apiClient.get(`/document-masters/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateDocumentMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentMasterDto) => {
      const response = await apiClient.post('/document-masters', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentMasters'] });
    },
  });
};

export const useUpdateDocumentMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDocumentMasterDto }) => {
      const response = await apiClient.patch(`/document-masters/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentMasters'] });
    },
  });
};

export const useDeleteDocumentMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/document-masters/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentMasters'] });
    },
  });
};

export const useToggleDocumentMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/document-masters/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentMasters'] });
    },
  });
};
