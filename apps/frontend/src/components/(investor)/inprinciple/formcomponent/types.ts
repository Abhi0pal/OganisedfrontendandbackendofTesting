
// Types for Dynamic Form Component

import type { ReactNode } from 'react';

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'hidden'
  | 'custom'
  | 'addmore';

// Column configuration for Add More table
export interface AddMoreColumnConfig {
  name: string;              // Column field name (will be part of row object)
  label: string;             // Column header label
  type: Exclude<FieldType, 'addmore' | 'custom' | 'hidden'>; // Field type for this column
  placeholder?: string;
  options?: SelectOption[];   // For select/radio/checkbox types
  validation?: ValidationRule;
  width?: string;            // Column width (e.g., '150px', '20%')
  accept?: string;           // For file type
  multiple?: boolean;        // For file/select types
  disabled?: boolean;
  readOnly?: boolean;
}

// Add More field configuration
export interface AddMoreConfig {
  columns: AddMoreColumnConfig[];    // Column definitions
  minRows?: number;                  // Minimum number of rows (default: 1)
  maxRows?: number;                  // Maximum number of rows (optional)
  addButtonText?: string;            // Custom text for add button (default: 'Add More')
  deleteButtonText?: string;         // Custom text for delete button (default: 'Delete')
  defaultRow?: Record<string, any>;  // Default values for new rows
}

export interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => boolean | string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface DependsOnCondition {
  field: string;
  value: any | any[];
  show: boolean;
}

export interface FormFieldConfig {
  name: string;
  label?: string;              // make optional for 'custom' if you don't want a label
  type: FieldType;
  placeholder?: string;
  defaultValue?: any;
  validation?: ValidationRule;
  skipStepValidation?: boolean;
  options?: SelectOption[];
  searchable?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  helpText?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  dependsOn?: DependsOnCondition;

  // Callbacks
  onChange?: (value: any, formMethods: any) => void;
  onMount?: (formMethods: any) => void;
  onBlur?: (value: any, formMethods: any) => void;

  // NEW: renderer for custom fields
  render?: (formMethods: any) => ReactNode;

  // NEW: configuration for 'addmore' type
  addMoreConfig?: AddMoreConfig;
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  columns?: 1 | 2 | 3 | 4;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  dependsOn?: DependsOnCondition;
}

export interface FormStepConfig {
  id: string;
  title: string;
  description?: string;
  sections: FormSectionConfig[];
  validation?: ValidationRule[];
}

export interface DynamicFormConfig {
  id: string;
  steps: FormStepConfig[];
  submitButtonText?: string;
  nextButtonTextByStep?: Record<number, string>;
  showStepIndicator?: boolean;
  allowStepNavigation?: boolean;
  validateOnStepChange?: boolean;
  onSubmit: (data: any) => void | Promise<void>;
  onStepChange?: (
    step: number,
    data: any,
    meta?: { fromStep: number; toStep: number }
  ) => void | boolean | Promise<boolean>;
  className?: string;
}

// Props...
