import { DepartmentSidebarMenuItem } from "./types";

export const getRole237DepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: "Dashboard", iconKey: "dashboard", href: "/department/fb-dashboard" },
  { name: "My Workspace Dashboard", iconKey: "reports", href: "http://187.77.185.197:8089/superset/dashboard/12/?native_filters_key=2s5opFAmrSs&standalone=1" },
  { name: "Compliance", iconKey: "reports", href: "" },
  { name: "Audit", iconKey: "reports", href: "" },
  { name: "Grievance Resolution", iconKey: "reports", href: "" }
];
