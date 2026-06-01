import { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

export type ApprovedSbItem = {
  submissionId: number;
  ubuId: string;
  unitName: string;
  serviceId: string;
};

// Fetch approved SB (CAF) submissions for existing investor flows.
export const useApprovedSbSubmissions = (serviceId?: string) => {
  const [items, setItems] = useState<ApprovedSbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApproved = useCallback(async () => {
    if (!serviceId) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/investor/inprinciple/approved-sb', {
        params: { serviceId },
      });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to load approved SB IDs.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchApproved();
  }, [fetchApproved]);

  return {
    items,
    loading,
    error,
    refresh: fetchApproved,
  };
};

export const fetchApprovedSbSubmission = async (submissionId: number) => {
  const res = await apiClient.get('/investor/inprinciple/approved-sb/view', {
    params: { submissionId },
  });
  return res?.data;
};
