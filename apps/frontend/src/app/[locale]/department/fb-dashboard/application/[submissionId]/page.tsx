'use client';

import { useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFbApplicationView, useFbTimeline, useOfficerForm, useDocumentVerification } from '@/hooks/department/fb/useFbInbox';
import FbTimelineSection from '@/components/(department)/dashboard/fb/FbTimelineSection';
import FbOfficerForm from '@/components/(department)/dashboard/fb/FbOfficerForm';
import FbDocumentVerification from '@/components/(department)/dashboard/fb/FbDocumentVerification';
import { buildApplicationDisplaySections } from '@/components/(department)/dashboard/fb/applicationDetailsLayout';
import { buildDocumentUrl } from '@/components/common/documentUtils';

function Accordion({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{title}</span>
        <span style={{ fontSize: '1.1rem', color: '#6b7280', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '0 1.5rem 1.25rem', borderTop: '1px solid #f3f4f6' }}>
          {children}
        </div>
      )}
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  P:        { bg: '#fef9c3', color: '#a16207' },
  PENDING:  { bg: '#fef9c3', color: '#a16207' },
  A:        { bg: '#dcfce7', color: '#15803d' },
  APPROVED: { bg: '#dcfce7', color: '#15803d' },
  R:        { bg: '#fee2e2', color: '#b91c1c' },
  REJECTED: { bg: '#fee2e2', color: '#b91c1c' },
  F:        { bg: '#dbeafe', color: '#1d4ed8' },
  FORWARDED:{ bg: '#dbeafe', color: '#1d4ed8' },
  FA:       { bg: '#e0e7ff', color: '#4338ca' },
  RBI:      { bg: '#fff7ed', color: '#c2410c' },
};

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

function renderValue(val: unknown, baseApiUrl: string): ReactNode {
  if (val === null || val === undefined || val === '') return <span style={{ color: '#cbd5e1' }}>—</span>;
  if (typeof val === 'boolean') return (
    <span style={{ 
      background: val ? '#f0fdf4' : '#fef2f2', 
      color: val ? '#166534' : '#991b1b', 
      padding: '2px 8px', 
      borderRadius: '4px', 
      fontSize: '0.75rem', 
      fontWeight: 600,
      border: `1px solid ${val ? '#bbf7d0' : '#fecaca'}` 
    }}>
      {val ? 'Yes' : 'No'}
    </span>
  );

  if (Array.isArray(val)) {
    if (val.length === 0) return <span style={{ color: '#cbd5e1' }}>—</span>;
    const first = val[0];
    if (first && typeof first === 'object' && getFilePathFromValue(first)) {
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {val.map((item, idx) => {
            const path = getFilePathFromValue(item);
            if (!path) return <span key={idx}>{String(item)}</span>;
            const name = getFileNameFromValue(item) || `Document ${idx + 1}`;
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
            
            return (
              <a 
                key={idx} 
                href={buildDocumentUrl(path, baseApiUrl)} 
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: '#2563eb', 
                  textDecoration: 'none', 
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <span>{isImage ? '🖼️' : '📄'}</span>
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
              </a>
            );
          })}
        </div>
      );
    }
    return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
  }

  const singlePath = getFilePathFromValue(val);
  if (singlePath) {
    const name = getFileNameFromValue(val);
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(singlePath);
    return (
      <a href={buildDocumentUrl(singlePath, baseApiUrl)} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "6px", color: "#2563eb", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600, marginTop: "4px" }}>
        <span>{isImage ? "🖼️" : "📄"}</span><span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
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

  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}


function MetaField({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span>{icon}</span>}
        {value}
      </div>
    </div>
  );
}

