'use client';
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
  useServiceSectors,
  useCreateServiceSector,
  useUpdateServiceSector,
  useDeleteServiceSector,
  useToggleServiceSector,
} from '@/hooks/master/useServicesectors';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { exportToCSV, exportToExcel, exportToPDF, prepareModuleExportData } from '@/lib/export-utils';

import { servicesectorExportConfig } from '@/lib/export-configs';

interface ServiceSector {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ServiceSectorMaster = () => {

  /** 🔥 Fetch API Data */
  const { data: servicesectors = [], isLoading } = useServiceSectors();
  const createMutation = useCreateServiceSector();
  const updateMutation = useUpdateServiceSector();
  const deleteMutation = useDeleteServiceSector();
  const toggleMutation = useToggleServiceSector();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [serviceData, setformData] = useState({
    name: '',
    isActive: true,
  });

  /** 🔥 FIX: Memoize incoming server data */
  const initialData = useMemo(() => servicesectors, [servicesectors]);

  /** 🔥 Use your DataTable Manager Hook */
  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<ServiceSector>(initialData);

  /** 🔥 FIX: Memoize table config */
  const tableConfig: ReusableDataTableConfig<ServiceSector> = useMemo(
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
          header: 'Service Sector Name',
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
            <Tag
              value={row.isActive ? 'Active' : 'Inactive'}
              severity={row.isActive ? 'success' : 'danger'}
            />
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
      emptyMessage: 'No Servicesector found.',
    }),
    []
  );

  // Row actions - with Service generic type
  const rowActions: RowAction<ServiceSector>[] = [
    {
      icon: 'pi pi-pencil',
      label: 'Edit',
      severity: 'info',
      onClick: (servicesector) => handleEdit(servicesector),
      tooltip: 'Edit',
    },
    {
      icon: 'pi pi-check',
      label: 'Toggle',
      severity: 'success',
      onClick: (servicesector) => handleToggle(servicesector),
      tooltip: 'Toggle Status',
      visible: (servicesector) => !servicesector.isActive,
    },
    {
      icon: 'pi pi-times',
      label: 'Deactivate',
      severity: 'warn',
      onClick: (servicesector) => handleToggle(servicesector),
      tooltip: 'Deactivate',
      visible: (servicesector) => servicesector.isActive,
    },
    {
      icon: 'pi pi-trash',
      label: 'Delete',
      severity: 'error',
      onClick: (servicesector) => handleDelete(servicesector),
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
          detail: 'Service sector updated successfully',
        });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Service sector created successfully',
        });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err.response?.data?.message || 'Error saving service sector',
      });
    }
  };

  const handleEdit = (servicesector: ServiceSector) => {
    setformData({
      name: servicesector.name,
      isActive: servicesector.isActive,
    });
    setEditingId(servicesector.id);
    setShowDialog(true);
  };

  const handleDelete = async (servicesector: ServiceSector) => {
    if (confirm(`Are you sure you want to delete ${servicesector.name}?`)) {
      try {
        await deleteMutation.mutateAsync(servicesector.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Service sector deleted successfully',
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error deleting service sector',
        });
      }
    }
  };

  const handleToggle = async (servicesector: ServiceSector) => {
    try {
      await toggleMutation.mutateAsync(servicesector.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Service Sector ${servicesector.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error updating service sector status',
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

      const exportData = prepareModuleExportData(filteredData, servicesectorExportConfig);
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

      const exportData = prepareModuleExportData(filteredData, servicesectorExportConfig);
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

      const exportData = prepareModuleExportData(filteredData, servicesectorExportConfig);
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
      label="Add Service Sector"
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
        <h1 className="h2 mb-3">Service Sector Master</h1>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Service Sector' : 'Add New Service Sector'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">
              Service sector Name *
            </label>
            <InputText
              id="name"
              name="name"
              value={serviceData.name}
              onChange={handleInputChange}
              placeholder="Enter Service sector name"
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

      <ReusableDataTable<ServiceSector>
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

