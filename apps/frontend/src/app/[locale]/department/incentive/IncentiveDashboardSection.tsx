"use client";

import { useMemo, useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { useRouter } from "next/navigation";
import { usePolicies } from "@/hooks/master/usePolicies";
import { useSchemes } from "@/hooks/master/useSchemes";
import { useIncentiveApplicationSubmissions } from "@/hooks/master/useIncentiveApplicationSubmissions";
import { Chart } from "primereact/chart";
import { useFields } from "@/hooks/master/useFields";
import { Paginator } from "primereact/paginator";

interface SchemeOption {
  label: string;
  value: string; // scheme_code
  policy_id: number;
}

const mapToBucket = (raw?: string): string | null => {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();

  // PENDING family
  if (s === "SUBMITTED" || s === "PENDING") return "PENDING";

  // Exact buckets
  if (
    s === "APPROVED" ||
    s === "DISBURSED" ||
    s === "PAYMENT" ||
    s === "PAYMENT_DONE" ||
    s === "CONDITIONALLY_APPROVE"
  )
    return "APPROVED";
  if (s === "REJECTED") return "REJECTED";

  // ✅ FORWARDED family (handles FORWARDED_DISTRICT, FORWARDED_DEPARTMENT, etc.)
  if (s.startsWith("FORWARD")) return "FORWARDED";

  // (Optional) REVERTED family
  if (s.startsWith("REVERT") || s === "RAISE_QUERY" || s === "DRAFT")
    return "REVERTED";

  return null; // Unknown/unbucketed statuses
};

interface FieldMasterDef {
  field_code: string;
  field_label: string;
  data_type: string;
  component_type: string;
  default_validation?: any;
  lookup_config?: any;
  integration_config?: any;
  is_active: boolean;
}
const STATUS_CARD_CLASSES: Record<string, { bg: string; border: string }> = {
  TOTAL: {
    bg: "bg-secondary-subtle",
    border: "border-secondary",
  },
  REVERTED: {
    bg: "bg-primary-subtle",
    border: "border-primary",
  },
  PENDING: {
    bg: "bg-warning-subtle",
    border: "border-warning",
  },
  REJECTED: {
    bg: "bg-danger-subtle",
    border: "border-danger",
  },
  FORWARDED: {
    bg: "bg-info-subtle",
    border: "border-info",
  },
  APPROVED: {
    bg: "bg-success-subtle",
    border: "border-success",
  },
};
const DONUT_COLORS = {
  PENDING: {
    bg: "#f59e0b", // warning
    hover: "#fbbf24",
  },
  APPROVED: {
    bg: "#22c55e", // success
    hover: "#4ade80",
  },
  REJECTED: {
    bg: "#ef4444", // danger
    hover: "#f87171",
  },
  FORWARDED: {
    bg: "#0dcaf0", // info
    hover: "#38bdf8",
  },
  REVERTED: {
    bg: "#0d6efd", // primary
    hover: "#3b82f6",
  },
};

export default function IncentiveDashboardSection() {
  const router = useRouter();
  const { data: fields = [] } = useFields();

  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<number | null>(
    null,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  useEffect(() => {
    setFirst(0);
  }, [selectedStatus, selectedSchemeCode]);
  const fieldMaster: FieldMasterDef[] = fields as FieldMasterDef[];
  const fieldMasterMap = useMemo(() => {
    const map: Record<string, string> = {};

    fieldMaster.forEach((field) => {
      if (field?.field_code) {
        const key = field.field_code.trim().toUpperCase(); // normalize
        map[key] = field.field_label;
      }
    });

    return map;
  }, [fieldMaster]);

  /* ================= MASTERS ================= */
  const { data: policies = [] } = usePolicies({ isActive: true });
  const { data: schemes = [] } = useSchemes();
  /* ================= APPLICATIONS ================= */
  const { data: applications = [], isLoading } =
    useIncentiveApplicationSubmissions(
      selectedPolicyId && selectedSchemeCode
        ? {
            // policyId: selectedPolicyId,
            incentiveId: selectedSchemeCode,
            enabled: true, // ✅ scheme_code → incentiveId
          }
        : { enabled: true },
    );

  /* ================= OPTIONS ================= */
  const policyOptions = useMemo(
    () =>
      policies.map((p: any) => ({
        label: `${p.policy_code} - ${p.policy_name}`,
        value: p.id,
      })),
    [policies],
  );

  const schemeOptions = useMemo<SchemeOption[]>(
    () =>
      schemes.map((s: any) => ({
        label: `${s.scheme_code} - ${s.scheme_name}`,
        value: s.id,
        policy_id: s.policy_id,
      })),
    [schemes],
  );

  const filteredSchemes = useMemo<SchemeOption[]>(() => {
    if (!selectedPolicyId) return [];

    return schemeOptions.filter((s) => s.policy_id === selectedPolicyId);
  }, [schemeOptions, selectedPolicyId]);

  /* ================= STATUS COUNTS ================= */
  const statusCounts = useMemo(() => {
    const counts = {
      TOTAL: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      FORWARDED: 0,
      REVERTED: 0,
    };

    applications.forEach((app: any) => {
      counts.TOTAL += 1;

      const bucket = mapToBucket(app.applicationStatus);
      if (bucket && bucket in counts) {
        counts[bucket as keyof typeof counts] += 1;
      }
    });

    return counts;
  }, [applications]);

  /* ================= NAVIGATION ================= */
  const handleCardClick = (status?: string) => {
    if (!status) {
      setSelectedStatus("TOTAL");
      return;
    }

    setSelectedStatus(status);
  };

  const tableApplications = useMemo(() => {
    if (!selectedStatus) return [];
    if (selectedStatus === "TOTAL") {
      return applications; // all records
    }
    return applications.filter(
      (app: any) => mapToBucket(app.applicationStatus) === selectedStatus,
    );
  }, [applications, selectedStatus]);

  const paginatedApplications = useMemo(() => {
    return tableApplications.slice(first, first + rows);
  }, [tableApplications, first, rows]);

  const donutData = useMemo(() => {
    return {
      labels: ["Pending", "Approved", "Rejected", "Forwarded", "Reverted"],
      datasets: [
        {
          data: [
            statusCounts.PENDING,
            statusCounts.APPROVED,
            statusCounts.REJECTED,
            statusCounts.FORWARDED,
            statusCounts.REVERTED,
          ],
          backgroundColor: [
            DONUT_COLORS.PENDING.bg,
            DONUT_COLORS.APPROVED.bg,
            DONUT_COLORS.REJECTED.bg,
            DONUT_COLORS.FORWARDED.bg,
            DONUT_COLORS.REVERTED.bg,
          ],
          hoverBackgroundColor: [
            DONUT_COLORS.PENDING.hover,
            DONUT_COLORS.APPROVED.hover,
            DONUT_COLORS.REJECTED.hover,
            DONUT_COLORS.FORWARDED.hover,
            DONUT_COLORS.REVERTED.hover,
          ],
        },
      ],
    };
  }, [statusCounts]);

  const donutOptions = {
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
        },
      },
    },
  };

  const scheme = useMemo(() => {
    if (!selectedSchemeCode) return null;

    return schemes.find((s: any) => s.id === selectedSchemeCode);
  }, [schemes, selectedSchemeCode]);

  const formLabelOverrides = useMemo(() => {
    const sections = scheme?.form_structure_json?.sections;

    if (!Array.isArray(sections)) return {};

    const map: Record<string, string> = {};

    sections.forEach((section: any) => {
      section?.fields?.forEach((field: any) => {
        if (field?.field_code && field?.label_override) {
          map[field.field_code] = field.label_override;
        }
      });
    });

    return map;
  }, [scheme]);

  const tableColumns = useMemo(() => {
    const rawCols = scheme?.admin_view_config?.tableColumns;

    if (!Array.isArray(rawCols)) return [];

    return rawCols
      .map((col: any) => {
        if (!col || !Array.isArray(col.fields)) return null;

        const isMerged = col.fields.length > 1;

        // 🔹 MERGED COLUMN
        if (isMerged) {
          return {
            key: col.key,
            label: col.label || col.key,
            fields: col.fields,
            showFieldLabels: col.showFieldLabels ?? false,
            source: col.source || "FORM",
          };
        }

        // 🔹 SINGLE FIELD COLUMN
        const rawKey = col.fields[0];
        const fieldKey = String(rawKey).trim().toUpperCase();

        const label =
          formLabelOverrides?.[fieldKey] || // 1️⃣ Override
          fieldMasterMap?.[fieldKey] || // 2️⃣ Master table
          rawKey; // 3️⃣ Fallback

        return {
          key: col.key || rawKey,
          label,
          fields: col.fields,
          showFieldLabels: false,
          source: col.source || "FORM",
        };
      })
      .filter(Boolean);
  }, [scheme, formLabelOverrides, fieldMasterMap]);

  const resolveCellValue = (app: any, column: any) => {
    const formData =
      typeof app.postData === "string"
        ? JSON.parse(app.postData)
        : app.postData || {};

    if (!column?.fields?.length) return "-";

    // 🔹 MERGED COLUMN
    if (column.fields.length > 1) {
      const values = column.fields
        .map((fieldKey: string) => {
          const value = formData?.[fieldKey];
          if (!value) return null;

          if (column.showFieldLabels) {
            const key = String(fieldKey).trim().toUpperCase();

            const label =
              formLabelOverrides?.[key] || fieldMasterMap?.[key] || fieldKey;

            return `${label}: ${value}`;
          }

          return value;
        })
        .filter(Boolean);

      return values.length
        ? values.join(column.showFieldLabels ? "\n" : " ")
        : "-";
    }

    // 🔹 SINGLE FIELD
    const fieldKey = column.fields[0];
    return formData?.[fieldKey] ?? "-";
  };

  return (
    <div className="card shadow-sm p-4">
      {/* Header */}
      <div className="mb-4">
        <h5 className="fw-semibold mb-1">Incentive Dashboard</h5>
        <p className="text-muted small mb-0">
          View and manage incentive applications
        </p>
      </div>

      {/* Filters */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="fw-semibold small mb-3">Policy</label>
            <Dropdown
              className="w-100"
              value={selectedPolicyId}
              options={policyOptions}
              placeholder="Select Policy"
              filter
              onChange={(e) => {
                setSelectedPolicyId(e.value);
                setSelectedSchemeCode(null);
              }}
            />
          </div>

          <div className="col-md-4">
            <label className="fw-semibold small mb-3">Scheme</label>
            <Dropdown
              className="w-100"
              value={selectedSchemeCode}
              options={filteredSchemes}
              placeholder={
                selectedPolicyId ? "Select Scheme" : "Select Policy first"
              }
              disabled={!selectedPolicyId}
              onChange={(e) => setSelectedSchemeCode(e.value)}
            />
          </div>
        </div>
      </div>

      {/* Status Cards */}
      {selectedSchemeCode && (
        <div className="row g-4 mb-4">
          {/* LEFT: Status Cards */}
          <div className="col-md-6">
            <div className="row g-3">
              {[
                ["Total Applications", statusCounts.TOTAL, "TOTAL"],
                ["Reverted", statusCounts.REVERTED, "REVERTED"],
                ["Pending", statusCounts.PENDING, "PENDING"],
                ["Rejected", statusCounts.REJECTED, "REJECTED"],
                ["Forwarded", statusCounts.FORWARDED, "FORWARDED"],
                ["Approved", statusCounts.APPROVED, "APPROVED"],
              ].map(([label, count, status]) => {
                const styles = STATUS_CARD_CLASSES[status as string];

                return (
                  <div key={status as string} className="col-md-4">
                    <div
                      onClick={() => handleCardClick(status as string)}
                      className={`
                                    card
                                    ${styles.bg}
                                    border ${styles.border}
                                    rounded-4
                                    p-3
                                    cursor-pointer
                                    transition
                                    position-relative
                                    ${selectedStatus === status ? "border-2 shadow-sm" : "hover-shadow"}
                                    `}
                    >
                      {/* Text (LEFT) */}
                      <div className="text-start">
                        <div className="small text-muted">{label}</div>
                        <div className="fs-3 fw-semibold">
                          {isLoading ? "…" : count}
                        </div>
                      </div>

                      {/* Arrow (BOTTOM-RIGHT | SAME COLOR AS CARD BORDER) */}
                      <div
                        className={`
        position-absolute
        d-flex
        align-items-center
        justify-content-center
        rounded-circle
        ${styles.border}
        ${styles.border.replace("border-", "text-")}
      `}
                        style={{
                          bottom: "10px",
                          right: "10px",
                          width: "28px",
                          height: "28px",
                        }}
                      >
                        <i
                          className="pi pi-arrow-right"
                          style={{ fontSize: "0.9rem" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Donut Chart */}
          <div className="col-md-6">
            <div className="card shadow-sm p-4 h-100 d-flex align-items-center justify-content-center">
              <div className="w-100">
                <h6 className="fw-semibold mb-3 text-center">
                  Application Status Distribution
                </h6>

                {isLoading ? (
                  <div className="text-center text-muted">Loading chart…</div>
                ) : statusCounts.TOTAL === 0 ? (
                  <div className="text-center text-muted">
                    No applications found for selected scheme
                  </div>
                ) : (
                  <Chart
                    type="doughnut"
                    data={donutData}
                    options={donutOptions}
                    style={{ maxWidth: "360px", margin: "0 auto" }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPLICATION TABLE ================= */}
      {selectedStatus && (
        <div className="card shadow-sm p-4 mt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-semibold mb-0">
              {selectedStatus === "TOTAL"
                ? "All Applications"
                : `${selectedStatus} Applications`}
            </h6>

            <span className="text-muted small">
              {tableApplications.length} records
            </span>
          </div>

          {tableApplications.length === 0 ? (
            <div className="text-center text-muted">No applications found</div>
          ) : (
            <div className="table-responsive">
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>S.No.</th>
                      <th>Registration No.</th>
                      {tableColumns.map((col: any) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                      <th>Application Status</th>
                      <th>Submitted On</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedApplications.map((app: any, index: number) => (
                      <tr key={app.id}>
                        <td>{first + index + 1}</td>
                        <td>{app.registrationNo}</td>
                        {tableColumns.map((col: any) => (
                          <td key={col.key} style={{ whiteSpace: "pre-line" }}>
                            {resolveCellValue(app, col)}
                          </td>
                        ))}

                        <td>{app.applicationStatus}</td>
                        <td>
                          {app.createdOn
                            ? new Date(app.createdOn).toLocaleString("en-GB")
                            : "-"}
                        </td>

                        <td>
                          <button
                            className="btn btn-outline-primary px-2 mx-auto my-2"
                            style={{
                              padding: "0 2px",
                              fontSize: "0.9rem",
                              height: "20px",
                            }}
                            onClick={() =>
                              window.open(
                                `/department/incentive/applications/${app.id}`,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Paginator
                  first={first}
                  rows={rows}
                  totalRecords={tableApplications.length}
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  onPageChange={(e) => {
                    setFirst(e.first);
                    setRows(e.rows);
                  }}
                  className="mt-3"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
