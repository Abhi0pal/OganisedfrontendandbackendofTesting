"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import apiClient from "@/lib/api-client";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import {
  usePermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from "@/hooks/userManagement/usePermissions";

import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

/* ------------------------- */
/* Types */
/* ------------------------- */

export interface Permission {
  id: number;
  module_id: number;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  module?: {
    id: number;
    code: string;
    name: string;
  };
}

/* ------------------------- */
/* Constants */
/* ------------------------- */

const ACTION_OPTIONS = [
  { label: "Create", value: "CREATE" },
  { label: "Read", value: "READ" },
  { label: "Update", value: "UPDATE" },
  { label: "Delete", value: "DELETE" },
  { label: "Manage", value: "MANAGE" },
];

/* ------------------------- */
/* Component */
/* ------------------------- */

export default function PermissionsPage() {
  const toastRef = useRef<Toast>(null);

  const { data: permissions = [], isLoading } = usePermissions();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  const [modules, setModules] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<Permission | null>(null);

  const [formData, setFormData] = useState({
    module_id: "",
    action: "",
    description: "",
    is_active: true,
  });

  /* ------------------------- */
  /* Fetch Modules */
  /* ------------------------- */

  useEffect(() => {
    apiClient.get("/modules").then((res) => setModules(res.data || []));
  }, []);

  /* ------------------------- */
  /* DataTable Manager */
  /* ------------------------- */

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Permission>(permissions);

  /* ------------------------- */
  /* Handlers */
  /* ------------------------- */

  const resetForm = () => {
    setFormData({
      module_id: "",
      action: "",
      description: "",
      is_active: true,
    });
    setEditingPermission(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      module_id: Number(formData.module_id),
      action: formData.action,
      description: formData.description || undefined,
      is_active: formData.is_active,
    };

    try {
      if (editingPermission) {
        await updatePermission.mutateAsync({
          id: editingPermission.id,
          data: payload,
        });
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Permission updated successfully",
        });
      } else {
        await createPermission.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Permission created successfully",
        });
      }
      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Operation failed",
      });
    }
  };

  const handleToggle = useCallback(
    async (permission: Permission) => {
      await updatePermission.mutateAsync({
        id: permission.id,
        data: { is_active: !permission.is_active },
      });
    },
    [updatePermission],
  );

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      module_id: permission.module_id.toString(),
      action: permission.action,
      description: permission.description || "",
      is_active: permission.is_active,
    });
    setShowDialog(true);
  };

  const handleDelete = async (permission: Permission) => {
    if (!confirm(`Delete permission ${permission.action}?`)) return;
    await deletePermission.mutateAsync(permission.id);
  };

  /* ------------------------- */
  /* Table Config */
  /* ------------------------- */

  const tableConfig: ReusableDataTableConfig<Permission> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "6%", filterType: "none" },
        {
          field: "module_id",
          header: "Module",
          width: "20%",
          filterType: "text",
          body: (row) => row.module?.name || "-",
        },
        {
          field: "action",
          header: "Action",
          width: "10%",
          filterType: "select",
          filterOptions: ACTION_OPTIONS,
          body: (row) => <b>{row.action}</b>,
        },
        {
          field: "description",
          header: "Description",
          width: "30%",
          filterType: "text",
          body: (row) => row.description || "-",
        },
        {
          field: "is_active",
          header: "Status",
          width: "8%",
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
          header: "Created Date",
          width: "12%",
          filterType: "date",
          body: (row) =>
            new Date(row.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
        },
      ],
      dataKey: "id",
      rows: 10,
      paginator: true,
      stripedRows: true,
      selectable: true,
      selectionMode: "multiple",
      globalFilterFields: ["action", "description"],
      showGridlines: true,
      emptyMessage: "No permissions found.",
    }),
    [],
  );

  /* ------------------------- */
  /* Row Actions*/
  /* ------------------------- */

  const rowActions: RowAction<Permission>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: handleEdit,
      },
      {
        icon: "pi pi-check",
        label: "Activate",
        severity: "success",
        onClick: handleToggle,
        visible: (p) => !p.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: handleToggle,
        visible: (p) => p.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: handleDelete,
      },
    ],
    [handleDelete, handleEdit, handleToggle],
  );

  /* ------------------------- */
  /* Render */
  /* ------------------------- */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <Toolbar
        left={
          <Button
            label="Add Permission"
            icon="pi pi-plus"
            severity="success"
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
            outlined
            onClick={() => {
              clearFilters();
              handleGlobalFilterChange("");
              handleFiltersChange({});
            }}
          />
        }
        className="mb-3"
      />

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        rowActions={rowActions}
      />

      {/* Dialog */}
      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={
          <div className="ey-dialog-title">
            {editingPermission ? "Edit Permission" : "Add Permission"}
          </div>
        }
        modal
        className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Module *</label>
              <select
                className="form-select"
                required
                value={formData.module_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, module_id: e.target.value }))
                }
              >
                <option value="">Select Module</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Action *</label>
              <select
                className="form-select"
                required
                value={formData.action}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, action: e.target.value }))
                }
              >
                <option value="">Select Action</option>
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Description</label>
              <InputText
                className="w-100"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>

            {/* Active toggle  */}
            <div className="mb-4">
  <div className="form-check">
    <input
      id="permission_is_active"
      className="form-check-input"
      type="checkbox"
      checked={formData.is_active}
      onChange={(e) =>
        setFormData((prev) => ({
          ...prev,
          is_active: e.target.checked,
        }))
      }
      style={{
        width: "1.25em",
        height: "1.25em",
        cursor: "pointer",
        accentColor: "#22c55e",
      }}
    />
    <label
      className="form-check-label"
      htmlFor="permission_is_active"
      style={{
        marginLeft: "0.5rem",
        color: formData.is_active ? "#22c55e" : "inherit",
        fontWeight: formData.is_active ? 600 : 400,
      }}
    >
      Active
    </label>
  </div>

  {/* Force green like Tenant */}
  <style>{`
    #permission_is_active {
      accent-color: #22c55e !important;
    }
    #permission_is_active:checked {
      background-color: #22c55e !important;
      border-color: #22c55e !important;
    }
  `}</style>
</div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
            <Button label={editingPermission ? "Update" : "Create"} type="submit" />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
