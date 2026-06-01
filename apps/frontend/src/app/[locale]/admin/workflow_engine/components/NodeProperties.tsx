'use client';

import React, { useEffect, useState } from 'react';

const ACTION_OPTIONS = [
  { label: 'Forward',           status_code: 'F'   },
  { label: 'Revert',            status_code: 'RB'  },
  { label: 'Revert to Citizen', status_code: 'RBI' },
  { label: 'Payment Request',   status_code: 'PD'  },
  { label: 'Document Pending',  status_code: 'DP'  },
  { label: 'Approve',           status_code: 'A'   },
  { label: 'Reject',            status_code: 'R'   },
];

interface Props {
  node: any;
  roles: any[];
  onUpdate: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export default function NodeProperties({ node, roles, onUpdate, onClose }: Props) {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [slaHours, setSlaHours] = useState(0);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [canVerifyDocs, setCanVerifyDocs] = useState(false);
  const [canEditForm, setCanEditForm] = useState(false);

  useEffect(() => {
    if (!node) return;
    const d = node.data || {};
    setName(d.name || '');
    setRoleId(d.role_id || null);
    setSlaHours(d.sla_hours || 0);
    setSelectedActions((d.actions || []).map((a: any) => a.label));
    setCanVerifyDocs(d.permissions?.can_verify_docs || false);
    setCanEditForm(d.permissions?.can_edit_form || false);
  }, [node?.id]);

  if (!node) return null;

  const isTask = node.type === 'taskNode';
  const roleName = roles.find((r) => r.id === roleId)?.name || '';

  const toggleAction = (label: string) => {
    setSelectedActions((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label],
    );
  };

  const handleApply = () => {
    const actions = ACTION_OPTIONS.filter((a) => selectedActions.includes(a.label));
    onUpdate(node.id, {
      name,
      role_id: roleId,
      role_name: roleName,
      sla_hours: slaHours,
      actions,
      permissions: { can_verify_docs: canVerifyDocs, can_edit_form: canEditForm },
    });
  };

  return (
    <div style={{
      width: 260, background: '#fff', borderLeft: '1px solid #e9ecef',
      padding: 16, overflowY: 'auto', flexShrink: 0,
    }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-bold" style={{ fontSize: 13 }}>
          <i className="bi bi-sliders me-2"></i>Node Properties
        </span>
        <button className="btn btn-sm btn-light" onClick={onClose} style={{ fontSize: 11 }}>✕</button>
      </div>

      <div className="mb-3">
        <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Name</label>
        <input
          className="form-control form-control-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Verifier"
        />
      </div>

      {isTask && (
        <>
          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Role</label>
            <select
              className="form-select form-select-sm"
              value={roleId || ''}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">-- Select Role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>SLA (hours)</label>
            <input
              type="number"
              className="form-control form-control-sm"
              value={slaHours}
              min={0}
              onChange={(e) => setSlaHours(Number(e.target.value))}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Actions</label>
            {ACTION_OPTIONS.map((a) => (
              <div key={a.label} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`act-${a.label}`}
                  checked={selectedActions.includes(a.label)}
                  onChange={() => toggleAction(a.label)}
                />
                <label className="form-check-label" htmlFor={`act-${a.label}`} style={{ fontSize: 12 }}>
                  {a.label}
                  <span className="ms-1 text-muted" style={{ fontSize: 10 }}>({a.status_code})</span>
                </label>
              </div>
            ))}
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Permissions</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="perm-docs"
                checked={canVerifyDocs}
                onChange={(e) => setCanVerifyDocs(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="perm-docs" style={{ fontSize: 12 }}>
                Document Verification
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="perm-edit"
                checked={canEditForm}
                onChange={(e) => setCanEditForm(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="perm-edit" style={{ fontSize: 12 }}>
                Can Edit Form Fields
              </label>
            </div>
          </div>
        </>
      )}

      <button className="btn btn-dark btn-sm w-100 mt-2" onClick={handleApply}>
        Apply Changes
      </button>
    </div>
  );
}
