import ActionShell from "./actions/ActionShell";

export type WorkflowSectionKey =
  | "APPLICATION_VIEW"
  | "DOCUMENTS_VIEW"
  | "TIMELINE_VIEW"
  | "ACTIONABLE_ITEMS"
  | "DOCUMENT_VERIFICATION";

const FORM_TYPE_ACTION_MAP: Record<string, typeof ActionShell> = {
  default: ActionShell,
  // Add formType-specific components here if needed in the future.
};

export const resolveWorkflowActionComponent = (formTypeId?: number | null) => {
  if (formTypeId === undefined || formTypeId === null) {
    return ActionShell;
  }
  const key = String(formTypeId).trim();
  return FORM_TYPE_ACTION_MAP[key] || FORM_TYPE_ACTION_MAP.default || ActionShell;
};

export const isWorkflowSectionEnabled = (
  key: WorkflowSectionKey,
  configuredSections?: string[]
) => {
  if (!configuredSections || !configuredSections.length) return true;
  return configuredSections.includes(key);
};
