'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Code, MapPin, CheckCircle, XCircle } from 'lucide-react';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import {
  useVillages,
  useCreateVillage,
  useUpdateVillage,
  useDeleteVillage,
  useToggleVillage,
} from '@/hooks/master/useVillages';
import { useTehsils } from '@/hooks/master/useTehsils';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { villageExportConfig } from '@/lib/export-configs';

interface Village {
  id: number;
  name: string;
  tehsilId: number;
  villageCode: string;
  subDistrictCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const VillageMaster = () => {
  const { data: villages = [], isLoading } = useVillages();
  const { data: tehsils = [], isLoading: tehsilsLoading } = useTehsils();
  const createMutation = useCreateVillage();
  const updateMutation = useUpdateVillage();
  const deleteMutation = useDeleteVillage();
  const toggleMutation = useToggleVillage();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tehsilId: 0,
    villageCode: '',
    subDistrictCode: '',
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
  } = useDataTableManager<Village>(villages);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    villageExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized tehsil options for dropdown
  const tehsilOptions = useMemo(
    () => tehsils.map((tehsil: any) => ({ label: tehsil.name, value: tehsil.id })),
    [tehsils]
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<Village> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Village Name',
          width: '20%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        { field: 'tehsilId', header: 'Tehsil ID', width: '10%', filterType: 'number' },
        {
          field: 'villageCode',
          header: 'Village Code',
          width: '12%',
          filterType: 'text',
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <Code size={14} style={{ color: '#6c757d' }} />
              <span style={{ color: '#6c757d', fontFamily: 'monospace', fontWeight: 500 }}>
                {row.villageCode}
              </span>
            </div>
          ),
        },
        {
          field: 'subDistrictCode',
          header: 'Sub-District Code',
          width: '12%',
          filterType: 'text',
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <MapPin size={14} style={{ color: '#0d6efd' }} />
              <span style={{ color: '#0d6efd', fontWeight: 500 }}>
                {row.subDistrictCode || 'N/A'}
              </span>
            </div>
          ),
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
          body:  (row) => (
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: row.isActive ? '#28a745' : '#dc3545' }}>
                {row.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
              </span>
              <span style={{ color: row.isActive ? '#28a745' : '#dc3545', fontWeight: 600 }}>
                {row.isActive ? 'Active' : 'Inactive'}
              </span>
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
      globalFilterFields: ['name', 'villageCode'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No villages found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<Village>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (village) => handleEdit(village),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (village) => handleToggle(village),
        tooltip: 'Toggle Status',
        visible: (village) => !village.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (village) => handleToggle(village),
        tooltip: 'Deactivate',
        visible: (village) => village.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (village) => handleDelete(village),
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
      if (!formData.tehsilId || formData.tehsilId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Tehsil must be selected',
        });
        return;
      }
      try {
        const submitData = {
          name: formData.name,
          tehsilId: Number(formData.tehsilId),
          villageCode: formData.villageCode,
          subDistrictCode: formData.subDistrictCode || null,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Village updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Village created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving village',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((village: Village) => {
    setFormData({
      name: village.name,
      tehsilId: village.tehsilId,
      villageCode: village.villageCode,
      subDistrictCode: village.subDistrictCode || '',
      isActive: village.isActive,
    });
    setEditingId(village.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (village: Village) => {
      if (confirm(`Are you sure you want to delete ${village.name}?`)) {
        try {
          await deleteMutation.mutateAsync(village.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Village deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting village',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (village: Village) => {
      try {
        await toggleMutation.mutateAsync(village.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Village ${village.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating village status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      tehsilId: 0,
      villageCode: '',
      subDistrictCode: '',
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
        label="Add Village"
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
        <h1 className="h2 mb-3">Village Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Village' : 'Add New Village'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Village Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter village name"
              className="w-100"
              required
            />
          </div>

          {/* Tehsil Dropdown - PrimeReact with Virtual Scroll */}
          <div className="mb-3">
            <label htmlFor="tehsilId" className="form-label">
              Tehsil *
            </label>
            <Dropdown
              id="tehsilId"
              name="tehsilId"
              value={formData.tehsilId}
              onChange={(e) => setFormData((prev) => ({ ...prev, tehsilId: e.value }))}
              options={tehsilOptions}
              placeholder="Select Tehsil"
              disabled={tehsilsLoading}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="villageCode" className="form-label">
                Village Code *
              </label>
              <InputText
                id="villageCode"
                name="villageCode"
                value={formData.villageCode}
                onChange={handleInputChange}
                placeholder="Village Code"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="subDistrictCode" className="form-label">
                Sub-District Code
              </label>
              <InputText
                id="subDistrictCode"
                name="subDistrictCode"
                value={formData.subDistrictCode}
                onChange={handleInputChange}
                placeholder="Sub-District Code"
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

      <ReusableDataTable<Village>
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
