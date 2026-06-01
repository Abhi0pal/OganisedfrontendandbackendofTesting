'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { AxiosError } from 'axios';
import apiClient from '@/lib/api-client';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';

interface MasterDefinition {
  id: number;
  uid: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  tenant_id?: number | null;
  project_id?: number | null;
  department_id?: string | null;       // master_data id
  sub_department_id?: string | null;   // master_data id
  tenant_name?: string | null;
  project_name?: string | null;
  department_name?: string | null;
  sub_department_name?: string | null;
  parent_master_code?: string | null;
  created_at: string;
  updated_at: string;
  _count?: { data: number };
}

interface DropdownOption {
  label: string;
  value: string | number;
}

const emptyForm = {
  name: '',
  description: '',
  display_order: 0,
  is_active: true,
  tenant_id: null as number | null,
  project_id: null as number | null,
  department_id: null as string | null,   // master_data id (BigInt → string)
  sub_department_id: null as string | null, // master_data id (BigInt → string)
  parent_master_code: null as string | null,
};

const previewCode = (name: string, nextSeq: number) => {
  if (!name.trim()) return 'M_???_###';
  const namePart = name.toUpperCase().trim().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return `M_${namePart}_${String(nextSeq).padStart(3, '0')}`;
};

export const DynamicMasterDefinition = () => {
  const toastRef = useRef<Toast>(null);
  const [definitions, setDefinitions] = useState<MasterDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Cascading dropdown data
  const [tenants, setTenants] = useState<DropdownOption[]>([]);
  const [projects, setProjects] = useState<DropdownOption[]>([]);
  const [departments, setDepartments] = useState<DropdownOption[]>([]);
  const [subDepartments, setSubDepartments] = useState<DropdownOption[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/master/definitions');
      setDefinitions(res.data || []);
    } catch (error: unknown) {
      const e = error as AxiosError<{ message: string }>;
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Failed to fetch' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      const res = await apiClient.get('/tenants');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setTenants(data.map((t: any) => ({ label: t.name, value: t.id })));
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => { fetchData(); fetchTenants(); }, [fetchData, fetchTenants]);

  // Load projects when tenant changes
  useEffect(() => {
    if (!formData.tenant_id) {
      setProjects([]);
      return;
    }
    apiClient.get(`/projects?tenant_id=${formData.tenant_id}`).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setProjects(data.map((p: any) => ({ label: p.name, value: p.id })));
    }).catch(() => setProjects([]));
  }, [formData.tenant_id]);

  // Load departments from master_data when tenant+project changes
  useEffect(() => {
    if (!formData.tenant_id || !formData.project_id) {
      setDepartments([]);
      setSubDepartments([]);
      return;
    }
    // Find the DEPARTMENT master definition for this tenant+project
    apiClient.get(`/master/definitions?tenant_id=${formData.tenant_id}`).then((res) => {
      const defs: any[] = Array.isArray(res.data) ? res.data : [];
      // Match by name containing "department" (case-insensitive) but NOT "sub"
      const deptDef = defs.find((d: any) =>
        /department/i.test(d.name) && !/sub/i.test(d.name)
      );
      if (!deptDef) { setDepartments([]); return; }
      // Fetch master_data records for that definition
      apiClient.get(`/master/data/by-master/${deptDef.id}?limit=500`).then((r) => {
        const records: any[] = r.data?.data || [];
        setDepartments(records.map((rec: any) => ({ label: rec.name, value: rec.id })));
      }).catch(() => setDepartments([]));
    }).catch(() => setDepartments([]));
  }, [formData.tenant_id, formData.project_id]);

  // Load sub-departments from master_data when department changes
  useEffect(() => {
    if (!formData.department_id || !formData.tenant_id) {
      setSubDepartments([]);
      return;
    }
    apiClient.get(`/master/definitions?tenant_id=${formData.tenant_id}`).then((res) => {
      const defs: any[] = Array.isArray(res.data) ? res.data : [];
      // Match sub-department definition
      const subDeptDef = defs.find((d: any) =>
        /sub.?department/i.test(d.name)
      );
      if (!subDeptDef) { setSubDepartments([]); return; }
      // Fetch records filtered by parent_id = selected department
      apiClient.get(`/master/data/by-master/${subDeptDef.id}?limit=500`).then((r) => {
        const records: any[] = r.data?.data || [];
        // Filter by parent_id matching selected department
        const filtered = records.filter((rec: any) =>
          rec.json_definition?.parent_id === formData.department_id ||
          String(rec.json_definition?.parent_id) === String(formData.department_id)
        );
        setSubDepartments(
          (filtered.length > 0 ? filtered : records)
            .map((rec: any) => ({ label: rec.name, value: rec.id }))
        );
      }).catch(() => setSubDepartments([]));
    }).catch(() => setSubDepartments([]));
  }, [formData.department_id, formData.tenant_id]);

  const {
    data: tableData, filters, globalFilter,
    handleGlobalFilterChange, handleFiltersChange, clearFilters,
  } = useDataTableManager<MasterDefinition>(definitions);

  const resetForm = useCallback(() => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setProjects([]);
    setDepartments([]);
    setSubDepartments([]);
  }, []);

  const handleEdit = useCallback((row: MasterDefinition) => {
    setFormData({
      name: row.name,
      description: row.description || '',
      display_order: row.display_order,
      is_active: row.is_active,
      tenant_id: row.tenant_id ?? null,
      project_id: row.project_id ?? null,
      department_id: row.department_id ? String(row.department_id) : null,
      sub_department_id: row.sub_department_id ? String(row.sub_department_id) : null,
      parent_master_code: row.parent_master_code ?? null,
    });
    setEditingId(row.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(async (row: MasterDefinition) => {
    if (!confirm(`Delete master "${row.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/master/definitions/${row.id}`);
      toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: `"${row.name}" deleted` });
      fetchData();
    } catch (error: unknown) {
      const e = error as AxiosError<{ message: string }>;
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Delete failed' });
    }
  }, [fetchData]);

  const handleToggle = useCallback(async (row: MasterDefinition) => {
    try {
      await apiClient.patch(`/master/definitions/${row.id}/toggle-active`);
      fetchData();
    } catch {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Toggle failed' });
    }
  }, [fetchData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenant_id) {
      toastRef.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please select a Tenant.' });
      return;
    }
    if (!formData.project_id) {
      toastRef.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please select a Project.' });
      return;
    }
    if (!formData.description?.trim()) {
      toastRef.current?.show({ severity: 'warn', summary: 'Required', detail: 'Description is required.' });
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        display_order: formData.display_order,
        is_active: formData.is_active,
        tenant_id: formData.tenant_id,
        project_id: formData.project_id,
        department_id: formData.department_id || null,
        sub_department_id: formData.sub_department_id || null,
        parent_master_code: formData.parent_master_code || null,
      };
      if (editingId) {
        await apiClient.patch(`/master/definitions/${editingId}`, payload);
        toastRef.current?.show({ severity: 'success', summary: 'Updated', detail: `"${formData.name}" updated` });
      } else {
        await apiClient.post('/master/definitions', payload);
        toastRef.current?.show({ severity: 'success', summary: 'Created', detail: `"${formData.name}" created` });
      }
      resetForm();
      setShowDialog(false);
      fetchData();
    } catch (error: unknown) {
      const e = error as AxiosError<{ message: string }>;
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Save failed' });
    }
  }, [formData, editingId, resetForm, fetchData]);

  const tableConfig: ReusableDataTableConfig<MasterDefinition> = useMemo(() => ({
    columns: [
      {
        field: 'tenant_name' as any,
        header: 'Tenant',
        width: '8%',
        filterType: 'text',
        body: (row) => row.tenant_name
          ? <span className="small">{row.tenant_name}</span>
          : <span className="text-muted small">—</span>,
      },
      {
        field: 'project_name' as any,
        header: 'Project',
        width: '8%',
        filterType: 'text',
        body: (row) => row.project_name
          ? <span className="small">{row.project_name}</span>
          : <span className="text-muted small">—</span>,
      },
      {
        field: 'department_name' as any,
        header: 'Dept',
        width: '8%',
        filterType: 'text',
        body: (row) => row.department_name
          ? <span className="small">{row.department_name}</span>
          : <span className="text-muted small">—</span>,
      },
      {
        field: 'sub_department_name' as any,
        header: 'Sub-Dept',
        width: '8%',
        filterType: 'text',
        body: (row) => row.sub_department_name
          ? <span className="small">{row.sub_department_name}</span>
          : <span className="text-muted small">—</span>,
      },
      {
        field: 'code',
        header: 'Code',
        width: '9%',
        filterType: 'text',
        body: (row) => (
          <span className="badge bg-primary text-white">{row.code}</span>
        ),
      },
      {
        field: 'name',
        header: 'Master Name',
        width: '14%',
        filterType: 'text',
        body: (row) => <span className="fw-semibold">{row.name}</span>,
      },
      {
        field: 'parent_master_code' as any,
        header: 'Hierarchy',
        width: '20%',
        filterType: 'none',
        body: (row: MasterDefinition) => {
          // Build full ancestor chain from definitions list
          const chain: { name: string; code: string }[] = [];
          let currentCode = row.parent_master_code;
          const visited = new Set<string>();
          while (currentCode && !visited.has(currentCode)) {
            visited.add(currentCode);
            const parent = definitions.find((d) => d.code === currentCode);
            if (!parent) break;
            chain.unshift({ name: parent.name, code: parent.code });
            currentCode = parent.parent_master_code ?? null;
          }

          if (chain.length === 0) {
            return <span className="badge bg-secondary bg-opacity-25 text-secondary small">Top Level</span>;
          }

          return (
            <div className="d-flex align-items-center flex-wrap gap-1">
              {chain.map((ancestor, idx) => (
                <span key={ancestor.code} className="d-flex align-items-center gap-1">
                  <span className="badge bg-light text-dark border small" title={ancestor.code}>
                    {ancestor.name}
                  </span>
                  <i className="pi pi-angle-right text-muted" style={{ fontSize: 10 }} />
                </span>
              ))}
              <span className="badge text-white small" style={{ background: '#333' }}>
                {row.name}
              </span>
            </div>
          );
        },
      },
      {
        field: '_count' as any,
        header: 'Records',
        width: '7%',
        filterType: 'none',
        body: (row) => (
          <Tag value={`${row._count?.data ?? 0}`} severity="info" />
        ),
      },
      {
        field: 'is_active',
        header: 'Status',
        width: '7%',
        filterType: 'select',
        filterOptions: [
          { label: 'Active', value: true },
          { label: 'Inactive', value: false },
        ],
        body: (row) => (
          <Tag value={row.is_active ? 'Active' : 'Inactive'} severity={row.is_active ? 'success' : 'danger'} />
        ),
      },
      {
        field: 'created_at',
        header: 'Created',
        width: '9%',
        filterType: 'date',
        body: (row) =>
          new Date(row.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          }),
      },
      {
        field: 'updated_at',
        header: 'Updated',
        width: '9%',
        filterType: 'date',
        body: (row) =>
          new Date(row.updated_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
          }),
      },
    ],
    dataKey: 'id',
    rows: 10,
    rowsPerPageOptions: [5, 10, 25, 50],
    globalFilterFields: ['name', 'code', 'tenant_name', 'project_name', 'department_name'],
    selectable: true,
    selectionMode: 'multiple',
    paginator: true,
    stripedRows: true,
    showGridlines: true,
    emptyMessage: 'No master definitions found.',
  }), [definitions]);

  const rowActions: RowAction<MasterDefinition>[] = useMemo(() => [
    {
      icon: 'pi pi-pencil', label: 'Edit', severity: 'info', tooltip: 'Edit',
      onClick: (row) => handleEdit(row),
    },
    {
      icon: 'pi pi-check', label: 'Activate', severity: 'success', tooltip: 'Activate',
      onClick: (row) => handleToggle(row),
      visible: (row) => !row.is_active,
    },
    {
      icon: 'pi pi-times', label: 'Deactivate', severity: 'warn', tooltip: 'Deactivate',
      onClick: (row) => handleToggle(row),
      visible: (row) => row.is_active,
    },
    {
      icon: 'pi pi-trash', label: 'Delete', severity: 'error', tooltip: 'Delete',
      onClick: (row) => handleDelete(row),
    },
  ], [handleEdit, handleToggle, handleDelete]);

  const leftToolbar = useCallback(() => (
    <Button label="Add Master" icon="pi pi-plus" severity="success"
      onClick={() => { resetForm(); setShowDialog(true); }} />
  ), [resetForm]);

  const rightToolbar = useCallback(() => (
    <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" outlined
      onClick={() => { clearFilters(); handleGlobalFilterChange(''); handleFiltersChange({}); }} />
  ), [clearFilters, handleGlobalFilterChange, handleFiltersChange]);

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1>Master Definitions</h1>
        <Toolbar left={leftToolbar} right={rightToolbar} />
      </div>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
      />

      <Dialog
        visible={showDialog}
        onHide={() => { resetForm(); setShowDialog(false); }}
        header={<div className="ey-dialog-title">{editingId ? 'Edit Master' : 'Add New Master'}</div>}
        modal className="ey-dialog" style={{ width: '56vw' }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
          {/* Row 1: Name + Code */}
          <div className="row">
            <div className="col-md-8 mb-3">
              <label className="form-label">Master Name <span className="text-danger">*</span></label>
              <InputText value={formData.name}
                onChange={(e) => {
                  const val = e.target.value.replace(/\b\w/g, (c) => c.toUpperCase());
                  setFormData(p => ({ ...p, name: val }));
                }}
                placeholder="e.g. Country" className="w-100" required />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">System Code</label>
              <div className="form-control bg-light d-flex align-items-center gap-2">
                <i className="pi pi-lock text-muted small" />
                <code className="text-primary fw-semibold small">
                  {editingId
                    ? definitions.find(d => d.id === editingId)?.code
                    : previewCode(formData.name, definitions.length + 1)}
                </code>
              </div>
              <small className="text-muted">Auto-generated. Cannot be changed.</small>
            </div>
          </div>

          {/* Row 2: Tenant + Project */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Tenant <span className="text-danger">*</span></label>
              <Dropdown
                value={formData.tenant_id}
                options={tenants}
                onChange={(e) => setFormData(p => ({
                  ...p,
                  tenant_id: e.value,
                  project_id: null,
                  department_id: null,
                  sub_department_id: null,
                }))}

                placeholder="Select Tenant"
                className="w-100"
                showClear
                filter
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Project <span className="text-danger">*</span></label>
              <Dropdown
                value={formData.project_id}
                options={projects}
                onChange={(e) => setFormData(p => ({ ...p, project_id: e.value, department_id: null, sub_department_id: null }))}
                placeholder={formData.tenant_id ? 'Select Project' : 'Select Tenant first'}
                className="w-100"
                disabled={!formData.tenant_id}
                showClear
                filter
              />
            </div>
          </div>

          {/* Row 3: Department + Sub-Department */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Department</label>
              <Dropdown
                value={formData.department_id}
                options={departments}
                onChange={(e) => setFormData(p => ({
                  ...p,
                  department_id: e.value,
                  sub_department_id: null,
                }))}
                placeholder={!formData.tenant_id ? 'Select Tenant first' : !formData.project_id ? 'Select Project first' : departments.length === 0 ? 'No departments found' : 'Select Department'}
                className="w-100"
                disabled={!formData.tenant_id || !formData.project_id}
                showClear
                filter
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Sub-Department</label>
              <Dropdown
                value={formData.sub_department_id}
                options={subDepartments}
                onChange={(e) => setFormData(p => ({ ...p, sub_department_id: e.value }))}
                placeholder={!formData.department_id ? 'Select Department first' : subDepartments.length === 0 ? 'No sub-departments found' : 'Select Sub-Department'}
                className="w-100"
                disabled={!formData.department_id}
                showClear
                filter
              />
            </div>
          </div>

          {/* Row 4: Description + Display Order */}
          <div className="row">
            <div className="col-md-8 mb-3">
              <label className="form-label">Description <span className="text-danger">*</span></label>
              <InputTextarea value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief description..." className="w-100" rows={2} />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Display Order</label>
              <InputText type="number" value={String(formData.display_order)}
                onChange={(e) => setFormData(p => ({ ...p, display_order: Number(e.target.value) }))}
                className="w-100" />
            </div>
          </div>

          {/* Parent Master (N-level hierarchy) */}
          <div className="mb-3">
            <label className="form-label">Parent Master <span className="text-muted small">(optional — for hierarchy like Country → State → District)</span></label>
            <Dropdown
              value={formData.parent_master_code}
              options={[
                { label: '— None (Top Level) —', value: null },
                ...definitions
                  .filter((d) => d.id !== editingId)
                  .map((d) => ({ label: `${d.name} (${d.code})`, value: d.code })),
              ]}
              onChange={(e) => setFormData(p => ({ ...p, parent_master_code: e.value }))}
              placeholder="Select parent master..."
              className="w-100"
              filter
              showClear
            />
            {formData.parent_master_code && (
              <small className="text-muted mt-1 d-block">
                <i className="pi pi-info-circle me-1" />
                When adding records, a parent record selector will appear automatically.
              </small>
            )}
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input id="def_is_active" className="form-check-input" type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                style={{ width: '1.25em', height: '1.25em', cursor: 'pointer', accentColor: '#22c55e' }} />
              <label className="form-check-label" htmlFor="def_is_active"
                style={{ marginLeft: '0.5rem', color: formData.is_active ? '#22c55e' : 'inherit' }}>
                Active
              </label>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">
            <Button label="Cancel" severity="secondary" type="button"
              onClick={() => { resetForm(); setShowDialog(false); }} />
            <Button label={editingId ? 'Update' : 'Create'} type="submit" />
          </div>
        </form>
      </Dialog>
    </div>
  );
};
