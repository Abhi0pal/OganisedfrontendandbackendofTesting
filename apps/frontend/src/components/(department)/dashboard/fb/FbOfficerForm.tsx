'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, CreditCard, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Dialog } from 'primereact/dialog';
import { CheckCircle, Info, ReceiptText } from 'lucide-react';
import type { OfficerFormData, OfficerFormField } from '@/hooks/department/fb/useFbInbox';

/* ─── Bootstrap-like span map (col-md-X) ──────────────────────────────── */
const BS_SPAN: Record<number, string> = {
  1: 'col-md-1', 2: 'col-md-2', 3: 'col-md-3', 4: 'col-md-4',
  5: 'col-md-5', 6: 'col-md-6', 7: 'col-md-7', 8: 'col-md-8',
  9: 'col-md-9', 10: 'col-md-10', 11: 'col-md-11', 12: 'col-md-12',
};

/* ─── Styles ──────────────────────────────────────────────────────────── */
const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.85rem', fontWeight: 600, color: '#374151',
  marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.875rem', outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  backgroundColor: '#fff',
};

/* ─── Field Input ─────────────────────────────────────────────────────── */
function FieldInput({ fieldCode, inputType, isRequired, isReadonly, placeholder, label }: {
  fieldCode: string; inputType: string; isRequired: boolean;
  isReadonly: boolean; placeholder: string | null; label?: string;
}) {
  const type = (inputType || 'text').toLowerCase();
  const style: React.CSSProperties = {
    ...INPUT_STYLE,
    ...(isReadonly ? { backgroundColor: '#f9fafb', cursor: 'not-allowed', color: '#6b7280' } : {}),
  };
  const common = { name: fieldCode, required: isRequired, readOnly: isReadonly, placeholder: placeholder || '', style };

  if (type === 'textarea') return <textarea {...common} rows={3} />;
  if (type === 'date' || type === 'datetime-local') return <input type={type} {...common} />;
  if (type === 'number') return <input type="number" {...common} />;
  if (type === 'email') return <input type="email" {...common} />;
  if (type === 'tel') return <input type="tel" {...common} />;
  if (type === 'file') return <input type="file" {...common} style={{ ...style, padding: '7px 12px' }} />;
  if (type === 'select') return (
    <select {...common} style={{ ...style, appearance: 'auto' }}>
      <option value="">{placeholder || '-- Select --'}</option>
    </select>
  );
  if (type === 'checkbox') return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: isReadonly ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
      <input type="checkbox" name={fieldCode} disabled={isReadonly} style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: '0.85rem', color: '#374151' }}>{placeholder || label}</span>
    </label>
  );

  return <input type="text" {...common} />;
}

