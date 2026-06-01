'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import DocumentUpload from '@/components/common/DocumentUpload';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useServices } from '@/hooks/master/useServices';
import {
  useInformationWizards,
  useCreateInformationWizard,
  useUpdateInformationWizard,
  useDeleteInformationWizard,
  useToggleInformationWizard,
  useUploadInformationWizardDocument,
} from '@/hooks/useInformationWizard';
import { useExportHandler } from '@/hooks/useExportHandler';
import { informationWizardExportConfig } from '@/lib/export-configs';

type WizardRecord = {
  id: number;
  serviceId: number;
  statuaryFormPath?: string | null;
  feeStructurePath?: string | null;
  sopDocumentPath?: string | null;
  stageWiseTimelinePath?: string | null;
  statuaryTimelinePath?: string | null;
  statuaryTimelineText?: string | null;
  inspectionChecklistPath?: string | null;
  riskCategory?: string | null;
  sizeOfFirm?: string | null;
  businessLocation?: string | null;
  investorType?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: number;
    service_name?: string;
    department?: { id: number; name: string };
  };
};

type ServiceOption = {
  id: number;
  department_id: number;
  service_name?: string;
};

interface WizardFormData {
  departmentId: number | null;
  serviceId: number | null;
  statuaryFormPath: string | null;
  feeStructurePath: string | null;
  sopDocumentPath: string | null;
  stageWiseTimelinePath: string | null;
  statuaryTimelinePath: string | null;
  statuaryTimelineText: string;
  inspectionChecklistPath: string | null;
  riskCategory: string[];
  sizeOfFirm: string[];
  businessLocation: string[];
  investorType: string[];
  isActive: boolean;
}

const riskCategoryOptions = [
  'High',
  'Medium',
  'Low',
  'Red',
  'Orange',
  'Green',
  'White',
].map((value) => ({ label: value, value }));

const sizeOfFirmOptions = [
  'Micro',
  'Small',
  'Medium',
  'Large',
  'Mega',
  'Ultra-Mega',
  'Super Ultra-Mega',
].map((value) => ({ label: value, value }));

const businessLocationOptions = [
  'Urban-Plain',
  'Urban-Hilly',
  'Rural-Plain',
  'Rural-Hilly',
].map((value) => ({ label: value, value }));

const investorTypeOptions = ['Foreign', 'Domestic'].map((value) => ({
  label: value,
  value,
}));

const splitCsv = (value?: string | null) =>
  value ? value.split(',').map((v) => v.trim()).filter(Boolean) : [];

const joinCsv = (value: string[]) => (value.length ? value.join(',') : null);

