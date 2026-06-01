'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { MultiSelect } from 'primereact/multiselect';

import { useServiceDms, useSaveServiceDms, uploadServiceDmsFile } from '@/hooks/master/useServiceDms';
import { useDocumentTypes } from '@/hooks/master/useDocumentTypes';
import { useDocumentMasters } from '@/hooks/master/useDocumentMasters';
import { useDocumentCheckpoints } from '@/hooks/master/useDocumentCheckpoints';
import { useServiceFormFields } from '@/hooks/master/useServiceFormFields';

type DmsChecklist = {
  id: number;
  name: string;
  isRequired: boolean;
  maxSizeMb: number | null;
  allowedFormats: string[];
  prescribedFormat?: { fileName: string; filePath: string } | null;
  checkpoints: { id: number; name: string }[];
  showCondition?: {
    fieldName?: string;
    operator?: string;
    value?: string;
    isManualField?: boolean;
  } | null;
  showAfter?: {
    fieldName?: string;
    isManualField?: boolean;
  } | null;
  meta?: any;
};

type DmsDocumentType = {
  id: number;
  name: string;
  isRequired?: boolean;
  checklists: DmsChecklist[];
};

type DmsPayload = {
  serviceId: string;
  serviceStatus?: string | null;
  documentTypes: DmsDocumentType[];
};

const FORMAT_OPTIONS = [
  { label: 'PDF', value: 'pdf' },
  { label: 'JPG', value: 'jpg' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'PNG', value: 'png' },
  { label: 'DOC', value: 'doc' },
  { label: 'DOCX', value: 'docx' },
  { label: 'XLS', value: 'xls' },
  { label: 'XLSX', value: 'xlsx' },
  { label: 'CSV', value: 'csv' },
];

const OPERATOR_OPTIONS = [
  { label: '=', value: 'eq' },
  { label: '!=', value: 'neq' },
  { label: '>', value: 'gt' },
  { label: '>=', value: 'gte' },
  { label: '<', value: 'lt' },
  { label: '<=', value: 'lte' },
  { label: 'Contains', value: 'contains' },
];

const toFormatArray = (value?: string | null) => {
  if (!value) return [];
  return String(value)
    .split(/[,\s]+/)
    .map((item) => item.trim().replace('.', '').toLowerCase())
    .filter(Boolean);
};

const toMaxSizeMb = (value?: number | null) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  if (numeric > 1024 * 1024) {
    return Number((numeric / (1024 * 1024)).toFixed(2));
  }
  return Number(numeric.toFixed(2));
};

