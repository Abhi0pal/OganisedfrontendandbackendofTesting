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
  useUjsDivisions,
  useCreateUjsDivision,
  useUpdateUjsDivision,
  useDeleteUjsDivision,
  useToggleUjsDivision,
} from '@/hooks/master/useUjsDivisions';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { ujsDivisionExportConfig } from '@/lib/export-configs';

interface UjsDivision {
  id: number;
  divisionId: number;
  officeName: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UjsDivisionMaster = () => {
  const { data: ujsDivisions = [], isLoading } = useUjsDivisions();
  const createMutation = useCreateUjsDivision();
  const updateMutation = useUpdateUjsDivision();
  const deleteMutation = useDeleteUjsDivision();
  const toggleMutation = useToggleUjsDivision();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    divisionId: '',
    officeName: '',
    address: '',
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
  } = useDataTableManager<UjsDivision>(ujsDivisions);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    ujsDivisionExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<UjsDivision> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '6%', filterType: 'none' },
        { field: 'divisionId', header: 'Division ID', width: '10%', filterType: 'number' },
        {
          field: 'officeName',
          header: 'Office Name',
          width: '20%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.officeName}</span>,
        },
        {
          field: 'address',
          header: 'Address',
          width: '30%',
          filterType: 'text',
          body: (row) => <span>{row.address}</span>,
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
      globalFilterFields: ['officeName', 'address'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No UJS Division records found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      divisionId: '',
      officeName: '',
      address: '',
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
          divisionId: formData.divisionId ? parseInt(formData.divisionId, 10) : 0,
          officeName: formData.officeName,
          address: formData.address,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UJS Division updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UJS Division created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving UJS Division',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((division: UjsDivision) => {
    setFormData({
      divisionId: division.divisionId.toString(),
      officeName: division.officeName,
      address: division.address,
      isActive: division.isActive,
    });
    setEditingId(division.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (division: UjsDivision) => {
      if (confirm(`Are you sure you want to delete ${division.officeName}?`)) {
        try {
          await deleteMutation.mutateAsync(division.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UJS Division deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting UJS Division',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (division: UjsDivision) => {
      try {
        await toggleMutation.mutateAsync(division.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `UJS Division ${division.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating UJS Division status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<UjsDivision>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (division) => handleEdit(division),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (division) => handleToggle(division),
        tooltip: 'Toggle Status',
        visible: (division) => !division.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (division) => handleToggle(division),
        tooltip: 'Deactivate',
        visible: (division) => division.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (division) => handleDelete(division),
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
        label="Add UJS Division"
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
        <h1 className="h2 mb-3">UJS Division Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit UJS Division' : 'Add New UJS Division'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="divisionId" className="form-label">
              Division ID *
            </label>
            <InputText
              id="divisionId"
              name="divisionId"
              type="number"
              value={formData.divisionId}
              onChange={handleInputChange}
              placeholder="Enter division ID"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="officeName" className="form-label">
              Office Name *
            </label>
            <InputText
              id="officeName"
              name="officeName"
              value={formData.officeName}
              onChange={handleInputChange}
              placeholder="Enter office name"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="address" className="form-label">
              Address *
            </label>
            <InputText
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter address"
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

      <ReusableDataTable<UjsDivision>
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
