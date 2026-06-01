import { useMemo, useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { Card } from "primereact/card";
import apiClient from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { InputNumber } from "primereact/inputnumber";

interface Props {
  applicationId: number;
  adminViewConfig: any;
  workflowConfig: any;
  currentRoleId: string;
  loggedInUserId: string;
  formData: any;
  refreshPage: () => void;
}
export enum ApplicationStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  PAYMENT = "PAYMENT",
  PAYMENT_DONE = "PAYMENT_DONE",
  FORWARDED = "FORWARDED",
  FORWARDED_DISTRICT = "FORWARDED_DISTRICT",
  FORWARDED_DEPARTMENT = "FORWARDED_DEPARTMENT",
  RAISE_QUERY = "RAISE_QUERY",
  REVERTED = "REVERTED",
  REVERT_BACK = "REVERT_BACK",
  APPROVED = "APPROVED",
  CONDITIONALLY_APPROVE = "CONDITIONALLY_APPROVE",
  REJECTED = "REJECTED",
  FORWARDED_TO_SLEC = "FORWARDED_TO_SLEC",
  FORWARD_FOR_DISBURSEMENT = "FORWARD_FOR_DISBURSEMENT",
  DISBURSED = "DISBURSED",
  ARCHIVED = "ARCHIVED",
}
// 👇 Define which direction each action should move the workflow
type RouteDirective = "NEXT" | "PREV" | "NONE";
type Action =
  | "reject"
  | "revert_applicant"
  | "revert_back"
  | "approve"
  | "conditionally_approve"
  | "forward"
  | "forward_next"
  | "forward_district"
  | "forward_department"
  | "forward_to_slec"
  | "forward_for_disbursement"
  | "raise_query"
  | "payment"
  | "payment_done"
  | "disburse"
  | "archive"
  | "submit"
  | "draft";

const ACTION_ROUTE_RULES: Record<Action, RouteDirective> = {
  // Happy paths move forward
  approve: "NEXT",
  conditionally_approve: "NEXT",
  forward: "NEXT",
  forward_next: "NEXT",
  forward_district: "NEXT",
  forward_department: "NEXT",
  forward_to_slec: "NEXT",
  forward_for_disbursement: "NEXT",

  payment: "NEXT",
  payment_done: "NEXT",
  disburse: "NEXT",

  // Bounce back
  revert_applicant: "PREV",
  revert_back: "PREV",
  raise_query: "PREV", // tweak to your preference

  // Terminal / no next inbox to create
  reject: "NONE",
  archive: "NONE",

  // Entry states (not used here, but typed)
  submit: "NONE",
  draft: "NONE",
};
/* ----------------------------------------
   🔹 Condition Evaluator
----------------------------------------- */
type RuleNode = {
  type: "rule";
  field_code: string;
  operator: string;
  value?: any;
};

type GroupNode = {
  type: "group";
  operator?: "AND" | "OR";
  children: Array<RuleNode | GroupNode>;
};

type ConditionNode = RuleNode | GroupNode;

