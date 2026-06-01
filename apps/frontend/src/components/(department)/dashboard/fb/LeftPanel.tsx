"use client";

import Link from 'next/link';
import type { RoleDashboardConfig, StatConfig } from './roleConfig';

type LeftPanelProps = {
  config: RoleDashboardConfig;
  userName?: string;
  statCounts: Record<string, number>;
  statLoading: boolean;
  activeStatKey: string;
  onSelectStat: (key: string) => void;
};

const STAT_COLORS: Record<string, { border: string; bg: string; activeBg: string }> = {
  P:   { border: '#FAD8D6', bg: '#FEF3F2', activeBg: '#FEE2E2' },
  F:   { border: '#D1FAE5', bg: '#ECFDF3', activeBg: '#A7F3D0' },
  FA:  { border: '#E0E7FF', bg: '#EEF2FF', activeBg: '#C7D2FE' },
  A:   { border: '#C7D2FE', bg: '#EEF2FF', activeBg: '#A5B4FC' },
  R:   { border: '#FDE68A', bg: '#FFFBEB', activeBg: '#FCD34D' },
  RBI: { border: '#FDD5D5', bg: '#FEF2F2', activeBg: '#FCA5A5' },
};

function getStatColors(key: string) {
  return STAT_COLORS[key] ?? { border: '#C4D7E3', bg: '#EEF8FE', activeBg: '#BAE6FD' };
}

function StatCard({ stat, count, loading, active, onClick }: {
  stat: StatConfig;
  count: number;
  loading: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const colors = getStatColors(stat.key);
  return (
    <div
      role="button"
      onClick={onClick}
      style={{
        borderRadius: '1rem',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: active ? stat.color : colors.border,
        backgroundColor: active ? colors.activeBg : colors.bg,
        padding: '1rem 1.25rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: active ? '0 4px 12px rgba(0,0,0,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <p className="text-sm font-medium text-gray-700 mb-1">{stat.label}</p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-semibold text-gray-900">
          {loading ? <span className="text-base text-gray-400">…</span> : count}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ border: `2px solid ${colors.border}` }}
        >
          <i className="bi bi-arrow-up-right text-sm text-gray-500"></i>
        </span>
      </div>
    </div>
  );
}

export function LeftPanel({
  config,
  userName,
  statCounts,
  statLoading,
  activeStatKey,
  onSelectStat,
}: LeftPanelProps) {
  return (
    <div style={{ width: 220, flexShrink: 0 }} className="d-flex flex-column gap-3">

      {/* Profile card */}
      <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '1rem' }}>
        <div className="d-flex align-items-center gap-2 mb-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary text-white"
            style={{ width: 40, height: 40, fontSize: '1rem', flexShrink: 0 }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="fw-semibold text-gray-900 small text-truncate">{userName || 'Officer'}</div>
            <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.7rem' }}>
              {config.roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div>
        <p className="text-muted small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.06em', fontSize: '0.7rem' }}>
          Summary
        </p>
        <div className="d-flex flex-column gap-2">
          {config.leftStats.map((stat) => (
            <StatCard
              key={stat.key}
              stat={stat}
              count={statCounts[stat.key] ?? 0}
              loading={statLoading}
              active={activeStatKey === stat.key}
              onClick={() => onSelectStat(activeStatKey === stat.key ? '' : stat.key)}
            />
          ))}
        </div>
      </div>

      {/* Quick links */}
      {config.quickLinks.length > 0 && (
        <div>
          <p className="text-muted small fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.06em', fontSize: '0.7rem' }}>
            Quick Access
          </p>
          <div className="d-flex flex-column gap-1">
            {config.quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="btn btn-sm btn-outline-secondary text-start d-flex align-items-center gap-2"
                style={{ borderRadius: '0.5rem' }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
