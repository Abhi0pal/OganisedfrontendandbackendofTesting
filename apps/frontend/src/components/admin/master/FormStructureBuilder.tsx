"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { useFields } from "@/hooks/master/useFields";
import { useSchemes } from "@/hooks/master/useSchemes";
import {
  CalculationEditor,
  CalculationConfig,
  DEFAULT_CALCULATION,
} from "./CalculationEditor";

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
type ConditionNode =
  | {
      type: "group";
      operator: "AND" | "OR";
      children: ConditionNode[];
    }
  | {
      type: "rule";
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
    };

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
// Add this type
interface RepeaterConfig {
  min_items?: number; // Minimum rows allowed
  max_items?: number; // Maximum rows allowed
  add_button_label?: string; // Label for the "Add more" button
  item_label?: string; // Singular label for a row, e.g., "Investment"
}

// Extend FormField with repeater capability
interface FormField {
  field_code: string; // For repeater, use a synthetic code like "REPEATER_INVESTMENTS"
  required?: boolean;
  label_override?: string;
  placeholder?: string;
  description?: string;
  validation_override?: ValidationOverride;
  dependency?: FieldDependency;
  condition?: ConditionNode;
  options?: Array<{ label: string; value: string }>;
  component_type?: string; // e.g. 'repeater' for "Add More"
  ui_config?: any;
  sub_fields?: FormField[]; // Used by repeater to store the group fields
  calculation?: CalculationConfig;

  // NEW
  is_repeater?: boolean; // Marks this as a "Add More" group
  repeater_config?: RepeaterConfig; // "Add More" group config
}

interface FormSection {
  section_title: string;
  description?: string;
  grid_cols?: 1 | 2 | 3;
  step_number?: number;
  condition?: ConditionNode;
  fields: FormField[];
}

interface FormSettings {
  is_multi_step: boolean;
  is_approved_caf_required: boolean;
}

interface FormStructureBuilderProps {
  value: FormSection[];
  onChange: (value: FormSection[]) => void;
  formSettings?: FormSettings;
  onFormSettingsChange?: (settings: FormSettings) => void;
}

const createEmptyRepeater = (
  repeater_code: string,
  label = "Add More Group",
): FormField => ({
  field_code: repeater_code, // e.g., "REPEATER_INVESTMENTS"
  required: false,
  is_repeater: true,
  component_type: "repeater",
  label_override: label,
  sub_fields: [], // holds the fields that repeat together
  repeater_config: {
    min_items: 0,
    max_items: undefined,
    add_button_label: `Add ${label}`,
    item_label: label.replace(/ Group$/i, ""),
  },
});

const GRID_OPTIONS = [
  { label: "1 Column", value: 1 },
  { label: "2 Columns", value: 2 },
  { label: "3 Columns", value: 3 },
];

const CONDITION_OPERATORS = [
  { label: "Equals", value: "equals" },
  { label: "Not Equals", value: "not_equals" },
  { label: "In (Array)", value: "in" },
  { label: "Not In (Array)", value: "not_in" },
  { label: "Greater Than", value: "greater_than" },
  { label: "Less Than", value: "less_than" },
  { label: "Is Empty", value: "is_empty" },
  { label: "Is Not Empty", value: "is_not_empty" },
  { label: "Contains", value: "contains" },
];

// Empty templates
const createEmptySection = (): FormSection => ({
  section_title: "",
  description: "",
  grid_cols: 2,
  fields: [],
});

const createEmptyField = (field_code: string): FormField => ({
  field_code,
  required: false,
});

