import { DepartmentSidebarMenuItem } from './types';

export const getRole7DepartmentMenus = (): DepartmentSidebarMenuItem[] => [
  { name: 'Workflow Inbox', iconKey: 'dashboard', href: '/department/workflow' },
  {
    name: 'In Principle',
    iconKey: 'services',
    children: [
      { name: 'Pending', href: '/department/inprinciple/pending' },
      { name: 'Forwarded', href: '/department/inprinciple/forwarded' },
    ],
  },
  { name: 'Reports', iconKey: 'reports', href: '/department/reports' },
  { name: 'Grievance', iconKey: 'users', href: '/department/grievance' },
  { name: 'Investor Summit', iconKey: 'inspections', href: '/department/investor-summit' },
  {
    name: 'Meeting Organiser',
    iconKey: 'inspections',
    children: [
      { name: 'View Previous MOM', href: '/department/meeting-organiser/previous-mom' },
      { name: 'Meeting Organiser', href: '/department/meeting-organiser' },
    ],
  },
  {
    name: 'Facing Trouble (Ticket system)',
    iconKey: 'services',
    children: [{ name: 'Create Ticket', href: '/department/tickets/create' }],
  },
];
