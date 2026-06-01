"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Slider } from "primereact/slider";
import { Rating } from "primereact/rating";
import { Chips } from "primereact/chips";
import { ColorPicker } from "primereact/colorpicker";
import { AutoComplete } from "primereact/autocomplete";
import { classNames } from "primereact/utils";
import { CalculationConfig } from "@/components/admin/master/CalculationEditor";
import { calculateFieldValue } from "@/hooks/useCalculations";
import { useMasterTables } from "@/hooks/master/useSchemes";

// Types
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

interface FormField {
  field_code: string;
  required?: boolean;
  label_override?: string;
  placeholder?: string;
  description?: string;
  validation_override?: ValidationOverride;
  dependency?: FieldDependency;
  condition?: FieldCondition;
  options?: Array<{ label: string; value: string }>;
  calculation?: CalculationConfig; // Calculation configuration for computed fields
}

interface FormSection {
  section_title: string;
  description?: string;
  grid_cols?: 1 | 2 | 3;
  condition?: FieldCondition;
  fields: FormField[];
}

interface FieldMasterDef {
  field_code: string;
  field_label: string;
  data_type: string;
  component_type: string;
  default_validation?: any;
  lookup_config?: any;
  integration_config?: {
    auto_fill?: {
      enabled: boolean;
      endpoint: string;
      method: "GET" | "POST";
      trigger: "blur" | "change";
      request_param: string;
      response_mappings: Array<{ target_field: string; response_path: string }>;
    };
    api_validation?: {
      enabled: boolean;
      endpoint: string;
      method: "GET" | "POST";
      request_param: string;
      success_path: string;
      message_path: string;
    };
  };
  is_active: boolean;
}

interface RequiredDocument {
  document_id: number;
  description?: string;
  is_mandatory: boolean;
  allowed_types?: string[];
  max_size_mb?: number;
  condition?: FieldCondition;
  show_beside_field?: string;
  document_meta?: {
    checklistDocumentName?: string;
    checklistId?: string;
    checklistDocumentMaxSize?: number;
  };
}

interface RequiredDocumentsConfig {
  documents: RequiredDocument[];
}

interface DynamicFormRendererProps {
  formStructure: FormSection[];
  fieldMaster: FieldMasterDef[];
  values: Record<string, any>;
  onChange: (fieldCode: string, value: any) => void;
  onSetValues?: (values: Record<string, any>) => void;
  errors?: Record<string, string>;
  onApiError?: (fieldCode: string, error: string) => void;
  readOnly?: boolean;

  requiredDocuments?: {
    documents: RequiredDocument[];
  };
  onDocumentUpload?: (doc: RequiredDocument, file: File) => void;
  onRemoveDocument?: (doc: RequiredDocument) => void;
}
interface LookupConfig {
  source?: "master" | "static";
  table_code: string;
  match_field: string;
  match_column: string;
  return_column: string;
  static_options?: {
    label: string;
    value: string | number;
  }[];
}

// Condition evaluator
const evaluateCondition = (
  condition: FieldCondition | undefined,
  formValues: Record<string, any>,
): boolean => {
  if (!condition) return true;

  const fieldValue = formValues[condition.field_code];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "not_equals":
      return fieldValue !== conditionValue;
    case "in":
      return (
        Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      );
    case "not_in":
      return (
        Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
      );
    case "greater_than":
      return Number(fieldValue) > Number(conditionValue);
    case "less_than":
      return Number(fieldValue) < Number(conditionValue);
    case "is_empty":
      return (
        !fieldValue ||
        (typeof fieldValue === "string" && fieldValue.trim() === "")
      );
    case "is_not_empty":
      return (
        fieldValue &&
        (typeof fieldValue !== "string" || fieldValue.trim() !== "")
      );
    case "contains":
      return (
        typeof fieldValue === "string" && fieldValue.includes(conditionValue)
      );
    default:
      return true;
  }
};

// Helper to get nested value from object using dot path
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

