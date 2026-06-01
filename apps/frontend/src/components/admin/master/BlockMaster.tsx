
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
  useBlocks,
  useCreateBlock,
  useUpdateBlock,
  useDeleteBlock,
  useToggleBlock,
} from '@/hooks/master/useBlocks';
import { useStates } from '@/hooks/master/useStates';
import { useDistricts } from '@/hooks/master/useDistricts';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { blockExportConfig } from '@/lib/export-configs';

interface Block {
  id: number;
  name: string;
  districtId: number;
  stateId: number;
  unitCategory?: string;
  districtCode?: string;
  lgCodeDistrictId?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const BlockMaster = () => {
  const { data: blocks = [], isLoading } = useBlocks();
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: allDistricts = [], isLoading: districtsLoading } = useDistricts();
  const createMutation = useCreateBlock();
  const updateMutation = useUpdateBlock();
  const deleteMutation = useDeleteBlock();
  const toggleMutation = useToggleBlock();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    stateId: 0,
    districtId: 0,
    unitCategory: '',
    districtCode: '',
    lgCodeDistrictId: '', // keep as string in form; convert to number at submit
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
  } = useDataTableManager<Block>(blocks);

  // Use export handler hook
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    blockExportConfig,
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

  // Memoized unit category options
  const unitCategoryOptions = useMemo(
    () => [
      { label: 'Select Category', value: '' },
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'B+', value: 'B+' },
      { label: 'C', value: 'C' },
      { label: 'D', value: 'D' },
    ],
    []
  );

  // Memoized table config - never recreates unless blocks change
  const tableConfig: ReusableDataTableConfig<Block> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'name',
          header: 'Block Name',
          width: '18%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        { field: 'districtId', header: 'District ID', width: '10%', filterType: 'number' },
        { field: 'stateId', header: 'State ID', width: '10%', filterType: 'number' },
        {
          field: 'unitCategory',
          header: 'Unit Category',
          width: '10%',
          filterType: 'text',
          body: (row) => (
            <span style={{ color: '#6c757d', fontFamily: 'monospace', fontWeight: 500 }}>
              {row.unitCategory || 'N/A'}
            </span>
          ),
        },
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
      globalFilterFields: ['name', 'unitCategory'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No blocks found.',
    }),
    []
  );

  // Memoized row actions - never recreates
  const rowActions: RowAction<Block>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (block) => handleEdit(block),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Toggle',
        severity: 'success',
        onClick: (block) => handleToggle(block),
        tooltip: 'Toggle Status',
        visible: (block) => !block.isActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (block) => handleToggle(block),
        tooltip: 'Deactivate',
        visible: (block) => block.isActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (block) => handleDelete(block),
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
        // ✅ convert string -> number (or undefined) for lgCodeDistrictId
        const lgCodeDistrictIdNum =
          formData.lgCodeDistrictId === '' ? undefined : Number(formData.lgCodeDistrictId);

        const submitData = {
          name: formData.name,
          stateId: formData.stateId!,
          districtId: formData.districtId!,
          unitCategory: formData.unitCategory ?? undefined,   // string | undefined
          districtCode: formData.districtCode ?? undefined,   // string | undefined
          lgCodeDistrictId: lgCodeDistrictIdNum,              // number | undefined ✅
          isActive: formData.isActive,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Block updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Block created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving block',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation]
  );

  const handleEdit = useCallback((block: Block) => {
    setFormData({
      name: block.name,
      stateId: block.stateId,
      districtId: block.districtId,
      unitCategory: block.unitCategory || '',
      districtCode: block.districtCode || '',
      lgCodeDistrictId: block.lgCodeDistrictId?.toString() || '',
      isActive: block.isActive,
    });
    setEditingId(block.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (block: Block) => {
      if (confirm(`Are you sure you want to delete ${block.name}?`)) {
        try {
          await deleteMutation.mutateAsync(block.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Block deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting block',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (block: Block) => {
      try {
        await toggleMutation.mutateAsync(block.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Block ${block.isActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating block status',
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
      unitCategory: '',
      districtCode: '',
      lgCodeDistrictId: '',
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
        label="Add Block"
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
        <h1 className="h2 mb-3">Block Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Block' : 'Add New Block'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Block Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter block name"
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
              District{' '}
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

          {/* Unit Category - Dropdown */}
          <div className="mb-3">
            <label htmlFor="unitCategory" className="form-label">
              Unit Category
            </label>
            <Dropdown
              id="unitCategory"
              name="unitCategory"
              value={formData.unitCategory}
              onChange={(e) => setFormData((prev) => ({ ...prev, unitCategory: e.value }))}
              options={unitCategoryOptions}
              placeholder="Select Category"
              className="w-100"
              showClear
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="districtCode" className="form-label">
                District Code
              </label>
              <InputText
                id="districtCode"
                name="districtCode"
                value={formData.districtCode}
                onChange={handleInputChange}
                placeholder="District Code"
                className="w-100"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="lgCodeDistrictId" className="form-label">
                LG Code District ID
              </label>
              <InputText
                id="lgCodeDistrictId"
                name="lgCodeDistrictId"
                type="number"
                value={formData.lgCodeDistrictId}
                onChange={handleInputChange}
                placeholder="LG Code District ID"
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

      <ReusableDataTable<Block>
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
