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
  useIncentiveTypes,
  useCreateIncentiveType,
  useUpdateIncentiveType,
  useDeleteIncentiveType,
  useToggleIncentiveType,
} from "@/hooks/master/useIncentiveTypes";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface IncentiveType {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const IncentiveTypesMaster = () => {
  const { data = [], isLoading } = useIncentiveTypes();
  const createMutation = useCreateIncentiveType();
  const updateMutation = useUpdateIncentiveType();
  const deleteMutation = useDeleteIncentiveType();
  const toggleMutation = useToggleIncentiveType();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
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
  } = useDataTableManager<IncentiveType>(data);

  /** ---------------- Table Config ---------------- */
  const tableConfig: ReusableDataTableConfig<IncentiveType> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "name",
          header: "Incentive Type Name",
          filterType: "text",
          body: (row) => <strong>{row.name}</strong>,
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
      globalFilterFields: ["name"],
      emptyMessage: "No Incentive Types found.",
    }),
    []
  );

  /** ---------------- Row Actions ---------------- */
  const rowActions: RowAction<IncentiveType>[] = useMemo(
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
      name: formData.name,
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
          detail: "Incentive Type updated",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Incentive Type created",
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

  function handleEdit(row: IncentiveType) {
    setFormData({
      name: row.name,
      effectiveFrom: new Date(row.effectiveFrom),
      effectiveTo: new Date(row.effectiveTo),
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowDialog(true);
  }

  async function handleDelete(row: IncentiveType) {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  }

  async function handleToggle(row: IncentiveType) {
    await toggleMutation.mutateAsync(row.id);
  }

  function resetForm() {
    setFormData({
      name: "",
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
            label="Add Incentive Type"
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
        header={editingId ? "Edit Incentive Type" : "Add Incentive Type"}
        visible={showDialog}
        onHide={() => {
          setShowDialog(false);
          resetForm(); // ✅ reset state
        }}
        modal
        style={{ width: "40vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Incentive Type Name *</label>
            <InputText
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
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
