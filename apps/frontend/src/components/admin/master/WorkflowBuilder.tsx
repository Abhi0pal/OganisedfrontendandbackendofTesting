"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { MultiSelect } from "primereact/multiselect";
import { useUsers } from "@/hooks/useAdminData";

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

type WorkflowStage = {
  stage_name: string;
  current_role: string;
  //   role_assign: string;
  next_role?: string[];
  action: string[];
  condition?: ConditionNode;
  timeline_days?: number; // ⬅ optional timeline in days
};

type WorkflowConfig = {
  submit_url: string;
  draft_url?: string;
  stages: WorkflowStage[];
};

type Props = {
  value: WorkflowConfig;
  onChange: (value: WorkflowConfig) => void;
  //   availableRoles: { label: string; value: string }[];
  availableFields: { label: string; value: string }[];
};

const actionOptions = [
  { label: "Document Verify", value: "document_verify" },

  // Revert actions
  { label: "Revert to Applicant", value: "revert_applicant" },
  { label: "Revert to Previous User", value: "revert_back" },

  // Forwarding actions
  { label: "Forward", value: "forward" },
  { label: "Forward to District", value: "forward_district" },
  { label: "Forward to Department", value: "forward_department" },
  { label: "Forward to SLEC", value: "forward_to_slec" },
  {
    label: "Forward for Disbursement",
    value: "forward_for_disbursement",
  },

  // Query
  { label: "Raise Query", value: "raise_query" },

  // Approvals
  { label: "Approve", value: "approve" },
  {
    label: "Conditionally Approve",
    value: "conditionally_approve",
  },

  // Rejections
  { label: "Reject", value: "reject" },

  // Payment lifecycle
  { label: "Mark as Payment Initiated", value: "payment" },
  { label: "Mark Payment Done", value: "payment_done" },

  // Disbursement
  { label: "Mark as Disbursed", value: "disburse" },

  // Archive
  { label: "Archive Application", value: "archive" },
];

// ---------------- Condition Editor ----------------
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

