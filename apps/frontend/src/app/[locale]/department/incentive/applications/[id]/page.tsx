"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import apiClient from "@/lib/api-client";

import { useIncentiveApplicationSubmission } from "@/hooks/master/useIncentiveApplicationSubmissions";
import { useSchemes } from "@/hooks/master/useSchemes";
import { useFields } from "@/hooks/master/useFields";
import { useIncentiveApplicationFlowlogs } from "@/hooks/master/useIncentiveApplicationFlowlog";
import { Tooltip } from "primereact/tooltip";
import { DepartmentActionPanel } from "./DepartmentActionPanel";
import { useAuth } from "@/hooks/useAuth";

interface FieldCondition {
  field_code: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty"
    | "contains";
  value: any;
}

enum ApplicationStatus {
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

const STATUS_MAP: Record<
  ApplicationStatus,
  | "DRAFT"
  | "PENDING"
  | "FORWARDED"
  | "REVERTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED"
> = {
  // Draft
  DRAFT: "DRAFT",

  // Pending
  SUBMITTED: "PENDING",
  PAYMENT: "PENDING",
  PAYMENT_DONE: "PENDING",

  // Forwarded
  FORWARDED: "FORWARDED",
  FORWARDED_DISTRICT: "FORWARDED",
  FORWARDED_DEPARTMENT: "FORWARDED",
  FORWARDED_TO_SLEC: "FORWARDED",
  FORWARD_FOR_DISBURSEMENT: "FORWARDED",

  // Reverted / Query
  RAISE_QUERY: "REVERTED",
  REVERTED: "REVERTED",
  REVERT_BACK: "REVERTED",

  // Approved
  APPROVED: "APPROVED",
  CONDITIONALLY_APPROVE: "APPROVED",
  DISBURSED: "APPROVED",

  // Rejected
  REJECTED: "REJECTED",

  // Archived
  ARCHIVED: "ARCHIVED",
};
type NormalizedStatus = (typeof STATUS_MAP)[keyof typeof STATUS_MAP];

const STATUS_SEVERITY_MAP: Record<
  NormalizedStatus,
  "success" | "danger" | "warning" | "info"
> = {
  DRAFT: "info",
  PENDING: "warning",
  FORWARDED: "info",
  REVERTED: "danger",
  APPROVED: "success",
  REJECTED: "danger",
  ARCHIVED: "info",
};

export default function ViewIncentiveApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const applicationId = Number(params.id);
  const { data: flowlogs = [], isLoading: flowLoading } =
    useIncentiveApplicationFlowlogs({ applicationId });
  const [userMap, setUserMap] = useState<Record<number, string>>({});

  const { data: fields = [] } = useFields();
  const { data: schemes = [] } = useSchemes();

  const { data: application = null, isLoading } =
    useIncentiveApplicationSubmission(applicationId);

  const scheme = useMemo(() => {
    if (!application) return null;
    return schemes.find((s: any) => s.id === application.incentiveId);
  }, [schemes, application]);

  const formData =
    typeof application?.postData === "string"
      ? JSON.parse(application.postData)
      : application?.postData || {};

  // --- helpers: normalize & format amounts ---
  const toNumOrUndef = (v: unknown): number | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    const n = typeof v === "string" ? Number(v) : (v as number);
    return Number.isFinite(n) ? n : undefined;
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(n);

  // Pick value from camelCase OR snake_case from a flowlog row
  const getApprovedAmt = (log: any): number | undefined =>
    toNumOrUndef(
      log.approvedAmountByDepartment ?? log.approved_amount_by_department,
    );

  const getDisbursedAmt = (log: any): number | undefined =>
    toNumOrUndef(
      log.disbursedAmountByDepartment ?? log.disbursed_amount_by_department,
    );
  // --- Helpers: parse additional JSON & format for display ---

  // Try to parse any additional payload (string | object | null)
  const parseAdditional = (log: any): Record<string, any> | null => {
    // support both camelCase and snake_case
    const raw =
      log?.additionalPostData ??
      log?.additional_post_data ??
      log?.additionalJson ??
      log?.additional_json ??
      null;

    if (!raw) return null;

    try {
      if (typeof raw === "string") {
        const obj = JSON.parse(raw);
        return obj && typeof obj === "object" ? obj : null;
      }
      if (typeof raw === "object") {
        return raw;
      }
    } catch {
      // swallow parse errors; treat as no additional data
    }
    return null;
  };