// Condition Editor Component
const ConditionNodeEditor = ({
  node,
  onChange,
  onRemove,
  availableFields,
}: {
  node: ConditionNode;
  onChange: (node: ConditionNode) => void;
  onRemove?: () => void;
  availableFields: { label: string; value: string }[];
}) => {
  if (node.type === "rule") {
    return (
      <div className="row g-2 align-items-center mb-2">
        <div className="col-4">
          <Dropdown
            value={node.field_code}
            options={availableFields}
            onChange={(e) => onChange({ ...node, field_code: e.value })}
            placeholder="Field"
            className="w-100"
          />
        </div>

        <div className="col-3">
          <Dropdown
            value={node.operator}
            options={CONDITION_OPERATORS}
            onChange={(e) => onChange({ ...node, operator: e.value })}
            className="w-100"
          />
        </div>

        <div className="col-3">
          <InputText
            value={node.value?.toString() || ""}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            className="w-100"
          />
        </div>

        {onRemove && (
          <div className="col-2 text-end">
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              type="button"
              onClick={onRemove}
              tooltip="Remove rule"
            />
          </div>
        )}
      </div>
    );
  }

  // GROUP NODE
  return (
    <div
      className="p-3 border rounded mb-2"
      style={{
        background: "#f4f8f4",
        borderLeft: "4px solid #4caf50",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex align-items-center gap-2">
          <Dropdown
            value={node.operator}
            options={[
              { label: "AND", value: "AND" },
              { label: "OR", value: "OR" },
            ]}
            onChange={(e) => onChange({ ...node, operator: e.value })}
            className="w-auto"
          />

          {onRemove && (
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              type="button"
              onClick={onRemove}
              tooltip="Remove group"
            />
          )}
        </div>

        <div className="d-flex gap-2">
          <Button
            label="Add Rule"
            size="small"
            type="button"
            onClick={() =>
              onChange({
                ...node,
                children: [
                  ...node.children,
                  {
                    type: "rule",
                    field_code: "",
                    operator: "equals",
                    value: "",
                  },
                ],
              })
            }
          />

          <Button
            label="Add Group"
            size="small"
            type="button"
            severity="secondary"
            onClick={() =>
              onChange({
                ...node,
                children: [
                  ...node.children,
                  {
                    type: "group",
                    operator: "AND",
                    children: [],
                  },
                ],
              })
            }
          />
        </div>
      </div>

      {node.children.map((child, index) => (
        <ConditionNodeEditor
          key={index}
          node={child}
          availableFields={availableFields}
          onChange={(updatedChild) => {
            const updatedChildren = [...node.children];
            updatedChildren[index] = updatedChild;
            onChange({ ...node, children: updatedChildren });
          }}
          onRemove={() => {
            const updatedChildren = node.children.filter((_, i) => i !== index);
            onChange({ ...node, children: updatedChildren });
          }}
        />
      ))}
    </div>
  );
};

const FieldConfigEditor = ({
  field,
  onChange,
  onRemove,
  availableFields,
  allFieldMasterFields,
  sectionUsedFieldCodes,
}: {
  field: FormField;
  onChange: (field: FormField) => void;
  onRemove: () => void;
  availableFields: Array<{ label: string; value: string }>;
  allFieldMasterFields: any[];
  sectionUsedFieldCodes: string[];
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // For repeater sub-field picker
  const [showSubFieldPicker, setShowSubFieldPicker] = useState(false);
  const [subFieldSearch, setSubFieldSearch] = useState("");

  const fieldMasterInfo = allFieldMasterFields.find(
    (f: any) => f.field_code === field.field_code,
  );

  /** ===========================
   *  REPEATER ("Add More") UI
   *  =========================== */
  if (field.is_repeater) {
    const availableForSubFields = useMemo(() => {
      const used = new Set(sectionUsedFieldCodes);
      return allFieldMasterFields.filter((f: any) => {
        const ok =
          !used.has(f.field_code) &&
          (subFieldSearch === "" ||
            f.field_code.toLowerCase().includes(subFieldSearch.toLowerCase()) ||
            f.field_label.toLowerCase().includes(subFieldSearch.toLowerCase()));
        return ok;
      });
    }, [allFieldMasterFields, sectionUsedFieldCodes, subFieldSearch]);

    const addSubField = (code: string) => {
      const newSub = createEmptyField(code);
      onChange({
        ...field,
        sub_fields: [...(field.sub_fields || []), newSub],
      });
      setShowSubFieldPicker(false);
      setSubFieldSearch("");
    };

    const updateSubField = (idx: number, updated: FormField) => {
      const subs = [...(field.sub_fields || [])];
      subs[idx] = updated;
      onChange({ ...field, sub_fields: subs });
    };

    const removeSubField = (idx: number) => {
      const subs = (field.sub_fields || []).filter((_, i) => i !== idx);
      onChange({ ...field, sub_fields: subs });
    };

    const moveSubField = (idx: number, dir: "up" | "down") => {
      const subs = [...(field.sub_fields || [])];
      const t = dir === "up" ? idx - 1 : idx + 1;
      [subs[idx], subs[t]] = [subs[t], subs[idx]];
      onChange({ ...field, sub_fields: subs });
    };

    return (
      <div
        className="p-3 mb-2 border rounded"
        style={{ backgroundColor: "#fff8e1" }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center gap-2">
            <Tag
              value={field.label_override || "Add More Group"}
              severity="warning"
            />
            <small className="text-muted">(Repeater)</small>
          </div>
          <div className="d-flex gap-1">
            <Button
              icon={showAdvanced ? "pi pi-chevron-up" : "pi pi-cog"}
              size="small"
              severity="secondary"
              text
              rounded
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              tooltip="Repeater Settings"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              rounded
              type="button"
              onClick={onRemove}
              tooltip="Remove Add More Group"
            />
          </div>
        </div>

        {/* Basic repeater settings */}
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <label className="form-label small">Group Label</label>
            <InputText
              value={field.label_override || ""}
              onChange={(e) =>
                onChange({
                  ...field,
                  label_override: e.target.value || undefined,
                })
              }
              placeholder="e.g., Investments"
              className="w-100"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small">Add Button Label</label>
            <InputText
              value={field.repeater_config?.add_button_label || ""}
              onChange={(e) =>
                onChange({
                  ...field,
                  repeater_config: {
                    ...field.repeater_config,
                    add_button_label: e.target.value || undefined,
                  },
                })
              }
              placeholder="e.g., Add Investment"
              className="w-100"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label small">Item Label</label>
            <InputText
              value={field.repeater_config?.item_label || ""}
              onChange={(e) =>
                onChange({
                  ...field,
                  repeater_config: {
                    ...field.repeater_config,
                    item_label: e.target.value || undefined,
                  },
                })
              }
              placeholder="e.g., Investment"
              className="w-100"
            />
          </div>
        </div>

        {/* Advanced repeater settings */}
        {showAdvanced && (
          <div className="mb-3">
            <div className="row g-2">
              <div className="col-md-3">
                <label className="form-label small">Min Rows</label>
                <InputNumber
                  value={field.repeater_config?.min_items ?? null}
                  onValueChange={(e) =>
                    onChange({
                      ...field,
                      repeater_config: {
                        ...field.repeater_config,
                        min_items: e.value ?? undefined,
                      },
                    })
                  }
                  className="w-100"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Max Rows</label>
                <InputNumber
                  value={field.repeater_config?.max_items ?? null}
                  onValueChange={(e) =>
                    onChange({
                      ...field,
                      repeater_config: {
                        ...field.repeater_config,
                        max_items: e.value ?? undefined,
                      },
                    })
                  }
                  className="w-100"
                />
              </div>
            </div>
          </div>
        )}

        <Divider />

        {/* Sub-fields manager */}
        <div className="mb-2 d-flex justify-content-between align-items-center">
          <label className="form-label small fw-semibold mb-0">
            Repeated Fields
          </label>
          <Button
            label="Add Sub-Field"
            icon="pi pi-plus"
            size="small"
            severity="success"
            outlined
            type="button"
            onClick={() => setShowSubFieldPicker(true)}
          />
        </div>

        {!field.sub_fields || field.sub_fields.length === 0 ? (
          <div
            className="text-muted p-3 border rounded"
            style={{ backgroundColor: "#f8f9fa" }}
          >
            <i className="pi pi-inbox me-2" /> No fields added. Click "Add
            Sub-Field".
          </div>
        ) : (
          field.sub_fields.map((sf, idx) => (
            <div
              key={`${sf.field_code}_${idx}`}
              className="d-flex gap-2 align-items-start"
            >
              <div className="d-flex flex-column gap-1 pt-3">
                <Button
                  icon="pi pi-chevron-up"
                  size="small"
                  text
                  rounded
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSubField(idx, "up")}
                />
                <Button
                  icon="pi pi-chevron-down"
                  size="small"
                  text
                  rounded
                  type="button"
                  disabled={idx === (field.sub_fields?.length || 0) - 1}
                  onClick={() => moveSubField(idx, "down")}
                />
              </div>
              <div className="flex-grow-1">
                <FieldConfigEditor
                  field={sf}
                  onChange={(f) => updateSubField(idx, f)}
                  onRemove={() => removeSubField(idx)}
                  availableFields={availableFields}
                  allFieldMasterFields={allFieldMasterFields}
                  sectionUsedFieldCodes={sectionUsedFieldCodes}
                />
              </div>
            </div>
          ))
        )}

        {/* Sub-field picker dialog */}
        <Dialog
          visible={showSubFieldPicker}
          onHide={() => {
            setShowSubFieldPicker(false);
            setSubFieldSearch("");
          }}
          header="Select Field to add in this Add More group"
          style={{ width: "600px" }}
          modal
        >
          <div className="mb-3">
            <InputText
              value={subFieldSearch}
              onChange={(e) => setSubFieldSearch(e.target.value)}
              placeholder="Search by field code or label..."
              className="w-100"
            />
          </div>
          <div style={{ maxHeight: "400px", overflow: "auto" }}>
            {availableForSubFields.length === 0 ? (
              <p className="text-muted text-center">
                No matching fields found.
              </p>
            ) : (
              availableForSubFields.map((f: any) => (
                <div
                  key={f.field_code}
                  className="d-flex justify-content-between align-items-center p-2 border-bottom"
                  style={{ cursor: "pointer" }}
                  onClick={() => addSubField(f.field_code)}
                >
                  <div>
                    <div className="fw-semibold">{f.field_label}</div>
                    <small className="text-muted">
                      {f.field_code} • {f.data_type}
                    </small>
                  </div>
                  <Button
                    icon="pi pi-plus"
                    size="small"
                    rounded
                    text
                    type="button"
                  />
                </div>
              ))
            )}
          </div>
        </Dialog>
      </div>
    );
  }

  /** ===========================
   *  NON‑REPEATER (regular field) UI
   *  =========================== */
  return (
    <div
      className="p-3 mb-2 border rounded"
      style={{ backgroundColor: "#fafafa" }}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div className="d-flex align-items-center gap-2">
            <Tag value={field.field_code} severity="info" />
            {fieldMasterInfo && (
              <small className="text-muted">
                ({fieldMasterInfo.data_type} - {fieldMasterInfo.field_label})
              </small>
            )}
          </div>
        </div>
        <div className="d-flex gap-1">
          <Button
            icon={showAdvanced ? "pi pi-chevron-up" : "pi pi-cog"}
            size="small"
            severity="secondary"
            text
            rounded
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            tooltip="Advanced Options"
          />
          <Button
            icon="pi pi-trash"
            size="small"
            severity="danger"
            text
            rounded
            type="button"
            onClick={onRemove}
            tooltip="Remove Field"
          />
        </div>
      </div>

      <div className="row g-2 mb-2">
        <div className="col-auto">
          <div className="d-flex align-items-center">
            <Checkbox
              inputId={`req_${field.field_code}`}
              checked={field.required || false}
              onChange={(e) => onChange({ ...field, required: e.checked })}
            />
            <label htmlFor={`req_${field.field_code}`} className="ms-2">
              Required
            </label>
          </div>
        </div>
        <div className="col">
          <InputText
            value={field.label_override || ""}
            onChange={(e) =>
              onChange({
                ...field,
                label_override: e.target.value || undefined,
              })
            }
            placeholder="Label Override (optional)"
            className="w-100"
          />
        </div>
        <div className="col">
          <InputText
            value={field.placeholder || ""}
            onChange={(e) =>
              onChange({ ...field, placeholder: e.target.value || undefined })
            }
            placeholder="Placeholder (optional)"
            className="w-100"
          />
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-3 pt-3 border-top">
          {/* Description */}
          <div className="mb-3">
            <label className="form-label small">Description / Help Text</label>
            <InputText
              value={field.description || ""}
              onChange={(e) =>
                onChange({ ...field, description: e.target.value || undefined })
              }
              placeholder="Help text shown below the field"
              className="w-100"
            />
          </div>

          {/* Validation Override */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Validation Override
            </label>
            <div className="row g-2">
              <div className="col-md-3">
                <InputNumber
                  value={field.validation_override?.min ?? null}
                  onValueChange={(e) =>
                    onChange({
                      ...field,
                      validation_override: {
                        ...field.validation_override,
                        min: e.value ?? undefined,
                      },
                    })
                  }
                  placeholder="Min Value"
                  className="w-100"
                />
                <small className="text-muted">Min Value</small>
              </div>
              <div className="col-md-3">
                <InputNumber
                  value={field.validation_override?.max ?? null}
                  onValueChange={(e) =>
                    onChange({
                      ...field,
                      validation_override: {
                        ...field.validation_override,
                        max: e.value ?? undefined,
                      },
                    })
                  }
                  placeholder="Max Value"
                  className="w-100"
                />
                <small className="text-muted">Max Value</small>
              </div>
              <div className="col-md-3">
                <InputText
                  value={field.validation_override?.pattern || ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      validation_override: {
                        ...field.validation_override,
                        pattern: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="Regex Pattern"
                  className="w-100"
                  style={{ fontFamily: "monospace" }}
                />
                <small className="text-muted">Regex Pattern</small>
              </div>
              <div className="col-md-3">
                <InputText
                  value={field.validation_override?.message || ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      validation_override: {
                        ...field.validation_override,
                        message: e.target.value || undefined,
                      },
                    })
                  }
                  placeholder="Error Message"
                  className="w-100"
                />
                <small className="text-muted">Error Msg</small>
              </div>
            </div>
          </div>

          {/* Dependency */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Field Dependency
            </label>
            <div className="row g-2">
              <div className="col-md-4">
                <Dropdown
                  value={field.dependency?.trigger_field || ""}
                  options={availableFields}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      dependency: {
                        ...field.dependency,
                        trigger_field: e.value,
                      } as FieldDependency,
                    })
                  }
                  placeholder="Trigger Field"
                  className="w-100"
                  showClear
                />
                <small className="text-muted">Depends On</small>
              </div>
              <div className="col-md-4">
                <InputText
                  value={field.dependency?.endpoint || ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      dependency: {
                        ...field.dependency,
                        endpoint: e.target.value,
                      } as FieldDependency,
                    })
                  }
                  placeholder="/api/masters/..."
                  className="w-100"
                />
                <small className="text-muted">API Endpoint</small>
              </div>
              <div className="col-md-4">
                <InputText
                  value={field.dependency?.query_param || ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      dependency: {
                        ...field.dependency,
                        query_param: e.target.value,
                      } as FieldDependency,
                    })
                  }
                  placeholder="parent_id"
                  className="w-100"
                />
                <small className="text-muted">Query Param</small>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div className="mb-3">
            <label className="form-label small fw-semibold">
              Conditional Rendering
            </label>
            <div className="mb-2">
              {field.condition ? (
                <>
                  <ConditionNodeEditor
                    node={field.condition}
                    availableFields={availableFields}
                    onChange={(updatedNode) =>
                      onChange({ ...field, condition: updatedNode })
                    }
                  />
                  <Button
                    label="Remove Condition"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    type="button"
                    onClick={() => onChange({ ...field, condition: undefined })}
                  />
                </>
              ) : (
                <Button
                  label="Add Condition"
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  outlined
                  type="button"
                  onClick={() =>
                    onChange({
                      ...field,
                      condition: {
                        type: "group",
                        operator: "AND",
                        children: [],
                      },
                    })
                  }
                />
              )}
            </div>
          </div>

          {/* Calculation */}
          <div>
            <label className="form-label small fw-semibold">Calculation</label>
            <CalculationEditor
              value={field.calculation || DEFAULT_CALCULATION}
              onChange={(calc) =>
                onChange({
                  ...field,
                  calculation: calc.enabled ? calc : undefined,
                })
              }
              availableFields={availableFields.map((f) => {
                const fm = allFieldMasterFields.find(
                  (m: any) => m.field_code === f.value,
                );
                return {
                  label: fm?.field_label || f.label,
                  code: f.value,
                  data_type: fm?.data_type || "string",
                };
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({
  section,
  sectionIndex,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  allFieldMasterFields,
  allFormFields,
  isExpanded,
  onToggle,
  isMultiStep,
  stepOptions,
}: {
  section: FormSection;
  sectionIndex: number;
  onChange: (section: FormSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  allFieldMasterFields: any[];
  allFormFields: Array<{ label: string; value: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  isMultiStep?: boolean;
  stepOptions?: Array<{ label: string; value: number }>;
}) => {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");

  // helper to flatten all field codes in a section (including nested repeater sub_fields)
  const getSectionUsedCodes = (section: FormSection): string[] => {
    const codes: string[] = [];
    section.fields.forEach((f) => {
      if (f.is_repeater && Array.isArray(f.sub_fields)) {
        f.sub_fields.forEach((sf) => codes.push(sf.field_code));
      } else if (f.field_code) {
        codes.push(f.field_code);
      }
    });
    return codes;
  };

  const usedCodes = useMemo(() => getSectionUsedCodes(section), [section]);

  const availableFieldMaster = useMemo(() => {
    return allFieldMasterFields.filter(
      (f) =>
        !usedCodes.includes(f.field_code) &&
        (fieldSearch === "" ||
          f.field_code.toLowerCase().includes(fieldSearch.toLowerCase()) ||
          f.field_label.toLowerCase().includes(fieldSearch.toLowerCase())),
    );
  }, [allFieldMasterFields, usedCodes, fieldSearch]);

  const addField = (field_code: string) => {
    onChange({
      ...section,
      fields: [...section.fields, createEmptyField(field_code)],
    });
    setShowFieldPicker(false);
    setFieldSearch("");
  };

  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...section.fields];
    newFields[index] = updatedField;
    onChange({ ...section, fields: newFields });
  };

  const removeField = (index: number) => {
    const newFields = section.fields.filter((_, i) => i !== index);
    onChange({ ...section, fields: newFields });
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...section.fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    onChange({ ...section, fields: newFields });
  };

  return (
    <>
      <Card className="mb-3">
        {/* Section Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div
            className="d-flex align-items-center gap-2"
            style={{ cursor: "pointer" }}
            onClick={onToggle}
          >
            <i
              className={`pi ${isExpanded ? "pi-chevron-down" : "pi-chevron-right"}`}
            ></i>
            <span className="fw-semibold">
              {section.section_title || `Section ${sectionIndex + 1}`}
            </span>
            <Tag
              value={`${section.fields.length} fields`}
              severity="secondary"
            />
            {section.condition && (
              <Tag value="Conditional" severity="warning" icon="pi pi-eye" />
            )}
          </div>
          <div className="d-flex gap-1">
            <Button
              icon="pi pi-chevron-up"
              size="small"
              text
              rounded
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
            />
            <Button
              icon="pi pi-chevron-down"
              size="small"
              text
              rounded
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
            />
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              rounded
              type="button"
              onClick={onRemove}
            />
          </div>
        </div>

        {isExpanded && (
          <>
            {/* Section Details */}
            <div className="row g-3 mb-3">
              <div className={isMultiStep ? "col-md-4" : "col-md-5"}>
                <label className="form-label small">Section Title *</label>
                <InputText
                  value={section.section_title}
                  onChange={(e) =>
                    onChange({ ...section, section_title: e.target.value })
                  }
                  placeholder="e.g., 1. Enterprise Details"
                  className="w-100"
                />
              </div>
              <div className={isMultiStep ? "col-md-4" : "col-md-5"}>
                <label className="form-label small">Description</label>
                <InputText
                  value={section.description || ""}
                  onChange={(e) =>
                    onChange({
                      ...section,
                      description: e.target.value || undefined,
                    })
                  }
                  placeholder="Brief description for this section"
                  className="w-100"
                />
              </div>
              {isMultiStep && stepOptions && (
                <div className="col-md-2">
                  <label className="form-label small">Step</label>
                  <Dropdown
                    value={section.step_number || 1}
                    options={stepOptions}
                    onChange={(e) =>
                      onChange({ ...section, step_number: e.value })
                    }
                    className="w-100"
                    placeholder="Select Step"
                  />
                </div>
              )}
              <div className="col-md-2">
                <label className="form-label small">Grid</label>
                <Dropdown
                  value={section.grid_cols || 2}
                  options={GRID_OPTIONS}
                  onChange={(e) => onChange({ ...section, grid_cols: e.value })}
                  className="w-100"
                />
              </div>
            </div>

            {/* Section Condition */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Section Condition
              </label>
              <div className="mb-2">
                {section.condition ? (
                  <>
                    <ConditionNodeEditor
                      node={section.condition}
                      availableFields={allFormFields}
                      onChange={(updatedNode) =>
                        onChange({ ...section, condition: updatedNode })
                      }
                    />

                    <Button
                      label="Remove Section Condition"
                      icon="pi pi-trash"
                      size="small"
                      severity="danger"
                      text
                      type="button"
                      onClick={() =>
                        onChange({ ...section, condition: undefined })
                      }
                    />
                  </>
                ) : (
                  <Button
                    label="Add Section Condition"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    outlined
                    type="button"
                    onClick={() =>
                      onChange({
                        ...section,
                        condition: {
                          type: "group",
                          operator: "AND",
                          children: [],
                        },
                      })
                    }
                  />
                )}
              </div>
            </div>

            <Divider />

            {/* Fields List */}
            <div className="mb-3">
              {/* Fields List header row */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label small fw-semibold mb-0">
                  Fields
                </label>
                <div className="d-flex gap-2">
                  <Button
                    label="Add 'Add More' Group"
                    icon="pi pi-plus-circle"
                    size="small"
                    severity="warning"
                    outlined
                    type="button"
                    onClick={() => {
                      // Create a unique repeater code (simple approach; feel free to improve)
                      const base = "REPEATER_GROUP";
                      const existing = section.fields.filter(
                        (f) => f.is_repeater,
                      ).length;
                      const repeaterCode = `${base}_${existing + 1}`;

                      onChange({
                        ...section,
                        fields: [
                          ...section.fields,
                          createEmptyRepeater(repeaterCode, "Investments"),
                        ],
                      });
                    }}
                  />
                  <Button
                    label="Add Field"
                    icon="pi pi-plus"
                    size="small"
                    severity="success"
                    outlined
                    type="button"
                    onClick={() => setShowFieldPicker(true)}
                  />
                </div>
              </div>

              {section.fields.length === 0 ? (
                <div
                  className="text-center text-muted p-4 border rounded"
                  style={{ backgroundColor: "#f8f9fa" }}
                >
                  <i
                    className="pi pi-inbox mb-2"
                    style={{ fontSize: "2rem" }}
                  ></i>
                  <p className="mb-0">
                    No fields added. Click "Add Field" to select from Field
                    Master.
                  </p>
                </div>
              ) : (
                section.fields.map((field, index) => (
                  <div
                    key={field.field_code}
                    className="d-flex gap-2 align-items-start"
                  >
                    <div className="d-flex flex-column gap-1 pt-3">
                      <Button
                        icon="pi pi-chevron-up"
                        size="small"
                        text
                        rounded
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveField(index, "up")}
                      />
                      <Button
                        icon="pi pi-chevron-down"
                        size="small"
                        text
                        rounded
                        type="button"
                        disabled={index === section.fields.length - 1}
                        onClick={() => moveField(index, "down")}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <FieldConfigEditor
                        field={field}
                        onChange={(f) => updateField(index, f)}
                        onRemove={() => removeField(index)}
                        availableFields={allFormFields}
                        allFieldMasterFields={allFieldMasterFields}
                        sectionUsedFieldCodes={usedCodes}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Card>

      {/* Field Picker Dialog */}
      <Dialog
        visible={showFieldPicker}
        onHide={() => {
          setShowFieldPicker(false);
          setFieldSearch("");
        }}
        header="Select Field from Field Master"
        style={{ width: "600px" }}
        modal
      >
        <div className="mb-3">
          <InputText
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Search by field code or label..."
            className="w-100"
          />
        </div>
        <div style={{ maxHeight: "400px", overflow: "auto" }}>
          {availableFieldMaster.length === 0 ? (
            <p className="text-muted text-center">No matching fields found.</p>
          ) : (
            availableFieldMaster.map((field) => (
              <div
                key={field.field_code}
                className="d-flex justify-content-between align-items-center p-2 border-bottom"
                style={{ cursor: "pointer" }}
                onClick={() => addField(field.field_code)}
              >
                <div>
                  <div className="fw-semibold">{field.field_label}</div>
                  <small className="text-muted">
                    {field.field_code} • {field.data_type}
                  </small>
                </div>
                <Button
                  icon="pi pi-plus"
                  size="small"
                  rounded
                  text
                  type="button"
                />
              </div>
            ))
          )}
        </div>
      </Dialog>
    </>
  );
};
// Main Component
export const FormStructureBuilder = ({
  value,
  onChange,
  formSettings,
  onFormSettingsChange,
}: FormStructureBuilderProps) => {
  const { data: fieldMasterFields = [] } = useFields();
  const { data: schemesData = [] } = useSchemes();
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Import sections dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<number[]>([]);

  const isMultiStep = formSettings?.is_multi_step ?? false;
  const isApprovedCAFRequired = formSettings?.is_approved_caf_required ?? false;

  // Get scheme options for dropdown
  const schemeOptions = useMemo(
    () =>
      schemesData.map((scheme: any) => ({
        label: `${scheme.scheme_name} (${scheme.scheme_code})`,
        value: scheme.id,
      })),
    [schemesData],
  );

  // Get sections from selected scheme
  const selectedSchemeSections = useMemo(() => {
    if (!selectedSchemeId) return [];
    const scheme = schemesData.find((s: any) => s.id === selectedSchemeId);
    if (!scheme) return [];
    const formStructure = scheme.form_structure_json;
    // Handle both old array format and new object format with sections
    const sections =
      formStructure?.sections ||
      (Array.isArray(formStructure) ? formStructure : []);
    return sections as FormSection[];
  }, [selectedSchemeId, schemesData]);

  // Calculate unique step numbers for dropdown
  const stepNumbers = useMemo(() => {
    const steps = new Set<number>();
    value.forEach((section) => {
      if (section.step_number) steps.add(section.step_number);
    });
    // Add at least up to max + 1 for new step creation
    const max = Math.max(1, ...Array.from(steps));
    const options: { label: string; value: number }[] = [];
    for (let i = 1; i <= max + 1; i++) {
      const sectionsInStep = value.filter((s) => s.step_number === i).length;
      options.push({
        label: `Step ${i}${sectionsInStep > 0 ? ` (${sectionsInStep} section${sectionsInStep > 1 ? "s" : ""})` : ""}`,
        value: i,
      });
    }
    return options;
  }, [value]);

  // Get all field codes used across all sections for condition dropdowns
  const allFormFields = useMemo(() => {
    const fields: Array<{ label: string; value: string }> = [];

    const pushFieldCode = (code: string) => {
      const fmField = fieldMasterFields.find((f: any) => f.field_code === code);
      fields.push({
        label: `${code} (${fmField?.field_label || "Unknown"})`,
        value: code,
      });
    };

    value.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.is_repeater && Array.isArray(field.sub_fields)) {
          field.sub_fields.forEach((sf) => pushFieldCode(sf.field_code));
        } else {
          pushFieldCode(field.field_code);
        }
      });
    });
    return fields;
  }, [value, fieldMasterFields]);

  const addSection = useCallback(() => {
    const newSection = createEmptySection();
    // Assign to step 1 by default in multi-step mode
    if (isMultiStep) {
      newSection.step_number = 1;
    }
    onChange([...value, newSection]);
    // Expand the newly added section
    setExpandedSections((prev) => [...prev, value.length]);
  }, [value, onChange, isMultiStep]);

  // Import selected sections from another scheme
  const importSelectedSections = useCallback(() => {
    if (selectedSections.length === 0) return;

    const sectionsToImport = selectedSections
      .map((index) => selectedSchemeSections[index])
      .filter(Boolean)
      .map((section) => {
        // Deep clone to avoid reference issues
        const clonedSection = JSON.parse(JSON.stringify(section));
        // Reset step_number if multi-step is enabled
        if (isMultiStep) {
          const maxStep = Math.max(1, ...value.map((s) => s.step_number || 1));
          clonedSection.step_number = maxStep + 1;
        }
        return clonedSection;
      });

    onChange([...value, ...sectionsToImport]);
    // Expand the newly added sections
    const startIndex = value.length;
    setExpandedSections((prev) => [
      ...prev,
      ...sectionsToImport.map((_, i) => startIndex + i),
    ]);

    // Reset dialog state
    setShowImportDialog(false);
    setSelectedSchemeId(null);
    setSelectedSections([]);
  }, [selectedSections, selectedSchemeSections, value, onChange, isMultiStep]);

  const updateSection = (index: number, updatedSection: FormSection) => {
    const newSections = [...value];
    newSections[index] = updatedSection;
    onChange(newSections);
  };

  const removeSection = (index: number) => {
    const newSections = value.filter((_, i) => i !== index);
    onChange(newSections);
    setExpandedSections((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
    );
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...value];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];
    onChange(newSections);
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleMultiStep = (checked: boolean) => {
    if (onFormSettingsChange) {
      onFormSettingsChange({
        is_multi_step: !!checked,
        is_approved_caf_required: !!(
          formSettings?.is_approved_caf_required ?? false
        ),
      });
    }

    // existing step-number assignment logic remains
    if (checked && value.length > 0) {
      let needsUpdate = false;
      const updatedSections = value.map((section, idx) => {
        if (!section.step_number) {
          needsUpdate = true;
          return { ...section, step_number: idx + 1 };
        }
        return section;
      });
      if (needsUpdate) onChange(updatedSections);
    }
  };

  const toggleApprovedCAFRequired = (checked: boolean) => {
    if (onFormSettingsChange) {
      onFormSettingsChange({
        // Always provide both booleans; never pass undefined
        is_multi_step: !!(formSettings?.is_multi_step ?? false),
        is_approved_caf_required: !!checked,
      });
    }
  };

  return (
    <div>
      {/* Form Display Mode */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <Checkbox
              inputId="is_multi_step_builder"
              checked={isMultiStep}
              onChange={(e) => toggleMultiStep(e.checked ?? false)}
            />
            <label
              htmlFor="is_multi_step_builder"
              className="form-label mb-0"
              style={{ cursor: "pointer" }}
            >
              <strong>Multi-Step Form</strong>
              <br />
              <small className="text-muted">
                When enabled, sections will be grouped into steps with
                Next/Previous navigation.
              </small>
            </label>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Checkbox
              inputId="is_approved_caf_required"
              checked={isApprovedCAFRequired}
              onChange={(e) => toggleApprovedCAFRequired(e.checked ?? false)}
            />
            <label
              htmlFor="is_approved_caf_required"
              className="form-label mb-0"
              style={{ cursor: "pointer" }}
            >
              <strong>Approved CAF Required</strong>
              <br />
              <small className="text-muted">
                When enabled, the scheme form must be visible to applicant - in
                case they are having approved CAF.
              </small>
            </label>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">Form Structure Builder</h5>
          <small className="text-muted">
            {value.length} section(s),{" "}
            {value.reduce((acc, s) => acc + s.fields.length, 0)} field(s)
            {isMultiStep &&
              ` • ${stepNumbers.filter((s) => value.some((v) => v.step_number === s.value)).length} step(s)`}
          </small>
        </div>
        <div className="d-flex gap-2">
          <Button
            label={showJsonPreview ? "Hide JSON" : "Show JSON"}
            icon={showJsonPreview ? "pi pi-eye-slash" : "pi pi-code"}
            size="small"
            severity="secondary"
            outlined
            type="button"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
          />
          <Button
            label="Import Sections"
            icon="pi pi-download"
            size="small"
            severity="info"
            outlined
            type="button"
            onClick={() => setShowImportDialog(true)}
          />
          <Button
            label="Add Section"
            icon="pi pi-plus"
            size="small"
            severity="success"
            type="button"
            onClick={addSection}
          />
        </div>
      </div>

      {/* Import Sections Dialog */}
      <Dialog
        header="Import Sections from Another Scheme"
        visible={showImportDialog}
        style={{ width: "600px" }}
        onHide={() => {
          setShowImportDialog(false);
          setSelectedSchemeId(null);
          setSelectedSections([]);
        }}
        footer={
          <div className="d-flex gap-2 justify-content-end">
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              outlined
              type="button"
              onClick={() => {
                setShowImportDialog(false);
                setSelectedSchemeId(null);
                setSelectedSections([]);
              }}
            />
            <Button
              label={`Import ${selectedSections.length} Section(s)`}
              icon="pi pi-check"
              severity="success"
              type="button"
              disabled={selectedSections.length === 0}
              onClick={importSelectedSections}
            />
          </div>
        }
      >
        <div className="mb-4">
          <label className="form-label fw-semibold">Select Source Scheme</label>
          <Dropdown
            value={selectedSchemeId}
            options={schemeOptions}
            onChange={(e) => {
              setSelectedSchemeId(e.value);
              setSelectedSections([]);
            }}
            placeholder="Choose a scheme to import from"
            className="w-100"
            filter
          />
        </div>

        {selectedSchemeId && selectedSchemeSections.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <label className="form-label fw-semibold mb-0">
                Select Sections to Import
              </label>
              <div className="d-flex gap-2">
                <Button
                  label="Select All"
                  size="small"
                  severity="secondary"
                  text
                  type="button"
                  onClick={() =>
                    setSelectedSections(selectedSchemeSections.map((_, i) => i))
                  }
                />
                <Button
                  label="Clear"
                  size="small"
                  severity="secondary"
                  text
                  type="button"
                  onClick={() => setSelectedSections([])}
                />
              </div>
            </div>
            <div
              className="border rounded p-2"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {selectedSchemeSections.map((section, index) => (
                <div
                  key={index}
                  className="d-flex align-items-center p-2 border-bottom"
                >
                  <Checkbox
                    inputId={`import_section_${index}`}
                    checked={selectedSections.includes(index)}
                    onChange={(e) => {
                      if (e.checked) {
                        setSelectedSections((prev) => [...prev, index]);
                      } else {
                        setSelectedSections((prev) =>
                          prev.filter((i) => i !== index),
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`import_section_${index}`}
                    className="ms-2 flex-grow-1"
                    style={{ cursor: "pointer" }}
                  >
                    <strong>
                      {section.section_title || `Section ${index + 1}`}
                    </strong>
                    <br />
                    <small className="text-muted">
                      {section.fields?.length || 0} field(s)
                      {section.step_number && ` • Step ${section.step_number}`}
                    </small>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedSchemeId && selectedSchemeSections.length === 0 && (
          <div className="text-center text-muted p-4">
            <i
              className="pi pi-info-circle mb-2"
              style={{ fontSize: "2rem" }}
            ></i>
            <p>No sections found in this scheme.</p>
          </div>
        )}
      </Dialog>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="mb-3">
          <InputTextarea
            value={JSON.stringify(value, null, 2)}
            rows={10}
            className="w-100"
            style={{ fontFamily: "monospace", fontSize: "12px" }}
            readOnly
          />
        </div>
      )}

      {/* Sections */}
      {value.length === 0 ? (
        <div
          className="text-center text-muted p-5 border rounded"
          style={{ backgroundColor: "#f8f9fa" }}
        >
          <i
            className="pi pi-folder-open mb-3"
            style={{ fontSize: "3rem" }}
          ></i>
          <h5>No Sections Yet</h5>
          <p>Click "Add Section" to start building your form structure.</p>
          <Button
            label="Add First Section"
            icon="pi pi-plus"
            type="button"
            onClick={addSection}
          />
        </div>
      ) : (
        value.map((section, index) => (
          <SectionEditor
            key={index}
            section={section}
            sectionIndex={index}
            onChange={(s) => updateSection(index, s)}
            onRemove={() => removeSection(index)}
            onMoveUp={() => moveSection(index, "up")}
            onMoveDown={() => moveSection(index, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < value.length - 1}
            allFieldMasterFields={fieldMasterFields}
            allFormFields={allFormFields}
            isExpanded={expandedSections.includes(index)}
            onToggle={() => toggleSection(index)}
            isMultiStep={isMultiStep}
            stepOptions={stepNumbers}
          />
        ))
      )}
    </div>
  );
};
