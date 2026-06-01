"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useRef, useState, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";

import {
  useUnitCategories,
  useCreateUnitCategory,
  useUpdateUnitCategory,
  useDeleteUnitCategory,
  useToggleUnitCategory,
} from "@/hooks/master/useUnitCategories";
import { useMsmeYears } from "@/hooks/master/useMsmeYear";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface UnitCategory {
  id: number;
  name: string;
  msmeYearId: number;
  msmeYearName?: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface MsmeYear {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UnitCategoriesMaster = () => {
  const { data = [], isLoading } = useUnitCategories();
  const { data: msmeYears = [] } = useMsmeYears(); // for MSME Year dropdown
  const createMutation = useCreateUnitCategory();
  const updateMutation = useUpdateUnitCategory();
  const deleteMutation = useDeleteUnitCategory();
  const toggleMutation = useToggleUnitCategory();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    msmeYearId: msmeYears[0]?.id || 0,
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
  } = useDataTableManager<UnitCategory>(data);
  // Map msmeYearName from msmeYears list
  const tableDataWithMsmeYearName = tableData.map((row) => ({
    ...row,
    msmeYearName:
      msmeYears.find((y: MsmeYear) => y.id === row.msmeYearId)?.name || "-",
  }));
  const msmeYearOptions = msmeYears.map((year: MsmeYear) => ({
    label: year.name,
    value: year.id,
  }));

  /** ---------------- Table Config ---------------- */
  const tableConfig: ReusableDataTableConfig<UnitCategory> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "name",
          header: "Unit Category Name",
          filterType: "text",
          body: (row) => <strong>{row.name}</strong>,
        },
        {
          field: "msmeYearName",
          header: "MSME Year",
          filterType: "text",
          body: (row) => row.msmeYearName,
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
            <div className="d-flex align-items-center gap-2">
              {row.isActive ? (
                <>
                  <CheckCircle size={14} style={{ color: '#28a745' }} />
                  <span style={{ color: '#28a745', fontWeight: 600 }}>Active</span>
                </>
              ) : (
                <>
                  <XCircle size={14} style={{ color: '#dc3545' }} />
                  <span style={{ color: '#dc3545', fontWeight: 600 }}>Inactive</span>
                </>
              )}
            </div>
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
      globalFilterFields: ["name", "msmeYearName"],
      emptyMessage: "No Unit Categories found.",
    }),
    []
  );

  /** ---------------- Row Actions ---------------- */
  const rowActions: RowAction<UnitCategory>[] = useMemo(
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
      msmeYearId: Number(formData.msmeYearId),
      effectiveFrom: formData.effectiveFrom
        ? formData.effectiveFrom.toISOString().split("T")[0]
        : "",
      effectiveTo: formData.effectiveTo
        ? formData.effectiveTo.toISOString().split("T")[0]
        : "",
      isActive: formData.isActive,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toastRef.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Unit Category updated",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Unit Category created",
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

  function handleEdit(row: UnitCategory) {
    setFormData({
      name: row.name,
      msmeYearId: row.msmeYearId,
      effectiveFrom: new Date(row.effectiveFrom),
      effectiveTo: new Date(row.effectiveTo),
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowDialog(true);
  }

  async function handleDelete(row: UnitCategory) {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  }

  async function handleToggle(row: UnitCategory) {
    await toggleMutation.mutateAsync(row.id);
  }

  function resetForm() {
    setFormData({
      name: "",
      msmeYearId: msmeYears[0]?.id || 0,
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
            label="Add Unit Category"
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
        header={editingId ? "Edit Unit Category" : "Add Unit Category"}
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
            <label>Unit Category Name *</label>
            <InputText
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label>MSME Year *</label>
            <Dropdown
              name="msmeYearId"
              value={formData.msmeYearId}
              options={msmeYearOptions}
              onChange={(e) =>
                setFormData({ ...formData, msmeYearId: e.value })
              }
              placeholder="Select MSME Year"
              className="w-100"
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
        data={tableDataWithMsmeYearName}
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