const evaluateCondition = (
  condition: ConditionNode | undefined,
  formValues: Record<string, any>,
): boolean => {
  if (!condition) return true;

  // -----------------------
  // RULE NODE
  // -----------------------
  if (condition.type === "rule") {
    const fieldValue = formValues?.[condition.field_code];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return fieldValue == conditionValue;

      case "not_equals":
        return fieldValue != conditionValue;

      case "in":
        return Array.isArray(conditionValue)
          ? conditionValue.includes(fieldValue)
          : false;

      case "not_in":
        return Array.isArray(conditionValue)
          ? !conditionValue.includes(fieldValue)
          : false;

      case "greater_than":
        return Number(fieldValue) > Number(conditionValue);

      case "less_than":
        return Number(fieldValue) < Number(conditionValue);

      case "contains":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.includes(conditionValue)
          : false;

      case "is_empty":
        return (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === "" ||
          (typeof fieldValue === "string" && fieldValue.trim() === "")
        );

      case "is_not_empty":
        return !(
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === "" ||
          (typeof fieldValue === "string" && fieldValue.trim() === "")
        );

      default:
        return true;
    }
  }

  // -----------------------
  // GROUP NODE (Recursive)
  // -----------------------
  if (condition.type === "group") {
    const { children = [], operator = "AND" } = condition;

    if (!Array.isArray(children) || children.length === 0) {
      return true;
    }

    const results = children.map((child) =>
      evaluateCondition(child, formValues),
    );

    if (operator === "OR") {
      return results.some(Boolean);
    }

    // Default AND
    return results.every(Boolean);
  }

  return true;
};
function findPreviousRoleId(
  workflowConfig: any,
  currentStage: any,
): number | null {
  if (!workflowConfig?.stages?.length || !currentStage?.current_role)
    return null;

  const currentRoleId = Number(currentStage.current_role);

  // Find a stage that lists the current role as its next
  const prevStage = workflowConfig.stages.find((s: any) => {
    const nexts = Array.isArray(s?.next_role) ? s.next_role : [];
    return nexts.map(Number).includes(currentRoleId);
  });

  return prevStage ? Number(prevStage.current_role) : null;
}

function findNextRoleIdFromStage(currentStage: any): number | null {
  if (!currentStage?.next_role?.length) return null;
  return Number(currentStage.next_role[0]); // pick first by default
}
function resolveNextRoleId(
  action: string,
  workflowConfig: any,
  currentStage: any,
): number | null {
  // 1) If your stage defines explicit per-action transitions, prefer that.
  // Example shape: currentStage.transitions = { approve: 5, revert_back: 3 }
  const explicit = currentStage?.transitions?.[action];
  if (explicit != null) return Number(explicit);

  // 2) Fall back to route directive
  const directive: RouteDirective =
    ACTION_ROUTE_RULES[action as Action] ?? "NONE";

  switch (directive) {
    case "NEXT":
      return findNextRoleIdFromStage(currentStage);
    case "PREV":
      return findPreviousRoleId(workflowConfig, currentStage);
    case "NONE":
    default:
      return null;
  }
}
/* ----------------------------------------
   🔹 Resolve Current Workflow Stage
----------------------------------------- */
function getCurrentStage(
  workflowConfig: any,
  currentRoleId: string,
  formData: any,
) {
  if (!workflowConfig?.stages?.length) return null;

  for (const stage of workflowConfig.stages) {
    const roleMatch = String(stage.current_role) === String(currentRoleId);

    if (!roleMatch) continue;

    // If condition exists → evaluate recursively
    if (stage.condition) {
      const conditionMatch = evaluateCondition(stage.condition, formData);
      if (conditionMatch) {
        return stage;
      }

      // condition failed → continue searching
      continue;
    }

    // No condition → valid sequential stage
    return stage;
  }

  return null;
}

/* ----------------------------------------
   🔹 Map Department Action → App Status
   (single source of truth)
----------------------------------------- */

// Optional: type the actions you expect to handle

/**
 * Returns a canonical status string literal (matching the enum values)
 * for UI or persistence where you store raw strings.
 */
export function resolveSubmissionStatus(action: string): string {
  switch (action as Action) {
    case "reject":
      return ApplicationStatus.REJECTED;

    case "revert_applicant":
      return ApplicationStatus.REVERTED;

    case "revert_back":
      return ApplicationStatus.REVERT_BACK;

    case "approve":
      return ApplicationStatus.APPROVED;

    case "conditionally_approve":
      return ApplicationStatus.CONDITIONALLY_APPROVE;

    // Forwarding variants
    case "forward":
      return ApplicationStatus.FORWARDED;
    case "forward_next":
    case "forward_department":
      return ApplicationStatus.FORWARDED_DEPARTMENT;
    case "forward_district":
      return ApplicationStatus.FORWARDED_DISTRICT;
    case "forward_to_slec":
      return ApplicationStatus.FORWARDED_TO_SLEC;
    case "forward_for_disbursement":
      return ApplicationStatus.FORWARD_FOR_DISBURSEMENT;

    case "raise_query":
      return ApplicationStatus.RAISE_QUERY;

    // Payment lifecycle
    case "payment":
      return ApplicationStatus.PAYMENT;
    case "payment_done":
      return ApplicationStatus.PAYMENT_DONE;
    case "disburse":
      return ApplicationStatus.DISBURSED;

    // Terminal/other
    case "archive":
      return ApplicationStatus.ARCHIVED;

    // Workflow entry states
    case "submit":
      return ApplicationStatus.SUBMITTED;
    case "draft":
      return ApplicationStatus.DRAFT;

    // default:
    //   // Safe fallback
    //   return ApplicationStatus.SUBMITTED;
  }
}

