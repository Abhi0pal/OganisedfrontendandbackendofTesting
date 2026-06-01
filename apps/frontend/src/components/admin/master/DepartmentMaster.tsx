
'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag as TagIcon, Check, X } from 'lucide-react';
import { Tag } from 'primereact/tag';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useToggleDepartment,
} from '@/hooks/master/useDepartments';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { departmentExportConfig } from '@/lib/export-configs';

interface Department {
  id: number;
  name: string;
  uniqueTag: string;
  ip: string;
  secretKey: string;
  baseUrl: string;
  publicKey: string;
  abbreviation: string;
  boDeptId?: number;
  order?: number;
  icon?: string;
  issuerId?: number;
  issuer?: {
    id: number;
    name: string;
    isIssuerActive: boolean;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** ✅ Explicitly type form state to avoid literal `null` inference */
type DepartmentFormData = {
  name: string;
  uniqueTag: string;
  ip: string;
  secretKey: string;
  baseUrl: string;
  publicKey: string;
  abbreviation: string;
  boDeptId: string;   // store as string in form; parse at submit
  order: string;      // store as string in form; parse at submit
  icon: string;
  issuerId: number | null;  // ✅ critical: union type
  isActive: boolean;
};

export const DepartmentMaster = () => {
  const { data: departments = [], isLoading } = useDepartments();
  const { data: issuers = [], isLoading: issuersLoading } = useIssuers();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const toggleMutation = useToggleDepartment();

  /** Toast ref (nullable until mounted) */
  const toastRef = useRef<Toast | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  /** ✅ Selected issuer id (number | null) */
  const [selectedIssuerId, setSelectedIssuerId] = useState<number | null>(null);

  /** ✅ Typed form data to prevent null-literal issues */
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    uniqueTag: '',
    ip: '',
    secretKey: '',
    baseUrl: '',
    publicKey: '',
    abbreviation: '',
    boDeptId: '',
    order: '',
    icon: '',
    issuerId: null,         // ✅ typed as number | null
    isActive: true,
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
  } = useDataTableManager<Department>(departments);

  /** Export handlers — cast ref to satisfy non-null signature of hook */
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    departmentExportConfig,
    toastRef as React.RefObject<Toast>
  );

  /** Active issuers for dropdown */
  const activeIssuers = useMemo(
    () => issuers.filter((issuer) => issuer.isIssuerActive),
    [issuers]
  );

  const issuerOptions = useMemo(
    () => activeIssuers.map((issuer) => ({ label: issuer.name, value: issuer.id })),
    [activeIssuers]
  );

