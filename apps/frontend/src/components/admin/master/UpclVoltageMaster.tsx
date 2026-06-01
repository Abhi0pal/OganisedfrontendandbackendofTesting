'use client';

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
  useUpclVoltage,
  useCreateUpclVoltage,
  useUpdateUpclVoltage,
  useDeleteUpclVoltage,
  useToggleUpclVoltage,
} from '@/hooks/master/useUpclVoltage';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { upclVoltageExportConfig } from '@/lib/export-configs';

interface UpclVoltage {
  id: string;
  voltageGroup: string;
  voltageDesc: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UpclVoltageMaster = () => {
  const { data: upclVoltage = [], isLoading } = useUpclVoltage();
  const createMutation = useCreateUpclVoltage();
  const updateMutation = useUpdateUpclVoltage();
  const deleteMutation = useDeleteUpclVoltage();
  const toggleMutation = useToggleUpclVoltage();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    voltageGroup: '',
    voltageDesc: '',
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
  } = useDataTableManager<UpclVoltage>(upclVoltage);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    upclVoltageExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<UpclVoltage> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '8%', filterType: 'none' },
        {
          field: 'voltageGroup',
          header: 'Voltage Group',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'voltageDesc',
          header: 'Voltage Description',
          width: '24%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.voltageDesc}</span>,
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
      globalFilterFields: ['voltageGroup', 'voltageDesc'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No UPCL Voltage records found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      voltageGroup: '',
      voltageDesc: '',
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
          id: formData.id,
          voltageGroup: formData.voltageGroup,
          voltageDesc: formData.voltageDesc,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Voltage updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Voltage created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving UPCL Voltage',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((voltage: UpclVoltage) => {
    setFormData({
      id: voltage.id,
      voltageGroup: voltage.voltageGroup,
      voltageDesc: voltage.voltageDesc,
      isActive: voltage.isActive,
    });
    setEditingId(voltage.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (voltage: UpclVoltage) => {
      if (confirm(`Are you sure you want to delete ${voltage.voltageDesc}?`)) {
        try {
          await deleteMutation.mutateAsync(voltage.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Voltage deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting UPCL Voltage',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (voltage: UpclVoltage) => {
      try {
        await toggleMutation.mutateAsync(voltage.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `UPCL Voltage ${voltage.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating UPCL Voltage status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<UpclVoltage>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (voltage) => handleEdit(voltage),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (voltage) => handleToggle(voltage),
        tooltip: 'Toggle Status',
        visible: (voltage) => !voltage.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (voltage) => handleToggle(voltage),
        tooltip: 'Deactivate',
        visible: (voltage) => voltage.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (voltage) => handleDelete(voltage),
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
        label="Add UPCL Voltage"
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
        <h1 className="h2 mb-3">UPCL Voltage Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit UPCL Voltage' : 'Add New UPCL Voltage'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">
              Voltage ID *
            </label>
            <InputText
              id="id"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              placeholder="Enter voltage ID"
              className="w-100"
              required
              disabled={!!editingId}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="voltageGroup" className="form-label">
              Voltage Group *
            </label>
            <InputText
              id="voltageGroup"
              name="voltageGroup"
              value={formData.voltageGroup}
              onChange={handleInputChange}
              placeholder="Enter voltage group"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="voltageDesc" className="form-label">
              Voltage Description *
            </label>
            <InputText
              id="voltageDesc"
              name="voltageDesc"
              value={formData.voltageDesc}
              onChange={handleInputChange}
              placeholder="Enter voltage description"
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

      <ReusableDataTable<UpclVoltage>
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