/**
 * Returns the actual enum value for stricter typing in your domain layer.
 */
export function resolveActionStatus(action: string): ApplicationStatus {
  switch (action as Action) {
    case "reject":
      return ApplicationStatus.REJECTED;

    case "revert_applicant":
      return ApplicationStatus.REVERTED;

    case "revert_back":
      return ApplicationStatus.REVERT_BACK;

    case "approve":
      return ApplicationStatus.APPROVED;

    case "conditionally_approve":
      return ApplicationStatus.CONDITIONALLY_APPROVE;

    // Forwarding variants
    case "forward":
      return ApplicationStatus.FORWARDED;
    case "forward_next":
    case "forward_department":
      return ApplicationStatus.FORWARDED_DEPARTMENT;
    case "forward_district":
      return ApplicationStatus.FORWARDED_DISTRICT;
    case "forward_to_slec":
      return ApplicationStatus.FORWARDED_TO_SLEC;
    case "forward_for_disbursement":
      return ApplicationStatus.FORWARD_FOR_DISBURSEMENT;

    case "raise_query":
      return ApplicationStatus.RAISE_QUERY;

    // Payment lifecycle
    case "payment":
      return ApplicationStatus.PAYMENT;
    case "payment_done":
      return ApplicationStatus.PAYMENT_DONE;
    case "disburse":
      return ApplicationStatus.DISBURSED;

    // Terminal/other
    case "archive":
      return ApplicationStatus.ARCHIVED;

    // Workflow entry states
    case "submit":
      return ApplicationStatus.SUBMITTED;
    case "draft":
      return ApplicationStatus.DRAFT;

    // default:
    //   return ApplicationStatus.SUBMITTED;
  }
}

