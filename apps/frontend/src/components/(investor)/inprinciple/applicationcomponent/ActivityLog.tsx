'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { getApplicationStatusLabel } from '@/components/(investor)/inprinciple/utils/inprincipleUtils';

type HistoryRow = {
  id: number;
  sequence: number;
  actionBy: string;
  actionOn: string;
  status: string;
  comments: string;
  pendingAt?: string;
  timeTakenByApplicantSeconds?: number;
  timeTakenByDepartmentSeconds?: number;
};

type ActivityLogProps = {
  submissionId: number | null;
};

export default function ActivityLog({ submissionId }: ActivityLogProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!submissionId) {
      setRows([]);
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/investor/inprinciple/history', {
          params: { submissionId },
        });
        setRows(res?.data || []);
      } catch (error) {
        console.error('Failed to load history', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [submissionId]);

  if (loading) {
    return <div className="text-sm text-gray-600">Loading activity log...</div>;
  }

  if (!rows.length) {
    return <div className="text-sm text-gray-600">No history available.</div>;
  }

  const formatDuration = (totalSeconds?: number) => {
    if (!Number.isFinite(totalSeconds)) return '--';
    const seconds = Math.max(0, Number(totalSeconds));
    const days = Math.floor(seconds / (60 * 60 * 24));
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days} days ${hours} hour ${minutes} min`;
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-sm align-middle">
        <thead className="table-light">
          <tr>
            <th>S.No.</th>
            <th>Action Taken By</th>
            <th>Action Taken On</th>
            <th>Action Type</th>
            <th>Comments</th>
            <th>Pending At</th>
            <th>Time Taken by Applicant</th>
            <th>Time Taken by Nodal Agency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isTotal = String(row.comments || '').toLowerCase() === 'total';
            if (isTotal) {
              return (
                <tr key={`total-${index}`} className="fw-semibold">
                  <td colSpan={6} className="text-end">
                    Total
                  </td>
                  <td>{formatDuration(row.timeTakenByApplicantSeconds)}</td>
                  <td>{formatDuration(row.timeTakenByDepartmentSeconds)}</td>
                </tr>
              );
            }
            return (
              <tr key={`row-${row.id || index}`}>
                <td>{row.sequence || index + 1}</td>
                <td>{row.actionBy || 'Investor'}</td>
                <td>{row.actionOn ? new Date(row.actionOn).toLocaleString('en-IN') : '--'}</td>
                <td>{getApplicationStatusLabel(row.status)}</td>
                <td>{row.comments || '--'}</td>
                <td>{row.pendingAt || '--'}</td>
                <td>{formatDuration(row.timeTakenByApplicantSeconds)}</td>
                <td>{formatDuration(row.timeTakenByDepartmentSeconds)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
