import { DepartmentSidebarMenuItem } from "./types";

export const getRole222DepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: "Dashboard", iconKey: "dashboard", href: "/department/fb-dashboard" },
  { name: "ULB Registration", iconKey: "reports", href: "/investor/services/12244.0/apply/1" },
  { name: "Returns", iconKey: "reports", href: "/investor/services/12277.0/apply/1" },
  { name: "Waste Reports", iconKey: "reports", href: "" },
];
