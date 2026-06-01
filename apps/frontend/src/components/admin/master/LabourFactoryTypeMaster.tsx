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
  useLabourFactoryTypeMaster,
  useCreateLabourFactoryTypeMaster,
  useUpdateLabourFactoryTypeMaster,
  useDeleteLabourFactoryTypeMaster,
  useToggleLabourFactoryTypeMaster,
} from '@/hooks/master/useLabourFactoryTypeMaster';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { labourFactoryTypeMasterExportConfig } from '@/lib/export-configs';

interface LabourFactoryTypeMaster {
  id: number;
  factoryType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LabourFactoryTypeMaster = () => {
  const { data: factoryTypes = [], isLoading } = useLabourFactoryTypeMaster();
  const createMutation = useCreateLabourFactoryTypeMaster();
  const updateMutation = useUpdateLabourFactoryTypeMaster();
  const deleteMutation = useDeleteLabourFactoryTypeMaster();
  const toggleMutation = useToggleLabourFactoryTypeMaster();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    factoryType: '',
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
  } = useDataTableManager<LabourFactoryTypeMaster>(factoryTypes);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    labourFactoryTypeMasterExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<LabourFactoryTypeMaster> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '6%', filterType: 'none' },
        {
          field: 'factoryType',
          header: 'Factory Type',
          width: '24%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.factoryType}</span>,
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
      globalFilterFields: ['factoryType'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Labour Factory Type records found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      factoryType: '',
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
          factoryType: formData.factoryType,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Factory Type updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Factory Type created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving factory type',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((factoryType: LabourFactoryTypeMaster) => {
    setFormData({
      id: factoryType.id.toString(),
      factoryType: factoryType.factoryType,
      isActive: factoryType.isActive,
    });
    setEditingId(factoryType.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (factoryType: LabourFactoryTypeMaster) => {
      if (confirm(`Are you sure you want to delete ${factoryType.factoryType}?`)) {
        try {
          await deleteMutation.mutateAsync(factoryType.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Factory Type deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting factory type',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (factoryType: LabourFactoryTypeMaster) => {
      try {
        await toggleMutation.mutateAsync(factoryType.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Factory Type ${factoryType.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating factory type status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<LabourFactoryTypeMaster>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (factoryType) => handleEdit(factoryType),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (factoryType) => handleToggle(factoryType),
        tooltip: 'Toggle Status',
        visible: (factoryType) => !factoryType.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (factoryType) => handleToggle(factoryType),
        tooltip: 'Deactivate',
        visible: (factoryType) => factoryType.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (factoryType) => handleDelete(factoryType),
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
        label="Add Factory Type"
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
        <h1 className="h2 mb-3">Labour Factory Type Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Factory Type' : 'Add New Factory Type'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">
              Factory Type ID *
            </label>
            <InputText
              id="id"
              name="id"
              type="number"
              value={formData.id}
              onChange={handleInputChange}
              placeholder="Enter factory type ID"
              className="w-100"
              required
              disabled={!!editingId}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="factoryType" className="form-label">
              Factory Type *
            </label>
            <InputText
              id="factoryType"
              name="factoryType"
              value={formData.factoryType}
              onChange={handleInputChange}
              placeholder="Enter factory type"
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

      <ReusableDataTable<LabourFactoryTypeMaster>
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
