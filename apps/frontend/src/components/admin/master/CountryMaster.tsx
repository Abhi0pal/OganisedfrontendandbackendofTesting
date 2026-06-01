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
  useCountries,
  useCreateCountry,
  useUpdateCountry,
  useDeleteCountry,
  useToggleCountry,
} from '@/hooks/master/useCountries';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { countryExportConfig } from '@/lib/export-configs';

interface Country {
  id: number;
  name: string;
  abbreviation?: string;
  boCountryId?: number;
  lrId?: number;
  hadbastNumber?: number;
  vtcCode?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CountryMaster = () => {
  const { data: countries = [], isLoading } = useCountries();
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();
  const deleteMutation = useDeleteCountry();
  const toggleMutation = useToggleCountry();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    boCountryId: '',
    lrId: '',
    hadbastNumber: '',
    vtcCode: '',
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
  } = useDataTableManager<Country>(countries);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    countryExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<Country> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Country Name',
          width: '20%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'abbreviation',
          header: 'Abbreviation',
          width: '10%',
          filterType: 'text',
          body: (row) => <span className="badge bg-info">{row.abbreviation || 'N/A'}</span>,
        },
        { field: 'boCountryId', header: 'BO Country ID', width: '10%', filterType: 'number' },
        { field: 'lrId', header: 'LR ID', width: '10%', filterType: 'number' },
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
      globalFilterFields: ['name', 'abbreviation'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No countries found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<Country>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (country) => handleEdit(country),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (country) => handleToggle(country),
        tooltip: 'Toggle Status',
        visible: (country) => !country.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (country) => handleToggle(country),
        tooltip: 'Deactivate',
        visible: (country) => country.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (country) => handleDelete(country),
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
        const submitData = {
          name: formData.name,
          abbreviation: formData.abbreviation || null,
          boCountryId: formData.boCountryId ? parseInt(formData.boCountryId) : null,
          lrId: formData.lrId ? parseInt(formData.lrId) : null,
          hadbastNumber: formData.hadbastNumber ? parseInt(formData.hadbastNumber) : null,
          vtcCode: formData.vtcCode ? parseInt(formData.vtcCode) : null,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Country updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Country created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving country',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((country: Country) => {
    setFormData({
      name: country.name,
      abbreviation: country.abbreviation || '',
      boCountryId: country.boCountryId?.toString() || '',
      lrId: country.lrId?.toString() || '',
      hadbastNumber: country.hadbastNumber?.toString() || '',
      vtcCode: country.vtcCode?.toString() || '',
      isActive: country.isActive,
    });
    setEditingId(country.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (country: Country) => {
      if (confirm(`Are you sure you want to delete ${country.name}?`)) {
        try {
          await deleteMutation.mutateAsync(country.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Country deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting country',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (country: Country) => {
      try {
        await toggleMutation.mutateAsync(country.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Country ${country.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating country status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      abbreviation: '',
      boCountryId: '',
      lrId: '',
      hadbastNumber: '',
      vtcCode: '',
      isActive: true,
    });
    setEditingId(null);
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
        label="Add Country"
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
        <h1 className="h2 mb-3">Country Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Country' : 'Add New Country'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Country Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter country name"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="abbreviation" className="form-label">
              Abbreviation
            </label>
            <InputText
              id="abbreviation"
              name="abbreviation"
              value={formData.abbreviation}
              onChange={handleInputChange}
              placeholder="e.g., US"
              maxLength={10}
              className="w-100"
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="boCountryId" className="form-label">
                BO Country ID
              </label>
              <InputText
                id="boCountryId"
                name="boCountryId"
                type="number"
                value={formData.boCountryId}
                onChange={handleInputChange}
                placeholder="BO Country ID"
                className="w-100"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="lrId" className="form-label">
                LR ID
              </label>
              <InputText
                id="lrId"
                name="lrId"
                type="number"
                value={formData.lrId}
                onChange={handleInputChange}
                placeholder="LR ID"
                className="w-100"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="hadbastNumber" className="form-label">
                Hadbast Number
              </label>
              <InputText
                id="hadbastNumber"
                name="hadbastNumber"
                type="number"
                value={formData.hadbastNumber}
                onChange={handleInputChange}
                placeholder="Hadbast Number"
                className="w-100"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="vtcCode" className="form-label">
                VTC Code
              </label>
              <InputText
                id="vtcCode"
                name="vtcCode"
                type="number"
                value={formData.vtcCode}
                onChange={handleInputChange}
                placeholder="VTC Code"
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
            />
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<Country>
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
