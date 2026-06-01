/**
 * Role-based configuration for the FormBuilder Officer Dashboard.
 *
 * To add a new role:
 *  1. Add a key to ROLE_CONFIG with the role's numeric id.
 *  2. Define label, tabs, leftStats and quickLinks.
 *
 * Tab keys must match the `tab` param accepted by GET /workflow-runtime/inbox.
 * Stat keys must match the `statuses` param accepted by GET /workflow-runtime/role-dashboard.
 */

export type TabConfig = {
  key: string;          // sent as ?tab= to the API
  label: string;
};

export type StatConfig = {
  key: string;          // sent as part of ?statuses= to the API
  label: string;
  color: string;        // accent color for the stat card
};

export type QuickLink = {
  label: string;
  href: string;
  icon: string;         // any emoji or icon text
};

export type RoleDashboardConfig = {
  roleLabel: string;           // shown in the header
  tabs: TabConfig[];           // inbox tabs shown in middle section
  leftStats: StatConfig[];     // stat cards shown in the left panel
  quickLinks: QuickLink[];     // navigation shortcuts in the left panel
  tableColumns: string[];      // column keys to show in the table
};

// ─────────────────────────────────────────────────────────────────────────────
// Column keys available for tableColumns:
//   submissionId | unitName | investorName | serviceName | department
//   receivedDate | currentStep | status | sla | action
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_TABS: TabConfig[] = [
  { key: 'pending',   label: 'Pending'    },
  { key: 'forwarded', label: 'Forwarded'  },
  { key: 'approved',  label: 'Approved'   },
  { key: 'rejected',  label: 'Rejected'   },
  { key: 'reverted',  label: 'Reverted'   },
  { key: 'history',   label: 'History'    },
];

const DEFAULT_COLUMNS = ['submissionId', 'unitName', 'serviceName', 'department', 'receivedDate', 'statusLabel', 'dueAt', 'action'];

