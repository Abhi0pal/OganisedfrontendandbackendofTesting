import { useCallback, useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';

export const useInprinciplePayments = (
  submissionId?: number | null,
  historySubmissionId?: number | null
) => {
  const [paymentRows, setPaymentRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    const currentId = submissionId || null;
    const historyId = historySubmissionId || null;
    if (!currentId && !historyId) return;
    setLoading(true);
    try {
      const requests: Promise<any>[] = [];
      if (currentId) {
        requests.push(
          apiClient.get('/investor/inprinciple/payment', {
            params: { submissionId: currentId },
          })
        );
      }
      if (historyId && historyId !== currentId) {
        requests.push(
          apiClient.get('/investor/inprinciple/payment', {
            params: { submissionId: historyId },
          })
        );
      }
      const results = await Promise.all(requests);
      const rows = results.flatMap((res) => res?.data?.payments || []);
      const seen = new Set<string>();
      const merged = rows.filter((row: any) => {
        const key = String(row?.paymentId ?? row?.pgMeTrnRefNo ?? Math.random());
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      merged.sort((a: any, b: any) => {
        const aTime = a?.created ? new Date(a.created).getTime() : 0;
        const bTime = b?.created ? new Date(b.created).getTime() : 0;
        return bTime - aTime;
      });
      setPaymentRows(merged);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [submissionId, historySubmissionId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const hasSuccessfulPayment = useMemo(
    () => paymentRows.some((row) => String(row?.statusCode) === 'S'),
    [paymentRows]
  );

  const canRetry = useMemo(
    () =>
      !hasSuccessfulPayment &&
      paymentRows.length > 0 &&
      String(paymentRows[0]?.statusCode) === 'F',
    [paymentRows, hasSuccessfulPayment]
  );

  const createPayment = useCallback(
    async (amount: number) => {
      if (!submissionId) return null;
      setLoading(true);
      try {
        const createRes = await apiClient.post('/investor/inprinciple/payment/create', {
          submissionId,
          amount,
          paymentMode: 'PayGov',
        });
        return createRes?.data?.payment || null;
      } finally {
        setLoading(false);
      }
    },
    [submissionId]
  );

  const updatePayment = useCallback(async (paymentId: number, statusCode: 'S' | 'F') => {
    setLoading(true);
    try {
      const updateRes = await apiClient.post('/investor/inprinciple/payment/update', {
        paymentId,
        statusCode,
      });
      return updateRes?.data?.payment || null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    paymentRows,
    loading,
    fetchPayments,
    hasSuccessfulPayment,
    canRetry,
    createPayment,
    updatePayment,
  };
};