// Individual Field Renderer Component
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
}: {
  field: FormField;
  fieldMasterDef: FieldMasterDef | undefined;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  readOnly?: boolean;
  formValues: Record<string, any>;
  onSetValues?: (values: Record<string, any>) => void;
  onApiError?: (fieldCode: string, error: string) => void;
  requiredDocuments?: {
    documents: RequiredDocument[];
  };
  onDocumentUpload?: (doc: RequiredDocument, file: File) => void;
  onRemoveDocument?: (doc: RequiredDocument) => void;
}) => {
  const [dependencyOptions, setDependencyOptions] = useState<any[]>([]);
  const [autoCompleteFiltered, setAutoCompleteFiltered] = useState<any[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const { data: masterTables = [] } = useMasterTables();
  const [lookupOptions, setLookupOptions] = useState<
    { label: string; value: any }[]
  >([]);
  // Memoize lookup config
  const lookupConfig = useMemo(() => {
    return field.calculation?.lookup as LookupConfig | undefined;
  }, [field.calculation?.lookup]);
  const isSameOptions = (
    a: { label: string; value: any }[],
    b: { label: string; value: any }[],
  ) => {
    if (a.length !== b.length) return false;
    return a.every(
      (opt, i) => opt.label === b[i].label && opt.value === b[i].value,
    );
  };

  useEffect(() => {
    let nextOptions: { label: string; value: any }[] = [];

    if (
      !field.calculation?.enabled ||
      field.calculation?.formula_type !== "lookup" ||
      !lookupConfig
    ) {
      // keep nextOptions empty
    } else if (lookupConfig.source === "static") {
      /* ===============================
     STATIC LOOKUP
  =============================== */
      nextOptions =
        lookupConfig.static_options?.map((opt) => ({
          label: opt.label,
          value: opt.value,
        })) || [];
    } else if (lookupConfig.source === "master") {
      /* ===============================
     MASTER TABLE LOOKUP
  =============================== */
      const { table_code, match_column, return_column } = lookupConfig;

      const masterTable = masterTables.find(
        (t) => t.master_code === table_code,
      );

      if (masterTable?.data && match_column && return_column) {
        nextOptions = masterTable.data.map((row: any) => ({
          value: String(row[match_column]),
          label: row[return_column],
        }));
      }
    }

    // ✅ CRITICAL: only update state if options actually changed
    setLookupOptions((prev) =>
      isSameOptions(prev, nextOptions) ? prev : nextOptions,
    );
  }, [
    field.calculation?.enabled,
    field.calculation?.formula_type,
    lookupConfig,
    masterTables,
  ]);

  // Get field properties
  const label =
    field.label_override || fieldMasterDef?.field_label || field.field_code;
  const placeholder = field.placeholder || `Enter ${label}`;
  const componentType = fieldMasterDef?.data_type;
  const isRequired = field.required;
  const hasError = !!error;
  const isCalculated =
    (field.calculation?.enabled || false) &&
    field.calculation?.formula_type !== "lookup";

  // Integration config
  const integrationConfig = fieldMasterDef?.integration_config;
  const autoFillConfig = integrationConfig?.auto_fill;
  const apiValidationConfig = integrationConfig?.api_validation;

  // Inside FieldRenderer component
  // console.log("requiredDocuments", requiredDocuments);
  const documentsForField = useMemo(() => {
    if (!Array.isArray(requiredDocuments)) return [];

    return requiredDocuments.filter((doc) => {
      // Must belong to this field
      if (doc.show_beside_field !== field.field_code) return false;

      // ✅ If document already has a value, always show it
      if (
        doc.show_beside_field !== undefined &&
        doc.show_beside_field !== null &&
        doc.show_beside_field !== ""
      ) {
        return true;
      }

      // Evaluate condition only if value is empty
      if (doc.condition) {
        return evaluateCondition(doc.condition, formValues);
      }

      // Default: show
      return true;
    });
  }, [requiredDocuments, field.field_code, formValues]);

  // console.log("requiredDocuments", documentsForField);

  // Auto-fill API call handler
  const handleAutoFill = useCallback(
    async (currentValue: any) => {
      if (!autoFillConfig?.enabled || !autoFillConfig.endpoint || !currentValue)
        return;

      setIsApiLoading(true);
      try {
        let response;
        const url = autoFillConfig.endpoint;
        const paramName = autoFillConfig.request_param || "value";

        if (autoFillConfig.method === "GET") {
          response = await fetch(
            `${url}?${paramName}=${encodeURIComponent(currentValue)}`,
          );
        } else {
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [paramName]: currentValue }),
          });
        }

        if (response.ok) {
          const data = await response.json();
          // Map response to form fields
          if (autoFillConfig.response_mappings && onSetValues) {
            const newValues: Record<string, any> = {};
            autoFillConfig.response_mappings.forEach((mapping) => {
              const mappedValue = getNestedValue(data, mapping.response_path);
              if (mappedValue !== undefined) {
                newValues[mapping.target_field] = mappedValue;
              }
            });
            if (Object.keys(newValues).length > 0) {
              onSetValues(newValues);
            }
          }
        }
      } catch (err) {
        console.error("Auto-fill API error:", err);
      } finally {
        setIsApiLoading(false);
      }
    },
    [autoFillConfig, onSetValues],
  );

  // API Validation handler
  const handleApiValidation = useCallback(
    async (currentValue: any) => {
      if (
        !apiValidationConfig?.enabled ||
        !apiValidationConfig.endpoint ||
        !currentValue
      )
        return;

      setIsApiLoading(true);
      try {
        let response;
        const url = apiValidationConfig.endpoint;
        const paramName = apiValidationConfig.request_param || "value";

        if (apiValidationConfig.method === "GET") {
          response = await fetch(
            `${url}?${paramName}=${encodeURIComponent(currentValue)}`,
          );
        } else {
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [paramName]: currentValue }),
          });
        }

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
        console.error("API Validation error:", err);
      } finally {
        setIsApiLoading(false);
      }
    },
    [apiValidationConfig, field.field_code, onApiError],
  );

  // Handle blur event for API calls
  const handleBlur = useCallback(() => {
    if (autoFillConfig?.enabled && autoFillConfig.trigger === "blur") {
      handleAutoFill(value);
    }
    if (apiValidationConfig?.enabled) {
      handleApiValidation(value);
    }
  }, [
    autoFillConfig,
    apiValidationConfig,
    value,
    handleAutoFill,
    handleApiValidation,
  ]);

  // Handle change with optional trigger
  const handleChange = useCallback(
    (newValue: any) => {
      onChange(newValue);
      if (autoFillConfig?.enabled && autoFillConfig.trigger === "change") {
        handleAutoFill(newValue);
      }
    },
    [onChange, autoFillConfig, handleAutoFill],
  );

  // Get options from lookup_config or field options
  const baseOptions = useMemo(() => {
    if (field.options && field.options.length > 0) {
      return field.options;
    }
    if (fieldMasterDef?.lookup_config?.options) {
      return fieldMasterDef.lookup_config.options;
    }
    return [];
  }, [field.options, fieldMasterDef?.lookup_config?.options]);

  // Handle dependency
  useEffect(() => {
    if (field.dependency?.trigger_field && field.dependency?.endpoint) {
      const parentValue = formValues[field.dependency.trigger_field];
      if (parentValue) {
        const fetchDependentOptions = async () => {
          try {
            const response = await fetch(
              `${field.dependency!.endpoint}?${
                field.dependency!.query_param
              }=${parentValue}`,
            );
            const data = await response.json();
            setDependencyOptions(data);
          } catch (err) {
            console.error("Error fetching dependent options:", err);
            setDependencyOptions([]);
          }
        };
        fetchDependentOptions();
      } else {
        setDependencyOptions([]);
      }
    }
  }, [field.dependency, formValues]);

  // const options = field.dependency ? dependencyOptions : baseOptions;
  const options = useMemo(() => {
    // 1️⃣ Dependency-based options
    if (field.dependency && dependencyOptions.length > 0) {
      return dependencyOptions;
    }

    // 2️⃣ Lookup-based options
    if (
      field.calculation?.enabled &&
      field.calculation?.formula_type === "lookup" &&
      lookupOptions.length > 0
    ) {
      return lookupOptions;
    }

    // 3️⃣ Static / base options
    return baseOptions;
  }, [
    field.dependency,
    dependencyOptions,
    field.calculation?.enabled,
    field.calculation?.formula_type,
    lookupOptions,
    baseOptions,
  ]);

  // Common input class
  const inputClassName = classNames("w-full", { "p-invalid": hasError });

  // AutoComplete search handler
  const searchAutoComplete = (event: { query: string }) => {
    const filtered = options.filter((opt: any) =>
      opt.label?.toLowerCase().includes(event.query.toLowerCase()),
    );
    setAutoCompleteFiltered(filtered);
  };

  // Render based on component type
  const renderField = () => {
    if (isCalculated) {
      return (
        <InputNumber
          value={value ?? 0}
          disabled
          className={classNames(inputClassName, "calculated-field")}
          style={{ backgroundColor: "#f0f9ff", fontWeight: "600" }}
          mode="decimal"
        />
      );
    }

    if (readOnly) {
      return (
        <InputText
          value={value?.toString() || "-"}
          disabled
          className={inputClassName}
        />
      );
    }
    switch (componentType) {
      case "text":
      case "email":
      case "phone":
        return (
          <InputText
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClassName}
            type={
              componentType === "email"
                ? "email"
                : componentType === "phone"
                  ? "tel"
                  : "text"
            }
          />
        );

      case "password":
        return (
          <Password
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClassName}
            toggleMask
            feedback={false}
          />
        );

      case "number":
        return (
          <InputNumber
            value={value}
            onValueChange={(e) => handleChange(e.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={inputClassName}
            min={field.validation_override?.min}
            max={field.validation_override?.max}
          />
        );

      case "textarea":
        return (
          <InputTextarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClassName}
            rows={4}
            autoResize
          />
        );

      case "date":
        return (
          <Calendar
            value={parseDateValue(value)}
            onChange={(e) => onChange(e.value ? format(e.value, 'dd/MM/yyyy') : null)}
            placeholder={placeholder}
            className={inputClassName}
            dateFormat="dd/mm/yy"
            locale="en"
            showIcon
          />
        );

      case "time":
        return (
          <Calendar
            value={value ? new Date(value) : null}
            onChange={(e) => onChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
            timeOnly
            showIcon
          />
        );

      case "daterange":
        return (
          <Calendar
            value={value && Array.isArray(value) ? value.map((d: any) => parseDateValue(d)) : null}
            onChange={(e) => {
              if (e.value && Array.isArray(e.value)) {
                const formatted = e.value.map((d: any) => d ? format(d, 'dd/MM/yyyy') : null);
                onChange(formatted);
              } else {
                onChange(e.value);
              }
            }}
            placeholder={placeholder}
            className={inputClassName}
            selectionMode="range"
            dateFormat="dd/mm/yy"
            locale="en"
            showIcon
          />
        );

      case "select":
        return (
          <Dropdown
            value={value ? String(value) : null}
            options={options}
            optionLabel="label"
            optionValue="value"
            onChange={(e) => onChange(String(e.value))}
            placeholder={placeholder}
            className={inputClassName}
            filter
            showClear
          />
        );

      case "multiselect":
        return (
          <MultiSelect
            value={value || []}
            options={options}
            onChange={(e) => onChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
            filter
            display="chip"
          />
        );

      case "autocomplete":
        return (
          <AutoComplete
            value={value}
            suggestions={autoCompleteFiltered}
            completeMethod={searchAutoComplete}
            field="label"
            onChange={(e) => onChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
            dropdown
          />
        );

      case "checkbox":
        return (
          <div className="flex flex-wrap gap-4">
            {options.map((opt: any) => (
              <div key={opt.value} className="flex items-center">
                <Checkbox
                  inputId={`${field.field_code}_${opt.value}`}
                  value={opt.value}
                  checked={(value || []).includes(opt.value)}
                  onChange={(e) => {
                    const current = value || [];
                    if (e.checked) {
                      onChange([...current, opt.value]);
                    } else {
                      onChange(current.filter((v: any) => v !== opt.value));
                    }
                  }}
                />
                <label
                  htmlFor={`${field.field_code}_${opt.value}`}
                  className="ml-2 text-sm text-gray-700"
                >
                  {opt.label}
                </label>
              </div>
            ))}
          </div>
        );

      case "radio":
        return (
          <div className="flex flex-wrap gap-4">
            {options.map((opt: any) => (
              <div key={opt.value} className="flex items-center">
                <RadioButton
                  inputId={`${field.field_code}_${opt.value}`}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.value)}
                />
                <label
                  htmlFor={`${field.field_code}_${opt.value}`}
                  className="ml-2 text-sm text-gray-700"
                >
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
            onChange={(e) => onChange(e.value)}
          />
        );

      case "color":
        return (
          <ColorPicker
            value={value}
            onChange={(e) => onChange(e.value)}
            className={inputClassName}
          />
        );

      case "slider":
        return (
          <div>
            <Slider
              value={value || 0}
              onChange={(e) => onChange(e.value)}
              className="w-full"
              min={field.validation_override?.min || 0}
              max={field.validation_override?.max || 100}
            />
            <div className="text-center mt-1">
              <span className="text-sm text-gray-500">{value || 0}</span>
            </div>
          </div>
        );

      case "rating":
        return (
          <Rating
            value={value || 0}
            onChange={(e) => onChange(e.value)}
            cancel={false}
          />
        );

      case "chips":
        return (
          <Chips
            value={value || []}
            onChange={(e) => onChange(e.value)}
            placeholder={placeholder}
            className={inputClassName}
          />
        );
      case "url":
        return (
          <InputText
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={(e) => {
              let val = e.target.value;
              if (val && !/^https?:\/\//i.test(val)) {
                val = "https://" + val;
                handleChange(val);
              }
              handleBlur();
            }}
            placeholder={placeholder || "https://example.com"}
            className={inputClassName}
            type="url"
            pattern="https?://.*"
          />
        );

      default:
        return (
          <InputText
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputClassName}
          />
        );
    }
  };

  // console.log(requiredDocuments);
  return (
    <div className="mb-4">
      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>

        {isRequired && <span className="text-red-500 ml-1">*</span>}

        {isCalculated && (
          <span
            className="ml-2 text-blue-500 cursor-pointer"
            title="Auto-calculated field"
          >
            <i className="pi pi-calculator" style={{ fontSize: "0.8rem" }} />
          </span>
        )}

        {field.description && (
          <span
            className="ml-2 text-gray-400 cursor-pointer"
            title={field.description}
          >
            <i className="pi pi-info-circle" style={{ fontSize: "0.8rem" }} />
          </span>
        )}
      </label>

      {renderField()}

      {documentsForField.map((doc) => {
        const hasValue =
          doc.value !== undefined && doc.value !== null && doc.value !== "";

        const conditionSatisfied = doc.condition
          ? evaluateCondition(doc.condition, formValues)
          : true;

        const isUploadDisabled = !conditionSatisfied && !hasValue;

        return (
          <div
            key={doc.document_id}
            className="flex items-start gap-3 p-3 border rounded bg-gray-50"
          >
            <i className="pi pi-file text-blue-600 mt-1" />

            <div className="text-sm w-full">
              {/* Title */}
              <div className="font-medium text-gray-800 flex items-center gap-2">
                {doc.document_meta?.checklistDocumentName ||
                  "Supporting Document"}

                {doc.is_mandatory && <span className="text-red-500">*</span>}

                {hasValue && (
                  <span className="text-green-600 text-xs font-semibold">
                    ✓ Uploaded
                  </span>
                )}
              </div>

              {/* Description */}
              {doc.description && (
                <div className="text-gray-500 text-xs">{doc.description}</div>
              )}

              {/* Condition hint */}
              {doc.condition && !conditionSatisfied && !hasValue && (
                <div className="text-xs text-yellow-600 mt-1">
                  Will be required when{" "}
                  <strong>{doc.condition.field_code}</strong>{" "}
                  {doc.condition.operator}{" "}
                  <strong>{doc.condition.value}</strong>
                </div>
              )}

              {/* Upload control */}
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  disabled={isUploadDisabled}
                  accept={(doc.allowed_types || [])
                    .map((t: string) => `.${t}`)
                    .join(",")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Optional: file size validation
                    const maxSize = (doc.max_size_mb || 5) * 1024 * 1024;

                    if (file.size > maxSize) {
                      alert(
                        `File size must be less than ${doc.max_size_mb || 5} MB`,
                      );
                      e.target.value = "";
                      return;
                    }

                    // 🔥 Call parent handler
                    onDocumentUpload?.(doc, file);
                  }}
                  className="block text-xs"
                />

                {hasValue && (
                  <button
                    type="button"
                    className="text-red-500 text-xs hover:underline"
                    onClick={() => onRemoveDocument?.(doc)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Constraints */}
              <div className="text-xs text-gray-400 mt-1">
                Allowed: {(doc.allowed_types || []).join(", ").toUpperCase()} •
                Max: {doc.max_size_mb || 5} MB
              </div>
            </div>
          </div>
        );
      })}

      {isCalculated && (
        <p className="mt-1 text-xs text-blue-500">
          <i className="pi pi-info-circle mr-1"></i>
          This value is automatically calculated
        </p>
      )}

      {hasError && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Section Renderer Component
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
}: {
  section: FormSection;
  sectionIndex: number;
  fieldMaster: FieldMasterDef[];
  values: Record<string, any>;
  onChange: (fieldCode: string, value: any) => void;
  onSetValues?: (values: Record<string, any>) => void;
  onApiError?: (fieldCode: string, error: string) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
  requiredDocuments?: {
    documents: RequiredDocument[];
  };
  onDocumentUpload?: (doc: RequiredDocument, file: File) => void;
  onRemoveDocument?: (doc: RequiredDocument) => void;
}) => {
  // Check section condition
  const shouldRender = evaluateCondition(section.condition, values);
  if (!shouldRender) return null;

  const gridCols = section.grid_cols || 2;
  const gridClass =
    gridCols === 1
      ? "grid grid-cols-1 gap-4"
      : gridCols === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-4"
        : gridCols === 3
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "grid grid-cols-1 gap-4";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {section.section_title}
        </h3>
        {section.description && (
          <p className="text-gray-500 mt-1">{section.description}</p>
        )}
      </div>

      <div className={gridClass}>
        {section.fields.map((field) => {
          // Check field condition
          const fieldShouldRender = evaluateCondition(field.condition, values);
          if (!fieldShouldRender) return null;

          const fieldMasterDef = fieldMaster.find(
            (f) => f.field_code === field.field_code,
          );

          return (
            <FieldRenderer
              key={field.field_code}
              field={field}
              fieldMasterDef={fieldMasterDef}
              value={values[field.field_code]}
              onChange={(value) => onChange(field.field_code, value)}
              onSetValues={onSetValues}
              onApiError={onApiError}
              error={errors?.[field.field_code]}
              readOnly={readOnly}
              formValues={values}
              requiredDocuments={requiredDocuments}
              onDocumentUpload={onDocumentUpload}
              onRemoveDocument={onRemoveDocument}
            />
          );
        })}
      </div>
    </div>
  );
};

// Main Dynamic Form Renderer
export const DynamicFormRenderer = ({
  formStructure,
  fieldMaster,
  values,
  onChange,
  onSetValues,
  onApiError,
  errors,
  readOnly = false,
  requiredDocuments,
  onDocumentUpload,
  onRemoveDocument,
}: DynamicFormRendererProps) => {
  if (!formStructure || formStructure.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-700">
          No form structure defined. Please configure the form in Scheme Master.
        </p>
      </div>
    );
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
        />
      ))}
    </div>
  );
};