export const InformationWizard = () => {
  const { data = [], isLoading } = useInformationWizards();
  const { data: departments = [] } = useDepartments();
  const { data: services = [] } = useServices();
  const createMutation = useCreateInformationWizard();
  const updateMutation = useUpdateInformationWizard();
  const deleteMutation = useDeleteInformationWizard();
  const toggleMutation = useToggleInformationWizard();
  const uploadMutation = useUploadInformationWizardDocument();

  const toastRef = useRef<Toast | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<WizardRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const { handleExportCSV, handleExportExcel, handleExportPDF } =
    useExportHandler(
      informationWizardExportConfig,
      toastRef as React.RefObject<Toast>
    );

  const [formData, setFormData] = useState<WizardFormData>({
    departmentId: null,
    serviceId: null,
    statuaryFormPath: null,
    feeStructurePath: null,
    sopDocumentPath: null,
    stageWiseTimelinePath: null,
    statuaryTimelinePath: null,
    statuaryTimelineText: '',
    inspectionChecklistPath: null,
    riskCategory: [],
    sizeOfFirm: [],
    businessLocation: [],
    investorType: [],
    isActive: true,
  });

  const filteredServices = useMemo(() => {
    if (!formData.departmentId) return [];
    return services.filter(
      (service: ServiceOption) => service.department_id === formData.departmentId
    );
  }, [services, formData.departmentId]);

  useEffect(() => {
    if (!formData.departmentId) {
      setFormData((prev) => ({ ...prev, serviceId: null }));
    }
  }, [formData.departmentId]);

  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<WizardRecord>(useMemo(() => data, [data]));

  const tableConfig: ReusableDataTableConfig<WizardRecord> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '5%', filterType: 'none' },
        {
          field: 'service.service_name',
          header: 'Service',
          width: '30%',
          filterType: 'text',
          body: (row) => <strong>{row.service?.service_name || 'N/A'}</strong>,
        },
        {
          field: 'service.department.name',
          header: 'Department',
          width: '20%',
          filterType: 'text',
          body: (row) => row.service?.department?.name || 'N/A',
        },
        {
          field: 'riskCategory',
          header: 'Risk Category',
          width: '15%',
          filterType: 'text',
          body: (row) => row.riskCategory || 'N/A',
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
          width: '12%',
          filterType: 'date',
          body: (row) =>
            row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : 'N/A',
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['service.service_name', 'service.department.name', 'riskCategory'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No service details found.',
    }),
    []
  );

  const resetForm = () => {
    setFormData({
      departmentId: null,
      serviceId: null,
      statuaryFormPath: null,
      feeStructurePath: null,
      sopDocumentPath: null,
      stageWiseTimelinePath: null,
      statuaryTimelinePath: null,
      statuaryTimelineText: '',
      inspectionChecklistPath: null,
      riskCategory: [],
      sizeOfFirm: [],
      businessLocation: [],
      investorType: [],
      isActive: true,
    });
    setEditingId(null);
  };

  const handleDocumentUpload = async (file: File) => {
    const res = await uploadMutation.mutateAsync(file);
    return res.filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceId) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Missing Service',
        detail: 'Please select a service before saving.',
      });
      return;
    }

    const payload = {
      serviceId: formData.serviceId,
      statuaryFormPath: formData.statuaryFormPath,
      feeStructurePath: formData.feeStructurePath,
      sopDocumentPath: formData.sopDocumentPath,
      stageWiseTimelinePath: formData.stageWiseTimelinePath,
      statuaryTimelinePath: formData.statuaryTimelinePath,
      statuaryTimelineText: formData.statuaryTimelineText || null,
      inspectionChecklistPath: formData.inspectionChecklistPath,
      riskCategory: joinCsv(formData.riskCategory),
      sizeOfFirm: joinCsv(formData.sizeOfFirm),
      businessLocation: joinCsv(formData.businessLocation),
      investorType: joinCsv(formData.investorType),
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Service details updated successfully',
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Service details created successfully',
        });
      }

      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Error saving service details',
      });
    }
  };

  const handleEdit = (row: WizardRecord) => {
    setSelectedRow(row);
    setFormData({
      departmentId: row.service?.department?.id ?? null,
      serviceId: row.serviceId,
      statuaryFormPath: row.statuaryFormPath || null,
      feeStructurePath: row.feeStructurePath || null,
      sopDocumentPath: row.sopDocumentPath || null,
      stageWiseTimelinePath: row.stageWiseTimelinePath || null,
      statuaryTimelinePath: row.statuaryTimelinePath || null,
      statuaryTimelineText: row.statuaryTimelineText || '',
      inspectionChecklistPath: row.inspectionChecklistPath || null,
      riskCategory: splitCsv(row.riskCategory),
      sizeOfFirm: splitCsv(row.sizeOfFirm),
      businessLocation: splitCsv(row.businessLocation),
      investorType: splitCsv(row.investorType),
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowDialog(true);
  };

  const handleView = (row: WizardRecord) => {
    setSelectedRow(row);
    setShowDetails(true);
  };

  const handleDelete = async (row: WizardRecord) => {
    if (confirm(`Delete details for ${row.service?.service_name || 'this service'}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  };

  const handleToggle = async (row: WizardRecord) => {
    await toggleMutation.mutateAsync(row.id);
  };

  const rowActions: RowAction<WizardRecord>[] = [
    { label: 'View', icon: 'pi pi-eye', severity: 'secondary', onClick: handleView },
    { label: 'Edit', icon: 'pi pi-pencil', severity: 'info', onClick: handleEdit },
    { label: 'Toggle', icon: 'pi pi-check', severity: 'success', onClick: handleToggle },
    { label: 'Delete', icon: 'pi pi-trash', severity: 'error', onClick: handleDelete },
  ];

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

  const leftToolbarTemplate = () => (
    <Button
      label="Add Service Details"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
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
    <ProtectedRoute requiredRole="admin">
      <div className="p-4">
        <Toast ref={toastRef} />
        <div className="mb-4">
          <h1 className="h2 mb-3">Information Wizard</h1>
          <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
        </div>

        <Dialog
          visible={showDialog}
          onHide={() => setShowDialog(false)}
          header={editingId ? 'Edit Service Details' : 'Add Service Details'}
          modal
          style={{ width: '60vw' }}
          breakpoints={{ '960px': '75vw', '640px': '90vw' }}
        >
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Department *</label>
              <Dropdown
                value={formData.departmentId}
                options={departments}
                optionLabel="name"
                optionValue="id"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    departmentId: e.value,
                    serviceId: null,
                  }))
                }
                className="w-100"
                placeholder="Select Department"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Service *</label>
              <Dropdown
                value={formData.serviceId}
                options={filteredServices}
                optionLabel="service_name"
                optionValue="id"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    serviceId: e.value,
                  }))
                }
                className="w-100"
                placeholder={
                  formData.departmentId
                    ? 'Select Service'
                    : 'Select Department first'
                }
                disabled={!formData.departmentId}
              />
            </div>

            <div className="mb-3 row g-3">
              <DocumentUpload
                label="Statuary Form Upload"
                field="statuaryFormPath"
                value={formData.statuaryFormPath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
              <DocumentUpload
                label="Fee Structure Upload"
                field="feeStructurePath"
                value={formData.feeStructurePath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
              <DocumentUpload
                label="Standard Operating Procedure"
                field="sopDocumentPath"
                value={formData.sopDocumentPath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
              <DocumentUpload
                label="Stage Wise Timeline Upload"
                field="stageWiseTimelinePath"
                value={formData.stageWiseTimelinePath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
              <DocumentUpload
                label="Statuary Timeline Upload"
                field="statuaryTimelinePath"
                value={formData.statuaryTimelinePath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
              <DocumentUpload
                label="Inspection Checklist Upload"
                field="inspectionChecklistPath"
                value={formData.inspectionChecklistPath}
                onUpload={handleDocumentUpload}
                onChange={(field, value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Statuary Timeline (Text)</label>
              <InputText
                value={formData.statuaryTimelineText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    statuaryTimelineText: e.target.value,
                  }))
                }
                className="w-100"
                placeholder="Enter statuary timeline details"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Risk Category</label>
              <MultiSelect
                value={formData.riskCategory}
                options={riskCategoryOptions}
                display="chip"
                className="w-100"
                placeholder="Select Risk Categories"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    riskCategory: e.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Size of Firm (Unit Category)</label>
              <MultiSelect
                value={formData.sizeOfFirm}
                options={sizeOfFirmOptions}
                display="chip"
                className="w-100"
                placeholder="Select Unit Categories"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sizeOfFirm: e.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Business Location</label>
              <MultiSelect
                value={formData.businessLocation}
                options={businessLocationOptions}
                display="chip"
                className="w-100"
                placeholder="Select Business Locations"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    businessLocation: e.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Type of Investor</label>
              <MultiSelect
                value={formData.investorType}
                options={investorTypeOptions}
                display="chip"
                className="w-100"
                placeholder="Select Investor Types"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    investorType: e.value,
                  }))
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Status</label>
              <Dropdown
                value={formData.isActive}
                options={[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false },
                ]}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isActive: e.value }))
                }
                className="w-100"
              />
            </div>

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

        <Dialog
          visible={showDetails}
          onHide={() => setShowDetails(false)}
          header="Service Details"
          modal
          style={{ width: '60vw' }}
          breakpoints={{ '960px': '75vw', '640px': '90vw' }}
        >
          {selectedRow ? (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="fw-semibold">Department</div>
                <div>{selectedRow.service?.department?.name || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Service</div>
                <div>{selectedRow.service?.service_name || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Risk Category</div>
                <div>{selectedRow.riskCategory || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Size of Firm</div>
                <div>{selectedRow.sizeOfFirm || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Business Location</div>
                <div>{selectedRow.businessLocation || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Investor Type</div>
                <div>{selectedRow.investorType || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Statuary Timeline (Text)</div>
                <div>{selectedRow.statuaryTimelineText || 'N/A'}</div>
              </div>
              <div className="col-md-6">
                <div className="fw-semibold">Status</div>
                <div>{selectedRow.isActive ? 'Active' : 'Inactive'}</div>
              </div>

              <div className="col-12">
                <div className="fw-semibold">Documents</div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {selectedRow.statuaryFormPath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.statuaryFormPath} target="_blank">
                      Statuary Form
                    </a>
                  )}
                  {selectedRow.feeStructurePath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.feeStructurePath} target="_blank">
                      Fee Structure
                    </a>
                  )}
                  {selectedRow.sopDocumentPath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.sopDocumentPath} target="_blank">
                      SOP
                    </a>
                  )}
                  {selectedRow.stageWiseTimelinePath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.stageWiseTimelinePath} target="_blank">
                      Stage Wise Timeline
                    </a>
                  )}
                  {selectedRow.statuaryTimelinePath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.statuaryTimelinePath} target="_blank">
                      Statuary Timeline
                    </a>
                  )}
                  {selectedRow.inspectionChecklistPath && (
                    <a className="btn btn-sm btn-outline-primary" href={selectedRow.inspectionChecklistPath} target="_blank">
                      Inspection Checklist
                    </a>
                  )}
                  {!selectedRow.statuaryFormPath &&
                    !selectedRow.feeStructurePath &&
                    !selectedRow.sopDocumentPath &&
                    !selectedRow.stageWiseTimelinePath &&
                    !selectedRow.statuaryTimelinePath &&
                    !selectedRow.inspectionChecklistPath && (
                      <span className="text-muted">No documents uploaded.</span>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted">No details available.</div>
          )}
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
      </div>
    </ProtectedRoute>
  );
};
