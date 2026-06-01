'use client';

import { CheckCircle, XCircle, Hash } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
  useDocumentTypes,
  useCreateDocumentType,
  useUpdateDocumentType,
  useDeleteDocumentType,
  useToggleDocumentType,
} from '@/hooks/master/useDocumentTypes';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { documentTypeExportConfig } from '@/lib/export-configs';

interface DocumentType {
  id: number;
  uid?: string;
  name: string;
  abbreviation: string;
  isDocActive: boolean;
  isFormatRequired?: boolean;
  tenant_id?: number | null;
  tenant_project_id?: number | null;
  createdAt: string;
  updatedAt: string;
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

export const DocumentTypeMaster = () => {
  const { data: documentTypes = [], isLoading } = useDocumentTypes();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants({ isActive: true });
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const { data: tenantProjects = [], isLoading: projectsLoading } = useTenantProjects(selectedTenantId);
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();
  const deleteMutation = useDeleteDocumentType();
  const toggleMutation = useToggleDocumentType();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    isDocActive: true,
    isFormatRequired: false,
    tenant_id: null as number | null,
    tenant_project_id: null as number | null,
  });

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
  } = useDataTableManager<DocumentType>(documentTypes);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    documentTypeExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tenantOptions = useMemo(
    () => tenants.map((t: Tenant) => ({ label: t.name, value: t.id })),
    [tenants]
  );

  const tenantProjectOptions = useMemo(
    () => tenantProjects.map((tp: TenantProject) => ({ label: tp.name, value: tp.id })),
    [tenantProjects]
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<DocumentType> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Document Type Name',
          width: '35%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'abbreviation',
          header: 'Abbreviation',
          width: '15%',
          filterType: 'text',
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <Hash size={14} style={{ color: '#0d6efd' }} />
              <span style={{ color: '#0d6efd', fontFamily: 'monospace', fontWeight: 500 }}>
                {row.abbreviation}
              </span>
            </div>
          ),
        },
        {
          field: 'isFormatRequired',
          header: 'Format Required',
          width: '12%',
          filterType: 'select',
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          body: (row) => (
            <Tag
              value={row.isFormatRequired === true ? 'Yes' : row.isFormatRequired === false ? 'No' : 'N/A'}
              severity={row.isFormatRequired === true ? 'success' : 'info'}
            />
          ),
        },
        {
          field: 'isDocActive',
          header: 'Status',
          width: '12%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              {row.isDocActive ? (
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
      globalFilterFields: ['name', 'abbreviation'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No document types found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<DocumentType>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (documentType) => handleEdit(documentType),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (documentType) => handleToggle(documentType),
        tooltip: 'Toggle Status',
        visible: (documentType) => !documentType.isDocActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (documentType) => handleToggle(documentType),
        tooltip: 'Deactivate',
        visible: (documentType) => documentType.isDocActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (documentType) => handleDelete(documentType),
        tooltip: 'Delete',
      },
    ],
    []
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
      try {
        if (!formData.tenant_id) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Tenant is required',
          });
          return;
        }

        if (!formData.name) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Document Type Name is required',
          });
          return;
        }

        if (!formData.abbreviation) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Abbreviation is required',
          });
          return;
        }

        const submitData = {
          name: formData.name,
          abbreviation: formData.abbreviation,
          isDocActive: formData.isDocActive,
          isFormatRequired: formData.isFormatRequired || false,
          tenant_id: formData.tenant_id,
          tenant_project_id: formData.tenant_project_id || null,
        };

        console.log('📤 Submitting Document Type Data:', submitData);
        console.log('🔍 Tenant ID:', formData.tenant_id, ' | Tenant Project ID:', formData.tenant_project_id);

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Type updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Type created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving document type',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((documentType: DocumentType) => {
    setFormData({
      name: documentType.name,
      abbreviation: documentType.abbreviation,
      isDocActive: documentType.isDocActive,
      isFormatRequired: documentType.isFormatRequired || false,
      tenant_id: documentType.tenant_id || null,
      tenant_project_id: documentType.tenant_project_id || null,
    });
    setEditingId(documentType.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (documentType: DocumentType) => {
      if (confirm(`Are you sure you want to delete ${documentType.name}?`)) {
        try {
          await deleteMutation.mutateAsync(documentType.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Type deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting document type',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (documentType: DocumentType) => {
      try {
        await toggleMutation.mutateAsync(documentType.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Document Type ${documentType.isDocActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating document type status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      abbreviation: '',
      isDocActive: true,
      isFormatRequired: false,
      tenant_id: null,
      tenant_project_id: null,
    });
    setEditingId(null);
    setSelectedTenantId(null);
  }, []);

  // Wrapper functions for export with loading state
  const handleCSVExport = useCallback(async () => {
    setExporting(true);
    await handleExportCSV(filteredData);
    setExporting(false);
  }, [handleExportCSV, filteredData]);

  const handleExcelExport = useCallback(async () => {
    setExporting(true);
    await handleExportExcel(filteredData);
    setExporting(false);
  }, [handleExportExcel, filteredData]);

  const handlePDFExport = useCallback(async () => {
    setExporting(true);
    await handleExportPDF(filteredData);
    setExporting(false);
  }, [handleExportPDF, filteredData]);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Document Type"
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
      />
    ),
    [resetForm]
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
          onClick={handleCSVExport}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="Excel"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={handleExcelExport}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          onClick={handlePDFExport}
          loading={exporting}
          disabled={isLoading}
        />
      </div>
    ),
    [
      exporting,
      isLoading,
      handleCSVExport,
      handleExcelExport,
      handlePDFExport,
      clearFilters,
      handleGlobalFilterChange,
      handleFiltersChange,
    ]
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Document Type Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Document Type' : 'Add New Document Type'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
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
              required
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
            <label htmlFor="name" className="form-label">
              Document Type Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter document type name"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="abbreviation" className="form-label">
              Abbreviation *
            </label>
            <InputText
              id="abbreviation"
              name="abbreviation"
              value={formData.abbreviation}
              onChange={handleInputChange}
              placeholder="e.g., DT-AP"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isDocActive"
                name="isDocActive"
                type="checkbox"
                className="form-check-input"
                checked={formData.isDocActive}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isDocActive">
                Active
              </label>
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isFormatRequired"
                name="isFormatRequired"
                type="checkbox"
                className="form-check-input"
                checked={formData.isFormatRequired}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="isFormatRequired">
                Format Required
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
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<DocumentType>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
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
