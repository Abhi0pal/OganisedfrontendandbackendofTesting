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
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { FileUpload } from 'primereact/fileupload';
import { Checkbox } from 'primereact/checkbox';
import { useDocumentMasters, useCreateDocumentMaster, useUpdateDocumentMaster, useDeleteDocumentMaster, useToggleDocumentMaster } from '@/hooks/master/useDocumentMasters';
import { useStates } from '@/hooks/master/useStates';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useDocumentTypes } from '@/hooks/master/useDocumentTypes';
import { useDocumentCheckpoints } from '@/hooks/master/useDocumentCheckpoints';
import { useServices } from '@/hooks/master/useServices';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useExportHandler } from '@/hooks/useExportHandler';
import { documentMasterExportConfig } from '@/lib/export-configs';
import apiClient from '@/lib/api-client';

interface DocumentMaster {
  id: number;
  uid?: string;
  checklistId: string;
  stateId: number;
  issuerId: number;
  departmentId: number;
  documentTypeId?: number | null;
  checklistDocumentName: string;
  checklistDocumentExtension: string;
  checklistDocumentMaxSize: number;
  prescribedDocumentFormat?: string;
  prescribedDocumentPath?: string | null;
  services?: number[];
  documentCheckpoints?: number[];
  isMultiVersionAllowed?: boolean;
  isDocValidityRequired?: boolean;
  isDocReferenceNumberRequired?: boolean;
  isAutoInsertAllowed?: boolean;
  issuerById?: number | null;
  isDocActive: boolean;
  tenant_id?: number | null;
  tenant_project_id?: number | null;
  createdAt: string;
  updatedAt: string;
  state?: any;
  issuer?: any;
  department?: any;
  documentType?: any;
}

interface Tenant {
  id: number;
  name: string;
  is_active: boolean;
}

interface TenantProject {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  tenant_id: number;
}

interface DocumentMasterForm {
  checklistId: string;
  stateId: number;
  issuerId: number;
  departmentId: number;
  documentTypeId?: number | null;
  checklistDocumentName: string;
  checklistDocumentExtension: string;
  checklistDocumentMaxSize: number;
  prescribedDocumentPath?: string;
  issuerById?: number;
  services: number[];
  documentCheckpoints: number[];
  isMultiVersionAllowed: boolean;
  isDocValidityRequired: boolean;
  isDocReferenceNumberRequired: boolean;
  isAutoInsertAllowed: boolean;
  isDocActive: boolean;
}

const FILE_EXTENSIONS = [
  { label: 'PDF', value: 'PDF' },
  { label: 'JPEG', value: 'JPEG' },
  { label: 'PNG', value: 'PNG' },
  { label: 'XLSX', value: 'XLSX' },
  { label: 'DOC', value: 'DOC' },
  { label: 'DOCX', value: 'DOCX' },
  { label: 'TXT', value: 'TXT' },
];

