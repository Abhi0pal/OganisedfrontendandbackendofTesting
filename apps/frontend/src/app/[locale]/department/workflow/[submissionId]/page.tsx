"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toast } from "primereact/toast";

import {
  useOfficerActivityDetail,
  useOfficerApplicationView,
  useOfficerDocuments,
  useOfficerTimeline,
  useOfficerSubmitAction,
  useOfficerVerifyDocument,
} from "@/hooks/department/useOfficerWorkflow";

import ApplicationViewAccordion from "@/components/(department)/workflow/application-view/ApplicationViewAccordion";
import WorkflowSectionHeader from "@/components/(department)/workflow/WorkflowSectionHeader";
import DocumentListSection from "@/components/(department)/workflow/document/DocumentListSection";
import DocumentVerificationSection from "@/components/(department)/workflow/verification/DocumentVerificationSection";
import TimelineSection from "@/components/(department)/workflow/history/TimelineSection";
import {
  isWorkflowSectionEnabled,
  resolveWorkflowActionComponent,
  WorkflowSectionKey,
} from "@/components/(department)/workflow/formTypeRegistry";
import {
  ShellState,
  WorkflowDocument,
  DocumentActionState,
  TimelineEntry,
  DropdownOption,
} from "@/components/(department)/workflow/types";

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-4 border border-200 shadow-sm bg-white overflow-hidden mb-4">
    <div className="px-4 py-3 bg-light border-bottom">
      <h2 className="h6 fw-semibold mb-0">{title}</h2>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const formatDateTimeValue = (value?: string | number | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

const initialShellState: ShellState = {
  action: "",
  comments: "",
  reasonForDelay: "",
  roleIdsCsv: "",
  userIdsCsv: "",
  supportiveDocument: "",
  blockPayload: {},
  forwardRoleIds: [],
  forwardDestinations: [],
  forwardedDeptIds: [],
  selectedRecipients: [],
};

const normalizeWorkflowFormType = (value?: string | null) => {
  const raw = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const map: Record<string, string> = {
    AF: "APPLICANT_FORM",
    APPLICANT_FORM: "APPLICANT_FORM",
    PF: "PROCESSING_FORM",
    PROCESSING_FORM: "PROCESSING_FORM",
    PV: "PROCESSING_FORM_VERIFIER_LEVEL",
    PFVL: "PROCESSING_FORM_VERIFIER_LEVEL",
    PROCESSING_FORM_VERIFICATION_LEVEL: "PROCESSING_FORM_VERIFIER_LEVEL",
    PROCESSING_FORM_VERIFIER_LEVEL: "PROCESSING_FORM_VERIFIER_LEVEL",
    AL: "APPROVER_LEVEL_PROCESSING_FORM",
    PFAL: "APPROVER_LEVEL_PROCESSING_FORM",
    APPROVER_LEVEL_PROCESSING_FORM: "APPROVER_LEVEL_PROCESSING_FORM",
  };
  return map[raw] || raw;
};

const normalizeActionCode = (action: string) => {
  const raw = String(action || "").trim().toUpperCase();
  const map: Record<string, string> = {
    FORWARD: "F",
    F: "F",
    FORWARD_TO_APPROVER: "FA",
    FA: "FA",
    REVERT_TO_INVESTOR: "RBI",
    RBI: "RBI",
    APPROVE: "A",
    A: "A",
    REJECT: "R",
    R: "R",
    PENDING: "P",
    P: "P",
    HOLD: "H",
    H: "H",
  };
  return map[raw] || raw;
};

export default function DepartmentWorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const submissionId = Number(params?.submissionId);

  if (!Number.isFinite(submissionId) || submissionId <= 0) {
    return (
      <main className="container-fluid px-4 pb-4">
        <div className="alert alert-warning">Invalid submission ID.</div>
      </main>
    );
  }

  const [shellState, setShellState] = useState<ShellState>(initialShellState);
  const [docActionState, setDocActionState] = useState<Record<number, DocumentActionState>>({});
  const [savingDocId, setSavingDocId] = useState<number | null>(null);

  const { data: detail } = useOfficerActivityDetail(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const { data: applicationView, isLoading: loadingApplicationView } = useOfficerApplicationView(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const serviceId = applicationView?.serviceId;

  const { data: documents = [], isLoading: loadingDocuments } = useOfficerDocuments(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined,
    serviceId
  );
  const { data: timeline = [], isLoading: loadingTimeline } = useOfficerTimeline(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );

  const submitMutation = useOfficerSubmitAction();
  const verifyDocMutation = useOfficerVerifyDocument();

  const activeStepConfig = detail?.currentStepConfig;
  // Compute pendingMandatoryDocuments first
  // ...existing code...

  const allowedActions = useMemo<DropdownOption[]>(
    () => {
      const rawActions =
        activeStepConfig?.actionAllowedJson ||
        activeStepConfig?.action_allowed_json ||
        [];
      const normalized = rawActions
        .map((code: string) => normalizeActionCode(code))
        .filter((code: string) => !!code);
      const unique = Array.from(new Set(normalized));
      return unique.map((code: string) => ({
        label: code,
        value: code,
      }));
    },
    [activeStepConfig]
  );
  const formTypeLabel = useMemo(
    () => activeStepConfig?.formType || activeStepConfig?.form_type || undefined,
    [activeStepConfig]
  );
  const ActionComponent = useMemo(
    () => resolveWorkflowActionComponent(activeStepConfig?.formTypeId),
    [activeStepConfig?.formTypeId]
  );

  const isSectionVisible = (key: WorkflowSectionKey) =>
    isWorkflowSectionEnabled(key, detail?.workflow?.uiSections);
  const showApplicationSection = isSectionVisible("APPLICATION_VIEW");
  const showDocumentSection = isSectionVisible("DOCUMENTS_VIEW");
  const showTimelineSection = isSectionVisible("TIMELINE_VIEW");
  const showDocumentVerificationSection =
    isSectionVisible("DOCUMENT_VERIFICATION") || showDocumentSection;
  const showActionsSection = isSectionVisible("ACTIONABLE_ITEMS");
  const workflowDetails = detail?.workflow;
  const pendingAssignments = detail?.pendingAssignments || [];
  const assignableGroups = detail?.assignableByRole || [];
  const actionAccessAllowed = detail?.actionAccess?.allowed !== false;
  const actionAccessMessage = detail?.actionAccess?.message || "";
  const workflowActionSummary =
    workflowDetails?.actionAllowedJson?.length
      ? workflowDetails.actionAllowedJson.join(", ")
      : "—";

  const canonicalFormType = normalizeWorkflowFormType(
    activeStepConfig?.formType || activeStepConfig?.form_type
  );
  // BUSINESS RULE: fallback legacy PROCESSING_FORM to verifier behavior for nodal step 2 role 7.
  const isVerifierProcessingStep =
    canonicalFormType === "PROCESSING_FORM_VERIFIER_LEVEL" ||
    (canonicalFormType === "PROCESSING_FORM" &&
      Number(detail?.currentStep || detail?.workflow?.step || 0) === 2 &&
      Number(detail?.currentRoleId || detail?.workflow?.roleId || 0) === 7);
  const isDocumentVerificationStep =
    String(
      activeStepConfig?.subResponsibility ||
        activeStepConfig?.sub_responsibility ||
        detail?.workflow?.subformActionName ||
        ""
    )
      .trim()
      .toUpperCase() === "DOCUMENT_VERIFICATION";
  const pendingMandatoryDocuments = isVerifierProcessingStep && isDocumentVerificationStep
    ? documents.some((doc) => {
        if (!doc.isMandatory) return false;
        const status = String(doc.mappingStatus || doc.documentStatus || "U").toUpperCase();
        return status !== "V";
      })
    : false;
  const documentGuardHelperText = pendingMandatoryDocuments
    ? "Please verify all required documents before forwarding."
    : undefined;
  // (disabledActions is now only declared above, not here)

  const handleVerifyDocument = async (
    documentsId: number,
    status: DocumentActionState["status"],
    comments: string
  ) => {
    if (!detail?.submission?.submissionId) return;
    setSavingDocId(documentsId);
    try {
      await verifyDocMutation.mutateAsync({
        submissionId: detail.submission.submissionId,
        documentsId,
        status,
        comments: comments || "",
        isDraft: "0",
        serviceId: detail.submission.serviceId,
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
        summary: "Document Saved",
        detail: "Document verification updated.",
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Failed to save document verification",
      });
    } finally {
      setSavingDocId((current) => (current === documentsId ? null : current));
    }
  };

  const parseCsvNumbers = (value: string) =>
    value
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => Number.isFinite(x) && x > 0);

  const buildForwardDestinations = () => {
    const explicit = (shellState.forwardDestinations || [])
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    if (explicit.length) return Array.from(new Set(explicit));

    const fromSelectedRecipients = (shellState.selectedRecipients || [])
      .map((item) => {
        const roleId = Number(item?.nextRoleId);
        const deptId = Number(item?.forwardedDeptId);
        if (!Number.isFinite(roleId) || roleId <= 0) return null;
        if (!Number.isFinite(deptId) || deptId <= 0) return null;
        return `${roleId}-${deptId}`;
      })
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(fromSelectedRecipients));
  };

  const handleSubmitAction = async () => {
    if (!detail?.submission?.submissionId) return;
    if (!shellState.action) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Please select an action",
      });
      return;
    }

    const normalizedAction = normalizeActionCode(shellState.action || "");
    const isForwardAction = normalizedAction === "F";
    const isDepartmentForward =
      isForwardAction && (shellState.forwardedDeptIds?.length || 0) > 0;
    const dashboardRoute = "/department/dashboard";

    try {
      await submitMutation.mutateAsync({
        submissionId: detail.submission.submissionId,
        // Submit against the resolved current step from workflow instance.
        step: detail.currentStep || detail?.workflow?.step,
        serviceId: detail.submission.serviceId,
        processingLevel: detail.submission.processingLevel,
        action: normalizedAction as any,
        comments: shellState.comments,
        reasonForDelay: shellState.reasonForDelay || undefined,
        supportiveDocument: shellState.supportiveDocument || undefined,
        nextRoleIds:
      isForwardAction
            ? shellState.forwardRoleIds.length
              ? shellState.forwardRoleIds
              : parseCsvNumbers(shellState.roleIdsCsv)
            : undefined,
        nextUserIds: isForwardAction ? parseCsvNumbers(shellState.userIdsCsv) : undefined,
        selectedRecipients:
          isForwardAction && shellState.selectedRecipients.length
            ? shellState.selectedRecipients
            : undefined,
        forwardedDeptIds:
          isForwardAction
            ? shellState.forwardedDeptIds
            : undefined,
        forwardedDistId:
          isForwardAction
            ? detail?.submission?.districtId
            : undefined,
        blockPayload: {
          ...(shellState.blockPayload || {}),
          forwardDestinations: buildForwardDestinations(),
        },
      });
      setShellState(initialShellState);
      if (isDepartmentForward) {
        router.push(`${dashboardRoute}?wfToast=forwardedDepartments`);
      } else {
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Action submitted successfully.",
        });
        router.push(`${dashboardRoute}?wfToast=actionSubmitted`);
      }
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Failed to submit action",
      });
    }
  };

  const applicationDetails = detail?.submission;

  return (
    <main className="container-fluid px-4 pb-4" style={{ backgroundColor: '#f4f6fb' }}>
      <Toast ref={toastRef} />
      <WorkflowSectionHeader
        title={
          applicationView?.unitName ||
          applicationView?.companyName ||
          applicationDetails?.unitName ||
          "Application Details"
        }
        submissionId={submissionId}
        unitName={applicationDetails?.unitName ?? undefined}
        status={applicationDetails?.status}
        serviceId={applicationView?.serviceId || applicationDetails?.serviceId}
        description="Complete view of the in-principle application."
      />

        <section className="mb-4">
          <SectionCard title="Application Details">
            {loadingApplicationView && !applicationView ? (
              <div className="text-muted">Loading application details…</div>
            ) : showApplicationSection ? (
              applicationView ? (
                <ApplicationViewAccordion
                  draft={{
                    submissionId: applicationView.submissionId,
                    status: applicationView.status,
                    serviceId: applicationView.serviceId,
                    ubuId: applicationView.ubuId,
                    submittedOn: applicationView.submittedOn,
                    applicationCreatedDate: applicationView.applicationCreatedDate,
                    applicationUpdatedDateTime: applicationView.applicationUpdatedDateTime,
                    unitName: applicationView.unitName ?? undefined,
                  }}
                  formData={applicationView.formData || {}}
                />
              ) : (
                <div className="text-muted">Application snapshot not available.</div>
              )
            ) : (
              <div className="text-muted">
                Application details are not enabled for your current workflow step.
              </div>
            )}
          </SectionCard>
        </section>

        <section className="mb-4">
          <SectionCard title="Documents">
            {showDocumentSection ? (
              <DocumentListSection documents={documents} loading={loadingDocuments} />
            ) : (
              <div className="text-muted">
                Document library is not configured for this workflow step.
              </div>
            )}
          </SectionCard>
        </section>

        <section className="mb-4">
          <SectionCard title="Transaction History">
            {showTimelineSection ? (
              <TimelineSection timeline={timeline} loading={loadingTimeline} />
            ) : (
              <div className="text-muted">
                Timeline is not exposed for this workflow configuration.
              </div>
            )}
          </SectionCard>
        </section>

        <section className="mb-4">
          <SectionCard title="Document Verification">
            {showDocumentVerificationSection ? (
              <DocumentVerificationSection
                documents={documents}
                loading={loadingDocuments}
                docActionState={docActionState}
                setDocActionState={setDocActionState}
                onSave={handleVerifyDocument}
                savingDocId={savingDocId}
              />
            ) : (
              <div className="text-muted">
                Document verification is not required for this workflow step.
              </div>
            )}
          </SectionCard>
        </section>

        <section className="mb-4">
          <SectionCard title="Actions">
            {showActionsSection ? (
            <ActionComponent
              shellState={shellState}
              setShellState={setShellState}
              allowedActions={actionAccessAllowed ? (allowedActions as DropdownOption[]) : []}
              onSubmit={handleSubmitAction}
              onReset={() => setShellState(initialShellState)}
              submitLoading={submitMutation.isPending}
              helperText={
                actionAccessAllowed
                  ? documentGuardHelperText
                  : actionAccessMessage || "Application is currently pending with another role."
              }
              reasonRequired={
                activeStepConfig?.slaBreachRequiresReason ??
                activeStepConfig?.sla_breach_requires_reason ??
                detail?.workflow?.slaBreachRequiresReason
              }
              transitionMap={
                activeStepConfig?.transitionMapJson ||
                activeStepConfig?.transition_map_json ||
                (detail?.workflow?.transitionMapJson as any)
              }
              formType={formTypeLabel}
              subformActionName={
                activeStepConfig?.subResponsibility ||
                activeStepConfig?.sub_responsibility ||
                detail?.workflow?.subformActionName
              }
              assignmentRule={
                activeStepConfig?.assignmentRuleJson ||
                activeStepConfig?.assignment_rule_json ||
                detail?.workflow?.assignmentRuleJson
              }
              assignableByRole={detail?.assignableByRole}
              submissionId={detail?.submission?.submissionId}
              workflowStep={detail?.currentStep || detail?.workflow?.step}
              workflowJurisdictionLevel={
                activeStepConfig?.jurisdictionLevel ||
                activeStepConfig?.jurisdiction_level ||
                detail?.workflow?.jurisdictionLevel
              }
              districtId={detail?.submission?.districtId}
            />
            ) : (
              <div className="text-muted">
                Workflow actions are not available for this step.
              </div>
            )}
          </SectionCard>
        </section>
    </main>
  );
}