/* ─── Add More Table ──────────────────────────────────────────────────── */
function AddMoreTable({ field }: { field: OfficerFormField }) {
  const groups = field.addMoreGroups || [];
  const [rowsByGroup, setRowsByGroup] = useState<Record<number, number[]>>(() => {
    const init: Record<number, number[]> = {};
    groups.forEach((g: any) => { init[g.id] = Array.from({ length: g.minRows || 1 }, (_, i) => i); });
    return init;
  });

  const addRow = (groupId: number, maxRows?: number) => {
    setRowsByGroup(prev => {
      const rows = prev[groupId] || [];
      if (maxRows && rows.length >= maxRows) return prev;
      return { ...prev, [groupId]: [...rows, (rows[rows.length - 1] ?? -1) + 1] };
    });
  };

  const removeRow = (groupId: number, idx: number, minRows?: number) => {
    setRowsByGroup(prev => {
      const rows = prev[groupId] || [];
      if (minRows && rows.length <= minRows) return prev;
      return { ...prev, [groupId]: rows.filter((_, i) => i !== idx) };
    });
  };

  if (groups.length === 0) return null;

  return (
    <div className="d-flex flex-column gap-3">
      {groups.map((group: any) => {
        const rows = rowsByGroup[group.id] || [0];
        const columns = group.columns || [];
        const minRows = group.minRows || 1;
        const maxRows = group.maxRows;
        const displayLabel = group.label || field.label || 'Details';

        return (
          <div key={`addmore-g-${group.id}`}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <div className="fw-semibold" style={{ fontSize: '0.95rem', color: '#1f2937' }}>{displayLabel}</div>
              <small className="text-muted">
                Rows: {rows.length}{typeof maxRows === 'number' ? ` / ${maxRows}` : ''}
              </small>
            </div>

            <div className="border rounded-3 bg-white overflow-auto" style={{ borderColor: '#e2e8f0' }}>
              <table className="table mb-0 align-middle" style={{ minWidth: Math.max(600, columns.length * 180) }}>
                <thead>
                  <tr>
                    {columns.map((col: any, ci: number) => (
                      <th key={ci} style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569', padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {col.label}
                        {col.isRequired && <span className="text-danger ms-1">*</span>}
                      </th>
                    ))}
                    <th style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', width: 60, textAlign: 'center', fontSize: '0.78rem', color: '#475569', padding: '10px 8px', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="text-center text-muted" style={{ padding: '18px 12px', fontSize: '0.85rem' }}>No rows added.</td>
                    </tr>
                  ) : rows.map((rowKey, rIdx) => (
                    <tr key={`row-${group.id}-${rowKey}`}>
                      {columns.map((col: any, ci: number) => (
                        <td key={ci} style={{ padding: '8px 10px', verticalAlign: 'top', borderTop: '1px solid #f1f5f9' }}>
                          <FieldInput
                            fieldCode={`${field.fieldCode}_g${group.id}_r${rIdx}_${col.fieldCode || `c${ci}`}`}
                            inputType={col.inputType || 'text'}
                            isRequired={col.isRequired || false}
                            isReadonly={col.isReadonly || false}
                            placeholder={col.placeholder || ''}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center', padding: '8px 6px', verticalAlign: 'middle', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => removeRow(group.id, rIdx, minRows)}
                          disabled={rows.length <= minRows}
                          style={{
                            background: 'none', border: 'none', padding: 4, cursor: rows.length <= minRows ? 'not-allowed' : 'pointer',
                            color: rows.length <= minRows ? '#d1d5db' : '#ef4444',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap mt-2">
              <button
                type="button"
                onClick={() => addRow(group.id, maxRows)}
                disabled={typeof maxRows === 'number' && rows.length >= maxRows}
                className="border bg-white rounded-2 px-3 py-2 fw-medium"
                style={{
                  borderColor: '#e2e8f0', color: '#2563eb', fontSize: '0.8rem',
                  cursor: (typeof maxRows === 'number' && rows.length >= maxRows) ? 'not-allowed' : 'pointer',
                  opacity: (typeof maxRows === 'number' && rows.length >= maxRows) ? 0.5 : 1,
                }}
              >
                <Plus size={14} className="me-1" /> Add {displayLabel}
              </button>
              <small className="text-muted">({rows.length}/{maxRows ?? '∞'} rows)</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Action code helper ──────────────────────────────────────────────── */
function getActionCode(label: string) {
  const l = label.toLowerCase();
  if (l.includes('forward')) return 'FORWARD';
  if (/\bapprove\b/.test(l)) return 'APPROVE';
  if (l.includes('reject')) return 'REJECT';
  if (l.includes('revert') || l.includes('query')) return 'REVERT';
  if (l.includes('challan') || l.includes('demand') || l.includes('appointment')) return 'CHALLAN';
  if (l.includes('close') || l.includes('complete')) return 'CLOSED';
  return label.toUpperCase().replace(/\s+/g, '_');
}

function btnStyle(label: string, disabled: boolean): React.CSSProperties {
  const code = getActionCode(label);
  let bg = '#6b7280';
  if (code === 'APPROVE') bg = '#15803d';
  if (code === 'REJECT') bg = '#b91c1c';
  if (code === 'FORWARD') bg = '#2563eb';
  if (code === 'REVERT') bg = '#d97706';
  if (code === 'CHALLAN') bg = '#7c3aed';
  if (code === 'CLOSED') bg = '#0f172a';

  return {
    backgroundColor: bg, color: '#fff', border: 'none',
    padding: '10px 24px', borderRadius: 8, fontWeight: 700,
    fontSize: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    transition: 'opacity 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function FbOfficerForm({
  data, submissionId, applicationStatus, onSuccess,
}: {
  data: OfficerFormData; submissionId: number;
  applicationStatus?: string; onSuccess?: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [doneAction, setDoneAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Payment */
  const [bifurcations, setBifurcations] = useState([{ name: '', amount: 0 }]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isFetchingEstimate, setIsFetchingEstimate] = useState(false);
  const totalAmount = bifurcations.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const paymentDemandAllowed = data.allowPaymentDemand;
  const isPaid = data.paymentDetails?.statusCode === 'S' || data.paymentDetails?.txnStatus === 'SUCCESS';

  useEffect(() => {
    if (paymentDemandAllowed && !isPaid) {
      setIsFetchingEstimate(true);
      apiClient.post('/fb-dashboard/challan-estimate', { submissionId })
        .then(res => {
          if (res.data?.bifurcations && res.data.bifurcations.length > 0 && res.data.bifurcations[0].name) {
            setBifurcations(res.data.bifurcations);
          }
        })
        .catch(err => console.error('Failed to fetch challan estimate', err))
        .finally(() => setIsFetchingEstimate(false));
    }
  }, [paymentDemandAllowed, isPaid, submissionId]);

  /* ── Build ordered field list ────────────────────────────────────────
     Mimic FormPreview: categories in order → fields sorted by
     preference within each category. No category headers shown.        */
  const { orderedFields, actionButtons } = useMemo(() => {
    const fields: OfficerFormField[] = [];
    const buttons: OfficerFormField[] = [];

    // Categories come from backend already in insertion order (lowest preference first)
    for (const cat of data.categories) {
      const sorted = [...cat.fields].sort(
        (a, b) => (a.preference ?? 0) - (b.preference ?? 0)
      );
      for (const f of sorted) {
        if (f.inputType === 'button') {
          // If already paid, don't show the CHALLAN button again
          if (isPaid && getActionCode(f.label) === 'CHALLAN') continue;
          buttons.push(f);
        } else {
          fields.push(f);
        }
      }
    }
    return { orderedFields: fields, actionButtons: buttons };
  }, [data.categories, isPaid]);

  const isPaymentPending = applicationStatus === 'PD';

  /* ── Actions ─────────────────────────────────────────────────────── */
  const handleAction = useCallback(async (label: string) => {
    if (!formRef.current) return;
    const actionCode = getActionCode(label);
    setSubmitting(actionCode);
    setError(null);

    try {
      const fd = new FormData(formRef.current);
      const values: Record<string, any> = {};
      fd.forEach((v, k) => { values[k] = v; });

      const payload: any = {
        submissionId,
        action: actionCode,
        comment: values['officer_comment'] || values['comment'] || '',
        applicationData: values,
      };
      if (paymentDemandAllowed && actionCode === 'CHALLAN') {
        payload.applicationData._paymentDemand = {
          totalAmount,
          bifurcations: bifurcations.filter(b => b.name && b.amount > 0),
        };
      }

      const res = await apiClient.post('/fb-dashboard/submit-action', payload);
      if (res.data.success) {
        setDoneAction(actionCode);
        setTimeout(() => { onSuccess ? onSuccess() : router.refresh(); }, 1500);
      } else {
        setError(res.data.message || 'Action failed');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Error performing action');
    } finally {
      setSubmitting(null);
    }
  }, [submissionId, paymentDemandAllowed, totalAmount, bifurcations, onSuccess, router]);

  /* ── Render a single field ───────────────────────────────────────── */
  const renderField = (f: OfficerFormField) => {
    const type = (f.inputType || '').toLowerCase();

    /* Layout-only types (headings, dividers, notes) */
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(type)) {
      const sizes: Record<string, string> = { h1: '1.6rem', h2: '1.35rem', h3: '1.15rem', h4: '1rem', h5: '0.9rem', h6: '0.85rem' };
      return (
        <div className="col-12" key={f.fieldCode}>
          <div style={{ fontSize: sizes[type], fontWeight: 700, color: '#1e293b', margin: '0.75rem 0 0.25rem', borderBottom: type === 'h1' ? '2px solid #e5e7eb' : undefined, paddingBottom: type === 'h1' ? 8 : undefined }}>{f.label}</div>
        </div>
      );
    }
    if (type === 'divider') return <div className="col-12" key={f.fieldCode}><hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '1rem 0' }} /></div>;
    if (type === 'note' || type === 'info') return (
      <div className="col-12" key={f.fieldCode}>
        <div className="d-flex gap-2 align-items-start p-3 rounded-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '0.85rem', color: '#0c4a6e' }}>
          <HelpCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Note:</strong> {f.label}</span>
        </div>
      </div>
    );
    if (type === 'alert' || type === 'warning') return (
      <div className="col-12" key={f.fieldCode}>
        <div className="d-flex gap-2 align-items-start p-3 rounded-3" style={{ background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.85rem', color: '#92400e' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>Alert:</strong> {f.label}</span>
        </div>
      </div>
    );

    /* AddMore — full width table */
    if (type === 'addmore') {
      return (
        <div className="col-12" key={f.fieldCode}>
          <AddMoreTable field={f} />
        </div>
      );
    }

    /* Standard input field — use Bootstrap col-md-{gridSpan} */
    const span = f.gridSpan || 12;
    const colClass = `col-12 ${BS_SPAN[span] || 'col-md-12'}`;

    return (
      <div className={colClass} key={f.fieldCode}>
        <div className="d-flex flex-column h-100">
          {type !== 'checkbox' && (
            <label style={LABEL_STYLE}>
              {f.label}
              {f.isRequired && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
              {f.helpText && (
                <span title={f.helpText} style={{ cursor: 'help', color: '#9ca3af', display: 'inline-flex' }}>
                  <HelpCircle size={14} />
                </span>
              )}
            </label>
          )}
          <FieldInput
            fieldCode={f.fieldCode}
            inputType={f.inputType}
            isRequired={f.isRequired}
            isReadonly={f.isReadonly}
            placeholder={f.placeholder}
            label={f.label}
          />
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════ */
  /*  JSX                                                               */
  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <form ref={formRef} onSubmit={e => e.preventDefault()}>
      {/* Error banner */}
      {error && (
        <div className="d-flex align-items-center gap-2 p-3 mb-3 rounded-3" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Payment Successful Banner */}
      {isPaid && data.paymentDetails && (
        <div className="bg-white border rounded-3 p-4 mb-4 shadow-sm" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 8, color: '#16a34a', display: 'flex' }}>
                <CheckCircle size={22} />
              </div>
              <div>
                <h3 className="m-0 fw-bold" style={{ fontSize: '0.95rem', color: '#111827' }}>Challan Payment Successful</h3>
                <p className="m-0 text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                  A payment of <strong>₹ {data.paymentDetails.amount.toLocaleString()}</strong> has been verified.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="d-flex align-items-center gap-2 border bg-white rounded-2 px-3 py-2 fw-semibold"
              style={{ borderColor: '#e2e8f0', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <ReceiptText size={16} /> View Details
            </button>
          </div>
        </div>
      )}

      {/* Payment Demand */}
      {paymentDemandAllowed && !isPaid && !doneAction && (
        <div className="bg-white border rounded-3 p-4 mb-4 shadow-sm">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
              <div style={{ background: '#eff6ff', padding: 10, borderRadius: 8, color: '#2563eb', display: 'flex' }}>
                <CreditCard size={20} />
              </div>
              <h3 className="m-0 fw-bold" style={{ fontSize: '1rem', color: '#111827' }}>Challan / Demand Generation</h3>
            </div>
            {isFetchingEstimate && (
              <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
            )}
            <button
              type="button"
              className="btn btn-sm bg-white"
              onClick={() => {
                if (!formRef.current) return;
                const fd = new FormData(formRef.current);
                const values: Record<string, any> = {};
                fd.forEach((v, k) => { values[k] = v; });
                setIsFetchingEstimate(true);
                apiClient.post('/fb-dashboard/challan-estimate', { submissionId, applicationData: values })
                  .then(res => {
                    if (res.data?.bifurcations && res.data.bifurcations.length > 0) {
                      setBifurcations(res.data.bifurcations);
                    }
                  })
                  .catch(err => console.error('Failed to recalculate', err))
                  .finally(() => setIsFetchingEstimate(false));
              }}
              disabled={isFetchingEstimate}
              style={{ border: '1px solid #7f1d1d', color: '#7f1d1d', fontWeight: 600, padding: '6px 16px', borderRadius: 6 }}
            >
              Recalculate Fees
            </button>
          </div>
          <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', fontSize: '0.75rem', color: '#64748b', paddingBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>Fee Component</th>
                  <th style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', paddingBottom: 10, width: 160, textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 700 }}>Amount (₹)</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {bifurcations.map((b, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '5px 0' }}>
                      <input type="text" placeholder="e.g. Processing Fee" value={b.name}
                        onChange={e => { const n = [...bifurcations]; n[idx].name = e.target.value; setBifurcations(n); }}
                        style={{ ...INPUT_STYLE, padding: '10px 14px' }} />
                    </td>
                    <td style={{ padding: '5px 0 5px 12px' }}>
                      <input type="number" placeholder="0.00" value={b.amount || ''}
                        onChange={e => { const n = [...bifurcations]; n[idx].amount = Number(e.target.value); setBifurcations(n); }}
                        style={{ ...INPUT_STYLE, padding: '10px 14px', textAlign: 'center', fontWeight: 500 }} />
                    </td>
                    <td style={{ textAlign: 'right', paddingLeft: 8 }}>
                      {bifurcations.length > 1 && (
                        <button type="button" onClick={() => setBifurcations(bifurcations.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3" style={{ borderTop: '1px dashed #e2e8f0' }}>
              <button type="button" onClick={() => setBifurcations([...bifurcations, { name: '', amount: 0 }])}
                className="border bg-white rounded-2 px-3 py-2 fw-semibold"
                style={{ borderColor: '#e2e8f0', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer' }}>
                <Plus size={14} className="me-1" /> Add Component
              </button>
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>TOTAL:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>₹ {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Form Fields ──────────────────────────────────────────── */}
      <div className="bg-white border rounded-3 shadow-sm" style={{
        borderRadius: actionButtons.length ? '10px 10px 0 0' : 10,
        marginBottom: actionButtons.length ? 0 : '1.5rem',
      }}>
        <div className="p-4">
          <div className="row g-3">
            {orderedFields.map(f => renderField(f))}
          </div>
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────── */}
      {/* Payment Pending Warning */}
      {isPaymentPending && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4 py-3" style={{ borderRadius: 12, border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
          <AlertTriangle size={20} className="text-warning" />
          <div>
            <div className="fw-bold text-warning-emphasis" style={{ fontSize: '0.9rem' }}>Payment Demand Pending</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>This application is waiting for payment from the applicant. Action buttons are disabled until payment is successful.</div>
          </div>
        </div>
      )}

      {actionButtons.length > 0 && (
        <div className="d-flex flex-wrap gap-2 align-items-center p-4" style={{
          background: '#f8fafc', border: '1px solid #e5e7eb', borderTop: 'none',
          borderRadius: '0 0 10px 10px', marginBottom: '1.5rem',
        }}>
          {actionButtons.map((f, i) => (
            <button
              key={f.fieldCode || i}
              type="button"
              onClick={() => handleAction(f.label)}
              disabled={!!submitting || !!doneAction || isPaymentPending}
              style={btnStyle(f.label, !!submitting || !!doneAction || isPaymentPending)}
            >
              {submitting === getActionCode(f.label) ? '…' : f.label}
            </button>
          ))}
          {doneAction && (
            <div className="ms-auto d-flex align-items-center gap-2 px-3 py-2 rounded-3 fw-bold"
              style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.85rem' }}>
              ✓ Action completed
            </div>
          )}
        </div>
      )}

      {/* Payment Details Modal */}
      <Dialog
        header={
          <div className="d-flex align-items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            <span className="fw-bold">Payment Receipt Details</span>
          </div>
        }
        visible={showPaymentModal}
        style={{ width: '450px' }}
        onHide={() => setShowPaymentModal(false)}
        draggable={false}
        resizable={false}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      >
        {data.paymentDetails && (
          <div className="py-2">
            <div className="p-3 rounded-3 mb-4 text-center" style={{ background: '#f0fdf4', border: '1px dashed #16a34a' }}>
              <div className="text-success fw-bold mb-1" style={{ fontSize: '1.25rem' }}>₹ {data.paymentDetails.amount.toLocaleString()}</div>
              <div className="text-success small fw-semibold">Payment Confirmed</div>
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Payment ID</span>
                <span className="fw-semibold small">#{data.paymentDetails.paymentId}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Date & Time</span>
                <span className="fw-semibold small">
                  {new Date(data.paymentDetails.created).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="text-muted small">Status</span>
                <span className="badge bg-success">Success</span>
              </div>
            </div>

            {data.paymentDetails.bifurcationDetails && data.paymentDetails.bifurcationDetails.length > 0 && (
              <div>
                <div className="fw-bold mb-2" style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Breakdown</div>
                <div className="bg-light p-3 rounded-3">
                  {data.paymentDetails.bifurcationDetails.map((b, i) => (
                    <div key={i} className="d-flex justify-content-between mb-2">
                      <span className="small">{b.name}</span>
                      <span className="small fw-bold">₹ {Number(b.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                    <span className="small fw-bold">Total</span>
                    <span className="small fw-bold">₹ {data.paymentDetails.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-100 btn btn-primary py-2 fw-bold"
                style={{ borderRadius: 8 }}
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </form>
  );
}