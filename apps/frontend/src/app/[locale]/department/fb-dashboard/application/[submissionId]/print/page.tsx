'use client';

import { type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { buildApplicationDisplaySections } from '@/components/(department)/dashboard/fb/applicationDetailsLayout';
import { buildDocumentUrl } from '@/components/common/documentUtils';

// ─── helpers ─────────────────────────────────────────────────────────────────
function getFilePathFromValue(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^(https?:\/\/|\/?uploads\/)/i.test(trimmed)) return trimmed;
    return '';
  }
  if (typeof val === 'object') {
    const doc = val as Record<string, unknown>;
    return String(doc.filePath || doc.file_path || doc.path || '').trim();
  }
  return '';
}

function getFileNameFromValue(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.split('/').pop() || val;
  if (typeof val === 'object') {
    const doc = val as Record<string, unknown>;
    return String(
      doc.originalName ||
      doc.original_name ||
      doc.fileName ||
      doc.file_name ||
      getFilePathFromValue(val).split('/').pop() ||
      '',
    ).trim();
  }
  return '';
}

function renderVal(val: unknown, baseApiUrl: string): ReactNode {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';

  const filePath = getFilePathFromValue(val);
  if (filePath) {
    const fileName = getFileNameFromValue(val) || 'View uploaded file';
    return (
      <a href={buildDocumentUrl(filePath, baseApiUrl)} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8', textDecoration: 'underline', fontWeight: 600 }}>
        {fileName}
      </a>
    );
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    }
    return trimmed;
  }

  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FbApplicationPrintPage() {
  const params       = useParams();
  const submissionId = Number((params as any)?.submissionId);
  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const { data, isLoading } = useQuery({
    queryKey: ['fb-print-data', submissionId],
    enabled: submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/print-data?submissionId=${submissionId}`);
      return res.data;
    },
  });

  const { data: docVerification } = useQuery({
    queryKey: ['doc-verification', submissionId, 'print'],
    enabled: submissionId > 0,
    queryFn: async () => {
      const res = await apiClient.get(`/fb-dashboard/document-verification?submissionId=${submissionId}`);
      return res.data;
    },
  });

  const sections = buildApplicationDisplaySections({
    fieldSchema: data?.fieldSchema ?? [],
    formData: (data?.formData ?? {}) as Record<string, unknown>,
    documents: docVerification?.documents ?? [],
  });
  const printFormData = (data?.formData ?? {}) as Record<string, unknown>;
  const printAddMoreRaw = (printFormData as any)?.addMore;
  const printLabelMap = new Map<string, string>();
  for (const field of data?.fieldSchema ?? []) {
    printLabelMap.set(field.fieldCode, field.label);
  }
  const addMoreGroups = !printAddMoreRaw || typeof printAddMoreRaw !== 'object'
    ? []
    : Object.entries(printAddMoreRaw)
        .map(([groupId, rows]) => ({
          groupId,
          rows: Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object') : [],
        }))
        .filter((group) => group.rows.length > 0)
        .map((group) => {
          const columnCodes = Array.from(
            new Set(group.rows.flatMap((row: any) => Object.keys(row || {}))),
          );
          return {
            ...group,
            columns: columnCodes.map((code) => ({
              code,
              label: printLabelMap.get(code) || code,
            })),
          };
        });
  const now = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  const statusColor =
    ['A','APPROVED'].includes(String(data?.status || '').toUpperCase()) ? '#16a34a' :
    ['R','REJECTED','REJECT'].includes(String(data?.status || '').toUpperCase()) ? '#dc2626' : '#a16207';

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @media print {
          .no-print { display: none !important; }
          .print-overlay { position: static !important; overflow: visible !important; background: #fff !important; }
          .page { box-shadow: none !important; margin: 0 !important; width: 100% !important; }
        }
      `}</style>

      {/* Full-screen overlay covers the department sidebar */}
      <div className="print-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#e8eaf0', overflowY: 'auto',
      }}>
        {/* Toolbar */}
        <div className="no-print" style={{
          background: '#1e3a5f', padding: '10px 24px',
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center',
        }}>
          <button
            onClick={() => window.print()}
            style={{ background: '#fff', color: '#1e3a5f', border: 'none', borderRadius: 6, padding: '7px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: 6, padding: '7px 18px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        </div>

        {/* A4 Page */}
        {isLoading || !data ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#666', fontSize: '1rem' }}>Loading…</div>
        ) : (
          <div className="page" style={{
            background: '#fff', width: 794, margin: '20px auto 40px',
            padding: '20mm 16mm', fontFamily: 'Arial, sans-serif',
            fontSize: '10pt', color: '#000',
            boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          }}>
            {/* Title */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e3a5f', paddingBottom: 8, marginBottom: 10 }}>
              <div style={{ fontSize: '13pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {data.serviceName}
              </div>
              <div style={{ fontSize: '10pt', fontWeight: 600, marginTop: 2 }}>APPLICATION FORM</div>
            </div>

            {/* Meta row */}
            <table style={{ width: '100%', marginBottom: 10, fontSize: '9.5pt' }}>
              <tbody>
                <tr>
                  <td><b>Unit Name</b> : {data.unitName || '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <b>Status for App ID</b> : #{submissionId} is{' '}
                    <span style={{ color: statusColor, fontWeight: 700 }}>{data.statusLabel}</span>{' '}
                    As On {now}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Sections */}
            {sections.map((sec: any, si: number) => (
              <div key={sec.key} style={{ marginBottom: 10 }}>
                {/* Blue header */}
                <div style={{
                  background: '#1e3a5f', color: '#fff',
                  fontWeight: 700, fontSize: '9.5pt', padding: '4px 10px',
                }}>
                  {sec.title}
                </div>

                <div style={{ position: 'relative' }}>
                  {/* Applicant photo — first section top-right */}
                  {si === 0 && data.photoUrl && (
                    <div style={{
                      position: 'absolute', top: 4, right: 0,
                      border: '1px solid #ccc', background: '#f9f9f9',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={data.photoUrl} alt="Applicant" style={{ width: 70, height: 85, objectFit: 'cover', display: 'block' }} />
                    </div>
                  )}

                  <table style={{ width: si === 0 && data.photoUrl ? 'calc(100% - 82px)' : '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '9pt' }}>
                    <tbody>
                      {chunk(sec.fields, 2).map((pair: any[], ri: number) => (
                        <tr key={ri} style={{ borderBottom: '1px solid #ddd' }}>
                          {pair.map((f: any, ci: number) => (
                            <td key={ci} style={{ width: '50%', padding: '3px 8px', borderRight: ci === 0 ? '1px solid #ddd' : 'none', verticalAlign: 'top' }}>
                              <b>{f.label}</b>
                              <span style={{ color: '#444', marginLeft: 4 }}>: {renderVal(f.value, apiBaseUrl)}</span>
                            </td>
                          ))}
                          {pair.length === 1 && <td style={{ width: '50%' }} />}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {addMoreGroups.map((group: any) => (
              <div key={`print-addmore-${group.groupId}`} style={{ marginBottom: 10 }}>
                <div style={{
                  background: '#7c2d12', color: '#fff',
                  fontWeight: 700, fontSize: '9.5pt', padding: '4px 10px',
                }}>
                  Additional Details Group {group.groupId}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '9pt' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #ddd' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid #ddd' }}>Row</th>
                        {group.columns.map((column: any, idx: number) => (
                          <th key={`${group.groupId}-${column.code}`} style={{ textAlign: 'left', padding: '6px 8px', borderRight: idx < group.columns.length - 1 ? '1px solid #ddd' : 'none' }}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row: any, rowIndex: number) => (
                        <tr key={`${group.groupId}-row-${rowIndex}`} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '6px 8px', borderRight: '1px solid #ddd', verticalAlign: 'top', fontWeight: 700 }}>{rowIndex + 1}</td>
                          {group.columns.map((column: any, idx: number) => (
                            <td key={`${group.groupId}-${rowIndex}-${column.code}`} style={{ padding: '6px 8px', borderRight: idx < group.columns.length - 1 ? '1px solid #ddd' : 'none', verticalAlign: 'top' }}>
                              {renderVal(row?.[column.code], apiBaseUrl)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div style={{ marginTop: 14, borderTop: '1px solid #ccc', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#666' }}>
              <span>Application ID: #{submissionId}</span>
              <span>This is a system-generated document.</span>
              <span>Generated on: {now}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
