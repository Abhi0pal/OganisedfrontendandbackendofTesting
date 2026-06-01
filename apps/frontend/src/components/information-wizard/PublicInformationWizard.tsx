'use client';

import { useMemo, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig } from '@/components/DataTable/types';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { usePublicInformationWizards } from '@/hooks/useInformationWizard';
import { useExportHandler } from '@/hooks/useExportHandler';
import { informationWizardExportConfig } from '@/lib/export-configs';
import { UnifiedServicePopup, PopupTabContent } from '@/components/popups/UnifiedServicePopup';

type PublicWizardRecord = {
  id: number;
  serviceId: number;
  serviceCode?: string | null;
  statuaryFormPath?: string | null;
  feeStructurePath?: string | null;
  sopDocumentPath?: string | null;
  stageWiseTimelinePath?: string | null;
  statuaryTimelinePath?: string | null;
  statuaryTimelineText?: string | null;
  inspectionChecklistPath?: string | null;
  documentChecklistItems?: {
    doc_id: string;
    is_required: string;
    doc_comment: string;
    documentCode?: string | null;
    documentType?: string | null;
    issuedBy?: string | null;
    documentName?: string | null;
    documentPath?: string | null;
  }[];
  riskCategory?: string | null;
  sizeOfFirm?: string | null;
  businessLocation?: string | null;
  investorType?: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  hasInformationWizard: boolean;
  service?: {
    id: number;
    service_id?: string;
    service_name?: string;
    service_level?: string | null;
    service_status?: string | null;
    service_category?: string | null;
    department?: { id: number; name: string };
  };
};

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

const serviceLevelLabels: Record<string, string> = {
  '1': 'Pre-Establishment',
  '2': 'Pre-Operational',
  '3': 'Post-Operational',
};

const formatServiceLevels = (value?: string | null) => {
  if (!value) return 'N/A';
  const parts = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!parts.length) return 'N/A';
  return parts.map((entry) => serviceLevelLabels[entry] || entry).join(', ');
};

const formatServiceStatus = (value?: string | null) => {
  if (!value || value === 'NOT_APPLICABLE') return 'N/A';
  switch (value) {
    case 'INTEGRATED':
      return 'Integrated With SWCS';
    case 'ONLINE_ON_DEPT_PORTAL':
      return 'Online on Department Portal';
    case 'ONBOARDED':
      return 'Onboarded';
    case 'OFFLINE':
      return 'Offline';
    default:
      return value;
  }
};

