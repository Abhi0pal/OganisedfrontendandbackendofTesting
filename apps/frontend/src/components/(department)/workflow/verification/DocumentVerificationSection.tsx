"use client";

import { Dispatch, SetStateAction } from "react";
import { Button } from "primereact/button";
import { WorkflowDocument, DocumentActionState } from "@/components/(department)/workflow/types";
import { documentStatusOptions } from "@/components/(department)/workflow/documentStatus";

const DocumentVerificationSection = ({
  documents,
  loading,
  docActionState,
  setDocActionState,
  onSave,
  savingDocId,
}: {
  documents: WorkflowDocument[];
  loading: boolean;
  docActionState: Record<number, DocumentActionState>;
  setDocActionState: Dispatch<SetStateAction<Record<number, DocumentActionState>>>;
  onSave: (documentsId: number, status: DocumentActionState["status"], comments: string) => void;
  savingDocId?: number | null;
}) => {
  if (loading) {
    return <div className="text-muted">Loading documents to verify…</div>;
  }

  return (
    <div className="table-responsive">
      {documents.length === 0 ? (
        <div className="text-muted">No documents to verify.</div>
      ) : (
        <table className="table table-sm table-bordered mb-0">
          <thead className="table-light">
            <tr>
              <th className="text-center">Document</th>
              <th className="text-center">Required</th>
              <th className="text-center">Status</th>
              <th className="text-center">Comments</th>
              <th className="text-center">Save</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const baseStatus = ((doc.mappingStatus || doc.documentStatus || "U") as string).toUpperCase();
              const initialState: DocumentActionState = {
                status: baseStatus as DocumentActionState["status"],
                comments: doc.comments || "",
                savedStatus: baseStatus as DocumentActionState["status"],
                savedComments: doc.comments || "",
                locked: false,
              };
              const local = docActionState[doc.documentsId] || initialState;
              const hasChanges =
                local.savedStatus !== local.status || local.savedComments !== local.comments;
              return (
                <tr key={`verify-${doc.documentsId}`}>
                  <td className="text-start align-middle">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="small text-muted text-capitalize">
                        {doc.documentTypeName || doc.checklistDocumentName || "Document"}
                      </span>
                      <span className="small text-muted">
                        Latest: {doc.documentVersion || "—"}
                      </span>
                    </div>
                    <div className="fw-semibold text-start">
                      {doc.checklistDocumentName || doc.fileName || "Document"}
                    </div>
                    <div className="small text-muted text-start">{doc.fileName || "—"}</div>
                  </td>
                  <td className="align-middle">{doc.isMandatory ? "Yes" : "No"}</td>
                  <td className="text-start align-middle" style={{ width: 150 }}>
                    <select
                      className="form-select form-select-sm"
                      value={local.status}
                      onChange={(e) => {
                        const nextStatus = e.target.value as DocumentActionState["status"];
                        setDocActionState((prev) => {
                          const current = prev[doc.documentsId] || initialState;
                          return {
                            ...prev,
                            [doc.documentsId]: {
                              ...current,
                              status: nextStatus,
                              locked: false,
                            },
                          };
                        });
                      }}
                    >
                      {documentStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="align-middle">
                    <input
                      className="form-control form-control-sm"
                      value={local.comments}
                      disabled={!!local.locked}
                      onChange={(e) =>
                        setDocActionState((prev) => {
                          const current = prev[doc.documentsId] || initialState;
                          return {
                            ...prev,
                            [doc.documentsId]: {
                              ...current,
                              comments: e.target.value,
                            },
                          };
                        })
                      }
                    />
                  </td>
                  <td className="align-middle" style={{ width: 110 }}>
                    <Button
                      label="Save"
                      size="small"
                      type="button"
                      onClick={() => onSave(doc.documentsId, local.status, local.comments)}
                      loading={savingDocId === doc.documentsId}
                      disabled={
                        !!local.locked || savingDocId === doc.documentsId || !hasChanges
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DocumentVerificationSection;