// Hook for form state management with calculations support
export const useDynamicForm = (
  initialValues: Record<string, any> = {},
  formStructure?: FormSection[],
) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Extract all calculated fields from form structure
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

  // Auto-calculate field values when dependencies change
  useEffect(() => {
    const calculatedCodes = Object.keys(calculatedFields);
    if (calculatedCodes.length === 0) return;

    const newCalculatedValues: Record<string, any> = {};
    let hasChanges = false;

    calculatedCodes.forEach((fieldCode) => {
      const config = calculatedFields[fieldCode];

      // 🚨 SKIP LOOKUP FIELDS
      if (!config.enabled || config.formula_type === "lookup") {
        return;
      }

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

  const handleChange = useCallback(
    (fieldCode: string, value: any) => {
      const calc = calculatedFields[fieldCode];

      // ❌ block only NON-lookup calculated fields
      if (calc?.enabled && calc.formula_type !== "lookup") {
        return;
      }

      setValues((prev) => ({ ...prev, [fieldCode]: value }));
      setTouched((prev) => ({ ...prev, [fieldCode]: true }));

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldCode];
        return newErrors;
      });
    },
    [calculatedFields],
  );
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = useCallback(
    (structure: FormSection[], fieldMaster: FieldMasterDef[]): boolean => {
      const newErrors: Record<string, string> = {};

      structure.forEach((section) => {
        if (!evaluateCondition(section.condition, values)) return;

        section.fields.forEach((field) => {
          // if (!evaluateCondition(field.condition, values)) return;
          // if (field.calculation?.enabled) return;

          const value = values[field.field_code];

          const fieldMasterDef = fieldMaster.find(
            (f) => f.field_code === field.field_code,
          );
          const componentType = fieldMasterDef?.data_type;

          const label =
            field.label_override ||
            fieldMasterDef?.field_label ||
            field.field_code;

          const validation =
            field.validation_override ||
            fieldMasterDef?.default_validation ||
            {};
          /* ---------------- REQUIRED ---------------- */
          if (field.required) {
            const isEmpty =
              value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0) ||
              (componentType === "switch" && value !== true);

            if (isEmpty) {
              newErrors[field.field_code] = `${label} is required`;
              return;
            }
          }

          /* ---------------- TYPE-SPECIFIC ---------------- */

          switch (componentType) {
            case "number":
            case "slider":
            case "rating":
              if (typeof value === "number") {
                if (validation.min !== undefined && value < validation.min) {
                  newErrors[field.field_code] =
                    validation.message || `Minimum value is ${validation.min}`;
                }
                if (validation.max !== undefined && value > validation.max) {
                  newErrors[field.field_code] =
                    validation.message || `Maximum value is ${validation.max}`;
                }
              }
              break;

            case "email":
              if (
                typeof value === "string" &&
                value &&
                !EMAIL_REGEX.test(value)
              ) {
                newErrors[field.field_code] =
                  validation.message || "Please enter a valid email address";
              }
              break;
            case "text":
            case "textarea":
            case "phone":
            case "password":
            case "url":
              if (typeof value === "string") {
                if (
                  validation.minLength !== undefined &&
                  value.length < validation.minLength
                ) {
                  newErrors[field.field_code] =
                    validation.message ||
                    `Minimum length is ${validation.minLength}`;
                }

                if (
                  validation.maxLength !== undefined &&
                  value.length > validation.maxLength
                ) {
                  newErrors[field.field_code] =
                    validation.message ||
                    `Maximum length is ${validation.maxLength}`;
                }

                if (validation.pattern && value) {
                  const regex = new RegExp(validation.pattern);
                  if (!regex.test(value)) {
                    newErrors[field.field_code] =
                      validation.message || "Invalid format";
                  }
                }
              }
              break;

            case "select":
            case "radio":
            case "autocomplete":
              if (
                value !== undefined &&
                validation.allowedValues &&
                !validation.allowedValues.includes(value)
              ) {
                newErrors[field.field_code] =
                  validation.message || "Invalid selection";
              }
              break;

            case "multiselect":
            case "checkbox":
            case "chips":
              if (Array.isArray(value)) {
                if (
                  validation.minItems !== undefined &&
                  value.length < validation.minItems
                ) {
                  newErrors[field.field_code] =
                    validation.message ||
                    `Select at least ${validation.minItems} options`;
                }
                if (
                  validation.maxItems !== undefined &&
                  value.length > validation.maxItems
                ) {
                  newErrors[field.field_code] =
                    validation.message ||
                    `Select at most ${validation.maxItems} options`;
                }
              }
              break;

            case "date":
            case "time":
              if (value && isNaN(new Date(value).getTime())) {
                newErrors[field.field_code] =
                  validation.message || "Invalid date";
              }
              break;

            case "daterange":
              if (
                Array.isArray(value) &&
                value.length === 2 &&
                value[0] &&
                value[1]
              ) {
                const start = new Date(value[0]);
                const end = new Date(value[1]);
                if (start > end) {
                  newErrors[field.field_code] =
                    validation.message || "Invalid date range";
                }
              }
              break;

            case "color":
              if (value && !/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
                newErrors[field.field_code] =
                  validation.message || "Invalid color value";
              }
              break;
          }
        });
      });

      console.log("VALIDATION ERRORS →", newErrors);

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [values],
  );

  const reset = useCallback((newValues: Record<string, any> = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
  }, []);

  // Check if a field is calculated
  const isCalculated = useCallback(
    (fieldCode: string) => {
      return !!calculatedFields[fieldCode]?.enabled;
    },
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
