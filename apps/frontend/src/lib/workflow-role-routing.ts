const DEFAULT_WORKFLOW_ROUTE = "/department/workflow";

/**
 * Role-specific overrides — only add here if a role needs a DIFFERENT route.
 * All other roles fall back to DEFAULT_WORKFLOW_ROUTE automatically.
 */
const WORKFLOW_ROUTE_OVERRIDES: Record<number, string> = {
  // example: 99: "/department/workflow/special",
};

export function resolveWorkflowDashboardRouteByRole(roleId?: number | null) {
  const numericRoleId = Number(roleId || 0);
  if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) return null;
  return WORKFLOW_ROUTE_OVERRIDES[numericRoleId] ?? DEFAULT_WORKFLOW_ROUTE;
}

export function resolveWorkflowDetailRouteByRole(
  roleId?: number | null,
  submissionId?: number | null,
) {
  const base = resolveWorkflowDashboardRouteByRole(roleId);
  const id = Number(submissionId || 0);
  if (!base || !Number.isFinite(id) || id <= 0) return null;
  return `${base}/${id}`;
}
