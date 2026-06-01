'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import WorkflowDiagram, { type WorkflowJson } from './WorkflowDiagram';
import Timeline from '@/app/[locale]/admin/process_flow/Timeline';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';
import { useServices } from '@/hooks/master/useServices';

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
interface FormType   { id: number; name: string; abbr: string }

interface MetaResponse {
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
  checklist_json: Record<string, unknown> | null;
  checklist_error?: string | null;
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
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as const,
  grid3:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 } as const,
  grid5:     { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 16 } as const,
  badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, background: color === 'blue' ? '#eff6ff' : color === 'green' ? '#f0fdf4' : color === 'amber' ? '#fffbeb' : '#fef2f2', color: color === 'blue' ? '#1d4ed8' : color === 'green' ? '#15803d' : color === 'amber' ? '#b45309' : '#b91c1c', border: `1px solid ${color === 'blue' ? '#bfdbfe' : color === 'green' ? '#bbf7d0' : color === 'amber' ? '#fde68a' : '#fecaca'}` } as const),
  alert: (t: 'error' | 'success') => ({ padding: '12px 16px', borderRadius: 10, fontSize: 13, background: t === 'error' ? '#fef2f2' : '#f0fdf4', color: t === 'error' ? '#b91c1c' : '#15803d', border: `1px solid ${t === 'error' ? '#fecaca' : '#bbf7d0'}` }) as const,
};

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

