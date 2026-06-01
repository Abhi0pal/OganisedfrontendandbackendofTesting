"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { RadioButton } from "primereact/radiobutton";
import { Checkbox } from "primereact/checkbox";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Divider } from "primereact/divider";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import { useMasterTables } from "@/hooks/master/useSchemes";
// ============================================================================
// Type Definitions
// ============================================================================

export interface SlabRange {
  min: number;
  max: number;
  value?: number; // Fixed value to return
  percentage?: number; // OR percentage of the field value
  formula?: string; // OR custom formula
}

export interface LookupConfig {
  source?: "master" | "static"; // ✅ ADD THIS

  table_code: string; // Master table code
  match_field: string; // Form field to match against
  match_column: string; // Table column to match
  return_column: string; // Column value to return
  static_options?: {
    label: string;
    value: string | number;
  }[];
}

export interface ConditionalConfig {
  condition: string; // e.g., "FIELD_A > 1000"
  if_true: string; // Expression if true
  if_false: string; // Expression if false
}

export interface CalculationConfig {
  enabled: boolean;
  formula_type: "expression" | "conditional" | "slab" | "lookup" | "aggregate";

  // For expression type (e.g., "FIELD_A + FIELD_B * 0.15")
  expression?: string;

  // For conditional type
  conditional?: ConditionalConfig;

  // For slab type
  slabs?: {
    field: string; // Field to check against slabs
    ranges: SlabRange[];
  };

  // For lookup type
  lookup?: LookupConfig;

  // For aggregate type
  aggregate?: {
    operation: "SUM" | "AVG" | "MIN" | "MAX" | "COUNT";
    fields: string[]; // Field codes to aggregate
  };

  // Common options
  round_to?: number; // Decimal places (-1 = no rounding)
  min_value?: number; // Floor value
  max_value?: number; // Ceiling value
  trigger_on?: string[]; // Field codes that trigger recalculation
}

// Default empty calculation config
export const DEFAULT_CALCULATION: CalculationConfig = {
  enabled: false,
  formula_type: "expression",
  expression: "",
  round_to: -1,
};

// ============================================================================
// Props
// ============================================================================

interface CalculationEditorProps {
  value: CalculationConfig;
  onChange: (config: CalculationConfig) => void;
  availableFields: Array<{ label: string; code: string; data_type: string }>;
  masterTables?: Array<{
    master_code: string;
    master_name: string;
    label_column: string;
    value_column: string;
    columns: { code: string; label: string }[]; // <-- add this
  }>;
}

// ============================================================================
// Constants
// ============================================================================

const FORMULA_TYPES = [
  {
    label: "Expression (Formula)",
    value: "expression",
    icon: "pi pi-calculator",
    description: "Math formula like A + B * 0.15",
  },
  {
    label: "Conditional (IF/THEN)",
    value: "conditional",
    icon: "pi pi-directions",
    description: "Different values based on conditions",
  },
  {
    label: "Slab-based (Ranges)",
    value: "slab",
    icon: "pi pi-chart-bar",
    description: "Value based on range brackets",
  },
  {
    label: "Lookup (From Table)",
    value: "lookup",
    icon: "pi pi-search",
    description: "Get value from master table",
  },
  {
    label: "Aggregate (SUM/AVG)",
    value: "aggregate",
    icon: "pi pi-plus-circle",
    description: "Sum, average, min, max of fields",
  },
];

const AGGREGATE_OPERATIONS = [
  { label: "Sum", value: "SUM" },
  { label: "Average", value: "AVG" },
  { label: "Minimum", value: "MIN" },
  { label: "Maximum", value: "MAX" },
  { label: "Count", value: "COUNT" },
];

const COMPARISON_OPERATORS = [
  { label: ">", value: ">" },
  { label: ">=", value: ">=" },
  { label: "<", value: "<" },
  { label: "<=", value: "<=" },
  { label: "==", value: "==" },
  { label: "!=", value: "!=" },
];

const MATH_OPERATORS = ["+", "-", "*", "/", "(", ")"];

