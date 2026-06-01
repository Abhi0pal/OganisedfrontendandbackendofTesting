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
  useTehsils,
  useCreateTehsil,
  useUpdateTehsil,
  useDeleteTehsil,
  useToggleTehsil,
} from '@/hooks/master/useTehsils';
import { useStates } from '@/hooks/master/useStates';
import { useDistricts } from '@/hooks/master/useDistricts';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { tehsilExportConfig } from '@/lib/export-configs';

interface Tehsil {
  id: number;
  name: string;
  districtId: number;
  stateId: number;
  subDistrictCode?: string;
  deptDivisionId?: number;
  lgDistrictId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TehsilMaster = () => {
  const { data: tehsils = [], isLoading } = useTehsils();
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: allDistricts = [], isLoading: districtsLoading } = useDistricts();
  const createMutation = useCreateTehsil();
  const updateMutation = useUpdateTehsil();
  const deleteMutation = useDeleteTehsil();
  const toggleMutation = useToggleTehsil();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stateId: 0,
    districtId: 0,
    subDistrictCode: '',
    deptDivisionId: '',
    lgDistrictId: '',
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
  } = useDataTableManager<Tehsil>(tehsils);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    tehsilExportConfig,
    toastRef as React.RefObject<Toast>
  );

  // Memoized filtered districts - only recalculate when stateId or allDistricts changes
  const filteredDistricts = useMemo(() => {
    if (formData.stateId && formData.stateId !== 0) {
      return allDistricts.filter((d: any) => d.stateId === Number(formData.stateId));
    }
    return [];
  }, [formData.stateId, allDistricts]);

  // Memoized state options for dropdown
  const stateOptions = useMemo(
    () => states.map((state: any) => ({ label: state.name, value: state.id })),
    [states]
  );

  // Memoized district options for dropdown
  const districtOptions = useMemo(
    () => filteredDistricts.map((district: any) => ({ label: district.name, value: district.id })),
    [filteredDistricts]
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<Tehsil> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Tehsil Name',
          width: '18%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        { field: 'districtId', header: 'District ID', width: '10%', filterType: 'number' },
        { field: 'stateId', header: 'State ID', width: '10%', filterType: 'number' },
        {
          field: 'subDistrictCode',
          header: 'Sub-District Code',
          width: '12%',
          filterType: 'text',
          body: (row) => <span className="badge bg-secondary">{row.subDistrictCode || 'N/A'}</span>,
        },
        { field: 'deptDivisionId', header: 'Dept Division ID', width: '10%', filterType: 'number' },
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
      globalFilterFields: ['name', 'subDistrictCode'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No tehsils found.',
    }),
    []
  );

  // Memoized row actions
  const rowActions: RowAction<Tehsil>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (tehsil) => handleEdit(tehsil),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (tehsil) => handleToggle(tehsil),
        tooltip: 'Toggle Status',
        visible: (tehsil) => !tehsil.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (tehsil) => handleToggle(tehsil),
        tooltip: 'Deactivate',
        visible: (tehsil) => tehsil.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (tehsil) => handleDelete(tehsil),
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
      if (!formData.districtId || formData.districtId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'District must be selected',
        });
        return;
      }
      try {
        const submitData = {
          name: formData.name,
          stateId: Number(formData.stateId),
          districtId: Number(formData.districtId),
          subDistrictCode: formData.subDistrictCode || null,
          deptDivisionId: formData.deptDivisionId ? parseInt(formData.deptDivisionId) : null,
          lgDistrictId: formData.lgDistrictId ? parseInt(formData.lgDistrictId) : null,
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Tehsil updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Tehsil created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving tehsil',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((tehsil: Tehsil) => {
    setFormData({
      name: tehsil.name,
      stateId: tehsil.stateId,
      districtId: tehsil.districtId,
      subDistrictCode: tehsil.subDistrictCode || '',
      deptDivisionId: tehsil.deptDivisionId?.toString() || '',
      lgDistrictId: tehsil.lgDistrictId?.toString() || '',
      isActive: tehsil.isActive,
    });
    setEditingId(tehsil.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (tehsil: Tehsil) => {
      if (confirm(`Are you sure you want to delete ${tehsil.name}?`)) {
        try {
          await deleteMutation.mutateAsync(tehsil.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Tehsil deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting tehsil',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (tehsil: Tehsil) => {
      try {
        await toggleMutation.mutateAsync(tehsil.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Tehsil ${tehsil.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating tehsil status',
        });
      }
    },
    [toggleMutation]
  );

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      stateId: 0,
      districtId: 0,
      subDistrictCode: '',
      deptDivisionId: '',
      lgDistrictId: '',
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
        label="Add Tehsil"
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
        <h1 className="h2 mb-3">Tehsil Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Tehsil' : 'Add New Tehsil'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Tehsil Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter tehsil name"
              className="w-100"
              required
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
              onChange={(e) => setFormData((prev) => ({ ...prev, stateId: e.value, districtId: 0 }))}
              options={stateOptions}
              placeholder="Select State"
              disabled={statesLoading}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          {/* District Dropdown - PrimeReact with Virtual Scroll */}
          <div className="mb-3">
            <label htmlFor="districtId" className="form-label">
              District *{' '}
              {filteredDistricts.length > 0 && <span className="badge bg-info">{filteredDistricts.length}</span>}
            </label>
            <Dropdown
              id="districtId"
              name="districtId"
              value={formData.districtId}
              onChange={(e) => setFormData((prev) => ({ ...prev, districtId: e.value }))}
              options={districtOptions}
              placeholder={filteredDistricts.length === 0 ? 'No districts available' : 'Select District'}
              disabled={districtsLoading || formData.stateId === 0 || filteredDistricts.length === 0}
              virtualScrollerOptions={{ itemSize: 38 }}
              className="w-100"
              showClear
              filter
            />
          </div>

          <div className="mb-3">
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

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="deptDivisionId" className="form-label">
                Dept Division ID
              </label>
              <InputText
                id="deptDivisionId"
                name="deptDivisionId"
                type="number"
                value={formData.deptDivisionId}
                onChange={handleInputChange}
                placeholder="Dept Division ID"
                className="w-100"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="lgDistrictId" className="form-label">
                LG District ID
              </label>
              <InputText
                id="lgDistrictId"
                name="lgDistrictId"
                type="number"
                value={formData.lgDistrictId}
                onChange={handleInputChange}
                placeholder="LG District ID"
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

      <ReusableDataTable<Tehsil>
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
