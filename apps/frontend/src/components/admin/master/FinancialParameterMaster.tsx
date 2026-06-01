"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";

import {
  useFinancialParameters,
  useCreateFinancialParameter,
  useUpdateFinancialParameter,
  useDeleteFinancialParameter,
  useToggleFinancialParameter,
} from "@/hooks/master/useFinancialParameter";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface FinancialParameter {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit?: string;
  dataType?: string;
  isCalculable: boolean;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FinancialParametersMaster = () => {
  const { data = [], isLoading } = useFinancialParameters();
  const createMutation = useCreateFinancialParameter();
  const updateMutation = useUpdateFinancialParameter();
  const deleteMutation = useDeleteFinancialParameter();
  const toggleMutation = useToggleFinancialParameter();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    unit: "",
    dataType: "",
    isCalculable: true,
    effectiveFrom: null as Date | null,
    effectiveTo: null as Date | null,
    isActive: true,
  });

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<FinancialParameter>(data);

  /** ---------------- Table Config ---------------- */
  const tableConfig: ReusableDataTableConfig<FinancialParameter> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        { field: "code", header: "Code", filterType: "text" },
        {
          field: "name",
          header: "Name",
          filterType: "text",
          body: (row) => <strong>{row.name}</strong>,
        },
        { field: "description", header: "Description", filterType: "text" },
        { field: "unit", header: "Unit", filterType: "text" },
        { field: "dataType", header: "Data Type", filterType: "text" },
        {
          field: "isCalculable",
          header: "Calculable",
          filterType: "select",
          filterOptions: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
          body: (row) => (
            <Tag
              value={row.isCalculable ? "Yes" : "No"}
              severity={row.isCalculable ? "success" : "danger"}
            />
          ),
        },
        {
          field: "effectiveFrom",
          header: "Effective From",
          filterType: "date",
          body: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
        },
        {
          field: "effectiveTo",
          header: "Effective To",
          filterType: "date",
          body: (row) => new Date(row.effectiveTo).toLocaleDateString(),
        },
        {
          field: "isActive",
          header: "Status",
          filterType: "select",
          filterOptions: [
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ],
          body: (row) => (
            <Tag
              value={row.isActive ? "Active" : "Inactive"}
              severity={row.isActive ? "success" : "danger"}
            />
          ),
        },
        {
          field: "createdAt",
          header: "Created On",
          filterType: "date",
          body: (row) => new Date(row.createdAt).toLocaleDateString(),
        },
      ],
      dataKey: "id",
      rows: 10,
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      globalFilterFields: ["code", "name"],
      emptyMessage: "No Financial Parameters found.",
    }),
    []
  );

  /** ---------------- Row Actions ---------------- */
  const rowActions: RowAction<FinancialParameter>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: handleEdit,
      },
      {
        icon: "pi pi-check",
        label: "Toggle Status",
        severity: "success",
        onClick: handleToggle,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: handleDelete,
      },
    ],
    []
  );

  /** ---------------- Handlers ---------------- */
  function handleInputChange(e: any) {
    const { name, value, checked, type } = e.target || e;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      code: formData.code,
      name: formData.name,
      description: formData.description,
      unit: formData.unit,
      dataType: formData.dataType,
      isCalculable: formData.isCalculable,
      effectiveFrom: formData.effectiveFrom?.toISOString().split("T")[0] || "",
      effectiveTo: formData.effectiveTo?.toISOString().split("T")[0] || "",
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toastRef.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Financial Parameter updated",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Financial Parameter created",
        });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Operation failed",
      });
    }
  }

  function handleEdit(row: FinancialParameter) {
    setFormData({
      code: row.code,
      name: row.name,
      description: row.description || "",
      unit: row.unit || "",
      dataType: row.dataType || "",
      isCalculable: row.isCalculable,
      effectiveFrom: new Date(row.effectiveFrom),
      effectiveTo: new Date(row.effectiveTo),
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowDialog(true);
  }

  async function handleDelete(row: FinancialParameter) {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  }

  async function handleToggle(row: FinancialParameter) {
    await toggleMutation.mutateAsync(row.id);
  }

  function resetForm() {
    setFormData({
      code: "",
      name: "",
      description: "",
      unit: "",
      dataType: "",
      isCalculable: true,
      effectiveFrom: null,
      effectiveTo: null,
      isActive: true,
    });
    setEditingId(null);
  }

  /** ---------------- UI ---------------- */
  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <Toolbar
        left={
          <Button
            label="Add Financial Parameter"
            icon="pi pi-plus"
            onClick={() => setShowDialog(true)}
          />
        }
        right={
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            onClick={clearFilters}
          />
        }
      />

      <Dialog
        header={
          editingId ? "Edit Financial Parameter" : "Add Financial Parameter"
        }
        visible={showDialog}
        onHide={() => {
          setShowDialog(false);
          resetForm(); // ✅ reset state
        }}
        modal
        style={{ width: "50vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Code *</label>
            <InputText
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Name *</label>
            <InputText
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Description</label>
            <InputText
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label>Unit</label>
            <InputText
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label>Data Type</label>
            <InputText
              name="dataType"
              value={formData.dataType}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              name="isCalculable"
              checked={formData.isCalculable}
              onChange={handleInputChange}
            />
            <label className="form-check-label">Calculable</label>
          </div>
          <div className="mb-3">
            <label>Effective From *</label>
            <Calendar
              name="effectiveFrom"
              value={formData.effectiveFrom}
              onChange={handleInputChange}
              dateFormat="yy-mm-dd"
              required
            />
          </div>
          <div className="mb-3">
            <label>Effective To *</label>
            <Calendar
              name="effectiveTo"
              value={formData.effectiveTo}
              onChange={handleInputChange}
              dateFormat="yy-mm-dd"
              required
            />
          </div>
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
            />
            <label className="form-check-label">Active</label>
          </div>
          <Button type="submit" label={editingId ? "Update" : "Create"} />
        </form>
      </Dialog>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
      />
    </div>
  );
};
