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
  useSubSectors,
  useCreateSubSector,
  useUpdateSubSector,
  useDeleteSubSector,
  useToggleSubSector,
} from "@/hooks/master/useSubSectors";
import { useSectors } from "@/hooks/master/useSectors";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface SubSector {
  id: number;
  name: string;
  sectorId: number;
  sector?: {
    id: number;
    name: string;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  sectorName?: string; // derived field
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SubSectorsMaster = () => {
  const { data = [], isLoading } = useSubSectors();
  const { data: sectors = [] } = useSectors(); // parent sectors
  const createMutation = useCreateSubSector();
  const updateMutation = useUpdateSubSector();
  const deleteMutation = useDeleteSubSector();
  const toggleMutation = useToggleSubSector();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sectorId: null as number | null,
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
  } = useDataTableManager<SubSector>(data);
  const tableDataWithSectorName = tableData.map((row) => ({
    ...row,
    sectorName: row.sector?.name || "-",
  }));

  /** ---------------- Table Config ---------------- */
  const tableConfig: ReusableDataTableConfig<SubSector> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "name",
          header: "Sub-Sector Name",
          filterType: "text",
          body: (row) => <strong>{row.name}</strong>,
        },
        {
          field: "sectorName",
          header: "Sector",
          filterType: "text",
          body: (row) => row.sectorName,
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
      globalFilterFields: ["name", "sectorName"],
      emptyMessage: "No Sub-Sectors found.",
    }),
    []
  );

  /** ---------------- Row Actions ---------------- */
  const rowActions: RowAction<SubSector>[] = useMemo(
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
      sectorId: formData.sectorId!, // assert it's not null
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
          detail: "Sub-Sector updated",
        });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Sub-Sector created",
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

  function handleEdit(row: SubSector) {
    setFormData({
      name: row.name,
      sectorId: row.sectorId,
      effectiveFrom: new Date(row.effectiveFrom),
      effectiveTo: new Date(row.effectiveTo),
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowDialog(true);
  }

  async function handleDelete(row: SubSector) {
    if (confirm(`Delete ${row.name}?`)) {
      await deleteMutation.mutateAsync(row.id);
    }
  }

  async function handleToggle(row: SubSector) {
    await toggleMutation.mutateAsync(row.id);
  }

  function resetForm() {
    setFormData({
      name: "",
      sectorId: null,
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
            label="Add Sub-Sector"
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
        header={editingId ? "Edit Sub-Sector" : "Add Sub-Sector"}
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
            <label>Sub-Sector Name *</label>
            <InputText
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label>Sector *</label>
            <Dropdown
              name="sectorId"
              value={formData.sectorId}
              options={sectors.map((s: any) => ({
                label: s.name,
                value: s.id,
              }))}
              onChange={handleInputChange}
              placeholder="Select a Sector"
              optionLabel="label"
              optionValue="value"
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
        data={tableDataWithSectorName}
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
