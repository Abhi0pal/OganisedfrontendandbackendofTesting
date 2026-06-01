'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Toast } from 'primereact/toast';
import apiClient from '@/lib/api-client';

type SubmissionRow = {
  submissionId: string;
  serviceCode:  string;
  serviceName:  string;
  formId:       number | null;
  status:       string;
  statusLabel:  string;
  submittedOn:  string;
  pendingPayment?: boolean;
};

// Statuses where applicant can edit & resubmit
const EDITABLE_STATUSES = new Set(['I', 'DP', 'H', 'PD']);

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Pending', value: 'P' },
  { label: 'Processing', value: 'F' },
  { label: 'Approved', value: 'A' },
  { label: 'Rejected', value: 'R' },
];

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  A: { label: 'Approved',   bg: '#dcfce7', color: '#15803d' },
  R: { label: 'Rejected',   bg: '#fee2e2', color: '#b91c1c' },
  P: { label: 'Pending',    bg: '#fef9c3', color: '#a16207' },
  F: { label: 'Processing', bg: '#dbeafe', color: '#1d4ed8' },
};

export default function TrackApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useRef<Toast>(null);

  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    apiClient
      .get('/investor/services/submissions')
      .then((res) => setSubmissions(Array.isArray(res.data) ? res.data : (res.data?.data ?? [])))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (searchParams?.get('submitted') !== '1') return;
    toast.current?.show({
      severity: 'success',
      summary: 'Submitted',
      detail: 'Application submitted successfully.',
    });
    router.replace(`/${params?.locale ?? 'en'}/investor/applications`);
  }, [params, router, searchParams]);

  const filteredData = submissions.filter((row) => {
    const normalizedStatus = String(row.status || '').trim().toUpperCase();
    const normalizedLabel = String(row.statusLabel || '').trim().toUpperCase();
    const selectedStatus = String(statusFilter || '').trim().toUpperCase();
    const matchesStatus = !selectedStatus || selectedStatus === 'ALL' || normalizedStatus === selectedStatus || normalizedLabel === selectedStatus;
    const q = globalFilter.toLowerCase();
    const matchesSearch =
      !q ||
      row.submissionId?.toLowerCase().includes(q) ||
      row.serviceCode?.toLowerCase().includes(q) ||
      row.serviceName?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const statusBodyTemplate = (rowData: SubmissionRow) => {
    const cfg       = STATUS_MAP[rowData.status] ?? { bg: '#f3f4f6', color: '#374151' };
    const label     = rowData.statusLabel || rowData.status || 'Unknown';
    const isEditable = EDITABLE_STATUSES.has(rowData.status);

    const badge = (
      <span style={{
        display: 'inline-block',
        padding: '3px 12px',
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}33`,
        cursor: isEditable ? 'pointer' : 'default',
        textDecoration: isEditable ? 'none' : 'none',
      }}>
        {label}
        {isEditable && <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>✏️</span>}
      </span>
    );

    if (isEditable) {
      const editUrl = rowData.formId
        ? `/${params?.locale ?? 'en'}/investor/services/${rowData.serviceCode}/apply/${rowData.formId}?submissionId=${rowData.submissionId}&mode=edit`
        : `/${params?.locale ?? 'en'}/investor/applications/${rowData.submissionId}?edit=true`;
      return (
        <span onClick={() => router.push(editUrl)} title="Click to edit & resubmit">
          {badge}
        </span>
      );
    }
    return badge;
  };

  const dateBodyTemplate = (rowData: SubmissionRow) => {
    if (!rowData.submittedOn) return <span style={{ color: '#9ca3af' }}>—</span>;
    return new Date(rowData.submittedOn).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const actionBodyTemplate = (rowData: SubmissionRow) => (
    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
      <Button
        icon="pi pi-eye"
        rounded
        text
        severity="info"
        tooltip="View Application"
        tooltipOptions={{ position: 'top' }}
        onClick={() =>
          router.push(`/${params?.locale ?? 'en'}/investor/applications/${rowData.submissionId}`)
        }
      />
      {rowData.pendingPayment && (
        <Button
          icon="pi pi-wallet"
          rounded
          text
          severity="warning"
          tooltip="Pay Fee"
          tooltipOptions={{ position: 'top' }}
          onClick={() =>
            router.push(`/${params?.locale ?? 'en'}/investor/payment/${rowData.submissionId}`)
          }
        />
      )}
      {rowData.status === 'A' && (String(rowData.serviceCode) === '968.0' || String(rowData.serviceCode) === '968') && (
        <Button
          icon="pi pi-download"
          rounded
          text
          severity="success"
          tooltip="Download Certificate"
          tooltipOptions={{ position: 'top' }}
          onClick={() => window.open(`/${params?.locale ?? 'en'}/investor/certificate_1?submissionId=${rowData.submissionId}`, '_blank')}
        />
      )}
    </div>
  );

  return (
    <div style={{ padding: '1.5rem' }}>
      <Toast ref={toast} />

      {/* Page Header */}
      <div className="mb-4">
        <h2 className="page-title">My Applications</h2>
        <p className="page-subtitle">Track the status of your submitted departmental service applications.</p>
      </div>

      {/* Card wrapper */}
      <div className="bg-white rounded-4 data-table-wrap" style={{
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}>

        {/* Toolbar */}
        <div className="d-flex justify-content-between align-items-center p-4" style={{
          flexWrap: 'wrap',
          gap: '50px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}>
          <div className="d-flex justify-content-between flex-grow-1" style={{ gap: '12px', alignItems: 'center' }}>
            <div className="d-flex">
              <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search App ID, Service..."
                  className=""
                />
              </IconField>

              <Dropdown
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.value)}
                placeholder="Filter by Status"
                style={{ maxWidth: '300px' }}
              />

              {(globalFilter || statusFilter) && (
                <Button
                  label="Clear"
                  icon="pi pi-times"
                  outlined
                  severity="secondary"
                  size="small"
                  onClick={() => { setGlobalFilter(''); setStatusFilter(''); }}
                />
              )}
            </div>

            <span className="p-badge p-badge-secondary">
              {filteredData.length} record{filteredData.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '16px' }}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height="2.2rem" className="mb-2" />
            ))}
          </div>
        ) : (
          <DataTable
            value={filteredData}
            emptyMessage="No applications found."
            stripedRows
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sortMode="multiple"
            removableSort
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first}–{last} of {totalRecords}"
            pt={{
              thead: { style: { background: '#f3f4f6' } },
              bodyRow: { style: { borderBottom: '1px solid #f3f4f6' } },
            }}
          >
            <Column field="submissionId" header="App ID" sortable style={{ width: '100px', fontWeight: 600 }} />
            <Column field="serviceCode" header="Service Code" sortable style={{ width: '130px' }} />
            <Column field="serviceName" header="Service Name" sortable />
            <Column field="submittedOn" header="Submitted On" body={dateBodyTemplate} sortable style={{ width: '145px' }} />
            <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ width: '125px' }} />
            <Column header="Actions" body={actionBodyTemplate} style={{ width: '100px' }} />
          </DataTable>
        )}
      </div>
    </div>
  );
}