export const PublicInformationWizard = () => {
  const { data = [], isLoading } = usePublicInformationWizards();
  const records = useMemo(() => data as PublicWizardRecord[], [data]);
  const toastRef = useRef<Toast | null>(null);
  const { handleExportCSV, handleExportExcel, handleExportPDF } =
    useExportHandler(
      informationWizardExportConfig,
      toastRef as React.RefObject<Toast>
    );
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Unified popup state
  const [showServicePopup, setShowServicePopup] = useState(false);
  const [popupTabs, setPopupTabs] = useState<PopupTabContent[]>([]);
  const [currentServiceName, setCurrentServiceName] = useState('');
  const [currentRow, setCurrentRow] = useState<PublicWizardRecord | null>(null);

  const generatePopupTabs = (row: PublicWizardRecord): PopupTabContent[] => {
    const tabs: PopupTabContent[] = [];

    // Tab 1: Document Checklist
    const checklistItems = row.documentChecklistItems || [];
    if (checklistItems.length > 0) {
      tabs.push({
        id: 'document-checklist',
        label: 'Document Checklist',
        icon: 'bi bi-file-earmark-check',
        content: (
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>S.No</th>
                  <th style={{ width: '140px' }}>Document Code</th>
                  <th>Document Type</th>
                  <th style={{ width: '160px' }}>Issued By</th>
                  <th>Document Name</th>
                  <th style={{ width: '100px' }}>Is Required</th>
                  <th style={{ width: '220px' }}>Comment</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, index) => (
                  <tr key={`${item.doc_id}-${index}`}>
                    <td>{index + 1}</td>
                    <td>{item.documentCode || 'N/A'}</td>
                    <td>{item.documentType || 'N/A'}</td>
                    <td>{item.issuedBy || 'N/A'}</td>
                    <td>{item.documentName || 'N/A'}</td>
                    <td>
                      <span className={`badge ${item.is_required === 'Y' ? 'bg-success' : 'bg-secondary'}`}>
                        {item.is_required === 'Y' ? 'Required' : 'Optional'}
                      </span>
                    </td>
                    <td>{item.doc_comment || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
    }

    // Tab 2: Standard Operating Procedure (SOP) / Process
    if (row.sopDocumentPath) {
      tabs.push({
        id: 'process-sop',
        label: 'Process & SOP',
        icon: 'bi bi-diagram-3',
        content: (
          <div className="card border-0">
            <div className="card-body">
              <h6 className="mb-3 fw-bold">
                <i className="bi bi-file-pdf text-danger me-2"></i>
                Standard Operating Procedure
              </h6>
              <p className="text-muted mb-3">
                Access the complete SOP document for detailed process information.
              </p>
              <a 
                href={row.sopDocumentPath} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="bi bi-download me-2"></i>
                View/Download SOP
              </a>
            </div>
          </div>
        ),
      });
    }

    // Tab 3: Timeline & Fee Structure
    if (row.stageWiseTimelinePath || row.feeStructurePath) {
      tabs.push({
        id: 'timeline-fees',
        label: 'Timeline & Fees',
        icon: 'bi bi-clock-history',
        content: (
          <div className="row g-3">
            {row.stageWiseTimelinePath && (
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title fw-bold mb-3">
                      <i className="bi bi-timeline text-info me-2"></i>
                      Stage-wise Timeline
                    </h6>
                    <a 
                      href={row.stageWiseTimelinePath} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm"
                    >
                      <i className="bi bi-download me-1"></i>
                      View Timeline
                    </a>
                  </div>
                </div>
              </div>
            )}
            {row.feeStructurePath && (
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title fw-bold mb-3">
                      <i className="bi bi-currency-dollar text-success me-2"></i>
                      Fee Structure
                    </h6>
                    <a 
                      href={row.feeStructurePath} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-success btn-sm"
                    >
                      <i className="bi bi-download me-1"></i>
                      View Fees
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      });
    }

    // Tab 4: Statutory Information
    if (row.statuaryFormPath || row.statuaryTimelinePath) {
      tabs.push({
        id: 'statutory',
        label: 'Statutory Info',
        icon: 'bi bi-file-text',
        content: (
          <div className="row g-3">
            {row.statuaryFormPath && (
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title fw-bold mb-3">
                      <i className="bi bi-file-earmark-pdf text-danger me-2"></i>
                      Statutory Form
                    </h6>
                    <a 
                      href={row.statuaryFormPath} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-danger btn-sm"
                    >
                      <i className="bi bi-download me-1"></i>
                      Download Form
                    </a>
                  </div>
                </div>
              </div>
            )}
            {row.statuaryTimelinePath && (
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title fw-bold mb-3">
                      <i className="bi bi-hourglass-split text-warning me-2"></i>
                      Statutory Timeline
                    </h6>
                    <a 
                      href={row.statuaryTimelinePath} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-warning btn-sm"
                    >
                      <i className="bi bi-download me-1"></i>
                      View Timeline
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        ),
      });
    }

    return tabs.length > 0 ? tabs : [
      {
        id: 'empty',
        label: 'No Data',
        content: <div className="alert alert-info">No additional information available for this service.</div>,
      },
    ];
  };

  const openServicePopup = (row: PublicWizardRecord) => {
    setCurrentRow(row);
    setCurrentServiceName(row.service?.service_name || 'Service Details');
    setPopupTabs(generatePopupTabs(row));
    setShowServicePopup(true);
  };

  const downloadChecklist = (row: PublicWizardRecord) => {
    const items = row.documentChecklistItems || [];
    if (!items.length) return;
    const header = [
      'S.No',
      'Document Code',
      'Document Type',
      'Issued By',
      'Document Name',
      'Is Required',
      'Comment',
    ];
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = items.map((item, index) => [
      String(index + 1),
      item.documentCode || 'N/A',
      item.documentType || 'N/A',
      item.issuedBy || 'N/A',
      item.documentName || 'N/A',
      item.is_required || 'N',
      item.doc_comment || '',
    ]);
    const csv = [header, ...rows]
      .map((rowValues) => rowValues.map(escapeCsv).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `document-checklist-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const {
    data: tableData,
    filteredData,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<PublicWizardRecord>(useMemo(() => records, [records]));

  const departments = useMemo(() => {
    const seen = new Map<number, string>();
    records.forEach((row) => {
      const dept = row.service?.department;
      if (dept) {
        seen.set(dept.id, dept.name);
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ label: name, value: id }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [records]);

  const services = useMemo(() => {
    return records
      .map((row) => row.service)
      .filter(
        (
          service
        ): service is NonNullable<PublicWizardRecord['service']> => Boolean(service)
      )
      .map((service) => ({
        label: service?.service_name || 'N/A',
        value: service?.id,
        departmentId: service?.department?.id,
      }))
      .filter((item) => item.value !== undefined);
  }, [records]);

  const [filters, setFilters] = useState({
    departmentId: null as number | null,
    serviceId: null as number | null,
    riskCategory: null as string | null,
    sizeOfFirm: null as string | null,
    businessLocation: null as string | null,
    investorType: null as string | null,
  });

  const filteredServices = useMemo(() => {
    if (!filters.departmentId) return services;
    return services.filter((svc) => svc.departmentId === filters.departmentId);
  }, [services, filters.departmentId]);

  const applyFilters = (nextFilters = filters) => {
    const tableFilters: any = {};
    if (nextFilters.departmentId) {
      tableFilters['service.department.id'] = nextFilters.departmentId;
    }
    if (nextFilters.serviceId) {
      tableFilters['service.id'] = nextFilters.serviceId;
    }
    if (nextFilters.riskCategory) {
      tableFilters.riskCategory = nextFilters.riskCategory;
    }
    if (nextFilters.sizeOfFirm) {
      tableFilters.sizeOfFirm = nextFilters.sizeOfFirm;
    }
    if (nextFilters.businessLocation) {
      tableFilters.businessLocation = nextFilters.businessLocation;
    }
    if (nextFilters.investorType) {
      tableFilters.investorType = nextFilters.investorType;
    }

    handleFiltersChange(tableFilters);
  };

  const clearAllFilters = () => {
    const reset = {
      departmentId: null,
      serviceId: null,
      riskCategory: null,
      sizeOfFirm: null,
      businessLocation: null,
      investorType: null,
    };
    setFilters(reset);
    clearFilters();
    handleGlobalFilterChange('');
    setSearchTerm('');
  };

  const tableConfig: ReusableDataTableConfig<PublicWizardRecord> = useMemo(
    () => ({
      columns: [
        {
          field: 'service.department.name',
          header: 'Department Name',
          width: '200px',
          filterType: 'none',
          body: (row) => row.service?.department?.name || 'N/A',
        },
        {
          field: 'service.service_name',
          header: 'Service Details',
          width: '320px',
          filterType: 'none',
          body: (row) => (
            <div className="small">
              <div>
                <strong>Service ID:</strong>{' '}
                {row.service?.service_id || row.serviceCode || row.serviceId}
              </div>
              <div>
                <strong>Service Name:</strong> {row.service?.service_name || 'N/A'}
              </div>
              <div>
                <strong>Service Type:</strong>{' '}
                {row.service?.service_category || 'N/A'}
              </div>
              <div>
                <strong>Service Incidence:</strong>{' '}
                {formatServiceLevels(row.service?.service_level)}
              </div>
              <div>
                <strong>Service Integration Status:</strong>{' '}
                {formatServiceStatus(row.service?.service_status)}
              </div>
            </div>
          ),
        },
        {
          field: 'inspectionChecklistPath',
          header: 'Document Checklist',
          width: '150px',
          filterType: 'none',
          body: (row) => {
            const hasChecklist = (row.documentChecklistItems || []).length > 0;
            const hasAdditionalInfo = row.sopDocumentPath || row.stageWiseTimelinePath || row.feeStructurePath || row.statuaryFormPath || row.statuaryTimelinePath;
            
            if (!hasChecklist && !hasAdditionalInfo) return 'N/A';
            
            return (
              <div className="d-flex gap-2">
                {hasChecklist && (
                  <>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary"
                      onClick={() => openServicePopup(row)}
                      title="View all service information"
                    >
                      <i className="bi bi-eye"></i> View Details
                    </button>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-success"
                      onClick={() => downloadChecklist(row)}
                      title="Download checklist as CSV"
                    >
                      <i className="bi bi-download"></i> Download
                    </button>
                  </>
                )}
                {!hasChecklist && hasAdditionalInfo && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-primary"
                    onClick={() => openServicePopup(row)}
                  >
                    <i className="bi bi-eye"></i> View Info
                  </button>
                )}
              </div>
            );
          },
        },
        {
          field: 'statuaryFormPath',
          header: 'Statutory Form',
          width: '140px',
          filterType: 'none',
          body: (row) =>
            row.statuaryFormPath ? (
              <a href={row.statuaryFormPath} target="_blank">
                View
              </a>
            ) : (
              'N/A'
            ),
        },
        {
          field: 'feeStructurePath',
          header: 'Fee Structure',
          width: '140px',
          filterType: 'none',
          body: (row) =>
            row.feeStructurePath ? (
              <a href={row.feeStructurePath} target="_blank">
                View
              </a>
            ) : (
              'N/A'
            ),
        },
        {
          field: 'sopDocumentPath',
          header: 'Standard Operating Procedure and Stage wise timeline',
          width: '260px',
          filterType: 'none',
          body: (row) => (
            <div className="small">
              <div>
                <strong>SOP:</strong>{' '}
                {row.sopDocumentPath ? (
                  <a href={row.sopDocumentPath} target="_blank">
                    View
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
              <div>
                <strong>Stage Wise:</strong>{' '}
                {row.stageWiseTimelinePath ? (
                  <a href={row.stageWiseTimelinePath} target="_blank">
                    View
                  </a>
                ) : (
                  'N/A'
                )}
              </div>
            </div>
          ),
        },
        {
          field: 'statuaryTimelinePath',
          header: 'Statutory Timelines',
          width: '170px',
          filterType: 'none',
          body: (row) =>
            row.statuaryTimelinePath ? (
              <a href={row.statuaryTimelinePath} target="_blank">
                View
              </a>
            ) : (
              'N/A'
            ),
        },
        {
          field: 'inspectionChecklistPath',
          header: 'Inspection Checklist',
          width: '170px',
          filterType: 'none',
          body: (row) => {
            if (!row.inspectionChecklistPath) return 'N/A';
            return (
              <div className="d-flex gap-2">
                <a href={row.inspectionChecklistPath} target="_blank" rel="noreferrer">
                  View
                </a>
                <a href={row.inspectionChecklistPath} download>
                  Download
                </a>
              </div>
            );
          },
        },
        {
          field: 'riskCategory',
          header: 'Risk Category',
          width: '170px',
          filterType: 'none',
          body: (row) => row.riskCategory || 'N/A',
        },
        {
          field: 'sizeOfFirm',
          header: 'Size of Firm (Unit Category)',
          width: '220px',
          filterType: 'none',
          body: (row) => row.sizeOfFirm || 'N/A',
        },
        {
          field: 'businessLocation',
          header: 'Business Location',
          width: '180px',
          filterType: 'none',
          body: (row) => row.businessLocation || 'N/A',
        },
        {
          field: 'investorType',
          header: 'Type of Investor',
          width: '160px',
          filterType: 'none',
          body: (row) => row.investorType || 'N/A',
        },
        {
          field: 'hasInformationWizard',
          header: 'Status',
          width: '110px',
          filterType: 'none',
          body: (row) => (
            <Tag
              value={row.hasInformationWizard ? 'Available' : 'N/A'}
              severity={row.hasInformationWizard ? 'success' : 'secondary'}
            />
          ),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: [
        'service.service_name',
        'service.department.name',
        'riskCategory',
        'sizeOfFirm',
        'businessLocation',
        'investorType',
      ],
      selectable: false,
      paginator: true,
      stripedRows: true,
      showGridlines: false,
      scrollable: true,
      scrollHeight: '60vh',
      showHeader: false,
      filterDisplay: 'menu',
      tableClassName: 'public-info-table',
      emptyMessage: 'No services found.',
    }),
    []
  );

  const handleExcelExport = async () => {
    setExporting(true);
    await handleExportExcel(filteredData);
    setExporting(false);
  };

  const handlePDFExport = async () => {
    setExporting(true);
    await handleExportPDF(filteredData);
    setExporting(false);
  };

  return (
    <div style={{ paddingTop: '120px', paddingBottom: '120px' }}>
      <style jsx global>{`
        .public-info-table .p-datatable-thead > tr > th {
          background: #f6f6f6;
          color: #333;
          font-weight: 600;
          border-color: #ececec;
        }
        .public-info-table .p-datatable-tbody > tr > td {
          border-color: #f0f0f0;
        }
      `}</style>
      <div className="container">
        <Toast ref={toastRef} />
        <div className="d-flex flex-column gap-2 mb-4">
          <h1 className="h2 fw-bold">Service Listing</h1>
          <div className="text-muted">
            Explore service details, timelines, and downloadable documents.
          </div>
        </div>

        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg">
                <label className="form-label">Select Department</label>
                <Dropdown
                  value={filters.departmentId}
                  options={departments}
                  onChange={(e) => {
                    const next = {
                      ...filters,
                      departmentId: e.value,
                      serviceId: null,
                    };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="w-100"
                  placeholder="All Departments"
                  showClear
                />
              </div>
              <div className="col-lg">
                <label className="form-label">Size of Firm (Unit Category)</label>
                <Dropdown
                  value={filters.sizeOfFirm}
                  options={sizeOfFirmOptions}
                  onChange={(e) => {
                    const next = { ...filters, sizeOfFirm: e.value };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="w-100"
                  placeholder="All"
                  showClear
                />
              </div>
              <div className="col-lg">
                <label className="form-label">Risk Category</label>
                <Dropdown
                  value={filters.riskCategory}
                  options={riskCategoryOptions}
                  onChange={(e) => {
                    const next = { ...filters, riskCategory: e.value };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="w-100"
                  placeholder="All"
                  showClear
                />
              </div>
              <div className="col-lg">
                <label className="form-label">Business Location</label>
                <Dropdown
                  value={filters.businessLocation}
                  options={businessLocationOptions}
                  onChange={(e) => {
                    const next = { ...filters, businessLocation: e.value };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="w-100"
                  placeholder="All"
                  showClear
                />
              </div>
              <div className="col-lg">
                <label className="form-label">Investor Type</label>
                <Dropdown
                  value={filters.investorType}
                  options={investorTypeOptions}
                  onChange={(e) => {
                    const next = { ...filters, investorType: e.value };
                    setFilters(next);
                    applyFilters(next);
                  }}
                  className="w-100"
                  placeholder="All"
                  showClear
                />
              </div>
            </div>

            <div className="d-flex justify-content-end mt-3">
              <Button
                label="Reset All"
                severity="danger"
                rounded
                onClick={clearAllFilters}
              />
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex gap-2">
            <Button
              label="Export PDF"
              icon="pi pi-file-pdf"
              severity="danger"
              rounded
              onClick={handlePDFExport}
              loading={exporting}
              disabled={isLoading}
            />
            <Button
              label="Export Excel"
              icon="pi pi-file-excel"
              severity="success"
              rounded
              onClick={handleExcelExport}
              loading={exporting}
              disabled={isLoading}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold">Search:</span>
            <InputText
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleGlobalFilterChange(e.target.value);
              }}
              placeholder="Type to search"
            />
          </div>
        </div>

        <ReusableDataTable
          data={filteredData}
          config={tableConfig}
          loading={isLoading}
          onFiltersChange={handleFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
        />

        {/* Unified Service Information Popup */}
        <UnifiedServicePopup
          visible={showServicePopup}
          onHide={() => setShowServicePopup(false)}
          title="Service Information & Requirements"
          serviceName={currentServiceName}
          tabs={popupTabs}
          size="large"
          showDownloadButton={currentRow?.documentChecklistItems && (currentRow.documentChecklistItems.length > 0)}
          onDownload={() => currentRow && downloadChecklist(currentRow)}
        />
      </div>
    </div>
  );
};
