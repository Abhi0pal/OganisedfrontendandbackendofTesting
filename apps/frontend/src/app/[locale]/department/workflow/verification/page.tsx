 "use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Toast } from "primereact/toast";

import {
  useOfficerActivityDetail,
  useOfficerDocuments,
  useOfficerVerifyDocument,
} from "@/hooks/department/useOfficerWorkflow";
import DocumentVerificationSection from "@/components/(department)/workflow/verification/DocumentVerificationSection";
import WorkflowSectionHeader from "@/components/(department)/workflow/WorkflowSectionHeader";
import { DocumentActionState } from "@/components/(department)/workflow/types";

export default function DepartmentWorkflowVerificationPage() {
  const params = useParams();
  const toastRef = useRef<Toast>(null);
  const submissionId = Number(params?.submissionId);
  const [docActionState, setDocActionState] = useState<Record<number, DocumentActionState>>({});
  const [savingDocId, setSavingDocId] = useState<number | null>(null);

  const { data: detail } = useOfficerActivityDetail(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const serviceId = detail?.submission?.serviceId;

  const { data: documents = [], isLoading } = useOfficerDocuments(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined,
    serviceId
  );
  const verifyDocMutation = useOfficerVerifyDocument();
  const handleVerifyDocument = async (
    documentsId: number,
    status: DocumentActionState["status"],
    comments: string
  ) => {
    setSavingDocId(documentsId);
    try {
      await verifyDocMutation.mutateAsync({
        submissionId,
        documentsId,
        status,
        comments: comments || "",
        isDraft: "0",
        serviceId,
      });
      setDocActionState((prev) => ({
        ...prev,
        [documentsId]: {
          status,
          comments,
          savedStatus: status,
          savedComments: comments,
          locked: true,
        },
      }));
      toastRef.current?.show({
        severity: "success",
        summary: "Document saved",
        detail: "Verification updated.",
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Unable to save",
        detail: err?.response?.data?.message || "Failed to save document verification.",
      });
    } finally {
      setSavingDocId((current) => (current === documentsId ? null : current));
    }
  };

  return (
    <main className="container-fluid px-4 pb-4">
      <Toast ref={toastRef} />
      <WorkflowSectionHeader
        title="Document Verification"
        submissionId={submissionId}
        unitName={detail?.submission?.unitName ?? undefined}
        status={detail?.submission?.status}
        serviceId={detail?.submission?.serviceId}
        description="Verify all required documents here."
      />
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <DocumentVerificationSection
            documents={documents}
            loading={isLoading}
            docActionState={docActionState}
            setDocActionState={setDocActionState}
            onSave={handleVerifyDocument}
            savingDocId={savingDocId}
          />
        </div>
      </div>
    </main>
  );
}
