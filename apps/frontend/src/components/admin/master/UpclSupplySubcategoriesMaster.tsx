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
  useUpclSupplySubcategories,
  useCreateUpclSupplySubcategory,
  useUpdateUpclSupplySubcategory,
  useDeleteUpclSupplySubcategory,
  useToggleUpclSupplySubcategory,
} from '@/hooks/master/useUpclSupplySubcategories';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { upclSupplySubcategoriesExportConfig } from '@/lib/export-configs';

interface UpclSupplySubcategory {
  id: string;
  name: string;
  type: string;
  supplyCategoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UpclSupplySubcategoriesMaster = () => {
  const { data: upclSupplySubcategories = [], isLoading } = useUpclSupplySubcategories();
  const createMutation = useCreateUpclSupplySubcategory();
  const updateMutation = useUpdateUpclSupplySubcategory();
  const deleteMutation = useDeleteUpclSupplySubcategory();
  const toggleMutation = useToggleUpclSupplySubcategory();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    supplyCategoryId: '',
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
  } = useDataTableManager<UpclSupplySubcategory>(upclSupplySubcategories);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    upclSupplySubcategoriesExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const tableConfig: ReusableDataTableConfig<UpclSupplySubcategory> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '8%', filterType: 'none' },
        {
          field: 'name',
          header: 'UPCL Supply Subcategory',
          width: '24%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'type',
          header: 'Type',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'supplyCategoryId',
          header: 'Supply Category ID',
          width: '14%',
          filterType: 'text',
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
      globalFilterFields: ['name', 'type', 'supplyCategoryId'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No UPCL Supply Subcategories found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      name: '',
      type: '',
      supplyCategoryId: '',
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
          name: formData.name,
          type: formData.type,
          supplyCategoryId: formData.supplyCategoryId,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Subcategory updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Subcategory created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving UPCL Supply Subcategory',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((subcategory: UpclSupplySubcategory) => {
    setFormData({
      id: subcategory.id,
      name: subcategory.name,
      type: subcategory.type,
      supplyCategoryId: subcategory.supplyCategoryId,
      isActive: subcategory.isActive,
    });
    setEditingId(subcategory.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (subcategory: UpclSupplySubcategory) => {
      if (confirm(`Are you sure you want to delete ${subcategory.name}?`)) {
        try {
          await deleteMutation.mutateAsync(subcategory.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Subcategory deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting UPCL Supply Subcategory',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (subcategory: UpclSupplySubcategory) => {
      try {
        await toggleMutation.mutateAsync(subcategory.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `UPCL Supply Subcategory ${subcategory.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating UPCL Supply Subcategory status',
        });
      }
    },
    [toggleMutation]
  );

  const rowActions: RowAction<UpclSupplySubcategory>[] = useMemo(
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
        label="Add UPCL Supply Subcategory"
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
        <h1 className="h2 mb-3">UPCL Supply Subcategories Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit UPCL Supply Subcategory' : 'Add New UPCL Supply Subcategory'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="id" className="form-label">
              Subcategory ID *
            </label>
            <InputText
              id="id"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              placeholder="Enter subcategory ID"
              className="w-100"
              required
              disabled={!!editingId}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Subcategory Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter subcategory name"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="type" className="form-label">
              Type *
            </label>
            <InputText
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              placeholder="Enter type"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="supplyCategoryId" className="form-label">
              Supply Category ID *
            </label>
            <InputText
              id="supplyCategoryId"
              name="supplyCategoryId"
              value={formData.supplyCategoryId}
              onChange={handleInputChange}
              placeholder="Enter supply category ID"
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

      <ReusableDataTable<UpclSupplySubcategory>
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
