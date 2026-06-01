import { DepartmentSidebarMenuItem } from './types';

export const getDefaultDepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: 'Dashboard', iconKey: 'dashboard', href: '/department/fb-dashboard' },
  { name: 'Reports', iconKey: 'reports', href: '/department/reports' },
];