// ── AI Pipeline Info Panel ────────────────────────────────────────────────────
function PipelineInfoPanel({ pipeline }: { pipeline: Record<string, unknown> | undefined }) {
  if (!pipeline) return null;
  const masters = (pipeline.master_definitions as unknown[] | undefined) ?? [];
  if (masters.length === 0) return null;
  return (
    <div style={{ background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#1d4ed8', marginBottom: 8 }}>
        <i className="bi bi-cpu" style={{ marginRight: 6 }} />
        AI-Extracted Master Definitions
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
        {masters.map((m: any, i: number) => (
          <span key={i} style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>
            {m.name ?? m.code ?? `Master ${i + 1}`}
          </span>
        ))}
      </div>
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

  // ── Cascade selection state ─────────────────────────────────────────────────
  const [tenantId, setTenantId]         = useState<number | null>(null);
  const [projectId, setProjectId]       = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [serviceId, setServiceId]       = useState<string>('');

  const { data: tenants = [] }  = useTenants({ isActive: true });
  const { data: projects = [] } = useTenantProjects(tenantId);

  // Step 1: Find master_definition for DEPARTMENT scoped to selected tenant+project
  const { data: deptMasterDef } = useQuery<any>({
    queryKey: ['dept-master-def', tenantId, projectId],
    queryFn: async () => {
      const params = new URLSearchParams({ search: 'Department' });
      if (tenantId)  params.append('tenant_id',  String(tenantId));
      if (projectId) params.append('project_id', String(projectId));
      const res = await apiClient.get(`/master/definitions?${params}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      // find first definition whose name contains "department" (case-insensitive) for this tenant+project
      const found = list.find((d: any) =>
        d.name?.toLowerCase().includes('department') && !d.name?.toLowerCase().includes('sub')
      );
      console.log('[Dept Step1] list:', list, 'found:', found);
      return found ?? null;
    },
    enabled: !!tenantId,
    staleTime: 0,
  });

  // Step 2: Fetch master_data rows for that master_definition id
  const masterDefId = deptMasterDef?.id;
  const { data: departmentsRaw = [] } = useQuery<any[]>({
    queryKey: ['master-departments', masterDefId],
    queryFn: async () => {
      const res = await apiClient.get(`/master/data/by-master/${masterDefId}?limit=500&is_active=true`);
      console.log('[Dept Step2] masterDefId:', masterDefId, 'raw res.data:', res.data);
      return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    },
    enabled: !!masterDefId,
    staleTime: 5 * 60 * 1000,
  });
  const departments = departmentsRaw as any[];
  console.log('[Dept Render] tenantId:', tenantId, 'projectId:', projectId, 'masterDefId:', masterDefId, 'deptMasterDef:', deptMasterDef, 'departments:', departments);

  // Services from m_service — filter by department_id (=master_data.id), tenant, project
  const { data: servicesRaw = [] } = useServices({
    isActive: true,
    departmentIds: departmentId ? [departmentId] : undefined,
  });
  const services = (servicesRaw as any[]).filter((s: any) => {
    if (tenantId  && s.tenantId  != null && Number(s.tenantId)  !== tenantId)  return false;
    if (projectId && s.projectId != null && Number(s.projectId) !== projectId) return false;
    return true;
  });

  // ── Upload form state ───────────────────────────────────────────────────────
  const [formTypeId, setFormTypeId] = useState('');
  const [file, setFile]             = useState<File | null>(null);
  const [srsText, setSrsText]       = useState('');
  const [uploading, setUploading]   = useState(false);
  const [uploadErr, setUploadErr]   = useState('');
  const [generating, setGenerating] = useState(false);
  const [genErr, setGenErr]         = useState('');
  const [genMsgIdx, setGenMsgIdx]   = useState(0);

  // Reset department+service when tenant/project changes (different master_definition)
  useEffect(() => { setDepartmentId(null); setServiceId(''); }, [tenantId, projectId]);

  // Reset service if it no longer belongs to selected department/tenant/project
  useEffect(() => {
    if (!serviceId) return;
    const valid = services.some((s: any) => (s.service_id ?? String(s.id)) === serviceId);
    if (!valid) setServiceId('');
  }, [services, serviceId]);

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
  const [workflowJson, setWorkflowJson]           = useState<WorkflowJson | null>(null);
  const [workflowExpanded, setWorkflowExpanded]   = useState(false);
  const [workflowErr, setWorkflowErr]             = useState('');
  const [insertingWorkflow, setInsertingWorkflow] = useState(false);
  const [showWorkflow, setShowWorkflow]           = useState(false);
  const [workflowInsertResult, setWorkflowInsertResult] = useState<Record<string, unknown> | null>(null);

  // ── Done state ──────────────────────────────────────────────────────────────
  const [insertResult, setInsertResult] = useState<InsertResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load meta on mount (form types only) ────────────────────────────────────
  useEffect(() => {
    fetch(`${PY_API}/api/meta`)
      .then(r => r.json())
      .then((d: MetaResponse) => setMeta(d))
      .catch(() => setMetaError('Cannot connect to AI service (port 8001). Is the Python service running?'));
  }, []);

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

  // ── Step 1b: Generate JSON (AI reads everything from SRS) ──────────────────
  async function handleGenerate() {
    if (!srsText.trim() || !formTypeId || !tenantId || !departmentId || !serviceId) return;
    setGenerating(true);
    setGenErr('');
    try {
      const resp = await fetch(`${PY_API}/api/srs/full-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srs_text:      srsText,
          form_type_id:  Number(formTypeId),
          filename:      file?.name ?? '',
          tenant_id:     tenantId     ?? undefined,
          project_id:    projectId    ?? undefined,
          department_id: departmentId ?? undefined,
          service_id:    serviceId    || undefined,
        }),
      });
      const data: GenerateResponse & { detail?: string } = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Generation failed');
      setGenResult(data);
      if (data.workflow_json) {
        setWorkflowJson(data.workflow_json as unknown as WorkflowJson);
        setWorkflowExpanded(true);
      }
      setStep('preview');
    } catch (e: unknown) {
      setGenErr(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  // // ── Step 2: Insert into DB via Pipeline ─────────────────────────────────────
  // // AI automatically extracts tenant/project/dept/service/master info from SRS.
  // async function handleInsert() {
  //   if (!genResult || !genResult.generated_json) return;
  //   setInserting(true);
  //   setInsertErr('');
  //   try {
  //     const pipeline = (genResult.generated_json.pipeline ?? {}) as Record<string, unknown>;
  //     // Override pipeline with user-selected dropdown IDs (more reliable than AI-extracted)
  //     if (tenantId)     pipeline.tenant_id     = tenantId;
  //     if (projectId)    pipeline.project_id    = projectId;
  //     if (departmentId) pipeline.department_id = departmentId;
  //     if (serviceId)    pipeline.service_id    = serviceId;

  //     const resp = await fetch(`${PY_API}/api/pipeline/insert`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         pipeline,
  //         form_payload:      genResult.generated_json,
  //         checklist_payload: genResult.checklist_json,
  //         workflow_payload:  workflowJson ?? undefined,
  //         force_new_version: forceNew,
  //       }),
  //     });
  //     const data = await resp.json() as Record<string, unknown> & { detail?: string | Record<string, unknown> };
  //     if (!resp.ok) throw new Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));

  //     // Normalize pipeline response to InsertResponse shape
  //     const form = (data.form ?? {}) as Record<string, unknown>;
  //     setInsertResult({
  //       success:      Boolean(data.success),
  //       action:       'INSERT_NEW',
  //       form_version: String(form.form_version ?? 'v1'),
  //       mapping_id:   Number(form.mapping_id ?? 0),
  //       form_code:    String(form.form_code ?? ''),
  //       message:      String(data.message ?? 'Inserted successfully.'),
  //       changes:      [],
  //       workflow:     (data.workflow ?? null) as Record<string, unknown> | null,
  //     });
  //     setStep('done');
  //   } catch (e: unknown) {
  //     setInsertErr(e instanceof Error ? e.message : String(e));
  //   } finally {
  //     setInserting(false);
  //   }
  // }


  // ── Step 2: Insert into DB (workflow-only mode) ───────────────────────────────
  async function handleInsert() {
    if (!genResult || (!genResult.generated_json && !genResult.workflow_json)) return;
    setInserting(true);
    setInsertErr('');
    try {
      const resp = await fetch(`${PY_API}/api/srs/insert-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generated_json:  genResult.generated_json ?? {},
          checklist_json:  genResult.checklist_json ?? {},
          workflow_json:   genResult.workflow_json ?? undefined,
          tenant_id:       tenantId ?? undefined,
          project_id:      projectId ?? undefined,
          force_new_version: forceNew,
        }),
      });
      const data = await resp.json() as Record<string, unknown> & { detail?: string | Record<string, unknown> };
      if (!resp.ok) throw new Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail));

      setInsertResult({
        success:      Boolean(data.success),
        action:       String(data.action ?? 'WORKFLOW_ONLY'),
        form_version: String(data.form_version ?? ''),
        mapping_id:   Number(data.mapping_id ?? 0),
        form_code:    String(data.form_code ?? ''),
        message:      String(data.message ?? 'Inserted successfully.'),
        changes:      Array.isArray(data.changes) ? (data.changes as string[]) : [],
        workflow:     (data.workflow ?? null) as Record<string, unknown> | null,
      });
      setStep('done');
    } catch (e: unknown) {
      setInsertErr(e instanceof Error ? e.message : String(e));
    } finally {
      setInserting(false);
    }
  }


  // ── Workflow: Generate ───────────────────────────────────────────────────────
  async function handleGenerateWorkflow() {
    setWorkflowErr('');
    setWorkflowJson(null);
    try {
      const fd = new FormData();
      fd.append('srs_text', srsText);
      fd.append('department_id', '0');
      fd.append('service_id', 'NEW');
      if (file) fd.append('file', file);
      const resp = await fetch(`${PY_API}/api/workflow/generate`, { method: 'POST', body: fd });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || 'Workflow generation failed');
      setWorkflowJson((data.workflow_json ?? data) as WorkflowJson);
      setWorkflowExpanded(true);
    } catch (e: unknown) {
      setWorkflowErr(e instanceof Error ? e.message : String(e));
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
          department_id: 0,
          service_id: 'NEW',
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
    setFormTypeId('');
    setTenantId(null);
    setProjectId(null);
    setDepartmentId(null);
    setServiceId('');
    setGenResult(null);
    setInsertResult(null);
    setUploadErr('');
    setGenErr('');
    setInsertErr('');
    setForceNew(false);
    setWorkflowJson(null);
    setWorkflowInsertResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: 22 }}>
            <i className="bi bi-cpu" />
          </div>
          <div>
            <h1 style={s.title}>AI-Driven Workflow & Form Creation</h1>
            <p style={s.sub}>Upload an SRS document → AI reads everything → Insert into FormBuilder tables automatically</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
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
        <Timeline />
      </div>

      {/* ── STEP 1: Upload & Configure ── */}
      {step === 'upload' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Cascade selectors */}
          <div style={s.panel}>
            <h2 style={{ ...s.title, fontSize: 16, marginBottom: 4 }}>
              <i className="bi bi-ui-checks" style={{ marginRight: 8, color: '#2563eb' }} />
              Select Tenant → Project → Department → Service → Form Type
            </h2>
            <p style={{ ...s.sub, marginBottom: 16 }}>
              Select existing records from DB. AI will generate form JSON for the selected context.
            </p>
            <div style={s.grid5}>
              {/* Tenant */}
              <div>
                <div style={s.label}>Tenant <span style={{ color: '#b91c1c' }}>*</span></div>
                <select style={s.select} value={tenantId ?? ''} onChange={e => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setTenantId(v);
                  setProjectId(null);
                  setDepartmentId(null);
                  setServiceId('');
                }}>
                  <option value="">-- Tenant --</option>
                  {(tenants as any[]).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Project */}
              <div>
                <div style={s.label}>Project</div>
                <select style={s.select} value={projectId ?? ''} disabled={!tenantId} onChange={e => {
                  setProjectId(e.target.value ? Number(e.target.value) : null);
                }}>
                  <option value="">-- Project --</option>
                  {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <div style={s.label}>Department <span style={{ color: '#b91c1c' }}>*</span></div>
                <select style={s.select} value={departmentId ?? ''} onChange={e => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setDepartmentId(v);
                  setServiceId('');
                }}>
                  <option value="">-- Department --</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={Number(d.id)}>
                      {d.name ?? d.data?.name ?? d.data?.department_name ?? `Department ${d.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <div style={s.label}>Service <span style={{ color: '#b91c1c' }}>*</span></div>
                <select style={s.select} value={serviceId} disabled={!departmentId} onChange={e => setServiceId(e.target.value)}>
                  <option value="">-- Service --</option>
                  {services.map((sv: any) => <option key={sv.service_id ?? sv.id} value={sv.service_id ?? sv.id}>{sv.service_name ?? sv.name}</option>)}
                </select>
              </div>

              {/* Form Type */}
              <div>
                <div style={s.label}>Form Type <span style={{ color: '#b91c1c' }}>*</span></div>
                <select style={s.select} value={formTypeId} onChange={e => setFormTypeId(e.target.value)}>
                  <option value="">-- Form Type --</option>
                  {meta?.form_types.map(ft => <option key={ft.id} value={ft.id}>{ft.name} ({ft.abbr})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* File upload */}
          <div style={s.panel}>
            <h2 style={{ ...s.title, fontSize: 16, marginBottom: 4 }}>
              <i className="bi bi-file-earmark-arrow-up" style={{ marginRight: 8, color: '#2563eb' }} />
              Upload BAP SRS Document
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
                  <div style={s.sub}>AI will read the SRS and extract form structure, tenant, department, service, and master data automatically.</div>
                </div>
                <button
                  style={{ ...s.btnPri, opacity: (generating || !formTypeId || !tenantId || !departmentId || !serviceId) ? 0.6 : 1, fontSize: 15, padding: '12px 28px' }}
                  disabled={generating || !formTypeId || !tenantId || !departmentId || !serviceId}
                  onClick={handleGenerate}
                >
                  {generating
                    ? <><i className="bi bi-hourglass-split" /> {GEN_MESSAGES[genMsgIdx]}</>
                    : <><i className="bi bi-magic" /> Generate Form JSON</>}
                </button>
              </div>
              {genErr && <div style={{ ...s.alert('error'), marginTop: 12 }}><i className="bi bi-exclamation-triangle" /> {genErr}</div>}
              {(!tenantId || !departmentId || !serviceId || !formTypeId) && (
                <div style={{ ...s.alert('error'), marginTop: 12, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <i className="bi bi-info-circle" /> Please select Tenant, Department, Service and Form Type before generating.
                </div>
              )}
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

            {/* AI-extracted pipeline info */}
            {genResult.generated_json && (
              <PipelineInfoPanel pipeline={genResult.generated_json.pipeline as Record<string, unknown> | undefined} />
            )}

            {/* Validation result */}
            {genResult.validation && <ValidationPanel v={genResult.validation} />}

            {/* Version info */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={s.badge(genResult.version_info.action === 'INSERT_NEW' ? 'blue' : genResult.version_info.action === 'NO_CHANGE' ? 'amber' : 'green')}>
                <i className={`bi ${genResult.version_info.action === 'INSERT_NEW' ? 'bi-plus-circle' : genResult.version_info.action === 'NO_CHANGE' ? 'bi-dash-circle' : 'bi-arrow-up-circle'}`} />
                {genResult.version_info.action} — {genResult.version_info.version}
              </span>
            </div>

            {(genResult.version_info.changes ?? []).length > 0 && (
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

          {/* Document Checklist JSON */}
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
            {genResult.checklist_error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12, color: '#b91c1c' }}>
                <strong>Agent 2 Error:</strong> {genResult.checklist_error}
              </div>
            )}
            {!genResult.checklist_json && !genResult.checklist_error && (
              <div style={{ background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 8, padding: 12, fontSize: 12, color: '#9a3412' }}>
                Document checklist not generated (no FILE fields found or Agent 2 disabled).
              </div>
            )}
            {genResult.checklist_json && docjsonExpanded && (
              <textarea
                style={{ ...s.textarea, minHeight: 400, fontSize: 12, background: '#f8fafc' }}
                defaultValue={JSON.stringify(genResult.checklist_json, null, 2)}
              />
            )}
            {genResult.checklist_json && !docjsonExpanded && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {JSON.stringify(genResult.checklist_json).slice(0, 300)}…
              </div>
            )}
          </div>

          {/* Workflow Panel */}
          <div style={s.panel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ ...s.title, fontSize: 16 }}>
                <i className="bi bi-diagram-3" style={{ marginRight: 8, color: '#7c3aed' }} />
                Workflow Configuration
              </h2>
              {workflowJson && (
                <button style={s.btnPri} onClick={() => setShowWorkflow(prev => !prev)}>
                  {showWorkflow ? <><i className="bi bi-eye-slash" /> Hide Workflow</> : <><i className="bi bi-eye" /> Show Workflow</>}
                </button>
              )}
            </div>

            {!workflowJson && (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No workflow generated yet.
              </div>
            )}

            {workflowJson && showWorkflow && (
              <>
                <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <WorkflowDiagram
                    workflowJson={(workflowJson as any)?.workflow_definition || workflowJson}
                  />
                </div>
                {/* <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                  <span><i className="bi bi-list-ol" style={{ marginRight: 4 }} />{workflowJson.workflow_steps?.length ?? 0} workflow steps</span>
                  <span><i className="bi bi-file-earmark-text" style={{ marginRight: 4 }} />{workflowJson.officer_forms?.length ?? 0} officer forms</span>
                </div> */}
                <button style={{ ...s.btnSec, marginBottom: 10 }} onClick={() => setWorkflowExpanded(x => !x)}>
                  {workflowExpanded ? 'Collapse JSON' : 'Expand JSON'}
                </button>
                {workflowExpanded ? (
                  <textarea style={{ ...s.textarea, minHeight: 400, fontSize: 12, background: '#faf5ff' }} value={JSON.stringify(workflowJson, null, 2)} readOnly />
                ) : (
                  <div style={{ background: '#faf5ff', borderRadius: 8, padding: 12, fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                    {JSON.stringify(workflowJson).slice(0, 300)}…
                  </div>
                )}
              </>
            )}

            {workflowErr && <div style={{ ...s.alert('error'), marginTop: 10 }}><i className="bi bi-exclamation-triangle" /> {workflowErr}</div>}
            {workflowInsertResult && (
              <div style={{ ...s.alert('success'), marginTop: 10 }}>
                <i className="bi bi-check-circle-fill" /> Workflow inserted: {JSON.stringify(workflowInsertResult).slice(0, 120)}
              </div>
            )}
          </div>

          {/* Approve & Insert */}
          <div style={s.panel}>
            {insertErr && <div style={{ ...s.alert('error'), marginBottom: 16 }}><i className="bi bi-exclamation-triangle" /> {insertErr}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <a
                href="/AI_TestCases_20260324.xlsx"
                download="AI_TestCases_20260324.xlsx"
                style={{ ...s.btnSec, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <i className="bi bi-file-earmark-excel" /> Download Test Cases
              </a>
              <button style={s.btnSec} onClick={() => setStep('upload')}>
                <i className="bi bi-arrow-left" /> Edit SRS Text
              </button>
              {/* <button
                style={{ ...s.btnPri, opacity: inserting ? 0.6 : 1 }}
                disabled={inserting || !genResult.generated_json || (genResult.version_info.action === 'NO_CHANGE' && !forceNew) || (genResult.validation && !genResult.validation.is_valid)}
                onClick={handleInsert}
              >
                {inserting
                  ? <><i className="bi bi-hourglass-split" /> Inserting…</>
                  : <><i className="bi bi-database-check" /> Finalize &amp; Insert into DB</>}
              </button> */}

              <button
                style={{ ...s.btnPri, opacity: inserting ? 0.6 : 1 }}
                disabled={
                  inserting ||
                  (!genResult.generated_json && !genResult.workflow_json) ||
                  (genResult.generated_json && genResult.version_info.action === 'NO_CHANGE' && !forceNew) ||
                  (genResult.generated_json && genResult.validation && !genResult.validation.is_valid)
                }
                onClick={handleInsert}
              >
                {inserting
                  ? <><i className="bi bi-hourglass-split" /> Inserting…</>
                  : <><i className="bi bi-database-check" />{(!genResult.generated_json && genResult.workflow_json) ? ' Insert Workflow Only' : ' Finalize & Insert into DB'}</>}
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
  );
}
