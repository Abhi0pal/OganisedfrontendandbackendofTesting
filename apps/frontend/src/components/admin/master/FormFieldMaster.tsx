'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import {
  useFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  useToggleFormField,
} from '@/hooks/master/useFormFields';
import { useFormCategoryRoots } from '@/hooks/master/useFormCategoryRoots';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';

type FormField = {
  id: number;
  uid?: string | null;
  formCheckId: string;
  name: string;
  nameInHindi?: string | null;
  parentId: number;
  categoryId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: number | null;
  projectId?: number | null;
  tenant?: { id: number; name: string; tenant_ID?: string | null } | null;
  project?: { id: number; name: string; project_ID?: string | null; code: string } | null;
};

const ui = {
  addBtn: {
    borderRadius: 999,
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    border: '1px solid #15803d',
    boxShadow: '0 8px 18px rgba(22, 163, 74, 0.2)',
    fontWeight: 600,
  } as const,
  shell: { display: 'grid', gap: 14 } as const,
  hero: {
    border: '1px solid #dbeafe',
    borderRadius: 14,
    background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
    padding: 14,
  } as const,
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
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
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #bfdbfe',
    background: '#fff',
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 600,
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
};

export const FormFieldMaster = () => {
  const { data: fields = [], isLoading } = useFormFields();
  const { data: roots = [] } = useFormCategoryRoots();
  const { data: tenants = [] } = useTenants();

  const rootCategoryOptions = useMemo(
    () =>
      roots.map((r: any) => ({
        label: `${r.categoryCode} - ${r.categoryName}`,
        value: r.id,
      })),
    [roots],
  );

  const createMutation = useCreateFormField();
  const updateMutation = useUpdateFormField();
  const deleteMutation = useDeleteFormField();
  const toggleMutation = useToggleFormField();

  const toastRef = useRef<Toast>(null);
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameInHindi: '',
    categoryId: '',
    isActive: true,
    tenantId: null as number | null,
    projectId: null as number | null,
  });

  const { data: tenantProjects = [] } = useTenantProjects(selectedTenantId);

  const tenantOptions = useMemo(
    () => tenants.map((t: any) => ({ label: t.name, value: t.id })),
    [tenants],
  );

  const projectOptions = useMemo(
    () => tenantProjects.map((p: any) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
    [tenantProjects],
  );

  const handleEdit = useCallback((r: FormField) => {
    const tId = r.tenantId ?? null;
    setSelectedTenantId(tId);
    setFormData({
      name: r.name || '',
      nameInHindi: r.nameInHindi || '',
      categoryId: r.categoryId ? String(r.categoryId) : '',
      isActive: r.isActive,
      tenantId: tId,
      projectId: r.projectId ?? null,
    });
    setEditingId(r.id);
    setShowDialog(true);
  }, []);

  const handleToggle = useCallback(
    async (r: FormField) => {
      try {
        await toggleMutation.mutateAsync(r.id);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Status updated' });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to update status';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [toggleMutation],
  );

  const handleDelete = useCallback(
    async (r: FormField) => {
      if (!confirm(`Delete ${r.formCheckId} - ${r.name}?`)) return;
      try {
        await deleteMutation.mutateAsync(r.id);
        toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Form field deleted' });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to delete';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [deleteMutation],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const payload = {
        name: formData.name.trim(),
        nameInHindi: formData.nameInHindi?.trim() || undefined,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        isActive: formData.isActive,
        tenantId: formData.tenantId ?? undefined,
        projectId: formData.projectId ?? undefined,
      };

      if (!payload.name) {
        toastRef.current?.show({ severity: 'warn', summary: 'Missing field label', detail: 'Please enter Field Label.' });
        return;
      }

      try {
        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: payload });
          toastRef.current?.show({ severity: 'success', summary: 'Updated', detail: 'Form field updated' });
        } else {
          await createMutation.mutateAsync(payload);
          toastRef.current?.show({ severity: 'success', summary: 'Created', detail: 'Form field created' });
        }

        setShowDialog(false);
        setEditingId(null);
        setSelectedTenantId(null);
        setFormData({ name: '', nameInHindi: '', categoryId: '', isActive: true, tenantId: null, projectId: null });
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to save';
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
      }
    },
    [editingId, formData, createMutation, updateMutation],
  );

  const tableConfig: ReusableDataTableConfig<FormField> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '4%', filterType: 'number' },
        {
          field: 'tenant',
          header: 'Tenant Name',
          width: '12%',
          filterType: 'text',
          body: (row) => row.tenant ? <span>{row.tenant.name}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'tenantId',
          header: 'Tenant Code',
          width: '8%',
          filterType: 'text',
          body: (row) => row.tenant?.tenant_ID ? <span>{row.tenant.tenant_ID}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'project',
          header: 'Project Name',
          width: '12%',
          filterType: 'text',
          body: (row) => row.project ? <span>{row.project.name}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'projectId',
          header: 'Project Code',
          width: '8%',
          filterType: 'text',
          body: (row) => row.project ? <span>{row.project.project_ID || row.project.code}</span> : <span className="text-muted">—</span>,
        },
        { field: 'formCheckId', header: 'Code', width: '12%', filterType: 'text' },
        { field: 'name', header: 'Field Label', width: '16%', filterType: 'text' },
        { field: 'nameInHindi', header: 'Field Label (Hindi)', width: '14%', filterType: 'text' },
        { field: 'parentId', header: 'Parent ID', width: '6%', filterType: 'number' },
        { field: 'categoryId', header: 'Category ID', width: '6%', filterType: 'number' },
        {
          field: 'isActive',
          header: 'Status',
          width: '10%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              {row.isActive ? (
                <>
                  <CheckCircle size={14} style={{ color: '#28a745' }} />
                  <span style={{ color: '#28a745', fontWeight: 600 }}>Active</span>
                </>
              ) : (
                <>
                  <XCircle size={14} style={{ color: '#dc3545' }} />
                  <span style={{ color: '#dc3545', fontWeight: 600 }}>Inactive</span>
                </>
              )}
            </div>
          ),
        },
        {
          field: 'createdAt',
          header: 'Created',
          width: '12%',
          filterType: 'date',
          body: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      globalFilterFields: ['formCheckId', 'name'],
      emptyMessage: 'No form fields found.',
    }),
    [],
  );

  const rowActions: RowAction<FormField>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: (r) => handleEdit(r) },
      {
        icon: 'pi pi-check',
        label: 'Activate',
        severity: 'success',
        onClick: (r) => handleToggle(r),
        visible: (r) => !r.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (r) => handleToggle(r),
        visible: (r) => r.isActive,
      },
      { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: (r) => handleDelete(r) },
    ],
    [handleDelete, handleEdit, handleToggle],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1 className="h2 mb-3">Form Field Master</h1>
        <Toolbar
          left={() => (
            <Button
              label="Add Field"
              icon="pi pi-plus"
              severity="success"
              style={ui.addBtn}
              onClick={() => {
                setSelectedTenantId(null);
                setFormData({ name: '', nameInHindi: '', categoryId: '', isActive: true, tenantId: null, projectId: null });
                setEditingId(null);
                setShowDialog(true);
              }}
            />
          )}
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className={`pi ${editingId ? 'pi-pencil' : 'pi-plus-circle'}`} style={{ color: '#2563eb' }} />
            <span style={{ fontWeight: 700 }}>{editingId ? 'Edit Field' : 'Add New Field'}</span>
            <span style={{ ...ui.badge, borderColor: '#fca5a5', color: '#991b1b', background: '#fef2f2' }}>v2-HI</span>
          </div>
        }
        modal
        style={{ width: 'min(760px, 96vw)' }}
        draggable={false}
      >
        <div ref={dialogContentRef}>
          <form onSubmit={handleSubmit}>
            <div style={ui.shell}>
              <div style={ui.hero}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  {editingId ? 'Update field master record' : 'Create a new field master record'}
                </div>
                <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
                  Field Label is required. Category (Root) is optional and can be assigned later.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={ui.badge}>
                    <i className="pi pi-tag" style={{ fontSize: 11 }} />
                    {editingId ? `Editing #${editingId}` : 'New Field'}
                  </span>
                  <span style={ui.badge}>
                    <i className="pi pi-sitemap" style={{ fontSize: 11 }} />
                    Category Root Optional
                  </span>
                </div>
              </div>

              <div style={ui.section}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={ui.label}>Field Label *</label>
                    <InputText
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: (e.target as HTMLInputElement).value }))}
                      required
                      className="w-100"
                      placeholder="Enter field label"
                    />
                    <div style={ui.helper}>Example: Applicant Name, Project Cost, District</div>
                    <label style={{ ...ui.label, marginTop: 10 }}>Field Label (Hindi)</label>
                    <InputText
                      value={formData.nameInHindi}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, nameInHindi: (e.target as HTMLInputElement).value }))
                      }
                      className="w-100"
                      placeholder="Enter field label in Hindi"
                    />
                  </div>

                  <div>
                    <label style={ui.label}>Tenant</label>
                    <Dropdown
                      value={formData.tenantId}
                      options={tenantOptions}
                      onChange={(e) => {
                        setSelectedTenantId(e.value ?? null);
                        setFormData((p) => ({ ...p, tenantId: e.value ?? null, projectId: null }));
                      }}
                      placeholder="Select Tenant"
                      className="w-100"
                      filter
                      showClear
                      appendTo="self"
                    />
                  </div>

                  <div>
                    <label style={ui.label}>Project</label>
                    <Dropdown
                      value={formData.projectId}
                      options={projectOptions}
                      onChange={(e) => setFormData((p) => ({ ...p, projectId: e.value ?? null }))}
                      placeholder={formData.tenantId ? 'Select Project' : 'Select Tenant first'}
                      className="w-100"
                      filter
                      showClear
                      appendTo="self"
                      disabled={!formData.tenantId}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={ui.label}>Category (Root)</label>
                    <Dropdown
                      value={formData.categoryId ? Number(formData.categoryId) : null}
                      options={rootCategoryOptions}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          categoryId: e.value ? String(e.value) : '',
                        }))
                      }
                      placeholder="Optional: Select Category"
                      className="w-100"
                      filter
                      showClear
                      appendTo="self"
                      panelClassName="pfield-panel"
                      panelStyle={{ maxWidth: '100%', maxHeight: '40vh', overflowY: 'auto' }}
                      valueTemplate={(opt, props) =>
                        opt ? (
                          <span className="text-truncate" title={opt.label} style={{ maxWidth: '100%' }}>
                            {opt.label}
                          </span>
                        ) : (
                          <span className="text-muted">{props.placeholder}</span>
                        )
                      }
                    />
                    <div style={ui.helper}>
                      Optional. Leave blank to create a standalone/root field without category mapping.
                    </div>
                  </div>
                </div>
              </div>

              <div style={ui.section}>
                <label style={ui.label}>Status</label>
                <div className="form-check">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="form-check-input"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: (e.target as HTMLInputElement).checked }))}
                  />
                  <label className="form-check-label" htmlFor="isActive">
                    Active
                  </label>
                </div>
                <div style={ui.helper}>
                  Inactive fields remain in master data but can be hidden from selection workflows.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 12,
                }}
              >
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {formData.categoryId
                    ? 'Field will be created under the selected category root.'
                    : 'Field will be created as a standalone/root field.'}
                </div>
                <div className="d-flex gap-2">
                  <Button
                    label="Cancel"
                    icon="pi pi-times"
                    type="button"
                    onClick={() => setShowDialog(false)}
                    style={ui.btnSecondary}
                  />
                  <Button
                    label={editingId ? 'Update Field' : 'Create Field'}
                    icon="pi pi-check"
                    type="submit"
                    loading={createMutation.isPending || updateMutation.isPending}
                    style={ui.btnPrimary}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </Dialog>

      <ReusableDataTable<FormField> data={fields} config={tableConfig} loading={isLoading} rowActions={rowActions} />

      <style jsx>{`
        :global(.pfield-panel) {
          max-width: 100%;
          min-width: 100%;
          width: auto;
          box-sizing: border-box;
        }
        :global(.pfield-panel .p-dropdown-items .p-dropdown-item) {
          white-space: normal;
          word-break: break-word;
          line-height: 1.3;
        }
        :global(.pfield-panel .p-dropdown-filter-container) {
          max-width: 100%;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};
