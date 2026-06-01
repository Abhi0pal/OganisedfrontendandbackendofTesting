"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { Toolbar } from "primereact/toolbar";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { useRoles, Role } from "@/hooks/userManagement/useRoles";

import {
  useRolePermissions,
  useUpdateRolePermission,
  useDeleteRolePermission,
  RolePermission,
  PermissionEffect,
} from "@/hooks/userManagement/useRolePermissions";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";
import { Dialog } from "primereact/dialog";
import { InputSwitch } from "primereact/inputswitch";
import { useCreateRolePermission } from "@/hooks/userManagement/useRolePermissions";
import apiClient from "@/lib/api-client";

export default function RolePermissionPage() {
  const toastRef = useRef<Toast>(null);

  const { data: rolePermissions = [], isLoading } = useRolePermissions();
  const updateRolePermission = useUpdateRolePermission();
  const deleteRolePermission = useDeleteRolePermission();

  const [moduleMap, setModuleMap] = useState<Record<string, string>>({});

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const createRolePermission = useCreateRolePermission();
  const [editingRolePermission, setEditingRolePermission] =
    useState<RolePermission | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const { data: roles = [] } = useRoles();

  const [formData, setFormData] = useState({
    role_id: null as number | null,
    permission_id: null as number | null,
    effect: "ALLOW" as PermissionEffect,
    is_active: true,
  });

  const [permissions, setPermissions] = useState<
    { label: string; value: number }[]
  >([]);
  /* -------------------------
     Filter by Role
  ------------------------- */

  const filteredData = useMemo(() => {
    if (!selectedRoleId) return rolePermissions;
    return rolePermissions.filter((rp) => rp.role_id === selectedRoleId);
  }, [rolePermissions, selectedRoleId]);

  const roleOptions = useMemo(
    () =>
      roles.map((role: Role) => ({
        label: role.name,
        value: role.id,
      })),
    [roles],
  );
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await apiClient.get("/modules");

        // Normalize response shape
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        const map: Record<number, string> = {};
        data.forEach((m: any) => {
          map[m.id] = m.name; // ✅ id → module name
        });

        setModuleMap(map);
      } catch (err) {
        console.error("Failed to fetch modules", err);
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load modules",
        });
      }
    };

    fetchModules();
  }, []);

  /* -------------------------
     Handlers
  ------------------------- */

  const toggleActive = async (rp: RolePermission) => {
    try {
      await updateRolePermission.mutateAsync({
        id: rp.id,
        data: { is_active: !rp.is_active },
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Updated",
        detail: `Permission ${rp.is_active ? "deactivated" : "activated"}`,
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update permission",
      });
    }
  };

  const toggleEffect = async (rp: RolePermission) => {
    const next: PermissionEffect = rp.effect === "ALLOW" ? "DENY" : "ALLOW";

    try {
      await updateRolePermission.mutateAsync({
        id: rp.id,
        data: { effect: next },
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Updated",
        detail: `Effect changed to ${next}`,
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to change effect",
      });
    }
  };
  const handleEditRolePermission = (rp: RolePermission) => {
    setEditingRolePermission(rp);

    setFormData({
      role_id: rp.role_id,
      permission_id: rp.permission_id,
      effect: rp.effect,
      is_active: rp.is_active,
    });

    setShowDialog(true);
  };
  const handleDelete = async (rp: RolePermission) => {
    if (!confirm("Delete this role-permission?")) return;

    await deleteRolePermission.mutateAsync(rp.id);
  };
  useEffect(() => {
    if (Object.keys(moduleMap).length === 0) return; // ⛔ wait for modules

    const fetchPermissions = async () => {
      try {
        const res = await apiClient.get("/permissions");

        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

        setPermissions(
          data.map((p: any) => ({
            value: p.id,
            label: `${moduleMap[String(p.module_id)]} - ${p.action}`,
          })),
        );
      } catch (err) {
        console.error("Failed to fetch permissions", err);
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load permissions",
        });
      }
    };

    fetchPermissions();
  }, [moduleMap]); // ✅ DEPENDENCY IS THE KEY
  const handleSubmitRolePermission = async () => {
    if (!formData.role_id || !formData.permission_id) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Role and Permission are required",
      });
      return;
    }

    try {
      if (editingRolePermission) {
        // ✅ UPDATE
        await updateRolePermission.mutateAsync({
          id: editingRolePermission.id,
          data: {
            effect: formData.effect,
            is_active: formData.is_active,
          },
        });

        toastRef.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Role permission updated successfully",
        });
      } else {
        await createRolePermission.mutateAsync({
          role_id: formData.role_id,
          permission_id: formData.permission_id,
          effect: formData.effect,
          is_active: formData.is_active,
        });

        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "Role permission created successfully",
        });
      }

      setShowDialog(false);
      setEditingRolePermission(null);
      setFormData({
        role_id: null,
        permission_id: null,
        effect: "ALLOW",
        is_active: true,
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Operation failed",
      });
    }
  };
  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<RolePermission>(rolePermissions);

  const handleCreate = async () => {
    if (!formData.role_id || !formData.permission_id) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Role and Permission are required",
      });
      return;
    }

    try {
      await createRolePermission.mutateAsync({
        role_id: formData.role_id,
        permission_id: formData.permission_id,
        effect: formData.effect,
        is_active: formData.is_active,
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Created",
        detail: "Role permission created successfully",
      });

      setShowDialog(false);
      setFormData({
        role_id: null,
        permission_id: null,
        effect: "ALLOW",
        is_active: true,
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to create role permission",
      });
    }
  };
  /* -------------------------
     Table Config
  ------------------------- */
  const permissionLabelMap = useMemo(() => {
    const map: Record<string, string> = {};

    permissions.forEach((p) => {
      map[String(p.value)] = p.label;
    });

    return map;
  }, [permissions]);

  const enrichedData = useMemo(() => {
    return filteredData.map((rp) => ({
      ...rp,

      permission_label: permissionLabelMap[String(rp.permission_id)] ?? "",

      role_name: rp.role?.name ?? "",
    }));
  }, [filteredData, permissionLabelMap]);

  const tableConfig: ReusableDataTableConfig<RolePermission> = {
    dataKey: "id",
    rows: 10,
    paginator: true,
    stripedRows: true,
    showGridlines: true,
    emptyMessage: "No role-permissions found",
    columns: [
      {
        field: "role_name",
        header: "Role",
        filterType: "text",
        body: (rp) => rp.role?.name ?? "-",
      },
      {
        field: "permission_label",
        header: "Permission",
        filterType: "text",
      },
      {
        field: "effect",
        header: "Effect",
        filterType: "select",
        filterOptions: [
          { label: "ALLOW", value: "ALLOW" },
          { label: "DENY", value: "DENY" },
        ],
        body: (rp) => (
          <Tag
            value={rp.effect}
            severity={rp.effect === "ALLOW" ? "success" : "danger"}
          />
        ),
      },
      {
        field: "is_active",
        header: "Status",
        width: "10%",
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
    ],
  };

  const rowActions: RowAction<RolePermission>[] = [
    {
      icon: "pi pi-pencil",
      label: "Edit",
      severity: "info",
      tooltip: "Edit",
      onClick: handleEditRolePermission, // ✅ correct handler
    },
    {
      icon: "pi pi-check",
      label: "Toggle Active",
      severity: "warn",
      tooltip: "Activate / Deactivate",
      onClick: toggleActive, // ✅ expects RolePermission
    },
    {
      icon: "pi pi-arrows-h",
      label: "Toggle Effect",
      severity: "secondary",
      tooltip: "Allow / Deny",
      onClick: toggleEffect, // ✅ expects RolePermission
    },
    {
      icon: "pi pi-trash",
      label: "Delete",
      severity: "error",
      tooltip: "Delete",
      onClick: handleDelete, // ✅ expects RolePermission
    },
  ];
  /* -------------------------
     Render
  ------------------------- */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4">
        <h1 className="h2 mb-3">Roles Permission Management</h1>
        <Toolbar
          left={
            <Button
              label="Add Role Permission"
              icon="pi pi-plus"
              severity="success"
              onClick={() => setShowDialog(true)}
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
      </div>

      <ReusableDataTable
        data={enrichedData}
        config={tableConfig}
        loading={isLoading}
        rowActions={rowActions}
      />
      <Dialog
        header={
          <div className="ey-dialog-title">
            {editingRolePermission
              ? "Edit Role Permission"
              : "Add New Role Permission"}
          </div>
        }
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
        modal
      >
        <form onSubmit={handleSubmitRolePermission} className="text-sm">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Role *</label>

              <select
                className="form-select mb-3"
                value={formData.role_id ?? ""}
                disabled={!!editingRolePermission}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    role_id: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                required
              >
                <option value="">Select Role</option>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Permission */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Permission *</label>

              <select
                className="form-select mb-3"
                value={formData.permission_id ?? ""}
                disabled={!!editingRolePermission}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    permission_id: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                required
              >
                <option value="">Select Permission</option>
                {permissions.map((perm) => (
                  <option key={perm.value} value={perm.value}>
                    {perm.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Effect */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Effect</label>

              <select
                className="form-select mb-3"
                value={formData.effect}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    effect: e.target.value as "ALLOW" | "DENY",
                  }))
                }
              >
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
            </div>

            {/* Status */}
            <div className="col-md-6 mb-3">
              <label className="form-label d-block">Status</label>

              <div className="form-check">
                <input
                  type="checkbox"
                  id="is_active"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  style={{
                    width: "1.2rem",
                    height: "1.2rem",
                    cursor: "pointer",
                  }}
                />

                <label
                  htmlFor="is_active"
                  className="form-check-label"
                  style={{
                    marginLeft: "8px",
                    fontWeight: 500,
                    color: formData.is_active ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formData.is_active ? "Active" : "Inactive"}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">
              <Button
                label="Cancel"
                severity="secondary"
                onClick={() => setShowDialog(false)}
              />
              <Button
                type="submit"
                label={editingRolePermission ? "Update" : "Create"}
              />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
