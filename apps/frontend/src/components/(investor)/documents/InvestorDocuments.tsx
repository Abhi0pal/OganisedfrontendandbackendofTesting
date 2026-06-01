
'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { useTranslations } from 'next-intl';

import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { useExportHandler } from '@/hooks/useExportHandler';
import { investorDocumentExportConfig } from '@/lib/export-configs';

import {
  useInvestorDocuments,
  useCreateInvestorDocument,
  useUpdateInvestorDocument,
  useDeleteInvestorDocument,
  useDocumentStats,
  useUploadInvestorDocument,
  InvestorDocument,
  CreateInvestorDocumentDto,
  UpdateInvestorDocumentDto,
} from '@/hooks/investor/document/useInvestorDocuments';

import { useDocumentTypes } from '@/hooks/master/useDocumentTypes';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useDocumentMasters } from '@/hooks/master/useDocumentMasters';

/** Utility: format date as "24 Mar 2025" for table cells */
const formatDate = (iso?: string | Date | null) => {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** ---- DATE HELPERS (timezone-safe) ---- */
/** Build YYYY-MM-DD from local date components (never uses toISOString) */
const toYMDLocal = (date?: Date | null): string | undefined => {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse 'YYYY-MM-DD' into a local Date (no timezone shift) */
const parseYMDToLocalDate = (ymd?: string | null): Date | null => {
  if (!ymd) return null;
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    const d = new Date(ymd);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, monthIndex, day, 0, 0, 0, 0); // local midnight
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Compare two local date-only strings 'YYYY-MM-DD' */
const cmpYMD = (a?: string, b?: string): number => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
};

type FormState = {
  documentMasterId: number | null;
  documentTypeId: number | null;
  issuerId: number | null;
  departmentId: number | null;
  documentName: string;
  documentPath: string;
  validFrom?: Date | null;
  validTo?: Date | null;
  documentDateOfIssuance?: Date | null;
  comments?: string;
  file?: File | null;
};

type DateErrors = {
  validFrom?: string;
  validTo?: string;
  documentDateOfIssuance?: string;
};

/** Allowed MIME types for upload */
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/** Upload response structure (aligned with backend upload controller) */
type UploadResponse = {
  success: boolean;
  message: string;
  data: {
    filePath: string;
    fileName: string;
    originalName: string;
    size: number;
    mimetype: string;
    documentReferenceNumber: string; // e.g., 19460403_UK-DCL-998_V1.6
    documentVersion: string;         // e.g., V1.6
    originalSizeBytes?: number;
    compressedSizeBytes?: number;
    savedBytes?: number;
    savedPercent?: number;
  };
};

export default function InvestorDocuments() {
  /** ✅ Correct ref typing: refs are null until mounted */
  const toastRef = useRef<Toast | null>(null);
  const t = useTranslations('InvestorDocuments');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentRows, setCurrentRows] = useState(10);

  // Data & mutations
  const { data: documentsResponse, isLoading } = useInvestorDocuments({
    page: currentPage,
    limit: currentRows,
  });
  const docs = documentsResponse?.data ?? [];
  const pagination = documentsResponse?.pagination ?? {
    page: currentPage,
    limit: currentRows,
    total: 0,
    totalPages: 1,
  };
  const createMutation = useCreateInvestorDocument();
  const updateMutation = useUpdateInvestorDocument();
  const deleteMutation = useDeleteInvestorDocument();
  const uploadMutation = useUploadInvestorDocument();
  const { data: stats } = useDocumentStats();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const totalPages = pagination?.totalPages || 1;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pagination?.totalPages]);

  // Masters
  const shouldLoadMasterData = showDialog;
  const { data: documentTypes = [] } = useDocumentTypes(shouldLoadMasterData);
  const { data: issuers = [] } = useIssuers(shouldLoadMasterData);
  const { data: departments = [] } = useDepartments(shouldLoadMasterData);
  const { data: docMasters = [] } = useDocumentMasters(shouldLoadMasterData);

  // Dialog / form state
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    documentMasterId: null,
    documentTypeId: null,
    issuerId: null,
    departmentId: null,
    documentName: '',
    documentPath: '',
    validFrom: null,
    validTo: null,
    documentDateOfIssuance: null,
    comments: '',
    file: null,
  });

  const [isValidityRequired, setIsValidityRequired] = useState<boolean>(false);
  const [dateErrors, setDateErrors] = useState<DateErrors>({});

  /** Compression summary (if backend returns stats) */
  const [compressionSummary, setCompressionSummary] = useState<{
    originalSizeBytes?: number;
    compressedSizeBytes?: number;
    savedPercent?: number;
    mimeType?: string;
  } | null>(null);

  // Dependent filtering logic
  const eligibleDepartmentIds = useMemo(() => {
    if (!formData.documentTypeId || !formData.issuerId) return [];
    const ids = docMasters
      .filter(
        (dm: any) =>
          dm.documentTypeId === formData.documentTypeId &&
          dm.issuerId === formData.issuerId
      )
      .map((dm: any) => dm.departmentId);
    return Array.from(new Set(ids));
  }, [formData.documentTypeId, formData.issuerId, docMasters]);

  const filteredDepartments = useMemo(
    () => departments.filter((d: any) => eligibleDepartmentIds.includes(d.id)),
    [departments, eligibleDepartmentIds]
  );

  const filteredDocMasters = useMemo(() => {
    if (!formData.documentTypeId || !formData.issuerId || !formData.departmentId) return [];
    return docMasters.filter(
      (dm: any) =>
        dm.documentTypeId === formData.documentTypeId &&
        dm.issuerId === formData.issuerId &&
        dm.departmentId === formData.departmentId
    );
  }, [docMasters, formData.documentTypeId, formData.issuerId, formData.departmentId]);

  // Validity required flag
  useEffect(() => {
    if (formData.documentMasterId) {
      const master = docMasters.find((m: any) => m.id === formData.documentMasterId);
      setIsValidityRequired(!!master?.isDocValidityRequired);
    } else {
      setIsValidityRequired(false);
    }
  }, [formData.documentMasterId, docMasters]);

  // DataTable Manager
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
  } = useDataTableManager<InvestorDocument>(docs);

  // Export handlers
  // ⬇️ If your hook expects RefObject<Toast>, assert the type at the call-site.
  // We still guard all runtime usages with `toastRef.current?.show(...)`.
  const { handleExportCSV, handleExportExcel, handleExportPDF } =
    useExportHandler(investorDocumentExportConfig, toastRef as React.RefObject<Toast>);

  // Helpers
  const statusTag = (s: InvestorDocument['documentStatus']) =>
    s === 'U' ? <Tag value={t('status.unverified')} severity="secondary" /> :
      s === 'V' ? <Tag value={t('status.verified')} severity="success" /> :
        s === 'R' ? <Tag value={t('status.rejected')} severity="danger" /> :
          s === 'M' ? <Tag value={t('status.mismatched')} severity="info" /> :
            <Tag value={s} />;

  const yesNoTag = (v: string) => (
    <Tag
      value={v === 'Y' ? t('common.yes') : t('common.no')}
      severity={v === 'Y' ? 'success' : 'danger'}
    />
  );

  // ---- DATE VALIDATION ----
  const validateDates = useCallback((): { ok: boolean; errors: DateErrors } => {
    const errs: DateErrors = {};
    if (isValidityRequired) {
      const ymdFrom = toYMDLocal(formData.validFrom);
      const ymdTo = toYMDLocal(formData.validTo);
      const ymdIssued = toYMDLocal(formData.documentDateOfIssuance);

      if (!ymdFrom) errs.validFrom = t('errors.validFromRequired');
      if (!ymdTo) errs.validTo = t('errors.validToRequired');
      if (!ymdIssued) errs.documentDateOfIssuance = t('errors.issuedOnRequired');

      if (ymdFrom && ymdTo && cmpYMD(ymdTo, ymdFrom) < 0) {
        errs.validTo = t('errors.validToEarlier');
      }
      if (ymdIssued && ymdFrom && cmpYMD(ymdIssued, ymdFrom) > 0) {
        errs.documentDateOfIssuance = t('errors.issuedAfterFrom');
      }
      if (ymdIssued && ymdTo && cmpYMD(ymdIssued, ymdTo) > 0) {
        errs.documentDateOfIssuance = t('errors.issuedAfterTo');
      }
    }
    return { ok: Object.keys(errs).length === 0, errors: errs };
  }, [isValidityRequired, formData.validFrom, formData.validTo, formData.documentDateOfIssuance, t]);

  const clearDateError = (field: keyof DateErrors) => {
    setDateErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Table config
  const tableConfig: ReusableDataTableConfig<InvestorDocument> = useMemo(
    () => ({
      columns: [
        {
          field: 'documentReferenceNumber',
          header: t('table.reference'),
          width: '22%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => <span className="fw-semibold">{row.documentReferenceNumber}</span>,
        },
        { field: 'documentName', header: t('table.name'), width: '16%', filterType: 'text', filterMatchMode: 'contains' },
        { field: 'documentVersion', header: t('table.version'), width: '10%', filterType: 'text', filterMatchMode: 'contains' },
        {
          field: 'documentStatus',
          header: t('table.status'),
          width: '12%',
          filterType: 'select',
          filterOptions: [
            { label: t('status.unverified'), value: 'U' },
            { label: t('status.verified'), value: 'V' },
            { label: t('status.rejected'), value: 'R' },
            { label: t('status.mismatched'), value: 'M' },
          ],
          body: (row) => statusTag(row.documentStatus),
        },
        {
          field: 'documentType.name',
          header: t('table.type'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.documentType?.name ?? '—',
        },
        {
          field: 'issuer.name',
          header: t('table.issuer'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.issuer?.name ?? '—',
        },
        {
          field: 'department.name',
          header: t('table.department'),
          width: '14%',
          filterType: 'text',
          filterMatchMode: 'contains',
          body: (row) => row.department?.name ?? '—',
        },
        {
          field: 'isDocumentActive',
          header: t('table.active'),
          width: '10%',
          filterType: 'select',
          filterOptions: [{ label: t('common.yes'), value: 'Y' }, { label: t('common.no'), value: 'N' }],
          body: (row) => yesNoTag(row.isDocumentActive),
        },
        {
          field: 'validFrom',
          header: t('table.validFrom'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.validFrom),
        },
        {
          field: 'validTo',
          header: t('table.validTo'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.validTo),
        },
        {
          field: 'documentDateOfIssuance',
          header: t('table.issuedOn'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.documentDateOfIssuance),
        },
        {
          field: 'createdAt',
          header: t('table.created'),
          width: '12%',
          filterType: 'date',
          body: (row) => formatDate(row.createdAt),
        },
      ],
      dataKey: 'id',
      rows: currentRows,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['documentReferenceNumber', 'documentName', 'issuer.name', 'department.name', 'documentType.name'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: false,
      stripedRows: true,
      showGridlines: true,
      scrollable: true,
      scrollHeight: 'flex',
      tableClassName: 'investor-documents-table',
      emptyMessage: t('table.empty'),
    }),
    [t, currentRows],
  );

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    setCurrentRows(event.rows);
    setCurrentPage(event.page + 1);
  }, []);

  // Handlers
  const handleEdit = useCallback((row: InvestorDocument) => {
    const toLocal = (value?: string | Date | null) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const justDate = value.includes('T') ? value.split('T')[0] : value;
        return parseYMDToLocalDate(justDate);
      }
      return value instanceof Date ? value : new Date(value);
    };

    setFormData({
      documentMasterId: row.documentMasterId,
      documentTypeId: row.documentTypeId,
      issuerId: row.issuerId,
      departmentId: row.departmentId,
      documentName: row.documentName,
      documentPath: row.documentPath,
      validFrom: toLocal(row.validFrom),
      validTo: toLocal(row.validTo),
      documentDateOfIssuance: toLocal(row.documentDateOfIssuance),
      comments: row.comments ?? '',
      file: null,
    });
    setEditingId(row.id);
    setDateErrors({});
    setCompressionSummary(null);
    setShowDialog(true);
  }, []);

  const handleInputChange = useCallback((e: any) => {
    const { name, value } = e.target || e;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'documentTypeId') {
        next.documentTypeId = Number(value) || null;
        next.departmentId = null;
        next.documentMasterId = null;
      }
      if (name === 'issuerId') {
        next.issuerId = Number(value) || null;
        next.departmentId = null;
        next.documentMasterId = null;
      }
      if (name === 'departmentId') {
        next.departmentId = Number(value) || null;
        next.documentMasterId = null;
      }
      if (name === 'documentMasterId') {
        next.documentMasterId = Number(value) || null;
      }
      return next;
    });
  }, []);

  const handleDateChange = (field: keyof FormState, value: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'validFrom') clearDateError('validFrom');
    if (field === 'validTo') clearDateError('validTo');
    if (field === 'documentDateOfIssuance') clearDateError('documentDateOfIssuance');
  };

  /** Validate file type on selection */
  const handleFileChange = (file: File | null) => {
    setCompressionSummary(null);
    if (!file) {
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }
    const mime = file.type || '';
    if (!ALLOWED_MIME_TYPES.includes(mime)) {
      setFormData((prev) => ({ ...prev, file: null }));
      toastRef.current?.show({
        severity: 'warn',
        summary: t('toasts.unsupportedFile.summary'),
        detail: t('toasts.unsupportedFile.detail'),
      });
      return;
    }
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleDelete = async (row: InvestorDocument) => {
    if (row.documentStatus === 'V' || row.documentStatus === 'M') {
      toastRef.current?.show({
        severity: 'warn',
        summary: t('toasts.deleteNotAllowed.summary'),
        detail: t('toasts.deleteNotAllowed.detail'),
      });
      return;
    }
    if (confirm(t('confirm.delete', { name: row.documentName }))) {
      try {
        await deleteMutation.mutateAsync(row.id);
        toastRef.current?.show({
          severity: 'success',
          summary: t('toasts.deleted.summary'),
          detail: t('toasts.deleted.detail'),
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: t('toasts.error.summary'),
          detail: err.response?.data?.message || t('toasts.error.delete'),
        });
      }
    }
  };

  const handleDownload = (row: InvestorDocument) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/${row.documentPath}`.replace(/([^:]\/)\/+/g, '$1');
    window.open(url, '_blank');
  };

  /** ✅ Moved resetForm ABOVE leftToolbarTemplate to avoid temporal dead zone */
  const resetForm = useCallback(() => {
    setFormData({
      documentMasterId: null,
      documentTypeId: null,
      issuerId: null,
      departmentId: null,
      documentName: '',
      documentPath: '',
      validFrom: null,
      validTo: null,
      documentDateOfIssuance: null,
      comments: '',
      file: null,
    });
    setEditingId(null);
    setDateErrors({});
    setCompressionSummary(null);
  }, []);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Investor Document"
        icon="pi pi-plus"
        className="investor-docs-btn investor-docs-btn-primary investor-docs-add-btn"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
      />
    ),
    [t, resetForm],
  );

  const [exporting, setExporting] = useState(false);

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="investor-docs-toolbar-actions d-flex flex-wrap gap-2 justify-content-end">
        <Button
          label={t('actions.clearFilters')}
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          className="investor-docs-btn"
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange('');
            handleFiltersChange({});
          }}
        />
        <Button
          label={t('actions.exportCSV')}
          icon="pi pi-download"
          severity="info"
          rounded
          className="investor-docs-btn"
          onClick={async () => {
            setExporting(true);
            await handleExportCSV(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label={t('actions.exportExcel')}
          icon="pi pi-file-excel"
          severity="success"
          rounded
          className="investor-docs-btn"
          onClick={async () => {
            setExporting(true);
            await handleExportExcel(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label={t('actions.exportPDF')}
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          className="investor-docs-btn"
          onClick={async () => {
            setExporting(true);
            await handleExportPDF(filteredData);
            setExporting(false);
          }}
          loading={exporting}
          disabled={isLoading}
        />
      </div>
    ),
    [t, exporting, isLoading, filteredData, clearFilters, handleGlobalFilterChange, handleFiltersChange, handleExportCSV, handleExportExcel, handleExportPDF],
  );

  // Submit (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate dates first
      const { ok, errors } = validateDates();
      if (!ok) {
        setDateErrors(errors);
        const messages = Object.values(errors).filter(Boolean);
        toastRef.current?.show({
          severity: 'warn',
          summary: t('toasts.invalidDates.summary'),
          detail: messages.join(' '),
        });
        return;
      }

      // Resolve checklistId from selected Document Master
      const selectedMaster = docMasters.find((m: any) => m.id === formData.documentMasterId);
      const checklistId: string | undefined = selectedMaster?.checklistId;

      if (!formData.documentMasterId || !checklistId) {
        toastRef.current?.show({
          severity: 'warn',
          summary: t('toasts.missingChecklist.summary'),
          detail: t('toasts.missingChecklist.detail'),
        });
        return;
      }

      // Upload first (if file selected)
      let finalPath = formData.documentPath;
      let versionFromUpload: string | undefined;
      setCompressionSummary(null);

      if (formData.file) {
        // ✅ Send documentMasterId; backend builds correct name & version
        const uploadRes = (await uploadMutation.mutateAsync({
          file: formData.file,
          documentMasterId: formData.documentMasterId!,
        })) as UploadResponse;

        finalPath = uploadRes.data.filePath;
        versionFromUpload = uploadRes.data.documentVersion;

        // Show compression stats (if present)
        const { originalSizeBytes, compressedSizeBytes, savedPercent } = uploadRes.data;
        if (originalSizeBytes && compressedSizeBytes) {
          setCompressionSummary({
            originalSizeBytes,
            compressedSizeBytes,
            savedPercent,
            mimeType: uploadRes.data.mimetype,
          });
          toastRef.current?.show({
            severity: 'success',
            summary: t('toasts.fileProcessed.summary'),
            detail: t('toasts.fileProcessed.detail', { percent: savedPercent?.toFixed(2) ?? '-' }),
          });
        }
      }

      // Build payload — use local YYYY-MM-DD (avoid toISOString)
      // Use CreateInvestorDocumentDto for create; UpdateInvestorDocumentDto for update
      const commonFields = {
        documentMasterId: formData.documentMasterId!,
        checklistId,
        documentTypeId: formData.documentTypeId!,
        issuerId: formData.issuerId!,
        departmentId: formData.departmentId!,
        documentName: formData.documentName,
        documentPath: finalPath,
        validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
        validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
        documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
        comments: formData.comments || undefined,
      };

      if (editingId) {
        const payloadUpdate: UpdateInvestorDocumentDto = {
          documentName: formData.documentName,
          comments: formData.comments || undefined,
          validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
          validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
          documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
          // Only send documentPath if user uploaded a new file
          documentPath: finalPath && finalPath !== formData.documentPath ? finalPath : undefined,
        };

        await updateMutation.mutateAsync({ id: editingId, data: payloadUpdate });
        toastRef.current?.show({ severity: 'success', summary: t('toasts.success.summary'), detail: t('toasts.success.updated') });
      } else {
        const payloadCreate: CreateInvestorDocumentDto = {
          documentMasterId: formData.documentMasterId!,
          checklistId,
          documentTypeId: formData.documentTypeId!,
          issuerId: formData.issuerId!,
          departmentId: formData.departmentId!,
          documentName: formData.documentName,
          documentPath: finalPath,
          documentVersion: versionFromUpload, // ✅ keep version consistent with filename
          validFrom: isValidityRequired ? toYMDLocal(formData.validFrom) : undefined,
          validTo: isValidityRequired ? toYMDLocal(formData.validTo) : undefined,
          documentDateOfIssuance: isValidityRequired ? toYMDLocal(formData.documentDateOfIssuance) : undefined,
          comments: formData.comments || undefined,
        };

        await createMutation.mutateAsync(payloadCreate);
        toastRef.current?.show({ severity: 'success', summary: t('toasts.success.summary'), detail: t('toasts.success.created') });
      }

      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: t('toasts.error.summary'),
        detail: err.response?.data?.message || t('toasts.error.saving'),
      });
    }
  };

  /** Extract filename from documentPath for display */
  const currentFileName = useMemo(() => {
    if (!formData.documentPath) return '';
    const parts = formData.documentPath.split(/[\\/]/);
    return parts[parts.length - 1] || '';
  }, [formData.documentPath]);

  /** Helper for KB/MB display */
  const fmtSize = (bytes?: number) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const rowActions: RowAction<InvestorDocument>[] = useMemo(
    () => [
      { icon: 'pi pi-pencil', label: t('actions.edit'), severity: 'info', onClick: (row) => handleEdit(row), tooltip: t('tooltips.edit') },
      { icon: 'pi pi-download', label: t('actions.download'), severity: 'secondary', onClick: (row) => handleDownload(row), tooltip: t('tooltips.downloadFile') },
      {
        icon: 'pi pi-trash',
        label: t('actions.delete'),
        severity: 'error',
        onClick: (row) => handleDelete(row),
        tooltip: t('tooltips.delete'),
        visible: (row) => row.documentStatus !== 'V' && row.documentStatus !== 'M',
      },
    ],
    [t, handleEdit, handleDownload, handleDelete],
  );

  return (
    <div className="investor-documents-page mx-auto max-w-[1400px]">
      <Toast ref={toastRef} />

      <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-600">
              Investor Workspace
            </p>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mb-0 text-sm text-gray-500">
              Manage uploaded documents, track verification status, and export records.
            </p>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="font-semibold">{stats?.total ?? 0}</span> total records
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: t('stats.total', { count: stats?.total ?? 0 }), count: stats?.total ?? 0, tone: 'border-red-100 bg-red-50/60 text-red-700' },
          { label: t('stats.unverified', { count: stats?.unverified ?? 0 }), count: stats?.unverified ?? 0, tone: 'border-amber-100 bg-amber-50 text-amber-700' },
          { label: t('stats.verified', { count: stats?.verified ?? 0 }), count: stats?.verified ?? 0, tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
          { label: t('stats.rejected', { count: stats?.rejected ?? 0 }), count: stats?.rejected ?? 0, tone: 'border-rose-100 bg-rose-50 text-rose-700' },
          { label: t('stats.mismatched', { count: stats?.mismatch ?? 0 }), count: stats?.mismatch ?? 0, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
        ].map((item, idx) => (
          <div key={idx} className={`rounded-2xl border p-4 shadow-sm ${item.tone}`}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80">
              {item.label}
            </p>
            <p className="mb-0 text-2xl font-bold leading-none">{item.count}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-3xl border border-gray-200 bg-white p-3 shadow-sm md:p-4">
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="investor-docs-toolbar justify-content-between border-0 bg-transparent p-0"
        />
      </div>

      {/* Dialog for Create/Edit */}
      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? t('dialog.editHeader') : t('dialog.addHeader')}
        modal
        className="investor-documents-dialog"
        style={{ width: '72vw', maxWidth: '1100px' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit} className="investor-docs-form">
          {/* Section: Document Details */}
          <section className="investor-docs-form-section">
            <h5 className="investor-docs-section-title">{t('sections.details')}</h5>
            <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentType')} *</label>
              <select
                name="documentTypeId"
                value={formData.documentTypeId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'documentTypeId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
              >
                <option value="">{t('common.select')}</option>
                {documentTypes.map((t_) => (
                  <option key={t_.id} value={t_.id}>
                    {t_.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.issuer')} *</label>
              <select
                name="issuerId"
                value={formData.issuerId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'issuerId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
              >
                <option value="">{t('common.select')}</option>
                {issuers.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            </div>

            {/* Department & Document Master */}
            <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.department')} *</label>
              <select
                name="departmentId"
                value={formData.departmentId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'departmentId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
                disabled={!formData.documentTypeId || !formData.issuerId}
              >
                <option value="">{t('common.select')}</option>
                {filteredDepartments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {!formData.documentTypeId || !formData.issuerId ? (
                <small className="text-muted">{t('hints.selectTypeAndIssuer')}</small>
              ) : null}
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentMaster')} *</label>
              <select
                name="documentMasterId"
                value={formData.documentMasterId ?? ''}
                onChange={(e) =>
                  handleInputChange({ target: { name: 'documentMasterId', value: Number(e.target.value) } })
                }
                className="form-select"
                required
                disabled={!formData.documentTypeId || !formData.issuerId || !formData.departmentId}
              >
                <option value="">{t('common.select')}</option>
                {filteredDocMasters.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.checklistId} — {m.checklistDocumentName}
                  </option>
                ))}
              </select>
              {!formData.documentTypeId || !formData.issuerId || !formData.departmentId ? (
                <small className="text-muted">{t('hints.selectTypeIssuerDept')}</small>
              ) : null}
            </div>
            </div>
          </section>

          {/* Section: Upload & Name */}
          <section className="investor-docs-form-section">
            <h5 className="investor-docs-section-title">{t('sections.upload')}</h5>
            <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.documentName')} *</label>
              <InputText
                name="documentName"
                value={formData.documentName}
                onChange={handleInputChange}
                placeholder={t('placeholders.documentName')}
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">{t('fields.selectFile')} *</label>

              {formData.documentPath && (
                <div className="mb-2">
                  <small className="text-muted">
                    {t('hints.currentFile')}&nbsp;
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}/${formData.documentPath}`.replace(/([^:]\/)\/+/g, '$1')}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {currentFileName}
                    </a>
                  </small>
                </div>
              )}

              <input
                type="file"
                className="form-control"
                accept=".png,.jpg,.jpeg,.pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                required={!editingId && !formData.documentPath}
              />

              {formData.file && (
                <small className="text-muted d-block mt-1">
                  {t('hints.selectedFile', {
                    name: formData.file.name,
                    kb: Math.round(formData.file.size / 1024),
                    type: formData.file.type || t('hints.unknownType'),
                  })}
                </small>
              )}

              {/* Compression summary */}
              {compressionSummary && (
                <div className="mt-2">
                  <Tag
                    value={t('hints.compressed', {
                      compressed: fmtSize(compressionSummary.compressedSizeBytes),
                      original: fmtSize(compressionSummary.originalSizeBytes),
                      percent: compressionSummary.savedPercent?.toFixed(2) ?? '-',
                    })}
                    severity="success"
                  />
                </div>
              )}

              <small className="text-muted d-block mt-2">
                {t('hints.allowedTypes')}
              </small>
            </div>
            </div>
          </section>

          {/* Section: Validity */}
          {isValidityRequired && (
            <section className="investor-docs-form-section">
              <h5 className="investor-docs-section-title">{t('sections.validity')}</h5>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.validFrom')}</label>
                  <Calendar
                    value={formData.validFrom}
                    onChange={(e: any) => handleDateChange('validFrom', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.validFrom ? 'p-invalid' : ''}`}
                    maxDate={formData.validTo ?? undefined}
                  />
                  {dateErrors.validFrom && (
                    <small className="text-danger d-block mt-1">{dateErrors.validFrom}</small>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.validTo')}</label>
                  <Calendar
                    value={formData.validTo}
                    onChange={(e: any) => handleDateChange('validTo', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.validTo ? 'p-invalid' : ''}`}
                    minDate={formData.validFrom ?? undefined}
                  />
                  {dateErrors.validTo && (
                    <small className="text-danger d-block mt-1">{dateErrors.validTo}</small>
                  )}
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">{t('fields.issuedOn')}</label>
                  <Calendar
                    value={formData.documentDateOfIssuance}
                    onChange={(e: any) => handleDateChange('documentDateOfIssuance', e.value)}
                    showIcon
                    dateFormat="yy-mm-dd"
                    className={`w-100 ${dateErrors.documentDateOfIssuance ? 'p-invalid' : ''}`}
                    maxDate={formData.validTo ?? undefined}
                  />
                  {dateErrors.documentDateOfIssuance && (
                    <small className="text-danger d-block mt-1">{dateErrors.documentDateOfIssuance}</small>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Comments */}
          <section className="investor-docs-form-section">
            <h5 className="investor-docs-section-title">{t('fields.comments')}</h5>
            <div className="mb-0">
              <InputText
                name="comments"
                value={formData.comments ?? ''}
                onChange={handleInputChange}
                className="w-100"
              />
            </div>
          </section>

          {/* Actions */}
          <div className="investor-docs-form-actions d-flex gap-2 mt-2">
            <Button
              label={editingId ? t('actions.update') : t('actions.create')}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending || uploadMutation.isPending}
              className="flex-grow-1 investor-docs-btn investor-docs-btn-primary"
            />
            <Button
              label={t('actions.cancel')}
              icon="pi pi-times"
              severity="secondary"
              className="investor-docs-btn"
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      {/* DataTable */}
      <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm md:p-4">
        <ReusableDataTable<InvestorDocument>
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
        <div className="d-flex justify-content-between align-items-center gap-2 mt-3 flex-wrap">
          <small className="text-muted">
            Showing {(pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1)}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </small>
          <Paginator
            first={(pagination.page - 1) * pagination.limit}
            rows={pagination.limit}
            totalRecords={pagination.total}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      <style jsx global>{`
        .investor-documents-page .p-tag {
          border-radius: 999px;
          font-weight: 600;
        }

        .investor-docs-toolbar .p-toolbar-group-left,
        .investor-docs-toolbar .p-toolbar-group-right,
        .investor-docs-toolbar .p-toolbar-group-start,
        .investor-docs-toolbar .p-toolbar-group-end {
          width: 100%;
        }

        @media (min-width: 992px) {
          .investor-docs-toolbar .p-toolbar-group-left,
          .investor-docs-toolbar .p-toolbar-group-start {
            width: auto;
          }

          .investor-docs-toolbar .p-toolbar-group-right,
          .investor-docs-toolbar .p-toolbar-group-end {
            width: auto;
          }
        }

        .investor-docs-btn .p-button,
        .investor-docs-btn.p-button {
          border-radius: 12px;
          font-weight: 600;
        }

        .investor-docs-btn-primary.p-button {
          background: #e9090c;
          border-color: #e9090c;
        }

        .investor-docs-btn-primary.p-button:not(:disabled):hover {
          background: #c80a0d;
          border-color: #c80a0d;
        }

        .investor-docs-add-btn.p-button {
          min-height: 46px;
          padding: 0.65rem 1rem;
          border-radius: 14px;
          box-shadow: 0 8px 20px rgba(233, 9, 12, 0.18);
          white-space: nowrap;
        }

        .investor-docs-add-btn.p-button,
        .investor-docs-add-btn.p-button .p-button-label,
        .investor-docs-add-btn.p-button .p-button-icon {
          color: #fff;
        }

        .investor-docs-add-btn.p-button .p-button-icon {
          font-size: 0.95rem;
        }

        .investor-docs-add-btn.p-button .p-button-label {
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .investor-docs-add-btn.p-button {
            width: 100%;
            justify-content: center;
          }
        }

        .investor-documents-dialog .p-dialog-header {
          border-bottom: 1px solid #eef0f3;
          padding: 1rem 1.25rem;
          background: linear-gradient(180deg, #fff 0%, #fff7f7 100%);
        }

        .investor-documents-dialog .p-dialog-content {
          padding: 1rem;
          background: #f8fafc;
        }

        .investor-documents-dialog .p-dialog-header .p-dialog-title {
          color: #111827;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .investor-documents-dialog .p-dialog-header .p-dialog-header-icon {
          width: 2rem;
          height: 2rem;
          border-radius: 10px;
          color: #64748b;
        }

        .investor-documents-dialog .p-dialog-header .p-dialog-header-icon:hover {
          background: #fee2e2;
          color: #e9090c;
        }

        .investor-docs-form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          max-height: min(72vh, 900px);
          overflow: auto;
          padding-right: 0.15rem;
        }

        .investor-docs-form-section {
          background: #fff;
          border: 1px solid #eceff3;
          border-radius: 16px;
          padding: 0.95rem 1rem 0.65rem;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
        }

        .investor-docs-section-title {
          margin: 0 0 0.8rem;
          color: #111827;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .investor-docs-section-title::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #e9090c;
          box-shadow: 0 0 0 4px rgba(233, 9, 12, 0.12);
        }

        .investor-docs-form-section .row {
          margin-left: -0.4rem;
          margin-right: -0.4rem;
        }

        .investor-docs-form-section .row + .row {
          margin-top: 0.15rem;
          padding-top: 0.15rem;
          border-top: 1px dashed #eef0f3;
        }

        .investor-docs-form-section [class*='col-'] {
          padding-left: 0.4rem;
          padding-right: 0.4rem;
        }

        .investor-docs-form-section .mb-3 {
          margin-bottom: 0.75rem !important;
        }

        .investor-documents-dialog .form-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.4rem;
        }

        .investor-documents-dialog .form-select,
        .investor-documents-dialog .form-control,
        .investor-documents-dialog .p-inputtext,
        .investor-documents-dialog .p-calendar .p-inputtext {
          border-radius: 10px;
          border-color: #d1d5db;
          min-height: 40px;
          box-shadow: none;
          font-size: 0.9rem;
        }

        .investor-documents-dialog .form-select:focus,
        .investor-documents-dialog .form-control:focus,
        .investor-documents-dialog .p-inputtext:focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.12);
        }

        .investor-documents-dialog .p-calendar {
          width: 100%;
        }

        .investor-documents-dialog .p-calendar .p-button {
          background: #fff0f0;
          border: 0;
          color: #e9090c;
          width: 2.25rem;
        }

        .investor-documents-dialog .p-calendar .p-button:hover {
          background: #fee2e2;
        }

        .investor-docs-form-actions {
          position: sticky;
          bottom: 0;
          background: linear-gradient(180deg, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.92) 20%, #f8fafc 100%);
          padding-top: 0.6rem;
          margin-top: -0.1rem;
        }

        .investor-docs-form-actions .p-button {
          min-height: 42px;
        }

        .investor-documents-table .p-datatable-header {
          background: #f9fafb;
          border: 1px solid #eef0f3;
          border-radius: 14px;
          padding: 0.85rem;
        }

        .investor-documents-table .p-datatable-table {
          min-width: 1600px;
        }

        .investor-documents-table .p-datatable-header .p-input-icon-left {
          width: 100%;
          position: relative;
        }

        .investor-documents-table .p-datatable-header .p-input-icon-left > .pi {
          left: 0.95rem;
          color: #9ca3af;
          margin-top: -0.5rem;
        }

        .investor-documents-table .p-datatable-header .p-input-icon-left > .p-inputtext {
          width: 100%;
          min-height: 46px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #fff;
          padding-left: 2.5rem;
          box-shadow: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .investor-documents-table .p-datatable-header .p-input-icon-left > .p-inputtext:focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.12);
        }

        .investor-documents-table .p-datatable-header .p-input-icon-left > .p-inputtext::placeholder {
          color: #9ca3af;
        }

        .investor-documents-table .p-datatable-thead > tr > th {
          background: #fff7f7;
          color: #7f1d1d;
          font-weight: 700;
          border-color: #f1dede;
          padding: 0.85rem 0.75rem;
          vertical-align: top;
        }

        .investor-documents-table .p-datatable-thead > tr:nth-child(2) > th {
          background: #fff;
          border-top: 0;
          border-bottom: 1px solid #eef0f3;
          padding-top: 0.35rem;
          padding-bottom: 0.6rem;
        }

        .investor-documents-table .p-column-filter {
          width: 100%;
          min-width: 110px;
          min-height: 34px;
          height: 34px;
          border: 1px solid #cfd6df;
          border-radius: 8px;
          background: #ffffff;
          font-size: 0.8rem;
          color: #374151;
          box-shadow: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .investor-documents-table .p-column-filter:focus,
        .investor-documents-table .form-select.p-column-filter:focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.12);
          outline: 0;
        }

        .investor-documents-table .p-column-filter::placeholder {
          color: #94a3b8;
          font-size: 0.75rem;
        }

        .investor-documents-table .p-column-filter .p-inputtext,
        .investor-documents-table .p-column-filter.p-inputtext {
          border: 0;
          box-shadow: none;
          min-height: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          padding: 0.35rem 0.6rem;
          font-size: 0.8rem;
          color: #374151;
        }

        .investor-documents-table select.p-column-filter.form-select {
          height: 34px;
          min-height: 34px;
          border-radius: 8px;
          border: 1px solid #cfd6df;
          box-shadow: none !important;
          color: #374151;
          font-size: 0.8rem;
          line-height: 1.2;
          padding: 0.3rem 1.8rem 0.3rem 0.6rem;
          background-color: #fff;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='none' stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.6' d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 12px 12px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        .investor-documents-table .p-calendar.p-column-filter {
          display: flex;
          align-items: center;
          overflow: hidden;
          padding-right: 2.4rem;
          position: relative;
          min-width: 92px;
          border-radius: 8px;
        }

        .investor-documents-table .p-calendar.p-column-filter .p-inputtext {
          border: 0 !important;
          outline: 0;
          box-shadow: none !important;
          background: transparent;
          margin: 0;
          padding-right: 2.2rem;
        }

        .investor-documents-table .p-calendar.p-column-filter .p-button {
          position: absolute;
          right: 0.2rem;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 0;
          background: #f8fafc;
          color: #64748b;
        }

        .investor-documents-table .p-calendar.p-column-filter .p-button:hover {
          background: #fee2e2;
          color: #e9090c;
        }

        .investor-documents-table .p-column-filter > .p-inputtext:focus,
        .investor-documents-table .p-calendar.p-column-filter .p-inputtext:focus,
        .investor-documents-table select.p-column-filter.form-select:focus {
          box-shadow: none !important;
        }

        .investor-documents-table .p-datatable-tbody > tr > td {
          border-color: #eef0f3;
          padding: 0.8rem 0.75rem;
          color: #1f2937;
          background: #fff;
        }

        .investor-documents-table .p-datatable-tbody > tr:hover > td {
          background: #fffafa;
        }

        .investor-documents-table .p-datatable-tbody > tr:nth-child(even) > td {
          background: #fcfcfd;
        }

        .investor-documents-table .p-datatable-tbody > tr:nth-child(even):hover > td {
          background: #fff7f7;
        }

        .investor-documents-table .p-datatable-wrapper {
          border: 1px solid #eef0f3;
          border-radius: 14px;
          overflow: hidden;
        }

        .investor-documents-table .p-paginator {
          border-top: 1px solid #eef0f3;
          background: #fff;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          padding: 0.75rem;
        }

        .investor-documents-table .p-paginator .p-paginator-pages .p-paginator-page,
        .investor-documents-table .p-paginator .p-paginator-next,
        .investor-documents-table .p-paginator .p-paginator-prev,
        .investor-documents-table .p-paginator .p-paginator-first,
        .investor-documents-table .p-paginator .p-paginator-last {
          border-radius: 10px;
        }

        .investor-documents-table .p-paginator .p-paginator-pages .p-paginator-page.p-highlight {
          background: #e9090c;
          border-color: #e9090c;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
