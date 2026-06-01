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
  useUpclDivisionSubdivisions,
  useCreateUpclDivisionSubdivision,
  useUpdateUpclDivisionSubdivision,
  useDeleteUpclDivisionSubdivision,
  useToggleUpclDivisionSubdivision,
} from '@/hooks/master/useUpclDivisionSubdivisions';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { upclDivisionSubdivisionsExportConfig } from '@/lib/export-configs';

interface UpclDivisionSubdivision {
  id: number;
  divisionId: string;
  divisionCode: string;
  divisionName: string;
  subdivisionId: string;
  subdivisionCode: string;
  subdivisionName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UpclDivisionSubdivisionsMaster = () => {
  const { data: upclDivisionSubdivisions = [], isLoading } = useUpclDivisionSubdivisions();
  const createMutation = useCreateUpclDivisionSubdivision();
  const updateMutation = useUpdateUpclDivisionSubdivision();
  const deleteMutation = useDeleteUpclDivisionSubdivision();
  const toggleMutation = useToggleUpclDivisionSubdivision();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    divisionId: '',
    divisionCode: '',
    divisionName: '',
    subdivisionId: '',
    subdivisionCode: '',
    subdivisionName: '',
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
  } = useDataTableManager<UpclDivisionSubdivision>(upclDivisionSubdivisions);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    upclDivisionSubdivisionsExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<UpclDivisionSubdivision> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '8%', filterType: 'none' },
        {
          field: 'divisionId',
          header: 'Division ID',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'divisionCode',
          header: 'Division Code',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'divisionName',
          header: 'Division Name',
          width: '16%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.divisionName}</span>,
        },
        {
          field: 'subdivisionId',
          header: 'Subdivision ID',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'subdivisionCode',
          header: 'Subdivision Code',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'subdivisionName',
          header: 'Subdivision Name',
          width: '16%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.subdivisionName}</span>,
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
      globalFilterFields: [
        'divisionId',
        'divisionCode',
        'divisionName',
        'subdivisionId',
        'subdivisionCode',
        'subdivisionName',
      ],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No UPCL Division Subdivisions found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      divisionId: '',
      divisionCode: '',
      divisionName: '',
      subdivisionId: '',
      subdivisionCode: '',
      subdivisionName: '',
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
          divisionId: formData.divisionId,
          divisionCode: formData.divisionCode,
          divisionName: formData.divisionName,
          subdivisionId: formData.subdivisionId,
          subdivisionCode: formData.subdivisionCode,
          subdivisionName: formData.subdivisionName,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Division Subdivision updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Division Subdivision created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving UPCL Division Subdivision',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((subcategory: UpclDivisionSubdivision) => {
    setFormData({
      divisionId: subcategory.divisionId,
      divisionCode: subcategory.divisionCode,
      divisionName: subcategory.divisionName,
      subdivisionId: subcategory.subdivisionId,
      subdivisionCode: subcategory.subdivisionCode,
      subdivisionName: subcategory.subdivisionName,
      isActive: subcategory.isActive,
    });
    setEditingId(subcategory.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (subcategory: UpclDivisionSubdivision) => {
      if (confirm(`Are you sure you want to delete ${subcategory.subdivisionName}?`)) {
        try {
          await deleteMutation.mutateAsync(subcategory.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Division Subdivision deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting UPCL Division Subdivision',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (subcategory: UpclDivisionSubdivision) => {
      try {
        await toggleMutation.mutateAsync(subcategory.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `UPCL Division Subdivision ${subcategory.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating UPCL Division Subdivision status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<UpclDivisionSubdivision>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (subcategory) => handleEdit(subcategory),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (subcategory) => handleToggle(subcategory),
        tooltip: 'Toggle Status',
        visible: (subcategory) => !subcategory.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (subcategory) => handleToggle(subcategory),
        tooltip: 'Deactivate',
        visible: (subcategory) => subcategory.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (subcategory) => handleDelete(subcategory),
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
        label="Add UPCL Division Subdivision"
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
        <h1 className="h2 mb-3">UPCL Division Subdivisions Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit UPCL Division Subdivision' : 'Add New UPCL Division Subdivision'}
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
              value={formData.divisionId}
              onChange={handleInputChange}
              placeholder="Enter division ID"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="divisionCode" className="form-label">
              Division Code *
            </label>
            <InputText
              id="divisionCode"
              name="divisionCode"
              value={formData.divisionCode}
              onChange={handleInputChange}
              placeholder="Enter division code"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="divisionName" className="form-label">
              Division Name *
            </label>
            <InputText
              id="divisionName"
              name="divisionName"
              value={formData.divisionName}
              onChange={handleInputChange}
              placeholder="Enter division name"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="subdivisionId" className="form-label">
              Subdivision ID *
            </label>
            <InputText
              id="subdivisionId"
              name="subdivisionId"
              value={formData.subdivisionId}
              onChange={handleInputChange}
              placeholder="Enter subdivision ID"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="subdivisionCode" className="form-label">
              Subdivision Code *
            </label>
            <InputText
              id="subdivisionCode"
              name="subdivisionCode"
              value={formData.subdivisionCode}
              onChange={handleInputChange}
              placeholder="Enter subdivision code"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="subdivisionName" className="form-label">
              Subdivision Name *
            </label>
            <InputText
              id="subdivisionName"
              name="subdivisionName"
              value={formData.subdivisionName}
              onChange={handleInputChange}
              placeholder="Enter subdivision name"
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

      <ReusableDataTable<UpclDivisionSubdivision>
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
