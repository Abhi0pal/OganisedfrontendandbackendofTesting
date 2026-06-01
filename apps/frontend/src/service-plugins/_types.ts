import type React from 'react';

/**
 * Service-specific plugin interface.
 * Create a file named <serviceId with dots replaced by underscores>.ts
 * e.g. service 12222.0 → src/service-plugins/12222_0.ts
 *
 * Export a default object implementing this interface.
 * All hooks are optional — only implement what you need.
 */
export interface ServiceFormPlugin {
  /**
   * Called after every field change.
   * Return a partial values object to override/set other fields, or void to do nothing.
   * Example: auto-fill city when pincode changes.
   */
  onFieldChange?: (
    fieldCode: string,
    value: any,
    allValues: Record<string, any>,
  ) => Partial<Record<string, any>> | void | Promise<Partial<Record<string, any>> | void>;

  /**
   * Custom per-field validation, called alongside the built-in required/pattern checks.
   * Return an error string to block, or null/undefined to pass.
   */
  validateField?: (
    fieldCode: string,
    value: any,
    allValues: Record<string, any>,
  ) => string | null | undefined;

  /**
   * Called just before page-next or final submit.
   * Return an error string to block the action (shown as a toast/alert),
   * or null/undefined to allow it.
   */
  onBeforeSubmit?: (
    values: Record<string, any>,
    addMoreValues: Record<number, any[]>,
    isLastPage: boolean,
  ) => string | null | undefined | Promise<string | null | undefined>;

  /**
   * Control field visibility beyond the built-in rule engine.
   * Return false to hide the field; true/undefined to show it normally.
   */
  isFieldVisible?: (
    fieldCode: string,
    values: Record<string, any>,
  ) => boolean | undefined;

  /**
   * Override whether a field should behave as mandatory at runtime.
   * Return true/false to force required state, undefined to use default behaviour.
   */
  isFieldRequired?: (
    fieldCode: string,
    values: Record<string, any>,
  ) => boolean | undefined;

  /**
   * Make a field read-only regardless of its builder config.
   * Return true to force readonly, undefined to use default behaviour.
   */
  isFieldReadonly?: (
    fieldCode: string,
    values: Record<string, any>,
  ) => boolean | undefined;

  /**
   * Provide a default value for a field when the form initializes.
   * Return the default value, or undefined if no default should be set.
   */
  getFieldDefaultValue?: (
    fieldCode: string,
    values: Record<string, any>,
  ) => any | undefined;

  /**
   * Optional extra React section rendered below the last category on the active page.
   * Useful for service-specific UI (e.g. fee calculators, custom info panels).
   */
  ExtraSection?: React.FC<{
    values: Record<string, any>;
    addMoreValues: Record<number, any[]>;
    onChange: (fieldCode: string, value: any) => void;
    pageIndex: number;
  }>;
}
