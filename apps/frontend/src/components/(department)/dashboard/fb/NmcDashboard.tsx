"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFbCounts } from '@/hooks/department/fb/useFbInbox';
import { getRoleConfig } from './roleConfig';
import { MiddleSection } from './MiddleSection';

/* ── Icon SVGs ────────────────────────────────────────────────────────── */
const ICONS: Record<string, React.ReactNode> = {
  pending: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7h8M8 11h6M8 15h4" />
    </svg>
  ),
  forwarded: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7h8M8 11h6" /><path d="M14 15l3-2-3-2" />
    </svg>
  ),
  reverted: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v10l4 2" /><circle cx="12" cy="12" r="10" />
    </svg>
  ),
  rejected: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v-6M14 15v-6" /><rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  approved: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
    </svg>
  ),
  history: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h4" />
    </svg>
  ),
};

/* ── Card component ───────────────────────────────────────────────────── */
function DashCard({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number | string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: '1 1 200px',
        background: '#fff',
        borderRadius: '8px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        border: active ? '2px solid #b91c1c' : '1px solid transparent',
        boxShadow: active 
          ? '0 4px 12px rgba(185, 28, 28, 0.15)' 
          : '0 2px 8px rgba(0,0,0,0.08)',
        borderBottom: '5px solid #8b0000',
        transition: 'all 0.2s ease',
        minHeight: '100px',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          e.currentTarget.style.transform = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ color: '#8b0000' }}>
          {icon}
        </div>
        <div style={{ 
          fontSize: '15px', 
          fontWeight: 500, 
          color: '#1f2937', 
          lineHeight: 1.2,
          whiteSpace: 'pre-line' 
        }}>
          {label}
        </div>
      </div>
      <div style={{
        fontSize: '36px',
        fontWeight: 600,
        color: '#f59e0b',
        lineHeight: 1,
      }}>
        {count}
      </div>
    </div>
  );
}

/* ── Main NMC Dashboard ───────────────────────────────────────────────── */
export default function NmcDashboard() {
  const { user, loading: authLoading } = useAuth();
  const roleId = Number(user?.roleId || 0);
  const config = getRoleConfig(roleId);

  const { data: countsData, isLoading: countsLoading } = useFbCounts(!authLoading && roleId > 0);
  const byTab: Record<string, number> = countsData?.byTab ?? {};

  const pending   = byTab['pending']   ?? 0;
  const forwarded = byTab['forwarded'] ?? 0;
  const reverted  = byTab['reverted']  ?? 0;
  const rejected  = byTab['rejected']  ?? 0;
  const approved  = byTab['approved']  ?? 0;
  const history   = byTab['history']   ?? 0;

  const [activeTab, setActiveTab] = useState<string | null>(null);

  const cards = [
    { key: 'pending',   label: 'Pending\nAction',       count: pending,   icon: ICONS.pending   },
    { key: 'forwarded', label: 'Forwarded',              count: forwarded, icon: ICONS.forwarded },
    { key: 'reverted',  label: 'Sent Back by\nDO',      count: reverted,  icon: ICONS.reverted  },
    { key: 'rejected',  label: 'Rejected',               count: rejected,  icon: ICONS.rejected  },
    { key: 'approved',  label: 'Approved',               count: approved,  icon: ICONS.approved  },
    { key: 'history',   label: 'Certificates\nIssued',  count: approved,   icon: ICONS.history   },
  ];

  if (authLoading && !roleId) {
    return (
      <div
        onClick={() => typeof window !== 'undefined' && window.location.reload()}
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#6b7280',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '40vh',
        }}
        title="Click to retry"
      >
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e5e7eb',
          borderTopColor: '#b91c1c',
          borderRadius: '50%',
          marginBottom: 16,
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#374151' }}>Loading dashboard…</div>
        <div style={{ fontSize: '0.85rem', marginTop: 8, color: '#9ca3af' }}>If this takes too long, click here to refresh</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
          Welcome to {user?.roleName || config.roleLabel} Dashboard
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          {user?.roleName || config.roleLabel} — manage marriage registration applications.
        </p>
      </div>

      {/* Stat Cards — 3x2 grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
        marginBottom: '1.5rem',
      }}>
        {cards.map((card) => (
          <DashCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            count={countsLoading ? '…' : card.count}
            active={activeTab === card.key}
            onClick={() => setActiveTab(activeTab === card.key ? null : card.key)}
          />
        ))}
      </div>

      {/* Table — shown when a card is clicked */}
      {activeTab && (
        <MiddleSection
          tabs={config.tabs}
          visibleColumns={config.tableColumns}
          enabled={!authLoading && roleId > 0}
          initialTab={activeTab}
          statusFilter={undefined}
          key={activeTab}
        />
      )}
    </div>
  );
}
