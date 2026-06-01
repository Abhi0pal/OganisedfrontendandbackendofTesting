"use client";

import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

interface Props {
  value: any;
  formData: any;
  onChange: (val: any) => void;
  policyOptions: { label: string; value: number }[];
  schemeOptions: {
    label: string;
    value: number;
    policy_id: number;
    form_structure_json: string | object;
  }[];
}

export const CascadingConfigBuilder = ({
  value,
  onChange,
  policyOptions,
  schemeOptions,
}: Props) => {
  const config = {
    trigger: value?.trigger || {},
    groups: Array.isArray(value?.groups) ? value.groups : [],
  };

  /* ---------------- GROUP FUNCTIONS ---------------- */

  const addGroup = () => {
    const newGroup = {
      joinOperator: config.groups.length > 0 ? "AND" : null, // first group has no join
      logicalOperator: "AND",
      conditions: [],
    };

    onChange({
      ...config,
      groups: [...(config.groups || []), newGroup],
    });
  };

  const removeGroup = (groupIndex: number) => {
    const updatedGroups = [...config.groups];
    updatedGroups.splice(groupIndex, 1);

    // Ensure first group never has joinOperator
    if (updatedGroups.length > 0) {
      updatedGroups[0].joinOperator = null;
    }

    onChange({ ...config, groups: updatedGroups });
  };

  const updateJoinOperator = (groupIndex: number, value: string) => {
    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex].joinOperator = value;
    onChange({ ...config, groups: updatedGroups });
  };

  const updateGroupLogicalOperator = (groupIndex: number, value: string) => {
    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex].logicalOperator = value;
    onChange({ ...config, groups: updatedGroups });
  };

  /* ---------------- CONDITION FUNCTIONS ---------------- */

  const addCondition = (groupIndex: number) => {
    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex].conditions.push({
      policy_id: null,
      scheme_code: null,
      field_code: null,
      operator: null,
      value: "",
    });

    onChange({ ...config, groups: updatedGroups });
  };

  const updateCondition = (
    groupIndex: number,
    conditionIndex: number,
    field: string,
    value: any,
  ) => {
    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex].conditions[conditionIndex][field] = value;
    onChange({ ...config, groups: updatedGroups });
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const updatedGroups = [...config.groups];
    updatedGroups[groupIndex].conditions.splice(conditionIndex, 1);
    onChange({ ...config, groups: updatedGroups });
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Cascading Configuration</h5>
        <Button
          label="Add Condition Group"
          icon="pi pi-plus"
          type="button"
          onClick={addGroup}
        />
      </div>

      {/* Groups */}
      {config.groups?.map((group: any, groupIndex: number) => (
        <div key={groupIndex}>
          {/* Join Operator (Between Groups) */}
          {groupIndex > 0 && (
            <div className="d-flex justify-content-center my-2">
              <Dropdown
                value={group.joinOperator}
                options={[
                  { label: "AND", value: "AND" },
                  { label: "OR", value: "OR" },
                ]}
                onChange={(e) => updateJoinOperator(groupIndex, e.value)}
              />
            </div>
          )}

          {/* Group Card */}
          <div className="card p-3 border">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Condition Group {groupIndex + 1}</h6>

              <div className="d-flex gap-2 align-items-center">
                {/* Operator inside group */}
                <Dropdown
                  value={group.logicalOperator}
                  options={[
                    { label: "AND", value: "AND" },
                    { label: "OR", value: "OR" },
                  ]}
                  onChange={(e) =>
                    updateGroupLogicalOperator(groupIndex, e.value)
                  }
                />

                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  type="button"
                  onClick={() => removeGroup(groupIndex)}
                />
              </div>
            </div>

            {/* Conditions */}
            {group.conditions.map((condition: any, conditionIndex: number) => {
              const filteredSchemes = schemeOptions.filter(
                (s) => String(s.policy_id) === String(condition.policy_id),
              );

              const selectedScheme = filteredSchemes.find(
                (s) => s.value === condition.scheme_code,
              );

              let fieldOptions: any[] = [];

              if (selectedScheme?.form_structure_json) {
                let schema =
                  typeof selectedScheme.form_structure_json === "string"
                    ? JSON.parse(selectedScheme.form_structure_json)
                    : selectedScheme.form_structure_json;

                if (schema?.sections) {
                  fieldOptions = schema.sections.flatMap((section: any) =>
                    section.fields.map((field: any) => ({
                      label: field.label_override || field.field_code,
                      value: field.field_code,
                    })),
                  );
                }
              }

              return (
                <div key={conditionIndex} className="row mb-3">
                  <div className="col-md-2">
                    <Dropdown
                      className="w-100"
                      value={condition.policy_id}
                      options={policyOptions}
                      placeholder="Policy"
                      onChange={(e) =>
                        updateCondition(
                          groupIndex,
                          conditionIndex,
                          "policy_id",
                          e.value,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <Dropdown
                      className="w-100"
                      value={condition.scheme_code}
                      options={filteredSchemes}
                      placeholder="Scheme"
                      onChange={(e) =>
                        updateCondition(
                          groupIndex,
                          conditionIndex,
                          "scheme_code",
                          e.value,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <Dropdown
                      className="w-100"
                      value={condition.field_code}
                      options={fieldOptions}
                      placeholder="Field"
                      onChange={(e) =>
                        updateCondition(
                          groupIndex,
                          conditionIndex,
                          "field_code",
                          e.value,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <Dropdown
                      className="w-100"
                      value={condition.operator}
                      options={[
                        {
                          label: "Equals",
                          value: "equals",
                        },
                        {
                          label: "Not Equals",
                          value: "not_equals",
                        },
                        {
                          label: "Greater Than",
                          value: "greater_than",
                        },
                        {
                          label: "Less Than",
                          value: "less_than",
                        },
                      ]}
                      placeholder="Operator"
                      onChange={(e) =>
                        updateCondition(
                          groupIndex,
                          conditionIndex,
                          "operator",
                          e.value,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-2">
                    <InputText
                      className="w-100"
                      value={condition.value}
                      placeholder="Value"
                      onChange={(e) =>
                        updateCondition(
                          groupIndex,
                          conditionIndex,
                          "value",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="col-md-1 d-flex align-items-center">
                    <Button
                      icon="pi pi-times"
                      text
                      severity="danger"
                      type="button"
                      onClick={() =>
                        removeCondition(groupIndex, conditionIndex)
                      }
                    />
                  </div>
                </div>
              );
            })}

            <Button
              label="Add Condition"
              icon="pi pi-plus"
              text
              type="button"
              onClick={() => addCondition(groupIndex)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
