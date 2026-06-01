import React from 'react';
import { Handle, Position } from 'reactflow';

const NODE_COLORS: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  START: { border: '#2e7d32', bg: '#e8f5e9', badge: '#2e7d32', badgeText: '#fff' },
  END: { border: '#c62828', bg: '#ffebee', badge: '#c62828', badgeText: '#fff' },
  FORK: { border: '#7b1fa2', bg: '#f3e5f5', badge: '#7b1fa2', badgeText: '#fff' },
  JOIN: { border: '#7b1fa2', bg: '#f3e5f5', badge: '#7b1fa2', badgeText: '#fff' },
  CONDITIONAL: { border: '#ef6c00', bg: '#fff3e0', badge: '#ef6c00', badgeText: '#fff' },
  STANDARD: { border: '#333333', bg: '#ffffff', badge: '#FFE600', badgeText: '#333333' },
};

export default function ProcessNode({ data, isConnectable }: any) {
  const colors = NODE_COLORS[data.nodeType] || NODE_COLORS.STANDARD;

  return (
    <div
      style={{
        minWidth: 220,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        fontFamily: 'inherit',
        position: 'relative',
      }}
    >
      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ width: 12, height: 12, background: colors.border, border: '2px solid #fff' }}
      />

      <div style={{ padding: '10px 14px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#888',
            background: '#f4f5f7',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            #{data.stepOrder}
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            background: colors.badge,
            color: colors.badgeText,
            padding: '2px 10px',
            borderRadius: 12,
            letterSpacing: '0.3px',
          }}>
            {data.nodeType}
          </span>
        </div>

        {/* Name */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.label}>
          {data.label}
        </div>

        {data.description && (
          <div style={{ fontSize: 10, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.description}
          </div>
        )}

        {/* Role + SLA row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 11, color: '#555' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-people-fill" style={{ fontSize: 11 }}></i>
            <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={data.roleName || 'Any Role'}>
              {data.roleName || 'Any Role'}
            </span>
          </div>
          {data.slaHours > 0 && (
            <span style={{ fontWeight: 600, color: '#c77700', fontSize: 11 }}>
              <i className="bi bi-clock me-1"></i>{data.slaHours}h SLA
            </span>
          )}
        </div>

        {/* Actions */}
        {data.actions && data.actions.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {data.actions.map((act: any) => (
              <span
                key={act.actionCode}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  background: '#f4f5f7',
                  border: '1px solid #e0e0e0',
                  padding: '1px 8px',
                  borderRadius: 10,
                  color: '#555',
                  letterSpacing: '0.2px',
                }}
              >
                {act.actionLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Source handles */}
      {data.nodeType !== 'END' && (
        <>
          {data.actions && data.actions.length > 0 ? (
            <div style={{ position: 'absolute', bottom: -6, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }}>
              {data.actions.map((act: any, i: number) => (
                <Handle
                  key={act.actionCode}
                  id={act.actionCode}
                  type="source"
                  position={Position.Bottom}
                  isConnectable={isConnectable}
                  style={{
                    position: 'relative',
                    left: 'auto',
                    transform: 'none',
                    width: 12,
                    height: 12,
                    background: colors.border,
                    border: '2px solid #fff',
                  }}
                />
              ))}
            </div>
          ) : (
            <Handle
              type="source"
              position={Position.Bottom}
              isConnectable={isConnectable}
              style={{ width: 12, height: 12, background: colors.border, border: '2px solid #fff' }}
            />
          )}
        </>
      )}
    </div>
  );
}
