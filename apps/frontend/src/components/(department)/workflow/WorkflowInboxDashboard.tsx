"use client";

import { useState, useMemo } from "react";
import { useRouter } from "@/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  WorkflowInboxItem,
  useWorkflowInboxData,
} from "@/hooks/department/workflow/useWorkflowInboxData";

type WorkflowInboxDashboardProps = {
  title: string;
  subtitle: string;
  emptyMessage?: string;
};

type TabKey = string;

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

const ROLE_TABS: Record<number, { key: TabKey; label: string }[]> = {
  7: [
    { key: 'pending',             label: 'Pending'           },
    { key: 'forwarded',           label: 'Forwarded'         },
    { key: 'forward_to_approver', label: 'Fwd to Approver'   },
    { key: 'history',             label: 'History'           },
  ],
  3: [
    { key: 'pending',   label: 'Pending'   },
    { key: 'completed', label: 'Completed' },
    { key: 'history',   label: 'History'   },
  ],
  33: [
    { key: 'pending',  label: 'Pending Approvals' },
    { key: 'approved', label: 'Approved'          },
    { key: 'rejected', label: 'Rejected'          },
  ],
};

const DEFAULT_TABS = [
  { key: 'pending',   label: 'Pending'   },
  { key: 'forwarded', label: 'Forwarded' },
  { key: 'approved',  label: 'Approved'  },
  { key: 'rejected',  label: 'Rejected'  },
  { key: 'history',   label: 'History'   },
];

function StatCard({ label, value, accent, onClick }: {
  label: string; value: number | string; accent: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderTop: `4px solid ${accent}`,
        borderRadius: 10,
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        minWidth: 140,
        flex: '1 1 140px',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
    >
      <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32, height: 32, padding: '0 8px',
        border: active ? 'none' : '1px solid #d1d5db',
        borderRadius: 6,
        background: active ? '#2563eb' : disabled ? '#f3f4f6' : '#fff',
        color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
        fontWeight: active ? 700 : 400, fontSize: '0.82rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

export default function WorkflowInboxDashboard({
  title,
  subtitle,
  emptyMessage = "No pending applications.",
}: WorkflowInboxDashboardProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId || 0);
  const router = useRouter();
  const tabs = ROLE_TABS[roleId] ?? DEFAULT_TABS;

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key ?? 'pending');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useWorkflowInboxData({
    tab: activeTab,
    page,
    limit: 10,
  });

  const pendingQ  = useWorkflowInboxData({ tab: 'pending',  page: 1, limit: 1 });
  const approvedQ = useWorkflowInboxData({ tab: 'approved', page: 1, limit: 1 });
  const rejectedQ = useWorkflowInboxData({ tab: 'rejected', page: 1, limit: 1 });
  const getCount  = (q: typeof pendingQ) => Number(q.data?.total ?? q.data?.counts?.pending ?? q.data?.items?.length ?? 0);

  const items = data?.items ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / 10));

  const filtered = useMemo(() => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((item) =>
      String(item.submissionId).includes(s) ||
      String(item.serviceName || '').toLowerCase().includes(s) ||
      String(item.unitName || '').toLowerCase().includes(s) ||
      String(item.investorName || '').toLowerCase().includes(s) ||
      String(item.department || '').toLowerCase().includes(s)
    );
  }, [items, search]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
    setSearch('');
  };

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>{title}</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{subtitle}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '1.5rem' }}>
        <StatCard label="Pending"  value={getCount(pendingQ)}  accent="#f59e0b" onClick={() => handleTabChange('pending')}  />
        <StatCard label="Approved" value={getCount(approvedQ)} accent="#10b981" onClick={() => handleTabChange('approved')} />
        <StatCard label="Rejected" value={getCount(rejectedQ)} accent="#ef4444" onClick={() => handleTabChange('rejected')} />
        <StatCard label="Total (this view)" value={total} accent="#6366f1" />
      </div>

      {/* Card */}
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
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '7px 10px 7px 30px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          {search && (
            <button onClick={() => setSearch('')} style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 12px', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
              ✕ Clear
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#6b7280', background: '#e5e7eb', borderRadius: 999, padding: '3px 10px', fontWeight: 500 }}>
            {total} application{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                {['App ID', 'Unit / Applicant', 'Service', 'Department', 'Received On', 'Step', 'Status', 'SLA', 'Action'].map((h) => (
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
                    {[...Array(9)].map((__, j) => (
                      <td key={j} style={{ padding: '10px 14px' }}>
                        <div style={{ height: 16, background: '#f3f4f6', borderRadius: 4 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((item: WorkflowInboxItem, idx: number) => {
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
                      <td style={{ padding: '10px 14px', fontSize: '0.875rem', color: '#374151', textAlign: 'center' }}>
                        {item.currentStep ?? '—'}
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
                          <button
                            title="Process Application"
                            onClick={() => router.push(`/department/fb-dashboard/application/${item.submissionId}` as any)}
                            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            ⚙️ Process
                          </button>
                          <button
                            title="Print Application"
                            onClick={() => window.open(`/en/department/fb-dashboard/application/${item.submissionId}`, '_blank')}
                            style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            🖨️ Print
                          </button>
                          <button
                            title="View Timeline"
                            onClick={() => router.push(`/department/fb-dashboard/application/${item.submissionId}#history` as any)}
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
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              Page {page} of {totalPages} · {total} total
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <PageBtn label="‹ Prev" disabled={page === 1} onClick={() => setPage((p) => p - 1)} />
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <PageBtn key={p} label={String(p)} active={p === page} onClick={() => setPage(p)} />
              ))}
              <PageBtn label="Next ›" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
