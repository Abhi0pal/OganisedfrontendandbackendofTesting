"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";

import {
  useMappingRegionCategories,
  useCreateMappingRegionCategory,
  useDeleteMappingRegionCategory,
  useToggleMappingRegionCategory,
} from "@/hooks/master/useMappingRegionCategories";

import { useBlocks } from "@/hooks/master/useBlocks";
import { useRegionCategories } from "@/hooks/master/useRegionCategories";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

/** ---------------- Types ---------------- */
interface Block {
  id: number;
  name: string;
}

interface RegionCategory {
  id: number;
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  blockMappings: { blockId: number; blockName: string }[];
}

interface RegionCategoryMapping {
  id: number;
  block: Block;
  regionCategory: RegionCategory;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
}

/** ---------------- Component ---------------- */
export const MappingRegionCategoriesMaster = () => {
  const { data = [], isLoading } = useMappingRegionCategories();
  const { data: blocks = [] } = useBlocks();
  const { data: regionCategories = [] } = useRegionCategories();

  const createMutation = useCreateMappingRegionCategory();
  const deleteMutation = useDeleteMappingRegionCategory();
  const toggleMutation = useToggleMappingRegionCategory();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null
  );

  const [formData, setFormData] = useState({
    regionCategoryId: null as number | null,
    effectiveFrom: null as Date | null,
    effectiveTo: null as Date | null,
    isActive: true,
    selectedBlocks: [] as number[],
  });

  /** ---------------- Transform API Data ---------------- */
  /** ---------------- Transform API Data ---------------- */
  const tableData: RegionCategory[] = useMemo(() => {
    const map: Record<number, RegionCategory> = {};

    (data as RegionCategoryMapping[]).forEach((m) => {
      const cat = m.regionCategory;

      if (!map[cat.id]) {
        map[cat.id] = {
          ...cat,
          blockMappings: [],
          isActive: m.isActive, // initialize from the first mapping
        };
      } else {
        // update isActive: true if any mapping is active
        map[cat.id].isActive = map[cat.id].isActive || m.isActive;
      }

      map[cat.id].blockMappings.push({
        blockId: m.block.id,
        blockName: m.block.name,
      });
    });

    return Object.values(map);
  }, [data]);

  /** ---------------- DataTable Manager ---------------- */
  const {
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<RegionCategory>(tableData);

  /** ---------------- Table Config ---------------- */
  const tableConfig: ReusableDataTableConfig<RegionCategory> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%" },
        {
          field: "name",
          header: "Category",
          body: (row) => <strong>{row.name}</strong>,
        },
        {
          field: "blockMappings",
          header: "Mapped Blocks",
          body: (row) => row.blockMappings.map((d) => d.blockName).join(", "),
        },
        {
          field: "isActive",
          header: "Status",
          body: (row) => (
            <Tag
              value={row.isActive ? "Active" : "Inactive"}
              severity={row.isActive ? "success" : "danger"}
            />
          ),
        },
      ],
      dataKey: "id",
      rows: 10,
      paginator: true,
    }),
    []
  );

  /** ---------------- Row Actions ---------------- */
  const rowActions: RowAction<RegionCategory>[] = [
    { icon: "pi pi-pencil", label: "Edit", onClick: handleEdit },
    { icon: "pi pi-check", label: "Toggle", onClick: handleToggle },
    { icon: "pi pi-trash", label: "Delete", onClick: handleDelete },
  ];

  /** ---------------- Submit ---------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // 🔥 Edit = delete old mappings first
      if (editingCategoryId) {
        const rowsToDelete = (data as RegionCategoryMapping[]).filter(
          (d) => d.regionCategory.id === editingCategoryId
        );

        for (const row of rowsToDelete) {
          await deleteMutation.mutateAsync(row.id);
        }
      }

      // 🔥 Create one row per Region
      for (const blockId of formData.selectedBlocks) {
        await createMutation.mutateAsync({
          blockId,
          regionCategoryId: formData.regionCategoryId!,
          effectiveFrom: formData.effectiveFrom!.toISOString().split("T")[0],
          effectiveTo: formData.effectiveTo!.toISOString().split("T")[0],
          isActive: formData.isActive,
        });
      }

      resetForm();
      setShowDialog(false);

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Mappings saved successfully",
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to save mappings",
      });
    }
  }

  /** ---------------- Helpers ---------------- */
  function handleEdit(row: RegionCategory) {
    setFormData({
      regionCategoryId: row.id,
      effectiveFrom: new Date(row.effectiveFrom),
      effectiveTo: new Date(row.effectiveTo),
      isActive: row.isActive,
      selectedBlocks: row.blockMappings.map((d) => d.blockId),
    });
    setEditingCategoryId(row.id);
    setShowDialog(true);
  }

  async function handleDelete(row: RegionCategory) {
    if (confirm(`Delete all mappings for ${row.name}?`)) {
      const rows = (data as RegionCategoryMapping[]).filter(
        (d) => d.regionCategory.id === row.id
      );
      for (const r of rows) {
        await deleteMutation.mutateAsync(r.id);
      }
    }
  }

  async function handleToggle(row: RegionCategory) {
    await toggleMutation.mutateAsync(row.id); // category id
  }

  function resetForm() {
    setFormData({
      regionCategoryId: null,
      effectiveFrom: null,
      effectiveTo: null,
      isActive: true,
      selectedBlocks: [],
    });
    setEditingCategoryId(null);
  }

  /** ---------------- UI ---------------- */
  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <Toolbar
        left={
          <Button
            label="Add Mapping"
            icon="pi pi-plus"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
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
        header={editingCategoryId ? "Edit Mapping" : "Add Mapping"}
        visible={showDialog}
        modal
        style={{ width: "50vw" }}
        onHide={() => {
          setShowDialog(false);
          resetForm();
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="font-medium block mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <Dropdown
              value={formData.regionCategoryId}
              options={regionCategories.map((c: any) => ({
                label: c.name,
                value: c.id,
              }))}
              onChange={(e) =>
                setFormData({ ...formData, regionCategoryId: e.value })
              }
              placeholder="Select Category"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label className="font-medium block mb-1">
              Blocks <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              value={formData.selectedBlocks}
              options={blocks.map((d: any) => ({
                label: d.name,
                value: d.id,
              }))}
              onChange={(e) =>
                setFormData({ ...formData, selectedBlocks: e.value })
              }
              display="chip"
              placeholder="Select Blocks"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label className="font-medium block mb-1">
              Effective From <span className="text-red-500">*</span>
            </label>
            <Calendar
              value={formData.effectiveFrom}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  effectiveFrom: e.value as Date | null,
                })
              }
              dateFormat="yy-mm-dd"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label className="font-medium block mb-1">
              Effective To <span className="text-red-500">*</span>
            </label>
            <Calendar
              value={formData.effectiveTo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  effectiveTo: e.value as Date | null,
                })
              }
              dateFormat="yy-mm-dd"
              className="w-100"
              required
            />
          </div>

          <Button type="submit" label="Save" />
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
