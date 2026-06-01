
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import {
  useActPolicyNotifications,
  useCreateActPolicyNotification,
  useUpdateActPolicyNotification,
  useDeleteActPolicyNotification,
  useToggleActPolicyNotification,
  useUploadActPolicyDocument,
} from '@/hooks/master/useActPolicyNotifications';

import { useDepartments } from '@/hooks/master/useDepartments';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { ActPolicyNotificationAmendmentDialog } from '@/components/admin/master/ActPolicyNotificationAmendmentDialog';
import DocumentUpload from '@/components/common/DocumentUpload';
import { useExportHandler } from '@/hooks/useExportHandler';
import { actPolicyNotificationExportConfig } from '@/lib/export-configs';

/* ================= TYPES ================= */

type ActPolicyNotificationType = 'Act' | 'Policy' | 'Notification';

interface ActPolicyNotification {
  id: number;
  type: ActPolicyNotificationType;
  level?: string;
  name: string;
  brief?: string;
  englishfilePath?: string;
  hindifilePath?: string;
  start_date?: string | null;
  end_date?: string | null;
  isActive: boolean;
  createdAt: string;
  departments?: {
    department: { id: number; name: string };
  }[];
}

interface ActPolicyNotificationFormData {
  type: ActPolicyNotificationType;
  level: string;
  name: string;
  brief: string;
  englishfilePath: string;
  hindifilePath: string;
  start_date: string | null;
  end_date: string | null;
  departmentIds: number[];
  isActive: boolean;
}

interface Props {
  visible: boolean;
  onHide: () => void;
  actPolicyNotification: ActPolicyNotification;
}

/* ================= COMPONENT ================= */

