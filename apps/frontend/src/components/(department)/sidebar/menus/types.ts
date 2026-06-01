export type DepartmentSidebarIconKey =
  | 'dashboard'
  | 'services'
  | 'inspections'
  | 'reports'
  | 'users';

export type DepartmentSidebarChildItem = {
  name: string;
  href: string;
  iconKey?: DepartmentSidebarIconKey;
};

export type DepartmentSidebarMenuItem = {
  name: string;
  href?: string;
  iconKey?: DepartmentSidebarIconKey;
  children?: DepartmentSidebarChildItem[];
};

