'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getApplicationStatusLabel } from '@/components/(investor)/inprinciple/utils/inprincipleUtils';

type HistoryRow = {
  id: number;
  sequence: number;
  actionBy: string;
  actionOn: string;
  status: string;
  comments: string;
};

export default function InprincipleHistoryPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ submissionId?: string }> }) {
  const resolvedSearchParams = React.use(searchParams);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const decodeParam = (value?: string | null) => {
    if (!value) return '';
    return value;
  };

  const submissionId = useMemo(() => {
    const token = resolvedSearchParams?.submissionId;
    const decoded = decodeParam(token);
    const parsedId = Number(decoded);
    return Number.isFinite(parsedId) ? parsedId : null;
  }, [resolvedSearchParams]);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/history', {
          params: { submissionId },
        });
        setRows(res?.data || []);
      } catch (error) {
        console.error('Failed to load history', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [submissionId]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading activity log...</div>;
  }

  if (!rows.length) {
    return <div className="p-6 text-sm text-gray-600">No history available.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Activity Log</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3">S.No.</th>
              <th className="px-4 py-3">Action Taken By</th>
              <th className="px-4 py-3">Action Taken On</th>
              <th className="px-4 py-3">Action Type</th>
              <th className="px-4 py-3">Comments</th>
              <th className="px-4 py-3">Time Taken by Applicant</th>
              <th className="px-4 py-3">Time Taken by Nodal Agency</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id || index} className="border-t border-gray-200">
                <td className="px-4 py-3">{row.sequence || index + 1}</td>
                <td className="px-4 py-3">{row.actionBy || 'Investor'}</td>
                <td className="px-4 py-3">
                  {row.actionOn ? new Date(row.actionOn).toLocaleString('en-IN') : '--'}
                </td>
                <td className="px-4 py-3">{getApplicationStatusLabel(row.status)}</td>
                <td className="px-4 py-3">{row.comments || '--'}</td>
                <td className="px-4 py-3">--</td>
                <td className="px-4 py-3">--</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
