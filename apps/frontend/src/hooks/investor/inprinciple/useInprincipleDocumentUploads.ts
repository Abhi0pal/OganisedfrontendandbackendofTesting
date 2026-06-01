import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

export type UploadedDocumentMap = Record<string, any>;

export const useInprincipleDocumentUploads = (
  submissionId?: number | null,
  serviceId?: string
) => {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocumentMap>({});
  const [documentsAppStatus, setDocumentsAppStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUploads = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/common/documents/uploads', {
        params: { submissionId, serviceId },
      });
      const uploads = res?.data?.uploads || [];
      const map: UploadedDocumentMap = {};
      uploads.forEach((item: any) => {
        if (item.documentMasterId) {
          map[String(item.documentMasterId)] = item;
        }
      });
      setUploadedDocuments(map);
      setDocumentsAppStatus(res?.data?.appStatus || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [submissionId, serviceId]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent;
      const detail = custom?.detail || {};
      if (!detail?.submissionId || !detail?.serviceId) return;
      if (Number(detail.submissionId) !== Number(submissionId)) return;
      if (String(detail.serviceId) !== String(serviceId || '')) return;
      fetchUploads();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('common-documents:uploaded', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('common-documents:uploaded', handler as EventListener);
      }
    };
  }, [fetchUploads, submissionId, serviceId]);

  const uploadDocument = useCallback(
    async (form: FormData) => {
      const res = await apiClient.post('/common/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res?.data;
    },
    []
  );

  return {
    uploadedDocuments,
    setUploadedDocuments,
    documentsAppStatus,
    loading,
    fetchUploads,
    uploadDocument,
  };
};
