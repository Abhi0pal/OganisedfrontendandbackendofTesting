"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format, parse } from "date-fns";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { InputSwitch } from "primereact/inputswitch";
import { Password } from "primereact/password";
import { AutoComplete } from "primereact/autocomplete";
import { classNames } from "primereact/utils";
import { CalculationConfig } from "@/components/admin/master/CalculationEditor";
import { calculateFieldValue } from "@/hooks/useCalculations";
import { useMasterTables } from "@/hooks/master/useSchemes";
import { evaluateFormulaSync, preloadMathjs, formulaHasDateFunctions } from "@/utils/formulaEngine";
import { useServicePlugin } from "@/service-plugins/_loader";

// ----------------------------------------------------------------------
// ✅ 1. THEME & GRID MAPPINGS (Supports Bootstrap + Tailwind)
// ----------------------------------------------------------------------
type Theme = "bootstrap" | "tailwind";

// Tailwind: Uses CSS Grid
const TAILWIND_SPANS: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
};

// Bootstrap: Uses Flexbox Grid
const BOOTSTRAP_SPANS: Record<number, string> = {
  1: "col-md-1",
  2: "col-md-2",
  3: "col-md-3",
  4: "col-md-4",
  5: "col-md-5",
  6: "col-md-6",
  7: "col-md-7",
  8: "col-md-8",
  9: "col-md-9",
  10: "col-md-10",
  11: "col-md-11",
  12: "col-md-12",
};

// ----------------------------------------------------------------------
// 2. TYPES
// ----------------------------------------------------------------------

// ✅ NEW: Rule Engine Types
export interface FormRule {
  id?: number;
  scope: string;
  when_json: any; // Condition Tree
  then_json: any; // Action List
  is_active: "Y" | "N";
}

interface FieldOverrides {
  visible?: boolean;
  required?: boolean;
  readonly?: boolean;
}

interface FieldCondition {
  field_code: string;
  operator:
    | "equals"
    | "not_equals"
    | "in"
    | "not_in"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty"
    | "contains";
  value: any;
}
type RuleNode = {
  type: "rule";
  field_code: string;
  operator: string;
  value?: any;
};

type GroupNode = {
  type: "group";
  operator?: "AND" | "OR";
  children: Array<RuleNode | GroupNode>;
};

type ConditionNode = RuleNode | GroupNode;

interface FieldDependency {
  trigger_field: string;
  endpoint: string;
  query_param: string;
}

interface ValidationOverride {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  regex?: string;
  message?: string;
}

// Repeater config matches configurator
interface RepeaterConfig {
  min_items?: number;
  max_items?: number;
  add_button_label?: string;
  item_label?: string;
}

// Extend FormField to support repeater fields
interface FormField {
  field_code: string;
  required?: boolean;
  label_override?: string;
  placeholder?: string;
  description?: string;

  // Layout & Props
  grid_span?: number; // 1-12
  component_props?: Record<string, any>;

  // Validation Rule
  validation_rules?: ValidationRules;
  validation_override?: ValidationOverride;

  // Dependencies/conditions/calculation
  dependency?: FieldDependency;
  condition?: ConditionNode;
  options?: Array<{ label: string; value: string }>;
  calculation?: CalculationConfig;
  input_type?: string;
  help_text?: string;

  // NEW for repeaters
  is_repeater?: boolean;
  component_type?: string; // 'repeater' for add-more container
  sub_fields?: FormField[]; // fields that repeat together
  repeater_config?: RepeaterConfig;
}

interface FormSection {
  section_title: string;
  description?: string;
  grid_cols?: 1 | 2 | 3;
  condition?: ConditionNode;
  fields: FormField[];
}

interface FieldMasterDef {
  field_code: string;
  field_label: string;
  data_type: string;
  component_type: string;
  default_validation?: any;
  lookup_config?: any;
  integration_config?: any;
  is_active: boolean;
}

interface RequiredDocument {
  document_id: number;
  description?: string;
  is_mandatory: boolean;
  allowed_types?: string[];
  max_size_mb?: number;
  condition?: ConditionNode;
  show_beside_field?: string;
  document_meta?: {
    checklistDocumentName?: string;
    checklistId?: string;
    checklistDocumentMaxSize?: number;
  };
}

interface DynamicFormRendererProps {
  formStructure: FormSection[];
  fieldMaster: FieldMasterDef[];
  values: Record<string, any>;
  serviceId?: string;
  onChange: (fieldCode: string, value: any) => void;
  onSetValues?: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  onApiError?: (fieldCode: string, error: string) => void;
  readOnly?: boolean;
  requiredDocuments?: { documents: RequiredDocument[] };
  onDocumentUpload?: (doc: RequiredDocument, file: File) => void;
  onRemoveDocument?: (doc: RequiredDocument) => void;
  theme?: Theme;

  // ✅ NEW: Pass Rules from backend
  rules?: FormRule[];
}

interface LookupConfig {
  source?: "master" | "static";
  table_code: string;
  match_field: string;
  match_column: string;
  return_column: string;
  static_options?: { label: string; value: string | number }[];
}

// ----------------------------------------------------------------------
// 3. HELPERS
// ----------------------------------------------------------------------
const evaluateCondition = (
  condition: ConditionNode | undefined,
  formValues: Record<string, any>,
): boolean => {
  if (!condition) return true;

  // -----------------------
  // RULE NODE
  // -----------------------
  if (condition.type === "rule") {
    const fieldValue = formValues?.[condition.field_code];
    const conditionValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return fieldValue == conditionValue;

      case "not_equals":
        return fieldValue != conditionValue;

      case "in":
        return Array.isArray(conditionValue)
          ? conditionValue.includes(fieldValue)
          : false;

      case "not_in":
        return Array.isArray(conditionValue)
          ? !conditionValue.includes(fieldValue)
          : false;

      case "greater_than":
        return Number(fieldValue) > Number(conditionValue);

      case "less_than":
        return Number(fieldValue) < Number(conditionValue);

      case "contains":
        return typeof fieldValue === "string" &&
          typeof conditionValue === "string"
          ? fieldValue.includes(conditionValue)
          : false;

      case "is_empty":
        return (
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === "" ||
          (typeof fieldValue === "string" && fieldValue.trim() === "")
        );

      case "is_not_empty":
        return !(
          fieldValue === undefined ||
          fieldValue === null ||
          fieldValue === "" ||
          (typeof fieldValue === "string" && fieldValue.trim() === "")
        );

      default:
        return true;
    }
  }

  // -----------------------
  // GROUP NODE (Recursive)
  // -----------------------
  if (condition.type === "group") {
    const { children = [], operator = "AND" } = condition;

    if (!Array.isArray(children) || children.length === 0) {
      return true;
    }

    const results = children.map((child) =>
      evaluateCondition(child, formValues),
    );

    if (operator === "OR") {
      return results.some(Boolean);
    }

    // Default AND
    return results.every(Boolean);
  }

  return true;
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

