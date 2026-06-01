'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { DocVerificationData, DocVerificationItem } from '@/hooks/department/fb/useFbInbox';

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  U: { bg: '#fef9c3', color: '#a16207', label: 'Un-Verified' },
  V: { bg: '#dcfce7', color: '#15803d', label: 'Verified' },
  R: { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
  M: { bg: '#fee2e2', color: '#b91c1c', label: 'Mismatch' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.U;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: '0.75rem',
        fontWeight: 700,
        border: `1px solid ${s.color}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

function DocRow({
  doc,
  idx,
  canVerify,
  onUpdated,
}: {
  doc: DocVerificationItem;
  idx: number;
  canVerify: boolean;
  onUpdated: () => void;
}) {
  const [comment, setComment] = useState(doc.comments || '');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const commentError = touched && !comment.trim();

  const handleSubmit = async (status: 'V' | 'R') => {
    if (status === 'R' && !comment.trim()) {
      setTouched(true);
      return;
    }

    const payloadComment = status === 'V' && !comment.trim() ? 'Verified' : comment;

    setSaving(true);
    try {
      await apiClient.post('/fb-dashboard/verify-document', {
        mappingId: doc.mappingId,
        status,
        comments: payloadComment,
      });
      if (status === 'V' && !comment.trim()) setComment('Verified');
      setTouched(false);
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const TD: React.CSSProperties = {
    padding: '9px 12px',
    fontSize: '0.8rem',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  };

  return (
    <tr style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
      <td style={{ ...TD, textAlign: 'center', fontWeight: 600, width: 48 }}>{idx + 1}</td>

      <td style={{ ...TD, fontWeight: 600, color: '#111827' }}>{doc.documentName}</td>

      <td style={{ ...TD }}>
        {doc.fileUrl ? (
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${doc.fileUrl}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}
          >
            View
          </a>
        ) : (
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>-</span>
        )}
      </td>

      <td style={{ ...TD, textAlign: 'center' }}>
        <StatusBadge status={doc.status} />
      </td>

      {canVerify && doc.mappingId === 0 && (
        <td colSpan={2} style={{ ...TD, color: '#6b7280', fontStyle: 'italic', textAlign: 'center' }}>
          Form Attachment (Read-only)
        </td>
      )}

      {canVerify && doc.mappingId !== 0 && (
        <>
          <td style={{ ...TD }}>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setTouched(true);
              }}
              placeholder="Add comment (required for reject)..."
              rows={2}
              style={{
                width: '100%',
                borderRadius: 5,
                border: `1px solid ${commentError ? '#ef4444' : '#d1d5db'}`,
                padding: '4px 8px',
                fontSize: '0.78rem',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {commentError && <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>Comment is required for Reject</span>}
          </td>

          <td style={{ ...TD }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                onClick={() => handleSubmit('V')}
                disabled={saving}
                style={{
                  background: saving ? '#e5e7eb' : '#16a34a',
                  color: saving ? '#9ca3af' : '#fff',
                  border: 'none',
                  borderRadius: 5,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {saving ? '...' : 'Verify'}
              </button>
              <button
                onClick={() => handleSubmit('R')}
                disabled={saving}
                style={{
                  background: saving ? '#e5e7eb' : '#dc2626',
                  color: saving ? '#9ca3af' : '#fff',
                  border: 'none',
                  borderRadius: 5,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {saving ? '...' : 'Reject'}
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
}

export default function FbDocumentVerification({
  data,
  loading,
  submissionId,
}: {
  data: DocVerificationData | undefined;
  loading: boolean;
  submissionId: number;
}) {
  const queryClient = useQueryClient();
  const refetch = () => queryClient.invalidateQueries({ queryKey: ['doc-verification', submissionId] });

  if (loading) {
    return <div style={{ color: '#9ca3af', padding: '1rem', fontSize: '0.875rem' }}>Loading documents...</div>;
  }
  if (!data || !data.documents.length) {
    return <div style={{ color: '#9ca3af', padding: '1rem', fontSize: '0.875rem' }}>No documents uploaded for this application.</div>;
  }

  const canVerify = data.enabled;
  const verified = data.documents.filter((d) => d.status === 'V').length;
  const total = data.documents.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['U', 'V', 'R'] as const).map((s) => {
          const cnt = data.documents.filter((d) => d.status === s).length;
          const st = STATUS_STYLE[s];
          return (
            <span
              key={s}
              style={{
                background: st.bg,
                color: st.color,
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: `1px solid ${st.color}33`,
              }}
            >
              {st.label}: {cnt}
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#6b7280' }}>
          {verified}/{total} verified
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th
                style={{
                  padding: '9px 12px',
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#374151',
                  borderBottom: '2px solid #e5e7eb',
                  width: 48,
                }}
              >
                Sr.No.
              </th>
              {['Document Name', 'View', 'Status', ...(canVerify ? ['Comment', 'Action'] : [])].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '9px 12px',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#374151',
                    borderBottom: '2px solid #e5e7eb',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.documents.map((doc, idx) => (
              <DocRow key={doc.mappingId} doc={doc} idx={idx} canVerify={canVerify} onUpdated={refetch} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
