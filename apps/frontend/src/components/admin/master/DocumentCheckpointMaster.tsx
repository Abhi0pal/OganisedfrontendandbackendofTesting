'use client';

import { CheckCircle, XCircle } from "lucide-react";
import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
  useDocumentCheckpoints,
  useCreateDocumentCheckpoint,
  useUpdateDocumentCheckpoint,
  useDeleteDocumentCheckpoint,
  useToggleDocumentCheckpoint,
} from '@/hooks/master/useDocumentCheckpoints';
import { useStates } from '@/hooks/master/useStates';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { documentCheckpointExportConfig } from '@/lib/export-configs';

interface DocumentCheckpoint {
  id: number;
  uid?: string;
  name: string;
  code: string;
  isActive: boolean;
  created?: string;
  modified?: string;
  filePath?: string;
  tenant_id?: number | null;
  tenant_project_id?: number | null;
  createdAt: string;
  updatedAt: string;
  stateName?: string;
  stateId?: number;
}

interface State {
  id: number;
  name: string;
  abbreviation: string;
  isActive: boolean;
}

interface Tenant {
  id: number;
  name: string;
  is_active: boolean;
}

interface TenantProject {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  tenant_id: number;
}

export const DocumentCheckpointMaster = () => {
  const { data: checkpoints = [], isLoading } = useDocumentCheckpoints();
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants({ isActive: true });
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const { data: tenantProjects = [], isLoading: projectsLoading } = useTenantProjects(selectedTenantId);
  const createMutation = useCreateDocumentCheckpoint();
  const updateMutation = useUpdateDocumentCheckpoint();
  const deleteMutation = useDeleteDocumentCheckpoint();
  const toggleMutation = useToggleDocumentCheckpoint();

  const statesLoadingRef = useRef(statesLoading);
  const statesRef = useRef(states);

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [nextCodeNumber, setNextCodeNumber] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isActive: true,
    filePath: '',
    tenant_id: null as number | null,
    tenant_project_id: null as number | null,
  });

  useEffect(() => {
    statesLoadingRef.current = statesLoading;
  }, [statesLoading]);

  useEffect(() => {
    statesRef.current = states;
  }, [states]);

  const {
    data: tableData,
    selectedRows,
    filteredData,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<DocumentCheckpoint>(checkpoints);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    documentCheckpointExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const activeStates = useMemo(
    () => states.filter((state: { id: number; name: string; abbreviation?: string; isActive: boolean }) => state.isActive),
    [states]
  );

  const stateOptions = useMemo(
    () => activeStates.map((s: { id: number; name: string }) => ({ label: s.name, value: s.id })),
    [activeStates]
  );

  const tenantOptions = useMemo(
    () => tenants.map((t: Tenant) => ({ label: t.name, value: t.id })),
    [tenants]
  );

  const tenantProjectOptions = useMemo(
    () => tenantProjects.map((tp: TenantProject) => ({ label: tp.name, value: tp.id })),
    [tenantProjects]
  );


  const selectedState = useMemo(() => {
    if (!selectedStateId) return null;
    let found = activeStates.find((s: State) => s.id === selectedStateId);
    if (!found) {
      found = states.find((s: State) => s.id === selectedStateId);
    }
    return found || null;
  }, [activeStates, states, selectedStateId]);

  const calculateNextCodeNumber = useCallback(
    (stateAbbr: string) => {
      if (!stateAbbr) return 1;
      const stateCheckpoints = checkpoints.filter((cp) => cp.code.startsWith(stateAbbr));
      if (stateCheckpoints.length === 0) {
        return 1;
      }
      const numbers = stateCheckpoints.map((cp) => {
        const match = cp.code.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxNumber = Math.max(...numbers);
      return maxNumber + 1;
    },
    [checkpoints]
  );

  const handleStateChange = useCallback(
    (e: any) => {
      const stateId = e.value;
      setSelectedStateId(stateId);
      const state = activeStates.find((s: State) => s.id === stateId);
      if (state && state.abbreviation) {
        const nextNum = calculateNextCodeNumber(state.abbreviation);
        setNextCodeNumber(nextNum);
        const generatedCode = `${state.abbreviation}-DCP-${String(nextNum).padStart(4, '0')}`;
        setFormData((prev) => ({
          ...prev,
          code: generatedCode,
        }));
      } else {
        setNextCodeNumber(1);
        setFormData((prev) => ({
          ...prev,
          code: '',
        }));
      }
    },
    [activeStates, calculateNextCodeNumber]
  );

  const tableConfig: ReusableDataTableConfig<DocumentCheckpoint> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '8%', filterType: 'none' },
        {
          field: 'name',
          header: 'Checkpoint Name',
          width: '40%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'code',
          header: 'Code',
          width: '15%',
          filterType: 'text',
          body: (row) => <span className="badge bg-primary">{row.code}</span>,
        },
        {
          field: 'isActive',
          header: 'Status',
          width: '15%',
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
          header: 'Created Date',
          width: '15%',
          filterType: 'date',
          body: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['name', 'code'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No document checkpoints found.',
    }),
    []
  );

  // ✅ FIXED: Direct function with current closure values (no stale state)
  const handleEdit = useCallback((checkpoint: DocumentCheckpoint) => {
    console.log('🔍 EDIT - Checkpoint Data:', checkpoint);

    // ✅ Uses CURRENT values via refs - NEVER stale!
    if (statesLoadingRef.current || statesRef.current.length === 0) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Please wait',
        detail: 'States are still loading. Try again in a moment.',
      });
      return;
    }

    let resolvedStateId: number | null = null;
    const stateAbbr = checkpoint.code.split('-')[0].toUpperCase().trim();
    console.log('🔍 Extracted State Abbreviation from code:', stateAbbr);
    console.log('📊 States available for lookup:', statesRef.current.length);

    const stateFromCode = statesRef.current.find(
      (s: State) => s.abbreviation && s.abbreviation.toUpperCase().trim() === stateAbbr
    );
    resolvedStateId = stateFromCode?.id || null;
    console.log('✅ Found state from array:', stateFromCode?.name, 'ID:', resolvedStateId);

    setSelectedStateId(resolvedStateId);
    setFormData({
      name: checkpoint.name,
      code: checkpoint.code,
      isActive: checkpoint.isActive,
      filePath: checkpoint.filePath || '',

      tenant_id: checkpoint.tenant_id ?? null,
      tenant_project_id: checkpoint.tenant_project_id ?? null,

    });
    setEditingId(checkpoint.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (checkpoint: DocumentCheckpoint) => {
      if (confirm(`Are you sure you want to delete this checkpoint?`)) {
        try {
          await deleteMutation.mutateAsync(checkpoint.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Checkpoint deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting checkpoint',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (checkpoint: DocumentCheckpoint) => {
      try {
        await toggleMutation.mutateAsync(checkpoint.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Checkpoint ${checkpoint.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating checkpoint status',
        });
      }
    },
    [toggleMutation]
  );

  // ✅ FIXED: No more stale state - direct function references
  const rowActions: RowAction<DocumentCheckpoint>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: handleEdit, // ✅ Direct reference - always current
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: handleToggle,
        tooltip: 'Toggle Status',
        visible: (checkpoint) => !checkpoint.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: handleToggle,
        tooltip: 'Deactivate',
        visible: (checkpoint) => checkpoint.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: handleDelete,
        tooltip: 'Delete',
      },
    ],
    [handleEdit, handleToggle, handleDelete] // ✅ Only stable callback dependencies
  );

  const handleInputChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target || e;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedStateId && !editingId) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'State must be selected',
        });
        return;
      }

      if (!formData.code) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Checkpoint Code is required',
        });
        return;
      }

      if (!formData.name) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Checkpoint Name is required',
        });
        return;
      }

      if (!formData.tenant_id) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Tenant is required',
        });
        return;
      }

      try {
        const submitData = {
          name: formData.name,
          code: formData.code,
          isActive: formData.isActive,
          filePath: formData.filePath || null,
          tenant_id: formData.tenant_id,
          tenant_project_id: formData.tenant_project_id || null,
        };
        console.log('📤 Submitting Document Checkpoint Data:', submitData);
        console.log('🔍 Tenant ID:', formData.tenant_id, ' | Tenant Project ID:', formData.tenant_project_id);
        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData })
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Checkpoint updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Checkpoint created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving checkpoint',
        });
      }
    },
    [formData, editingId, selectedStateId, createMutation, updateMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      code: '',
      isActive: true,
      filePath: '',
      tenant_id: null,
      tenant_project_id: null,
    });
    setSelectedStateId(null);
    setSelectedTenantId(null);
    setNextCodeNumber(1);
    setEditingId(null);
  }, [])

  // ✅ FIXED: Export handlers (same naming fix as before)
  const triggerCSVExport = useCallback(async () => {
    setExporting(true);
    await handleExportCSV(filteredData);
    setExporting(false);
  }, [handleExportCSV, filteredData]);

  const triggerExcelExport = useCallback(async () => {
    setExporting(true);
    await handleExportExcel(filteredData);
    setExporting(false);
  }, [handleExportExcel, filteredData]);

  const triggerPDFExport = useCallback(async () => {
    setExporting(true);
    await handleExportPDF(filteredData);
    setExporting(false);
  }, [handleExportPDF, filteredData]);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Checkpoint"
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          if (statesLoading) {
            toastRef.current?.show({
              severity: 'warn',
              summary: 'Please wait',
              detail: 'States are still loading.',
            });
            return;
          }
          resetForm();
          setShowDialog(true);
        }}
        disabled={statesLoading}
      />
    ),
    [resetForm, statesLoading]
  );

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange('');
            handleFiltersChange({});
          }}
        />
        <Button
          label="CSV"
          icon="pi pi-download"
          severity="info"
          rounded
          onClick={triggerCSVExport}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="Excel"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={triggerExcelExport}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          onClick={triggerPDFExport}
          loading={exporting}
          disabled={isLoading}
        />
      </div>
    ),
    [
      exporting,
      isLoading,
      triggerCSVExport,
      triggerExcelExport,
      triggerPDFExport,
      clearFilters,
      handleGlobalFilterChange,
      handleFiltersChange,
    ]
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Document Checkpoint Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={editingId ? 'Edit Checkpoint' : 'Add New Checkpoint'}
        modal
        style={{ width: '60vw' }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="tenant" className="form-label">
              Tenant *
            </label>
            <Dropdown
              id="tenant"
              name="tenant"
              value={formData.tenant_id}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  tenant_id: e.value,
                  tenant_project_id: null,
                }));
                setSelectedTenantId(e.value);
              }}
              options={tenantOptions}
              placeholder="Select Tenant"
              disabled={tenantsLoading}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="mb-3">
            <label htmlFor="tenantProject" className="form-label">
              Tenant Project
            </label>
            <Dropdown
              id="tenantProject"
              name="tenantProject"
              value={formData.tenant_project_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, tenant_project_id: e.value }))}
              options={tenantProjectOptions}
              placeholder="Select Tenant Project (Optional)"
              disabled={projectsLoading || !formData.tenant_id}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="mb-3">
            <label htmlFor="state" className="form-label">
              State * {editingId && <span className="text-muted">(Read-only)</span>}
            </label>
            {editingId ? (
              <InputText
                id="state"
                value={selectedState?.name || ''}
                disabled
                className="w-100"
                placeholder="State"
              />
            ) : (
              <Dropdown
                id="state"
                name="state"
                value={selectedStateId}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Select State"
                disabled={statesLoading}
                virtualScrollerOptions={{ itemSize: 38 }}
                className="w-100"
                showClear
                filter
              />
            )}
            {!selectedStateId && !editingId && (
              <small className="text-danger">
                ⚠️ State selection is required to generate the checkpoint code
              </small>
            )}
          </div>

          {selectedState && (
            <div className="mb-3">
              <label htmlFor="abbreviation" className="form-label">
                State Abbreviation <span className="text-muted">(Read-only)</span>
              </label>
              <InputText
                id="abbreviation"
                value={selectedState.abbreviation || ''}
                disabled
                className="w-100"
                placeholder="Auto-populated from state"
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="code" className="form-label">
              Checkpoint Code <span className="text-muted">(Auto-generated, Read-only)</span>
            </label>
            <InputText
              id="code"
              name="code"
              value={formData.code}
              placeholder="e.g., UK-DCP-0001"
              className="w-100"
              disabled
              required
            />
            {selectedState && !editingId && (
              <small className="text-muted">
                Format: {selectedState.abbreviation}-DCP-{String(nextCodeNumber).padStart(4, '0')}
              </small>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Checkpoint Name *
            </label>
            <InputTextarea
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter checkpoint name/description"
              className="w-100"
              rows={3}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="filePath" className="form-label">
              File Path
            </label>
            <InputText
              id="filePath"
              name="filePath"
              value={formData.filePath}
              onChange={handleInputChange}
              placeholder="Optional file path"
              className="w-100"
            />
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                className="form-check-input"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isActive">
                Active
              </label>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              label={editingId ? 'Update' : 'Create'}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-grow-1"
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              type="button"
              onClick={() => {
                resetForm();
                setShowDialog(false);
              }}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<DocumentCheckpoint>
        data={tableData}
        config={tableConfig}
        loading={isLoading || statesLoading} // ✅ Added statesLoading to table
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
      />
    </div>
  );
};
