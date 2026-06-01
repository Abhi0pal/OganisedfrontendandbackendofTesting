
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type InvestorDocumentStatus = 'U' | 'V' | 'R' | 'M'; // Unverified, Verified, Rejected, Mismatched

export interface InvestorDocument {
  id: number | string;
  documentMasterId: number;
  documentTypeId: number;
  issuerId: number;
  departmentId: number;
  investorProfileUid: string;
  userId: string | number;
  documentReferenceNumber: string;
  documentName: string;
  documentVersion: string; // e.g., "V1.0"
  documentStatus: InvestorDocumentStatus;
  isDocumentActive: 'Y' | 'N';
  documentPath: string;
  validFrom?: string;
  validTo?: string;
  documentDateOfIssuance?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  // Optional includes if backend returns relations:
  documentMaster?: any;
  documentType?: { id: number; name: string; abbreviation?: string };
  issuer?: { id: number; name: string };
  department?: { id: number; name: string };
}

export interface CreateInvestorDocumentDto {
  documentMasterId: number;
  documentTypeId: number;
  checklistId: string;     // ✅ REQUIRED by backend
  issuerId: number;
  departmentId: number;
  documentName: string;
  documentPath: string;
  documentVersion?: string;
  validFrom?: string;
  validTo?: string;
  documentDateOfIssuance?: string;
  comments?: string;
}

export interface UpdateInvestorDocumentDto {
  documentName?: string;
  comments?: string;
  validFrom?: string;
  validTo?: string;
  documentDateOfIssuance?: string;
  documentStatus?: InvestorDocumentStatus;
  documentPath?: string;
}

export interface InvestorDocumentsPaginatedResponse {
  data: InvestorDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InvestorDocumentsQueryParams {
  page?: number;
  limit?: number;
}

// -------- Queries --------

export const useInvestorDocuments = (params?: InvestorDocumentsQueryParams) =>
  useQuery<InvestorDocumentsPaginatedResponse>({
    queryKey: ['investorDocuments', params?.page || 1, params?.limit || 10],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (Number.isFinite(Number(params?.page)) && Number(params?.page) > 0) {
        qs.set('page', String(params?.page));
      }
      if (Number.isFinite(Number(params?.limit)) && Number(params?.limit) > 0) {
        qs.set('limit', String(params?.limit));
      }
      const queryString = qs.toString();
      const res = await apiClient.get(
        queryString ? `/investor/documents?${queryString}` : '/investor/documents',
      );
      return res.data as InvestorDocumentsPaginatedResponse;
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useDocumentStats = () =>
  useQuery({
    queryKey: ['investorDocuments', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/investor/documents/stats');
      return res.data as { unverified: number; verified: number; mismatch: number; rejected: number; total: number };
    },
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

export const useVersionHistory = (documentMasterId: number | undefined) =>
  useQuery<InvestorDocument[]>({
    queryKey: ['investorDocuments', 'versions', documentMasterId],
    queryFn: async () => {
      const res = await apiClient.get(`/investor/documents/versions/${documentMasterId}`);
      return res.data;
    },
    enabled: !!documentMasterId,
  });

// -------- Mutations --------

export const useCreateInvestorDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInvestorDocumentDto) => {
      const res = await apiClient.post('/investor/documents', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investorDocuments'] });
      qc.invalidateQueries({ queryKey: ['investorDocuments', 'stats'] });
    },
  });
};

export const useUpdateInvestorDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateInvestorDocumentDto }) => {
      const res = await apiClient.put(`/investor/documents/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investorDocuments'] });
      qc.invalidateQueries({ queryKey: ['investorDocuments', 'stats'] });
    },
  });
};

export const useDeleteInvestorDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await apiClient.delete(`/investor/documents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investorDocuments'] });
      qc.invalidateQueries({ queryKey: ['investorDocuments', 'stats'] });
    },
  });
};

export const useUploadInvestorDocument = () => {
  return useMutation({
    mutationFn: async (payload: { file: File; documentMasterId: number }) => {
      const form = new FormData();
      form.append('file', payload.file);
      form.append('documentMasterId', String(payload.documentMasterId));

      const res = await apiClient.post('/upload/investor-document', form);
      return res.data as {
        success: boolean;
        message: string;
        data: {
          filePath: string;
          fileName: string;
          originalName: string;
          size: number;
          mimetype: string;
          documentReferenceNumber: string; // e.g., 19460403_UK-DCL-998_V1.6
          documentVersion: string;         // e.g., V1.6
          originalSizeBytes?: number;
          compressedSizeBytes?: number;
          savedBytes?: number;
          savedPercent?: number;
        };
      };
    },
  });
};
