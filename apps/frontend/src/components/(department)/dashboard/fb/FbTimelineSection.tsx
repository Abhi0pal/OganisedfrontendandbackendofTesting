'use client';

import { useState } from 'react';
import type { FbTimelineRow } from '@/hooks/department/fb/useFbInbox';

const PAGE_SIZE = 10;

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const days  = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0 && hours > 0) return `${days} days ${hours} hrs`;
  if (days > 0)               return `${days} days`;
  if (hours > 0)              return `${hours} hrs`;
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${mins} min` : '< 1 min';
}

const TH: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#374151',
  background: '#f3f4f6',
  borderBottom: '2px solid #e5e7eb',
  whiteSpace: 'nowrap',
};
const TD:   React.CSSProperties = { padding: '9px 12px', fontSize: '0.82rem', color: '#374151', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' };
const TD_C: React.CSSProperties = { ...TD, textAlign: 'center' };

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32, height: 30, padding: '0 8px',
        border: active ? 'none' : '1px solid #d1d5db',
        borderRadius: 6,
        background: active ? '#2563eb' : disabled ? '#f3f4f6' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontWeight: active ? 700 : 400, fontSize: '0.8rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >{label}</button>
  );
}

export default function FbTimelineSection({
  timeline,
  loading,
}: {
  timeline: FbTimelineRow[];
  loading: boolean;
}) {
  const [page, setPage] = useState(1);

  if (loading) return <div style={{ color: '#9ca3af', padding: '1rem' }}>Loading history…</div>;
  if (!timeline.length) return <div style={{ color: '#9ca3af', padding: '1rem' }}>No history records found.</div>;

  const dataRows  = timeline.filter((r) => r.actionType !== 'TOTAL');
  const totalRow  = timeline.find((r) => r.actionType === 'TOTAL');
  const totalPages = Math.max(1, Math.ceil(dataRows.length / PAGE_SIZE));
  const paged     = dataRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'center', width: 48 }}>S.No.</th>
              <th style={TH}>Action Taken By</th>
              <th style={{ ...TH, whiteSpace: 'nowrap' }}>Action Taken On</th>
              <th style={TH}>Action Type</th>
              <th style={TH}>Comments</th>
              <th style={TH}>Forwarded To</th>
              <th style={{ ...TH, textAlign: 'center' }}>Time by Applicant</th>
              <th style={{ ...TH, textAlign: 'center' }}>Time by Nodal Agency</th>
              <th style={{ ...TH, textAlign: 'center' }}>Time by Line Dept</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => (
              <tr
                key={row.sequence}
                style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa')}
              >
                <td style={{ ...TD_C, fontWeight: 600 }}>{row.sequence}</td>
                <td style={{ ...TD, fontWeight: 600, color: '#1e40af' }}>{row.actionTakenBy || '—'}</td>
                <td style={{ ...TD_C, whiteSpace: 'nowrap' }}>
                  {row.actionTakenOn && new Date(row.actionTakenOn).getTime() > 0
                    ? new Date(row.actionTakenOn).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </td>
                <td style={{ ...TD, fontWeight: 500 }}>{row.actionType || '—'}</td>
                <td style={{ ...TD, color: '#6b7280' }}>{row.comments || '—'}</td>
                <td style={TD}>{row.forwardedTo || '—'}</td>
                <td style={TD_C}>{formatDuration(row.timeTakenByApplicantSeconds)}</td>
                <td style={TD_C}>{formatDuration(row.timeTakenByDepartmentSeconds)}</td>
                <td style={TD_C}>{formatDuration(row.timeTakenByLineDepartmentSeconds)}</td>
              </tr>
            ))}

            {/* Total row — always visible, below paged rows */}
            {totalRow && page === totalPages && (
              <tr style={{ background: '#eff6ff' }}>
                <td colSpan={6} style={{ ...TD, textAlign: 'right', fontWeight: 700, color: '#1e40af' }}>
                  Total
                </td>
                <td style={{ ...TD_C, fontWeight: 700, color: '#1e40af' }}>
                  {formatDuration(totalRow.timeTakenByApplicantSeconds)}
                </td>
                <td style={{ ...TD_C, fontWeight: 700, color: '#1e40af' }}>
                  {formatDuration(totalRow.timeTakenByDepartmentSeconds)}
                </td>
                <td style={{ ...TD_C, fontWeight: 700, color: '#1e40af' }}>
                  {formatDuration(totalRow.timeTakenByLineDepartmentSeconds)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — only show when > PAGE_SIZE records */}
      {dataRows.length > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 4px', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, dataRows.length)} of {dataRows.length} records
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <PageBtn label="‹ Prev" disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PageBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(p)} />
            ))}
            <PageBtn label="Next ›" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} />
          </div>
        </div>
      )}
    </div>
  );
}
