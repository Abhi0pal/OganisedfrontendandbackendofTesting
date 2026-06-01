"use client";

import { useMemo, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";
import { Checkbox } from "primereact/checkbox";
import { Tag } from "primereact/tag";
import { InputNumber } from "primereact/inputnumber";
import { MultiSelect } from "primereact/multiselect";

import { useDocumentTypes } from "@/hooks/master/useDocumentTypes";
import { useDocumentMasters } from "@/hooks/master/useDocumentMasters";
import { useDocumentCheckpoints } from "@/hooks/master/useDocumentCheckpoints";

/* -------------------- TYPES -------------------- */

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

const DOCUMENT_TYPES = [
  { label: "PDF", value: "pdf" },
  { label: "JPG", value: "jpg" },
  { label: "PNG", value: "png" },
  { label: "DOC", value: "doc" },
  { label: "DOCX", value: "docx" },
];

/* -------------------- CONDITION EDITOR --------------------
   Reusable condition UI used for:
   - Document Type visibility
   - Document (Checklist) visibility
   - Checkpoint visibility
------------------------------------------------------------ */

const ConditionEditor = ({
  condition,
  availableFields,
  onChange,
  onRemove,
}: {
  condition?: FieldCondition;
  availableFields: { label: string; value: string }[];
  onChange: (condition: FieldCondition | undefined) => void;
  onRemove: () => void;
}) => {
  const [fieldSearch] = useState("");

  const filteredFields = useMemo(() => {
    if (!fieldSearch) return availableFields;
    return availableFields.filter((f) => {
      const label = (f.label || "").toLowerCase();
      const value = (f.value || "").toLowerCase();
      return (
        label.includes(fieldSearch.toLowerCase()) ||
        value.includes(fieldSearch.toLowerCase())
      );
    });
  }, [availableFields, fieldSearch]);

  // No condition added yet → show "Add Condition" CTA
  if (!condition) {
    return (
      <Button
        label="Add Condition"
        icon="pi pi-plus"
        size="small"
        severity="secondary"
        outlined
        className="ms-auto"
        type="button"
        onClick={() =>
          onChange({ field_code: "", operator: "equals", value: "" })
        }
      />
    );
  }

  return (
    <div className="p-2 border rounded" style={{ backgroundColor: "#e3f2fd" }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="fw-semibold">Show when:</small>
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

      <div className="row g-2">
        <div className="col-md-4">
          <Dropdown
            value={condition.field_code}
            options={filteredFields}
            placeholder="Field"
            className="w-100"
            onChange={(e) => onChange({ ...condition, field_code: e.value })}
          />
        </div>

        <div className="col-md-4">
          <Dropdown
            value={condition.operator}
            options={CONDITION_OPERATORS}
            placeholder="Operator"
            className="w-100"
            onChange={(e) => onChange({ ...condition, operator: e.value })}
          />
        </div>

        <div className="col-md-4">
          <InputText
            value={condition.value?.toString() || ""}
            placeholder="Value"
            className="w-100"
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

/* -------------------- REQUIRED DOCUMENT BUILDER --------------------
   Allows configuration of:
   - Document Types
   - Documents (Checklists) under each type
   - Checkpoints under each document
   Each level supports optional conditional rendering
------------------------------------------------------------------- */

export const RequiredDocumentsBuilder = ({
  value,
  onChange,
  availableFields,
}: any) => {
  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: documentMasters = [] } = useDocumentMasters();
  const { data: allCheckpoints = [] } = useDocumentCheckpoints();

  /* ---------- Lookups ---------- */
  const removeDocumentType = (ti: number) => {
    const next = [...value.document_types];
    next.splice(ti, 1);
    onChange({ document_types: next });
  };

  const removeDocument = (ti: number, di: number) => {
    const next = [...value.document_types];
    next[ti].documents.splice(di, 1);
    onChange({ document_types: next });
  };

  const documentMastersByType = useMemo(() => {
    const map = new Map<number, any[]>();
    documentMasters.forEach((d: any) => {
      if (!d.documentTypeId) return;
      if (!map.has(d.documentTypeId)) map.set(d.documentTypeId, []);
      map.get(d.documentTypeId)!.push(d);
    });
    return map;
  }, [documentMasters]);

  /* ---------- Mutators ---------- */

  const updateType = (i: number, patch: any) => {
    const next = [...value.document_types];
    next[i] = { ...next[i], ...patch };
    onChange({ document_types: next });
  };

  const updateDoc = (ti: number, di: number, patch: any) => {
    const next = [...value.document_types];
    next[ti].documents[di] = {
      ...next[ti].documents[di],
      ...patch,
    };
    onChange({ document_types: next });
  };

  const updateCheckpoint = (ti: number, di: number, ci: number, patch: any) => {
    const next = [...value.document_types];
    next[ti].documents[di].checkpoints[ci] = {
      ...next[ti].documents[di].checkpoints[ci],
      ...patch,
    };
    onChange({ document_types: next });
  };

  /* ---------- Adders ---------- */

  const addDocumentType = () =>
    onChange({
      document_types: [
        ...value.document_types,
        {
          document_type_id: null,
          document_type_name: null,
          is_required: true,
          comment: "",
          conditions: [], // ⬅ condition to control visibility of entire document type
          documents: [],
        },
      ],
    });

  const addDocument = (ti: number) => {
    const next = [...value.document_types];
    next[ti].documents.push({
      document_id: null,
      document_name: null,
      is_required: true,
      max_size_mb: 5,
      allowed_types: [],
      comment: "",
      conditions: [], // ⬅ condition to control visibility of this checklist document
      checkpoints: [],
    });
    onChange({ document_types: next });
  };
  const checkpointOptions = useMemo(
    () =>
      allCheckpoints.map((cp: any) => ({
        label: cp.name,
        value: cp.id,
      })),
    [allCheckpoints],
  );

  /* ---------- UI ---------- */

  return (
    <div className="d-flex flex-column gap-4">
      <div className="d-flex justify-content-between">
        <h5>Required Documents</h5>
        <Button
          label="Add Document Type"
          icon="pi pi-plus"
          onClick={addDocumentType}
        />
      </div>

      {value.document_types.map((type: any, ti: number) => {
        const docsForType =
          documentMastersByType.get(type.document_type_id) ?? [];

        return (
          <div key={ti} className="card p-3">
            {/* ================= DOCUMENT TYPE =================
               Represents a logical grouping (e.g. Identity Proof)
               Condition here controls visibility of ALL documents inside
            --------------------------------------------------- */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Document Type</h6>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                onClick={() => removeDocumentType(ti)}
              />
            </div>

            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Document Type</label>
                <Dropdown
                  value={type.document_type_id}
                  options={documentTypes.map((d: any) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                  className="w-100"
                  placeholder="Select Document Type"
                  onChange={(e) =>
                    updateType(ti, {
                      document_type_id: e.value,
                      document_type_name: documentTypes.find(
                        (d: any) => d.id === e.value,
                      )?.name,
                      documents: [],
                    })
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Comment</label>
                <InputText
                  value={type.comment}
                  className="w-100"
                  placeholder="Please provide the comment"
                  onChange={(e) => updateType(ti, { comment: e.target.value })}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Show Beside Field</label>
                <Dropdown
                  value={type.show_beside_field}
                  options={availableFields}
                  className="w-100"
                  placeholder="Select Form Field"
                  onChange={(e) =>
                    updateType(ti, { show_beside_field: e.value })
                  }
                />
              </div>

              <div className="col-md-3">
                <label className="form-label d-block">Is Required</label>
                <Checkbox
                  checked={type.is_required}
                  onChange={(e) => updateType(ti, { is_required: e.checked })}
                />
              </div>
            </div>

            <Divider />

            {/* -------- Document Type Conditional Rendering -------- */}
            <div className="col-md-12 mt-3">
              <label className="form-label small fw-semibold">
                Conditional Rendering
              </label>

              <ConditionEditor
                condition={type.conditions?.[0]}
                availableFields={availableFields}
                onChange={(cond) =>
                  updateType(ti, { conditions: cond ? [cond] : [] })
                }
                onRemove={() => updateType(ti, { conditions: [] })}
              />

              {type.conditions?.length > 0 && (
                <Tag
                  value="Conditional"
                  severity="warning"
                  icon="pi pi-eye"
                  className="mt-2"
                />
              )}
            </div>

            <Divider />

            <Button
              label="Add Document"
              size="small"
              icon="pi pi-plus"
              className="ms-auto"
              onClick={() => addDocument(ti)}
            />

            {/* ================= DOCUMENT CHECKLIST =================
               Individual document under a document type
               Condition here controls visibility of THIS document only
            -------------------------------------------------------- */}
            {type.documents.map((doc: any, di: number) => (
              <div key={di} className="border rounded p-3 mt-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Document Checklist</strong>
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    onClick={() => removeDocument(ti, di)}
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Document</label>
                    <Dropdown
                      value={doc.document_id}
                      options={docsForType.map((d: any) => ({
                        label: d.checklistDocumentName,
                        value: d.id,
                      }))}
                      className="w-100"
                      placeholder="Select Document Checklist"
                      onChange={(e) =>
                        updateDoc(ti, di, {
                          document_id: e.value,
                          document_name: docsForType.find(
                            (d: any) => d.id === e.value,
                          )?.checklistDocumentName,
                        })
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Max Size (MB)</label>
                    <InputNumber
                      value={doc.max_size_mb}
                      min={1}
                      max={50}
                      className="w-100"
                      onValueChange={(e) =>
                        updateDoc(ti, di, { max_size_mb: e.value })
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Allowed Types</label>
                    <MultiSelect
                      value={doc.allowed_types}
                      options={DOCUMENT_TYPES}
                      display="chip"
                      className="w-100"
                      onChange={(e) =>
                        updateDoc(ti, di, { allowed_types: e.value })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label d-block">Is Required</label>
                    <Checkbox
                      checked={doc.is_required}
                      onChange={(e) =>
                        updateDoc(ti, di, { is_required: e.checked })
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Comment</label>
                    <InputText
                      value={doc.comment}
                      className="w-100"
                      placeholder="Please provide the comment"
                      onChange={(e) =>
                        updateDoc(ti, di, { comment: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Show Beside Field</label>
                    <Dropdown
                      value={doc.show_beside_field}
                      options={availableFields}
                      className="w-100"
                      placeholder="Select Form Field"
                      onChange={(e) =>
                        updateDoc(ti, di, { show_beside_field: e.value })
                      }
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Checkpoints
                    </label>
                    <MultiSelect
                      value={doc.checkpoints?.map((c: any) => c.id) || []}
                      options={checkpointOptions}
                      placeholder="Select Checkpoints"
                      display="chip"
                      className="w-100"
                      onChange={(e) =>
                        updateDoc(ti, di, {
                          checkpoints: allCheckpoints
                            .filter((cp: any) => e.value.includes(cp.id))
                            .map((cp: any) => ({
                              id: cp.id,
                              name: cp.name,
                            })),
                        })
                      }
                    />
                  </div>
                </div>

                <Divider />

                {/* -------- Document Checklist Conditional Rendering -------- */}
                <div className="col-md-12 mt-3">
                  <label className="form-label small fw-semibold">
                    Conditional Rendering
                  </label>

                  <ConditionEditor
                    condition={doc.conditions?.[0]}
                    availableFields={availableFields}
                    onChange={(cond) =>
                      updateDoc(ti, di, { conditions: cond ? [cond] : [] })
                    }
                    onRemove={() => updateDoc(ti, di, { conditions: [] })}
                  />

                  {doc.conditions?.length > 0 && (
                    <Tag
                      value="Conditional"
                      severity="warning"
                      icon="pi pi-eye"
                      className="mt-2"
                    />
                  )}
                </div>

                <Divider />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
