"use client";

import { DashboardStatusCards } from "@/components/(department)/dashboard/common/DashboardStatusCards";
import type { Role7StatusCardsProps, Role7ExtendedStatusFilter } from "./types";

export function Role7StatusCards({
  counts,
  activeStatus,
  loading,
  onSelectStatus,
}: Role7StatusCardsProps) {
  const cards = [
    { key: "ALL" as Role7ExtendedStatusFilter, label: "All Applications", value: counts.all },
    { key: "PENDING" as Role7ExtendedStatusFilter, label: "Pending", value: counts.pending },
    { key: "FORWARDED" as Role7ExtendedStatusFilter, label: "Forwarded", value: counts.forwarded },
    {
      key: "FORWARD_TO_APPROVER" as Role7ExtendedStatusFilter,
      label: "Forward to Approver",
      value: Number(counts.forwardToApprover || 0),
    },
    { key: "APPROVED" as Role7ExtendedStatusFilter, label: "Approved", value: counts.approved },
    {
      key: "REVERTED" as Role7ExtendedStatusFilter,
      label: "Reverted",
      value: Number(counts.reverted || 0),
    },
    { key: "REJECTED" as Role7ExtendedStatusFilter, label: "Rejected", value: counts.rejected },
  ];

  return (
    <DashboardStatusCards<Role7ExtendedStatusFilter>
      cards={cards}
      activeKey={activeStatus}
      loading={loading}
      onSelectStatus={onSelectStatus}
    />
  );
}
