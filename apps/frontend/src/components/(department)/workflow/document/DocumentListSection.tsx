import { WorkflowDocument } from "@/components/(department)/workflow/types";
import { getDocumentStatusLabel } from "@/components/(department)/workflow/documentStatus";

const DocumentListSection = ({
  documents,
  loading,
}: {
  documents: WorkflowDocument[];
  loading: boolean;
}) => {
  return (
    <div className="table-responsive">
      {loading ? (
        <div className="text-muted">Loading documents…</div>
      ) : documents.length === 0 ? (
        <div className="text-muted">No documents uploaded.</div>
      ) : (
        <table className="table table-sm table-bordered mb-0">
          <thead className="table-light">
            <tr>
              <th className="text-center align-middle">#</th>
              <th className="text-center align-middle">Document</th>
              <th className="text-center align-middle">Status</th>
              <th className="text-center align-middle">Submitted On</th>
              <th className="text-center align-middle">File</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => {
              const rawStatus = String(doc.mappingStatus || doc.documentStatus || "U").toUpperCase();
              const statusLabel = getDocumentStatusLabel(rawStatus) || "Unknown";
              return (
                <tr key={doc.documentsId}>
                  <td className="text-center align-middle">{index + 1}</td>
                  <td className="text-start align-middle">
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="small text-muted text-capitalize">
                        {doc.documentTypeName || doc.checklistDocumentName || "Document"}
                      </span>
                    </div>
                    <div className="fw-semibold text-start">
                      {doc.checklistDocumentName || doc.fileName || "Document"}
                      {doc.isMandatory && (
                        <span className="badge bg-warning text-dark ms-2">Required</span>
                      )}
                    </div>
                    <div className="small text-muted text-start">{doc.fileName || "—"}</div>
                  </td>
                  <td className="text-start align-middle">{statusLabel}</td>
                  <td className="text-center align-middle">
                    {doc.createdOn ? new Date(doc.createdOn).toLocaleString() : "—"}
                  </td>
                  <td className="text-center align-middle">
                    {doc.filePath ? (
                      <a href={doc.filePath} className="text-primary" target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
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

export default DocumentListSection;
