'use client';

import { CheckCircle, XCircle } from "lucide-react";
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
  useStates,
  useCreateState,
  useUpdateState,
  useDeleteState,
  useToggleState,
} from '@/hooks/master/useStates';
import { useCountries } from '@/hooks/master/useCountries';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { stateExportConfig } from '@/lib/export-configs';

interface State {
  id: number;
  name: string;
  abbreviation?: string;
  countryId: number;
  boStateId?: number;
  boLgdId?: number;
  stateCode?: number;
  isActive: boolean;
  createdAt: string;
}

export const StateMaster = () => {
  const { data: states = [], isLoading } = useStates();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const createMutation = useCreateState();
  const updateMutation = useUpdateState();
  const deleteMutation = useDeleteState();
  const toggleMutation = useToggleState();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    countryId: 0,
    boStateId: '',
    boLgdId: '',
    stateCode: '',
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
  } = useDataTableManager<State>(states);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    stateExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized country options for dropdown
  const countryOptions = useMemo(
    () => countries.map((country: any) => ({ label: country.name, value: country.id })),
    [countries]
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<State> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'State Name',
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
        { field: 'countryId', header: 'Country ID', width: '10%', filterType: 'number' },
        { field: 'boStateId', header: 'BO State ID', width: '10%', filterType: 'number' },
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
      emptyMessage: 'No states found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<State>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (state) => handleEdit(state),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (state) => handleToggle(state),
        tooltip: 'Toggle Status',
        visible: (state) => !state.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (state) => handleToggle(state),
        tooltip: 'Deactivate',
        visible: (state) => state.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (state) => handleDelete(state),
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
      if (!formData.countryId || formData.countryId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Country must be selected',
        });
        return;
      }
      try {
        const submitData = {
          name: formData.name,
          abbreviation: formData.abbreviation || null,
          countryId: Number(formData.countryId),
          boStateId: formData.boStateId ? parseInt(formData.boStateId) : null,
          boLgdId: formData.boLgdId ? parseInt(formData.boLgdId) : null,
          stateCode: formData.stateCode ? parseInt(formData.stateCode) : null,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'State updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'State created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving state',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((state: State) => {
    setFormData({
      name: state.name,
      abbreviation: state.abbreviation || '',
      countryId: state.countryId,
      boStateId: state.boStateId?.toString() || '',
      boLgdId: state.boLgdId?.toString() || '',
      stateCode: state.stateCode?.toString() || '',
      isActive: state.isActive,
    });
    setEditingId(state.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (state: State) => {
      if (confirm(`Are you sure you want to delete ${state.name}?`)) {
        try {
          await deleteMutation.mutateAsync(state.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'State deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting state',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (state: State) => {
      try {
        await toggleMutation.mutateAsync(state.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `State ${state.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating state status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      abbreviation: '',
      countryId: 0,
      boStateId: '',
      boLgdId: '',
      stateCode: '',
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
        label="Add State"
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
        <h1 className="h2 mb-3">State Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit State' : 'Add New State'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              State Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter state name"
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
              placeholder="e.g., CA"
              maxLength={10}
              className="w-100"
            />
          </div>

          {/* Country Dropdown - PrimeReact with Virtual Scroll */}
          <div className="mb-3">
            <label htmlFor="countryId" className="form-label">
              Country *
            </label>
            <Dropdown
              id="countryId"
              name="countryId"
              value={formData.countryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, countryId: e.value }))}
              options={countryOptions}
              placeholder="Select Country"
              disabled={countriesLoading}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="boStateId" className="form-label">
                BO State ID
              </label>
              <InputText
                id="boStateId"
                name="boStateId"
                type="number"
                value={formData.boStateId}
                onChange={handleInputChange}
                placeholder="BO State ID"
                className="w-100"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="boLgdId" className="form-label">
                BO LGD ID
              </label>
              <InputText
                id="boLgdId"
                name="boLgdId"
                type="number"
                value={formData.boLgdId}
                onChange={handleInputChange}
                placeholder="BO LGD ID"
                className="w-100"
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="stateCode" className="form-label">
              State Code
            </label>
            <InputText
              id="stateCode"
              name="stateCode"
              type="number"
              value={formData.stateCode}
              onChange={handleInputChange}
              placeholder="State Code"
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

      <ReusableDataTable<State>
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