export const DocumentMasterComponent = () => {
  // ✅ All loading states properly named
  const { data: documentMasters = [], isLoading: isLoadingDocs } = useDocumentMasters();
  const { data: states = [], isLoading: isLoadingStates } = useStates();
  const { data: issuers = [], isLoading: isLoadingIssuers } = useIssuers();
  const { data: allDepartments = [], isLoading: isLoadingDepts } = useDepartments();
  const { data: documentTypes = [], isLoading: isLoadingDocTypes } = useDocumentTypes();
  const { data: documentCheckpoints = [], isLoading: isLoadingCheckpoints } = useDocumentCheckpoints();
  const { data: services = [], isLoading: isLoadingServices } = useServices();
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants({ isActive: true });
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const { data: tenantProjects = [], isLoading: projectsLoading } = useTenantProjects(selectedTenantId);

  const createMutation = useCreateDocumentMaster();
  const updateMutation = useUpdateDocumentMaster();
  const deleteMutation = useDeleteDocumentMaster();
  const toggleMutation = useToggleDocumentMaster();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [formData, setFormData] = useState<DocumentMasterForm & { tenant_id: number | null; tenant_project_id: number | null }>({
    checklistId: '',
    stateId: 0,
    issuerId: 0,
    departmentId: 0,
    documentTypeId: 0,
    checklistDocumentName: '',
    checklistDocumentExtension: 'PDF',
    checklistDocumentMaxSize: 5,
    prescribedDocumentPath: '',
    issuerById: 0,
    services: [],
    documentCheckpoints: [],
    isMultiVersionAllowed: false,
    isDocValidityRequired: false,
    isDocReferenceNumberRequired: false,
    isAutoInsertAllowed: false,
    isDocActive: true,
    tenant_id: null,
    tenant_project_id: null,
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
  } = useDataTableManager<DocumentMaster>(documentMasters);

  const exportConfig = useMemo(() => {
    // Normalize legacy export-config column shape (key/label) to the expected (field/header)
    const normalizedColumns =
      (documentMasterExportConfig?.columns ?? []).map((col: any) => ({
        header: col.header ?? col.label ?? '',
        field: col.field ?? col.key ?? '',
        formatter: col.formatter,
      })) ?? [];

    return {
      ...documentMasterExportConfig,
      moduleName: 'documentMasters',
      columns: normalizedColumns,
    };
  }, [documentMasterExportConfig]);

  const { handleExportCSV, handleExportExcel, handleExportPDF } = useExportHandler(
    exportConfig,
    toastRef as React.RefObject<Toast>
  );

  const filteredDepartments = useMemo(() => {
    if (formData.issuerId && formData.issuerId !== 0) {
      return allDepartments.filter((d: any) => d.issuerId === Number(formData.issuerId));
    }
    return [];
  }, [formData.issuerId, allDepartments]);

  const stateOptions = useMemo(
    () => states.map((state: any) => ({ label: state.name, value: state.id })),
    [states]
  );

  const issuerOptions = useMemo(
    () => issuers.map((issuer: any) => ({ label: issuer.name, value: issuer.id })),
    [issuers]
  );

  const departmentOptions = useMemo(
    () => filteredDepartments.map((dept: any) => ({ label: dept.name, value: dept.id })),
    [filteredDepartments]
  );

  const documentTypeOptions = useMemo(
    () => documentTypes.map((dt: any) => ({ label: dt.name, value: dt.id })),
    [documentTypes]
  );

  const extensionOptions = useMemo(
    () => FILE_EXTENSIONS.map((ext) => ({ label: ext.label, value: ext.value })),
    []
  );

  const tenantOptions = useMemo(
    () => tenants.map((t: Tenant) => ({ label: t.name, value: t.id })),
    [tenants]
  );

  const tenantProjectOptions = useMemo(
    () => tenantProjects.map((tp: TenantProject) => ({ label: tp.name, value: tp.id })),
    [tenantProjects]
  );

  const servicesOptions = useMemo(
    () =>
      (services ?? []).map((s: any) => ({
        label: s.service_name ?? s.name ?? `Service #${s.id}`,
        value: s.id,
      })),
    [services]
  );

  const checkpointOptions = useMemo(
    () => documentCheckpoints.map((cp: any) => ({ label: cp.name, value: cp.id })),
    [documentCheckpoints]
  );

  const tableConfig: ReusableDataTableConfig<DocumentMaster> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '4%', filterType: 'none' },
        {
          field: 'checklistId',
          header: 'Checklist ID',
          width: '10%',
          filterType: 'text',
          body: (row: DocumentMaster) => <span className="font-semibold">{row.checklistId}</span>,
        },
        {
          field: 'state.name',
          header: 'State',
          width: '8%',
          filterType: 'text',
          body: (row: DocumentMaster) => <span>{row.state?.name || 'N/A'}</span>,
        },
        {
          field: 'issuer.name',
          header: 'Issuer',
          width: '8%',
          filterType: 'text',
          body: (row: DocumentMaster) => <span>{row.issuer?.name || 'N/A'}</span>,
        },
        {
          field: 'department.name',
          header: 'Department',
          width: '8%',
          filterType: 'text',
          body: (row: DocumentMaster) => <span>{row.department?.name || 'N/A'}</span>,
        },
        {
          field: 'documentType.name',
          header: 'Type of Document',
          width: '10%',
          filterType: 'text',
          body: (row: DocumentMaster) => <span>{row.documentType?.name || 'N/A'}</span>,
        },
        {
          field: 'checklistDocumentName',
          header: 'Document Name',
          width: '12%',
          filterType: 'text',
        },
        {
          field: 'checklistDocumentExtension',
          header: 'Extension',
          width: '8%',
          filterType: 'text',
          body: (row: DocumentMaster) => (
            <span style={{ color: '#0099ff', fontWeight: 500 }}>
              {row.checklistDocumentExtension}
            </span>
          ),
        },
        {
          field: 'isDocActive',
          header: 'Status',
          width: '8%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row: DocumentMaster) => (
            <div className="d-flex align-items-center gap-2">
              {row.isDocActive ? (
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
          width: '10%',
          filterType: 'date',
          body: (row: DocumentMaster) => new Date(row.createdAt).toLocaleDateString(),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['checklistId', 'checklistDocumentName'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No document masters found.',
    }),
    []
  );

  const rowActions: RowAction<DocumentMaster>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: (doc: DocumentMaster) => handleEdit(doc),
        tooltip: 'Edit',
      },
      {
        icon: 'pi pi-check',
        label: 'Activate',
        severity: 'success',
        onClick: (doc: DocumentMaster) => handleToggle(doc),
        tooltip: 'Activate',
        visible: (doc: DocumentMaster) => !doc.isDocActive,
      },
      {
        icon: 'pi pi-times',
        label: 'Deactivate',
        severity: 'warn',
        onClick: (doc: DocumentMaster) => handleToggle(doc),
        tooltip: 'Deactivate',
        visible: (doc: DocumentMaster) => doc.isDocActive,
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: (doc: DocumentMaster) => handleDelete(doc),
        tooltip: 'Delete',
      },
    ],
    []
  );

  const resetForm = useCallback(() => {

    setFormData({
      checklistId: '',
      stateId: 0,
      issuerId: 0,
      departmentId: 0,
      documentTypeId: 0,
      checklistDocumentName: '',
      checklistDocumentExtension: 'PDF',
      checklistDocumentMaxSize: 5,
      prescribedDocumentPath: '',
      issuerById: 0,
      services: [],
      documentCheckpoints: [],
      isMultiVersionAllowed: false,
      isDocValidityRequired: false,
      isDocReferenceNumberRequired: false,
      isAutoInsertAllowed: false,
      isDocActive: true,
      tenant_id: null,
      tenant_project_id: null,
    });

    setEditingId(null);
    setSelectedTenantId(null);

  }, []);

  const handleInputChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target || e;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // ✅ NEW: Handle boolean checkbox changes
  const handleBooleanChange = useCallback((fieldName: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  const handleFileUpload = useCallback(async (event: any) => {
    console.log('🔵 handleFileUpload called with:', event);
    const file = event.files[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('📁 File selected:', file.name, file.size);

    setUploadingDocument(true);
    const formDataToSend = new FormData();

    console.log('📋 Appending file to FormData with key "file":', file.name);
    formDataToSend.append('file', file, file.name);

    try {
      console.log('🚀 Uploading to /upload/document');

      const response = await apiClient.post(
        '/upload/document',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('✅ Upload successful:', response.data);
      console.log('📂 Path received:', response.data.path);

      setFormData((prev) => ({
        ...prev,
        prescribedDocumentPath: response.data.path,
      }));

      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Document uploaded: ${response.data.filename}`,
      });
    } catch (err: any) {
      console.error('❌ Upload failed:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);

      toastRef.current?.show({
        severity: 'error',
        summary: 'Upload Error',
        detail: err.response?.data?.message || err.message || 'Error uploading document',
      });
    } finally {
      setUploadingDocument(false);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // ✅ DEBUG: Log the current state before submission
      console.log('🚀 Submitting Form Data:', formData);
      console.log('📂 Prescribed Document Path in State:', formData.prescribedDocumentPath);

      if (!formData.stateId || formData.stateId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'State is required',
        });
        return;
      }

      if (!formData.issuerId || formData.issuerId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Issuer is required',
        });
        return;
      }

      if (!formData.departmentId || formData.departmentId === 0) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Department is required',
        });
        return;
      }

      if (!formData.tenant_id) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Tenant is required',
        });
        return;
      }

      try {
        // Convert MB to bytes for storage
        const maxSizeInBytes = formData.checklistDocumentMaxSize * 1048576;

        const submitData = {
          stateId: Number(formData.stateId),
          issuerId: Number(formData.issuerId),
          departmentId: Number(formData.departmentId),
          documentTypeId: formData.documentTypeId || undefined,
          checklistDocumentName: formData.checklistDocumentName.trim(),
          checklistDocumentExtension: formData.checklistDocumentExtension,
          checklistDocumentMaxSize: maxSizeInBytes,
          prescribedDocumentPath: formData.prescribedDocumentPath || null,
          issuerById: formData.issuerById || undefined,
          services: formData.services.length > 0 ? formData.services : undefined,
          documentCheckpoints: formData.documentCheckpoints.length > 0 ? formData.documentCheckpoints : undefined,
          isMultiVersionAllowed: formData.isMultiVersionAllowed,
          isDocValidityRequired: formData.isDocValidityRequired,
          isDocReferenceNumberRequired: formData.isDocReferenceNumberRequired,
          isAutoInsertAllowed: formData.isAutoInsertAllowed,
          isDocActive: formData.isDocActive,
          tenant_id: formData.tenant_id || null,
          tenant_project_id: formData.tenant_project_id || null,
        };

        console.log('📦 Final Payload to Backend:', submitData);
        console.log('🔍 Tenant ID:', formData.tenant_id, ' | Tenant Project ID:', formData.tenant_project_id);

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Master updated successfully',
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Master created successfully',
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: err.response?.data?.message || 'Error saving document master',
        });
      }
    },
    [formData, editingId, createMutation, updateMutation, resetForm]
  );

  const handleEdit = useCallback((doc: DocumentMaster) => {
    // Convert bytes back to MB for display
    const maxSizeInMB = doc.checklistDocumentMaxSize / 1048576;


    setFormData({
      checklistId: doc.checklistId,
      stateId: doc.stateId,
      issuerId: doc.issuerId,
      departmentId: doc.departmentId,
      documentTypeId: doc.documentTypeId || 0,
      checklistDocumentName: doc.checklistDocumentName,
      checklistDocumentExtension: doc.checklistDocumentExtension,
      checklistDocumentMaxSize: maxSizeInMB,
      prescribedDocumentPath: doc.prescribedDocumentPath || '',
      issuerById: doc.issuerById || 0,
      services: doc.services || [],
      documentCheckpoints: doc.documentCheckpoints || [],
      isMultiVersionAllowed: doc.isMultiVersionAllowed || false,
      isDocValidityRequired: doc.isDocValidityRequired || false,
      isDocReferenceNumberRequired: doc.isDocReferenceNumberRequired || false,
      isAutoInsertAllowed: doc.isAutoInsertAllowed || false,
      isDocActive: doc.isDocActive,
      tenant_id: doc.tenant_id || null,
      tenant_project_id: doc.tenant_project_id || null,
    });

    setEditingId(doc.id);

    setShowDialog(true);

  }, []);

  const handleDelete = useCallback(
    async (doc: DocumentMaster) => {
      if (confirm(`Are you sure you want to delete ${doc.checklistDocumentName}?`)) {
        try {
          await deleteMutation.mutateAsync(doc.id);
          toastRef.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Document Master deleted successfully',
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Error deleting document master',
          });
        }
      }
    },
    [deleteMutation]
  );

  const handleToggle = useCallback(
    async (doc: DocumentMaster) => {
      try {
        await toggleMutation.mutateAsync(doc.id);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Document Master ${doc.isDocActive ? 'deactivated' : 'activated'} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Error updating document master status',
        });
      }
    },
    [toggleMutation]
  );

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
        label="Add Document Master"
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
          disabled={isLoadingDocs}
        />
        <Button
          label="Excel"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={handleExcelExport}
          loading={exporting}
          disabled={isLoadingDocs}
        />
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          onClick={handlePDFExport}
          loading={exporting}
          disabled={isLoadingDocs}
        />
      </div>
    ),
    [exporting, isLoadingDocs, handleCSVExport, handleExcelExport, handlePDFExport, clearFilters, handleGlobalFilterChange, handleFiltersChange]
  );

  const generateChecklistId = useCallback(
    async (stateId: number) => {
      try {
        const stateData = states.find((s: any) => s.id === stateId);
        if (!stateData) return '';

        // Get count of existing document masters for this state
        const existingDocs = documentMasters.filter((d) => d.stateId === stateId);
        const nextNumber = (existingDocs.length + 1).toString().padStart(3, '0');
        const checklistId = `${stateData.abbreviation}-DCL-${nextNumber}`;

        return checklistId;
      } catch (error) {
        console.error('Error generating checklist ID:', error);
        return '';
      }
    },
    [states, documentMasters]
  );


  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Document Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? 'Edit Document Master' : 'Add New Document Master'}
        modal
        style={{ width: '60vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="tenant" className="form-label">
                Tenant *
              </label>
              <Dropdown
                id="tenant"
                name="tenant"
                value={formData.tenant_id}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    tenant_id: e.value,
                    tenant_project_id: null,
                  }));
                  setSelectedTenantId(e.value);
                }}
                options={tenantOptions}
                placeholder="Select Tenant"
                disabled={tenantsLoading}
                virtualScrollerOptions={{ itemSize: 38 }}
                className="w-100"
                showClear
                filter
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="tenantProject" className="form-label">
                Tenant Project
              </label>
              <Dropdown
                id="tenantProject"
                name="tenantProject"
                value={formData.tenant_project_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, tenant_project_id: e.value }))}
                options={tenantProjectOptions}
                placeholder="Select Tenant Project (Optional)"
                disabled={projectsLoading || !formData.tenant_id}
                virtualScrollerOptions={{ itemSize: 38 }}
                className="w-100"
                showClear
                filter
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="stateId" className="form-label">
                State *
              </label>

              <Dropdown
                id="stateId"
                value={formData.stateId}
                onChange={async (e) => {
                  const checklistIdValue = await generateChecklistId(e.value);
                  setFormData((prev) => ({
                    ...prev,
                    stateId: e.value,
                    departmentId: 0,
                    checklistId: checklistIdValue,
                  }));
                }}
                options={stateOptions}
                /* ✅ Use primitive id & readable label */
                optionLabel="label"
                optionValue="value"
                placeholder="Select State"
                disabled={isLoadingStates}
                className="w-100"
                showClear

                /* 🔍 Built-in search — reduces scanning through a long list */
                filter
                filterBy="label"
                filterPlaceholder="Search states..."
                filterMatchMode="contains"

                /* 🚀 Virtual scrolling — big perf win for long lists */
                virtualScrollerOptions={{
                  itemSize: 36,          // approx item height; tune if needed
                  showLoader: false,
                  delay: 0
                }}

                /* 🧱 Constrain overlay width to match 60vw dialog */
                appendTo={typeof window !== 'undefined' ? document.body : undefined}
                pt={{
                  panel: {
                    style: { maxWidth: '60vw', width: 'auto' }
                  }
                }}
              />

            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="checklistIdDisplay" className="form-label">
                Checklist ID
              </label>
              <InputText
                id="checklistIdDisplay"
                value={formData.checklistId}
                disabled
                placeholder="Auto-generated on state selection"
                className="w-100"
              />
              <small className="text-muted">Auto-generated when you select a state</small>
            </div>

            {/* Row 1 */}
          </div>

          {/* Row 2 */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="issuerId" className="form-label">
                Issuer *
              </label>

              <Dropdown
                id="issuerId"
                value={formData.issuerId}
                onChange={(e) => setFormData((prev) => ({ ...prev, issuerId: e.value, departmentId: 0 }))}
                options={issuerOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Issuer"
                disabled={isLoadingIssuers}
                className="w-100"
                showClear
                filter
                filterBy="label"
                filterPlaceholder="Search issuers..."
                filterMatchMode="contains"
                virtualScrollerOptions={{ itemSize: 36 }}
                appendTo={typeof window !== 'undefined' ? document.body : undefined}
                pt={{ panel: { style: { maxWidth: '60vw', width: 'auto' } } }}
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="departmentId" className="form-label">
                Department * ({filteredDepartments.length})
              </label>
              <Dropdown
                id="departmentId"
                value={formData.departmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: e.value }))}
                options={departmentOptions}
                optionLabel="label"
                optionValue="value"
                placeholder={filteredDepartments.length === 0 ? 'No departments available' : 'Select Department'}
                disabled={isLoadingDepts || formData.issuerId === 0 || filteredDepartments.length === 0}
                className="w-100"
                showClear
                filter
                filterBy="label"
                filterPlaceholder="Search departments..."
                filterMatchMode="contains"
                virtualScrollerOptions={{ itemSize: 36 }}
                appendTo={typeof window !== 'undefined' ? document.body : undefined}
                pt={{ panel: { style: { maxWidth: '60vw', width: 'auto' } } }}
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="documentTypeId" className="form-label">
                Type of Document *
              </label>
              <Dropdown
                id="documentTypeId"
                value={formData.documentTypeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, documentTypeId: e.value }))}
                options={documentTypeOptions}
                placeholder="Select Document Type"
                disabled={isLoadingDocTypes}
                className="w-100"
                showClear
                filter
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="issuerById" className="form-label">
                Issuer ID (User who issued)
              </label>
              <InputNumber
                id="issuerById"
                value={formData.issuerById}
                onValueChange={(e) => setFormData((prev) => ({ ...prev, issuerById: e.value || 0 }))}
                className="w-100"
              />
            </div>
          </div>

          {/* Row 4 */}
          <div className="row">
            <div className="col-md-12 mb-3">
              <label htmlFor="checklistDocumentName" className="form-label">
                Checklist Document Name *
              </label>
              <InputText
                id="checklistDocumentName"
                name="checklistDocumentName"
                value={formData.checklistDocumentName}
                onChange={handleInputChange}
                placeholder="Enter document name"
                className="w-100"
                required
              />
            </div>
          </div>

          {/* Row 5 */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="checklistDocumentExtension" className="form-label">
                File Extension *
              </label>
              <Dropdown
                id="checklistDocumentExtension"
                value={formData.checklistDocumentExtension}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, checklistDocumentExtension: e.value }))
                }
                options={extensionOptions}
                placeholder="Select Extension"
                className="w-100"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="checklistDocumentMaxSize" className="form-label">
                Max File Size (MB) *
              </label>
              <InputNumber
                id="checklistDocumentMaxSize"
                value={formData.checklistDocumentMaxSize}
                onValueChange={(e) =>
                  setFormData((prev) => ({ ...prev, checklistDocumentMaxSize: e.value || 5 }))
                }
                min={1}
                max={1000}
                className="w-100"
                required
              />
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="isDocActive" className="form-label">
                Status
              </label>
              <div className="form-check mt-2">
                <input
                  id="isDocActive"
                  name="isDocActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isDocActive}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="isDocActive">
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* ✅ Row 6: NEW BOOLEAN FIELDS */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-check">
                <Checkbox
                  inputId="isMultiVersionAllowed"
                  name="isMultiVersionAllowed"
                  checked={formData.isMultiVersionAllowed}
                  onChange={(e) => handleBooleanChange('isMultiVersionAllowed', e.checked ?? false)}
                />
                <label htmlFor="isMultiVersionAllowed" className="form-check-label ms-2">
                  Allow Multiple Versions
                </label>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-check">
                <Checkbox
                  inputId="isDocValidityRequired"
                  name="isDocValidityRequired"
                  checked={formData.isDocValidityRequired}
                  onChange={(e) => handleBooleanChange('isDocValidityRequired', e.checked ?? false)}
                />
                <label htmlFor="isDocValidityRequired" className="form-check-label ms-2">
                  Document Validity Required
                </label>
              </div>
            </div>
          </div>

          {/* ✅ Row 7: MORE NEW BOOLEAN FIELDS */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="form-check">
                <Checkbox
                  inputId="isDocReferenceNumberRequired"
                  name="isDocReferenceNumberRequired"
                  checked={formData.isDocReferenceNumberRequired}
                  onChange={(e) => handleBooleanChange('isDocReferenceNumberRequired', e.checked ?? false)}
                />
                <label htmlFor="isDocReferenceNumberRequired" className="form-check-label ms-2">
                  Reference Number Required
                </label>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="form-check">
                <Checkbox
                  inputId="isAutoInsertAllowed"
                  name="isAutoInsertAllowed"
                  checked={formData.isAutoInsertAllowed}
                  onChange={(e) => handleBooleanChange('isAutoInsertAllowed', e.checked ?? false)}
                />
                <label htmlFor="isAutoInsertAllowed" className="form-check-label ms-2">
                  Auto Insert Allowed
                </label>
              </div>
            </div>
          </div>


          {/* Row 8 */}
          <div className="row">
            <div className="col-md-12 mb-3">
              <label htmlFor="services" className="form-label">
                Services
              </label>

              <MultiSelect
                id="services"
                value={formData.services}
                onChange={(e) => setFormData((prev) => ({ ...prev, services: e.value ?? [] }))}
                options={servicesOptions}
                optionLabel="label"
                optionValue="value"
                placeholder={servicesOptions.length ? 'Select Services' : 'No services found'}
                disabled={isLoadingServices || servicesOptions.length === 0}
                className="w-100"
                appendTo={typeof window !== 'undefined' ? document.body : undefined}
                /* 🔒 Constrain overlay width to the dialog width (60vw) */
                pt={{
                  panel: {
                    style: { maxWidth: '60vw', width: 'auto' }
                  }
                }}
                display="chip"
                maxSelectedLabels={3}
                /* 🔍 Search & performance (see section 2) */
                filter
                filterBy="label"
                filterPlaceholder="Search services..."
                filterMatchMode="contains"
                virtualScrollerOptions={{
                  itemSize: 40,           // approximate row height for smoother scroll
                  showLoader: false,
                  delay: 0
                }}
              />
            </div>
          </div>

          {/* Row 9 */}
          <div className="row">
            <div className="col-md-12 mb-3">
              <label htmlFor="documentCheckpoints" className="form-label">
                Document Checkpoints (Multi-Select)
              </label>
              <MultiSelect
                id="documentCheckpoints"
                value={formData.documentCheckpoints}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, documentCheckpoints: e.value ?? [] }))
                }
                options={checkpointOptions}
                optionLabel="label"
                optionValue="value"
                placeholder="Select Document Checkpoints"
                disabled={isLoadingCheckpoints}
                className="w-100"
                display="chip"
                maxSelectedLabels={3}
              />

            </div>
          </div>

          {/* Row 10 - AUTO-UPLOAD File Upload */}
          <div className="row">
            <div className="col-md-12 mb-3">
              <label className="form-label">
                Upload Prescribed Document Format <small className="text-muted">(Optional)</small>
              </label>

              {/* ✅ mode="basic" + auto={true} = Click to upload automatically */}
              <div className="border p-3 rounded bg-light">
                <FileUpload
                  mode="basic"
                  name="file"
                  customUpload
                  uploadHandler={handleFileUpload}
                  chooseLabel="Select & Upload Document"
                  auto={true}
                  multiple={false}
                  maxFileSize={104857600}
                  accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.txt"
                  disabled={uploadingDocument}
                />

                {uploadingDocument && (
                  <div className="mt-2 p-2 bg-primary text-white rounded">
                    <i className="pi pi-spin pi-spinner me-2"></i>
                    Uploading document...
                  </div>
                )}
              </div>

              {/* ✅ SHOW UPLOADED FILE */}
              {formData.prescribedDocumentPath && (
                <div className="mt-3 alert alert-success">
                  <i className="pi pi-check-circle me-2 text-success"></i>
                  <strong>✓ Uploaded:</strong> {formData.prescribedDocumentPath.split('/').pop()}
                  <br />
                  <small className="opacity-75">Path: {formData.prescribedDocumentPath}</small>
                </div>
              )}
            </div>
          </div>



          {/* Form Actions */}
          <div className="d-flex gap-2 mt-4">
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

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoadingDocs}
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
