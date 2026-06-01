'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { useCommonDocuments } from '@/hooks/common/useCommonDocuments';
import DocumentUploadModal from '@/components/common/DocumentUploadModal';
import { buildDocumentUrl } from '@/components/common/documentUtils';

type DocumentItem = {
  id: number;
  name: string;
  extension?: string;
  maxSize?: number;
  isRequired?: string;
  comment?: string;
  isMultiVersionAllowed?: boolean;
  isDocValidityRequired?: boolean;
  documentType?: string | null;
};

type UploadFormState = {
  uploadType: 'new' | 'duplicate';
  comments: string;
  validFrom: string;
  validTo: string;
  docDateOfIssuance: string;
  isDocumentActive: string;
  file: File | null;
};

interface CommonDocumentPageProps {
  serviceId: string;
  submissionId: number;
  deptId?: number;
  readOnly?: boolean;
}

export default function CommonDocumentPage({
  serviceId,
  submissionId,
  deptId = 0,
  readOnly = false,
}: CommonDocumentPageProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalDoc, setUploadModalDoc] = useState<DocumentItem | null>(null);
  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    uploadType: 'new',
    comments: '',
    validFrom: '',
    validTo: '',
    docDateOfIssuance: '',
    isDocumentActive: 'Y',
    file: null,
  });
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  const {
    uploadedDocuments,
    setUploadedDocuments,
    uploadedList,
    documentsAppStatus,
    uploadDocument,
    dms,
  } = useCommonDocuments(serviceId, submissionId, deptId);

  const allowedDocumentStatuses = ['I', 'RBI', 'H', 'DP', 'PD'];
  const canUploadDocuments =
    !readOnly && (!documentsAppStatus || allowedDocumentStatuses.includes(documentsAppStatus));

  const dmsTypes = useMemo(() => normalizeTypes(dms), [dms]);
  const typeChecklistMap = useMemo(() => buildChecklistMap(dmsTypes), [dmsTypes]);
  const rows = useMemo(() => buildRows(dmsTypes), [dmsTypes]);
  const checklistLookup = useMemo(() => buildChecklistLookup(dms), [dms]);
  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const [selectedDocs, setSelectedDocs] = useState<Record<string, number>>({});

  useEffect(() => {
    const next: Record<string, number> = {};
    rows.forEach((row) => {
      next[row.rowKey] = row.defaultDocId;
    });
    setSelectedDocs(next);
  }, [rows]);

  const resolveDoc = (row: RowItem) => {
    const selectedId = selectedDocs[row.rowKey] || 0;
    const fallback = typeChecklistMap.get(row.typeId)?.get(selectedId);
    return fallback || null;
  };

  const openUploadModal = (doc: DocumentItem) => {
    if (readOnly) return;
    setUploadModalDoc(doc);
    setUploadError('');
    setUploadForm({
      uploadType: doc?.isMultiVersionAllowed === false ? 'new' : 'new',
      comments: '',
      validFrom: '',
      validTo: '',
      docDateOfIssuance: '',
      isDocumentActive: 'Y',
      file: null,
    });
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setUploadModalDoc(null);
    setUploadError('');
  };

  const submitUpload = async (doc: DocumentItem) => {
    if (readOnly) return;
    if (!submissionId) {
      setUploadError('Submission ID not found.');
      return;
    }
    if (!doc?.id) {
      setUploadError('Document not found.');
      return;
    }
    if (!uploadForm.file) {
      setUploadError('Please select a file.');
      return;
    }
    try {
      setUploading(true);
      setUploadError('');
      const form = new FormData();
      form.append('file', uploadForm.file);
      form.append('submissionId', String(submissionId));
      form.append('documentMasterId', String(doc.id));
      form.append('uploadType', uploadForm.uploadType);
      form.append('comments', uploadForm.comments || '');
      form.append('validFrom', uploadForm.validFrom || '');
      form.append('validTo', uploadForm.validTo || '');
      form.append('docDateOfIssuance', uploadForm.docDateOfIssuance || '');
      form.append('isDocumentActive', uploadForm.isDocumentActive || 'Y');

      const res = await uploadDocument(form);

      if (res?.success === false) {
        setUploadError(res?.message || 'Upload failed.');
        return;
      }

      const uploaded = res?.data;
      if (uploaded?.documentsId) {
        setUploadedDocuments((prev) => ({ ...prev, [String(doc.id)]: uploaded }));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('common-documents:uploaded', {
            detail: { submissionId, serviceId, documentId: doc.id, uploaded },
          })
        );
      }
      closeUploadModal();
    } catch (error: any) {
      setUploadError(error?.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3 border border-gray-300 text-center">S.No</th>
              <th className="px-4 py-3 border border-gray-300 text-center" style={{ width: '200px' }}>
                Document Type
              </th>
              <th className="px-4 py-3 border border-gray-300 text-center" style={{ width: '200px' }}>
                Document Name
              </th>
              <th className="px-4 py-3 border border-gray-300 text-center">
                Allowed Document Size (MB)
              </th>
              <th className="px-4 py-3 border border-gray-300 text-center" style={{ width: '130px' }}>
                Mandatory/Optional
              </th>
              <th className="px-4 py-3 border border-gray-300 text-center" style={{ width: '320px' }}>
                Description
              </th>
              <th className="px-4 py-3 border border-gray-300 text-center">Latest Version</th>
              <th className="px-4 py-3 border border-gray-300 text-center">Document Status</th>
              <th className="px-4 py-3 border border-gray-300 text-center w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-4 py-3 text-center text-gray-500 border border-gray-200"
                  colSpan={9}
                >
                  No documents configured.
                </td>
              </tr>
            )}
            {rows
              .map((row) => {
                const selectedDoc = resolveDoc(row);
                if (!selectedDoc) return null;
                return buildRowData(row, selectedDoc, uploadedDocuments);
              })
              .filter(Boolean)
              .map((item: any, index) => {
                const {
                  row,
                  docItem,
                  maxSizeMb,
                  uploaded,
                  latestVersion,
                  statusLabel,
                  selectedOption,
                } = item;
                const documentUrl = buildDocumentUrl(uploaded?.filePath || '', apiBaseUrl);
                const displayFileName = getUploadedDisplayName(uploaded, docItem?.name);
                return (
                <tr key={row.rowKey}>
                  <td className="px-4 py-3 border border-gray-200 text-center">{index + 1}</td>
                  <td className="px-4 py-3 border border-gray-200 text-center" style={{ width: '200px' }}>
                    {row.typeName || '--'}
                  </td>
                  <td className="px-4 py-3 border border-gray-200" style={{ width: '200px' }}>
                    <Dropdown
                      value={selectedDocs[row.rowKey]}
                      options={row.options}
                      onChange={(e) =>
                        setSelectedDocs((prev) => ({
                          ...prev,
                          [row.rowKey]: Number(e.value),
                        }))
                      }
                      placeholder="Select"
                      className="w-full"
                      filter
                      itemTemplate={renderDropdownOption}
                      valueTemplate={renderSelectedDropdown}
                    />
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center">{maxSizeMb}</td>
                  <td className="px-4 py-3 border border-gray-200 text-center" style={{ width: '130px' }}>
                    {selectedOption?.isRequired ? 'Mandatory' : 'Optional'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 border border-gray-200" style={{ width: '320px' }}>
                    {docItem.comment || '--'}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center">
                    {latestVersion || <span>&nbsp;</span>}
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center">
                    <span className={getStatusClassName(uploaded?.status)}>
                      {statusLabel || <span>&nbsp;</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 border border-gray-200 text-center w-40">
                    <div className="flex items-center justify-center gap-2">
                      {documentUrl ? (
                        <a
                          href={documentUrl}
                          download={displayFileName}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 w-10 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600"
                          aria-label="Download document"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M12 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-4.007 4.007a1 1 0 01-1.414 0L7.279 12.707a1 1 0 111.414-1.414L11 13.586V4a1 1 0 011-1z" />
                            <path d="M5 20a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">&nbsp;</span>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => openUploadModal(docItem)}
                          disabled={
                            !canUploadDocuments ||
                            (docItem?.isMultiVersionAllowed === false && !!uploaded?.filePath)
                          }
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md whitespace-nowrap ${
                            canUploadDocuments &&
                            !(docItem?.isMultiVersionAllowed === false && !!uploaded?.filePath)
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-red-600/20 text-red-700 cursor-not-allowed'
                          }`}
                        >
                          Upload
                        </button>
                      )}
                    </div>
                    {documentUrl ? (
                      <div className="mt-2 text-xs">
                        <a
                          href={documentUrl}
                          download={displayFileName}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {displayFileName}
                        </a>
                      </div>
                    ) : null}
                  </td>
                </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          doc={uploadModalDoc}
          uploadForm={uploadForm}
          setUploadForm={setUploadForm}
          uploadError={uploadError}
          uploading={uploading}
          onClose={closeUploadModal}
          onSubmit={() => submitUpload(uploadModalDoc as DocumentItem)}
          buildAccept={buildAccept}
        />
      )}

      {readOnly && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-700 text-white">
              <tr>
                <th className="px-4 py-3 border border-gray-300 text-center">S.No</th>
                <th className="px-4 py-3 border border-gray-300 text-center">Document Type</th>
                <th className="px-4 py-3 border border-gray-300 text-center">Document Name</th>
                <th className="px-4 py-3 border border-gray-300 text-center">Version</th>
                <th className="px-4 py-3 border border-gray-300 text-center">Status</th>
                <th className="px-4 py-3 border border-gray-300 text-center">File</th>
              </tr>
            </thead>
            <tbody>
              {!uploadedList?.length && (
                <tr>
                  <td className="px-4 py-3 text-center text-gray-500 border border-gray-200" colSpan={6}>
                    No uploaded documents available.
                  </td>
                </tr>
              )}
              {(uploadedList || []).map((row: any, index: number) => {
                const docInfo = checklistLookup.get(Number(row.documentMasterId));
                const version =
                  row.versionType && row.version ? `${row.versionType}${row.version}` : '--';
                const documentUrl = buildDocumentUrl(row.filePath || '', apiBaseUrl);
                const displayFileName = getUploadedDisplayName(row, docInfo?.name);
                return (
                  <tr key={`${row.documentMasterId}-${index}`}>
                    <td className="px-4 py-3 border border-gray-200 text-center">{index + 1}</td>
                    <td className="px-4 py-3 border border-gray-200 text-center">
                      {docInfo?.typeName || '--'}
                    </td>
                    <td className="px-4 py-3 border border-gray-200 text-center">
                      {docInfo?.name || row.fileName || row.originalName || '--'}
                    </td>
                    <td className="px-4 py-3 border border-gray-200 text-center">{version}</td>
                    <td className="px-4 py-3 border border-gray-200 text-center">
                      <span className={getStatusClassName(row.status)}>
                        {getStatusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 border border-gray-200 text-center">
                      {documentUrl ? (
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={displayFileName}
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          {displayFileName}
                        </a>
                      ) : (
                        displayFileName
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type DmsType = {
  id: number;
  name: string;
  isRequired: boolean;
  checklists: any[];
};

type RowItem = {
  rowKey: string;
  typeId: number;
  typeName: string;
  options: Array<{ label: string; value: number; isRequired?: boolean }>;
  defaultDocId: number;
};

const normalizeTypes = (dms: any): DmsType[] => {
  const types = Array.isArray(dms?.documentTypes) ? dms.documentTypes : [];
  return types.map((type: any) => ({
    id: Number(type.id),
    name: type.name || '',
    isRequired: !!type.isRequired,
    checklists: Array.isArray(type.checklists) ? type.checklists : [],
  }));
};

const buildChecklistMap = (types: DmsType[]) => {
  const map = new Map<number, Map<number, any>>();
  types.forEach((type) => {
    const inner = new Map<number, any>();
    type.checklists.forEach((item: any) => {
      inner.set(Number(item.id), item);
    });
    map.set(type.id, inner);
  });
  return map;
};

const buildChecklistLookup = (dms: any) => {
  const map = new Map<number, { name: string; typeName: string }>();
  const types = Array.isArray(dms?.dms?.documentTypes)
    ? dms.dms.documentTypes
    : Array.isArray(dms?.documentTypes)
      ? dms.documentTypes
      : [];
  types.forEach((type: any) => {
    const typeName = type?.name || '';
    (type.checklists || []).forEach((item: any) => {
      map.set(Number(item.id), { name: item.name || '', typeName });
    });
  });
  return map;
};

const getStatusLabel = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'V') return 'Verified';
  if (normalized === 'R') return 'Rejected';
  if (normalized === 'U') return 'Unverified';
  return '--';
};

const getStatusClassName = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'R') return 'text-red-600 font-semibold';
  if (normalized === 'V') return 'text-emerald-600';
  return 'text-gray-700';
};

const getUploadedDisplayName = (uploaded: any, fallback?: string) => {
  return (
    String(uploaded?.originalName || '').trim() ||
    String(uploaded?.displayName || '').trim() ||
    String(uploaded?.fileName || '').trim() ||
    String(fallback || '').trim() ||
    'View Document'
  );
};

const buildRows = (types: DmsType[]): RowItem[] => {
  return types.map((type) => {
    const options = type.checklists.map((item: any) => ({
      label: item.name || '',
      value: Number(item.id),
      isRequired: !!item.isRequired,
    }));
    return {
      rowKey: `${type.id}`,
      typeId: type.id,
      typeName: type.name || '',
      options,
      defaultDocId: Number(options[0]?.value || 0),
    };
  });
};

const resolveMaxSizeMb = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (!numeric) return '-';
  if (numeric > 1024 * 1024) {
    return Number(numeric / (1024 * 1024)).toFixed(2);
  }
  return Number(numeric).toFixed(2);
};

const buildRowData = (row: RowItem, selectedDoc: any, uploadedDocuments: Record<string, any>) => {
  const maxSizeMb = resolveMaxSizeMb(selectedDoc.maxSizeMb);
  const uploaded = uploadedDocuments[String(selectedDoc.id)];
  const latestVersion =
    uploaded?.versionType && uploaded?.version ? `${uploaded.versionType}${uploaded.version}` : '';
  const statusLabel = getStatusLabel(uploaded?.status);
  const docItem: DocumentItem = {
    id: Number(selectedDoc.id),
    name: selectedDoc.name || '',
    extension: Array.isArray(selectedDoc.allowedFormats) ? selectedDoc.allowedFormats.join(',') : '',
    maxSize: selectedDoc.maxSizeMb || null,
    isRequired: selectedDoc.isRequired ? 'Y' : 'N',
    comment: selectedDoc?.meta?.comment || selectedDoc?.description || '',
    isMultiVersionAllowed: selectedDoc?.isMultiVersionAllowed ?? true,
    isDocValidityRequired: selectedDoc?.isDocValidityRequired ?? false,
    documentType: row.typeName,
  };
  const selectedOption = row.options.find((item) => Number(item.value) === Number(selectedDoc.id));
  return { row, docItem, maxSizeMb, uploaded, latestVersion, statusLabel, selectedOption };
};

const renderDropdownOption = (option: any) => (
  <div className="flex items-center gap-1">
    <span>{option.label}</span>
    {option.isRequired ? <span style={{ color: '#dc2626' }}>*</span> : null}
  </div>
);

const renderSelectedDropdown = (option: any, props: any) => {
  if (!option) return <span>{props.placeholder}</span>;
  return renderDropdownOption(option);
};

const buildAccept = (ext?: string) => {
  if (!ext) return '';
  const parts = String(ext)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parts.map((item) => `.${item}`).join(',');
};
