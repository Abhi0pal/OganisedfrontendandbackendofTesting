'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
  useUpclSupplyCategories,
  useCreateUpclSupplyCategory,
  useUpdateUpclSupplyCategory,
  useDeleteUpclSupplyCategory,
  useToggleUpclSupplyCategory,
} from '@/hooks/master/useUpclSupplyCategories';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { upclSupplyCategoriesExportConfig } from '@/lib/export-configs';

interface UpclSupplyCategory {
  id: string;
  name: string;
  type: string;
  parent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UpclSupplyCategoriesMaster = () => {
  const { data: upclSupplyCategories = [], isLoading } = useUpclSupplyCategories();
  const createMutation = useCreateUpclSupplyCategory();
  const updateMutation = useUpdateUpclSupplyCategory();
  const deleteMutation = useDeleteUpclSupplyCategory();
  const toggleMutation = useToggleUpclSupplyCategory();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    parent: '',
    isActive: true
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
  } = useDataTableManager<UpclSupplyCategory>(upclSupplyCategories);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    upclSupplyCategoriesExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<UpclSupplyCategory> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'UPCL Supply Category',
          width: '20%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'type',
          header: 'Type',
          width: '15%',
          filterType: 'select',
          filterOptions: [
            { label: 'Category', value: 'category' },
            { label: 'Subcategory', value: 'subcategory' },
          ],
          body: (row) => <span>{row.type}</span>,
        },
        {
          field: 'parent',
          header: 'Parent',
          width: '15%',
          filterType: 'text',
          body: (row) => <span>{row.parent || 'N/A'}</span>,
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
      globalFilterFields: ['name', 'type', 'parent'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No UPCL Supply Categories found.',
    }),
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: '',
      parent: '',
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

  const handleTypeChange = useCallback((e: any) => {
    setFormData((prev) => ({
      ...prev,
      type: e.value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const submitData = {
          name: formData.name,
          type: formData.type,
          parent: formData.parent || undefined,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Category updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Category created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving UPCL Supply Category',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((category: UpclSupplyCategory) => {
    setFormData({
      name: category.name,
      type: category.type,
      parent: category.parent || '',
      isActive: category.isActive,
    });
    setEditingId(category.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (category: UpclSupplyCategory) => {
      if (confirm(`Are you sure you want to delete ${category.name}?`)) {
        try {
          await deleteMutation.mutateAsync(category.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'UPCL Supply Category deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting UPCL Supply Category',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (category: UpclSupplyCategory) => {
      try {
        await toggleMutation.mutateAsync(category.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `UPCL Supply Category ${category.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating UPCL Supply Category status',
        });
      }
    },
    [toggleMutation]
  );

  // Memoized row actions
  const rowActions: RowAction<UpclSupplyCategory>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (category) => handleEdit(category),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (category) => handleToggle(category),
        tooltip: 'Toggle Status',
        visible: (category) => !category.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (category) => handleToggle(category),
        tooltip: 'Deactivate',
        visible: (category) => category.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (category) => handleDelete(category),
        tooltip: 'Delete',
      },
    ],
    [handleEdit, handleToggle, handleDelete]
  );

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
        label="Add UPCL Supply Category"
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
        <h1 className="h2 mb-3">UPCL Supply Categories Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit UPCL Supply Category' : 'Add New UPCL Supply Category'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              UPCL Supply Category Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter UPCL supply category name"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="type" className="form-label">
              Type *
            </label>
            <Dropdown
              id="type"
              name="type"
              value={formData.type}
              onChange={handleTypeChange}
              options={[
                { label: 'Category', value: 'category' },
                { label: 'Subcategory', value: 'subcategory' },
              ]}
              placeholder="Select type"
              className="w-100"
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="parent" className="form-label">
              Parent
            </label>
            <InputText
              id="parent"
              name="parent"
              value={formData.parent}
              onChange={handleInputChange}
              placeholder="Enter parent category"
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
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<UpclSupplyCategory>
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