  const handleEdit = useCallback((department: Department) => {
    // Resolve issuer id: prefer `department.issuerId`, otherwise `department.issuer?.id`
    const resolvedIssuerId: number | null =
      typeof department.issuerId === 'number'
        ? department.issuerId
        : typeof department.issuer?.id === 'number'
        ? department.issuer.id
        : null;

    setSelectedIssuerId(resolvedIssuerId);

    setFormData({
      name: department.name,
      uniqueTag: department.uniqueTag,
      ip: department.ip,
      secretKey: department.secretKey,
      baseUrl: department.baseUrl,
      publicKey: department.publicKey,
      abbreviation: department.abbreviation,
      boDeptId: department.boDeptId?.toString() ?? '',
      order: department.order?.toString() ?? '',
      icon: department.icon ?? '',
      issuerId: resolvedIssuerId,       // ✅ assigns number | null to correctly typed state
      isActive: department.isActive,
    });

    setEditingId(department.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (department: Department) => {
      if (confirm(`Are you sure you want to delete ${department.name}?`)) {
        try {
          await deleteMutation.mutateAsync(department.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Department deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting department',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (department: Department) => {
      try {
        await toggleMutation.mutateAsync(department.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Department ${department.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating department status',
        });
      }
    },
    [toggleMutation]
  );

  /** Selected issuer display */
  const selectedIssuer = useMemo(() => {
    if (!selectedIssuerId) return null;
    return (
      activeIssuers.find((i) => i.id === selectedIssuerId) ||
      issuers.find((i) => i.id === selectedIssuerId) ||
      null
    );
  }, [activeIssuers, issuers, selectedIssuerId]);

  const tableConfig: ReusableDataTableConfig<Department> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Department Name',
          width: '18%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'uniqueTag',
          header: 'Unique Tag',
          width: '12%',
          filterType: 'text',
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <TagIcon size={14} style={{ color: '#0d6efd' }} />
              <span style={{ color: '#0d6efd', fontWeight: 600 }}>{row.uniqueTag}</span>
            </div>
          ),
        },
        {
          field: 'abbreviation',
          header: 'Abbreviation',
          width: '10%',
          filterType: 'text',
          body: (row) => (
            <span style={{ color: '#6c757d', fontFamily: 'monospace', fontWeight: 500 }}>
              {row.abbreviation}
            </span>
          ),
        },
        { field: 'ip', header: 'IP Address', width: '10%', filterType: 'text' },
        {
          field: 'issuer',
          header: 'Issuer Type',
          width: '15%',
          filterType: 'text',
          body: (row) => {
            const isActive = row.issuer?.isIssuerActive;
            return (
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: isActive ? '#28a745' : '#dc3545' }}>
                  {isActive ? <Check size={14} /> : <X size={14} />}
                </span>
                <span style={{ color: isActive ? '#28a745' : '#dc3545', fontWeight: 500 }}>
                  {row.issuer?.name || 'N/A'}
                </span>
              </div>
            );
          },
        },
        { field: 'order', header: 'Order', width: '8%', filterType: 'number' },
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
            <Tag value={row.isActive ? 'Active' : 'Inactive'} severity={row.isActive ? 'success' : 'danger'} />
          ),
        },
        {
          field: 'createdAt',
          header: 'Created Date',
          width: '12%',
          filterType: 'date',
          body: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['name', 'uniqueTag', 'abbreviation', 'issuer.name'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No departments found.',
    }),
    []
  );

  const rowActions: RowAction<Department>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (department) => handleEdit(department),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (department) => handleToggle(department),
        tooltip: 'Toggle Status',
        visible: (department) => !department.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (department) => handleToggle(department),
        tooltip: 'Deactivate',
        visible: (department) => department.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (department) => handleDelete(department),
        tooltip: 'Delete',
      },
    ],
    [handleEdit, handleToggle, handleDelete]
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
        /** Normalize types for backend DTO */
        const submitData = {
          name: formData.name,
          uniqueTag: formData.uniqueTag,
          ip: formData.ip,
          secretKey: formData.secretKey,
          baseUrl: formData.baseUrl,
          publicKey: formData.publicKey,
          abbreviation: formData.abbreviation,
          boDeptId: formData.boDeptId ? parseInt(formData.boDeptId, 10) : undefined, // send undefined if empty
          order: formData.order ? parseInt(formData.order, 10) : undefined,
          icon: formData.icon || undefined,
          issuerId: selectedIssuerId ?? undefined,   // number | undefined
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Department updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Department created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving department',
        });
      }
    },
    [formData, editingId, selectedIssuerId, createMutation, updateMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      uniqueTag: '',
      ip: '',
      secretKey: '',
      baseUrl: '',
      publicKey: '',
      abbreviation: '',
      boDeptId: '',
      order: '',
      icon: '',
      issuerId: null,  // ✅ typed correctly
      isActive: true,
    });
    setSelectedIssuerId(null);
    setEditingId(null);
  }, []);

  // Export triggers with loading state
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
        label="Add Department"
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
        disabled={issuersLoading}
      />
    ),
    [resetForm, issuersLoading]
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
        <h1 className="h2 mb-3">Department Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={editingId ? 'Edit Department' : 'Add New Department'}
        modal
        style={{ width: '60vw' }}
        breakpoints={{ '960px': '80vw', '640px': '95vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">
                Department Name *
              </label>
              <InputText
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter department name"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="uniqueTag" className="form-label">
                Unique Tag *
              </label>
              <InputText
                id="uniqueTag"
                name="uniqueTag"
                value={formData.uniqueTag}
                onChange={handleInputChange}
                placeholder="e.g., DEPT_001"
                className="w-100"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="abbreviation" className="form-label">
                Abbreviation *
              </label>
              <InputText
                id="abbreviation"
                name="abbreviation"
                value={formData.abbreviation}
                onChange={handleInputChange}
                placeholder="e.g., DEPT"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="issuerId" className="form-label">
                Issuer Type * {editingId && <span className="text-muted">(Read-only)</span>}
              </label>
              {editingId ? (
                <InputText
                  id="issuerId"
                  value={selectedIssuer?.name || ''}
                  disabled
                  className="w-100"
                  placeholder="Issuer Type"
                />
              ) : (
                <Dropdown
                  id="issuerId"
                  name="issuerId"
                  value={selectedIssuerId}
                  onChange={(e) => {
                    setSelectedIssuerId(e.value);
                    setFormData((prev) => ({ ...prev, issuerId: e.value }));
                  }}
                  options={issuerOptions}
                  placeholder={issuersLoading ? 'Loading issuers...' : 'Select Issuer Type'}
                  disabled={issuersLoading}
                  className="w-100"
                  showClear
                  filter
                />
              )}
              {!selectedIssuerId && !editingId && (
                <small className="text-danger">⚠️ Issuer Type selection is required</small>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="ip" className="form-label">
                IP Address *
              </label>
              <InputText
                id="ip"
                name="ip"
                value={formData.ip}
                onChange={handleInputChange}
                placeholder="e.g., 192.168.1.1"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="baseUrl" className="form-label">
                Base URL *
              </label>
              <InputText
                id="baseUrl"
                name="baseUrl"
                value={formData.baseUrl}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com"
                className="w-100"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="publicKey" className="form-label">
                Public Key *
              </label>
              <InputText
                id="publicKey"
                name="publicKey"
                value={formData.publicKey}
                onChange={handleInputChange}
                placeholder="Public Key"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="secretKey" className="form-label">
                Secret Key *
              </label>
              <InputText
                id="secretKey"
                name="secretKey"
                type="password"
                value={formData.secretKey}
                onChange={handleInputChange}
                placeholder="Secret Key"
                className="w-100"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="boDeptId" className="form-label">
                BO Department ID
              </label>
              <InputText
                id="boDeptId"
                name="boDeptId"
                type="number"
                value={formData.boDeptId}
                onChange={handleInputChange}
                placeholder="BO Department ID"
                className="w-100"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="order" className="form-label">
                Display Order
              </label>
              <InputText
                id="order"
                name="order"
                type="number"
                value={formData.order}
                onChange={handleInputChange}
                placeholder="Display Order"
                className="w-100"
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="icon" className="form-label">
                Icon URL
              </label>
              <InputText
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                placeholder="Icon URL"
                className="w-100"
              />
            </div>
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
              disabled={!selectedIssuerId && !editingId}
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

      <ReusableDataTable<Department>
        data={tableData}
        config={tableConfig}
        loading={isLoading || issuersLoading}
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
