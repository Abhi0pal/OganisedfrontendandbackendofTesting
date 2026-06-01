import React, { useEffect, useState } from 'react';
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

type PrintActivityLogProps = {
  submissionId: number;
};

const formatDuration = (totalSeconds?: number) => {
  if (!Number.isFinite(totalSeconds)) return '--';
  const seconds = Math.max(0, Number(totalSeconds));
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days} days ${hours} hour ${minutes} min`;
};

export default function PrintActivityLog({ submissionId }: PrintActivityLogProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/history', {
          params: { submissionId },
        });
        setRows(res?.data || []);
      } catch (error) {
        console.error('Failed to load history', error);
        setRows([]);
      }
    };
    if (submissionId) load();
  }, [submissionId]);

  if (!rows.length) {
    return <div className="text-sm text-gray-600">No history available.</div>;
  }

  return (
    <div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>S.No.</th>
            <th>Action Taken By</th>
            <th style={{ width: '140px' }}>Action Taken On</th>
            <th style={{ width: '140px' }}>Action Type</th>
            <th>Comments</th>
            <th style={{ width: '220px' }}>Pending At</th>
            <th style={{ width: '140px' }}>Time Taken by Applicant</th>
            <th style={{ width: '140px' }}>Time Taken by Nodal Agency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isTotal = String(row.comments || '').toLowerCase() === 'total';
            if (isTotal) {
              return (
                <tr key={`total-${index}`}>
                  <td colSpan={6} style={{ textAlign: 'right', fontWeight: 600 }}>
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
