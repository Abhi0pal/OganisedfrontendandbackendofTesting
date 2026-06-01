import React, { useMemo, useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useQueries } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

type FlowLog = {
  id?: number;
  applicationId: number;
  currentRoleId: number;
  actionStatus: string; // e.g., "APPROVED", "DISBURSED"
  createdDate: string; // ISO
  modifiedOn?: string | null; // ISO
  approvedAmountByDepartment?: string | null;
  disbursedAmountByDepartment?: string | null;
};

type Application = {
  id: number;
  userId: number;
  incentiveId?: number | null;
  cafId?: number | null;
  parentAppId?: number | null;
  departmentId: number | null;
  districtId?: number | null;
  /** ⬇️ Added for sub-sector filter compatibility */
  subSectorId?: number | null;
  /** Fallback if your API still has sectorId */
  sectorId?: number | null;

  unitName?: string | null;
  registrationNo?: string;
  postData?: Record<string, any>;
  amount?: number | null;
  applicationStatus:
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "DISBURSED"
    | string;
  status: string;
  createdOn: string; // ISO
  modifiedOn?: string; // ISO
  installmentNo?: number | null;
  fy?: string | null;
  certificateNumber?: string | null;
  flowLogs?: FlowLog[];
};

type Props = {
  application: Application[];
  isLoading: boolean;
  selectedPolicyId: number | null;
  selectedSchemeCode: number | null;

  // Lookups
  policyNameById?: Record<number, string>;
  schemeNameById?: Record<number, string>;
  districtNameById?: Record<number, string>;
  policyNameBySchemeId?: Record<number, string>;

  /** ⬇️ NEW: pass sub-sector lookups */
  subSectorNameById?: Record<number, string>;
  /** ⬇️ NEW: the selected sub-sector id from the dropdown/filter */
  selectedSubSectorId?: number | null;
};

const dayDiff = (aISO: string, bISO: string) => {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.round((b - a) / msPerDay));
};

const median = (nums: number[]) => {
  if (!nums.length) return null;
  const sorted = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const calculateApplicantDelay = (logs: FlowLog[]) => {
  if (!logs || logs.length === 0) return 0;

  let totalDelayMs = 0;
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  );

  for (let i = 0; i < sortedLogs.length - 1; i++) {
    // ASSUMPTION: Role ID 1 is the Applicant.
    if (sortedLogs[i].currentRoleId === 1) {
      const start = new Date(sortedLogs[i].createdDate).getTime();
      const end = new Date(sortedLogs[i + 1].createdDate).getTime();
      totalDelayMs += end - start;
    }
  }

  return totalDelayMs / (1000 * 60 * 60 * 24); // days
};

const getStatusBadgeClass = (status: string) => {
  const s = status?.toUpperCase();
  if (s === "SUBMITTED") return "badge bg-primary";
  if (s === "APPROVED") return "badge bg-success";
  if (s === "DISBURSED") return "badge bg-secondary";
  if (s === "REJECTED") return "badge bg-danger";
  return "badge bg-secondary";
};

const getDelayLabel = (netDays: number | null | undefined) => {
  if (netDays == null) return "-";
  if (netDays > 30) return "Delayed (> 30 days)";
  if (netDays < 10) return "Expedited (< 10 days)";
  return "-";
};