const BUILT_IN_FUNCTIONS = [
  {
    name: "ROUND",
    syntax: "ROUND(value, decimals)",
    description: "Round to decimals",
  },
  { name: "FLOOR", syntax: "FLOOR(value)", description: "Round down" },
  { name: "CEIL", syntax: "CEIL(value)", description: "Round up" },
  { name: "ABS", syntax: "ABS(value)", description: "Absolute value" },
  { name: "MIN", syntax: "MIN(a, b)", description: "Smaller of two values" },
  { name: "MAX", syntax: "MAX(a, b)", description: "Larger of two values" },
  {
    name: "PERCENTAGE_OF",
    syntax: "PERCENTAGE_OF(part, whole)",
    description: "Part as % of whole",
  },
  {
    name: "DATE_DIFF",
    syntax: "DATE_DIFF(date1, date2, unit)",
    description: "Difference in days/months/years",
  },
];

// ============================================================================
// Main Component
// ============================================================================

export function CalculationEditor({
  value,
  onChange,
  availableFields,
}: CalculationEditorProps) {
  const [showFunctionHelp, setShowFunctionHelp] = useState(false);

  // ========================================================================
  // Handlers
  // ========================================================================
  const lookupSource = value.lookup?.source ?? "master";

  const updateConfig = useCallback(
    (updates: Partial<CalculationConfig>) => {
      onChange({ ...value, ...updates });
    },
    [value, onChange],
  );

  const insertToExpression = useCallback(
    (text: string) => {
      const currentExpr = value.expression || "";
      updateConfig({ expression: currentExpr + text });
    },
    [value.expression, updateConfig],
  );
  const { data: masterTables = [] } = useMasterTables();
  const [tableColumns, setTableColumns] = useState<
    { code: string; label: string }[]
  >([]);

  // Inside CalculationEditor component
  useEffect(() => {
    if (!value.lookup?.table_code) {
      setTableColumns((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const selectedMaster = masterTables.find(
      (t) => t.master_code === value.lookup?.table_code,
    );

    if (!selectedMaster) {
      setTableColumns((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const nextColumns = selectedMaster.columns.map((c) => ({
      code: c.code,
      label: c.label,
    }));

    setTableColumns((prev) =>
      JSON.stringify(prev) === JSON.stringify(nextColumns) ? prev : nextColumns,
    );
  }, [value.lookup?.table_code, masterTables]);

  const masterTableOptions = useMemo(
    () =>
      masterTables.map((t) => ({
        label: t.master_name, // You can switch to t.master_code if you prefer
        value: t.master_code,
      })),
    [masterTables],
  );
  // ========================================================================
  // Slab Management
  // ========================================================================

  const addSlabRange = useCallback(() => {
    const currentRanges = value.slabs?.ranges || [];
    const lastMax =
      currentRanges.length > 0
        ? currentRanges[currentRanges.length - 1].max
        : 0;
    updateConfig({
      slabs: {
        field: value.slabs?.field || "",
        ranges: [
          ...currentRanges,
          { min: lastMax, max: lastMax + 10000, value: 0 },
        ],
      },
    });
  }, [value.slabs, updateConfig]);

  const updateSlabRange = useCallback(
    (index: number, updates: Partial<SlabRange>) => {
      const ranges = [...(value.slabs?.ranges || [])];
      ranges[index] = { ...ranges[index], ...updates };
      updateConfig({
        slabs: { ...value.slabs!, ranges },
      });
    },
    [value.slabs, updateConfig],
  );

  const removeSlabRange = useCallback(
    (index: number) => {
      const ranges = value.slabs?.ranges.filter((_, i) => i !== index) || [];
      updateConfig({
        slabs: { ...value.slabs!, ranges },
      });
    },
    [value.slabs, updateConfig],
  );

  // ========================================================================
  // Aggregate Field Management
  // ========================================================================

  const toggleAggregateField = useCallback(
    (fieldCode: string) => {
      const currentFields = value.aggregate?.fields || [];
      const newFields = currentFields.includes(fieldCode)
        ? currentFields.filter((f) => f !== fieldCode)
        : [...currentFields, fieldCode];
      updateConfig({
        aggregate: {
          operation: value.aggregate?.operation || "SUM",
          fields: newFields,
        },
      });
    },
    [value.aggregate, updateConfig],
  );

  // ========================================================================
  // Render Helpers
  // ========================================================================

  const fieldOptions = useMemo(
    () =>
      availableFields.map((f) => ({
        label: `${f.label} (${f.code})`,
        value: f.code,
      })),
    [availableFields],
  );

  const numericFields = useMemo(
    () => availableFields.filter((f) => f.data_type === "number"),
    [availableFields],
  );

  // ========================================================================
  // Render
  // ========================================================================

  if (!value.enabled) {
    return (
      <div className="p-3 border rounded bg-light">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <i className="pi pi-calculator me-2"></i>
            <span className="fw-semibold">Calculated Field</span>
            <small className="d-block text-muted mt-1">
              Value will be computed from other fields
            </small>
          </div>
          <Button
            label="Enable Calculation"
            icon="pi pi-plus"
            size="small"
            severity="success"
            type="button"
            onClick={() => updateConfig({ enabled: true })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border rounded" style={{ backgroundColor: "#f0f9ff" }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <i className="pi pi-calculator me-2 text-primary"></i>
          <span className="fw-semibold">Calculation Configuration</span>
        </div>
        <Button
          icon="pi pi-times"
          severity="danger"
          size="small"
          text
          rounded
          type="button"
          onClick={() => updateConfig({ enabled: false })}
          tooltip="Disable calculation"
        />
      </div>

      {/* Formula Type Selection */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Calculation Type</label>
        <div className="d-flex flex-wrap gap-3">
          {FORMULA_TYPES.map((type) => (
            <div
              key={type.value}
              className={`p-3 border rounded cursor-pointer ${value.formula_type === type.value ? "border-primary bg-white" : "bg-light"}`}
              style={{ cursor: "pointer", minWidth: "150px" }}
              onClick={() => updateConfig({ formula_type: type.value as any })}
            >
              <div className="d-flex align-items-center mb-1">
                <RadioButton
                  inputId={type.value}
                  checked={value.formula_type === type.value}
                  onChange={() =>
                    updateConfig({ formula_type: type.value as any })
                  }
                />
                <i className={`${type.icon} ms-2 me-1`}></i>
                <label
                  htmlFor={type.value}
                  className="fw-semibold mb-0 cursor-pointer"
                >
                  {type.label.split(" ")[0]}
                </label>
              </div>
              <small className="text-muted">{type.description}</small>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Expression Mode */}
      {value.formula_type === "expression" && (
        <div className="mb-4">
          <label className="form-label fw-semibold">Formula Expression</label>

          {/* Field Buttons */}
          <div className="mb-2">
            <small className="text-muted d-block mb-1">
              Click to insert field:
            </small>
            <div className="d-flex flex-wrap gap-1">
              {availableFields.map((field) => (
                <Button
                  key={field.code}
                  label={field.code}
                  size="small"
                  severity="info"
                  outlined
                  type="button"
                  onClick={() => insertToExpression(field.code)}
                />
              ))}
            </div>
          </div>

          {/* Operators */}
          <div className="mb-2">
            <small className="text-muted d-block mb-1">Operators:</small>
            <div className="d-flex gap-1">
              {MATH_OPERATORS.map((op) => (
                <Button
                  key={op}
                  label={op}
                  size="small"
                  severity="secondary"
                  type="button"
                  onClick={() => insertToExpression(` ${op} `)}
                  style={{ minWidth: "40px" }}
                />
              ))}
            </div>
          </div>

          {/* Expression Input */}
          <InputText
            value={value.expression || ""}
            onChange={(e) => updateConfig({ expression: e.target.value })}
            placeholder="e.g., INVESTMENT_AMOUNT * 0.15 + LAND_COST"
            className="w-100 font-monospace"
            style={{ fontSize: "14px" }}
          />
          <small className="text-muted">
            Example: <code>FIELD_A + FIELD_B * 0.15</code> or{" "}
            <code>ROUND(TOTAL * 0.18, 2)</code>
          </small>

          {/* Function Help */}
          <div className="mt-2">
            <Button
              label={
                showFunctionHelp ? "Hide Functions" : "Show Available Functions"
              }
              icon={
                showFunctionHelp ? "pi pi-chevron-up" : "pi pi-chevron-down"
              }
              size="small"
              text
              type="button"
              onClick={() => setShowFunctionHelp(!showFunctionHelp)}
            />
            {showFunctionHelp && (
              <div className="mt-2 p-2 border rounded bg-white">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Function</th>
                      <th>Syntax</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BUILT_IN_FUNCTIONS.map((fn) => (
                      <tr key={fn.name}>
                        <td>
                          <code>{fn.name}</code>
                        </td>
                        <td>
                          <code>{fn.syntax}</code>
                        </td>
                        <td>{fn.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conditional Mode */}
      {value.formula_type === "conditional" && (
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Conditional Logic (IF / THEN / ELSE)
          </label>

          <div className="p-3 border rounded bg-white">
            {/* Condition */}
            <div className="mb-3">
              <label className="form-label">IF (Condition)</label>
              <div className="d-flex gap-2 align-items-center">
                <Dropdown
                  value={value.conditional?.condition?.split(" ")[0] || ""}
                  options={fieldOptions}
                  onChange={(e) => {
                    const parts = (value.conditional?.condition || "").split(
                      " ",
                    );
                    parts[0] = e.value;
                    updateConfig({
                      conditional: {
                        ...value.conditional!,
                        condition: parts.join(" "),
                      },
                    });
                  }}
                  placeholder="Select field"
                  className="flex-grow-1"
                />
                <Dropdown
                  value={value.conditional?.condition?.split(" ")[1] || ">"}
                  options={COMPARISON_OPERATORS}
                  onChange={(e) => {
                    const parts = (value.conditional?.condition || "").split(
                      " ",
                    );
                    parts[1] = e.value;
                    updateConfig({
                      conditional: {
                        ...value.conditional!,
                        condition: parts.join(" "),
                      },
                    });
                  }}
                  style={{ width: "80px" }}
                />
                <InputText
                  value={value.conditional?.condition?.split(" ")[2] || ""}
                  onChange={(e) => {
                    const parts = (value.conditional?.condition || "").split(
                      " ",
                    );
                    parts[2] = e.target.value;
                    updateConfig({
                      conditional: {
                        ...value.conditional!,
                        condition: parts.join(" "),
                      },
                    });
                  }}
                  placeholder="Value"
                  style={{ width: "120px" }}
                />
              </div>
            </div>

            {/* Then */}
            <div className="mb-3">
              <label className="form-label text-success">THEN (If True)</label>
              <InputText
                value={value.conditional?.if_true || ""}
                onChange={(e) =>
                  updateConfig({
                    conditional: {
                      ...value.conditional!,
                      if_true: e.target.value,
                    },
                  })
                }
                placeholder="e.g., INVESTMENT * 0.2"
                className="w-100 font-monospace"
              />
            </div>

            {/* Else */}
            <div>
              <label className="form-label text-danger">ELSE (If False)</label>
              <InputText
                value={value.conditional?.if_false || ""}
                onChange={(e) =>
                  updateConfig({
                    conditional: {
                      ...value.conditional!,
                      if_false: e.target.value,
                    },
                  })
                }
                placeholder="e.g., INVESTMENT * 0.1"
                className="w-100 font-monospace"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slab Mode */}
      {value.formula_type === "slab" && (
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Slab-based Calculation
          </label>

          <div className="mb-3">
            <label className="form-label">Based on Field</label>
            <Dropdown
              value={value.slabs?.field || ""}
              options={numericFields.map((f) => ({
                label: `${f.label} (${f.code})`,
                value: f.code,
              }))}
              onChange={(e) =>
                updateConfig({
                  slabs: { ...value.slabs!, field: e.value },
                })
              }
              placeholder="Select field to check against ranges"
              className="w-100"
            />
          </div>

          {/* Slab Table */}
          <div className="border rounded">
            <table className="table table-sm mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Min Value</th>
                  <th>Max Value</th>
                  <th>Return Value / %</th>
                  <th style={{ width: "60px" }}></th>
                </tr>
              </thead>
              <tbody>
                {(value.slabs?.ranges || []).map((range, index) => (
                  <tr key={index}>
                    <td>
                      <InputNumber
                        value={range.min}
                        onValueChange={(e) =>
                          updateSlabRange(index, { min: e.value || 0 })
                        }
                        mode="decimal"
                        className="w-100"
                        inputClassName="w-100"
                      />
                    </td>
                    <td>
                      <InputNumber
                        value={range.max}
                        onValueChange={(e) =>
                          updateSlabRange(index, { max: e.value || 0 })
                        }
                        mode="decimal"
                        className="w-100"
                        inputClassName="w-100"
                      />
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <InputNumber
                          value={range.value ?? range.percentage}
                          onValueChange={(e) =>
                            updateSlabRange(index, { value: e.value || 0 })
                          }
                          mode="decimal"
                          className="flex-grow-1"
                          inputClassName="w-100"
                          placeholder="Value"
                        />
                        <Dropdown
                          value={
                            range.percentage !== undefined
                              ? "percentage"
                              : "value"
                          }
                          options={[
                            { label: "Fixed", value: "value" },
                            { label: "%", value: "percentage" },
                          ]}
                          onChange={(e) => {
                            if (e.value === "percentage") {
                              updateSlabRange(index, {
                                percentage: range.value,
                                value: undefined,
                              });
                            } else {
                              updateSlabRange(index, {
                                value: range.percentage,
                                percentage: undefined,
                              });
                            }
                          }}
                          style={{ width: "80px" }}
                        />
                      </div>
                    </td>
                    <td>
                      <Button
                        icon="pi pi-trash"
                        severity="danger"
                        size="small"
                        text
                        rounded
                        type="button"
                        onClick={() => removeSlabRange(index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            label="Add Range"
            icon="pi pi-plus"
            size="small"
            severity="secondary"
            className="mt-2"
            type="button"
            onClick={addSlabRange}
          />
        </div>
      )}
      {/* Lookup Mode */}
      {value.formula_type === "lookup" && (
        <div className="mb-4">
          <label className="form-label fw-semibold">Lookup Configuration</label>

          {/* Lookup Source */}
          <div className="mb-3">
            <label className="form-label">Lookup Source</label>
            <Dropdown
              value={value.lookup?.source || "master"}
              options={[
                { label: "Master Table", value: "master" },
                { label: "Static Options", value: "static" },
              ]}
              onChange={(e) =>
                onChange({
                  ...value,
                  lookup: {
                    table_code: "",
                    match_field: "",
                    match_column: "",
                    return_column: "",
                    source: e.value,
                    static_options: e.value === "static" ? [] : undefined,
                  },
                })
              }
              className="w-100"
            />
          </div>

          <div className="row">
            {/* ================= MASTER TABLE LOOKUP ================= */}
            {value.lookup?.source !== "static" && (
              <>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Master Table</label>
                  <Dropdown
                    value={value.lookup?.table_code}
                    options={masterTableOptions}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        lookup: {
                          ...value.lookup!,
                          table_code: e.value,
                          match_column: "",
                          return_column: "",
                        },
                      })
                    }
                    placeholder="Select master table"
                    className="w-100"
                  />
                </div>
                {/* <div className="col-md-6 mb-3">
                  <label className="form-label">Match Form Field</label>
                  <Dropdown
                    value={value.lookup?.match_field}
                    options={availableFields.map((f) => ({
                      label: f.label,
                      value: f.code,
                    }))}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        lookup: {
                          ...value.lookup!,
                          match_field: e.value,
                        },
                      })
                    }
                    placeholder="Select form field"
                    className="w-100"
                  />
                </div> */}

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Match Column-Value (Table)
                  </label>
                  <Dropdown
                    value={value.lookup?.match_column}
                    options={tableColumns.map((c) => ({
                      label: c.label,
                      value: c.code,
                    }))}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        lookup: {
                          ...value.lookup!,
                          match_column: e.value,
                        },
                      })
                    }
                    placeholder="Select match column"
                    className="w-100"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Return Column (Label)</label>
                  <Dropdown
                    value={value.lookup?.return_column}
                    options={tableColumns.map((c) => ({
                      label: c.label,
                      value: c.code,
                    }))}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        lookup: {
                          ...value.lookup!,
                          return_column: e.value,
                        },
                      })
                    }
                    placeholder="Select return column"
                    className="w-100"
                  />
                </div>
              </>
            )}

            {/* ================= STATIC LOOKUP ================= */}
            {value.lookup?.source === "static" && (
              <div className="col-12">
                <div className="border rounded p-3 bg-white">
                  <label className="form-label fw-semibold">
                    Static Dropdown Options
                  </label>

                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Value</th>
                        <th style={{ width: 40 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {(value.lookup?.static_options || []).map(
                        (opt, index) => (
                          <tr key={index}>
                            <td>
                              <InputText
                                value={opt.label}
                                className="w-100"
                                onChange={(e) => {
                                  const updated = [
                                    ...value.lookup!.static_options!,
                                  ];
                                  updated[index] = {
                                    ...opt,
                                    label: e.target.value,
                                  };
                                  onChange({
                                    ...value,
                                    lookup: {
                                      ...value.lookup!,
                                      static_options: updated,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td>
                              <InputText
                                value={String(opt.value)}
                                className="w-100"
                                onChange={(e) => {
                                  const updated = [
                                    ...value.lookup!.static_options!,
                                  ];
                                  updated[index] = {
                                    ...opt,
                                    value: e.target.value,
                                  };
                                  onChange({
                                    ...value,
                                    lookup: {
                                      ...value.lookup!,
                                      static_options: updated,
                                    },
                                  });
                                }}
                              />
                            </td>
                            <td>
                              <Button
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                type="button"
                                size="small"
                                onClick={() =>
                                  onChange({
                                    ...value,
                                    lookup: {
                                      ...value.lookup!,
                                      static_options:
                                        value.lookup!.static_options!.filter(
                                          (_, i) => i !== index,
                                        ),
                                    },
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>

                  <Button
                    label="Add Option"
                    icon="pi pi-plus"
                    size="small"
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        lookup: {
                          ...value.lookup!,
                          static_options: [
                            ...(value.lookup?.static_options || []),
                            { label: "", value: "" },
                          ],
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aggregate Mode */}
      {value.formula_type === "aggregate" && (
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Aggregate Calculation
          </label>

          <div className="mb-3">
            <label className="form-label">Operation</label>
            <Dropdown
              value={value.aggregate?.operation || "SUM"}
              options={AGGREGATE_OPERATIONS}
              onChange={(e) =>
                updateConfig({
                  aggregate: { ...value.aggregate!, operation: e.value },
                })
              }
              className="w-100"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Select Fields to {value.aggregate?.operation || "SUM"}
            </label>
            <div className="d-flex flex-wrap gap-2">
              {numericFields.map((field) => (
                <div key={field.code} className="d-flex align-items-center">
                  <Checkbox
                    inputId={`agg_${field.code}`}
                    checked={(value.aggregate?.fields || []).includes(
                      field.code,
                    )}
                    onChange={() => toggleAggregateField(field.code)}
                  />
                  <label htmlFor={`agg_${field.code}`} className="ms-2">
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
            {numericFields.length === 0 && (
              <small className="text-muted">No numeric fields available</small>
            )}
          </div>

          {/* Preview */}
          {(value.aggregate?.fields || []).length > 0 && (
            <div className="p-2 bg-light rounded">
              <small className="text-muted">Formula: </small>
              <code>
                {value.aggregate?.operation}(
                {(value.aggregate?.fields || []).join(", ")})
              </code>
            </div>
          )}
        </div>
      )}

      <Divider />

      {/* Common Options */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Round to Decimals</label>
          <InputNumber
            value={value.round_to === -1 ? null : value.round_to}
            onValueChange={(e) => updateConfig({ round_to: e.value ?? -1 })}
            placeholder="No rounding"
            min={0}
            max={10}
            className="w-100"
          />
          <small className="text-muted">Leave empty for no rounding</small>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Minimum Value (Floor)</label>
          <InputNumber
            value={value.min_value}
            onValueChange={(e) =>
              updateConfig({ min_value: e.value ?? undefined })
            }
            placeholder="No minimum"
            className="w-100"
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Maximum Value (Ceiling)</label>
          <InputNumber
            value={value.max_value}
            onValueChange={(e) =>
              updateConfig({ max_value: e.value ?? undefined })
            }
            placeholder="No maximum"
            className="w-100"
          />
        </div>
      </div>

      {/* Trigger Fields */}
      <div className="mb-3">
        <label className="form-label">
          Recalculate When These Fields Change
        </label>
        <div className="d-flex flex-wrap gap-2">
          {availableFields.map((field) => (
            <div key={field.code} className="d-flex align-items-center">
              <Checkbox
                inputId={`trigger_${field.code}`}
                checked={(value.trigger_on || []).includes(field.code)}
                onChange={() => {
                  const current = value.trigger_on || [];
                  const newTriggers = current.includes(field.code)
                    ? current.filter((f) => f !== field.code)
                    : [...current, field.code];
                  updateConfig({ trigger_on: newTriggers });
                }}
              />
              <label htmlFor={`trigger_${field.code}`} className="ms-2">
                {field.label}
              </label>
            </div>
          ))}
        </div>
        <small className="text-muted">
          Auto-detected from expression if left empty
        </small>
      </div>
    </div>
  );
}
