
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
  useDistricts,
  useCreateDistrict,
  useUpdateDistrict,
  useDeleteDistrict,
  useToggleDistrict,
} from '@/hooks/master/useDistricts';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useStates } from '@/hooks/master/useStates';
import { useExportHandler } from '@/hooks/useExportHandler';
import { districtExportConfig } from '@/lib/export-configs';

interface District {
  id: number;
  name: string;
  abbreviation?: string;
  stateCode?: string;
  districtCode?: string;
  latlong?: string;
  stateId: number;
  isActive: boolean;
  createdAt: string;
}

export const DistrictMaster = () => {
  const { data: districts = [], isLoading } = useDistricts();
  const { data: states = [], isLoading: statesLoading } = useStates();
  const createMutation = useCreateDistrict();
  const updateMutation = useUpdateDistrict();
  const deleteMutation = useDeleteDistrict();
  const toggleMutation = useToggleDistrict();

  const toastRef = useRef<Toast | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    districtCode: '',
    latlong: '',
    stateId: 0,
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
  } = useDataTableManager<District>(districts);

  // Use export handler hook (cast ref for current signature)
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    districtExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized state options for dropdown
  const stateOptions = useMemo(
    () => states.map((state: any) => ({ label: state.name, value: state.id })),
    [states]
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<District> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'District Name',
          width: '18%',
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
        { field: 'stateId', header: 'State ID', width: '10%', filterType: 'number' },
        { field: 'districtCode', header: 'District Code', width: '10%', filterType: 'text' },
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
      emptyMessage: 'No districts found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<District>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (district) => handleEdit(district),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (district) => handleToggle(district),
        tooltip: 'Toggle Status',
        visible: (district) => !district.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (district) => handleToggle(district),
        tooltip: 'Deactivate',
        visible: (district) => district.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (district) => handleDelete(district),
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
      if (!formData.stateId || formData.stateId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'State must be selected',
        });
        return;
      }
      try {
        // ✅ Normalize nullables to `undefined` to satisfy Partial<District>
        const submitData = {
          name: formData.name,
          abbreviation: formData.abbreviation || undefined,
          districtCode: formData.districtCode || undefined,
          latlong: formData.latlong || undefined,
          isActive: formData.isActive,
          stateId: Number(formData.stateId),
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'District updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'District created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving district',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((district: District) => {
    setFormData({
      name: district.name,
      abbreviation: district.abbreviation || '',
      districtCode: district.districtCode || '',
      latlong: district.latlong || '',
      stateId: district.stateId,
      isActive: district.isActive,
    });
    setEditingId(district.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (district: District) => {
      if (confirm(`Are you sure you want to delete ${district.name}?`)) {
        try {
          await deleteMutation.mutateAsync(district.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'District deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting district',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (district: District) => {
      try {
        await toggleMutation.mutateAsync(district.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `District ${district.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating district status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      abbreviation: '',
      districtCode: '',
      latlong: '',
      stateId: 0,
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
        label="Add District"
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
        <h1 className="h2 mb-3">District Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit District' : 'Add New District'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              District Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter district name"
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
              placeholder="e.g., DL"
              maxLength={10}
              className="w-100"
            />
          </div>

          {/* State Dropdown - PrimeReact with Virtual Scroll */}
          <div className="mb-3">
            <label htmlFor="stateId" className="form-label">
              State *
            </label>
            <Dropdown
              id="stateId"
              name="stateId"
              value={formData.stateId}
              onChange={(e) => setFormData((prev) => ({ ...prev, stateId: e.value }))}
              options={stateOptions}
              placeholder="Select State"
              disabled={statesLoading}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="mb-3">
            <label htmlFor="districtCode" className="form-label">
              District Code
            </label>
            <InputText
              id="districtCode"
              name="districtCode"
              value={formData.districtCode}
              onChange={handleInputChange}
              placeholder="e.g., 101"
              className="w-100"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="latlong" className="form-label">
              Latitude/Longitude
            </label>
            <InputText
              id="latlong"
              name="latlong"
              value={formData.latlong}
              onChange={handleInputChange}
              placeholder="e.g., 28.7041,77.1025"
              className="w-100"
            />
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="form-check-input"
              />
              <label htmlFor="isActive" className="form-check-label">
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

      <ReusableDataTable<District>
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
