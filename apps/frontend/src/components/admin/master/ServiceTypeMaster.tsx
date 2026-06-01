'use client';

import { CheckCircle, XCircle } from "lucide-react";
import { useMemo, useRef, useState } from 'react';
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
  useServiceTypes,
  useCreateServiceType,
  useUpdateServiceType,
  useDeleteServiceType,
  useToggleServiceType,
} from '@/hooks/master/useServicetypes';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { exportToCSV, exportToExcel, exportToPDF, prepareModuleExportData } from '@/lib/export-utils';

import { servicetypeExportConfig } from '@/lib/export-configs';

interface ServiceType {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ServiceTypeMaster = () => {

  /** 🔥 Fetch API Data */
  const { data: servicetypes = [], isLoading } = useServiceTypes();
  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();
  const deleteMutation = useDeleteServiceType();
  const toggleMutation = useToggleServiceType();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [serviceData, setformData] = useState({
    name: '',
    isActive: true,
  });

  /** 🔥 FIX: Memoize incoming server data */
  const initialData = useMemo(() => servicetypes, [servicetypes]);

  /** 🔥 Use your DataTable Manager Hook */
  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<ServiceType>(initialData);

  /** 🔥 FIX: Memoize table config */
  const tableConfig: ReusableDataTableConfig<ServiceType> = useMemo(
    () => ({
      columns: [
        {
          field: 'id',
          header: 'ID',
          width: '5%',
          filterType: 'none',
        },
        {
          field: 'name',
          header: 'Service Type Name',
          width: '45%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: 'isActive',
          header: 'Status',
          width: '15%',
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
          width: '15%',
          filterType: 'date',
          body: (row) =>
            new Date(row.createdAt).toLocaleDateString('en-IN'),
        },
      ],

      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['name'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Servicetype found.',
    }),
    []
  );

  // Row actions - with Service generic type
  const rowActions: RowAction<ServiceType>[] = [
    {
      icon: 'pi pi-pencil',
      label: 'Edit',
      severity: 'info',
      onClick: (servicetype) => handleEdit(servicetype),
      tooltip: 'Edit',
    },
    {
      icon: 'pi pi-check',
      label: 'Toggle',
      severity: 'success',
      onClick: (servicetype) => handleToggle(servicetype),
      tooltip: 'Toggle Status',
      visible: (servicetype) => !servicetype.isActive,
    },
    {
      icon: 'pi pi-times',
      label: 'Deactivate',
      severity: 'warn',
      onClick: (servicetype) => handleToggle(servicetype),
      tooltip: 'Deactivate',
      visible: (servicetype) => servicetype.isActive,
    },
    {
      icon: 'pi pi-trash',
      label: 'Delete',
      severity: 'error',
      onClick: (servicetype) => handleDelete(servicetype),
      tooltip: 'Delete',
    },
  ];

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target as any;
    setformData({
      ...serviceData,
      [name]: type === 'checkbox' ? (e.target as any).checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        name: serviceData.name,
        isActive: serviceData.isActive,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Servicetype updated successfully',
        });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Servicetype created successfully',
        });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.response?.data?.message || 'Error saving servicetype',
      });
    }
  };

  const handleEdit = (servicetype: ServiceType) => {
    setformData({
      name: servicetype.name,
      isActive: servicetype.isActive,
    });
    setEditingId(servicetype.id);
    setShowDialog(true);
  };

  const handleDelete = async (servicetype: ServiceType) => {
    if (confirm(`Are you sure you want to delete ${servicetype.name}?`)) {
      try {
        await deleteMutation.mutateAsync(servicetype.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Servicetype deleted successfully',
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error deleting servicetype',
        });
      }
    }
  };

  const handleToggle = async (servicetype: ServiceType) => {
    try {
      await toggleMutation.mutateAsync(servicetype.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `ServiceType ${servicetype.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error updating servicetype status',
      });
    }
  };


  const resetForm = () => {
    setformData({
      name: '',
      isActive: true,
    });
    setEditingId(null);
  };


  // Export handlers
  const handleExportCSV = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: 'No data to export. Please check your filters.',
        });
        setExporting(false);
        return;
      }

      const exportData = prepareModuleExportData(filteredData, servicetypeExportConfig);
      exportToCSV(exportData);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `CSV file exported successfully (${filteredData.length} records)`,
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export CSV file',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: 'No data to export. Please check your filters.',
        });
        setExporting(false);
        return;
      }

      const exportData = prepareModuleExportData(filteredData, servicetypeExportConfig);
      await exportToExcel(exportData);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Excel file exported successfully (${filteredData.length} records)`,
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export Excel file',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({
          severity: 'warn',
          summary: 'Warning',
          detail: 'No data to export. Please check your filters.',
        });
        setExporting(false);
        return;
      }

      const exportData = prepareModuleExportData(filteredData, servicetypeExportConfig);
      exportToPDF(exportData);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `PDF file exported successfully (${filteredData.length} records)`,
      });
    } catch (error) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to export PDF file',
      });
    } finally {
      setExporting(false);
    }
  };

  // Toolbar
  const leftToolbarTemplate = () => (
    <Button
      label="Add Service Type"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  );

  const rightToolbarTemplate = () => (
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
        onClick={handleExportCSV}
        loading={exporting}
        disabled={isLoading}
      />
      <Button
        label="Excel"
        icon="pi pi-file-excel"
        severity="success"
        rounded
        onClick={handleExportExcel}
        loading={exporting}
        disabled={isLoading}
      />
      <Button
        label="PDF"
        icon="pi pi-file-pdf"
        severity="warning"
        rounded
        onClick={handleExportPDF}
        loading={exporting}
        disabled={isLoading}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4">
        <h1 className="h2 mb-3">Service Type Master</h1>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
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
              Service Type Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={serviceData.name}
              onChange={handleInputChange}
              placeholder="Enter Service Type name"
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
                checked={serviceData.isActive}
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
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<ServiceType>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
      />
    </div>
  );
};

