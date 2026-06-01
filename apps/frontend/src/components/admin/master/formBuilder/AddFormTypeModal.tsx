'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

import apiClient from '@/lib/api-client';
import { useFormTypes } from '@/hooks/master/useFormTypes';
import { STATE_PREFIX } from '@/constants/formCode';

const ui = {
  shell: {
    display: 'grid',
    gap: 14,
  } as const,
  hero: {
    border: '1px solid #dbeafe',
    background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
    borderRadius: 14,
    padding: 14,
  } as const,
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#ffffff',
    padding: 14,
  } as const,
  label: {
    display: 'block',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    fontSize: 13,
  } as const,
  helper: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
    marginTop: 6,
  } as const,
  row2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  } as const,
  row3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
  } as const,
  codeBox: {
    border: '1px solid #dbe3ef',
    borderRadius: 10,
    background: '#f8fafc',
    padding: 10,
  } as const,
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  } as const,
  btnPrimary: {
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    border: '1px solid #1d4ed8',
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.22)',
    fontWeight: 600,
  } as const,
  btnSecondary: {
    borderRadius: 999,
    background: '#fff',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
    fontWeight: 600,
  } as const,
  stat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #bfdbfe',
    background: '#ffffff',
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 600,
  } as const,
};

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;

  // allow async handler from parent (you pass async in FormBuilderMaster)
  onSuccess: () => void | Promise<void>;

  // Validation: prevent duplicate form type in same service
  existingFormTypeIds?: number[];

  // Validation: prevent duplicate generated form codes in same service
  existingFormCodes?: string[];
};

