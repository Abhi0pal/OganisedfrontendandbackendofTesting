'use client';

import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import apiClient from '@/lib/api-client';
import {
  OfficerSubmitActionPayload,
  useOfficerActivities,
  useOfficerApplicationView,
  useOfficerActivityDetail,
  useOfficerDocuments,
  useOfficerSubmitAction,
  useOfficerTimeline,
  useOfficerVerifyDocument,
} from '@/hooks/department/useOfficerWorkflow';

type ShellState = {
  action: string;
  comments: string;
  reasonForDelay: string;
  roleIdsCsv: string;
  userIdsCsv: string;
  supportiveDocument: string;
  blockPayload: Record<string, any>;
};

const initialState: ShellState = {
  action: '',
  comments: '',
  reasonForDelay: '',
  roleIdsCsv: '',
  userIdsCsv: '',
  supportiveDocument: '',
  blockPayload: {},
};

type BlockContext = {
  detail: any;
  state: ShellState;
  setState: Dispatch<SetStateAction<ShellState>>;
};

type BlockDef = {
  key: string;
  shouldRender: (ctx: BlockContext) => boolean;
  render: (ctx: BlockContext) => React.ReactNode;
};

const commentsBlock: BlockDef = {
  key: 'comments',
  shouldRender: () => true,
  render: ({ state, setState }) => (
    <div className="mb-3">
      <label className="form-label fw-semibold">Comments</label>
      <InputTextarea
        rows={4}
        value={state.comments}
        onChange={(e) => setState((prev) => ({ ...prev, comments: e.target.value }))}
        className="w-100 border"
      />
    </div>
  ),
};

const documentBlock: BlockDef = {
  key: 'support-doc',
  shouldRender: () => true,
  render: ({ state, setState }) => (
    <div className="mb-3">
      <label className="form-label fw-semibold">Support Document (optional)</label>
      <div className="d-flex gap-2">
        <input
          type="file"
          className="form-control"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const form = new FormData();
            form.append('file', file);
            const res = await apiClient.post('/investor/inprinciple/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            setState((prev) => ({ ...prev, supportiveDocument: res?.data?.filePath || '' }));
          }}
        />
        {state.supportiveDocument ? (
          <span className="small text-success align-self-center">Uploaded</span>
        ) : null}
      </div>
    </div>
  ),
};

