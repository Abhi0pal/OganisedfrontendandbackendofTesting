'use client';

import { CheckCircle, XCircle } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from 'react';
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
  useLabourFactorySec85,
  useCreateLabourFactorySec85,
  useUpdateLabourFactorySec85,
  useDeleteLabourFactorySec85,
  useToggleLabourFactorySec85,
} from '@/hooks/master/useLabourFactorySec85';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { labourFactorySec85ExportConfig } from '@/lib/export-configs';

interface LabourFactorySec85 {
  id: number;
  specialProvisionName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LabourFactorySec85Master = () => {
  const { data: provisions = [], isLoading } = useLabourFactorySec85();
  const createMutation = useCreateLabourFactorySec85();
  const updateMutation = useUpdateLabourFactorySec85();
  const deleteMutation = useDeleteLabourFactorySec85();
  const toggleMutation = useToggleLabourFactorySec85();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    specialProvisionName: '',
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
  } = useDataTableManager<LabourFactorySec85>(provisions);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    labourFactorySec85ExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<LabourFactorySec85> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '6%', filterType: 'none' },
        {
          field: 'specialProvisionName',
          header: 'Special Provision Name',
          width: '40%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.specialProvisionName}</span>,
        },
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
          header: 'Created Date',
          width: '12%',
          filterType: 'date',
          body: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['specialProvisionName'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Labour Factory Sec85 records found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      specialProvisionName: '',
      isActive: true,
    });
    setEditingId(null);
  }, []);

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
        const submitData = {
          id: formData.id ? parseInt(formData.id, 10) : 0,
          specialProvisionName: formData.specialProvisionName,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Labour Factory Sec85 updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Labour Factory Sec85 created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving Labour Factory Sec85',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((provision: LabourFactorySec85) => {
    setFormData({
      id: provision.id.toString(),
      specialProvisionName: provision.specialProvisionName,
      isActive: provision.isActive,
    });
    setEditingId(provision.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (provision: LabourFactorySec85) => {
      if (confirm(`Are you sure you want to delete ${provision.specialProvisionName}?`)) {
        try {
          await deleteMutation.mutateAsync(provision.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Labour Factory Sec85 deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting Labour Factory Sec85',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (provision: LabourFactorySec85) => {
      try {
        await toggleMutation.mutateAsync(provision.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Labour Factory Sec85 ${provision.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating Labour Factory Sec85 status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<LabourFactorySec85>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (provision) => handleEdit(provision),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (provision) => handleToggle(provision),
        tooltip: 'Toggle Status',
        visible: (provision) => !provision.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (provision) => handleToggle(provision),
        tooltip: 'Deactivate',
        visible: (provision) => provision.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (provision) => handleDelete(provision),
        tooltip: 'Delete',
      },
    ],
    [handleEdit, handleToggle, handleDelete]
  );

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
        label="Add Labour Factory Sec85"
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
        <h1 className="h2 mb-3">Labour Factory Sec85 Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Labour Factory Sec85' : 'Add New Labour Factory Sec85'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">
              ID *
            </label>
            <InputText
              id="id"
              name="id"
              type="number"
              value={formData.id}
              onChange={handleInputChange}
              placeholder="Enter ID"
              className="w-100"
              required
              disabled={!!editingId}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="specialProvisionName" className="form-label">
              Special Provision Name *
            </label>
            <InputText
              id="specialProvisionName"
              name="specialProvisionName"
              value={formData.specialProvisionName}
              onChange={handleInputChange}
              placeholder="Enter special provision name"
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
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<LabourFactorySec85>
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
