'use client';

import { useEffect, useRef, useState } from 'react';
import WorkflowVisualizer from './WorkflowVisualizer';

// ── Python microservice base URL ─────────────────────────────────────────────
const PY_API = process.env.NEXT_PUBLIC_PY_API_URL || 'http://localhost:8001';

// ── Cycling messages shown on the Generate button while AI is running ─────────
const GEN_MESSAGES = [
  'Generating magic JSON… ✨',
  'Reading your SRS carefully… 📖',
  'Organizing the data… 🧩',
  'Building your JSON structure… 🏗️',
  'Polishing the results… ✨',
  'Adding final touches…',
  'Almost ready… stay with us!',
  'Crunching the data… ⚙️',
  'Making everything neat & tidy…',
  'Your JSON is almost ready! 🚀',
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Department { id: number; name: string }
interface Service    { id: number; service_id: string; name: string; department_id: number }
interface FormType   { id: number; name: string; abbr: string }

interface MetaResponse {
  departments: Department[];
  services:    Service[];
  form_types:  FormType[];
}

interface UploadResponse {
  success: boolean;
  filename: string;
  text: string;
  text_length: number;
}

interface VersionInfo {
  action:  'INSERT_NEW' | 'NEW_VERSION' | 'NO_CHANGE';
  version: string;
  changes: string[];
}

interface ValidationResult {
  is_valid: boolean;
  errors:   string[];
  warnings: string[];
  stats: {
    pages: number; categories: number; form_fields: number;
    builder_fields: number; field_options: number;
    addmore_groups: number; addmore_columns: number; form_rules: number;
  };
}

interface GenerateResponse {
  success:        boolean;
  generated_json: Record<string, unknown>;
  checklist_json: Record<string, unknown>;
  workflow_json?:  Record<string, unknown> | null;
  workflow_error?: string | null;
  version_info:   VersionInfo;
  validation:     ValidationResult;
  summary: {
    pages: number; categories: number; form_fields: number;
    builder_fields: number; field_options: number;
    addmore_groups: number; addmore_columns: number; form_rules: number;
  };
}

interface InsertResponse {
  success:      boolean;
  action:       string;
  form_version: string;
  mapping_id:   number;
  form_code:    string;
  message:      string;
  changes?:     string[];
  workflow?:    Record<string, unknown> | null;
}

// ── Step enum ────────────────────────────────────────────────────────────────
type Step = 'upload' | 'preview' | 'done';

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page:      { display: 'grid', gap: 20, padding: '24px 20px', maxWidth: 1100, margin: '0 auto' } as const,
  panel:     { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, boxShadow: '0 4px 16px rgba(15,23,42,.05)' } as const,
  title:     { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 } as const,
  sub:       { fontSize: 13, color: '#64748b', margin: '4px 0 0' } as const,
  label:     { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 } as const,
  select:    { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', color: '#1e293b' } as const,
  input:     { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 } as const,
  textarea:  { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'monospace', resize: 'vertical' as const, minHeight: 160 },
  btnPri:    { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 } as const,
  btnSec:    { background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 999, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const,
  btnDanger: { background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' } as const,
  badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, background: color === 'blue' ? '#eff6ff' : color === 'green' ? '#f0fdf4' : color === 'amber' ? '#fffbeb' : '#fef2f2', color: color === 'blue' ? '#1d4ed8' : color === 'green' ? '#15803d' : color === 'amber' ? '#b45309' : '#b91c1c', border: `1px solid ${color === 'blue' ? '#bfdbfe' : color === 'green' ? '#bbf7d0' : color === 'amber' ? '#fde68a' : '#fecaca'}` } as const),
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as const,
  grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } as const,
  alert: (t: 'error' | 'success') => ({ padding: '12px 16px', borderRadius: 10, fontSize: 13, background: t === 'error' ? '#fef2f2' : '#f0fdf4', color: t === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${t === 'error' ? '#fecaca' : '#bbf7d0'}` }) as const,
};

// ── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: Step }) {
  const steps = [
    { id: 'upload',  label: 'Upload & Configure' },
    { id: 'preview', label: 'Review & Approve' },
    { id: 'done',    label: 'Done' },
  ];
  const idx = steps.findIndex(s => s.id === step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: i < idx ? '#15803d' : i === idx ? '#2563eb' : '#e2e8f0',
              color: i <= idx ? '#fff' : '#94a3b8',
            }}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === idx ? 700 : 400, color: i === idx ? '#1e293b' : '#64748b' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < idx ? '#15803d' : '#e2e8f0', margin: '0 12px' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards({ s: summary }: { s: GenerateResponse['summary'] }) {
  const cards = [
    { label: 'Pages',           value: summary.pages },
    { label: 'Categories',      value: summary.categories },
    { label: 'Form Fields',     value: summary.form_fields },
    { label: 'Builder Fields',  value: summary.builder_fields },
    { label: 'Field Options',   value: summary.field_options },
    { label: 'Form Rules',      value: summary.form_rules },
    { label: 'Add-More Groups', value: summary.addmore_groups },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginBottom: 16 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>{c.value}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Validation panel ──────────────────────────────────────────────────────────
function ValidationPanel({ v }: { v: ValidationResult }) {
  if (v.is_valid && v.warnings.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 13, marginBottom: 12 }}>
        <i className="bi bi-check-circle-fill" /> JSON validation passed — ready for DB insert.
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 12 }}>
      {v.errors.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#b91c1c', marginBottom: 6 }}>
            <i className="bi bi-x-circle-fill" style={{ marginRight: 6 }} />
            {v.errors.length} Validation Error{v.errors.length > 1 ? 's' : ''} — DB insert blocked
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#7f1d1d', lineHeight: 1.7 }}>
            {v.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {v.warnings.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#b45309', marginBottom: 6 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }} />
            {v.warnings.length} Warning{v.warnings.length > 1 ? 's' : ''}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#713f12', lineHeight: 1.7 }}>
            {v.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AiFormGenerate() {
  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('upload');

  // ── Meta ────────────────────────────────────────────────────────────────────
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [metaError, setMetaError] = useState('');

  // ── Upload form state ───────────────────────────────────────────────────────
  const [deptId, setDeptId]         = useState('');
  const [serviceId, setServiceId]   = useState('');
  const [formTypeId, setFormTypeId] = useState('');
  const [file, setFile]             = useState<File | null>(null);
  const [srsText, setSrsText]       = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadErr, setUploadErr]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr]         = useState('');
  const [genMsgIdx, setGenMsgIdx]   = useState(0);

  useEffect(() => {
    if (!generating) { setGenMsgIdx(0); return; }
    const timer = setInterval(() => {
      setGenMsgIdx(i => (i + 1) % GEN_MESSAGES.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [generating]);

  // ── Preview state ───────────────────────────────────────────────────────────
  const [genResult, setGenResult]   = useState<GenerateResponse | null>(null);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [docjsonExpanded, setDocJsonExpanded] = useState(false);
  const [forceNew, setForceNew]     = useState(false);
  const [inserting, setInserting]   = useState(false);
  const [insertErr, setInsertErr]   = useState('');

  // ── Workflow state ───────────────────────────────────────────────────────────
  const [workflowJson, setWorkflowJson]           = useState<any>(null);
  const [workflowExpanded, setWorkflowExpanded]   = useState(false);
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);
  const [workflowErr, setWorkflowErr]             = useState('');
  const [insertingWorkflow, setInsertingWorkflow] = useState(false);
  const [workflowInsertResult, setWorkflowInsertResult] = useState<any>(null);
  const [showVisualizer, setShowVisualizer]       = useState(false);

  // ── Done state ──────────────────────────────────────────────────────────────
  const [insertResult, setInsertResult] = useState<InsertResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load meta on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${PY_API}/api/meta`)
      .then(r => r.json())
      .then((d: MetaResponse) => setMeta(d))
      .catch(() => setMetaError('Cannot connect to AI service (port 8001). Is the Python service running?'));
  }, []);

  // ── Filtered services ───────────────────────────────────────────────────────
  const filteredServices = meta?.services.filter(s => !deptId || s.department_id === Number(deptId)) ?? [];

  // ── Step 1a: Upload file ────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    setSrsText('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(`${PY_API}/api/srs/upload`, { method: 'POST', body: fd });
      const data: UploadResponse & { detail?: string } = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Upload failed');
      setSrsText(data.text);
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  // ── Step 1b: Generate JSON ──────────────────────────────────────────────────
  async function handleGenerate() {
    if (!srsText.trim() || !deptId || !serviceId || !formTypeId) return;
    setGenerating(true);
    setGenErr('');
    try {
      const resp = await fetch(`${PY_API}/api/srs/full-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srs_text:      srsText,
          department_id: Number(deptId),
          service_id:    serviceId,
          form_type_id:  Number(formTypeId),
          filename:      file?.name ?? '',
        }),
      });
      const data: GenerateResponse & { detail?: string } = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Generation failed');
      setGenResult(data);
      if (data.workflow_json) {
        setWorkflowJson(data.workflow_json);
        setWorkflowExpanded(true);
      }
      setStep('preview');
    } catch (e: unknown) {
      setGenErr(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  // ── Step 2: Insert into DB ──────────────────────────────────────────────────
  async function handleInsert() {
    if (!genResult) return;
    setInserting(true);
    setInsertErr('');
    try {
      const resp = await fetch(`${PY_API}/api/srs/insert-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_json:    genResult.generated_json,
          checklist_json:    genResult.checklist_json,
          workflow_json:     workflowJson ?? null,
          force_new_version: forceNew,
        }),
      });
      const data: InsertResponse & { detail?: string } = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Insert failed');
      setInsertResult(data);
      setStep('done');
    } catch (e: unknown) {
      setInsertErr(e instanceof Error ? e.message : String(e));
    } finally {
      setInserting(false);
    }
  }

  // ── Workflow: Generate ───────────────────────────────────────────────────────
  async function handleGenerateWorkflow() {
    setGeneratingWorkflow(true);
    setWorkflowErr('');
    setWorkflowJson(null);
    try {
      const fd = new FormData();
      fd.append('srs_text', srsText);
      fd.append('department_id', deptId);
      fd.append('service_id', serviceId);
      if (file) fd.append('file', file);
      const resp = await fetch(`${PY_API}/api/workflow/generate`, { method: 'POST', body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Workflow generation failed');
      setWorkflowJson(data.workflow_json ?? data);
      setWorkflowExpanded(true);
    } catch (e: unknown) {
      setWorkflowErr(e instanceof Error ? e.message : String(e));
    } finally {
      setGeneratingWorkflow(false);
    }
  }

  // ── Workflow: Insert into DB ─────────────────────────────────────────────────
  async function handleInsertWorkflow() {
    if (!workflowJson) return;
    setInsertingWorkflow(true);
    try {
      const resp = await fetch(`${PY_API}/api/workflow/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_json: workflowJson,
          department_id: Number(deptId),
          service_id: serviceId,
          force_replace: true,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Workflow insert failed');
      setWorkflowInsertResult(data);
    } catch (e: unknown) {
      setWorkflowErr(e instanceof Error ? e.message : String(e));
    } finally {
      setInsertingWorkflow(false);
    }
  }

  function handleReset() {
    setStep('upload');
    setFile(null);
    setSrsText('');
    setDeptId('');
    setServiceId('');
    setFormTypeId('');
    setGenResult(null);
    setInsertResult(null);
    setUploadErr('');
    setGenErr('');
    setInsertErr('');
    setForceNew(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
    <div style={s.page}>
      {/* Header */}
      <div style={s.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: 22 }}>
            <i className="bi bi-cpu" />
          </div>
          <div>
            <h1 style={s.title}>AI Generate Form &amp; Workflow</h1>
            <p style={s.sub}>Upload an SRS document → AI generates form JSON → Insert into FormBuilder tables</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {meta ? (
              <span style={s.badge('green')}><i className="bi bi-check-circle-fill" /> AI Service Online</span>
            ) : metaError ? (
              <span style={s.badge('red')}><i className="bi bi-exclamation-circle-fill" /> Offline</span>
            ) : (
              <span style={s.badge('amber')}><i className="bi bi-hourglass-split" /> Connecting…</span>
            )}
          </div>
        </div>
        {metaError && <div style={{ ...s.alert('error'), marginTop: 14 }}><i className="bi bi-exclamation-triangle" /> {metaError}</div>}
      </div>

      {/* Stepper */}
      <div style={{ ...s.panel, padding: '16px 24px' }}>
        <Stepper step={step} />
      </div>

      {/* ── STEP 1: Upload & Configure ── */}
      {step === 'upload' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Context selectors */}
          <div style={s.panel}>
            <h2 style={{ ...s.title, fontSize: 16, marginBottom: 16 }}>
              <i className="bi bi-sliders" style={{ marginRight: 8, color: '#2563eb' }} />
              Form Context
            </h2>
            <div style={s.grid3}>
              <div>
                <div style={s.label}>Department</div>
                <select style={s.select} value={deptId} onChange={e => { setDeptId(e.target.value); setServiceId(''); }}>
                  <option value="">-- Select Department --</option>
                  {meta?.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <div style={s.label}>Service</div>
                <select style={s.select} value={serviceId} onChange={e => setServiceId(e.target.value)} disabled={!deptId}>
                  <option value="">-- Select Service --</option>
                  {filteredServices.map(s => <option key={s.id} value={s.service_id}>{s.name} ({s.service_id})</option>)}
                </select>
              </div>
              <div>
                <div style={s.label}>Form Type</div>
                <select style={s.select} value={formTypeId} onChange={e => setFormTypeId(e.target.value)}>
                  <option value="">-- Select Form Type --</option>
                  {meta?.form_types.map(ft => <option key={ft.id} value={ft.id}>{ft.name} ({ft.abbr})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* File upload */}
          <div style={s.panel}>
            <h2 style={{ ...s.title, fontSize: 16, marginBottom: 4 }}>
              <i className="bi bi-file-earmark-arrow-up" style={{ marginRight: 8, color: '#2563eb' }} />
              Upload SRS Document
            </h2>
            <p style={{ ...s.sub, marginBottom: 16 }}>Supported formats: PDF, DOCX, DOC, TXT (max 10 MB)</p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={s.label}>SRS File</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  style={s.input}
                  onChange={e => { setFile(e.target.files?.[0] || null); setSrsText(''); setUploadErr(''); }}
                />
              </div>
              <button
                style={{ ...s.btnPri, opacity: (!file || uploading) ? 0.6 : 1 }}
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? <><i className="bi bi-hourglass-split" /> Extracting…</> : <><i className="bi bi-upload" /> Extract Text</>}
              </button>
            </div>

            {uploadErr && <div style={{ ...s.alert('error'), marginTop: 12 }}><i className="bi bi-exclamation-triangle" /> {uploadErr}</div>}

            {srsText && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={s.label}>Extracted Text ({srsText.length.toLocaleString()} chars)</div>
                  <span style={s.badge('green')}><i className="bi bi-check-circle-fill" /> Extracted</span>
                </div>
                <textarea
                  style={s.textarea}
                  value={srsText}
                  onChange={e => setSrsText(e.target.value)}
                  rows={10}
                />
                <div style={{ ...s.sub, marginTop: 4 }}>You can edit the extracted text before sending to AI.</div>
              </div>
            )}
          </div>

          {/* Generate button */}
          {srsText && (
            <div style={s.panel}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>Ready to Generate</div>
                  <div style={s.sub}>AI will convert the SRS text into FormBuilder-compatible JSON.</div>
                </div>
                <button
                  style={{ ...s.btnPri, opacity: (!deptId || !serviceId || !formTypeId || generating) ? 0.6 : 1, fontSize: 15, padding: '12px 28px' }}
                  disabled={!deptId || !serviceId || !formTypeId || generating}
                  onClick={handleGenerate}
                >
                  {generating
                    ? <><i className="bi bi-hourglass-split" /> {GEN_MESSAGES[genMsgIdx]}</>
                    : <><i className="bi bi-magic" /> Generate Form JSON</>}
                </button>
              </div>
              {genErr && <div style={{ ...s.alert('error'), marginTop: 12 }}><i className="bi bi-exclamation-triangle" /> {genErr}</div>}
              {!deptId || !serviceId || !formTypeId
                ? <div style={{ ...s.alert('error'), marginTop: 12, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                    <i className="bi bi-info-circle" /> Please select Department, Service, and Form Type before generating.
                  </div>
                : null}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Preview & Approve ── */}
      {step === 'preview' && genResult && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Summary */}
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ ...s.title, fontSize: 18, marginBottom: 4 }}>
                  <i className="bi bi-check2-circle" style={{ marginRight: 8, color: '#15803d' }} />
                  AI Generated Successfully
                </h2>
                <p style={s.sub}>Review the generated form structure below before inserting into the database.</p>
              </div>
              <button style={s.btnSec} onClick={() => setStep('upload')}>
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>

            <SummaryCards s={genResult.summary} />

            {/* Validation result */}
            {genResult.validation && <ValidationPanel v={genResult.validation} />}

            {/* Version info */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={s.badge(genResult.version_info.action === 'INSERT_NEW' ? 'blue' : genResult.version_info.action === 'NO_CHANGE' ? 'amber' : 'green')}>
                <i className={`bi ${genResult.version_info.action === 'INSERT_NEW' ? 'bi-plus-circle' : genResult.version_info.action === 'NO_CHANGE' ? 'bi-dash-circle' : 'bi-arrow-up-circle'}`} />
                {genResult.version_info.action} — {genResult.version_info.version}
              </span>
            </div>

            {genResult.version_info.changes.length > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', marginTop: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Changes detected vs existing form:</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
                  {genResult.version_info.changes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {genResult.version_info.action === 'NO_CHANGE' && (
              <div style={{ ...s.alert('error'), background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', marginTop: 12 }}>
                <i className="bi bi-info-circle" /> No changes detected vs existing form.
                <label style={{ marginLeft: 16, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={forceNew} onChange={e => setForceNew(e.target.checked)} style={{ marginRight: 6 }} />
                  Force create new version anyway
                </label>
              </div>
            )}
          </div>

          {/* JSON viewer */}
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ ...s.title, fontSize: 16 }}>
                <i className="bi bi-code-slash" style={{ marginRight: 8, color: '#2563eb' }} />
                Generated JSON
              </h2>
              <button style={s.btnSec} onClick={() => setJsonExpanded(x => !x)}>
                {jsonExpanded ? <><i className="bi bi-chevron-up" /> Collapse</> : <><i className="bi bi-chevron-down" /> Expand</>}
              </button>
            </div>
            {jsonExpanded && (
              <textarea                
                style={{ ...s.textarea, minHeight: 400, fontSize: 12, background: '#f8fafc' }}
                defaultValue={JSON.stringify(genResult.generated_json, null, 2)}
              />
            )}
            {!jsonExpanded && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {JSON.stringify(genResult.generated_json).slice(0, 300)}…
              </div>
            )}
          </div>

          {/* JSON viewer */}
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ ...s.title, fontSize: 16 }}>
                <i className="bi bi-code-slash" style={{ marginRight: 8, color: '#2563eb' }} />
                Document Checklist JSON
              </h2>
              <button style={s.btnSec} onClick={() => setDocJsonExpanded(x => !x)}>
                {docjsonExpanded ? <><i className="bi bi-chevron-up" /> Collapse</> : <><i className="bi bi-chevron-down" /> Expand</>}
              </button>
            </div>
            {docjsonExpanded && (
              <textarea                
                style={{ ...s.textarea, minHeight: 400, fontSize: 12, background: '#f8fafc' }}
                defaultValue={JSON.stringify(genResult.checklist_json, null, 2)}
              />
            )}
            {!docjsonExpanded && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {JSON.stringify(genResult.checklist_json).slice(0, 300)}…
              </div>
            )}
          </div>

          {/* Workflow JSON */}
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ ...s.title, fontSize: 16 }}>
                <i className="bi bi-diagram-3" style={{ marginRight: 8, color: '#7c3aed' }} />
                Workflow Configuration JSON
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {workflowJson && (
                  <>
                    <button
                      style={{ ...s.btnSec, color: '#7c3aed', borderColor: '#7c3aed' }}
                      onClick={() => setShowVisualizer(true)}
                    >
                      <i className="bi bi-diagram-3" /> View Flowchart
                    </button>
                    <button style={s.btnSec} onClick={() => setWorkflowExpanded(x => !x)}>
                      {workflowExpanded ? <><i className="bi bi-chevron-up" /> Collapse</> : <><i className="bi bi-chevron-down" /> Expand</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            {(workflowErr || genResult?.workflow_error) && (
              <div style={{ ...s.alert('error'), marginBottom: 12 }}>
                <i className="bi bi-exclamation-triangle" /> {workflowErr || genResult?.workflow_error}
              </div>
            )}

            {workflowInsertResult && (
              <div style={{ ...s.alert('success'), marginBottom: 12 }}>
                <i className="bi bi-check-circle" /> {workflowInsertResult.message}
                {workflowInsertResult.officer_forms_errors?.length > 0 && (
                  <span style={{ color: '#b45309', marginLeft: 8 }}>
                    ({workflowInsertResult.officer_forms_errors.length} officer form errors)
                  </span>
                )}
              </div>
            )}

            {workflowJson ? (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                  <span><i className="bi bi-list-ol" style={{ marginRight: 4 }} />{workflowJson.workflow_steps?.length ?? 0} workflow steps</span>
                  <span><i className="bi bi-file-earmark-text" style={{ marginRight: 4 }} />{workflowJson.officer_forms?.length ?? 0} officer forms</span>
                </div>
                {workflowExpanded && (
                  <textarea
                    style={{ ...s.textarea, minHeight: 400, fontSize: 12, background: '#faf5ff' }}
                    defaultValue={JSON.stringify(workflowJson, null, 2)}
                  />
                )}
                {!workflowExpanded && (
                  <div style={{ background: '#faf5ff', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                    {JSON.stringify(workflowJson).slice(0, 300)}…
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Click "Generate Workflow" to generate workflow steps and officer forms from SRS
              </div>
            )}
          </div>

          {/* Approve */}
          <div style={s.panel}>
            {insertErr && <div style={{ ...s.alert('error'), marginBottom: 16 }}><i className="bi bi-exclamation-triangle" /> {insertErr}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button style={s.btnSec} onClick={() => setStep('upload')}>
                <i className="bi bi-arrow-left" /> Edit SRS Text
              </button>
              <button
                style={{ ...s.btnPri, opacity: inserting ? 0.6 : 1 }}
                disabled={inserting || (genResult.version_info.action === 'NO_CHANGE' && !forceNew) || (genResult.validation && !genResult.validation.is_valid)}
                onClick={handleInsert}
              >
                {inserting
                  ? <><i className="bi bi-hourglass-split" /> Inserting…</>
                  : <><i className="bi bi-database-check" /> Approve &amp; Insert into DB</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 'done' && insertResult && (
        <div style={s.panel}>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {insertResult.success ? '✅' : '❌'}
            </div>
            <h2 style={{ ...s.title, fontSize: 22, marginBottom: 8 }}>
              {insertResult.success ? 'Form Inserted Successfully!' : 'Insert Failed'}
            </h2>
            <p style={{ ...s.sub, fontSize: 14, marginBottom: 24 }}>{insertResult.message}</p>

            {insertResult.success && (
              <div style={{ display: 'inline-grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28, textAlign: 'left' }}>
                {[
                  { label: 'Form Code',    value: insertResult.form_code },
                  { label: 'Version',      value: insertResult.form_version },
                  { label: 'Mapping ID',   value: insertResult.mapping_id },
                ].map(c => (
                  <div key={c.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 20px', border: '1px solid #e2e8f0', minWidth: 160 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{c.value}</div>
                  </div>
                ))}
              </div>
            )}

            {insertResult.changes && insertResult.changes.length > 0 && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, border: '1px solid #bbf7d0', marginBottom: 24, textAlign: 'left', maxWidth: 500, margin: '0 auto 24px' }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#15803d' }}>Changes in this version:</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#374151' }}>
                  {insertResult.changes.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button style={s.btnPri} onClick={handleReset}>
                <i className="bi bi-plus-circle" /> Generate Another Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ── Workflow Visualizer Modal ── */}
    {showVisualizer && workflowJson?.workflow_steps && (
      <WorkflowVisualizer
        steps={workflowJson.workflow_steps}
        formTypes={meta?.form_types.map(ft => ({ id: ft.id, type_name: ft.abbr || ft.name })) ?? []}
        onClose={() => setShowVisualizer(false)}
      />
    )}
    </>
  );
}
