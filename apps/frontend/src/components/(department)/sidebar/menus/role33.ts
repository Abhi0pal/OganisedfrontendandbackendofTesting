import { DepartmentSidebarMenuItem } from "./types";

export const getRole33DepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: "Approver Inbox", iconKey: "dashboard", href: "/department/workflow" },
  { name: "Reports", iconKey: "reports", href: "/department/reports" },
];