export const ActPolicyNotificationMaster = () => {
  /** 🔥 API hooks */
  const { data = [], isLoading } = useActPolicyNotifications();
  const { data: departments = [] } = useDepartments();
  const createMutation = useCreateActPolicyNotification();
  const updateMutation = useUpdateActPolicyNotification();
  const deleteMutation = useDeleteActPolicyNotification();
  const toggleMutation = useToggleActPolicyNotification();
  const uploadMutation = useUploadActPolicyDocument();

  const [showAmendments, setShowAmendments] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActPolicyNotification | null>(null);

  /** 🔥 UI state */
  const toastRef = useRef<Toast | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // ✅ Use export handler, asserting ref type to satisfy the hook’s signature
  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    actPolicyNotificationExportConfig,
    toastRef as React.RefObject<Toast>
  );

  const [formData, setFormData] = useState<ActPolicyNotificationFormData>({
    type: 'Act',
    level: '',
    name: '',
    brief: '',
    englishfilePath: '',
    hindifilePath: '',
    start_date: null,
    end_date: null,
    departmentIds: [],
    isActive: true,
  });

  /** 🔥 Table data manager */
  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<ActPolicyNotification>(
    useMemo(() => data, [data])
  );

  /** 🔥 Table config (Service-style) */
  const tableConfig: ReusableDataTableConfig<ActPolicyNotification> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'type',
          header: 'Type',
          width: '20%',
          filterType: 'select',
          filterOptions: [
            { label: 'Act', value: 'Act' },
            { label: 'Policy', value: 'Policy' },
            { label: 'Notification', value: 'Notification' },
          ],
        },
        {
          field: 'name',
          header: 'Name',
          width: '30%',
          filterType: 'text',
          body: (row) => <strong>{row.name}</strong>,
        },
        {
          field: 'level',
          header: 'Level',
          width: '20%',
          filterType: 'text',
        },
        {
          field: 'createdAt',
          header: 'Created Date',
          width: '20%',
          filterType: 'date',
          body: (row) =>
            new Date(row.createdAt).toLocaleDateString('en-IN'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['name', 'level'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Act / Policy / Notification found.',
    }),
    []
  );

  /** 🔥 Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitData: any = {
        ...formData,
        start_date: formData.start_date
          ? new Date(formData.start_date).toISOString()
          : null,
        end_date: formData.end_date
          ? new Date(formData.end_date).toISOString()
          : null,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Record updated successfully' });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Record created successfully' });
      }

      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Error saving record',
      });
    }
  };

  /** 🔥 Edit */
  const handleEdit = (row: ActPolicyNotification) => {
    setFormData({
      type: row.type,
      level: row.level || '',
      name: row.name,
      brief: row.brief || '',
      englishfilePath: row.englishfilePath || '',
      hindifilePath: row.hindifilePath || '',
      start_date: row.start_date ? row.start_date.split('T')[0] : null,
      end_date: row.end_date ? row.end_date.split('T')[0] : null,
      departmentIds: row.departments?.map((d) => d.department.id) || [],
      isActive: row.isActive,
    });

    setEditingId(row.id);
    setShowDialog(true);
  };

  const handleDocumentUpload = async (file: File) => {
    const res = await uploadMutation.mutateAsync(file);
    return res.filePath; // backend should return { filePath }
  };

  /** 🔥 Delete */
  const handleDelete = async (row: ActPolicyNotification) => {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  };

  /** 🔥 Toggle */
  const handleToggle = async (row: ActPolicyNotification) => {
    await toggleMutation.mutateAsync(row.id);
  };

  /** 🔥 Row actions */
  const rowActions: RowAction<ActPolicyNotification>[] = [
    { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: handleEdit },
    { icon: 'pi pi-sitemap', label: 'Amendments', severity: 'secondary', tooltip: 'Manage Amendments', onClick: (row) => { setSelectedRow(row); setShowAmendments(true);},},
    { label: 'Toggle', icon: 'pi pi-check', severity: 'success', onClick: handleToggle },
    { label: 'Delete', icon: 'pi pi-trash', severity: 'error', onClick: handleDelete },
  ];

  /** 🔥 Reset */
  const resetForm = () => {
    setFormData({
      type: 'Act',
      level: '',
      name: '',
      brief: '',
      englishfilePath: '',
      hindifilePath: '',
      start_date: null,
      end_date: null,
      departmentIds: [],
      isActive: true,
    });
    setEditingId(null);
  };

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

  const leftToolbarTemplate = () => (
    <Button
      label="Add Act / Policy / Notification"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  );

  /* ================= RENDER ================= */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Act / Policy / Notification Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Record' : 'Add Record'}
        modal
        style={{ width: '50vw' }}
      >
        <form onSubmit={handleSubmit}>
          {/* ================= Type ================= */}
          <div className="mb-3">
            <label className="form-label">Type *</label>
            <Dropdown
              value={formData.type}
              options={[
                { label: 'Act', value: 'Act' },
                { label: 'Policy', value: 'Policy' },
                { label: 'Notification', value: 'Notification' },
              ]}
              onChange={(e) => setFormData({ ...formData, type: e.value })}
              className="w-100"
              placeholder="Select Type"
            />
          </div>

          {/* ================= Level ================= */}
          <div className="mb-3">
            <label className="form-label">Level</label>
            <Dropdown
              value={formData.level}
              options={[
                { label: 'Central', value: 'Central' },
                { label: 'State', value: 'State' },
              ]}
              onChange={(e) => setFormData({ ...formData, level: e.value })}
              className="w-100"
              placeholder="Select Level"
            />
          </div>

          {/* ================= Name ================= */}
          <div className="mb-3">
            <label className="form-label">Name *</label>
            <InputText
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-100"
              required
              placeholder="Enter Act / Policy / Notification Name"
            />
          </div>

          {/* ================= Brief ================= */}
          <div className="mb-3">
            <label className="form-label">Brief</label>
            <InputTextarea
              value={formData.brief}
              onChange={(e) =>
                setFormData({ ...formData, brief: e.target.value })
              }
              className="w-100"
              rows={3}
              placeholder="Short description / summary"
            />
          </div>

          {/* ================= Documents ================= */}
          <div className="mb-3 grid">
            <DocumentUpload
              label="English Document"
              field="englishfilePath"
              value={formData.englishfilePath}
              onUpload={handleDocumentUpload}
              onChange={(field, value) =>
                setFormData({ ...formData, [field]: value })
              }
            />

            <DocumentUpload
              label="Hindi Document"
              field="hindifilePath"
              value={formData.hindifilePath}
              onUpload={handleDocumentUpload}
              onChange={(field, value) =>
                setFormData({ ...formData, [field]: value })
              }
            />
          </div>

          {/* ================= Departments ================= */}
          <div className="mb-3">
            <label className="form-label">Departments</label>
            <MultiSelect
              value={formData.departmentIds}
              options={departments}
              optionLabel="name"
              optionValue="id"
              display="chip"
              className="w-100"
              placeholder="Select Departments"
              onChange={(e) =>
                setFormData({ ...formData, departmentIds: e.value })
              }
            />
          </div>

          {/* ================= Start Date ================= */}
          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <InputText
              type="date"
              value={formData.start_date ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-100"
            />
          </div>

          {/* ================= End Date ================= */}
          <div className="mb-3">
            <label className="form-label">End Date</label>
            <InputText
              type="date"
              value={formData.end_date ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              className="w-100"
            />
          </div>

          {/* ================= Active Status ================= */}
          <div className="mb-3">
            <label className="form-label">Status</label>
            <Dropdown
              value={formData.isActive}
              options={[
                { label: 'Active', value: true },
                { label: 'Inactive', value: false },
              ]}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.value })
              }
              className="w-100"
            />
          </div>

          {/* ================= Actions ================= */}
          <div className="d-flex gap-2">
            <Button
              label={editingId ? 'Update' : 'Create'}
              icon="pi pi-check"
              type="submit"
              disabled={uploadMutation.isPending}
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              type="button"
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
      />
      {/* Amendments Dialog — MUST BE INSIDE RETURN */}
      {selectedRow && (
        <ActPolicyNotificationAmendmentDialog
          visible={showAmendments}
          onHide={() => setShowAmendments(false)}
          actPolicyNotification={selectedRow}
        />
      )}
    </div>
  );
};
``