// Helper to parse dates in multiple formats
const parseDateValue = (value: any): Date | null => {
  if (!value) return null;
  
  const valueStr = String(value).trim();
  
  // Try ISO format first (2026-04-12)
  if (valueStr.includes('-') && valueStr.length === 10) {
    try {
      return new Date(valueStr);
    } catch (e) {
      // Fall through to next format
    }
  }
  
  // Try DD/MM/YYYY format
  try {
    return parse(valueStr, 'dd/MM/yyyy', new Date());
  } catch (e) {
    // Fall through to next format
  }
  
  // Try MM/DD/YYYY format
  try {
    return parse(valueStr, 'MM/dd/yyyy', new Date());
  } catch (e) {
    // Fall through to next format
  }
  
  // Fallback: try JavaScript's Date constructor
  try {
    const result = new Date(valueStr);
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Do nothing
  }
  
  return null;
};

// Check if value is "empty"
const isEmptyValue = (v: any) => {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
};

// Evaluate a single condition node (e.g. Field A == 'Yes')
const evaluateRuleCondition = (
  condition: any,
  formValues: Record<string, any>,
): boolean => {
  if (!condition) return true;

  // Handle Groups (AND/OR)
  if (Array.isArray(condition.all)) {
    return condition.all.every((c: any) =>
      evaluateRuleCondition(c, formValues),
    );
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((c: any) => evaluateRuleCondition(c, formValues));
  }

  // Handle Leaf Node
  const fieldCode = condition.field || condition.field_code;
  if (!fieldCode) return true;

  const value = formValues[fieldCode];
  const target = condition.value;
  const operator = condition.operator || "equals";

  switch (operator) {
    case "equals":
      return value == target;
    case "not_equals":
      return value != target;
    case "in":
      return Array.isArray(target) && target.includes(value);
    case "not_in":
      return Array.isArray(target) && !target.includes(value);
    case "greater_than":
      return Number(value) > Number(target);
    case "less_than":
      return Number(value) < Number(target);
    case "is_empty":
      return isEmptyValue(value);
    case "is_not_empty":
      return !isEmptyValue(value);
    case "contains":
      return typeof value === "string" && value.includes(target);
    default:
      return true;
  }
};

/**
 * Compute spans for a single row so that visible subfields fit in ONE row (sum to 12).
 * - If a sub-field has grid_span, it is treated as a weight (bias).
 * - Otherwise weight=1.
 * - Rounds down and distributes remainder fairly.
 * - If >12 visible subfields, we compress largest spans to keep total 12.
 */