const parseApprovedAmount = (val?: string | null): number | null => {
  if (val == null) return null;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const sortLogsByTimeAsc = (logs: FlowLog[]) => {
  const getT = (x: FlowLog) =>
    new Date(x.modifiedOn || x.createdDate || 0).getTime();
  return [...logs].sort((a, b) => getT(a) - getT(b));
};

const pickAmountsAndDisbursement = (logs: FlowLog[]) => {
  if (!logs?.length) {
    return {
      approvedAmount: null as number | null,
      disbursedAmount: null as number | null,
      disbursedDate: null as string | null,
    };
  }

  const sorted = sortLogsByTimeAsc(logs); // asc
  const rev = [...sorted].reverse(); // latest first

  const eq = (row?: FlowLog, status?: string) =>
    row && (row.actionStatus || "").toUpperCase() === status?.toUpperCase();

  const disbursed = rev.find((l) => eq(l, "DISBURSED"));
  const approved = rev.find((l) => eq(l, "APPROVED"));

  const parseAmt = (row?: FlowLog): number | null => {
    if (!row) return null;
    const raw =
      row.disbursedAmountByDepartment ?? row.approvedAmountByDepartment ?? null;
    return parseApprovedAmount(raw);
  };

  const disbursedAmount = parseAmt(disbursed);
  const approvedAmount = parseAmt(approved);
  const disbursedDate =
    (disbursed?.modifiedOn &&
    new Date(disbursed.modifiedOn).toString() !== "Invalid Date"
      ? disbursed.modifiedOn
      : disbursed?.createdDate) ?? null;

  return { approvedAmount, disbursedAmount, disbursedDate };
};

const formatINR = (value?: number | null) => {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

export const IncentiveMetricsTable: React.FC<Props & { logs?: FlowLog[] }> = ({
  application,
  isLoading,
  selectedPolicyId,
  selectedSchemeCode,
  policyNameById = {},
  schemeNameById = {},
  districtNameById = {},
  policyNameBySchemeId = {},

  /** ⬇️ new props for sub-sector integration */
  subSectorNameById = {},
  selectedSubSectorId = null,
}) => {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Fetch flowlogs per application using React Query's useQueries
  const flowlogQueries = useQueries({
    queries: application.map((app) => ({
      // ✅ Use primitive key: no object identity issues
      queryKey: ["incentive-application-flowlog", app.id],
      enabled: !!app.id,
      queryFn: async () => {
        const res = await apiClient.get(
          `/incentive-application-flowlog?applicationId=${app.id}`,
        );
        return res.data as FlowLog[];
      },
    })),
  });

  // Build a map: appId -> flowlogs
  const flowlogsByAppId = useMemo(() => {
    const map = new Map<number, FlowLog[]>();
    flowlogQueries.forEach((q, idx) => {
      const appId = application[idx]?.id;
      if (appId != null) {
        map.set(appId, (q.data as FlowLog[] | undefined) ?? []);
      }
    });
    return map;
  }, [flowlogQueries, application]);

  // Strict per-app log getter (filters by applicationId as a final guard)
  const getAppLogs = useCallback(
    (appId: number): FlowLog[] => {
      const logs = flowlogsByAppId.get(appId) ?? [];
      return logs.filter((l) => Number(l?.applicationId) === Number(appId));
    },
    [flowlogsByAppId],
  );

  const metrics = useMemo(() => {
    const total = application.length;

    const disbursedCount = application.filter(
      (a) => a.applicationStatus === "DISBURSED",
    ).length;
    const approvedCount = application.filter(
      (a) =>
        a.applicationStatus === "APPROVED" ||
        a.applicationStatus === "DISBURSED",
    ).length;
    const submittedCount = application.filter(
      (a) => a.applicationStatus !== "DRAFT",
    ).length;

    // Period
    let minCreated: string | null = null;
    let maxCreated: string | null = null;
    for (const a of application) {
      if (!minCreated || new Date(a.createdOn) < new Date(minCreated))
        minCreated = a.createdOn;
      if (!maxCreated || new Date(a.createdOn) > new Date(maxCreated))
        maxCreated = a.createdOn;
    }

    // Net processing days
    // Net processing days
    const completedOrApprovedApps = application.filter(
      (a) =>
        a.applicationStatus === "DISBURSED" ||
        a.applicationStatus === "APPROVED",
    );
    const netTimes: number[] = completedOrApprovedApps.map((app) => {
      const endISO =
        app.modifiedOn && !Number.isNaN(new Date(app.modifiedOn).getTime())
          ? app.modifiedOn
          : new Date().toISOString();

      const totalTime = dayDiff(app.createdOn, endISO) || 0;

      const logs = getAppLogs(app.id);

      const applicantDelay = calculateApplicantDelay(logs);
      return Math.max(0, totalTime - applicantDelay);
    });

    const totalNetTime = netTimes.reduce((acc, curr) => acc + curr, 0);
    const averageProcessingTime =
      netTimes.length > 0 ? totalNetTime / netTimes.length : null;
    const medianTime = median(netTimes);
    const minTime = netTimes.length ? Math.min(...netTimes) : null;
    const maxTime = netTimes.length ? Math.max(...netTimes) : null;

    // Names
    const schemeName =
      selectedSchemeCode != null
        ? (schemeNameById[Number(selectedSchemeCode)] ??
          `Scheme #${selectedSchemeCode}`)
        : "-";

    const policyName = selectedSchemeCode
      ? (policyNameBySchemeId[selectedSchemeCode] ??
        policyNameById[selectedPolicyId || 0] ??
        "-")
      : selectedPolicyId
        ? policyNameById[selectedPolicyId]
        : "-";

    // ⬇️ Sub-Sector Label: prefer the selected filter value; else compute the most frequent in data
    // Prefer subSectorId; fallback to sectorId if backend not updated
    const subSectorCounts = new Map<string, number>();
    const countKey = (id?: number | null) => {
      if (id == null) return "-";
      return subSectorNameById[id] ?? `Sector #${id}`;
    };

    for (const a of application) {
      const id = a.subSectorId ?? a.sectorId ?? null;
      const label =
        selectedSubSectorId != null
          ? (subSectorNameById[selectedSubSectorId] ??
            `Sector #${selectedSubSectorId}`)
          : countKey(id);
      subSectorCounts.set(label, (subSectorCounts.get(label) ?? 0) + 1);
    }

    let subSectorLabel = "-";
    if (selectedSubSectorId != null) {
      subSectorLabel =
        subSectorNameById[selectedSubSectorId] ??
        `Sector #${selectedSubSectorId}`;
    } else {
      // pick the most frequent label
      let max = 0;
      for (const [label, count] of subSectorCounts.entries()) {
        if (count > max) {
          max = count;
          subSectorLabel = label;
        }
      }
    }

    // District label (most frequent)
    const districtCounts = new Map<string, number>();
    for (const a of application) {
      const name =
        a.districtId != null
          ? (districtNameById[Number(a.districtId)] ??
            `District #${a.districtId}`)
          : "-";
      districtCounts.set(name, (districtCounts.get(name) ?? 0) + 1);
    }

    let districtLabel = "-";
    let maxCount = 0;
    for (const [label, count] of districtCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        districtLabel = label;
      }
    }

    return {
      metricLabel: `${schemeName} for ${policyName}`,
      schemeName: `${schemeName} Scheme`,
      subSector: subSectorLabel,
      districtLabel,
      applicationPeriod:
        minCreated && maxCreated
          ? `${formatDate(minCreated)} – ${formatDate(maxCreated)}`
          : "-",
      totalReceived: total,
      submittedCount,
      approvedCount,
      disbursedCount,
      averageDays:
        averageProcessingTime !== null ? averageProcessingTime.toFixed(2) : "-",
      medianDays: medianTime !== null ? medianTime.toFixed(2) : "-",
      minDays: minTime !== null ? Math.round(minTime) : "-",
      maxDays: maxTime !== null ? Math.round(maxTime) : "-",
    };
  }, [
    application,
    selectedPolicyId,
    selectedSchemeCode,
    policyNameById,
    schemeNameById,
    districtNameById,
    policyNameBySchemeId,
    subSectorNameById,
    selectedSubSectorId,
  ]);

  const computedApps = useMemo(() => {
    return application.map((app) => {
      const endISO =
        app.modifiedOn && !Number.isNaN(new Date(app.modifiedOn).getTime())
          ? app.modifiedOn
          : new Date().toISOString();

      const totalTime = dayDiff(app.createdOn, endISO) || 0;

      const logs = getAppLogs(app.id);
      const applicantDelay = calculateApplicantDelay(logs);
      const netDays = Math.max(0, totalTime - applicantDelay);
      const indicatorLabel = getDelayLabel(netDays);

      const { approvedAmount, disbursedAmount, disbursedDate } =
        pickAmountsAndDisbursement(logs);

      const finalAmount = disbursedAmount ?? approvedAmount ?? null;
      const finalDisbursementDate = disbursedDate;

      return {
        ...app,
        netDays,
        indicatorLabel,
        disbursementDate: finalDisbursementDate,
        amount: finalAmount,
        districtName:
          app.districtId != null
            ? (districtNameById?.[Number(app.districtId)] ??
              `District #${app.districtId}`)
            : "-",
      };
    });
  }, [application, districtNameById, flowlogsByAppId, getAppLogs]);
  // Delayed / Expedited slices (based on netDays)
  const delayedApps = useMemo(
    () => computedApps.filter((a) => (a.netDays ?? 0) > 30),
    [computedApps],
  );
  const expeditedApps = useMemo(
    () => computedApps.filter((a) => (a.netDays ?? 0) < 10),
    [computedApps],
  );
  const exportToXLSX = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // --- METRICS (Grouped) sheet ---
    const metricsHeader = [
      "Metric",
      "Scheme",
      "Sector", // or "Sub-Sector"
      "District",
      "Application Period (Global)", // min(createdOn) – max(createdOn/modifiedOn)
      "Applications Received",
      "Applications Approved",
      "Applications Disbursed",
      "Average Processing Time (Days)",
      "Median Time (Days)",
      "Minimum Time (Days)",
      "Maximum Time (Days)",
    ];

    const metricsRows = groupedMetrics.map((g) => [
      `${g.schemeLabel} for ${g.policyLabel}`, // Metric label (can be customized)
      g.schemeLabel,
      g.sectorLabel,
      g.districtLabel,
      globalPeriodLabel,
      g.totalReceived,
      g.approvedCount,
      g.disbursedCount,
      g.averageDays != null ? Number(g.averageDays.toFixed(2)) : "-",
      g.medianDays != null ? Number(g.medianDays.toFixed(2)) : "-",
      g.minDays != null ? Math.round(g.minDays) : "-",
      g.maxDays != null ? Math.round(g.maxDays) : "-",
    ]);

    const metricsAOA = [metricsHeader, ...metricsRows];
    const wsMetrics = XLSX.utils.aoa_to_sheet(metricsAOA);

    // Column widths (tweak as needed)
    (wsMetrics as any)["!cols"] = [
      { wch: 30 }, // Metric
      { wch: 28 }, // Scheme
      { wch: 24 }, // Sector
      { wch: 24 }, // District
      { wch: 34 }, // Period
      { wch: 20 }, // Received
      { wch: 20 }, // Approved
      { wch: 20 }, // Disbursed
      { wch: 30 }, // Avg
      { wch: 22 }, // Median
      { wch: 22 }, // Min
      { wch: 22 }, // Max
    ];

    // Optional simple styling (works with xlsx-js-style if you swap the import)
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
        left: { style: "thin", color: { rgb: "FFCCCCCC" } },
        right: { style: "thin", color: { rgb: "FFCCCCCC" } },
      },
    };
    const bodyStyle = {
      alignment: { vertical: "top", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "FFEEEEEE" } },
        bottom: { style: "thin", color: { rgb: "FFEEEEEE" } },
        left: { style: "thin", color: { rgb: "FFEEEEEE" } },
        right: { style: "thin", color: { rgb: "FFEEEEEE" } },
      },
    };

    const styleRange = (
      ws: XLSX.WorkSheet,
      range: { s: { r: number; c: number }; e: { r: number; c: number } },
      style: any,
    ) => {
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[addr]) continue;
          (ws as any)[addr].s = style;
        }
      }
    };

    // Style as you already do...
    styleRange(
      wsMetrics,
      { s: { r: 0, c: 0 }, e: { r: 0, c: metricsHeader.length - 1 } },
      headerStyle,
    );
    styleRange(
      wsMetrics,
      {
        s: { r: 1, c: 0 },
        e: { r: metricsAOA.length - 1, c: metricsHeader.length - 1 },
      },
      bodyStyle,
    );

    (wsMetrics as any)["!rows"] = [{ hpt: 28 }];

    XLSX.utils.book_append_sheet(wb, wsMetrics, "Metrics (Grouped)");

    // --- APPLICATIONS sheet ---
    const appsHeader = [
      "S.No.",
      "Application ID",
      "Unit Name",
      "Registration No",
      "District",
      "Created On",
      "Modified On",
      "Status",
      "Net Processing Days",
      "Timing",
      "Amount",
      "Date of Disbursement",
    ];

    const appsRows = computedApps.map((a, idx) => [
      idx + 1,
      a.id,
      a.unitName ?? "-",
      a.registrationNo ?? "-",
      a.districtName,
      formatDate(a.createdOn),
      formatDate(a.modifiedOn),
      a.applicationStatus,
      a.netDays ?? "-",
      a.indicatorLabel,
      typeof a.amount === "number" ? a.amount : "-",
      formatDate(a.disbursementDate),
    ]);

    const appsAOA = [appsHeader, ...appsRows];
    const wsApps = XLSX.utils.aoa_to_sheet(appsAOA);

    (wsApps as any)["!cols"] = [
      { wch: 7 },
      { wch: 14 },
      { wch: 28 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
    ];

    styleRange(
      wsApps,
      { s: { r: 0, c: 0 }, e: { r: 0, c: appsHeader.length - 1 } },
      headerStyle,
    );
    styleRange(
      wsApps,
      {
        s: { r: 1, c: 0 },
        e: { r: appsAOA.length - 1, c: appsHeader.length - 1 },
      },
      bodyStyle,
    );
    (wsApps as any)["!rows"] = [{ hpt: 28 }];

    XLSX.utils.book_append_sheet(wb, wsApps, "Applications");
    XLSX.writeFile(wb, "incentive_metrics.xlsx");
  }, [metrics, computedApps]);

  const exportToPDF = useCallback(async () => {
    if (!exportRef.current) return;
    const container = exportRef.current;

    const prevExpanded = expanded;
    const expandAll: Record<number, boolean> = {};
    computedApps.forEach((a) => (expandAll[a.id] = true));
    setExpanded(expandAll);

    await new Promise((r) => setTimeout(r, 250));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: container.scrollWidth,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight < pageHeight - 40) {
      pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 20;

      pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = 20 - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    pdf.save("incentive_metrics.pdf");
    setExpanded(prevExpanded);
  }, [expanded, computedApps]);
  // ─────────────────────────────────────────────────────────────────────────────
  // GLOBAL PERIOD (min createdOn, max among createdOn/modifiedOn across ALL apps)
  // ─────────────────────────────────────────────────────────────────────────────
  const globalPeriod = useMemo(() => {
    if (!application?.length)
      return { min: null as string | null, max: null as string | null };

    let minCreated: number | null = null;
    let maxAny: number | null = null;

    for (const a of application) {
      const tCreated = new Date(a.createdOn).getTime();
      if (!Number.isNaN(tCreated)) {
        if (minCreated === null || tCreated < minCreated) minCreated = tCreated;
        if (maxAny === null || tCreated > maxAny) maxAny = tCreated;
      }

      // consider modifiedOn as well
      if (a.modifiedOn) {
        const tMod = new Date(a.modifiedOn).getTime();
        if (!Number.isNaN(tMod)) {
          if (maxAny === null || tMod > maxAny) maxAny = tMod;
        }
      }
    }

    return {
      min: minCreated ? new Date(minCreated).toISOString() : null,
      max: maxAny ? new Date(maxAny).toISOString() : null,
    };
  }, [application]);

  // Useful: the display string users see (same for all groups per your requirement)
  const globalPeriodLabel = useMemo(() => {
    if (!globalPeriod.min || !globalPeriod.max) return "-";
    return `${formatDate(globalPeriod.min)} – ${formatDate(globalPeriod.max)}`;
  }, [globalPeriod]);

  // ─────────────────────────────────────────────────────────────────────────────
  // GROUPED METRICS by (Scheme × Sector/Sub-sector × District)
  // ─────────────────────────────────────────────────────────────────────────────
  type GroupRow = {
    key: string;
    schemeLabel: string;
    policyLabel: string;
    sectorLabel: string;
    districtLabel: string;
    totalReceived: number;
    submittedCount: number;
    approvedCount: number;
    disbursedCount: number;
    averageDays: number | null;
    medianDays: number | null;
    minDays: number | null;
    maxDays: number | null;
    appIds: number[];

    // NEW: per-metrics-row bifurcation
    delayedCount: number;
    expeditedCount: number;
    delayedAppIds: number[];
    expeditedAppIds: number[];
  };

  const getSchemeLabel = (a: Application): string => {
    // Prefer lookup by incentiveId (actual scheme of the application)
    if (a.incentiveId != null && schemeNameById?.[Number(a.incentiveId)]) {
      return schemeNameById[Number(a.incentiveId)];
    }
    // fallback to current selection, or label by id
    if (
      selectedSchemeCode != null &&
      schemeNameById?.[Number(selectedSchemeCode)]
    ) {
      return schemeNameById[Number(selectedSchemeCode)];
    }
    return a.incentiveId != null ? `Scheme #${a.incentiveId}` : "-";
  };

  const getSectorLabel = (a: Application): string => {
    // Prefer subSectorId; fallback to sectorId for legacy
    const id = (a as any).subSectorId ?? a.sectorId ?? null;
    if (id == null) return "-";
    return subSectorNameById?.[Number(id)] ?? `Sector #${id}`;
  };

  const getDistrictLabel = (a: Application): string => {
    if (a.districtId == null) return "-";
    return (
      districtNameById?.[Number(a.districtId)] ?? `District #${a.districtId}`
    );
  };

  const getPolicyLabelFromApp = (a: Application): string => {
    const schemeId = a.incentiveId != null ? Number(a.incentiveId) : null;
    if (schemeId != null && policyNameBySchemeId?.[schemeId]) {
      return policyNameBySchemeId[schemeId];
    }
    // fallback to currently selected policy if present
    if (selectedPolicyId != null && policyNameById?.[selectedPolicyId]) {
      return policyNameById[selectedPolicyId];
    }
    return "-";
  };

  const groupedMetrics = useMemo<GroupRow[]>(() => {
    if (!application?.length) return [];

    const getNetDays = (a: Application): number => {
      const endISO =
        a.modifiedOn && !Number.isNaN(new Date(a.modifiedOn).getTime())
          ? a.modifiedOn
          : new Date().toISOString();
      const totalTime = dayDiff(a.createdOn, endISO) || 0;
      const logs = getAppLogs(a.id);
      const applicantDelay = calculateApplicantDelay(logs);
      return Math.max(0, totalTime - applicantDelay);
    };

    type Bucket = {
      schemeLabel: string;
      policyLabel: string;
      sectorLabel: string;
      districtLabel: string;
      apps: Application[];
      netDays: number[];
      submittedCount: number;
      approvedCount: number;
      disbursedCount: number;

      delayedIds: number[];
      expeditedIds: number[];
    };

    const map = new Map<string, Bucket>();

    for (const a of application) {
      const schemeLabel = getSchemeLabel(a);
      const policyLabel = getPolicyLabelFromApp(a);
      const sectorLabel = getSectorLabel(a);
      const districtLabel = getDistrictLabel(a);

      const key = `${schemeLabel}||${sectorLabel}||${districtLabel}`;

      if (!map.has(key)) {
        map.set(key, {
          schemeLabel,
          policyLabel,
          sectorLabel,
          districtLabel,
          apps: [],
          netDays: [],
          submittedCount: 0,
          approvedCount: 0,
          disbursedCount: 0,
          delayedIds: [],
          expeditedIds: [],
        });
      }
      const bucket = map.get(key)!;
      bucket.apps.push(a);

      // per-app netDays
      const nd = getNetDays(a);
      bucket.netDays.push(nd);

      // classify
      if (nd > 30) bucket.delayedIds.push(a.id);
      else if (nd < 10) bucket.expeditedIds.push(a.id);

      // status counts
      const st = (a.applicationStatus || "").toUpperCase();
      if (st === "SUBMITTED" || st === "APPROVED" || st === "DISBURSED") {
        bucket.submittedCount += 1;
      }
      if (st === "APPROVED" || st === "DISBURSED") {
        bucket.approvedCount += 1;
      }
      if (st === "DISBURSED") {
        bucket.disbursedCount += 1;
      }
    }

    const rows: GroupRow[] = [];
    for (const [key, b] of map.entries()) {
      const nds = b.netDays;
      const avg = nds.length
        ? nds.reduce((x, y) => x + y, 0) / nds.length
        : null;
      const med = median(nds);
      const min = nds.length ? Math.min(...nds) : null;
      const max = nds.length ? Math.max(...nds) : null;

      rows.push({
        key,
        schemeLabel: b.schemeLabel,
        policyLabel: b.policyLabel,
        sectorLabel: b.sectorLabel,
        districtLabel: b.districtLabel,
        totalReceived: b.apps.length,
        submittedCount: b.submittedCount,
        approvedCount: b.approvedCount,
        disbursedCount: b.disbursedCount,
        averageDays: avg,
        medianDays: med,
        minDays: min,
        maxDays: max,
        appIds: b.apps.map((a) => a.id),
        delayedCount: b.delayedIds.length,
        expeditedCount: b.expeditedIds.length,
        delayedAppIds: b.delayedIds.slice(),
        expeditedAppIds: b.expeditedIds.slice(),
      });
    }

    rows.sort(
      (a, b) =>
        a.schemeLabel.localeCompare(b.schemeLabel) ||
        a.sectorLabel.localeCompare(b.sectorLabel) ||
        a.districtLabel.localeCompare(b.districtLabel),
    );

    return rows;
  }, [
    application,
    schemeNameById,
    policyNameBySchemeId,
    policyNameById,
    selectedPolicyId,
    subSectorNameById,
    districtNameById,
    getAppLogs,
  ]);
  if (isLoading) {
    return <div className="p-4 text-sm text-gray-600">Loading metrics…</div>;
  }

  if (!application?.length) {
    return (
      <div className="p-4 text-sm text-gray-600">
        No applications found for the selected policy/scheme.
      </div>
    );
  }

  return (
    <div className="mb-3">
      {/* Toolbar with status badges and export buttons */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary">
            Submitted: {metrics.submittedCount}
          </span>
          <span className="badge bg-success">
            Approved: {metrics.approvedCount}
          </span>
          <span className="badge bg-secondary">
            Disbursed: {metrics.disbursedCount}
          </span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-primary rounded-5 btn-sm"
            onClick={exportToPDF}
            title="Export page to PDF"
          >
            📄 Export PDF
          </button>
          <button
            type="button"
            className="btn btn-outline-primary rounded-5 btn-sm"
            onClick={exportToXLSX}
            title="Export data to XLSX"
          >
            📊 Export XLSX
          </button>
        </div>
      </div>

      <div ref={exportRef}>
        {/* Metrics summary table */}
        <div className="table-responsive mb-4">
          <table className="table table-bordered table-hover table-sm">
            <thead className="table-light text-center">
              <tr>
                <th className="px-3 text-center">Metric</th>
                <th className="px-3 text-center">Scheme</th>
                <th className="px-3 text-center">Sector</th>
                <th className="px-3 text-center">District</th>
                <th className="px-3 text-center">Application Period</th>
                <th className="px-3 text-center">Applications Received</th>
                <th className="px-3 text-center">Applications Approved</th>
                <th className="px-3 text-center">Applications Disbursed</th>
                <th className="px-3 text-center">Delayed (&gt; 30)</th>
                <th className="px-3 text-center">Expedited (&lt; 10)</th>
                <th className="px-3 text-center">
                  Average Processing Time (Days)
                </th>
                <th className="px-3 text-center">Median Time (Days)</th>
                <th className="px-3 text-center">Minimum Time (Days)</th>
                <th className="px-3 text-center">Maximum Time (Days)</th>
                <th className="px-3 text-center" style={{ width: 90 }}>
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedMetrics.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center text-muted">
                    No data
                  </td>
                </tr>
              ) : (
                groupedMetrics.map((g, rowIdx) => {
                  const isOpen = !!expanded[g.key];
                  const toggle = () =>
                    setExpanded((prev) => ({ ...prev, [g.key]: !prev[g.key] }));

                  const detailsRowId = `metrics-details-${rowIdx}`;

                  return (
                    <React.Fragment key={`metrics-row-${g.key}`}>
                      <tr key={g.key} className="border-top">
                        <td className="px-3 text-left">
                          {`${g.schemeLabel} for ${g.policyLabel}`}
                          {/* ⬅️ Metric shows both */}
                        </td>

                        <td className="px-3 text-left">
                          {g.schemeLabel}
                          {" Scheme"}
                        </td>
                        <td className="px-3 text-left">{g.sectorLabel}</td>
                        <td className="px-3 text-left">{g.districtLabel}</td>
                        <td className="px-3 text-left">{globalPeriodLabel}</td>
                        <td className="px-3 text-center">{g.totalReceived}</td>
                        <td className="px-3 text-center">{g.approvedCount}</td>
                        <td className="px-3 text-center">{g.disbursedCount}</td>
                        <td className="px-3 text-center">
                          <span className="badge bg-danger">
                            {g.delayedCount}
                          </span>
                        </td>
                        <td className="px-3 text-center">
                          <span className="badge bg-success">
                            {g.expeditedCount}
                          </span>
                        </td>
                        <td className="px-3 text-center">
                          {g.averageDays != null
                            ? g.averageDays.toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-3 text-center">
                          {g.medianDays != null ? g.medianDays.toFixed(2) : "-"}
                        </td>
                        <td className="px-3 text-center">
                          {g.minDays != null ? Math.round(g.minDays) : "-"}
                        </td>
                        <td className="px-3 text-center">
                          {g.maxDays != null ? Math.round(g.maxDays) : "-"}
                        </td>
                        <td className="px-3 text-center">
                          <button
                            type="button"
                            className="btn btn-link btn-sm"
                            onClick={toggle}
                            aria-expanded={isOpen}
                            aria-controls={detailsRowId}
                            title={isOpen ? "Hide details" : "View details"}
                          >
                            {isOpen ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr id={detailsRowId} className="table-active">
                          {/* colSpan equals total columns in header */}
                          <td colSpan={15}>
                            {/* Two cards: Delayed + Expedited, filtered to this group */}
                            <div className="row g-3">
                              {/* Delayed */}
                              <div className="col-12 col-lg-6">
                                <div className="card h-100">
                                  <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="fw-semibold">
                                      Delayed (&gt; 30 days)
                                    </div>
                                    <span className="badge bg-danger">
                                      {g.delayedCount}
                                    </span>
                                  </div>
                                  <div className="card-body p-2">
                                    {g.delayedAppIds.length === 0 ? (
                                      <div className="text-muted small">
                                        No delayed applications for this metrics
                                        row.
                                      </div>
                                    ) : (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr className="text-center">
                                              <th style={{ width: 50 }}>
                                                S.No.
                                              </th>
                                              <th>App ID</th>
                                              <th>Unit / Registration</th>
                                              <th>Net Days</th>
                                              <th>Amount</th>
                                              <th>Disbursed On</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {computedApps
                                              .filter((a) =>
                                                g.delayedAppIds.includes(a.id),
                                              )
                                              .map((a, i) => (
                                                <tr
                                                  key={`delayed-${g.key}-${a.id}`}
                                                >
                                                  <td className="text-center">
                                                    {i + 1}
                                                  </td>
                                                  <td>{a.id}</td>
                                                  <td>
                                                    <div className="fw-semibold">
                                                      Unit:{" "}
                                                      {a.unitName ?? "N/A"}
                                                    </div>
                                                    <div className="text-muted small">
                                                      {a.registrationNo
                                                        ? `Reg No: ${a.registrationNo}`
                                                        : ""}
                                                    </div>
                                                  </td>
                                                  <td className="text-center">
                                                    {a.netDays ?? "-"}
                                                  </td>
                                                  <td>
                                                    {typeof a.amount ===
                                                    "number"
                                                      ? formatINR(a.amount)
                                                      : "-"}
                                                  </td>
                                                  <td>
                                                    {formatDate(
                                                      a.disbursementDate,
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expedited */}
                              <div className="col-12 col-lg-6">
                                <div className="card h-100">
                                  <div className="card-header d-flex justify-content-between align-items-center">
                                    <div className="fw-semibold">
                                      Expedited (&lt; 10 days)
                                    </div>
                                    <span className="badge bg-success">
                                      {g.expeditedCount}
                                    </span>
                                  </div>
                                  <div className="card-body p-2">
                                    {g.expeditedAppIds.length === 0 ? (
                                      <div className="text-muted small">
                                        No expedited applications for this
                                        metrics row.
                                      </div>
                                    ) : (
                                      <div className="table-responsive">
                                        <table className="table table-sm table-bordered mb-0">
                                          <thead className="table-light">
                                            <tr className="text-center">
                                              <th style={{ width: 50 }}>
                                                S.No.
                                              </th>
                                              <th>App ID</th>
                                              <th>Unit / Registration</th>
                                              <th>Net Days</th>
                                              <th>Amount</th>
                                              <th>Disbursed On</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {computedApps
                                              .filter((a) =>
                                                g.expeditedAppIds.includes(
                                                  a.id,
                                                ),
                                              )
                                              .map((a, i) => (
                                                <tr
                                                  key={`expedited-${g.key}-${a.id}`}
                                                >
                                                  <td className="text-center">
                                                    {i + 1}
                                                  </td>
                                                  <td>{a.id}</td>
                                                  <td>
                                                    <div className="fw-semibold">
                                                      Unit:{" "}
                                                      {a.unitName ?? "N/A"}
                                                    </div>
                                                    <div className="text-muted small">
                                                      {a.registrationNo
                                                        ? `Reg No: ${a.registrationNo}`
                                                        : ""}
                                                    </div>
                                                  </td>
                                                  <td className="text-center">
                                                    {a.netDays ?? "-"}
                                                  </td>
                                                  <td>
                                                    {typeof a.amount ===
                                                    "number"
                                                      ? formatINR(a.amount)
                                                      : "-"}
                                                  </td>
                                                  <td>
                                                    {formatDate(
                                                      a.disbursementDate,
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
