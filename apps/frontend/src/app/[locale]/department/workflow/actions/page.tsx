 "use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Toast } from "primereact/toast";

import {
  useOfficerActivityDetail,
  useOfficerSubmitAction,
} from "@/hooks/department/useOfficerWorkflow";
import ActionShell from "@/components/(department)/workflow/actions/ActionShell";
import WorkflowSectionHeader, {
  WorkflowSectionHeaderLink,
} from "@/components/(department)/workflow/WorkflowSectionHeader";
import { ShellState, DropdownOption } from "@/components/(department)/workflow/types";

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

export default function DepartmentWorkflowActionsPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const submissionId = Number(params?.submissionId);
  const { data: detail } = useOfficerActivityDetail(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );
  const sectionLinks: WorkflowSectionHeaderLink[] = useMemo(
    () => [
      { label: "Overview", href: `/department/workflow/${submissionId}` },
      { label: "Documents", href: `/department/workflow/${submissionId}/documents` },
      { label: "History", href: `/department/workflow/${submissionId}/history` },
      { label: "Verification", href: `/department/workflow/${submissionId}/verification` },
    ],
    [submissionId]
  );
  const submitMutation = useOfficerSubmitAction();
  const [shellState, setShellState] = useState<ShellState>(initialShellState);
  const activeStepConfig = detail?.currentStepConfig;
  const actionAccessAllowed = detail?.actionAccess?.allowed !== false;
  const actionAccessMessage = detail?.actionAccess?.message || "";

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

  const handleSubmit = async () => {
    if (!detail?.submission?.submissionId) return;
    if (!shellState.action) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Select an action before submitting.",
      });
      return;
    }
    const normalizedAction = normalizeActionCode(shellState.action || "");
    const isForwardAction = normalizedAction === "F";
    await submitMutation.mutateAsync({
      submissionId: detail.submission.submissionId,
      step: detail.currentStep || detail?.workflow?.step,
      serviceId: detail.submission.serviceId,
      processingLevel: detail.submission.processingLevel,
      action: normalizedAction as any,
      comments: shellState.comments,
      reasonForDelay: shellState.reasonForDelay || undefined,
      supportiveDocument: shellState.supportiveDocument || undefined,
      nextRoleIds: isForwardAction
        ? shellState.roleIdsCsv
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((x) => Number.isFinite(x) && x > 0)
        : undefined,
      nextUserIds: isForwardAction
        ? shellState.userIdsCsv
            .split(",")
            .map((x) => Number(x.trim()))
            .filter((x) => Number.isFinite(x) && x > 0)
        : undefined,
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
      blockPayload: shellState.blockPayload || {},
    });
    toastRef.current?.show({
      severity: "success",
      summary: "Success",
      detail: "Action submitted.",
    });
    setShellState(initialShellState);
    router.push("/department/dashboard");
  };

  return (
    <main className="container-fluid px-4 pb-4">
      <Toast ref={toastRef} />
      <WorkflowSectionHeader
        title="Action Shell"
        submissionId={submissionId}
        unitName={detail?.submission?.unitName ?? undefined}
        status={detail?.submission?.status}
        serviceId={detail?.submission?.serviceId}
        description="Submit workflow actions and comments."
        navLinks={[...sectionLinks, { label: "Actions", href: `/department/workflow/${submissionId}/actions`, variant: "primary" }]}
      />
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <ActionShell
            shellState={shellState}
            setShellState={setShellState}
            allowedActions={actionAccessAllowed ? allowedActions : []}
            onSubmit={handleSubmit}
            onReset={() => setShellState(initialShellState)}
            submitLoading={submitMutation.isPending}
            helperText={actionAccessAllowed ? undefined : actionAccessMessage}
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
            formType={activeStepConfig?.formType || activeStepConfig?.form_type}
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
        </div>
      </div>
    </main>
  );
}
