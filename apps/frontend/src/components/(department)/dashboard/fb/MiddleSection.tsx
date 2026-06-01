"use client";

import { useMemo, useState } from 'react';
import { useRouter, Link } from '@/navigation';
import { useFbInbox, useFbTimeline, FbInboxItem } from '@/hooks/department/fb/useFbInbox';
import { useAuth } from '@/hooks/useAuth';
import type { TabConfig } from './roleConfig';
import FbTimelineSection from './FbTimelineSection';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  P:        { bg: '#fef9c3', color: '#a16207' },
  PENDING:  { bg: '#fef9c3', color: '#a16207' },
  A:        { bg: '#dcfce7', color: '#15803d' },
  APPROVED: { bg: '#dcfce7', color: '#15803d' },
  R:        { bg: '#fee2e2', color: '#b91c1c' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
  REJECT:   { bg: '#fee2e2', color: '#b91c1c' },
  F:        { bg: '#dbeafe', color: '#1d4ed8' },
  FORWARDED:{ bg: '#dbeafe', color: '#1d4ed8' },
  FA:       { bg: '#e0e7ff', color: '#4338ca' },
  RBI:      { bg: '#fff7ed', color: '#c2410c' },
  REVERTED: { bg: '#fff7ed', color: '#c2410c' },
};

type MiddleSectionProps = {
  tabs: TabConfig[];
  visibleColumns: string[];
  statusFilter?: string;
  initialTab?: string;
  enabled: boolean;
};

function TimelineModal({ submissionId, onClose }: { submissionId: number; onClose: () => void }) {
  const { data: timeline = [], isLoading } = useFbTimeline(submissionId);
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
            📋 Timeline — Application #{submissionId}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
          >✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '16px 20px' }}>
          <FbTimelineSection timeline={timeline} loading={isLoading} />
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export function MiddleSection({ tabs, statusFilter, initialTab, enabled }: MiddleSectionProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab || (tabs[0]?.key ?? 'pending'));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [timelineId, setTimelineId] = useState<number | null>(null);

  const { data, isLoading } = useFbInbox({
    tab: activeTab,
    page,
    limit: PAGE_SIZE,
    enabled,
  });

  const allItems: FbInboxItem[] = data?.items ?? [];
  const serverTotal: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));

  const items = useMemo(() => {
    let result = allItems;
    if (statusFilter) {
      result = result.filter((item) =>
        String(item.status ?? '').toUpperCase() === statusFilter.toUpperCase()
      );
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((item) =>
        String(item.submissionId).includes(s) ||
        String(item.serviceName || '').toLowerCase().includes(s) ||
        String(item.unitName || '').toLowerCase().includes(s) ||
        String(item.investorName || '').toLowerCase().includes(s) ||
        String(item.department || '').toLowerCase().includes(s)
      );
    }
    return result;
  }, [allItems, statusFilter, search]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearch('');
    setPage(1);
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '11px 20px',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.key ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Search ID, service, unit, applicant..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px 7px 30px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
            ✕ Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280', background: '#e5e7eb', borderRadius: 999, padding: '3px 10px', fontWeight: 500 }}>
          {serverTotal} application{serverTotal !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Timeline Modal */}
      {timelineId && <TimelineModal submissionId={timelineId} onClose={() => setTimelineId(null)} />}

      {/* Table */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              {['App ID', 'Unit / Applicant', 'Service', 'Department', 'Received On', 'Status', 'SLA', 'Action'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((__, j) => (
                    <td key={j} style={{ padding: '10px 14px' }}>
                      <div style={{ height: 16, background: '#f3f4f6', borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                  No applications found.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const sStyle = STATUS_STYLE[String(item.status || '').toUpperCase()] ?? { bg: '#f3f4f6', color: '#374151' };
                const slaBreached = item.slaBreached === true;
                return (
                  <tr
                    key={item.submissionId ?? idx}
                    style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f9ff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafafa')}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb', fontSize: '0.875rem' }}>
                      #{item.submissionId}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.875rem', maxWidth: 180 }}>
                      <div style={{ fontWeight: 500, color: '#111827' }}>{item.unitName || item.investorName || '—'}</div>
                      {item.investorName && item.unitName && (
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 }}>{item.investorName}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: '#374151', maxWidth: 200 }}>{item.serviceName || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: '#374151' }}>{item.department || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                      {item.receivedDate ? new Date(item.receivedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: sStyle.bg, color: sStyle.color, borderRadius: 999, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${sStyle.color}33` }}>
                        {item.statusLabel || item.status || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.8rem' }}>
                      {item.dueAt ? (
                        <span style={{ color: slaBreached ? '#b91c1c' : '#15803d', fontWeight: slaBreached ? 700 : 400 }}>
                          {slaBreached ? '⚠ Breached' : `Due ${new Date(item.dueAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                        </span>
                      ) : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        { item.status !='A' && item.statusLabel !='Approved' && (
                          <Link
                            href={`/department/fb-dashboard/application/${item.submissionId}`}
                            style={{ textDecoration: 'none' }}
                          >
                            <button
                              title="View / Process Application"
                              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              ⚙️ Process
                            </button>
                          </Link>
                        ) }
                        <button
                          title="Print Application"
                          onClick={() => window.open(`/en/department/fb-dashboard/application/${item.submissionId}/print`, '_blank')}
                          style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          🖨️ Print
                        </button>
                        <button
                          title="View Timeline"
                          onClick={() => setTimelineId(item.submissionId)}
                          style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          📋 Timeline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {serverTotal > PAGE_SIZE && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
            Page {page} of {totalPages} &nbsp;·&nbsp; {serverTotal} total record{serverTotal !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              style={{ padding: '4px 10px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', background: page === 1 ? '#f3f4f6' : '#fff', color: page === 1 ? '#9ca3af' : '#374151' }}
            >«</button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '4px 12px', fontSize: '0.82rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', background: page === 1 ? '#f3f4f6' : '#fff', color: page === 1 ? '#9ca3af' : '#374151' }}
            >← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ padding: '4px 10px', fontSize: '0.82rem', border: '1px solid', borderColor: p === page ? '#2563eb' : '#d1d5db', borderRadius: 6, cursor: 'pointer', background: p === page ? '#2563eb' : '#fff', color: p === page ? '#fff' : '#374151', fontWeight: p === page ? 700 : 400, minWidth: 32 }}
                >{p}</button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '4px 12px', fontSize: '0.82rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', background: page === totalPages ? '#f3f4f6' : '#fff', color: page === totalPages ? '#9ca3af' : '#374151' }}
            >Next →</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              style={{ padding: '4px 10px', fontSize: '0.78rem', border: '1px solid #d1d5db', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', background: page === totalPages ? '#f3f4f6' : '#fff', color: page === totalPages ? '#9ca3af' : '#374151' }}
            >»</button>
          </div>
        </div>
      )}
    </div>
  );
}
