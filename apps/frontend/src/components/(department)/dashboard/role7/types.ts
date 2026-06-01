import type {
  WorkflowDashboardApplication,
} from '@/hooks/department/workflow/useWorkflowDashboardData';
import type { RoleDashboardCounts } from '@/hooks/department/useOfficerWorkflow';

export type Role7StatusFilter =
  | 'ALL'
  | 'PENDING'
  | 'FORWARDED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVERTED';
export type Role7ExtendedStatusFilter = Role7StatusFilter | 'FORWARD_TO_APPROVER';

export type Role7CountCard = {
  key: Role7StatusFilter;
  label: string;
  value: number;
};

export type Role7ApplicationsTableProps = {
  activeStatus: Role7ExtendedStatusFilter;
  rows: WorkflowDashboardApplication[];
  loading: boolean;
};

export type Role7StatusCardsProps = {
  counts: RoleDashboardCounts;
  activeStatus: Role7ExtendedStatusFilter;
  loading: boolean;
  onSelectStatus: (status: Role7ExtendedStatusFilter) => void;
};