export function AddFormTypeModal({
  open,
  onClose,
  serviceId,
  onSuccess,
  existingFormTypeIds = [],
  existingFormCodes = [],
}: Props) {
  const toast = useRef<Toast>(null);

  const { data: formTypes } = useFormTypes();

  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState(''); // read-only value from server
  const [formVersion, setFormVersion] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // ✅ Context States
  const [tenants, setTenants] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const [loadingContext, setLoadingContext] = useState(false);

  const options = useMemo(() => {
    return (formTypes ?? []).map((t: any) => ({
      label: `${t.name} (${t.id})`,
      value: t.id,
    }));
  }, [formTypes]);

  // Fetch Tenants on load
  useEffect(() => {
    if (!open) return;
    const fetchTenants = async () => {
      try {
        const res = await apiClient.get('/tenants');
        setTenants(res?.data || []);
      } catch (e) {
        console.error('Failed to fetch tenants', e);
      }
    };
    fetchTenants();
  }, [open]);

  // Fetch Projects and Roles when Tenant changes
  useEffect(() => {
    if (!selectedTenantId) {
      setProjects([]);
      setRoles([]);
      return;
    }

    const fetchDetails = async () => {
      setLoadingContext(true);
      try {
        const [projRes, roleRes] = await Promise.all([
          apiClient.get('/projects', { params: { tenant_id: selectedTenantId } }),
          apiClient.get('/rbac', { params: { tenant_id: selectedTenantId } })
        ]);
        setProjects(projRes?.data || []);
        setRoles(roleRes?.data || []);
      } catch (e) {
        console.error('Failed to fetch project/role details', e);
      } finally {
        setLoadingContext(false);
      }
    };
    fetchDetails();
  }, [selectedTenantId]);

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;
    setFormTypeId(null);
    setFormName('');
    setFormVersion('');
    setFormCode('');
    setLoadingCode(false);
    setSelectedTenantId(null);
    setSelectedProjectId(null);
    setSelectedRoleId(null);
  }, [open]);

  // Fetch preview code when formTypeId changes
  useEffect(() => {
    if (!open) return;

    if (!formTypeId) {
      setFormCode('');
      return;
    }

    // Form code generation and preview...
    const fetchCode = async () => {
      setLoadingCode(true);
      try {
        const res = await apiClient.get(
          `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/preview-code`,
          { params: { formTypeId } }
        );

        const nextCode = res?.data?.formCode ?? '';

        // Prevent duplicate form code (if backend returns something already used)
        if (nextCode && existingFormCodes.includes(nextCode)) {
          setFormCode('');
          toast.current?.show({
            severity: 'warn',
            summary: 'Duplicate Code',
            detail: 'Generated Form Code already exists for this Service.',
            life: 3500,
          });
          return;
        }

        setFormCode(nextCode);
      } catch (e: any) {
        setFormCode('');
        toast.current?.show({
          severity: 'error',
          summary: 'Failed',
          detail: e?.response?.data?.message ?? 'Could not generate Form Code.',
          life: 3500,
        });
      } finally {
        setLoadingCode(false);
      }
    };

    fetchCode();
  }, [open, formTypeId, serviceId, existingFormTypeIds, existingFormCodes]);

  async function save() {
    if (!formTypeId || !formName.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Missing fields',
        detail: 'Please fill Form Type and Form Name.',
        life: 3000,
      });
      return;
    }

    // No hard block on formTypeId here anymore. 
    // The backend will handle contextual uniqueness (Service + Role + User).

    if (!formCode.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Form Code not ready',
        detail: 'Form Code could not be generated. Please try again.',
        life: 3000,
      });
      return;
    }

    // Extra safety: prevent duplicates by code too
    if (existingFormCodes.includes(formCode.trim())) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Duplicate Code',
        detail: 'This Form Code already exists for this Service.',
        life: 3000,
      });
      return;
    }

    if (formTypeId === 2 && !selectedTenantId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Tenant Required',
        detail: 'Please select a Tenant for Form Type 2.',
        life: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      await apiClient.post(
        `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms`,
        {
          form_type_id: formTypeId,
          form_name: formName,
          form_code: formCode,
          form_version: formVersion?.trim() ? formVersion.trim() : undefined,
          tenant_id: selectedTenantId,
          project_id: selectedProjectId,
          role_id: selectedRoleId,
        }
      );

      toast.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: 'Form type added successfully.',
        life: 2500,
      });

      // supports both sync and async onSuccess
      await Promise.resolve(onSuccess());

      onClose();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Could not add form type.',
        life: 3500,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="pi pi-plus-circle" style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>Add Form Type</span>
        </div>
      }
      visible={open}
      onHide={onClose}
      style={{ width: 'min(720px, 95vw)' }}
      modal
      draggable={false}
      closable={!saving}
    >
      <Toast ref={toast} />

      <div style={ui.shell}>
        <div style={ui.hero}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Create a new form mapping for this service
          </div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
            Pick a form type, give it a clear name, then save. The form code is generated automatically.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={ui.stat}>
              <i className="pi pi-briefcase" style={{ fontSize: 11 }} />
              Service: {serviceId}
            </span>
            <span style={ui.stat}>
              <i className="pi pi-list" style={{ fontSize: 11 }} />
              {existingFormTypeIds.length} Existing Type{existingFormTypeIds.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div style={ui.section}>
          <div style={ui.row2}>
            <div style={{ minWidth: 0 }}>
              <label style={ui.label}>Form Type</label>
              <Dropdown
                value={formTypeId}
                options={options}
                onChange={(e) => setFormTypeId(e.value)}
                placeholder="Select Form Type"
                className="w-100"
                filter
                showClear
                disabled={saving}
              />
              <div style={ui.helper}>
                You can create multiple versions of the same form type for different Roles or Users.
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <label style={ui.label}>Form Version (optional)</label>
              <InputText
                value={formVersion}
                onChange={(e) => setFormVersion(e.target.value)}
                className="w-100"
                placeholder="e.g. V1.0"
                disabled={saving}
              />
              <div style={ui.helper}>Use a simple label to track updates later.</div>
            </div>
          </div>
        </div>

        {/* 🏢 Context Specific Section for Form Type 2 (Officer Action) */}
        {formTypeId === 2 && (
          <div style={{ ...ui.section, backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#475569', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="pi pi-filter" style={{ fontSize: 12 }} />
              Context Specific Configuration (Required for Type 2)
            </div>
            
            <div style={ui.row3}>
               <div>
                  <label style={ui.label}>Tenant <span style={{ color: 'red' }}>*</span></label>
                  <Dropdown
                    value={selectedTenantId}
                    options={tenants.map(t => ({ label: t.name || t.tenant_name, value: t.id }))}
                    onChange={(e) => setSelectedTenantId(e.value)}
                    placeholder="Select Tenant"
                    className="w-100"
                    filter
                    disabled={saving}
                  />
               </div>
               <div>
                  <label style={ui.label}>Project</label>
                  <Dropdown
                    value={selectedProjectId}
                    options={projects.map(p => ({ label: p.name || p.project_name, value: p.id }))}
                    onChange={(e) => setSelectedProjectId(e.value)}
                    placeholder="All Projects"
                    className="w-100"
                    filter
                    disabled={saving || !selectedTenantId || loadingContext}
                    showClear
                  />
               </div>
               <div>
                  <label style={ui.label}>Role</label>
                  <Dropdown
                    value={selectedRoleId}
                    options={roles.map(r => ({ label: r.name, value: r.id }))}
                    onChange={(e) => setSelectedRoleId(e.value)}
                    placeholder="All Roles"
                    className="w-100"
                    filter
                    disabled={saving || !selectedTenantId || loadingContext}
                    showClear
                  />
               </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
              Tenant selection is required for Officer Action forms. Projects and Roles are optional filters.
            </div>
          </div>
        )}

        <div style={ui.section}>
          <div style={{ marginBottom: 12 }}>
            <label style={ui.label}>Form Name</label>
            <InputText
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-100"
              placeholder="Enter a user-friendly form name"
              disabled={saving}
            />
            <div style={ui.helper}>Example: New License Application Form</div>
          </div>

          <div>
            <label style={ui.label}>Form Code</label>
            <div style={ui.codeBox}>
              <InputText
                value={loadingCode ? 'Generating form code...' : formCode}
                className="w-100"
                readOnly
                disabled
              />
              <div style={ui.helper}>
                Auto-generated pattern: {STATE_PREFIX}-SR-{serviceId}-FRM-&lt;PK&gt;_&lt;FormTypeId(2-digit)&gt;
              </div>
            </div>
          </div>
        </div>

        <div style={ui.footer}>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            {loadingCode ? 'Preparing form code...' : 'Ready to create the form mapping.'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={onClose}
              disabled={saving}
              style={ui.btnSecondary}
            />
            <Button
              label="Save Form Type"
              icon="pi pi-check"
              onClick={save}
              loading={saving}
              disabled={saving || loadingCode || !formTypeId}
              style={ui.btnPrimary}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
