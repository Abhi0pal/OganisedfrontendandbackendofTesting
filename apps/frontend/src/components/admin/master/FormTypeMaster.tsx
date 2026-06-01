'use client';

import { CheckCircle, XCircle, Hash } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
  useFormTypes,
  useCreateFormType,
  useUpdateFormType,
  useDeleteFormType,
  useToggleFormType,
} from '@/hooks/master/useFormTypes';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
// Optional: if you have a dedicated export handler/config like DocumentCheckpoint
// import { useExportHandler } from '@/hooks/useExportHandler';
// import { formTypeExportConfig } from '@/lib/export-configs';

import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareExportData,
} from '@/lib/export-utils';

interface FormType {
  id: number;
  name: string;
  abbr?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FormTypeMaster = () => {
  const { data: formtypes = [], isLoading } = useFormTypes();
  const createMutation = useCreateFormType();
  const updateMutation = useUpdateFormType();
  const deleteMutation = useDeleteFormType();
  const toggleMutation = useToggleFormType();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abbr: '',
    isActive: true,
  });

  const initialData = useMemo(() => formtypes, [formtypes]);

  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
    globalFilter,
    filters,
  } = useDataTableManager<FormType>(initialData);

  const tableConfig: ReusableDataTableConfig<FormType> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '8%', filterType: 'none' },
        {
          field: 'name',
          header: 'Form Type Name',
          width: '40%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'abbr',
          header: 'Abbreviation',
          width: '15%',
          filterType: 'text',
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <Hash size={14} style={{ color: '#0d6efd' }} />
              <span style={{ color: '#0d6efd', fontFamily: 'monospace', fontWeight: 500 }}>
                {row.abbr || 'N/A'}
              </span>
            </div>
          ),
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
          body: (row) => new Date(row.createdAt).toLocaleDateString('en-IN'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['name', 'abbr'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No form types found.',
    }),
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation mirroring DTO
    if (!formData.name?.trim()) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Form Type Name is required' });
      return;
    }
    if (!formData.abbr?.trim()) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Abbreviation is required' });
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        abbr: formData.abbr.trim(),
        isActive: formData.isActive,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Form Type updated successfully' });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Form Type created successfully' });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Error saving form type',
      });
    }
  }, [formData, editingId, createMutation, updateMutation]);

  const handleEdit = useCallback((formtype: FormType) => {
    setFormData({
      name: formtype.name,
      abbr: formtype.abbr || '',
      isActive: formtype.isActive,
    });
    setEditingId(formtype.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(async (formtype: FormType) => {
    if (confirm(`Are you sure you want to delete "${formtype.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(formtype.id);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Form Type deleted successfully' });
      } catch {
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error deleting form type' });
      }
    }
  }, [deleteMutation]);

  const handleToggle = useCallback(async (formtype: FormType) => {
    try {
      await toggleMutation.mutateAsync(formtype.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Form Type ${formtype.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error updating form type status' });
    }
  }, [toggleMutation]);

  const rowActions: RowAction<FormType>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: handleEdit, tooltip: 'Edit' },
      {
        icon: 'pi pi-check',
        label: 'Activate',
        severity: 'success',
        onClick: handleToggle,
        tooltip: 'Activate',
        visible: (row) => !row.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: handleToggle,
        tooltip: 'Deactivate',
        visible: (row) => row.isActive,
      },
      { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: handleDelete, tooltip: 'Delete' },
    ],
    [handleEdit, handleToggle, handleDelete]
  );

  const resetForm = useCallback(() => {
    setFormData({ name: '', abbr: '', isActive: true });
    setEditingId(null);
  }, []);

  // Export handlers (keep your current util approach for now)
  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      exportToCSV(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `CSV exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      await exportToExcel(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `Excel exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const handleExportPDF = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export' });
        return;
      }
      exportToPDF(prepareExportData(filteredData));
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `PDF exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  }, [filteredData]);

  const leftToolbarTemplate = useCallback(() => (
    <Button
      label="Add Form Type"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  ), [resetForm]);

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
        <Button label="CSV" icon="pi pi-download" severity="info" rounded onClick={handleExportCSV} loading={exporting} disabled={isLoading} />
        <Button label="Excel" icon="pi pi-file-excel" severity="success" rounded onClick={handleExportExcel} loading={exporting} disabled={isLoading} />
        <Button label="PDF" icon="pi pi-file-pdf" severity="warning" rounded onClick={handleExportPDF} loading={exporting} disabled={isLoading} />
      </div>
    ),
    [clearFilters, handleGlobalFilterChange, handleFiltersChange, handleExportCSV, handleExportExcel, handleExportPDF, exporting, isLoading]
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Form Type Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Form Type' : 'Add New Form Type'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Form Type Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter form type name"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="abbr" className="form-label">
              Abbreviation *
            </label>
            <InputText
              id="abbr"
              name="abbr"
              value={formData.abbr}
              onChange={handleInputChange}
              placeholder="e.g., FT"
              className="w-100"
              required
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
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<FormType>
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
