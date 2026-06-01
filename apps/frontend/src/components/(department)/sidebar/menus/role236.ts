import { DepartmentSidebarMenuItem } from "./types";

export const getRole236DepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: "Dashboard", iconKey: "dashboard", href: "/department/fb-dashboard" },
  { name: "My Workspace Dashboard", iconKey: "reports", href: "http://187.77.185.197:8089/superset/dashboard/12/?native_filters_key=2s5opFAmrSs&standalone=1" },
  { name: "Policy/ Admin Controls", iconKey: "reports", href: "" },
  { name: "Notifications/ Analytics/ Monitoring", iconKey: "reports", href: "" },
  { name: "Public", iconKey: "reports", href: "" },
  { name: "Complaint/ Grievance", iconKey: "reports", href: "" },
];