export const ROLE_CONFIG: Record<number, RoleDashboardConfig> = {

  // ── JD / DIC Officer (role 3) ─────────────────────────────────────────────
  3: {
    roleLabel: 'JD / DIC Officer',
    tabs: [
      { key: 'pending',   label: 'Pending'   },
      { key: 'completed', label: 'Completed' },
      { key: 'history',   label: 'History'   },
    ],
    leftStats: [
      { key: 'P',  label: 'Pending',   color: '#f59e0b' },
      { key: 'F',  label: 'Forwarded', color: '#3b82f6' },
      { key: 'A',  label: 'Approved',  color: '#10b981' },
      { key: 'R',  label: 'Rejected',  color: '#ef4444' },
    ],
    quickLinks: [
      { label: 'Open Inbox',  href: '/department/workflow',   icon: '📥' },
      { label: 'Inspections', href: '/department/inspection', icon: '🔍' },
    ],
    tableColumns: DEFAULT_COLUMNS,
  },

  // ── AD DIC (role 4) ───────────────────────────────────────────────────────
  4: {
    roleLabel: 'AD DIC',
    tabs: DEFAULT_TABS,
    leftStats: [
      { key: 'P',  label: 'Pending',   color: '#f59e0b' },
      { key: 'FA', label: 'Fwd Approver', color: '#6366f1' },
      { key: 'A',  label: 'Approved',  color: '#10b981' },
      { key: 'R',  label: 'Rejected',  color: '#ef4444' },
    ],
    quickLinks: [
      { label: 'Open Inbox',  href: '/department/workflow', icon: '📥' },
    ],
    tableColumns: DEFAULT_COLUMNS,
  },

  // ── DD DIC (role 5) ───────────────────────────────────────────────────────
  5: {
    roleLabel: 'DD DIC',
    tabs: DEFAULT_TABS,
    leftStats: [
      { key: 'P',  label: 'Pending',   color: '#f59e0b' },
      { key: 'FA', label: 'Fwd Approver', color: '#6366f1' },
      { key: 'A',  label: 'Approved',  color: '#10b981' },
      { key: 'R',  label: 'Rejected',  color: '#ef4444' },
    ],
    quickLinks: [
      { label: 'Open Inbox',  href: '/department/workflow', icon: '📥' },
    ],
    tableColumns: DEFAULT_COLUMNS,
  },

  // ── Nodal / CAF (role 7) ──────────────────────────────────────────────────
  7: {
    roleLabel: 'Nodal Officer',
    tabs: [
      { key: 'pending',             label: 'Pending'            },
      { key: 'forwarded',           label: 'Forwarded'          },
      { key: 'forward_to_approver', label: 'Fwd to Approver'    },
      { key: 'history',             label: 'History'            },
    ],
    leftStats: [
      { key: 'P',  label: 'Pending',      color: '#f59e0b' },
      { key: 'F',  label: 'Forwarded',    color: '#3b82f6' },
      { key: 'FA', label: 'Fwd Approver', color: '#6366f1' },
      { key: 'A',  label: 'Approved',     color: '#10b981' },
      { key: 'RBI',label: 'Reverted',     color: '#f97316' },
    ],
    quickLinks: [
      { label: 'Open Inbox',    href: '/department/workflow',   icon: '📥' },
      { label: 'Inspections',   href: '/department/inspection', icon: '🔍' },
    ],
    tableColumns: ['submissionId', 'unitName', 'investorName', 'serviceName', 'receivedDate', 'statusLabel', 'dueAt', 'action'],
  },

  // ── Approver (role 33) ────────────────────────────────────────────────────
  33: {
    roleLabel: 'Approver',
    tabs: [
      { key: 'pending',  label: 'Pending Approvals' },
      { key: 'approved', label: 'Approved'          },
      { key: 'rejected', label: 'Rejected'          },
    ],
    leftStats: [
      { key: 'P', label: 'Pending',  color: '#f59e0b' },
      { key: 'A', label: 'Approved', color: '#10b981' },
      { key: 'R', label: 'Rejected', color: '#ef4444' },
    ],
    quickLinks: [
      { label: 'Open Inbox', href: '/department/workflow', icon: '📥' },
    ],
    tableColumns: ['submissionId', 'unitName', 'serviceName', 'department', 'receivedDate', 'statusLabel', 'action'],
  },

  // ── Content Approver (role 222) ───────────────────────────────────────────
  222: {
    roleLabel: 'Content Approver',
    tabs: DEFAULT_TABS,
    leftStats: [
      { key: 'P', label: 'Pending',  color: '#f59e0b' },
      { key: 'A', label: 'Approved', color: '#10b981' },
      { key: 'R', label: 'Rejected', color: '#ef4444' },
    ],
    quickLinks: [
      { label: 'Open Inbox', href: '/department/workflow', icon: '📥' },
    ],
    tableColumns: DEFAULT_COLUMNS,
  },

  // ── Marriage Registrar (role 260) ─────────────────────────────────────
  260: {
    roleLabel: 'Marriage Registrar',
    tabs: [
      { key: 'pending',   label: 'Pending Action'    },
      { key: 'forwarded', label: 'Forwarded'          },
      { key: 'reverted',  label: 'Sent Back by DO'    },
      { key: 'rejected',  label: 'Rejected'           },
      { key: 'approved',  label: 'Approved'           },
      { key: 'history',   label: 'Certificates Issued'},
    ],
    leftStats: [
      { key: 'P',   label: 'Pending Action',      color: '#b91c1c' },
      { key: 'F',   label: 'Forwarded',            color: '#b91c1c' },
      { key: 'RBI', label: 'Sent Back by DO',      color: '#b91c1c' },
      { key: 'R',   label: 'Rejected',             color: '#b91c1c' },
      { key: 'A',   label: 'Approved',             color: '#b91c1c' },
      { key: 'CI',  label: 'Certificates Issued',  color: '#b91c1c' },
    ],
    quickLinks: [],
    tableColumns: DEFAULT_COLUMNS,
  },

  // ── Divisional Verifier (role 261) ───────────────────────────────────
  261: {
    roleLabel: 'Divisional Verifier',
    tabs: [
      { key: 'pending',   label: 'Pending Action'    },
      { key: 'forwarded', label: 'Forwarded'          },
      { key: 'reverted',  label: 'Sent Back by DO'    },
      { key: 'rejected',  label: 'Rejected'           },
      { key: 'approved',  label: 'Approved'           },
      { key: 'history',   label: 'Certificates Issued'},
    ],
    leftStats: [
      { key: 'P',   label: 'Pending Action',      color: '#b91c1c' },
      { key: 'F',   label: 'Forwarded',            color: '#b91c1c' },
      { key: 'RBI', label: 'Sent Back by DO',      color: '#b91c1c' },
      { key: 'R',   label: 'Rejected',             color: '#b91c1c' },
      { key: 'A',   label: 'Approved',             color: '#b91c1c' },
      { key: 'CI',  label: 'Certificates Issued',  color: '#b91c1c' },
    ],
    quickLinks: [],
    tableColumns: DEFAULT_COLUMNS,
  },

};

/** Returns config for roleId, falling back to a sensible default. */
export function getRoleConfig(roleId: number): RoleDashboardConfig {
  return (
    ROLE_CONFIG[roleId] ?? {
      roleLabel: `Officer (Role ${roleId})`,
      tabs: DEFAULT_TABS,
      leftStats: [
        { key: 'P', label: 'Pending',  color: '#f59e0b' },
        { key: 'A', label: 'Approved', color: '#10b981' },
        { key: 'R', label: 'Rejected', color: '#ef4444' },
      ],
      quickLinks: [
        { label: 'Open Inbox', href: '/department/workflow', icon: '📥' },
      ],
      tableColumns: DEFAULT_COLUMNS,
    }
  );
}