const forwardBlock: BlockDef = {
  key: 'forward',
  shouldRender: ({ state }) => state.action === 'FORWARD',
  render: ({ detail, state, setState }) => (
    <div className="mb-3 border rounded p-3 bg-light">
      <div className="fw-semibold mb-2">Forward To Multiple</div>
      <div className="small text-muted mb-2">
        Use comma-separated Role IDs and/or User IDs. Users by role mapping is shown below. This stays within the current department routing rules.
      </div>
      <div className="row g-2">
        <div className="col-md-6">
          <label className="form-label">Role IDs</label>
          <input
            className="form-control"
            value={state.roleIdsCsv}
            onChange={(e) => setState((prev) => ({ ...prev, roleIdsCsv: e.target.value }))}
            placeholder="e.g. 7,33,114"
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">User IDs</label>
          <input
            className="form-control"
            value={state.userIdsCsv}
            onChange={(e) => setState((prev) => ({ ...prev, userIdsCsv: e.target.value }))}
            placeholder="e.g. 1001,1005"
          />
        </div>
      </div>
      <div className="mt-3">
        {(detail?.assignableByRole || []).map((x: any) => (
          <div key={x.roleId} className="mb-2">
            <div className="fw-semibold">Role {x.roleId}</div>
            <div className="small text-muted">
              {(x.users || []).map((u: any) => `${u.fullName} (${u.userId})`).join(', ') || 'No mapped users'}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

const blocks: BlockDef[] = [commentsBlock, documentBlock, forwardBlock];

export default function OfficerWorkflowBoard() {
  const toastRef = useRef<Toast>(null);
  const { data: activities = [], isLoading } = useOfficerActivities();
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const { data: detail, isLoading: loadingDetail } = useOfficerActivityDetail(
    selectedSubmissionId || undefined
  );
  const { data: applicationView } = useOfficerApplicationView(selectedSubmissionId || undefined);
  const { data: documents = [] } = useOfficerDocuments(selectedSubmissionId || undefined);
  const hasPendingMandatoryDocuments = useMemo(
    () => (documents || []).some((doc: any) => doc.isMandatory && doc.documentStatus !== "V"),
    [documents]
  );
  const { data: timeline = [] } = useOfficerTimeline(selectedSubmissionId || undefined);
  const submitMutation = useOfficerSubmitAction();
  const verifyDocMutation = useOfficerVerifyDocument();
  const [state, setState] = useState<ShellState>(initialState);
  const [activeTab, setActiveTab] = useState<'APPLICATION_VIEW' | 'DOCUMENTS_VIEW' | 'TIMELINE_VIEW' | 'ACTIONABLE_ITEMS'>(
    'ACTIONABLE_ITEMS'
  );
  const [docActionState, setDocActionState] = useState<Record<number, { status: 'V' | 'U' | 'R' | 'M'; comments: string }>>({});

  const allowedActions = useMemo(
    () =>
      (detail?.workflow?.actionAllowedJson || []).map((a: string) => ({
        label: a,
        value: a,
      })),
    [detail]
  );

  const activeBlocks = useMemo(
    () =>
      blocks.filter((block) =>
        block.shouldRender({
          detail,
          state,
          setState,
        })
      ),
    [detail, state]
  );

  const uiSections = useMemo(
    () =>
      ((detail?.workflow as any)?.uiSections as string[]) || [
        'APPLICATION_VIEW',
        'DOCUMENTS_VIEW',
        'TIMELINE_VIEW',
        'ACTIONABLE_ITEMS',
      ],
    [detail]
  );

  const availableTabs = useMemo(
    () =>
      ([
        ['APPLICATION_VIEW', 'Application'],
        ['DOCUMENTS_VIEW', 'Documents'],
        ['TIMELINE_VIEW', 'Timeline'],
        ['ACTIONABLE_ITEMS', 'Actionable Items'],
      ] as const).filter(([key]) => uiSections.includes(key)),
    [uiSections]
  );

  const parseCsvNumbers = (value: string) =>
    value
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

  const handleSubmit = async () => {
    if (!detail?.submission?.submissionId) return;
    if (!state.action) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Required',
        detail: 'Please select an action',
      });
      return;
    }

    if (
      hasPendingMandatoryDocuments &&
      ["FORWARD", "FORWARD_TO_APPROVER"].includes(state.action)
    ) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Verify Documents",
        detail: "All mandatory documents must be verified before forwarding.",
      });
      return;
    }

    const payload: OfficerSubmitActionPayload = {
      submissionId: detail.submission.submissionId,
      serviceId: detail.submission.serviceId,
      processingLevel: detail.submission.processingLevel,
      action: state.action as OfficerSubmitActionPayload['action'],
      comments: state.comments,
      reasonForDelay: state.reasonForDelay || undefined,
      supportiveDocument: state.supportiveDocument || undefined,
      nextRoleIds: state.action === 'FORWARD' ? parseCsvNumbers(state.roleIdsCsv) : undefined,
      nextUserIds: state.action === 'FORWARD' ? parseCsvNumbers(state.userIdsCsv) : undefined,
      blockPayload: state.blockPayload || {},
    };

    try {
      await submitMutation.mutateAsync(payload);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Action submitted successfully',
      });
      setState(initialState);
    } catch (err: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: err?.response?.data?.message || 'Failed to submit action',
      });
    }
  };

  return (
    <div className="row g-3">
      <Toast ref={toastRef} />
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold">Assigned Activities</div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {!isLoading && activities.length === 0 && (
                <div className="p-3 text-muted">No pending activities.</div>
              )}
              {activities.map((item) => (
                <button
                  type="button"
                  key={item.submissionId}
                  className={`list-group-item list-group-item-action ${
                    selectedSubmissionId === item.submissionId ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSelectedSubmissionId(item.submissionId);
                    setDocActionState({});
                    setActiveTab(uiSections.includes('ACTIONABLE_ITEMS') ? 'ACTIONABLE_ITEMS' : 'APPLICATION_VIEW');
                  }}
                >
                  <div className="fw-semibold">{item.unitName}</div>
                  <div className="small">{item.serviceName}</div>
                  <div className="small opacity-75">Submission #{item.submissionId}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white fw-semibold">Action Shell</div>
          <div className="card-body">
            {!selectedSubmissionId && <div className="text-muted">Select an activity to proceed.</div>}
            {selectedSubmissionId && loadingDetail && (
              <div className="text-muted">Loading activity details...</div>
            )}
            {selectedSubmissionId && detail && (
              <>
                <div className="mb-3 d-flex flex-wrap gap-2">
                  {availableTabs.map(([key, label]) => (
                    <Button
                      key={key}
                      label={label}
                      size="small"
                      severity={(activeTab === key ? 'primary' : 'secondary') as any}
                      outlined={activeTab !== key}
                      onClick={() => setActiveTab(key)}
                    />
                  ))}
                </div>

                {activeTab === 'APPLICATION_VIEW' && (
                  <div className="mb-3 border rounded p-3 bg-light">
                    <div className="fw-semibold mb-2">Application View</div>
                    <div className="small mb-2">Submission #{detail.submission.submissionId}</div>
                    <pre className="mb-0 small" style={{ maxHeight: 360, overflow: 'auto' }}>
                      {JSON.stringify(applicationView?.formData || {}, null, 2)}
                    </pre>
                  </div>
                )}

                {activeTab === 'DOCUMENTS_VIEW' && (
                  <div className="mb-3 border rounded p-3 bg-light">
                    <div className="fw-semibold mb-2">Documents View</div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Document</th>
                            <th>Status</th>
                            <th>Comments</th>
                            <th>Verify</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                No documents found.
                              </td>
                            </tr>
                          )}
                          {documents.map((doc: any) => {
                            const local = docActionState[doc.documentsId] || {
                              status: (doc.mappingStatus || 'U') as 'V' | 'U' | 'R' | 'M',
                              comments: '',
                            };
                            return (
                              <tr key={doc.documentsId}>
                                <td>
                                  <div className="fw-semibold">{doc.checklistDocumentName}</div>
                                  <div className="small text-muted">{doc.fileName}</div>
                                  {doc.isMandatory ? (
                                    <span className="badge bg-danger rounded-pill mt-1">Required</span>
                                  ) : (
                                    <span className="badge bg-secondary rounded-pill mt-1">Optional</span>
                                  )}
                                </td>
                                <td style={{ width: 140 }}>
                                  <select
                                    className="form-select form-select-sm"
                                    value={local.status}
                                    onChange={(e) =>
                                      setDocActionState((prev) => ({
                                        ...prev,
                                        [doc.documentsId]: {
                                          ...local,
                                          status: e.target.value as 'V' | 'U' | 'R' | 'M',
                                        },
                                      }))
                                    }
                                  >
                                    <option value="U">U</option>
                                    <option value="V">V</option>
                                    <option value="R">R</option>
                                    <option value="M">M</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    className="form-control form-control-sm"
                                    value={local.comments}
                                    onChange={(e) =>
                                      setDocActionState((prev) => ({
                                        ...prev,
                                        [doc.documentsId]: {
                                          ...local,
                                          comments: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </td>
                                <td style={{ width: 140 }}>
                                  <Button
                                    label="Save"
                                    size="small"
                                    onClick={async () => {
                                      try {
                                        await verifyDocMutation.mutateAsync({
                                          submissionId: detail.submission.submissionId,
                                          documentsId: Number(doc.documentsId),
                                          status: local.status,
                                          comments: local.comments || '',
                                          isDraft: '0',
                                          serviceId: detail.submission.serviceId,
                                        });
                                        toastRef.current?.show({
                                          severity: 'success',
                                          summary: 'Saved',
                                          detail: 'Document verification updated',
                                        });
                                      } catch (err: any) {
                                        toastRef.current?.show({
                                          severity: 'error',
                                          summary: 'Error',
                                          detail: err?.response?.data?.message || 'Failed to save document status',
                                        });
                                      }
                                    }}
                                    loading={verifyDocMutation.isPending}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'TIMELINE_VIEW' && (
                  <div className="mb-3 border rounded p-3 bg-light">
                    <div className="fw-semibold mb-2">Timeline View</div>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Status</th>
                            <th>Action By</th>
                            <th>Action On</th>
                            <th>Comments</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeline.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center text-muted">
                                No timeline entries.
                              </td>
                            </tr>
                          )}
                          {timeline.map((x: any) => (
                            <tr key={x.id}>
                              <td>{x.sequence}</td>
                              <td>{x.status}</td>
                              <td>{x.actionBy}</td>
                              <td>{x.actionOn ? new Date(x.actionOn).toLocaleString() : ''}</td>
                              <td>{x.comments}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === 'ACTIONABLE_ITEMS' && (
                  <>
                <div className="mb-3">
                  <div className="small text-muted">Service</div>
                  <div className="fw-semibold">{detail.submission.serviceId}</div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Action</label>
                  <Dropdown
                    value={state.action || undefined}
                    options={allowedActions}
                    onChange={(e) => setState((prev) => ({ ...prev, action: e.value || '' }))}
                    className="w-100 border"
                    placeholder="Select Action"
                  />
                </div>

                {activeBlocks.map((block) => (
                  <div key={block.key}>
                    {block.render({
                      detail,
                      state,
                      setState,
                    })}
                  </div>
                ))}

                <div className="d-flex gap-2">
                  <Button
                    label="Submit Action"
                    icon="pi pi-check"
                    onClick={handleSubmit}
                    loading={submitMutation.isPending}
                  />
                  <Button
                    label="Reset"
                    icon="pi pi-refresh"
                    severity="secondary"
                    outlined
                    onClick={() => setState(initialState)}
                  />
                </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
