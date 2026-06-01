import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

type DocumentItem = {
  id: number;
  name: string;
  extension?: string;
  maxSize?: number;
  isRequired?: string;
  comment?: string;
  isMultiVersionAllowed?: boolean;
  isDocValidityRequired?: boolean;
  documentType?: string | null;
};

export const useCommonDocuments = (
  serviceId?: string,
  submissionId?: number,
  deptId?: number
) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, any>>({});
  const [uploadedList, setUploadedList] = useState<any[]>([]);
  const [documentsAppStatus, setDocumentsAppStatus] = useState<string | null>(null);
  const [dms, setDms] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchChecklist = useCallback(async () => {
    if (!serviceId) return;
    const res = await apiClient.get('/common/documents/checklist', {
      params: { serviceId },
    });
    setDocuments(res?.data || []);
  }, [serviceId]);

  const fetchDms = useCallback(async () => {
    if (!serviceId) return;
    const res = await apiClient.get('/common/documents/dms', {
      params: { serviceId },
    });
    setDms(res?.data || null);
  }, [serviceId]);

  const fetchUploads = useCallback(async () => {
    if (!submissionId || !serviceId) return;
    const res = await apiClient.get('/common/documents/uploads', {
      params: { submissionId, serviceId },
    });
    const uploads = res?.data?.uploads || [];
    setUploadedList(uploads);
    const map: Record<string, any> = {};
    uploads.forEach((item: any) => {
      if (item.documentMasterId) {
        map[String(item.documentMasterId)] = item;
      }
    });
    setUploadedDocuments(map);
    setDocumentsAppStatus(res?.data?.appStatus || null);
  }, [submissionId, serviceId]);

  useEffect(() => {
    fetchChecklist();
  }, [fetchChecklist]);

  useEffect(() => {
    fetchDms();
  }, [fetchDms]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const uploadDocument = useCallback(async (form: FormData) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/common/documents/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res?.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const syncDocuments = useCallback(async () => {
    if (!submissionId || !serviceId) return;
    await apiClient.post('/common/documents/sync', {
      submissionId,
      serviceId,
      deptId: deptId || 0,
    });
    await fetchUploads();
  }, [submissionId, serviceId, deptId, fetchUploads]);

  return {
    documents,
    uploadedDocuments,
    setUploadedDocuments,
    uploadedList,
    documentsAppStatus,
    dms,
    loading,
    fetchChecklist,
    fetchUploads,
    uploadDocument,
    syncDocuments,
  };
};
