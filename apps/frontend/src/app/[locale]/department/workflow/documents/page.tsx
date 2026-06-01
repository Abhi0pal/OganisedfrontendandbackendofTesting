 "use client";

import { useParams } from "next/navigation";

import {
  useOfficerActivityDetail,
  useOfficerDocuments,
} from "@/hooks/department/useOfficerWorkflow";
import DocumentListSection from "@/components/(department)/workflow/document/DocumentListSection";
import WorkflowSectionHeader from "@/components/(department)/workflow/WorkflowSectionHeader";

export default function DepartmentWorkflowDocumentsPage() {
  const params = useParams();
  const submissionId = Number(params?.submissionId);
  const { data: detail } = useOfficerActivityDetail(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const { data: documents = [], isLoading } = useOfficerDocuments(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );

  return (
    <main className="container-fluid px-4 pb-4">
      <WorkflowSectionHeader
        title="Document Pack"
        submissionId={submissionId}
        unitName={detail?.submission?.unitName ?? undefined}
        status={detail?.submission?.status}
        serviceId={detail?.submission?.serviceId}
        description="Uploads and status of all supporting documents."
      />
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <DocumentListSection documents={documents} loading={isLoading} />
        </div>
      </div>
    </main>
  );
}