const computeRowSpans = (subs: FormField[], targetCols = 12): number[] => {
  if (!subs || subs.length === 0) return [];
  // Use grid_span as a weight if present, else weight=1
  const weights = subs.map((sf) => {
    const w = Number(sf.grid_span) || 1;
    return isNaN(w) ? 1 : Math.max(1, Math.min(12, w));
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;

  // Initial spans by proportion
  let spans = weights.map((w) =>
    Math.max(1, Math.floor((w / totalWeight) * targetCols)),
  );

  // Fix rounding: ensure sum == targetCols
  let used = spans.reduce((a, b) => a + b, 0);

  // If we have leftover columns (due to floor rounding), distribute them
  let i = 0;
  while (used < targetCols && spans.length > 0) {
    spans[i % spans.length] += 1;
    used += 1;
    i += 1;
  }

  // If overflow (can happen when many fields with min=1), trim from the largest spans
  while (used > targetCols && spans.length > 0) {
    const maxVal = Math.max(...spans);
    const idx = spans.findIndex((v) => v === maxVal);
    if (idx === -1) break;
    spans[idx] -= 1;
    used -= 1;
  }

  return spans;
};

// ----------------------------------------------------------------------
// 4. FIELD RENDERER
// ----------------------------------------------------------------------
const FieldRenderer = ({
  field,
  fieldMasterDef,
  value,
  onChange,
  error,
  readOnly,
  formValues,
  onSetValues,
  onApiError,
  requiredDocuments,
  onDocumentUpload,
  onRemoveDocument,
  theme,
  override, // ✅ Receive overrides from parent
}: any) => {
  const [dependencyOptions, setDependencyOptions] = useState<any[]>([]);
  const [autoCompleteFiltered, setAutoCompleteFiltered] = useState<any[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const { data: masterTables = [] } = useMasterTables();
  const [lookupOptions, setLookupOptions] = useState<
    { label: string; value: any }[]
  >([]);

  // ✅ Apply Overrides
  const isReadOnlyOverride = override?.readonly === true;
  const isRequiredOverride = override?.required === true;

  // Effective state
  const isDisabled = readOnly || isReadOnlyOverride;
  const isRequired = isRequiredOverride || field.required;

  const lookupConfig = useMemo(
    () => field.calculation?.lookup as LookupConfig | undefined,
    [field.calculation?.lookup],
  );

  const isSameOptions = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return a.every(
      (opt, i) => opt.label === b[i].label && opt.value === b[i].value,
    );
  };

  useEffect(() => {
    let nextOptions: any[] = [];
    if (
      !field.calculation?.enabled ||
      field.calculation?.formula_type !== "lookup" ||
      !lookupConfig
    ) {
      // keep empty
    } else if (lookupConfig.source === "static") {
      nextOptions =
        lookupConfig.static_options?.map((opt) => ({
          label: opt.label,
          value: opt.value,
        })) || [];
    } else if (lookupConfig.source === "master") {
      const mt = masterTables.find(
        (t) => t.master_code === lookupConfig.table_code,
      );
      if (mt?.data && lookupConfig.match_column && lookupConfig.return_column) {
        nextOptions = mt.data.map((row: any) => ({
          value: String(row[lookupConfig.match_column]),
          label: row[lookupConfig.return_column],
        }));
      }
    }
    setLookupOptions((prev) =>
      isSameOptions(prev, nextOptions) ? prev : nextOptions,
    );
  }, [field.calculation, lookupConfig, masterTables]);

  const label =
    field.label_override || fieldMasterDef?.field_label || field.field_code;
  const placeholder = field.placeholder || `Enter ${label}`;
  const componentType = fieldMasterDef?.data_type || field.input_type || "text";
  const hasError = !!error;
  const isCalculated =
    (field.calculation?.enabled || false) &&
    field.calculation?.formula_type !== "lookup";

  const integrationConfig = fieldMasterDef?.integration_config;
  const autoFillConfig = integrationConfig?.auto_fill;
  const apiValidationConfig = integrationConfig?.api_validation;

  const documentsForField = useMemo(() => {
    if (!Array.isArray(requiredDocuments?.documents)) return [];

    return requiredDocuments.documents.filter((doc: RequiredDocument) => {
      if (doc.show_beside_field !== field.field_code) return false;

      // if (doc.condition) return evaluateLegacyCondition(doc.condition, formValues);
      if (!doc.condition) return true;

      return evaluateCondition(doc.condition as ConditionNode, formValues);
    });
  }, [requiredDocuments, field.field_code, formValues]);

  const handleAutoFill = useCallback(
    async (currentValue: any) => {
      if (!autoFillConfig?.enabled || !autoFillConfig.endpoint || !currentValue)
        return;
      setIsApiLoading(true);
      try {
        const url = autoFillConfig.endpoint;
        const paramName = autoFillConfig.request_param || "value";
        const response =
          autoFillConfig.method === "GET"
            ? await fetch(
                `${url}?${paramName}=${encodeURIComponent(currentValue)}`,
              )
            : await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [paramName]: currentValue }),
              });

        if (response.ok) {
          const data = await response.json();
          if (autoFillConfig.response_mappings && onSetValues) {
            const newValues: Record<string, any> = {};
            autoFillConfig.response_mappings.forEach(
              (mapping: { target_field: string; response_path: string }) => {
                const mappedValue = getNestedValue(data, mapping.response_path);
                if (mappedValue !== undefined)
                  newValues[mapping.target_field] = mappedValue;
              },
            );
            if (Object.keys(newValues).length > 0) onSetValues(newValues);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsApiLoading(false);
      }
    },
    [autoFillConfig, onSetValues],
  );

  const handleApiValidation = useCallback(
    async (currentValue: any) => {
      if (!apiValidationConfig?.enabled || !currentValue) return;
      setIsApiLoading(true);
      try {
        const url = apiValidationConfig.endpoint;
        const paramName = apiValidationConfig.request_param || "value";
        const response =
          apiValidationConfig.method === "GET"
            ? await fetch(
                `${url}?${paramName}=${encodeURIComponent(currentValue)}`,
              )
            : await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [paramName]: currentValue }),
              });

        if (response.ok) {
          const data = await response.json();
          const isValid = getNestedValue(
            data,
            apiValidationConfig.success_path,
          );
          if (!isValid && onApiError) {
            const errorMessage =
              getNestedValue(data, apiValidationConfig.message_path) ||
              "Validation failed";
            onApiError(field.field_code, errorMessage);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsApiLoading(false);
      }
    },
    [apiValidationConfig, field.field_code, onApiError],
  );

  const handleBlur = useCallback(() => {
    if (autoFillConfig?.enabled && autoFillConfig.trigger === "blur")
      handleAutoFill(value);
    if (apiValidationConfig?.enabled) handleApiValidation(value);
  }, [
    autoFillConfig,
    apiValidationConfig,
    value,
    handleAutoFill,
    handleApiValidation,
  ]);

  const handleChange = useCallback(
    (newValue: any) => {
      onChange(newValue);
      if (autoFillConfig?.enabled && autoFillConfig.trigger === "change")
        handleAutoFill(newValue);
    },
    [onChange, autoFillConfig, handleAutoFill],
  );

  const baseOptions = useMemo(() => {
    if (field.options?.length) return field.options;
    if (fieldMasterDef?.lookup_config?.options)
      return fieldMasterDef.lookup_config.options;
    return [];
  }, [field.options, fieldMasterDef]);

  useEffect(() => {
    if (field.dependency?.trigger_field && field.dependency?.endpoint) {
      const parentValue = formValues[field.dependency.trigger_field];
      if (parentValue) {
        fetch(
          `${field.dependency.endpoint}?${field.dependency.query_param}=${parentValue}`,
        )
          .then((res) => res.json())
          .then((data) => setDependencyOptions(data))
          .catch((err) => setDependencyOptions([]));
      } else {
        setDependencyOptions([]);
      }
    }
  }, [field.dependency, formValues]);

  const options = useMemo(() => {
    if (field.dependency && dependencyOptions.length > 0)
      return dependencyOptions;
    if (
      field.calculation?.enabled &&
      field.calculation?.formula_type === "lookup" &&
      lookupOptions.length > 0
    )
      return lookupOptions;
    return baseOptions;
  }, [
    field.dependency,
    dependencyOptions,
    field.calculation,
    lookupOptions,
    baseOptions,
  ]);

  // Match plugin-provided default label against option values
  useEffect(() => {
    if (
      !value ||
      !options.length ||
      (typeof value === 'string' && options.some((opt: any) => opt.value === value))
    ) {
      return; // Value is already set or matches an option value
    }

    // If value is a string (like "Maharashtra") but not in options, try to find matching label
    if (typeof value === 'string') {
      const matchingOption = options.find(
        (opt: any) => opt.label?.toLowerCase() === value.toLowerCase(),
      );
      if (matchingOption && matchingOption.value !== value) {
        onChange(matchingOption.value);
      }
    }
  }, [options, value, onChange]);

  // ✅ CSS: Theme Aware Input Classes
  const inputClassName = classNames(
    theme === "bootstrap" ? "w-100 px-3 py-2.5 border rounded" : "w-full", // 100% width
    { "p-invalid": hasError },
  );

  const extraProps = field.component_props || {};

  const searchAutoComplete = (event: { query: string }) => {
    const filtered = options.filter((opt: any) =>
      opt.label?.toLowerCase().includes(event.query.toLowerCase()),
    );
    setAutoCompleteFiltered(filtered);
  };

  const renderInput = () => {
    if (isDisabled || readOnly || isCalculated)
      return (
        <InputText
          value={value?.toString() || "-"}
          disabled
          className={inputClassName}
        />
      );

    switch (componentType) {
      case "text":
        return (
          <InputText
            {...extraProps}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClassName}
          />
        );
      case "number":
        return (
          <InputNumber
            {...extraProps}
            value={value}
            onValueChange={(e) => handleChange(e.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClassName}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
          />
        );
      case "textarea":
        return (
          <InputTextarea
            {...extraProps}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            rows={4}
            autoResize
            placeholder={placeholder}
            className={inputClassName}
          />
        );
      case "password":
        return (
          <Password
            {...extraProps}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            toggleMask
            feedback={false}
            className={inputClassName}
          />
        );
      case "date":
        return (
          <Calendar
            {...extraProps}
            value={parseDateValue(value)}
            onChange={(e) => handleChange(e.value ? format(e.value, 'dd/MM/yyyy') : null)}
            showIcon
            dateFormat="dd/mm/yy"
            locale="en"
            className={inputClassName}
          />
        );
      case "select":
        return (
          <Dropdown
            {...extraProps}
            value={value ? String(value) : null}
            options={options}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => handleChange(String(e.value))}
            placeholder={placeholder}
            className={inputClassName}
            filter
            showClear
          />
        );
      case "multiselect":
        return (
          <MultiSelect
            {...extraProps}
            value={value || []}
            options={options}
            onChange={(e) => handleChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
            filter
            display="chip"
          />
        );
      case "checkbox":
        return (
          <div className="flex flex-wrap gap-3">
            {options.map((opt: any) => (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  inputId={`${field.field_code}_${opt.value}`}
                  value={opt.value}
                  checked={(value || []).includes(opt.value)}
                  onChange={(e) => {
                    const curr = value || [];
                    if (e.checked) handleChange([...curr, opt.value]);
                    else handleChange(curr.filter((v: any) => v !== opt.value));
                  }}
                />
                <label htmlFor={`${field.field_code}_${opt.value}`}>
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        );
      case "radio":
        return (
          <div className="flex flex-wrap gap-3">
            {options.map((opt: any) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioButton
                  inputId={`${field.field_code}_${opt.value}`}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleChange(e.value)}
                />
                <label htmlFor={`${field.field_code}_${opt.value}`}>
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        );
      case "switch":
        return (
          <InputSwitch
            checked={value || false}
            onChange={(e) => handleChange(e.value)}
          />
        );
      case "autocomplete":
        return (
          <AutoComplete
            {...extraProps}
            value={value}
            suggestions={autoCompleteFiltered}
            completeMethod={searchAutoComplete}
            field="label"
            onChange={(e) => handleChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
            dropdown
          />
        );
      default:
        return (
          <InputText
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            className={inputClassName}
          />
        );
    }
  };

  // ✅ CSS: Conditional Container Classes
  const containerClass = theme === "bootstrap" ? "mb-3" : "mb-4";
  const labelClass =
    theme === "bootstrap"
      ? "form-label fw-semibold d-flex align-items-center gap-2"
      : "flex items-center text-sm font-medium text-gray-700 mb-1";

  const docContainerClass =
    theme === "bootstrap"
      ? "d-flex align-items-start gap-3 p-3 border rounded bg-light mt-2"
      : "flex items-start gap-3 p-3 border rounded bg-gray-50 mt-2";

  return (
    <div className={containerClass}>
      <label className={labelClass}>
        <span>{label}</span>
        {isRequired && <span className="text-red-500 ml-1">*</span>}
        {isCalculated && <i className="pi pi-calculator ml-2 text-blue-500" />}
        {field.description && (
          <i
            className="pi pi-info-circle ml-2 text-gray-400"
            title={field.description}
          />
        )}
      </label>

      {renderInput()}

      {documentsForField.map((doc: any) => (
        <div key={doc.document_id} className={docContainerClass}>
          <i className="pi pi-file text-blue-600 mt-1" />
          <div className="text-sm w-full">
            <div className="font-medium">
              {doc.document_meta?.checklistDocumentName ||
                doc.description ||
                "Document Required"}{" "}
              {doc.is_mandatory && <span className="text-red-500">*</span>}
            </div>
            <input
              type="file"
              className="text-xs mt-1"
              onChange={(e) => onDocumentUpload?.(doc, e.target.files?.[0]!)}
            />
          </div>
        </div>
      ))}

      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};
// Repeater Renderer
const RepeaterRenderer = ({
  groupField, // the repeater field object
  sectionGridCols = 2, // section grid cols for sub-fields layout (used only as fallback in other logic)
  fieldMaster,
  values,
  onChange,
  onSetValues,
  onApiError,
  errors,
  readOnly,
  requiredDocuments,
  onDocumentUpload,
  onRemoveDocument,
  theme,
  overrides, // computed overrides map { [fieldCode]: { visible, required, readonly } }
}: any) => {
  const groupCode = groupField.field_code;
  const cfg: RepeaterConfig = groupField.repeater_config || {};
  const rows: any[] = Array.isArray(values[groupCode]) ? values[groupCode] : [];
  const itemLabel = cfg.item_label || groupField.label_override || "Item";
  const addLabel = cfg.add_button_label || `Add ${itemLabel}`;

  const canAdd =
    !readOnly && (cfg.max_items === undefined || rows.length < cfg.max_items);
  const canRemove = (idx: number) =>
    !readOnly &&
    (cfg.min_items === undefined || rows.length > (cfg.min_items ?? 0));

  // THEME-aware classes
  const outerClass =
    theme === "bootstrap"
      ? "p-3 border rounded bg-white"
      : "p-3 border rounded bg-white";
  const rowClass =
    theme === "bootstrap"
      ? "border rounded-3 p-3 mb-3"
      : "border rounded-md p-3 mb-3";
  const headerClass =
    theme === "bootstrap"
      ? "d-flex align-items-center justify-content-between mb-3"
      : "flex items-center justify-between mb-3";

  // inner grid (for sub-fields)
  const innerGridClass =
    theme === "bootstrap" ? "row g-3" : "grid grid-cols-12 gap-4";

  const getSubFieldMaster = (code: string) =>
    fieldMaster.find((f: any) => f.field_code === code);

  const spanToClass = (span: number) => {
    // NOTE: this keeps small screens full-width; single row guarantee applies at md+ (as your grid maps define).
    if (theme === "bootstrap") {
      const c = BOOTSTRAP_SPANS[span] || "col-md-12";
      return `col-12 ${c}`;
    }
    const c = TAILWIND_SPANS[span] || "md:col-span-12";
    return `col-span-12 ${c}`;
  };

  const pushEmptyRow = () => {
    // create row with undefined values for each sub-field
    const obj: Record<string, any> = {};
    (groupField.sub_fields || []).forEach((sf: FormField) => {
      obj[sf.field_code] = undefined;
    });
    const next = [...rows, obj];
    onChange(groupCode, next);
  };

  const removeRow = (idx: number) => {
    if (!canRemove(idx)) return;
    const next = rows.filter((_, i) => i !== idx);
    onChange(groupCode, next);
  };

  const updateRowField = (idx: number, code: string, val: any) => {
    const next = [...rows];
    next[idx] = { ...(next[idx] || {}), [code]: val };
    onChange(groupCode, next);
  };

  return (
    <div className={outerClass}>
      {/* Header with caption + Add button (no per-row remove here anymore) */}
      <div className={headerClass}>
        <div
          className={theme === "bootstrap" ? "fw-semibold" : "font-semibold"}
        >
          {groupField.label_override || "Add More"}
        </div>
        <div>
          <button
            type="button"
            className={
              theme === "bootstrap"
                ? "btn btn-sm btn-outline-primary"
                : "px-3 py-1.5 border rounded text-sm"
            }
            onClick={pushEmptyRow}
            disabled={!canAdd}
            title={!canAdd ? "Max items reached" : ""}
          >
            <i className="pi pi-plus mr-2" />
            {addLabel}
          </button>
        </div>
      </div>

      {/* Render rows */}
      {rows.length === 0 ? (
        <div className={theme === "bootstrap" ? "text-muted" : "text-gray-500"}>
          No {itemLabel.toLowerCase()}s added yet.
        </div>
      ) : (
        rows.map((rowObj, idx) => {
          // merged values: row overrides should allow conditions that refer to sub-fields
          const mergedContext = { ...values, ...rowObj };

          return (
            <div key={`${groupCode}_row_${idx}`} className={rowClass}>
              {/* Row header (only the label / index; remove button is moved to end of field row) */}
              <div className={headerClass}>
                <div
                  className={
                    theme === "bootstrap" ? "fw-medium" : "font-medium"
                  }
                >
                  {itemLabel} #{idx + 1}
                </div>
                <div /> {/* empty right side to keep spacing consistent */}
              </div>

              {/* Row grid of sub-fields + trailing 1-col trash button */}
              <div className={innerGridClass}>
                {(() => {
                  // 1) Filter sub-fields that are visible in THIS row
                  const visibleSubs: FormField[] = (
                    groupField.sub_fields || []
                  ).filter((sf: FormField) => {
                    const ov = overrides?.[sf.field_code];
                    if (ov?.visible === false) return false;
                    return evaluateCondition(
                      sf.condition as ConditionNode,
                      mergedContext,
                    );
                  });

                  // 2) Compute spans that SUM to 11 so the 12th column can host the trash button
                  const spans = computeRowSpans(visibleSubs, 11);

                  // 3) Render sub-fields with the precomputed spans
                  const subFieldNodes = visibleSubs.map(
                    (sf: FormField, idx2: number) => {
                      const ov = overrides?.[sf.field_code];
                      const subMaster = getSubFieldMaster(sf.field_code);

                      const colSpan = spans[idx2]; // <-- total 11 across all visible subs
                      const wrapperClass = spanToClass(colSpan);

                      // error path convention: REPEATER_CODE[IDX].SUB_FIELD
                      const errorKey = `${groupCode}[${idx}].${sf.field_code}`;
                      const error = errors?.[errorKey];

                      return (
                        <div
                          key={`${groupCode}_${sf.field_code}_${idx}`}
                          className={wrapperClass}
                        >
                          <FieldRenderer
                            field={sf}
                            fieldMasterDef={subMaster}
                            value={rowObj?.[sf.field_code]}
                            onChange={(val: any) =>
                              updateRowField(idx, sf.field_code, val)
                            }
                            onSetValues={onSetValues}
                            onApiError={onApiError}
                            error={error}
                            readOnly={readOnly || ov?.readonly === true}
                            formValues={mergedContext}
                            requiredDocuments={requiredDocuments}
                            onDocumentUpload={onDocumentUpload}
                            onRemoveDocument={onRemoveDocument}
                            theme={theme}
                            override={ov}
                          />
                        </div>
                      );
                    },
                  );

                  // 4) Trailing 1-col REMOVE (trash icon) cell, right-aligned
                  const removeCellClass = spanToClass(1);
                  const alignClass =
                    theme === "bootstrap"
                      ? "d-flex justify-content-end align-items-center h-100"
                      : "flex justify-end items-center h-full";

                  const trashBtn = (
                    <button
                      type="button"
                      className={
                        theme === "bootstrap"
                          ? "btn btn-sm btn-outline-danger p-2"
                          : "p-2 border rounded text-red-600 hover:bg-red-50"
                      }
                      onClick={() => removeRow(idx)}
                      disabled={!canRemove(idx)}
                      title={
                        !canRemove(idx)
                          ? `Minimum ${cfg.min_items ?? 0} required`
                          : "Remove"
                      }
                      aria-label="Remove row"
                    >
                      <i className="pi pi-trash" />
                    </button>
                  );

                  return (
                    <>
                      {subFieldNodes}
                      <div className={removeCellClass}>
                        <div className={alignClass}>{trashBtn}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
// ----------------------------------------------------------------------
// 5. SECTION RENDERER
// ----------------------------------------------------------------------
const SectionRenderer = ({
  section,
  sectionIndex,
  fieldMaster,
  values,
  onChange,
  onSetValues,
  onApiError,
  errors,
  readOnly,
  requiredDocuments,
  onDocumentUpload,
  onRemoveDocument,
  theme,
  overrides, // ✅ Receive computed overrides
}: any) => {
  const shouldRender = evaluateCondition(
    section.condition as ConditionNode,
    values,
  );
  if (!shouldRender) return null;

  const containerClass =
    theme === "bootstrap"
      ? "border rounded-4 p-4 bg-white mb-4"
      : "bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm";

  const gridContainerClass =
    theme === "bootstrap" ? "mt-3 row g-3" : "grid grid-cols-12 gap-4 mt-4";

  return (
    <div className={containerClass}>
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex flex-column">
          <div
            className={
              theme === "bootstrap"
                ? "fw-semibold fs-5"
                : "text-lg font-semibold"
            }
          >
            {section.section_title}
          </div>
          {section.description && (
            <small className="text-muted">{section.description}</small>
          )}
        </div>
      </div>

      <div className={gridContainerClass}>
        {section.fields.map((field: FormField) => {
          const ov = overrides[field.field_code];
          if (ov?.visible === false) return null;
          if (!evaluateCondition(field.condition as ConditionNode, values))
            return null;

          // compute wrapper span for this field (or repeater as a whole)
          let colSpan = 12;
          if (field.grid_span) colSpan = field.grid_span;
          else {
            const sectionCols = section.grid_cols || 2;
            colSpan = Math.floor(12 / sectionCols);
          }
          const wrapperClass =
            theme === "bootstrap"
              ? `col-12 ${BOOTSTRAP_SPANS[colSpan] || "col-md-12"}`
              : `col-span-12 ${TAILWIND_SPANS[colSpan] || "md:col-span-12"}`;

          // REPEATER?
          const isRepeater =
            field.is_repeater === true || field.component_type === "repeater";

          if (isRepeater) {
            return (
              <div key={field.field_code} className={wrapperClass}>
                <RepeaterRenderer
                  groupField={field}
                  sectionGridCols={section.grid_cols || 2}
                  fieldMaster={fieldMaster}
                  values={values}
                  onChange={onChange}
                  onSetValues={onSetValues}
                  onApiError={onApiError}
                  errors={errors}
                  readOnly={readOnly}
                  requiredDocuments={requiredDocuments}
                  onDocumentUpload={onDocumentUpload}
                  onRemoveDocument={onRemoveDocument}
                  theme={theme}
                  overrides={overrides}
                />
              </div>
            );
          }

          // NON-REPEATER (original)
          const fieldMasterDef = fieldMaster.find(
            (f: any) => f.field_code === field.field_code,
          );

          return (
            <div key={field.field_code} className={wrapperClass}>
              <FieldRenderer
                field={field}
                fieldMasterDef={fieldMasterDef}
                value={values[field.field_code]}
                onChange={(val: any) => onChange(field.field_code, val)}
                onSetValues={onSetValues}
                onApiError={onApiError}
                error={errors?.[field.field_code]}
                readOnly={readOnly || ov?.readonly === true}
                formValues={values}
                requiredDocuments={requiredDocuments}
                onDocumentUpload={onDocumentUpload}
                onRemoveDocument={onRemoveDocument}
                theme={theme}
                override={ov}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. MAIN EXPORT
// ----------------------------------------------------------------------
export const DynamicFormRenderer = ({
  formStructure,
  fieldMaster,
  values,
  serviceId,
  onChange,
  onSetValues,
  onApiError,
  errors,
  readOnly = false,
  requiredDocuments,
  onDocumentUpload,
  onRemoveDocument,
  theme = "bootstrap",
  rules = [], // ✅ Form Rules
}: DynamicFormRendererProps) => {
  const plugin = useServicePlugin(serviceId);

  // ✅ COMPUTE LOGIC OVERRIDES
  const computedOverrides = useMemo(() => {
    const out: Record<string, FieldOverrides> = {};
    if (rules && Array.isArray(rules)) {
      const activeRules = rules.filter((r) => r.is_active === "Y");

      for (const rule of activeRules) {
        try {
          // Check condition
          if (!evaluateRuleCondition(rule.when_json, values)) continue;

          // Apply Actions
          const actions = rule.then_json?.actions || [];
          if (Array.isArray(actions)) {
            for (const act of actions) {
              const target = act.targetField || act.target_field_code;
              if (!target) continue;

              if (!out[target]) out[target] = {};

              // Support legacy format and new LogicBuilderModal format
              if (act.set) {
                // Legacy: { set: { visible: true } }
                Object.assign(out[target], act.set);
              } else if (act.action && act.value !== undefined) {
                // New: { action: 'visible', value: true }
                // Map 'visible'/'required'/'readonly'
                (out[target] as any)[act.action] = act.value;
              }
            }
          }
        } catch (e) {
          console.warn("Rule Engine Error", e);
        }
      }
    }
    if (plugin) {
      const allFields = formStructure.flatMap((section) => section.fields || []);
      for (const field of allFields) {
        const fieldCode = field.field_code;
        if (!fieldCode) continue;

        const pluginVisible = plugin.isFieldVisible?.(fieldCode, values);
        if (pluginVisible !== undefined) {
          if (!out[fieldCode]) out[fieldCode] = {};
          out[fieldCode].visible = pluginVisible;
        }

        const pluginRequired = plugin.isFieldRequired?.(fieldCode, values);
        if (pluginRequired !== undefined) {
          if (!out[fieldCode]) out[fieldCode] = {};
          out[fieldCode].required = pluginRequired;
        }

        const pluginReadonly = plugin.isFieldReadonly?.(fieldCode, values);
        if (pluginReadonly !== undefined) {
          if (!out[fieldCode]) out[fieldCode] = {};
          out[fieldCode].readonly = pluginReadonly;
        }
      }
    }

    return out;
  }, [formStructure, plugin, rules, values]);

  if (!formStructure || formStructure.length === 0) {
    return <div className="p-4 text-center text-muted">No form structure.</div>;
  }

  return (
    <div className="dynamic-form-renderer">
      {formStructure.map((section, index) => (
        <SectionRenderer
          key={index}
          section={section}
          sectionIndex={index}
          fieldMaster={fieldMaster}
          values={values}
          onChange={onChange}
          onSetValues={onSetValues}
          onApiError={onApiError}
          errors={errors}
          readOnly={readOnly}
          requiredDocuments={requiredDocuments}
          onDocumentUpload={onDocumentUpload}
          onRemoveDocument={onRemoveDocument}
          theme={theme}
          overrides={computedOverrides} // ✅ Pass computed overrides
        />
      ))}
    </div>
  );
};

// 7. HOOK
export const useDynamicForm = (
  initialValues: Record<string, any> = {},
  formStructure?: FormSection[],
  serviceId?: string,
) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const plugin = useServicePlugin(serviceId);
  const defaultsAppliedRef = useRef(false);

  // Apply plugin default values on mount or when formStructure changes
  useEffect(() => {
    if (!plugin?.getFieldDefaultValue || !formStructure || defaultsAppliedRef.current) return;

    const defaultValues: Record<string, any> = {};
    let hasDefaults = false;

    formStructure.forEach((section) => {
      section.fields.forEach((field) => {
        // Only apply default if field doesn't already have a value in current state
        if (
          !values[field.field_code] ||
          values[field.field_code] === undefined ||
          values[field.field_code] === null ||
          values[field.field_code] === ''
        ) {
          const defaultValue = plugin?.getFieldDefaultValue?.(field.field_code, values);
          if (defaultValue !== undefined) {
            defaultValues[field.field_code] = defaultValue;
            hasDefaults = true;
          }
        }
      });
    });

    if (hasDefaults) {
      defaultsAppliedRef.current = true;
      setValues((prev) => ({ ...prev, ...defaultValues }));
    }
  }, [formStructure, plugin]);

  // Extract calculated fields
  const calculatedFields = useMemo(() => {
    const fields: { [code: string]: CalculationConfig } = {};
    if (formStructure) {
      formStructure.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.calculation?.enabled) {
            fields[field.field_code] = field.calculation;
          }
        });
      });
    }
    return fields;
  }, [formStructure]);

  // Auto-calculate logic (existing CalculationConfig system)
  useEffect(() => {
    const calculatedCodes = Object.keys(calculatedFields);
    if (calculatedCodes.length === 0) return;

    const newCalculatedValues: Record<string, any> = {};
    let hasChanges = false;

    calculatedCodes.forEach((fieldCode) => {
      const config = calculatedFields[fieldCode];
      if (!config.enabled || config.formula_type === "lookup") return;

      const newValue = calculateFieldValue(config, values);
      if (values[fieldCode] !== newValue) {
        newCalculatedValues[fieldCode] = newValue;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setValues((prev) => ({ ...prev, ...newCalculatedValues }));
    }
  }, [values, calculatedFields]);

  // ── Formula Engine: extract fields with component_props.formula ──────────
  const formulaFields = useMemo(() => {
    const map: Record<string, {
      expression: string;
      decimals: number;
      prefix: string;
      suffix: string;
      onError: string;
      trigger: string;
    }> = {};
    if (!formStructure) return map;
    formStructure.forEach((section) => {
      section.fields.forEach((field) => {
        const formula = field.component_props?.formula;
        if (formula?.enabled && String(formula?.expression ?? '').trim()) {
          map[field.field_code] = {
            expression: String(formula.expression).trim(),
            decimals: formula.resultFormat?.decimals ?? 0,
            prefix: formula.resultFormat?.prefix ?? '',
            suffix: formula.resultFormat?.suffix ?? '',
            onError: formula.onError ?? 'showZero',
            trigger: formula.trigger ?? 'onChange',
          };
        }
      });
    });
    return map;
  }, [formStructure]);

  // Pre-load mathjs on mount so evaluateFormulaSync works synchronously
  useEffect(() => { preloadMathjs(); }, []);

  // ── Formula Engine: auto-calculate on every value change ─────────────────
  useEffect(() => {
    const formulaCodes = Object.keys(formulaFields);
    if (formulaCodes.length === 0) return;

    const updates: Record<string, string> = {};
    let hasChanges = false;

    formulaCodes.forEach((fieldCode) => {
      const { expression, decimals, onError } = formulaFields[fieldCode];
      // Date functions (YEARS, MONTHS, DAYS, AGE) always return integers — force 0 decimals
      const effectiveDecimals = formulaHasDateFunctions(expression) ? 0 : decimals;
      const result = evaluateFormulaSync(expression, values, { decimals: effectiveDecimals });

      let newValue: string;
      if (result.error !== null) {
        newValue =
          onError === 'showZero' ? Number(0).toFixed(effectiveDecimals)
          : onError === 'showError' ? '#ERROR'
          : '';
      } else {
        newValue = result.value !== null ? Number(result.value).toFixed(effectiveDecimals) : Number(0).toFixed(effectiveDecimals);
      }

      if (String(values[fieldCode] ?? '') !== newValue) {
        updates[fieldCode] = newValue;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setValues((prev) => ({ ...prev, ...updates }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, formulaFields]);

  const handleChange = useCallback(
    (fieldCode: string, value: any) => {
      const calc = calculatedFields[fieldCode];
      if (calc?.enabled && calc.formula_type !== "lookup") return; // block edit of computed fields

      // Block direct editing of formula-computed fields (auto-calculated by engine)
      if (formulaFields[fieldCode]) return;

      setValues((prev) => {
        const next = { ...prev, [fieldCode]: value };
        if (plugin?.onFieldChange) {
          const pluginUpdates = plugin.onFieldChange(fieldCode, value, next);
          if (pluginUpdates && typeof pluginUpdates === "object") {
            Object.assign(next, pluginUpdates);
          }
        }
        return next;
      });
      setTouched((prev) => ({ ...prev, [fieldCode]: true }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldCode];
        return newErrors;
      });
    },
    [calculatedFields, formulaFields, plugin],
  );

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = useCallback(
    (
      structure: FormSection[],
      fieldMasterList: FieldMasterDef[],
      rules?: FormRule[],
    ): boolean => {
      const newErrors: Record<string, string> = {};

      // 1) Compute overrides (synchronously) so validation sees the right required/visible state
      const overrides: Record<string, FieldOverrides> = {};
      if (rules) {
        const activeRules = rules.filter((r) => r.is_active === "Y");
        for (const rule of activeRules) {
          if (evaluateRuleCondition(rule.when_json, values)) {
            const actions = rule.then_json?.actions || [];
            if (Array.isArray(actions)) {
              for (const act of actions) {
                const target = act.targetField || act.target_field_code;
                if (!target) continue;
                if (!overrides[target]) overrides[target] = {};
                if (act.set) Object.assign(overrides[target], act.set);
                else if (act.action)
                  (overrides[target] as any)[act.action] = act.value;
              }
            }
          }
        }
      }

      if (plugin) {
        structure.forEach((section) => {
          section.fields.forEach((field) => {
            const fieldCode = field.field_code;
            if (!fieldCode) return;

            const pluginVisible = plugin.isFieldVisible?.(fieldCode, values);
            if (pluginVisible !== undefined) {
              if (!overrides[fieldCode]) overrides[fieldCode] = {};
              overrides[fieldCode].visible = pluginVisible;
            }

            const pluginRequired = plugin.isFieldRequired?.(fieldCode, values);
            if (pluginRequired !== undefined) {
              if (!overrides[fieldCode]) overrides[fieldCode] = {};
              overrides[fieldCode].required = pluginRequired;
            }

            const pluginReadonly = plugin.isFieldReadonly?.(fieldCode, values);
            if (pluginReadonly !== undefined) {
              if (!overrides[fieldCode]) overrides[fieldCode] = {};
              overrides[fieldCode].readonly = pluginReadonly;
            }
          });
        });
      }

      // 2) Validate the structure (single pass)
      structure.forEach((section) => {
        // if (!evaluateLegacyCondition(section.condition, values)) return;
        if (!evaluateCondition(section.condition as ConditionNode, values))
          return null;

        // inside validate(), where you loop section.fields:
        section.fields.forEach((field) => {
          const ov = overrides[field.field_code];
          if (ov?.visible === false) return;

          // REPEATER?
          const isRepeater =
            field.is_repeater === true || field.component_type === "repeater";

          if (isRepeater) {
            const rCfg = field.repeater_config || {};
            const rows: any[] = Array.isArray(values[field.field_code])
              ? values[field.field_code]
              : [];

            // min / max items validation
            if (rCfg.min_items !== undefined && rows.length < rCfg.min_items) {
              newErrors[field.field_code] =
                `${field.label_override || field.field_code}: minimum ${rCfg.min_items} ${rCfg.item_label || "item"}(s) required`;
            }
            if (rCfg.max_items !== undefined && rows.length > rCfg.max_items) {
              newErrors[field.field_code] =
                `${field.label_override || field.field_code}: maximum ${rCfg.max_items} ${rCfg.item_label || "item"}(s) allowed`;
            }

            // Sub-fields validation per row
            const subFields = field.sub_fields || [];
            rows.forEach((rowObj, idx) => {
              const merged = { ...values, ...rowObj };
              subFields.forEach((sf) => {
                const ovSub = overrides[sf.field_code];
                if (ovSub?.visible === false) return; // hidden -> skip

                // respect sub-field condition too
                if (!evaluateCondition(sf.condition as ConditionNode, merged))
                  return;

                const subLabel =
                  sf.label_override ||
                  fieldMasterList.find((fm) => fm.field_code === sf.field_code)
                    ?.field_label ||
                  sf.field_code;

                const pathKey = `${field.field_code}[${idx}].${sf.field_code}`;
                const value = rowObj?.[sf.field_code];

                const isRequired = ovSub?.required ?? sf.required;
                const subMaster = fieldMasterList.find(
                  (fm) => fm.field_code === sf.field_code,
                );
                const componentType = subMaster?.data_type;
                const validation = {
                  ...subMaster?.default_validation,
                  ...sf.validation_override,
                  ...sf.validation_rules,
                };

                // Required
                const empty =
                  value === undefined ||
                  value === null ||
                  value === "" ||
                  (Array.isArray(value) && value.length === 0);
                if (isRequired && empty) {
                  newErrors[pathKey] = `${subLabel} is required`;
                  return;
                }

                // Type-specific
                if (
                  componentType === "email" &&
                  typeof value === "string" &&
                  value &&
                  !EMAIL_REGEX.test(value)
                ) {
                  newErrors[pathKey] = validation.message || "Invalid email";
                }
                if (componentType === "number" && typeof value === "number") {
                  if (validation.min !== undefined && value < validation.min)
                    newErrors[pathKey] = `Min value is ${validation.min}`;
                  if (validation.max !== undefined && value > validation.max)
                    newErrors[pathKey] = `Max value is ${validation.max}`;
                }
                if (typeof value === "string" && validation.pattern) {
                  try {
                    const re = new RegExp(validation.pattern);
                    if (!re.test(value)) {
                      newErrors[pathKey] =
                        validation.message || "Invalid format";
                    }
                  } catch {}
                }
              });
            });

            // Done with repeater
            return;
          }

          // =============================
          // ORIGINAL NON-REPEATER LOGIC...
          // =============================
          const value = values[field.field_code];
          const fieldMasterDef = fieldMasterList.find(
            (f) => f.field_code === field.field_code,
          );
          const componentType = fieldMasterDef?.data_type;
          const label =
            field.label_override ||
            fieldMasterDef?.field_label ||
            field.field_code;

          const isRequiredField = (ov?.required ?? field.required) === true;

          const validation = {
            ...fieldMasterDef?.default_validation,
            ...field.validation_override,
            ...field.validation_rules,
          };

          if (isRequiredField) {
            const empty =
              value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0);
            if (empty) {
              newErrors[field.field_code] = `${label} is required`;
              return;
            }
          }

          const pluginError = plugin?.validateField?.(field.field_code, value, values);
          if (pluginError) {
            newErrors[field.field_code] = pluginError;
            return;
          }

          if (
            componentType === "email" &&
            typeof value === "string" &&
            value &&
            !EMAIL_REGEX.test(value)
          ) {
            newErrors[field.field_code] = validation.message || "Invalid email";
          }

          if (componentType === "number" && typeof value === "number") {
            if (validation.min !== undefined && value < validation.min) {
              newErrors[field.field_code] = `Min value is ${validation.min}`;
            }
            if (validation.max !== undefined && value > validation.max) {
              newErrors[field.field_code] = `Max value is ${validation.max}`;
            }
          }
        });
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [plugin, values],
  );

  const reset = useCallback((newValues: Record<string, any> = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, []);

  const isCalculated = useCallback(
    (fieldCode: string) => !!calculatedFields[fieldCode]?.enabled,
    [calculatedFields],
  );

  return {
    values,
    errors,
    touched,
    handleChange,
    validate,
    reset,
    setValues,
    setErrors,
    isCalculated,
  };
};

export default DynamicFormRenderer;