/* ----------------------------------------
   🔹 Component
----------------------------------------- */
export function DepartmentActionPanel({
  applicationId,
  adminViewConfig,
  workflowConfig,
  currentRoleId,
  loggedInUserId,
  formData,
  refreshPage,
}: Props) {
  const router = useRouter(); // ✅ add this
  const [values, setValues] = useState<any>({});
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  /* 🔹 Resolve workflow stage dynamically */
  const currentStage = useMemo(() => {
    return getCurrentStage(workflowConfig, currentRoleId, formData);
  }, [workflowConfig, currentRoleId, formData]);

  /* 🔹 Fields assigned to logged-in department user */
  const assignedFields = useMemo(() => {
    return adminViewConfig?.sections?.flatMap((section: any) =>
      section.fields.filter((f: any) =>
        f.assignedUsers?.includes(String(loggedInUserId)),
      ),
    );
  }, [adminViewConfig, loggedInUserId]);

  /* 🔹 Available actions for this stage */
  const actionOptions =
    currentStage?.action?.map((a: string) => ({
      label: a.replace(/_/g, " ").toUpperCase(),
      value: a,
    })) || [];

  useEffect(() => {
    setValues((prev: any) => ({
      ...prev,
      approved_amount_by_department: needsApprovedAmount
        ? (prev.approved_amount_by_department ?? null)
        : undefined,
      disbursed_amount_by_department: needsDisbursedAmount
        ? (prev.disbursed_amount_by_department ?? null)
        : undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  /* ----------------------------------------
     🔥 Submit Department Action
  ----------------------------------------- */
  const handleSubmit = async () => {
    if (!action) {
      alert("Please select an action");
      return;
    }

    if (!remarks.trim()) {
      alert("Remarks are mandatory");
      return;
    }

    // Conditional validations for amounts
    if (needsApprovedAmount) {
      const amt = values?.approved_amount_by_department;
      if (amt == null || Number.isNaN(Number(amt)) || Number(amt) < 0) {
        alert("Please enter a valid 'Approved Amount by Department'.");
        return;
      }
    }

    if (needsDisbursedAmount) {
      const amt = values?.disbursed_amount_by_department;
      if (amt == null || Number.isNaN(Number(amt)) || Number(amt) < 0) {
        alert("Please enter a valid 'Disbursed Amount by Department'.");
        return;
      }
    }

    setLoading(true);

    try {
      const applicationStatus = resolveSubmissionStatus(action);
      const actionStatus = resolveActionStatus(action);
      const nextRoleId = resolveNextRoleId(
        action,
        workflowConfig,
        currentStage,
      );

      // Pull amounts out of values so we can send them as columns
      const approvedAmountByDept = needsApprovedAmount
        ? Number(values?.approved_amount_by_department)
        : undefined;

      const disbursedAmountByDept = needsDisbursedAmount
        ? Number(values?.disbursed_amount_by_department)
        : undefined;
      /* ---------------------------------
       1️⃣ Fetch pending flowlog
    ---------------------------------- */
      const { data: pendingLogs } = await apiClient.get(
        "/incentive-application-flowlog",
        {
          params: {
            applicationId,
            currentRoleId,
            approvalStatus: "P",
            actionStatus: "DRAFT",
            status: "Y",
          },
        },
      );

      if (!pendingLogs?.length) {
        throw new Error("No pending draft flowlog found for this role");
      }

      const pendingFlowlog = pendingLogs.sort(
        (a: any, b: any) =>
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
      )[0];

      const flowlogId = pendingFlowlog.id;

      /* ---------------------------------
       2️⃣ Update pending flowlog (P → V)
    ---------------------------------- */
      await apiClient.put(`/incentive-application-flowlog/${flowlogId}`, {
        approvalStatus: "V", // P → V
        actionStatus,
        remarks,

        ...(approvedAmountByDept !== undefined && {
          approvedAmountByDepartment: approvedAmountByDept,
        }),
        ...(disbursedAmountByDept !== undefined && {
          disbursedAmountByDepartment: disbursedAmountByDept,
        }),

        additionalPostData: JSON.stringify(values),
        userId: Number(loggedInUserId),
        userAgent: navigator.userAgent, // ✅ browser user agent

        ...(nextRoleId && {
          nextRoleId: Number(nextRoleId),
        }),
      });

      /* ---------------------------------
       3️⃣ Create next role inbox
    ---------------------------------- */
      if (nextRoleId) {
        await apiClient.post("/incentive-application-flowlog", {
          applicationId,

          currentRoleId: nextRoleId, // this role now OWNS the inbox
          nextRoleId: null,

          userId: null, // unassigned (department inbox)

          approvalStatus: "P", // NEW pending case
          actionStatus: "DRAFT",

          remarks: "Application received for further processing",
          additionalPostData: null,
          status: "Y",
        });
      }

      /* ---------------------------------
       4️⃣ Update submission table
    ---------------------------------- */
      await apiClient.put(
        `/incentive-application-submission/${applicationId}`, // <-- submission ID
        {
          ...(nextRoleId && { departmentId: nextRoleId }), // only if exists
          applicationStatus,
        },
      );

      refreshPage();
      router.push("/department/incentive");
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Failed to process department action",
      );
    } finally {
      setLoading(false);
    }
  };
  // Show amount fields conditionally based on selected action
  const needsApprovedAmount =
    action === "approve" || action === "conditionally_approve";

  // If you want to require disbursed amount also on 'payment_done', keep it here
  const needsDisbursedAmount =
    action === "disburse" ||
    action === "payment_done" ||
    action === "payment"; /* || action === "payment_done" */

  if (!assignedFields.length && !actionOptions.length) return null;
  return (
    <Card
      title="Department Action"
      className="shadow-sm mt-4 border-4 bg-light p-4 department-action-panel"
    >
      <div className="row g-3">
        {/* 🔹 Dynamic Assigned Fields */}
        {assignedFields.map((field: any) => (
          <div key={field.fieldCode} className="col-md-4">
            <label className="small fw-semibold mb-1">
              {field.label}
              {field.required && <span className="text-danger"> *</span>}
            </label>

            <InputText
              className="w-100 border border-gray-300 rounded-md p-2 ps-3 focus:ring-2 focus:ring-[#e9090c] bg-white"
              placeholder={field.placeholder}
              value={values[field.fieldCode] || ""}
              onChange={(e) =>
                setValues((prev: any) => ({
                  ...prev,
                  [field.fieldCode]: e.target.value,
                }))
              }
            />
          </div>
        ))}

        {/* 🔹 Action Dropdown */}
        <div className="col-md-4">
          <label className="small fw-semibold mb-1">
            Action <span className="text-danger">*</span>
          </label>
          <Dropdown
            value={action}
            options={actionOptions}
            onChange={(e) => setAction(e.value)}
            placeholder="Select action"
            className="w-100"
          />
        </div>
        {/* 🔹 Approved Amount (visible on Approve / Conditionally Approve) */}
        {needsApprovedAmount && (
          <div className="col-md-4">
            <label className="small fw-semibold mb-1">
              Approved Amount by Department{" "}
              <span className="text-danger">*</span>
            </label>
            <InputNumber
              className="w-100 border border-gray-300 rounded-md p-2 ps-3 focus:ring-2 focus:ring-[#e9090c] bg-white"
              value={values.approved_amount_by_department ?? null}
              onValueChange={(e) =>
                setValues((prev: any) => ({
                  ...prev,
                  approved_amount_by_department: e.value ?? null,
                }))
              }
              mode="currency"
              currency="INR"
              locale="en-IN"
              min={0}
              placeholder="₹ 0"
            />
            <small className="text-muted">Enter the sanctioned amount.</small>
          </div>
        )}

        {/* 🔹 Disbursed Amount (visible on Disbursed) */}
        {needsDisbursedAmount && (
          <div className="col-md-4">
            <label className="small fw-semibold mb-1">
              Disbursed Amount by Department{" "}
              <span className="text-danger">*</span>
            </label>
            <InputNumber
              className="w-100 border border-gray-300 rounded-md p-2 ps-3 focus:ring-2 focus:ring-[#e9090c] bg-white"
              value={values.disbursed_amount_by_department ?? null}
              onValueChange={(e) =>
                setValues((prev: any) => ({
                  ...prev,
                  disbursed_amount_by_department: e.value ?? null,
                }))
              }
              mode="currency"
              currency="INR"
              locale="en-IN"
              min={0}
              placeholder="₹ 0"
            />
            <small className="text-muted">
              Enter the amount actually disbursed.
            </small>
          </div>
        )}
        {/* 🔹 Remarks */}
        <div className="col-md-12">
          <label className="small fw-semibold mb-1">
            Remarks <span className="text-danger">*</span>
          </label>
          <InputTextarea
            rows={3}
            className="w-100 border border-gray-300 rounded-md p-2 ps-3 focus:ring-2 focus:ring-[#e9090c] bg-white"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* 🔹 Documents */}
        <div className="col-md-12 ">
          <label className="small fw-semibold mb-3">Upload Documents</label>
          <FileUpload
            multiple
            customUpload
            uploadHandler={(e) => setDocuments(e.files as File[])}
          />
        </div>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <Button
          label="Submit Action"
          icon="pi pi-check"
          loading={loading}
          onClick={handleSubmit}
          className="btn btn-primary"
        />
      </div>
    </Card>
  );
}
