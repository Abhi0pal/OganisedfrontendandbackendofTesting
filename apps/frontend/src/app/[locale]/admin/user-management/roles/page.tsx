"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import apiClient from "@/lib/api-client";

import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from "@/hooks/userManagement/useRoles";

import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction, 
} from "@/components/DataTable/types";

/* ------------------------- */
/* Interfaces */
/* ------------------------- */

interface Tenant {
  id: number;
  name: string;
}

interface TenantProject {
  id: number;
  name: string;
  tenant_id?: number;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  description?: string;

  // Relations
  tenant_id?: number;
  parent_id?: number | null;
  project_id?: number;

  // Hierarchy
  level?: number;

  // Status
  is_active: boolean;
  is_system: boolean;

  // Timestamps (match backend response)
  createdAt: string;
  updatedAt: string;

  // Optional relation (for edit/view use cases)
  roleProjects?: {
    project: {
      id: number;
      name?: string;
    };
  }[];
}

/* ------------------------- */
/* Component */
/* ------------------------- */

export default function RolesPage() {
  const toastRef = useRef<Toast>(null);

  const { data: roles = [], isLoading } = useRoles();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [projects, setProjects] = useState<TenantProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<TenantProject[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tenant_id: "",
    parent_id: "",
    project_id: "",
    level: 0,
    is_active: true,
  });

  /* ------------------------- */
  /* Fetch Tenants */
  /* ------------------------- */

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tenantRes, projectRes] = await Promise.all([
          apiClient.get("/tenants"),
          apiClient.get("/projects"),
        ]);

        setTenants(tenantRes.data || []);
        setProjects(projectRes.data || []);
      } catch {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Failed to load tenants or projects",
        });
      }
    };

    fetchInitialData();
  }, []);

  /* ------------------------- */
  /* Parent Role Handler */
  /* ------------------------- */

  const handleParentChange = (parentId: string) => {
    const parentRole = roles.find((r: Role) => r.id === Number(parentId));

    setFormData((prev) => ({
      ...prev,
      parent_id: parentId,
      level: parentRole?.level !== undefined ? parentRole.level + 1 : 0,
    }));
  };

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
  } = useDataTableManager<Role>(roles);

  /* ------------------------- */
  /* Helpers */
  /* ------------------------- */

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      tenant_id: "",
      parent_id: "",
      project_id: "",
      level: 0,
      is_active: true,
    });
    setEditingRole(null);
  }, []);

  /* ------------------------- */
  /* Submit */
  /* ------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      tenant_id: Number(formData.tenant_id),
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
      project_id: formData.project_id ? Number(formData.project_id) : undefined,
      level: formData.level,
      is_active: formData.is_active,
    };

    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          data: payload,
        });
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Role updated successfully",
        });
      } else {
        await createRole.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "Role created successfully",
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
  };

  /* ------------------------- */
  /* Edit / Delete */
  /* ------------------------- */

  const handleEdit = useCallback(
    (role: Role) => {
      setEditingRole(role);

      setFormData({
        name: role.name,
        description: role.description || "",
        tenant_id: role.tenant_id?.toString() || "",
        parent_id: role.parent_id?.toString() || "",
        project_id:
          role.project_id?.toString() ||
          role.roleProjects?.[0]?.project?.id?.toString() ||
          "",
        level: role.level ?? 0,
        is_active: role.is_active ?? true,
      });

      if (role.tenant_id) {
        const tenantProjects = projects.filter(
          (p) => p.tenant_id === role.tenant_id,
        );
        setFilteredProjects(tenantProjects);
      }

      setShowDialog(true);
    },
    [projects],
  );
  const handleToggleRole = async (role: Role) => {
    if (role.is_system) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Not Allowed",
        detail: "System roles cannot be deactivated",
      });
      return;
    }

    try {
      await updateRole.mutateAsync({
        id: role.id,
        data: {
          is_active: !role.is_active,
        },
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: `Role ${role.is_active ? "deactivated" : "activated"} successfully`,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Failed to update role status",
      });
    }
  };
  const handleDelete = useCallback(
    async (role: Role) => {
      if (role.is_system) {
        toastRef.current?.show({
          severity: "warn",
          summary: "Not Allowed",
          detail: "System roles cannot be deleted",
        });
        return;
      }

      if (!confirm(`Are you sure you want to delete ${role.name}?`)) return;

      try {
        await deleteRole.mutateAsync(role.id);
        toastRef.current?.show({
          severity: "success",
          summary: "Deleted",
          detail: "Role deleted successfully",
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.message,
        });
      }
    },
    [deleteRole],
  );

  /* ------------------------- */
  /* Table Config */
  /* ------------------------- */
  const enrichedTableData = useMemo(() => {
    return tableData.map((r) => ({
      ...r,

      tenant_name:
        tenants.find((t: Tenant) => t.id === r.tenant_id)?.name || "",

      project_name:
        projects.find((p: TenantProject) => p.id === r.project_id)?.name || "",

      parent_name: roles.find((pr: Role) => pr.id === r.parent_id)?.name || "",
    }));
  }, [tableData, tenants, projects, roles]);

  const tableConfig: ReusableDataTableConfig<Role> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%" },
        {
          field: "name",
          header: "Role Name",
          filterType: "text",
          width: "10%",
          body: (r) => <span className="font-semibold">{r.name}</span>,
        },
        {
          field: "description",
          header: "Description",
          width: "15%",
          filterType: "text",
          body: (r) => r.description || "-",
        },
        {
          field: "tenant_name",
          header: "Tenant",
          width: "10%",
          filterType: "text",
          body: (r) => {
            const tenant = tenants.find((t: Tenant) => t.id === r.tenant_id);
            return tenant?.name || "-";
          },
        },
        {
          field: "project_name",
          header: "Project",
          width: "10%",
          filterType: "text",
          body: (r) => {
            const project = projects.find(
              (p: TenantProject) => p.id === r.project_id,
            );
            return project?.name || "-";
          },
        },
        {
          field: "parent_name",
          header: "Parent",
          width: "10%",
          filterType: "text",
          body: (r) => {
            const parentRole = roles.find((p: Role) => p.id === r.parent_id);
            return parentRole?.name || "-";
          },
        },
        {
          field: "level",
          header: "Level",
          width: "5%",
          filterType: "text",
          body: (r) => r.level || "0",
        },
        {
          field: "is_system",
          header: "Type",
          width: "10%",
          filterType: "select",
          filterOptions: [
            { label: "System", value: true },
            { label: "Custom", value: false },
          ],
          body: (r) => (
            <Tag
              value={r.is_system ? "System" : "Custom"}
              severity={r.is_system ? "danger" : "info"}
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
        {
          field: "createdAt",
          header: "Created Date",
          width: "10%",
          filterType: "date",
          body: (r) =>
            new Date(r.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
        },
      ],
      dataKey: "id",
      rows: 10,
      paginator: true,
      selectable: true,
      selectionMode: "multiple",
      globalFilterFields: ["name", "description"],
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No roles found.",
    }),
    [tenants],
  );

  /* ------------------------- */
  /* Render */
  /* ------------------------- */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Roles Management</h1>
        <Toolbar
          left={
            <Button
              label="Add Role"
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
      </div>

      <ReusableDataTable
        data={enrichedTableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        rowActions={[
          {
            icon: "pi pi-pencil",
            label: "Edit",
            severity: "info",
            onClick: handleEdit,
            tooltip: "Edit",
          },
          {
            icon: "pi pi-check",
            label: "Activate",
            severity: "success",
            tooltip: "Activate",
            visible: (role: Role) => !role.is_active,
            onClick: (role: Role) => handleToggleRole(role),
          },
          {
            icon: "pi pi-times",
            label: "Deactivate",
            severity: "warn",
            tooltip: "Deactivate",
            visible: (role: Role) => role.is_active && !role.is_system,
            onClick: (role: Role) => handleToggleRole(role),
          },
          {
            icon: "pi pi-trash",
            label: "Delete",
            severity: "error",
            visible: (role: Role) => !role.is_system,
            onClick: handleDelete,
            tooltip: "Delete",
          },
        ]}
      />

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={
          <div className="ey-dialog-title">
            {editingRole ? "Edit Role" : "Add New Role"}
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
              <label className="form-label">Role Name *</label>
              <InputText
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-100 mb-3"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Description</label>
              <InputText
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-100 mb-3"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Tenant *</label>
              <select
                className="form-select mb-3"
                value={formData.tenant_id}
                required
                onChange={(e) => {
                  const tenantId = e.target.value;

                  setFormData((prev) => ({
                    ...prev,
                    tenant_id: tenantId,

                    ...(editingRole
                      ? {}
                      : {
                          parent_id: "",
                          project_id: "",
                          level: 0,
                        }),
                  }));

                  const tenantProjects = projects.filter(
                    (p) => p.tenant_id === Number(tenantId),
                  );

                  setFilteredProjects(tenantProjects);
                }}
              >
                <option value="">Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Project *</label>
              <select
                className="form-select mb-3"
                required
                value={formData.project_id}
                disabled={!formData.tenant_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    project_id: e.target.value,
                  }))
                }
              >
                <option value="">Select Project</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {!formData.tenant_id && (
                <small className="text-muted">Select a tenant first</small>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Parent Role</label>
              <select
                className="form-select mb-3"
                value={formData.parent_id}
                onChange={(e) => handleParentChange(e.target.value)}
              >
                <option value="">None</option>
                {roles
                  .filter((r: Role) => !editingRole || r.id !== editingRole.id)
                  .map((r: Role) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Level</label>
              <InputText
                value={String(formData.level)}
                disabled
                className="w-100 mb-3"
              />
            </div>
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
          </div>

          <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
            <Button type="submit" label={editingRole ? "Update" : "Create"} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
