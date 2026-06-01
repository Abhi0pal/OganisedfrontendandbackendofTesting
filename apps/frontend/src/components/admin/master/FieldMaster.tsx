"use client";

import { Tag } from "primereact/tag";
import { useRef, useState, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Database } from "lucide-react";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import {
  useFields,
  useCreateField,
  useUpdateField,
  useDeleteField,
  useToggleField,
  useBulkCreateFields,
} from "@/hooks/master/useFields";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface Field {
  id: number;
  field_code: string;
  field_label: string;
  data_type: string;
  is_active: boolean;
  created_at: string;
}

const DATA_TYPES = [
  { label: "Text", value: "text" },
  { label: "Textarea", value: "textarea" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Time", value: "time" },
  { label: "Date Range", value: "daterange" },
  { label: "Select", value: "select" },
  { label: "Multi Select", value: "multiselect" },
  { label: "Checkbox", value: "checkbox" },
  { label: "Radio", value: "radio" },
  { label: "Email", value: "email" },
  { label: "Password", value: "password" },
  { label: "URL", value: "url" },
];

export const FieldMaster = () => {
  const { data: fields = [], isLoading } = useFields();
  const createMutation = useCreateField();
  const updateMutation = useUpdateField();
  const deleteMutation = useDeleteField();
  const toggleMutation = useToggleField();
  const bulkCreateMutation = useBulkCreateFields();

  const toastRef = useRef<Toast>(null);
  const fileUploadRef = useRef<FileUpload>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    field_code: "",
    field_label: "",
    data_type: "",
    is_active: true,
  });

  // Bulk upload state
  const [bulkFields, setBulkFields] = useState<
    Array<{
      field_code: string;
      field_label: string;
      data_type: string;
      is_active: boolean;
      isDuplicate?: boolean;
    }>
  >([]);
  const [isParsing, setIsParsing] = useState(false);

  // Get existing field codes for duplicate detection
  const existingFieldCodes = useMemo(() => {
    return new Set((fields as Field[]).map((f) => f.field_code.toUpperCase()));
  }, [fields]);

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Field>(fields);

  const tableConfig: ReusableDataTableConfig<Field> = useMemo(
    () => ({
      columns: [
        {
          field: "field_code",
          header: "Field Code",
          width: "20%",
          filterType: "text",
        },
        {
          field: "field_label",
          header: "Field Label",
          width: "30%",
          filterType: "text",
          body: (row) => (
            <span className="font-semibold">{row.field_label}</span>
          ),
        },
        {
          field: "data_type",
          header: "Data Type",
          width: "15%",
          filterType: "text",
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              <Database size={14} style={{ color: '#ffc107' }} />
              <span style={{ color: '#ffc107', fontWeight: 500 }}>
                {row.data_type}
              </span>
            </div>
          ),
        },
        {
          field: "is_active",
          header: "Status",
          width: "15%",
          filterType: "select",
          filterOptions: [
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ],
          body: (row) => (
            <Tag
              value={row.is_active ? "Active" : "Inactive"}
              severity={row.is_active ? "success" : "danger"}
            />
          ),
        },
        {
          field: "created_at",
          header: "Created",
          width: "20%",
          filterType: "date",
          body: (row) => new Date(row.created_at).toLocaleDateString(),
        },
      ],
      dataKey: "id",
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ["field_code", "field_label"],
      selectable: true,
      selectionMode: "multiple",
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No fields found.",
    }),
    [],
  );

  const rowActions: RowAction<Field>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: (field) => handleEdit(field),
        tooltip: "Edit",
      },
      {
        icon: "pi pi-check",
        label: "Toggle",
        severity: "success",
        onClick: (field) => handleToggle(field),
        tooltip: "Toggle Status",
        visible: (field) => !field.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: (field) => handleToggle(field),
        tooltip: "Deactivate",
        visible: (field) => field.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: (field) => handleDelete(field),
        tooltip: "Delete",
      },
    ],
    [],
  );

  // Helper function to convert text to snake_case code
  const toSnakeCase = useCallback((text: string): string => {
    return text
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_"); // Replace spaces with underscores
  }, []);

  const handleInputChange = useCallback(
    (e: any) => {
      const { name, value, type, checked } = e.target || e;
      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };
        // Auto-generate field_code from field_label
        if (name === "field_label" && !editingId) {
          updated.field_code = toSnakeCase(value);
        }
        return updated;
      });
    },
    [editingId, toSnakeCase],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const submitData = {
          // id: editingId || uuidv4(),
          field_code: formData.field_code,
          field_label: formData.field_label,
          data_type: formData.data_type,
          is_active: formData.is_active,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Field updated successfully",
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Field created successfully",
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: err.response?.data?.message || "Error saving field",
        });
      }
    },
    [formData, editingId, createMutation, updateMutation],
  );

  const handleEdit = useCallback((field: Field) => {
    setFormData({
      field_code: field.field_code,
      field_label: field.field_label,
      data_type: field.data_type,
      is_active: field.is_active,
    });
    setEditingId(field.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (field: Field) => {
      if (confirm(`Are you sure you want to delete ${field.field_label}?`)) {
        try {
          await deleteMutation.mutateAsync(field.id);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Field deleted successfully",
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error deleting field",
          });
        }
      }
    },
    [deleteMutation],
  );

  const handleToggle = useCallback(
    async (field: Field) => {
      try {
        await toggleMutation.mutateAsync(field.id);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Field ${field.is_active ? "deactivated" : "activated"} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error updating field status",
        });
      }
    },
    [toggleMutation],
  );

  const resetForm = useCallback(() => {
    setFormData({
      field_code: "",
      field_label: "",
      data_type: "",
      is_active: true,
    });
    setEditingId(null);
  }, []);

  const leftToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label="Add Field"
          icon="pi pi-plus"
          severity="success"
          onClick={() => {
            resetForm();
            setShowDialog(true);
          }}
        />
        <Button
          label="Bulk Upload"
          icon="pi pi-upload"
          severity="info"
          outlined
          onClick={() => {
            setBulkFields([]);
            setShowBulkDialog(true);
          }}
        />
      </div>
    ),
    [resetForm],
  );

  // CSV parsing function
  const parseCSV = useCallback(
    (csvText: string) => {
      setIsParsing(true);

      // Use setTimeout to allow UI to update with loading state
      setTimeout(() => {
        try {
          const lines = csvText.trim().split("\n");
          if (lines.length < 2) {
            toastRef.current?.show({
              severity: "error",
              summary: "Error",
              detail: "CSV must have header row and at least one data row",
            });
            setIsParsing(false);
            return;
          }

          const headerRow = lines[0].toLowerCase();
          const headers = headerRow.split(",").map((h) => h.trim());

          // Find column indexes
          const labelIndex = headers.findIndex(
            (h) => h.includes("label") || h.includes("name"),
          );
          const codeIndex = headers.findIndex((h) => h.includes("code"));
          const typeIndex = headers.findIndex(
            (h) => h.includes("type") || h.includes("datatype"),
          );

          if (labelIndex === -1) {
            toastRef.current?.show({
              severity: "error",
              summary: "Error",
              detail: 'CSV must have a "label" or "name" column',
            });
            setIsParsing(false);
            return;
          }

          const parsedFields: Array<{
            field_code: string;
            field_label: string;
            data_type: string;
            is_active: boolean;
            isDuplicate?: boolean;
          }> = [];
          const seenCodes = new Set<string>();
          let duplicateCount = 0;

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
              .split(",")
              .map((v) => v.trim().replace(/^"|"$/g, ""));
            if (values.length === 0 || !values[labelIndex]) continue;

            const label = values[labelIndex];
            const code =
              codeIndex !== -1 && values[codeIndex]
                ? values[codeIndex]
                    .toUpperCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^A-Z0-9_]/g, "")
                : label
                    .toUpperCase()
                    .replace(/\s+/g, "_")
                    .replace(/[^A-Z0-9_]/g, "");
            const dataType =
              typeIndex !== -1 && values[typeIndex]
                ? values[typeIndex].toLowerCase()
                : "string";

            // Validate data type
            const validTypes = [
              "text",
              "textarea",
              "number",
              "boolean",
              "date",
              "time",
              "daterange",
              "select",
              "multiselect",
              "checkbox",
              "radio",
              "email",
              "password",
              "url",
            ];
            const finalType = validTypes.includes(dataType) ? dataType : "text";

            // Check for duplicates in existing fields or already parsed
            const isDuplicate =
              existingFieldCodes.has(code) || seenCodes.has(code);
            if (isDuplicate) {
              duplicateCount++;
            }
            seenCodes.add(code);

            // Only add non-duplicate fields
            if (!isDuplicate) {
              parsedFields.push({
                field_code: code,
                field_label: label,
                data_type: finalType,
                is_active: true,
              });
            }
          }

          if (parsedFields.length === 0 && duplicateCount === 0) {
            toastRef.current?.show({
              severity: "error",
              summary: "Error",
              detail: "No valid fields found in CSV",
            });
            setIsParsing(false);
            return;
          }

          setBulkFields(parsedFields);

          if (duplicateCount > 0) {
            toastRef.current?.show({
              severity: "warn",
              summary: "Duplicates Skipped",
              detail: `Parsed ${parsedFields.length} fields, skipped ${duplicateCount} duplicates`,
              life: 5000,
            });
          } else {
            toastRef.current?.show({
              severity: "success",
              summary: "Success",
              detail: `Parsed ${parsedFields.length} fields from CSV`,
            });
          }
        } catch (error) {
          toastRef.current?.show({
            severity: "error",
            summary: "Parse Error",
            detail: "Failed to parse CSV file",
          });
        } finally {
          setIsParsing(false);
        }
      }, 100);
    },
    [existingFieldCodes],
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: FileUploadSelectEvent) => {
      const file = event.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          parseCSV(text);
        };
        reader.readAsText(file);
      }
      // Clear the file upload after selection
      setTimeout(() => {
        fileUploadRef.current?.clear();
      }, 100);
    },
    [parseCSV],
  );

  // Handle bulk import
  const handleBulkImport = useCallback(async () => {
    if (bulkFields.length === 0) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Warning",
        detail: "No fields to import",
      });
      return;
    }

    try {
      const result = await bulkCreateMutation.mutateAsync(bulkFields);
      toastRef.current?.show({
        severity: result.created > 0 ? "success" : "warn",
        summary: "Import Complete",
        detail: `Created: ${result.created}, Skipped: ${result.skipped}`,
        life: 5000,
      });

      if (result.errors && result.errors.length > 0) {
        console.warn("Bulk import errors:", result.errors);
      }

      setShowBulkDialog(false);
      setBulkFields([]);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Error importing fields",
      });
    }
  }, [bulkFields, bulkCreateMutation]);

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange("");
            handleFiltersChange({});
          }}
        />
      </div>
    ),
    [clearFilters, handleGlobalFilterChange, handleFiltersChange],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Field Master</h1>
        <p className="text-muted mb-3">
          Define reusable fields. Component type, validation, and lookup
          settings are configured in Scheme Definition.
        </p>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Field" : "Add New Field"}
        modal
        style={{ width: "500px" }}
        breakpoints={{ "640px": "95vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="field_label" className="form-label">
              Field Label *
            </label>
            <InputText
              id="field_label"
              name="field_label"
              value={formData.field_label}
              onChange={handleInputChange}
              placeholder="e.g., First Name"
              className="w-100"
              required
            />
            <small className="text-muted">
              Enter the display name for this field
            </small>
          </div>

          <div className="mb-3">
            <label htmlFor="field_code" className="form-label">
              Field Code *{" "}
              {!editingId && (
                <span className="text-muted">(Auto-generated)</span>
              )}
            </label>
            <InputText
              id="field_code"
              name="field_code"
              value={formData.field_code}
              onChange={handleInputChange}
              placeholder="e.g., FIRST_NAME"
              className="w-100"
              required
              readOnly={!editingId}
              style={!editingId ? { backgroundColor: "#f8f9fa" } : {}}
            />
            <small className="text-muted">
              Unique identifier (uppercase with underscores)
            </small>
          </div>

          <div className="mb-4">
            <label htmlFor="data_type" className="form-label">
              Data Type *
            </label>
            <Dropdown
              id="data_type"
              name="data_type"
              value={formData.data_type}
              options={DATA_TYPES}
              onChange={(e) =>
                handleInputChange({
                  target: { name: "data_type", value: e.value },
                })
              }
              placeholder="Select Data Type"
              className="w-100"
            />
            <small className="text-muted">
              The type of data this field will store
            </small>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              type="button"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label={editingId ? "Update" : "Create"}
              icon="pi pi-check"
              severity="success"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        rowActions={rowActions}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
      />

      {/* Bulk Upload Dialog */}
      <Dialog
        visible={showBulkDialog}
        onHide={() => setShowBulkDialog(false)}
        header="Bulk Upload Fields"
        modal
        style={{ width: "800px" }}
        breakpoints={{ "960px": "90vw" }}
      >
        {/* Loading Overlay */}
        {isParsing && (
          <div
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(255,255,255,0.8)", zIndex: 10 }}
          >
            <div className="text-center">
              <i
                className="pi pi-spin pi-spinner"
                style={{ fontSize: "2rem", color: "#3B82F6" }}
              ></i>
              <p className="mt-2 mb-0 fw-semibold">Parsing CSV...</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <h6 className="mb-2">Upload CSV File</h6>
          <p className="text-muted small mb-3">
            CSV should have columns: <code>field_label</code> (required),{" "}
            <code>field_code</code> (optional), <code>data_type</code>{" "}
            (optional). Supported types: string, number, boolean, date, array,
            object.
            <br />
            <strong>Note:</strong> Existing fields will be automatically
            skipped.
          </p>
          <FileUpload
            ref={fileUploadRef}
            mode="basic"
            accept=".csv"
            maxFileSize={1000000}
            auto
            customUpload
            uploadHandler={() => {}}
            onSelect={handleFileSelect}
            chooseLabel={isParsing ? "Parsing..." : "Choose CSV"}
            className="mb-3"
            disabled={isParsing}
          />
          <div className="p-2 border rounded bg-light mb-3">
            <small className="fw-semibold">Example CSV:</small>
            <pre className="mb-0 mt-1" style={{ fontSize: "12px" }}>
              {`field_label,field_code,data_type
First Name,FIRST_NAME,string
Date of Birth,DOB,date
Age,AGE,number`}
            </pre>
          </div>
        </div>

        {bulkFields.length > 0 && (
          <div className="mb-4">
            <h6 className="mb-2">Preview ({bulkFields.length} fields)</h6>
            <DataTable
              value={bulkFields}
              size="small"
              scrollable
              scrollHeight="300px"
              stripedRows
            >
              <Column field="field_label" header="Label" />
              <Column field="field_code" header="Code" />
              <Column
                field="data_type"
                header="Type"
                body={(row) => (
                  <div className="d-flex align-items-center gap-2">
                    <Database size={14} style={{ color: '#ffc107' }} />
                    <span style={{ color: '#ffc107', fontWeight: 500 }}>
                      {row.data_type}
                    </span>
                  </div>
                )}
              />
            </DataTable>
          </div>
        )}

        <div className="d-flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            type="button"
            onClick={() => setShowBulkDialog(false)}
          />
          <Button
            label={`Import ${bulkFields.length} Fields`}
            icon="pi pi-upload"
            severity="success"
            type="button"
            disabled={bulkFields.length === 0}
            loading={bulkCreateMutation.isPending}
            onClick={handleBulkImport}
          />
        </div>
      </Dialog>
    </div>
  );
};
