"use client";

import { useAuth } from '@/hooks/useAuth';
import { useFbCounts } from '@/hooks/department/fb/useFbInbox';
import { getRoleConfig } from './roleConfig';
import { MiddleSection } from './MiddleSection';
import NmcDashboard from './NmcDashboard';

function StatCard({ label, value, accent, onClick }: {
  label: string; value: number | string; accent: string; onClick?: () => void;
}) {
  return (
    <div
      className={`stat-card ${accent}`}
      onClick={onClick}
      style={{
        background: accent,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.01)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
    >
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

export default function FormBuilderDashboard() {
  const { user, loading: authLoading } = useAuth();
  const roleId = Number(user?.roleId || 0);
  const config = getRoleConfig(roleId);

  const { data: countsData, isLoading: countsLoading } = useFbCounts(!authLoading && roleId > 0);
  const byTab: Record<string, number> = countsData?.byTab ?? {};
  const total = countsData?.total ?? 0;

  const pending   = byTab['pending']   ?? 0;
  const forwarded = byTab['forwarded'] ?? 0;
  const approved  = byTab['approved']  ?? 0;
  const rejected  = byTab['rejected']  ?? 0;
  const reverted  = byTab['reverted']  ?? 0;

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
          minHeight: '40vh'
        }}
        title="Click to retry"
      >
        <div style={{ 
          width: 40, 
          height: 40, 
          border: '3px solid #e5e7eb', 
          borderTopColor: '#2563eb', 
          borderRadius: '50%', 
          marginBottom: 16,
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#374151' }}>Loading dashboard…</div>
        <div style={{ fontSize: '0.85rem', marginTop: 8, color: '#9ca3af' }}>If this takes too long, click here to refresh</div>
      </div>
    );
  }



  if (!roleId) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ background: '#fef3c7', border: '5px solid #fcd34d', borderRadius: 8, padding: '14px 18px', color: '#92400e' }}>
          Dashboard is not configured for this role.
        </div>
      </div>
    );
  }

  // NMC roles: 260 (Marriage Registrar), 261 (Divisional Verifier)
  if (roleId === 260 || roleId === 261) {
    return <NmcDashboard />;
  }

  return (
    <div style={{ padding: '1.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
          Welcome to {user?.roleName || config.roleLabel} Dashboard Panel
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          {user?.roleName || config.roleLabel} — manage your pending service applications.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: '1.5rem' }}>
        <StatCard label="Pending"   value={countsLoading ? '…' : pending}   accent="pending" />
        <StatCard label="Forwarded" value={countsLoading ? '…' : forwarded} accent="forwarded" />
        <StatCard label="Approved"  value={countsLoading ? '…' : approved}  accent="approved" />
        <StatCard label="Rejected"  value={countsLoading ? '…' : rejected}  accent="rejected" />
        <StatCard label="Reverted"  value={countsLoading ? '…' : reverted}  accent="reverted" />
      </div>

      {/* Table */}
      <MiddleSection
        tabs={config.tabs}
        visibleColumns={config.tableColumns}
        enabled={!authLoading && roleId > 0}
      />

    </div>
  );
}
