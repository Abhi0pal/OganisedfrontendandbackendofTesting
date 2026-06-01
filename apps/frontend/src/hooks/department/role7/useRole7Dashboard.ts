import { useWorkflowDashboardData } from '@/hooks/department/workflow/useWorkflowDashboardData';
import { ROLE7_DASHBOARD_QUERY } from './constants';

export const useRole7Dashboard = () => useWorkflowDashboardData(ROLE7_DASHBOARD_QUERY);