  // Optional: keys to hide from display (already shown elsewhere or internal)
  const HIDE_KEYS = new Set<string>([
    "approved_amount_by_department",
    "disbursed_amount_by_department",
    "approvedAmountByDepartment",
    "disbursedAmountByDepartment",
  ]);

  // Convert key like "approved_amount" → "Approved Amount"
  const prettyLabel = (key: string) =>
    key.replace(/[_\-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Safely stringify a value for display
  const prettyValue = (val: any): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  };
  // 🔒 Filter flowlogs strictly for THIS applicationId
  const appFlowlogs = useMemo(() => {
    if (!Array.isArray(flowlogs) || !applicationId) return [];
    return flowlogs.filter(
      (l: any) => String(l?.applicationId) === String(applicationId),
    );
  }, [flowlogs, applicationId]);

  // Sort *only the app flowlogs* chronologically
  const sortedFlowlogs = useMemo(() => {
    if (!appFlowlogs || appFlowlogs.length === 0) return [];
    return [...appFlowlogs].sort(
      (a, b) =>
        new Date(a.createdDate || "").getTime() -
        new Date(b.createdDate || "").getTime(),
    );
  }, [appFlowlogs]);

  // Current status for THIS application
  const currentFlow =
    sortedFlowlogs.length > 0
      ? sortedFlowlogs[sortedFlowlogs.length - 1]
      : null;

  // Calculate time difference helper
  const getDuration = (start?: string | null, end?: string | null) => {
    if (!start) return "-";

    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return `${diffDays} days`;
  };

  // === Add these helpers inside the component (before return) ===
  const isRepeaterField = (field: any) =>
    field?.is_repeater === true || field?.component_type === "repeater";

  const formatDisplayValue = (v: any) => {
    if (v === null || v === undefined || v === "") {
      return <span className="text-muted fst-italic">Not provided</span>;
    }
    // Try to format dates that look like ISO or Date object
    if (v instanceof Date) return v.toLocaleDateString();
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
    }
    // Arrays / Objects fallback to JSON
    if (Array.isArray(v))
      return v.length ? (
        v.join(", ")
      ) : (
        <span className="text-muted fst-italic">Not provided</span>
      );
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  useEffect(() => {
    const fetchUsersForFlow = async () => {
      if (!sortedFlowlogs.length) return;

      const ids = new Set<number>();
      sortedFlowlogs.forEach((log) => {
        if (log.currentRoleId) ids.add(log.currentRoleId);
        if (log.nextRoleId) ids.add(log.nextRoleId);
      });

      const unresolvedIds = [...ids].filter((id) => !userMap[id]);
      if (!unresolvedIds.length) return;

      const newMap: Record<number, string> = {};

      await Promise.all(
        unresolvedIds.map(async (id) => {
          try {
            const res = await apiClient.get(`/auth/users/${id}`);
            const { user, profile } = res.data;
            if (user.userType === "INVESTOR") {
              newMap[id] = `${profile.firstName} ${profile.lastName}`;
            } else if (user.userType === "DEPARTMENT") {
              newMap[id] = profile.fullName;
            } else {
              newMap[id] = user.email;
            }
          } catch (err) {
            console.error(`Failed to fetch user ${id}`, err);
            newMap[id] = `User #${id}`;
          }
        }),
      );

      setUserMap((prev) => ({ ...prev, ...newMap }));
    };

    fetchUsersForFlow();
  }, [sortedFlowlogs, userMap]);
  
  const formStructure = useMemo(() => {
    if (!scheme?.form_structure_json?.sections) return [];

    return [...scheme.form_structure_json.sections].sort(
      (a: any, b: any) => a.step_number - b.step_number,
    );
  }, [scheme]);
  const evaluateCondition = (condition?: FieldCondition): boolean => {
    if (!condition) return true;

    const fieldValue = formData[condition.field_code];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return fieldValue === conditionValue;

      case "not_equals":
        return fieldValue !== conditionValue;

      case "in":
        return Array.isArray(conditionValue)
          ? conditionValue.includes(fieldValue)
          : false;

      case "not_in":
        return Array.isArray(conditionValue)
          ? !conditionValue.includes(fieldValue)
          : true;

      case "greater_than":
        return Number(fieldValue) > Number(conditionValue);

      case "less_than":
        return Number(fieldValue) < Number(conditionValue);

      case "is_empty":
        return (
          fieldValue === undefined || fieldValue === null || fieldValue === ""
        );

      case "is_not_empty":
        return !(
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === ""
        );

      case "contains":
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(conditionValue);
        }
        if (typeof fieldValue === "string") {
          return fieldValue.includes(String(conditionValue));
        }
        return false;

      default:
        return true;
    }
  };
  const pendingDraftFlow = sortedFlowlogs.find(
    (log) =>
      log.approvalStatus === "P" &&
      log.actionStatus === "DRAFT" &&
      String(log.currentRoleId) === String(user?.id),
  );

  const shouldShowDepartmentPanel = !!pendingDraftFlow;
  const fieldMasterMap = useMemo(() => {
    const map: Record<string, string> = {};

    fields.forEach((f: any) => {
      if (f?.field_code) {
        const key = f.field_code.trim().toUpperCase();
        map[key] = f.field_label;
      }
    });

    return map;
  }, [fields]);

  if (isLoading) {
    return <div className="text-center p-5">Loading application…</div>;
  }

  if (!application) {
    return <div className="text-center p-5">Application not found</div>;
  }

  const normalizedStatus: NormalizedStatus =
    STATUS_MAP[application.applicationStatus] ?? "PENDING";

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-semibold mb-1">Application Details</h5>
          <div className="text-muted small">
            Registration No: <b>{application.registrationNo}</b>
          </div>
        </div>

        <Button
          label="Back"
          icon="pi pi-arrow-left"
          className="p-button-text"
          onClick={() => router.back()}
        />
      </div>

      {/* Meta Card */}
      <Card className="mb-4 shadow-sm border-0">
        <div className="row g-4 align-items-center">
          <div className="col-md-4">
            <div className="text-muted small">Scheme</div>
            <div className="fw-semibold fs-6">
              <i className="pi pi-briefcase me-2 text-primary" />
              {scheme?.scheme_name || "-"}
            </div>
          </div>

          <div className="col-md-4">
            <div className="text-muted small">Application Status</div>
            <Tag
              value={normalizedStatus}
              severity={STATUS_SEVERITY_MAP[normalizedStatus]}
              className="px-3 py-2 text-uppercase"
            />
          </div>

          <div className="col-md-4">
            <div className="text-muted small">Submitted On</div>
            <div className="fw-semibold">
              <i className="pi pi-calendar me-2 text-secondary" />
              {new Date(application.createdOn).toLocaleDateString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Form Data */}
      <Card title="Application Information" className="shadow-sm">
        {formStructure.map((section: any, sectionIndex: number) => {
          if (!evaluateCondition(section.condition)) return null;

          const colSize = section.grid_cols
            ? Math.floor(12 / section.grid_cols)
            : 4;

          return (
            <div
              key={`${sectionIndex}-${section.section_title || "section"}`}
              className="mb-4"
            >
              {/* Section Header */}
              <h6 className="fw-semibold border-bottom pb-2 mb-2 d-flex align-items-center gap-2">
                <span>{section.section_title}</span>

                {section.description && (
                  <>
                    <i
                      id={`section-help-${section.step_number}`}
                      className="pi pi-info-circle text-primary"
                    />
                    <Tooltip target={`#section-help-${section.step_number}`}>
                      {section.description}
                    </Tooltip>
                  </>
                )}
              </h6>
              <div className="row g-3">
                {section.fields.map((field: any) => {
                  const fieldKey = String(field.field_code)
                    .trim()
                    .toUpperCase();
                  const label =
                    field.label_override ||
                    fieldMasterMap[fieldKey] ||
                    field.field_code
                      .toLowerCase()
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c: string) => c.toUpperCase());

                  // Regular (non-repeater) value
                  const rawValue = formData[field.field_code];

                  // === REPEATER? render table of saved rows ===
                  if (isRepeaterField(field)) {
                    const rows: any[] = Array.isArray(rawValue) ? rawValue : [];
                    const subFields: any[] = Array.isArray(field.sub_fields)
                      ? field.sub_fields
                      : [];
                    const itemLabel =
                      field.repeater_config?.item_label || "Item";

                    return (
                      <div
                        key={`${sectionIndex}-${field.field_code}`}
                        className={`col-md-${colSize}`}
                      >
                        <div className="p-3 border rounded bg-light h-100">
                          <div className="small text-muted d-flex align-items-center gap-1 mb-2">
                            <span>{label}</span>
                            {field.required && (
                              <span className="text-danger">*</span>
                            )}
                            {field.description && (
                              <>
                                <i
                                  id={`field-help-${section.step_number}-${field.field_code}`}
                                  className="pi pi-info-circle text-primary no-print"
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                  }}
                                />
                                <Tooltip
                                  target={`#field-help-${section.step_number}-${field.field_code}`}
                                >
                                  {field.description}
                                </Tooltip>
                              </>
                            )}
                          </div>

                          {rows.length === 0 ? (
                            <div className="text-muted fst-italic">
                              No {itemLabel.toLowerCase()}s added
                            </div>
                          ) : subFields.length === 0 ? (
                            <div className="text-muted fst-italic">
                              No sub-fields configured
                            </div>
                          ) : (
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered align-middle mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ whiteSpace: "nowrap" }}>
                                      S.No.
                                    </th>
                                    {subFields.map((sf: any) => {
                                      const subKey = String(sf.field_code)
                                        .trim()
                                        .toUpperCase();
                                      const subLabel =
                                        sf.label_override ||
                                        fieldMasterMap[subKey] ||
                                        sf.field_code
                                          .toLowerCase()
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (c: string) =>
                                            c.toUpperCase(),
                                          );
                                      return (
                                        <th key={sf.field_code}>{subLabel}</th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row, idx) => (
                                    <tr key={`${field.field_code}_row_${idx}`}>
                                      <td>{idx + 1}</td>
                                      {subFields.map((sf: any) => (
                                        <td
                                          key={`${field.field_code}_${sf.field_code}_${idx}`}
                                        >
                                          {formatDisplayValue(
                                            row?.[sf.field_code],
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // === NON-REPEATER: keep existing view rendering ===
                  return (
                    <div key={field.field_code} className={`col-md-${colSize}`}>
                      <div className="p-3 border rounded bg-light h-100">
                        <div className="small text-muted d-flex align-items-center gap-1 mb-1">
                          <span>{label}</span>

                          {field.required && (
                            <span className="text-danger">*</span>
                          )}

                          {field.description && (
                            <>
                              <i
                                id={`field-help-${section.step_number}-${field.field_code}`}
                                className="pi pi-info-circle text-primary no-print"
                                style={{
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                }}
                              />
                              <Tooltip
                                target={`#field-help-${section.step_number}-${field.field_code}`}
                              >
                                {field.description}
                              </Tooltip>
                            </>
                          )}
                        </div>

                        <div className="fw-semibold text-dark">
                          {rawValue !== undefined &&
                          rawValue !== null &&
                          rawValue !== "" ? (
                            formatDisplayValue(rawValue)
                          ) : (
                            <span className="text-muted fst-italic">
                              Not provided
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Card>

      {/* Workflow Timeline */}
      <Card title="Department Action Timeline" className="shadow-sm mt-4">
        {flowLoading ? (
          <div>Loading workflow logs...</div>
        ) : sortedFlowlogs.length === 0 ? (
          <div className="text-muted">No actions recorded yet</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>S.No.</th>
                  <th>Action Status</th>
                  <th>Approval Status</th>
                  <th>Role (From → To)</th>
                  <th>Amounts</th>
                  <th>Remarks</th>
                  <th>Action Date</th>
                  <th>Time Taken</th>
                </tr>
              </thead>

              <tbody>
                {sortedFlowlogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      -
                    </td>
                  </tr>
                ) : (
                  sortedFlowlogs.map((log, index) => {
                    const prev = sortedFlowlogs[index - 1];

                    // NEW: grab amounts (number | undefined)
                    const approvedAmt = getApprovedAmt(log);
                    const disbursedAmt = getDisbursedAmt(log);

                    return (
                      <tr key={log.id}>
                        <td>{index + 1}</td>

                        <td>
                          <Tag
                            icon={
                              log.actionStatus === "APPROVED"
                                ? "pi pi-check"
                                : log.actionStatus === "REJECTED"
                                  ? "pi pi-times"
                                  : "pi pi-clock"
                            }
                            value={log.actionStatus}
                            severity={
                              log.actionStatus === "APPROVED"
                                ? "success"
                                : log.actionStatus === "REJECTED"
                                  ? "danger"
                                  : "warning"
                            }
                          />
                        </td>

                        <td>
                          {log.approvalStatus === "V"
                            ? "Action Taken"
                            : log.approvalStatus === "P"
                              ? "Pending with Department"
                              : log.approvalStatus}
                        </td>

                        <td>
                          {userMap[log.currentRoleId] ||
                            `User #${log.currentRoleId}`}{" "}
                          →{" "}
                          {log.nextRoleId
                            ? userMap[log.nextRoleId] ||
                              `User #${log.nextRoleId}`
                            : "-"}
                        </td>

                        <td style={{ whiteSpace: "nowrap" }}>
                          {approvedAmt === undefined &&
                          disbursedAmt === undefined ? (
                            <span className="text-muted">-</span>
                          ) : (
                            <div className="d-flex flex-column gap-1">
                              {approvedAmt !== undefined && (
                                <Tag
                                  value={`Approved: ${formatINR(approvedAmt)}`}
                                  severity="success"
                                />
                              )}
                              {disbursedAmt !== undefined && (
                                <Tag
                                  value={`Disbursed: ${formatINR(disbursedAmt)}`}
                                  severity="info"
                                />
                              )}
                            </div>
                          )}
                        </td>

                        {/* Remarks + Additional JSON fields */}
                        <td>
                          <div>{log.remarks || "-"}</div>

                          {(() => {
                            const additional = parseAdditional(log);
                            if (!additional) return null;

                            // Filter out empty and hidden keys
                            const entries = Object.entries(additional).filter(
                              ([k, v]) => {
                                if (HIDE_KEYS.has(k)) return false;
                                // treat empty string / null / undefined as not useful
                                if (v === "" || v === null || v === undefined)
                                  return false;
                                return true;
                              },
                            );

                            if (entries.length === 0) return null;

                            return (
                              <div className="small mt-2">
                                {entries.map(([k, v]) => (
                                  <div key={k} className="text-muted">
                                    <strong>{prettyLabel(k)}:</strong>{" "}
                                    {prettyValue(v)}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </td>

                        <td>
                          {log.modifiedOn
                            ? new Date(log.modifiedOn).toLocaleString()
                            : "-"}
                        </td>

                        <td>
                          {getDuration(
                            log.createdDate ?? undefined,
                            log.modifiedOn ?? undefined,
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Current Pending Status */}
        {currentFlow && (
          <div className="mt-4 p-4 border-start border-4 border-warning bg-warning bg-opacity-10 rounded">
            <div className="fw-semibold mb-2">
              <i className="pi pi-hourglass me-2" />
              Currently Pending
            </div>

            <div className="small">
              <div>
                <b>Role:</b> {userMap[currentFlow.currentRoleId] || "N/A"}
              </div>
              <div>
                <b>Status:</b> {currentFlow.actionStatus}
              </div>
              <div>
                <b>Pending Since:</b>{" "}
                {currentFlow.createdDate
                  ? new Date(currentFlow.createdDate).toLocaleDateString()
                  : "-"}{" "}
                ({getDuration(currentFlow.createdDate)} elapsed)
              </div>
            </div>
          </div>
        )}
      </Card>

      {shouldShowDepartmentPanel && pendingDraftFlow && (
        <DepartmentActionPanel
          applicationId={applicationId}
          adminViewConfig={scheme?.admin_view_config}
          workflowConfig={scheme?.workflow_config}
          currentRoleId={String(pendingDraftFlow.currentRoleId)}
          loggedInUserId={String(user?.id)}
          formData={formData}
          refreshPage={() => router.refresh()}
        />
      )}
    </div>
  );
}