function getCategoryTheme(title: string) {
  const t = title.toLowerCase();
  if (t.includes('witness') || t.includes('personal') || t.includes('promoter') || t.includes('applicant')) {
    return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0', accent: '#22c55e', icon: '👤' };
  }
  if (t.includes('address') || t.includes('location')) {
    return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', accent: '#3b82f6', icon: '📍' };
  }
  if (t.includes('document')) {
    return { bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', accent: '#8b5cf6', icon: '📁' };
  }
  if (t.includes('payment') || t.includes('fee') || t.includes('cost')) {
    return { bg: '#fffbeb', text: '#92400e', border: '#fef3c7', accent: '#f59e0b', icon: '💰' };
  }
  if (t.includes('bank')) {
    return { bg: '#fdf2f8', text: '#9d174d', border: '#fbcfe8', accent: '#ec4899', icon: '🏦' };
  }
  if (t.includes('land') || t.includes('plot') || t.includes('project')) {
    return { bg: '#f0f9ff', text: '#075985', border: '#bae6fd', accent: '#0ea5e9', icon: '🏗️' };
  }
  return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0', accent: '#64748b', icon: '📝' };
}

function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export default function FbApplicationViewPage() {
  const params       = useParams();
  const router       = useRouter();
  const submissionId = Number((params as any)?.submissionId);

  const { data: appView, isLoading } = useFbApplicationView(submissionId > 0 ? submissionId : undefined);
  const { data: timeline = [], isLoading: loadingTimeline } = useFbTimeline(submissionId > 0 ? submissionId : undefined);
  const { data: officerForm, isLoading: loadingOfficerForm } = useOfficerForm(submissionId > 0 ? submissionId : undefined);
  const { data: docVerification, isLoading: loadingDocVerification } = useDocumentVerification(submissionId > 0 ? submissionId : undefined);

  if (!submissionId || submissionId <= 0) {
    return <main style={{ padding: '2rem' }}><div style={{ color: '#b91c1c' }}>Invalid submission ID.</div></main>;
  }

  const statusCode = String(appView?.status || 'P').toUpperCase();
  const sStyle = STATUS_STYLE[statusCode] ?? { bg: '#f3f4f6', color: '#374151' };
  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  // Build label map from fieldSchema: fieldCode → { label, categoryName }
  const labelMap = new Map<string, { label: string; categoryName: string }>();
  for (const f of appView?.fieldSchema ?? []) {
    labelMap.set(f.fieldCode, { label: f.label, categoryName: f.categoryName });
  }
  const formData = (appView?.formData ?? {}) as Record<string, unknown>;
  const sections = buildApplicationDisplaySections({
    fieldSchema: appView?.fieldSchema ?? [],
    formData,
    documents: docVerification?.documents ?? [],
  });

  const addMoreRaw = (formData as any)?.addMore;
  const addMoreGroups = !addMoreRaw || typeof addMoreRaw !== 'object'
    ? []
    : Object.entries(addMoreRaw)
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
              label: labelMap.get(code)?.label || code,
            })),
          };
        });

  // If schema is empty (no form builder fields), fall back to raw display
  const hasSchema = (appView?.fieldSchema?.length ?? 0) > 0;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12px; }
          .print-container { padding: 0 !important; }
        }
      `}</style>

      <main className="print-container" style={{ padding: '1.5rem', minHeight: '100vh' }}>

        {/* Header */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: '1.25rem' }}>
          <div>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem', padding: 0, marginBottom: 6 }}>
              ← Back
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Application #{submissionId}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>            
            <button
              onClick={() => window.open(`/en/department/fb-dashboard/application/${submissionId}/print`, '_blank')}
              style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, padding: '9px 20px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
            >
              🖨️ Print / PDF
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</div>
        ) : (
          <>
            {/* Meta card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)', 
              border: '1px solid #e2e8f0', 
              borderRadius: 16, 
              padding: '1.75rem', 
              marginBottom: '1.5rem', 
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px 32px' }}>
                <MetaField label="Application ID"  value={`#${submissionId}`} icon="🆔" />
                <MetaField label="Service"         value={appView?.serviceName || appView?.serviceId || '—'} icon="🛠️" />
                <MetaField label="Unit / Company"  value={appView?.unitName || '—'} icon="🏢" />
                <MetaField label="Submitted On"    value={appView?.createdDate ? new Date(appView.createdDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} icon="📅" />
                <MetaField label="Last Updated"    value={appView?.updatedDate ? new Date(appView.updatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} icon="🕒" />
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 6 }}>Status</div>
                  <span style={{ 
                    background: sStyle.bg, 
                    color: sStyle.color, 
                    borderRadius: 8, 
                    padding: '6px 14px', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    border: `1px solid ${sStyle.color}44`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 2px 4px ${sStyle.color}15`
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: sStyle.color, animation: statusCode === 'P' ? 'pulse 2s infinite' : 'none' }}></span>
                    {appView?.statusLabel || statusCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Data by Category */}
            <Accordion title="📄 Application Details" defaultOpen={true}>
              {sections.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', paddingTop: '1rem' }}>No form data available.</div>
              ) : (
                <div style={{ marginTop: '1rem' }}>
                  {sections.map((section) => {
                    const theme = getCategoryTheme(section.title);
                    return (
                      <div key={section.key} style={{ 
                        background: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderLeft: `5px solid ${theme.accent}`,
                        borderRadius: '12px', 
                        padding: '24px', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)', 
                        marginBottom: '1.75rem',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}>
                        <div style={{ 
                          fontSize: '1.05rem', 
                          fontWeight: 700, 
                          color: theme.text, 
                          borderBottom: `1px solid ${theme.border}55`,
                          paddingBottom: 16,
                          marginBottom: 24,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ 
                              width: 36, 
                              height: 36, 
                              borderRadius: 10, 
                              background: theme.bg, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: '1.2rem',
                              border: `1px solid ${theme.border}`
                            }}>
                              {theme.icon}
                            </div>
                            {toTitleCase(section.title)}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: theme.text, fontWeight: 700, background: theme.bg, padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}` }}>
                            {section.fields.length} FIELDS
                          </div>
                        </div>
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", 
                          gap: "24px 48px",
                        }}>
                          {section.fields.map((f, i) => {
                            const span = f.gridSpan || 4;
                            const gridColumn = span >= 12 ? "1 / -1" : "auto";
                            return (
                              <div key={`${section.key}-${i}`} style={{ 
                                gridColumn,
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: 8, 
                                height: '100%' 
                              }}>
                                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.4 }}>
                                  {f.label}
                                </span>
                                <div style={{ 
                                  fontSize: '0.95rem', 
                                  color: '#0f172a', 
                                  fontWeight: 600, 
                                  minHeight: '1.4rem', 
                                  lineHeight: 1.6,
                                  wordBreak: 'break-word'
                                }}>
                                  {renderValue(f.value, apiBaseUrl)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {addMoreGroups.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  {addMoreGroups.map((group) => (
                    <div key={`addmore-${group.groupId}`} style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#7c2d12', background: '#fff7ed', padding: '7px 14px', borderRadius: '6px 6px 0 0', borderBottom: '2px solid #fdba74' }}>
                        Additional Details Group {group.groupId}
                      </div>
                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '12px 14px', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Row</th>
                              {group.columns.map((column) => (
                                <th key={`${group.groupId}-${column.code}`} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                                  {column.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map((row: any, index: number) => (
                              <tr key={`${group.groupId}-row-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#111827', verticalAlign: 'top' }}>{index + 1}</td>
                                {group.columns.map((column) => (
                                  <td key={`${group.groupId}-${index}-${column.code}`} style={{ padding: '10px', fontSize: '0.78rem', color: '#6b7280', verticalAlign: 'top' }}>
                                    {renderValue(row?.[column.code], apiBaseUrl)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Fallback if no sections were built but data exists */}
              {((!hasSchema) || (hasSchema && sections.length === 0)) && Object.keys(formData).length > 0 && (
                <RawFormData formData={formData} />
              )}
            </Accordion>

            {/* Timeline */}
            <Accordion title="📋 Transaction History / Timeline" defaultOpen={false}>
              <div style={{ paddingTop: '1rem' }} id="history">
                <FbTimelineSection timeline={timeline} loading={loadingTimeline} />
              </div>
            </Accordion>

            {/* Document Verification — only renders if role has DOCUMENT_VERIFICATION subform */}
            {(loadingDocVerification || (docVerification?.documents?.length ?? 0) > 0) && (
              <Accordion title="📎 Document Checklist" defaultOpen={true}>
                <div style={{ paddingTop: '1rem' }}>
                  <FbDocumentVerification
                    data={docVerification}
                    loading={loadingDocVerification}
                    submissionId={submissionId}
                  />
                </div>
              </Accordion>
            )}

            {/* Officer Form */}
            <Accordion title="📝 Department Action" defaultOpen={true}>
              <div style={{ paddingTop: '1rem' }}>
                {loadingOfficerForm ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Loading form configuration…</div>
                ) : officerForm ? (
                  <FbOfficerForm 
                    data={officerForm} 
                    submissionId={submissionId} 
                    applicationStatus={statusCode} 
                  />
                ) : (
                  <div style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>No action form configured.</div>
                )}
              </div>
            </Accordion>
          </>
        )}
      </main>
    </>
  );
}
// Fallback renderer when no form schema available
function RawFormData({ formData }: { formData: Record<string, unknown> }) {
  const displayData = formData.fields && typeof formData.fields === 'object' && !Array.isArray(formData.fields)
    ? { ...formData, ...(formData.fields as object) }
    : formData;

  const entries = Object.entries(displayData).filter(([k]) => k !== 'fields' && k !== '__currentStep');

  if (entries.length === 0) return null;

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {entries.map(([key, val]) => {
          const isObject = val && typeof val === 'object' && !Array.isArray(val);
          
          return (
            <div key={key} style={{ padding: '12px', border: '1px solid #f3f4f6', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
                {key.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111827' }}>
                {isObject ? (
                  /* Simple representation for objects/files */
                  (val as any).originalName || (val as any).fileName || 'File/Object'
                ) : (
                  typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '—')
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