// ---------------- Workflow Builder ----------------
export function WorkflowBuilder({
  value,
  onChange,
  //   availableRoles,
  availableFields,
}: Props) {
  const updateStage = (index: number, data: Partial<WorkflowStage>) => {
    const stages = [...value.stages];
    stages[index] = { ...stages[index], ...data };
    onChange({ ...value, stages });
  };

  const addStage = () => {
    onChange({
      ...value,
      stages: [
        ...value.stages,
        {
          stage_name: "",
          current_role: "",
          //   role_assign: "",
          next_role: [],
          action: [],
          timeline_days: undefined, // optional
        },
      ],
    });
  };
  const { data: users = [], isLoading, error } = useUsers();

  const departmentUsers = users.filter(
    (user) => user.user_type === "DEPARTMENT",
  );

  // inside WorkflowBuilder component, after filtering department users
  const departmentRoleOptions = departmentUsers.map((user) => ({
    label: `${user.role.name} - ${user.email}`, // optional: show role and email
    value: user.id, // store user id in value
  }));

  const removeStage = (index: number) => {
    onChange({
      ...value,
      stages: value.stages.filter((_, i) => i !== index),
    });
  };
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(value, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!showJsonEditor) {
      setJsonText(JSON.stringify(value, null, 2));
    }
  }, [value, showJsonEditor]);
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);

      // Optional validation check
      if (!parsed.stages || !Array.isArray(parsed.stages)) {
        throw new Error("Invalid workflow JSON structure");
      }

      onChange(parsed);
      setJsonError(null);
      setShowJsonEditor(false);
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON");
    }
  };

  return (
    <div className="flex flex-column gap-4 card">
      {/* API ENDPOINTS */}
      <Card>
        <h5 className="mb-1">API Endpoints</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Submit URL</label>
            <InputText
              value={value.submit_url || ""}
              onChange={(e) =>
                onChange({ ...value, submit_url: e.target.value })
              }
              className="w-100"
              placeholder="/applications/submit"
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Draft URL</label>
            <InputText
              value={value.draft_url || ""}
              onChange={(e) =>
                onChange({ ...value, draft_url: e.target.value })
              }
              className="w-100"
              placeholder="/applications/draft"
            />
          </div>
        </div>
      </Card>

      {/* WORKFLOW STAGES */}
      <Card>
        {/* <div className="d-flex justify-content-between align-items-center">
          <div className="mb-1">
            <h5 className="mb-1">Approval Workflow</h5>
            <small className="text-muted">
              Configure stage-wise approval flow
            </small>
          </div>
          <Button
            label="Add Stage"
            icon="pi pi-plus"
            type="button"
            severity="success"
            onClick={addStage}
          />
        </div> */}
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">Approval Workflow</h5>
            <small className="text-muted">
              Configure stage-wise approval flow
            </small>
          </div>

          <div className="d-flex gap-2">
            <Button
              label={showJsonEditor ? "Back to Form" : "View / Edit JSON"}
              icon="pi pi-code"
              type="button"
              severity="secondary"
              onClick={() => setShowJsonEditor(!showJsonEditor)}
            />

            {!showJsonEditor && (
              <Button
                label="Add Stage"
                icon="pi pi-plus"
                type="button"
                severity="success"
                onClick={addStage}
              />
            )}
          </div>
        </div>

        {/* JSON SECTION (Toggleable) */}
        {showJsonEditor && (
          <div className="mt-3 mb-4 border rounded p-3 bg-white">
            <h6 className="fw-semibold mb-2">Workflow JSON Editor</h6>

            <textarea
              className="form-control"
              style={{
                fontFamily: "monospace",
                minHeight: "400px",
              }}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
            />

            {jsonError && (
              <div className="text-danger mt-2 small">{jsonError}</div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button
                label="Cancel"
                severity="secondary"
                outlined
                onClick={() => {
                  setJsonText(JSON.stringify(value, null, 2));
                  setJsonError(null);
                  setShowJsonEditor(false);
                }}
              />

              <Button
                label="Apply JSON"
                icon="pi pi-check"
                severity="success"
                onClick={handleApplyJson}
              />
            </div>
          </div>
        )}
        {value.stages.map((stage, index) => (
          <div key={index} className="border rounded p-3 mb-3 bg-light">
            <div className="d-flex justify-content-between mb-2">
              <strong>Stage {index + 1}</strong>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                type="button"
                onClick={() => removeStage(index)}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Stage Name</label>
                <InputText
                  value={stage.stage_name}
                  onChange={(e) =>
                    updateStage(index, { stage_name: e.target.value })
                  }
                  className="w-100"
                  placeholder="District Approval"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Current Role</label>
                <Dropdown
                  value={stage.current_role}
                  options={departmentRoleOptions} // <-- use filtered users here
                  onChange={(e) =>
                    updateStage(index, { current_role: e.value })
                  }
                  placeholder="Select Department User"
                  className="w-100"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">
                  Timeline (Days)
                  <span className="text-muted ms-1">(Optional)</span>
                </label>

                <InputText
                  type="number"
                  min={0}
                  value={
                    stage.timeline_days !== undefined
                      ? String(stage.timeline_days)
                      : ""
                  }
                  onChange={(e) =>
                    updateStage(index, {
                      timeline_days: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-100"
                  placeholder="e.g. 7"
                />
              </div>

              {/* <div className="col-md-3">
                <label className="form-label">Role Assign</label>
                <Dropdown
                  value={stage.role_assign}
                  options={roleAssignOptions}
                  onChange={(e) => updateStage(index, { role_assign: e.value })}
                  placeholder="Role Assign"
                  className="w-100"
                />
              </div> */}

              <div className="col-md-3">
                <label className="form-label">Action</label>
                <MultiSelect
                  value={stage.action}
                  options={actionOptions}
                  onChange={(e) => updateStage(index, { action: e.value })}
                  placeholder="Select Action"
                  className="w-100"
                  multiple
                  showClear
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Next Role</label>
                <MultiSelect
                  value={stage.next_role || []}
                  options={departmentRoleOptions} // <-- use filtered users here
                  onChange={(e) =>
                    updateStage(index, { next_role: e.value || [] })
                  }
                  placeholder="Select Next Role(s)"
                  className="w-100"
                  multiple
                  showClear
                />
              </div>

              <div className="col-md-12 mt-3">
                <label className="form-label small fw-semibold">
                  Conditional Rendering
                </label>

                {!stage.condition ? (
                  <Button
                    label="Add Condition"
                    icon="pi pi-plus"
                    size="small"
                    severity="secondary"
                    outlined
                    type="button"
                    onClick={() =>
                      updateStage(index, {
                        condition: {
                          type: "group",
                          operator: "AND",
                          children: [],
                        },
                      })
                    }
                  />
                ) : (
                  <>
                    <ConditionNodeEditor
                      node={stage.condition}
                      availableFields={availableFields}
                      onChange={(updatedNode) =>
                        updateStage(index, { condition: updatedNode })
                      }
                      onRemove={() =>
                        updateStage(index, { condition: undefined })
                      }
                    />

                    <Tag
                      value="Conditional"
                      severity="warning"
                      icon="pi pi-eye"
                      className="mt-2"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
