import React from 'react';
import { Handle, Position } from 'reactflow';

const STYLES: Record<string, { border: string; bg: string; badge: string; icon: string }> = {
  startNode:   { border: '#2e7d32', bg: '#e8f5e9', badge: '#2e7d32', icon: 'bi-play-circle-fill' },
  taskNode:    { border: '#1565c0', bg: '#e3f2fd', badge: '#1565c0', icon: 'bi-person-fill' },
  gatewayNode: { border: '#e65100', bg: '#fff3e0', badge: '#e65100', icon: 'bi-diamond-fill' },
  endNode:     { border: '#c62828', bg: '#ffebee', badge: '#c62828', icon: 'bi-stop-circle-fill' },
};

const TYPE_LABEL: Record<string, string> = {
  startNode: 'START', taskNode: 'TASK', gatewayNode: 'GATEWAY', endNode: 'END',
};

export default function WfeNode({ data, type, isConnectable, selected }: any) {
  const s = STYLES[type] || STYLES.taskNode;

  return (
    <div
      style={{
        minWidth: 200,
        background: s.bg,
        border: `2px solid ${selected ? '#FFE600' : s.border}`,
        borderRadius: type === 'gatewayNode' ? 0 : 10,
        transform: type === 'gatewayNode' ? 'rotate(45deg)' : undefined,
        boxShadow: selected ? `0 0 0 3px #FFE600` : '0 2px 10px rgba(0,0,0,0.1)',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ width: 10, height: 10, background: s.border, border: '2px solid #fff',
          transform: type === 'gatewayNode' ? 'rotate(-45deg)' : undefined }}
      />

      <div style={{
        padding: '10px 14px',
        transform: type === 'gatewayNode' ? 'rotate(-45deg)' : undefined,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <i className={`bi ${s.icon}`} style={{ color: s.badge, fontSize: 14 }}></i>
          <span style={{
            fontSize: 9, fontWeight: 700, background: s.badge, color: '#fff',
            padding: '1px 8px', borderRadius: 10,
          }}>
            {TYPE_LABEL[type] || type}
          </span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 4 }}>
          {data.name || 'Unnamed'}
        </div>

        {data.role_name && (
          <div style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-people-fill" style={{ fontSize: 10 }}></i>
            {data.role_name}
          </div>
        )}

        {data.actions && data.actions.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {data.actions.map((a: any) => (
              <span key={a.label} style={{
                fontSize: 9, fontWeight: 600, background: '#fff', border: `1px solid ${s.border}`,
                color: s.border, padding: '1px 7px', borderRadius: 10,
              }}>
                {a.label}
              </span>
            ))}
          </div>
        )}

        {data.sla_hours > 0 && (
          <div style={{ marginTop: 6, fontSize: 10, color: '#c77700' }}>
            <i className="bi bi-clock me-1"></i>{data.sla_hours}h SLA
          </div>
        )}
      </div>

      {type !== 'endNode' && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          style={{ width: 10, height: 10, background: s.border, border: '2px solid #fff',
            transform: type === 'gatewayNode' ? 'rotate(-45deg)' : undefined }}
        />
      )}
    </div>
  );
}
