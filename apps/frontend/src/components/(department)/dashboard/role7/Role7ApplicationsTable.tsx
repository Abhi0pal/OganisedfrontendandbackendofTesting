"use client";

import { useMemo } from "react";
import { useRouter } from "@/navigation";
import { RowAction } from "@/components/DataTable/types";
import { ReusableDataTableConfig } from "@/components/DataTable/types";
import type { ModuleExportConfig } from "@/lib/export-utils";
import type { WorkflowDashboardApplication } from "@/hooks/department/workflow/useWorkflowDashboardData";
import { DashboardApplicationsTable } from "@/components/(department)/dashboard/common/DashboardApplicationsTable";
import type { Role7ApplicationsTableProps } from "./types";

const tableConfig: ReusableDataTableConfig<WorkflowDashboardApplication> = {
  dataKey: "submissionId",
  rows: 10,
  rowsPerPageOptions: [5, 10, 20, 50, 100],
  globalFilterFields: ["submissionId", "unitName", "companyName", "department", "statusLabel"],
  paginator: true,
  showHeader: true,
  stripedRows: true,
  showGridlines: true,
  emptyMessage: "No applications found.",
  columns: [
    { field: "submissionId", header: "Submission ID", sortable: true, filterType: "number", width: "12%" },
    { field: "unitName", header: "Unit Name", sortable: true, filterType: "text", width: "18%" },
    { field: "companyName", header: "Company Name", sortable: true, filterType: "text", width: "18%" },
    {
      field: "submissionDate",
      header: "Submission Date",
      sortable: true,
      filterType: "date",
      width: "14%",
      body: (row: WorkflowDashboardApplication) => (row.submissionDate ? new Date(row.submissionDate).toLocaleDateString() : "-"),
    },
    { field: "department", header: "Department", sortable: true, filterType: "text", width: "16%" },
    {
      field: "statusLabel",
      header: "Status",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Pending", value: "Pending" },
        { label: "Forwarded", value: "Forwarded" },
        { label: "Forwarded to Approver", value: "Forwarded to Approver" },
        { label: "Reverted to Investor", value: "Reverted to Investor" },
        { label: "Approved", value: "Approved" },
        { label: "Rejected", value: "Rejected" },
      ],
      width: "10%",
    },
  ],
};

const exportConfig: ModuleExportConfig = {
  moduleName: "district-caf-verifier-applications",
  title: "District CAF Verifier Applications",
  columns: [
    { header: "Submission ID", field: "submissionId" },
    { header: "Unit Name", field: "unitName" },
    { header: "Company Name", field: "companyName" },
    {
      header: "Submission Date",
      field: "submissionDate",
      formatter: (value: unknown) => (value ? new Date(String(value)).toLocaleDateString() : "-"),
    },
    { header: "Department", field: "department" },
    { header: "Status", field: "statusLabel" },
  ],
};

export function Role7ApplicationsTable({ activeStatus, rows, loading }: Role7ApplicationsTableProps) {
  const router = useRouter();
  const rowActions: RowAction<WorkflowDashboardApplication>[] = useMemo(
    () => [
      {
        icon: "pi pi-eye",
        label: "View",
        severity: "info",
        onClick: (row) => router.push(`/department/workflow/${row.submissionId}`),
        tooltip: "View Application",
      },
    ],
    [router]
  );

  return (
    <DashboardApplicationsTable<WorkflowDashboardApplication>
      title="Received Applications"
      activeStatusLabel={
        activeStatus === "ALL"
          ? "all statuses"
          : activeStatus === "FORWARD_TO_APPROVER"
            ? "forward to approver"
            : activeStatus.toLowerCase()
      }
      rows={rows}
      loading={loading}
      tableConfig={tableConfig}
      exportConfig={exportConfig}
      rowActions={rowActions}
    />
  );
}
