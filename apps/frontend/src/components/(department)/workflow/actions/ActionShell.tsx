"use client";

import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";

import apiClient from "@/lib/api-client";
import { useDepartments } from "@/hooks/master/useDepartments";
import {
  AssignableRole,
  ForwardRecipientPreviewRow,
  SelectedRecipient,
  ShellState,
  DropdownOption,
} from "@/components/(department)/workflow/types";

type ActionShellProps = {
  shellState: ShellState;
  setShellState: Dispatch<SetStateAction<ShellState>>;
  allowedActions: DropdownOption[];
  onSubmit: () => void;
  onReset: () => void;
  submitLoading: boolean;
  disabledActions?: string[];
  helperText?: string;
  transitionMap?: Record<string, { next_step?: number; next_roles?: number[] }>;
  formType?: string | null;
  subformActionName?: string | null;
  assignmentRule?: Record<string, any> | null;
  assignableByRole?: AssignableRole[];
  reasonRequired?: boolean;
  submissionId?: number;
  workflowStep?: number;
  workflowJurisdictionLevel?: string;
  districtId?: number | null;
  stateId?: number | null;
};

const ACTION_LABELS: Record<string, string> = {
  // Short codes (legacy)
  F: "Forward",
  FA: "Forward to Approver",
  A: "Approve",
  R: "Reject",
  RBI: "Revert to Investor",
  P: "Pending",
  H: "Hold",
  // Full action codes (new workflow config)
  SUBMIT: "Submit Application",
  SAVE_DRAFT: "Save Draft",
  APPROVE: "Approve",
  REJECT: "Reject",
  FORWARD: "Forward",
  FORWARD_TO_APPROVER: "Forward to Approver",
  FORWARD_TO_DEPARTMENT: "Forward to Department",
  QUERY: "Send Query",
  REVERT_TO_APPLICANT: "Revert to Applicant",
  REVERT_TO_INVESTOR: "Revert to Investor",
  REVERT_TO_NODAL: "Revert to Nodal",
  SUBMIT_REPORT: "Submit Report",
  SUBMIT_TO_NODAL: "Submit to Nodal",
  HOLD: "Hold",
  PENDING: "Pending",
};

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  // Green — positive/approval actions
  APPROVE: { bg: "#16a34a", text: "#fff", border: "#15803d" },
  A:       { bg: "#16a34a", text: "#fff", border: "#15803d" },
  SUBMIT:  { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  SUBMIT_REPORT: { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  SUBMIT_TO_NODAL: { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  // Blue — forward actions
  FORWARD:              { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  FORWARD_TO_APPROVER:  { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  FORWARD_TO_DEPARTMENT:{ bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  F:  { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  FA: { bg: "#2563eb", text: "#fff", border: "#1d4ed8" },
  // Red — rejection
  REJECT: { bg: "#dc2626", text: "#fff", border: "#b91c1c" },
  R:      { bg: "#dc2626", text: "#fff", border: "#b91c1c" },
  // Orange — revert/query
  REVERT_TO_APPLICANT: { bg: "#ea580c", text: "#fff", border: "#c2410c" },
  REVERT_TO_INVESTOR:  { bg: "#ea580c", text: "#fff", border: "#c2410c" },
  REVERT_TO_NODAL:     { bg: "#ea580c", text: "#fff", border: "#c2410c" },
  QUERY: { bg: "#d97706", text: "#fff", border: "#b45309" },
  RBI:   { bg: "#ea580c", text: "#fff", border: "#c2410c" },
  // Grey — neutral
  SAVE_DRAFT: { bg: "#64748b", text: "#fff", border: "#475569" },
  HOLD:    { bg: "#64748b", text: "#fff", border: "#475569" },
  PENDING: { bg: "#64748b", text: "#fff", border: "#475569" },
  H: { bg: "#64748b", text: "#fff", border: "#475569" },
  P: { bg: "#64748b", text: "#fff", border: "#475569" },
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

const ActionShell = ({
  shellState,
  setShellState,
  allowedActions,
  onSubmit,
  onReset,
  submitLoading,
  disabledActions,
  helperText,
  transitionMap,
  formType,
  reasonRequired,
  submissionId,
  workflowStep,
  workflowJurisdictionLevel,
  districtId,
  stateId,
}: ActionShellProps) => {
  const [forwardPreviewRows, setForwardPreviewRows] = useState<ForwardRecipientPreviewRow[]>([]);
  const [forwardPreviewLoading, setForwardPreviewLoading] = useState(false);
  const [forwardPreviewError, setForwardPreviewError] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: departments = [] } = useDepartments();

  // Payment Demand State
  const [generatePayment, setGeneratePayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [bifurcations, setBifurcations] = useState<Array<{ name: string; amount: number }>>([]);

  const updatePaymentPayload = (amount: number, bifs: Array<{ name: string; amount: number }>) => {
    setShellState((prev) => ({
      ...prev,
      blockPayload: {
        ...(prev.blockPayload || {}),
        paymentDemand: { amount, bifurcation: bifs },
      },
    }));
  };

  const updateSupportiveDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/investor/inprinciple/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const filePath = res?.data?.filePath || "";
    setShellState((prev) => ({ ...prev, supportiveDocument: filePath }));
  };

  const normalizedDisabled = useMemo(
    () => new Set((disabledActions || []).map((action) => String(action).toUpperCase()).filter(Boolean)),
    [disabledActions]
  );

  const dropdownOptions = useMemo(
    () =>
      allowedActions.map((option) => {
        const upper = option.value ? String(option.value).toUpperCase() : "";
        return {
          ...option,
          label: ACTION_LABELS[upper] || option.label,
          disabled: upper ? normalizedDisabled.has(upper) : undefined,
        };
      }),
    [allowedActions, normalizedDisabled]
  );
  const isActionable = dropdownOptions.length > 0;

  const currentAction = shellState.action ? String(shellState.action).toUpperCase() : "";
  const transitionForAction = currentAction
    ? transitionMap?.[currentAction] ||
      (currentAction === "FORWARD" || currentAction === "F"
        ? transitionMap?.FORWARD || transitionMap?.F
        : undefined)
    : undefined;
  const jurisdictionLevel = String(workflowJurisdictionLevel || "").trim().toUpperCase();
  const canonicalFormType = normalizeWorkflowFormType(formType);
  const isVerifierOrProcessingForm =
    canonicalFormType === "PROCESSING_FORM_VERIFIER_LEVEL" ||
    canonicalFormType === "PROCESSING_FORM";
  const hasForwardTransitionRoles =
    Array.isArray(transitionForAction?.next_roles) &&
    transitionForAction.next_roles
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x) && x > 0).length > 0;
  const isForwardAction = currentAction === "FORWARD" || currentAction === "F";
  const isRevertToInvestorAction =
    currentAction === "RBI" ||
    currentAction === "REVERT_TO_INVESTOR" ||
    currentAction === "REVERT";
  const forwardNeedsDepartmentSelection =
    isForwardAction &&
    isVerifierOrProcessingForm &&
    !!jurisdictionLevel &&
    (jurisdictionLevel === "DISTRICT" || jurisdictionLevel === "STATE") &&
    hasForwardTransitionRoles;
  const selectedDepartmentIds = shellState.forwardedDeptIds || [];

  const forwardDepartmentOptions = useMemo(
    () =>
      (departments || [])
        .filter((dept: any) => dept?.isActive !== false)
        .map((dept: any) => ({
          value: Number(dept.id),
          label: String(dept.name || `Department ${dept.id}`),
        }))
        .filter((option) => Number.isFinite(option.value) && option.value > 0)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [departments]
  );

  const groupedRecipientRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        forwardedDeptId: number;
        nextRoleId: number;
        jurisdictionLevel: string;
        departmentName: string | null;
        roleName: string | null;
        users: Array<{
          nextUserId: number;
          userName: string | null;
          districtName: string | null;
        }>;
      }
    >();

    (forwardPreviewRows || []).forEach((row) => {
      const forwardedDeptId = Number(row.forwardedDeptId ?? row.departmentId);
      const nextRoleId = Number(row.nextRoleId ?? row.roleId);
      const nextUserId = Number(row.nextUserId ?? row.userId ?? NaN);
      if (!Number.isFinite(forwardedDeptId) || forwardedDeptId <= 0) return;
      if (!Number.isFinite(nextRoleId) || nextRoleId <= 0) return;
      const key = `${forwardedDeptId}-${nextRoleId}-${row.jurisdictionLevel || ""}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          forwardedDeptId,
          nextRoleId,
          jurisdictionLevel: row.jurisdictionLevel || "",
          departmentName: row.departmentName || null,
          roleName: row.roleName || null,
          users: [],
        });
      }
      const entry = grouped.get(key)!;
      if (Number.isFinite(nextUserId) && nextUserId > 0) {
        const exists = entry.users.some((user) => user.nextUserId === nextUserId);
        if (!exists) {
          entry.users.push({
            nextUserId,
            userName: row.userName || null,
            districtName: row.districtName || null,
          });
        }
      }
    });

    return Array.from(grouped.values());
  }, [forwardPreviewRows]);

  const computedForwardDestinations = useMemo(() => {
    if (!isForwardAction) return [];

    const fromSelectedRecipients = selectedRecipients
      .map((item) => {
        const roleId = Number(item.nextRoleId);
        const deptId = Number(item.forwardedDeptId);
        if (!Number.isFinite(roleId) || roleId <= 0) return null;
        if (!Number.isFinite(deptId) || deptId <= 0) return null;
        return `${roleId}-${deptId}`;
      })
      .filter((value): value is string => Boolean(value));

    if (fromSelectedRecipients.length) {
      return Array.from(new Set(fromSelectedRecipients));
    }

    const fromPreviewGroups = groupedRecipientRows
      .map((group) => {
        const roleId = Number(group.nextRoleId);
        const deptId = Number(group.forwardedDeptId);
        if (!Number.isFinite(roleId) || roleId <= 0) return null;
        if (!Number.isFinite(deptId) || deptId <= 0) return null;
        return `${roleId}-${deptId}`;
      })
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(fromPreviewGroups));
  }, [groupedRecipientRows, isForwardAction, selectedRecipients]);

  const selectAction = useCallback(
    (actionCode: string) => {
      setSubmitError(null);
      setShellState((prev) => ({ ...prev, action: String(actionCode || "").trim().toUpperCase() }));
    },
    [setShellState]
  );

  const handleForwardDepartmentsChange = useCallback(
    (values: number[]) => {
      const parsed = (values || [])
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x) && x > 0);
      setSubmitError(null);
      setShellState((prev) => ({
        ...prev,
        forwardedDeptIds: parsed,
        selectedRecipients: [],
      }));
      setSelectedRecipients([]);
    },
    [setShellState]
  );

  useEffect(() => {
    if (!isForwardAction) {
      setForwardPreviewRows([]);
      setForwardPreviewLoading(false);
      setForwardPreviewError(null);
      setSelectedRecipients([]);
      setShellState((prev) => ({
        ...prev,
        forwardedDeptIds: [],
        selectedRecipients: [],
      }));
    }
  }, [isForwardAction, setShellState]);

  useEffect(() => {
    const normalize = (values: string[]) =>
      [...values].filter(Boolean).sort((a, b) => a.localeCompare(b));

    const prev = normalize(shellState.forwardDestinations || []);
    const next = normalize(computedForwardDestinations);
    const unchanged =
      prev.length === next.length && prev.every((value, idx) => value === next[idx]);
    if (unchanged) return;

    setShellState((current) => ({
      ...current,
      forwardDestinations: computedForwardDestinations,
    }));
  }, [computedForwardDestinations, setShellState, shellState.forwardDestinations]);

  useEffect(() => {
    const shouldPreview =
      forwardNeedsDepartmentSelection &&
      Number.isFinite(Number(submissionId)) &&
      Number.isFinite(Number(workflowStep)) &&
      selectedDepartmentIds.length > 0;

    if (!shouldPreview) {
      setForwardPreviewRows([]);
      setForwardPreviewLoading(false);
      setForwardPreviewError(null);
      if (!forwardNeedsDepartmentSelection) {
        setSelectedRecipients([]);
        setShellState((prev) =>
          prev.selectedRecipients.length ? { ...prev, selectedRecipients: [] } : prev
        );
      }
      return;
    }

    let isCancelled = false;
    setForwardPreviewLoading(true);
    setForwardPreviewError(null);

    apiClient
      .post("/api/workflow/forward/preview", {
        submissionId: Number(submissionId),
        step: Number(workflowStep),
        action: "FORWARD",
        departmentIds: selectedDepartmentIds,
        jurisdictionLevel: workflowJurisdictionLevel,
        districtId: districtId ?? undefined,
        stateId: stateId ?? undefined,
      })
      .then((res) => {
        if (isCancelled) return;
        setForwardPreviewRows(Array.isArray(res?.data) ? res.data : []);
      })
      .catch((error: any) => {
        if (isCancelled) return;
        setForwardPreviewRows([]);
        setForwardPreviewError(error?.response?.data?.message || "Could not load recipient preview");
      })
      .finally(() => {
        if (isCancelled) return;
        setForwardPreviewLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    forwardNeedsDepartmentSelection,
    submissionId,
    workflowStep,
    workflowJurisdictionLevel,
    districtId,
    stateId,
    selectedDepartmentIds,
    setShellState,
  ]);

  useEffect(() => {
    if (!forwardNeedsDepartmentSelection) return;
    const nextSelections: SelectedRecipient[] = groupedRecipientRows
      .map((group) => {
        const existing = selectedRecipients.find(
          (item) =>
            item.forwardedDeptId === group.forwardedDeptId &&
            item.nextRoleId === group.nextRoleId
        );
        const validExisting =
          existing && group.users.some((u) => u.nextUserId === existing.nextUserId)
            ? existing.nextUserId
            : undefined;
        const fallback = group.users[0]?.nextUserId;
        const nextUserId = validExisting ?? fallback;
        if (!nextUserId) return null;
        return {
          forwardedDeptId: group.forwardedDeptId,
          nextRoleId: group.nextRoleId,
          nextUserId,
        };
      })
      .filter((item): item is SelectedRecipient => Boolean(item));

    const toKey = (arr: SelectedRecipient[]) =>
      JSON.stringify(
        [...arr].sort((a, b) =>
          `${a.forwardedDeptId}-${a.nextRoleId}`.localeCompare(
            `${b.forwardedDeptId}-${b.nextRoleId}`
          )
        )
      );

    if (toKey(nextSelections) !== toKey(selectedRecipients)) {
      setSelectedRecipients(nextSelections);
      setShellState((prev) => ({ ...prev, selectedRecipients: nextSelections }));
    }
  }, [forwardNeedsDepartmentSelection, groupedRecipientRows, selectedRecipients, setShellState]);

  const handleRecipientUserChange = useCallback(
    (forwardedDeptId: number, nextRoleId: number, nextUserId: number) => {
      if (!Number.isFinite(nextUserId) || nextUserId <= 0) return;
      const nextSelections = [
        ...selectedRecipients.filter(
          (item) => !(item.forwardedDeptId === forwardedDeptId && item.nextRoleId === nextRoleId)
        ),
        { forwardedDeptId, nextRoleId, nextUserId },
      ];
      setSelectedRecipients(nextSelections);
      setShellState((prev) => ({ ...prev, selectedRecipients: nextSelections }));
    },
    [selectedRecipients, setShellState]
  );

  const canSubmit = useMemo(() => {
    if (!isActionable) return false;
    if (!currentAction) return false;
    if (forwardNeedsDepartmentSelection && selectedDepartmentIds.length === 0) return false;
    return true;
  }, [currentAction, forwardNeedsDepartmentSelection, isActionable, selectedDepartmentIds.length]);
  const bannerMessage = !isActionable
    ? helperText || "Not pending with your role."
    : helperText || "";

  const handleSubmitClick = useCallback(() => {
    if (!isActionable) {
      setSubmitError("Not pending with your role.");
      return;
    }
    setSubmitError(null);
    if (!currentAction) {
      setSubmitError("Please select an action.");
      return;
    }
    if (forwardNeedsDepartmentSelection && selectedDepartmentIds.length === 0) {
      setSubmitError("Please select at least one department.");
      return;
    }
    if (isRevertToInvestorAction && !String(shellState.comments || "").trim()) {
      setSubmitError("Remarks are required for Revert Back to Investor.");
      return;
    }

    if (generatePayment) {
      if (paymentAmount <= 0) {
        setSubmitError("Payment amount must be greater than 0");
        return;
      }
      const totalBifurcation = bifurcations.reduce((sum, b) => sum + Number(b.amount || 0), 0);
      if (bifurcations.length > 0 && totalBifurcation !== paymentAmount) {
        setSubmitError("Bifurcation total must equal the payment amount");
        return;
      }
    }

    onSubmit();
  }, [
    currentAction,
    forwardNeedsDepartmentSelection,
    isActionable,
    isRevertToInvestorAction,
    onSubmit,
    selectedDepartmentIds.length,
    shellState.comments,
  ]);

  return (
    <div>
      {!isActionable && (
        <div className="alert alert-warning py-2 px-3 mb-3 small">
          {bannerMessage}
        </div>
      )}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <label className="form-label fw-semibold">What do you want to do?</label>
          <Dropdown
            value={shellState.action || undefined}
            options={dropdownOptions}
            onChange={(e) => selectAction(String(e.value || ""))}
            className="w-100 border"
            placeholder="Select action"
            optionDisabled="disabled"
            disabled={!isActionable}
            filter
          />
        </div>
      </div>

      {isActionable && (
        <div className="mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="genPaymentDemand"
              checked={generatePayment}
              onChange={(e) => {
                setGeneratePayment(e.target.checked);
                if (!e.target.checked) {
                  setShellState((prev) => {
                    const newPayload = { ...prev.blockPayload };
                    delete newPayload.paymentDemand;
                    return { ...prev, blockPayload: newPayload };
                  });
                } else {
                  updatePaymentPayload(paymentAmount, bifurcations);
                }
              }}
            />
            <label className="form-check-label fw-semibold" htmlFor="genPaymentDemand">
              Generate Payment Demand
            </label>
          </div>
          {generatePayment && (
            <div className="mt-2 p-3 border rounded bg-light">
              <div className="mb-3">
                <label className="form-label">Total Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => {
                    const amt = Number(e.target.value);
                    setPaymentAmount(amt);
                    updatePaymentPayload(amt, bifurcations);
                  }}
                />
              </div>
              <div className="mb-2">
                <label className="form-label fw-semibold">Fee Bifurcation (Optional)</label>
                {bifurcations.map((bif, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Fee Name (e.g., Application Fee)"
                      value={bif.name}
                      onChange={(e) => {
                        const newBifs = [...bifurcations];
                        newBifs[idx].name = e.target.value;
                        setBifurcations(newBifs);
                        updatePaymentPayload(paymentAmount, newBifs);
                      }}
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Amount"
                      value={bif.amount}
                      onChange={(e) => {
                        const newBifs = [...bifurcations];
                        newBifs[idx].amount = Number(e.target.value);
                        setBifurcations(newBifs);
                        updatePaymentPayload(paymentAmount, newBifs);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        const newBifs = bifurcations.filter((_, i) => i !== idx);
                        setBifurcations(newBifs);
                        updatePaymentPayload(paymentAmount, newBifs);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm mt-1"
                  onClick={() => {
                    const newBifs = [...bifurcations, { name: "", amount: 0 }];
                    setBifurcations(newBifs);
                    updatePaymentPayload(paymentAmount, newBifs);
                  }}
                >
                  + Add Fee Component
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {forwardNeedsDepartmentSelection && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Forward To Department(s)</label>
          <MultiSelect
            value={selectedDepartmentIds}
            options={forwardDepartmentOptions}
            onChange={(e) => handleForwardDepartmentsChange(e.value || [])}
            placeholder="Select departments"
            className="w-100"
            filter
          />
          {submitError && selectedDepartmentIds.length === 0 && (
            <div className="text-danger small mt-1">{submitError}</div>
          )}
        </div>
      )}

      {forwardNeedsDepartmentSelection && selectedDepartmentIds.length > 0 && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Forward Preview</label>
          {forwardPreviewLoading ? (
            <div className="text-muted small">Loading recipients...</div>
          ) : forwardPreviewError ? (
            <div className="text-danger small">{forwardPreviewError}</div>
          ) : groupedRecipientRows.length ? (
            <div className="table-responsive border rounded">
              <table className="table table-sm mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">Department Name</th>
                    <th className="text-center">Next Role Name</th>
                    <th className="text-center">Officer/User Name</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRecipientRows.map((row, index) => (
                    <tr key={`${row.forwardedDeptId}-${row.nextRoleId}-${index}`}>
                      <td className="text-start">{row.departmentName || `Department ${row.forwardedDeptId}`}</td>
                      <td className="text-start">{row.roleName || `Role ${row.nextRoleId}`}</td>
                      <td className="text-start" style={{ minWidth: 220 }}>
                        {row.users.length > 1 ? (
                          <Dropdown
                            value={
                              selectedRecipients.find(
                                (item) =>
                                  item.forwardedDeptId === row.forwardedDeptId &&
                                  item.nextRoleId === row.nextRoleId
                              )?.nextUserId
                            }
                            options={row.users.map((user) => ({
                              label:
                                row.jurisdictionLevel === "DISTRICT" && user.districtName
                                  ? `${user.userName || `User ${user.nextUserId}`} (${user.districtName})`
                                  : user.userName || `User ${user.nextUserId}`,
                              value: user.nextUserId,
                            }))}
                            onChange={(e) =>
                              handleRecipientUserChange(
                                row.forwardedDeptId,
                                row.nextRoleId,
                                Number(e.value)
                              )
                            }
                            className="w-100"
                            placeholder="Select user"
                          />
                        ) : row.users.length === 1 ? (
                          row.jurisdictionLevel === "DISTRICT" && row.users[0].districtName
                            ? `${row.users[0].userName || `User ${row.users[0].nextUserId}`} (${row.users[0].districtName})`
                            : row.users[0].userName || `User ${row.users[0].nextUserId}`
                        ) : (
                          "No mapped user"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-muted small">No recipients resolved for selected departments.</div>
          )}
        </div>
      )}

      {isActionable && helperText && <div className="text-danger small mb-2">{helperText}</div>}
      {submitError && !(forwardNeedsDepartmentSelection && selectedDepartmentIds.length === 0) && (
        <div className="text-danger small mb-2">{submitError}</div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold">
          {isRevertToInvestorAction ? "Remarks (required)" : "Remarks (optional)"}
        </label>
        <InputTextarea
          rows={4}
          value={shellState.comments}
          onChange={(e) => setShellState((prev) => ({ ...prev, comments: e.target.value }))}
          className="w-100 border"
          placeholder={
            isRevertToInvestorAction
              ? "Enter reason for reverting back to investor"
              : undefined
          }
        />
      </div>

      {reasonRequired && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Reason for Delay</label>
          <InputTextarea
            rows={3}
            value={shellState.reasonForDelay}
            onChange={(e) => setShellState((prev) => ({ ...prev, reasonForDelay: e.target.value }))}
            className="w-100 border"
            placeholder="Explain why the SLA is being breached"
          />
        </div>
      )}

      <div className="mb-3">
        <label className="form-label fw-semibold">Upload Document (optional)</label>
        <input type="file" className="form-control" onChange={updateSupportiveDocument} />
        {shellState.supportiveDocument && (
          <div className="small text-muted mt-1">Uploaded: {shellState.supportiveDocument}</div>
        )}
      </div>

      <div className="d-flex gap-2">
        <button type="button" onClick={handleSubmitClick} disabled={submitLoading || !canSubmit} className="btn btn-primary">
          Submit
        </button>
        <button type="button" onClick={onReset} className="btn btn-secondary">
          Reset
        </button>
      </div>
    </div>
  );
};

export default ActionShell;