export default function ServiceDmsConfig() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);

  const serviceId = searchParams.get('serviceId') || '';

  const { data: dmsResponse, isLoading } = useServiceDms(serviceId);
  const saveMutation = useSaveServiceDms();

  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: documentMasters = [] } = useDocumentMasters();
  const { data: documentCheckpoints = [] } = useDocumentCheckpoints();

  const [dms, setDms] = useState<DmsPayload>({
    serviceId,
    serviceStatus: '',
    documentTypes: [],
  });
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);

  const [checkpointDialogOpen, setCheckpointDialogOpen] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<{ typeId: number; checklistId: number } | null>(null);
  const [checkpointSelection, setCheckpointSelection] = useState<number[]>([]);

  const { options: formFieldOptions } = useServiceFormFields(serviceId, dms.serviceStatus);

  const documentTypeOptions = useMemo(
    () => documentTypes.map((item: any) => ({ label: item.name, value: item.id })),
    [documentTypes]
  );

  const documentTypeMap = useMemo(() => {
    const map = new Map<number, any>();
    documentTypes.forEach((item: any) => map.set(Number(item.id), item));
    return map;
  }, [documentTypes]);

  const documentMasterMap = useMemo(() => {
    const map = new Map<number, any>();
    documentMasters.forEach((item: any) => map.set(Number(item.id), item));
    return map;
  }, [documentMasters]);

  useEffect(() => {
    if (!dmsResponse) return;
    const baseDms: DmsPayload = dmsResponse.dms || {
      serviceId,
      serviceStatus: dmsResponse.serviceStatus,
      documentTypes: [],
    };
    setDms({
      serviceId,
      serviceStatus: dmsResponse.serviceStatus || baseDms.serviceStatus || '',
      documentTypes: baseDms.documentTypes || [],
    });
    const ids = (baseDms.documentTypes || []).map((item: any) => Number(item.id)).filter(Number.isFinite);
    setSelectedTypeIds(ids);
  }, [dmsResponse, serviceId]);

  const syncSelectedTypes = (ids: number[]) => {
    setDms((prev) => {
      const existing = prev.documentTypes || [];
      const map = new Map(existing.map((t) => [Number(t.id), t]));
      const next = ids.map((id) => {
        const current = map.get(Number(id));
        if (current) return current;
        const info = documentTypeMap.get(Number(id));
        return { id, name: info?.name || '', isRequired: false, checklists: [] };
      });
      return { ...prev, documentTypes: next };
    });
  };

  const handleTypeChange = (ids: number[]) => {
    setSelectedTypeIds(ids);
    syncSelectedTypes(ids);
  };

  const getDocumentsForType = (typeId: number) => {
    return documentMasters.filter((doc: any) => Number(doc.documentTypeId) === Number(typeId));
  };

  const updateDocumentType = (typeId: number, patch: Partial<DmsDocumentType>) => {
    setDms((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.map((type) =>
        Number(type.id) === Number(typeId) ? { ...type, ...patch } : type
      ),
    }));
  };

  const updateChecklist = (typeId: number, checklistId: number, patch: Partial<DmsChecklist>) => {
    setDms((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.map((type) => {
        if (Number(type.id) !== Number(typeId)) return type;
        return {
          ...type,
          checklists: type.checklists.map((checklist) =>
            Number(checklist.id) === Number(checklistId) ? { ...checklist, ...patch } : checklist
          ),
        };
      }),
    }));
  };

  const handleChecklistSelection = (typeId: number, checklistIds: number[]) => {
    setDms((prev) => ({
      ...prev,
      documentTypes: prev.documentTypes.map((type) => {
        if (Number(type.id) !== Number(typeId)) return type;
        const existingMap = new Map(type.checklists.map((item) => [Number(item.id), item]));
        const next = checklistIds.map((id) => {
          const current = existingMap.get(Number(id));
          if (current) return current;
          const doc = documentMasterMap.get(Number(id));
          return {
            id,
            name: doc?.checklistDocumentName || doc?.name || `Document ${id}`,
            isRequired: false,
            maxSizeMb: toMaxSizeMb(doc?.checklistDocumentMaxSize ?? null),
            allowedFormats: toFormatArray(doc?.checklistDocumentExtension),
            prescribedFormat: null,
            checkpoints: [],
            showCondition: null,
            showAfter: null,
            meta: {},
          };
        });
        return { ...type, checklists: next };
      }),
    }));
  };

  const openCheckpointDialog = (typeId: number, checklistId: number) => {
    const type = dms.documentTypes.find((item) => Number(item.id) === Number(typeId));
    const checklist = type?.checklists.find((item) => Number(item.id) === Number(checklistId));
    const ids = checklist?.checkpoints?.map((cp) => cp.id) || [];
    setActiveChecklist({ typeId, checklistId });
    setCheckpointSelection(ids);
    setCheckpointDialogOpen(true);
  };

  const handleCheckpointSave = () => {
    if (!activeChecklist) return;
    const selected = checkpointSelection
      .map((id) => documentCheckpoints.find((cp: any) => Number(cp.id) === Number(id)))
      .filter(Boolean)
      .map((cp: any) => ({ id: cp.id, name: cp.name }));
    updateChecklist(activeChecklist.typeId, activeChecklist.checklistId, {
      checkpoints: selected,
    });
    setCheckpointDialogOpen(false);
  };

  const handleUpload = async (typeId: number, checklistId: number, file: File) => {
    try {
      const uploaded = await uploadServiceDmsFile(file);
      updateChecklist(typeId, checklistId, {
        prescribedFormat: {
          fileName: uploaded.fileName || file.name,
          filePath: uploaded.filePath,
        },
      });
    } catch (error) {
      console.error(error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'File upload failed',
      });
    }
  };

  const buildSavePayload = (): DmsPayload => ({
    serviceId,
    serviceStatus: dms.serviceStatus || '',
    documentTypes: dms.documentTypes.map((type) => ({
      ...type,
      checklists: type.checklists.map((checklist) => ({
        ...checklist,
        meta: {
          ...(checklist.meta || {}),
          serviceStatus: dms.serviceStatus || '',
        },
      })),
    })),
  });

  const handleSave = async () => {
    if (!serviceId) return;
    try {
      const payload = buildSavePayload();
      await saveMutation.mutateAsync({ serviceId, data: payload });
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'DMS saved successfully',
      });
    } catch (error) {
      console.error(error);
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save DMS',
      });
    }
  };

  if (!serviceId) {
    return <div className="p-4 text-sm text-gray-600">Service ID is required.</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Loading DMS...</div>;
  }

  const isManualField = String(dms.serviceStatus || '').toLowerCase() === 'not_applicable';
  const hasFieldOptions = formFieldOptions.length > 0;

  return (
    <div className="p-4" style={{ overflow: 'hidden' }}>
      <style>{`
        .dms-wrap .p-multiselect,
        .dms-wrap .p-inputtext {
          width: 100%;
        }
        .dms-wrap .p-multiselect-label {
          white-space: normal;
        }
        .dms-wrap .table {
          width: 100%;
          table-layout: fixed;
          word-break: break-word;
        }
        .dms-wrap .table td,
        .dms-wrap .table th {
          white-space: normal;
        }
        .dms-wrap .table-responsive {
          overflow-x: hidden;
        }
      `}</style>
      <div className="dms-wrap">
      <Toast ref={toastRef} />
      <div className="mb-3 d-flex align-items-center justify-content-between">
        <div>
          <h2 className="h4 mb-1">Service DMS Configuration</h2>
          <div className="text-muted text-sm">
            Service ID: {dmsResponse?.serviceId || serviceId}
          </div>
          <div className="text-muted text-sm">
            Service Name: {dmsResponse?.serviceName || 'N/A'}
          </div>
          {dms.serviceStatus ? (
            <div className="text-muted text-sm">Service Status: {dms.serviceStatus}</div>
          ) : null}
        </div>
        <div className="d-flex gap-2">
          <Button label="Save DMS" onClick={handleSave} />
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <label className="form-label">Document Types (Multiple)</label>
          <MultiSelect
            value={selectedTypeIds}
            options={documentTypeOptions}
            onChange={(e) => handleTypeChange(e.value || [])}
            placeholder="Select Document Types"
            display="chip"
            filter
            className="w-100"
          />
        </div>
      </div>

      {dms.documentTypes.map((type) => {
        const documentsForType = getDocumentsForType(type.id);
        const documentOptions = documentsForType.map((doc: any) => ({
          label: doc.checklistDocumentName,
          value: doc.id,
        }));
        const selectedDocIds = type.checklists.map((item) => item.id);

        return (
          <div key={type.id} className="card mb-4">
            <div className="card-header d-flex align-items-center justify-content-between">
              <div className="fw-semibold">{type.name || `Document Type ${type.id}`}</div>
              <label className="d-flex align-items-center gap-2 mb-0">
                <input
                  type="checkbox"
                  checked={!!type.isRequired}
                  onChange={(e) => updateDocumentType(type.id, { isRequired: e.target.checked })}
                />
                <span className="text-sm">Required</span>
              </label>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Documents</label>
                <MultiSelect
                  value={selectedDocIds}
                  options={documentOptions}
                  onChange={(e) => handleChecklistSelection(type.id, e.value || [])}
                  placeholder="Select Documents"
                  display="chip"
                  filter
                  className="w-100"
                />
              </div>

              {type.checklists.length === 0 ? (
                <div className="text-muted text-sm">No documents selected.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '240px' }}>Document</th>
                        <th style={{ width: '220px' }}>Formats</th>
                        <th style={{ width: '260px' }}>Prescribed Format</th>
                        <th style={{ width: '160px' }}>Checkpoints</th>
                        <th style={{ width: '260px' }}>Show Conditionally</th>
                        <th style={{ width: '200px' }}>Show After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {type.checklists.map((checklist) => (
                        <tr key={checklist.id}>
                          <td>
                            <div className="fw-medium mb-2">{checklist.name}</div>
                            <div className="d-flex flex-column gap-2">
                              <label className="d-flex align-items-center gap-2 mb-0">
                                <input
                                  type="checkbox"
                                  checked={checklist.isRequired}
                                  onChange={(e) =>
                                    updateChecklist(type.id, checklist.id, { isRequired: e.target.checked })
                                  }
                                />
                                <span className="text-sm">Required</span>
                              </label>
                              <div className="d-flex align-items-center gap-2">
                                <span className="text-sm text-muted">Max Size (MB)</span>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={checklist.maxSizeMb ?? ''}
                                  onChange={(e) =>
                                    updateChecklist(type.id, checklist.id, {
                                      maxSizeMb: e.target.value ? Number(e.target.value) : null,
                                    })
                                  }
                                  min={0}
                                  style={{ maxWidth: '90px' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <MultiSelect
                              value={checklist.allowedFormats || []}
                              options={FORMAT_OPTIONS}
                              onChange={(e) =>
                                updateChecklist(type.id, checklist.id, {
                                  allowedFormats: e.value || [],
                                })
                              }
                              placeholder="Select Formats"
                              display="chip"
                              filter
                              className="w-100"
                            />
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <input
                                type="file"
                                className="form-control form-control-sm"
                                onChange={(e) => {
                                  const file = e.target.files && e.target.files[0];
                                  if (file) handleUpload(type.id, checklist.id, file);
                                }}
                              />
                              {checklist.prescribedFormat?.fileName ? (
                                <div className="d-flex align-items-center justify-content-between">
                                  <span className="text-muted text-sm">
                                    {checklist.prescribedFormat.fileName}
                                  </span>
                                  <Button
                                    label="Remove"
                                    severity="danger"
                                    size="small"
                                    onClick={() =>
                                      updateChecklist(type.id, checklist.id, {
                                        prescribedFormat: null,
                                      })
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-2">
                              <span className="text-muted text-sm">
                                {checklist.checkpoints?.length || 0} selected
                              </span>
                              <Button
                                label="Assign"
                                size="small"
                                onClick={() => openCheckpointDialog(type.id, checklist.id)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-2">
                              {isManualField ? (
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="Field name"
                                  value={checklist.showCondition?.fieldName || ''}
                                  onChange={(e) =>
                                    updateChecklist(type.id, checklist.id, {
                                      showCondition: {
                                        ...(checklist.showCondition || {}),
                                        fieldName: e.target.value,
                                        isManualField: true,
                                      },
                                    })
                                  }
                                />
                              ) : (
                                <select
                                  className="form-select form-select-sm"
                                  value={checklist.showCondition?.fieldName || ''}
                                  onChange={(e) =>
                                    updateChecklist(type.id, checklist.id, {
                                      showCondition: {
                                        ...(checklist.showCondition || {}),
                                        fieldName: e.target.value,
                                        isManualField: false,
                                      },
                                    })
                                  }
                                  disabled={!hasFieldOptions}
                                >
                                  <option value="">
                                    {hasFieldOptions ? 'Select Field' : 'No fields loaded'}
                                  </option>
                                  {Array.isArray(formFieldOptions) ? formFieldOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  )) : null}
                                </select>
                              )}
                              <select
                                className="form-select form-select-sm"
                                value={checklist.showCondition?.operator || ''}
                                onChange={(e) =>
                                  updateChecklist(type.id, checklist.id, {
                                    showCondition: {
                                      ...(checklist.showCondition || {}),
                                      operator: e.target.value,
                                    },
                                  })
                                }
                              >
                                <option value="">Operator</option>
                                {OPERATOR_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Value"
                                value={checklist.showCondition?.value || ''}
                                onChange={(e) =>
                                  updateChecklist(type.id, checklist.id, {
                                    showCondition: {
                                      ...(checklist.showCondition || {}),
                                      value: e.target.value,
                                    },
                                  })
                                }
                              />
                            </div>
                          </td>
                          <td>
                            {isManualField ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Field name"
                                value={checklist.showAfter?.fieldName || ''}
                                onChange={(e) =>
                                  updateChecklist(type.id, checklist.id, {
                                    showAfter: {
                                      fieldName: e.target.value,
                                      isManualField: true,
                                    },
                                  })
                                }
                              />
                            ) : (
                              <select
                                className="form-select form-select-sm"
                                value={checklist.showAfter?.fieldName || ''}
                                onChange={(e) =>
                                  updateChecklist(type.id, checklist.id, {
                                    showAfter: {
                                      fieldName: e.target.value,
                                      isManualField: false,
                                    },
                                  })
                                }
                                disabled={!hasFieldOptions}
                              >
                                <option value="">
                                  {hasFieldOptions ? 'Select Field' : 'No fields loaded'}
                                </option>
                                {formFieldOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <Dialog
        header="Assign Checkpoints"
        visible={checkpointDialogOpen}
        onHide={() => setCheckpointDialogOpen(false)}
        style={{ width: '50vw' }}
      >
        <div className="d-flex flex-column gap-2">
          {documentCheckpoints.map((cp: any) => {
            const checked = checkpointSelection.includes(cp.id);
            return (
              <label key={cp.id} className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setCheckpointSelection((prev) => [...prev, cp.id]);
                    } else {
                      setCheckpointSelection((prev) => prev.filter((id) => id !== cp.id));
                    }
                  }}
                />
                <span>{cp.name}</span>
              </label>
            );
          })}
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <Button label="Cancel" severity="secondary" onClick={() => setCheckpointDialogOpen(false)} />
          <Button label="Save" onClick={handleCheckpointSave} />
        </div>
      </Dialog>
      </div>
    </div>
  );
}
