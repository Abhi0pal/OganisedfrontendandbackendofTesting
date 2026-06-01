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
import { Tooltip } from "primereact/tooltip";

import {useUsers, User, UserType} from "@/hooks/userManagement/useUsers";
import {
  useUserRoleAssignments,
  useCreateUserRoleAssignment,
  useUpdateUserRoleAssignment,
  useDeleteUserRoleAssignment,
  UserRoleAssignment,
} from "@/hooks/userManagement/useUserRoleAssignment";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/userManagement/useRoles";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

/* ------------------------------------------------------------------ */
/* Supporting Interfaces                                              */
/* ------------------------------------------------------------------ */

// interface User {
//   id: number;
//   name: string;
// }

interface Tenant {
  id: number;
  name: string;
}

interface TenantProject {
  id: number;
  name: string;
  tenant_id?: number;
}

const getUserDisplayName = (user: any): string => {
  if (!user) return "";
  if (user.name) return user.name;
  if (user.user_type === UserType.INVESTOR) {
    return `${user.investor_profile?.first_name ?? ""} ${user.investor_profile?.last_name ?? ""}`.trim();
  }
  return user.department_user?.full_name || user.email || user.id;
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function UserRoleAssignmentsPage() {
  const toastRef = useRef<Toast>(null);

  const { data: assignments = [], isLoading } = useUserRoleAssignments();
  const createAssignment = useCreateUserRoleAssignment();
  const updateAssignment = useUpdateUserRoleAssignment();
  const deleteAssignment = useDeleteUserRoleAssignment();

  const { user } = useAuth();
  const { data: roles = [] } = useRoles();

  const {data : users = []} = useUsers();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [projects, setProjects] = useState<TenantProject[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<UserRoleAssignment | null>(null);

  const [formData, setFormData] = useState({
    userId: "",
    roleId: "",
    tenantId: "",
    projectId: "",

    validFrom: "",
    validUntil: "",

    transferOrderNo: "",
    transferReason: "",
    transferredFromId: "",
    remarks: "",
    is_active: true,
  });

  const TRANSFER_REASONS = [
    { label: "Promotion", value: "PROMOTION" },
    { label: "Transfer", value: "TRANSFER" },
    { label: "Deputation", value: "DEPUTATION" },
    { label: "Retirement", value: "RETIREMENT" },
    { label: "Resignation", value: "RESIGNATION" },
    { label: "Administrative Change", value: "ADMIN_CHANGE" },
  ];

  const previousAssignments = useMemo(() => {
    if (!formData.userId) return [];
    return assignments.filter((a) => String(a.user_id) === formData.userId);
  }, [assignments, formData.userId]);

  /* ------------------------------------------------------------------ */
  /* Fetch supporting master data                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const loadMasters = async () => {
      const [t, p] = await Promise.all([
        apiClient.get("/tenants"),
        apiClient.get("/projects"),
      ]);
      
      setTenants(t.data || []);
      setProjects(p.data || []);
    };

    loadMasters();
  }, []);
  const resetForm = useCallback(() => {
    setFormData({
      userId: "",
      roleId: "",
      tenantId: "",
      projectId: "",

      validFrom: "",
      validUntil: "",

      transferOrderNo: "",
      transferReason: "",
      transferredFromId: "",
      remarks: "",
      is_active: true,
    });
    setEditing(null);
  }, []);
  /* ------------------------------------------------------------------ */
  /* Enrich assignment data for searching & display                     */
  /* ------------------------------------------------------------------ */
  type EnrichedUserRoleAssignment = UserRoleAssignment & {
    user_name: string;
    role_name: string;
    tenant_name: string;
    project_name: string;
    valid_from_str: string;
    valid_until_str: string;
  };
  const enrichedData = useMemo<EnrichedUserRoleAssignment[]>(() => {
    return assignments.map((a) => {
      const matchedUser = users.find(
        (u) => u.id === Number(a.user_id)
      );
      return {
        ...a,
        user_name: getUserDisplayName(matchedUser),
        role_name: roles.find((r) => r.id === a.role_id)?.name || "",
        tenant_name: tenants.find((t) => t.id === a.tenant_id)?.name || "",
        project_name: projects.find((p) => p.id === a.project_id)?.name || "",
        valid_from_str: a.valid_from
          ? new Date(a.valid_from).toLocaleDateString()
          : "—",
        valid_until_str: a.valid_until
          ? new Date(a.valid_until).toLocaleDateString()
          : "—",
      };
    });
  }, [assignments, users, roles, tenants, projects]);

  /* ------------------------------------------------------------------ */
  /* Table Manager                                                      */
  /* ------------------------------------------------------------------ */

  const {
    data: tableData,
    filters,
    globalFilter,
    handleFiltersChange,
    handleGlobalFilterChange,
    clearFilters,
  } = useDataTableManager(enrichedData);

  /* ------------------------------------------------------------------ */
  /* Submit Handler                                                     */
  /* ------------------------------------------------------------------ */
  const handleToggleActive = async (
    row: EnrichedUserRoleAssignment,
    nextState: boolean,
  ) => {
    try {
      await updateAssignment.mutateAsync({
        id: row.id,
        data: {
          isActive: nextState,
        },
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: `Assignment ${
          nextState ? "activated" : "deactivated"
        } successfully`,
      });
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to update assignment status",
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedById: number | null =
      editing?.assigned_by != null
        ? Number(editing.assigned_by)
        : user?.id != null
          ? Number(user.id)
          : null;

    const payload = {
      userId: Number(formData.userId),
      roleId: Number(formData.roleId),
      tenantId: Number(formData.tenantId),

      projectId: formData.projectId ? Number(formData.projectId) : null,

      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,

      transferOrderNo: formData.transferOrderNo || null,
      transferReason: formData.transferReason || null,

      transferredFromId: formData.transferredFromId
        ? Number(formData.transferredFromId)
        : null,

      assignedBy: assignedById,

      remarks: formData.remarks || null,
      isActive: formData.is_active,
    };
    try {
      if (editing) {
        await updateAssignment.mutateAsync({
          id: editing.id,
          data: {
            ...payload,
            assignedBy: assignedById,
          },
        });
        toastRef.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "User role assignment updated",
        });
      } else {
        await createAssignment.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Created",
          detail: "User role assigned successfully",
        });
      }

      setShowDialog(false);
      setEditing(null);
      setFormData({
        userId: "",
        roleId: "",
        tenantId: "",
        projectId: "",

        validFrom: "",
        validUntil: "",

        transferOrderNo: "",
        transferReason: "",
        transferredFromId: "",

        remarks: "",
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

  /* ------------------------------------------------------------------ */
  /* Table Config                                                       */
  /* ------------------------------------------------------------------ */

  const tableConfig: ReusableDataTableConfig<EnrichedUserRoleAssignment> = {
    dataKey: "id",
    rows: 10,
    paginator: true,
    stripedRows: true,
    showGridlines: true,
    emptyMessage: "No assignments found",
    columns: [
      { field: "id", header: "ID", filterType: "text", width: "5%" },
      { field: "user_name", header: "User", filterType: "text" },
      { field: "role_name", header: "Role", filterType: "text" },
      { field: "tenant_name", header: "Tenant", filterType: "text" },
      { field: "project_name", header: "Project", filterType: "text" },
      { field: "valid_from_str", header: "Valid From" },
      { field: "valid_until_str", header: "Valid Until" },
      {
        field: "is_active",
        header: "Status",
        filterType: "select",
        filterOptions: [
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ],
        body: (r) => (
          <Tag
            value={r.is_active ? "Active" : "Inactive"}
            severity={r.is_active ? "success" : "danger"}
          />
        ),
      },
    ],
  };
  const rowActions: RowAction<EnrichedUserRoleAssignment>[] = [
    {
      icon: "pi pi-pencil",
      label: "Edit",
      severity: "info",
      tooltip: "Edit Assignment",
      onClick: (row) => {
        setEditing(row);
        setFormData({
          userId: String(row.user_id),
          roleId: String(row.role_id),
          tenantId: String(row.tenant_id),
          projectId: row.project_id ? String(row.project_id) : "",

          validFrom: row.valid_from ? row.valid_from.substring(0, 10) : "",
          validUntil: row.valid_until ? row.valid_until.substring(0, 10) : "",

          transferOrderNo: row.transfer_order_no || "",
          transferReason: row.transfer_reason || "",
          transferredFromId: row.transferred_from_id
            ? String(row.transferred_from_id)
            : "",
          remarks: row.remarks || "",
          is_active: row.is_active,
        });
        setShowDialog(true);
      },
    },

    {
      icon: "pi pi-check",
      label: "Activate",
      severity: "success",
      tooltip: "Activate Assignment",
      visible: (row) => !row.is_active,
      onClick: (row) => handleToggleActive(row, true),
    },

    {
      icon: "pi pi-times",
      label: "Deactivate",
      severity: "warn",
      tooltip: "Deactivate Assignment",
      visible: (row) => row.is_active,
      onClick: (row) => handleToggleActive(row, false),
    },

    {
      icon: "pi pi-trash",
      label: "Delete",
      severity: "error",
      tooltip: "Delete Assignment",
      onClick: (row) => {
        if (!confirm("Delete this assignment?")) return;
        deleteAssignment.mutate(row.id);
      },
    },
  ];

  const filteredProjects = useMemo(() => {
    if (!formData.tenantId) return [];
    return projects.filter((p) => String(p.tenant_id) === formData.tenantId);
  }, [projects, formData.tenantId]);

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">User Role Assignment</h1>
        <Toolbar
          left={
            <Button
              label="Assign Role"
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
        />
      </div>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
      />

      <Dialog
        visible={showDialog}
        header={
          <div className="ey-dialog-title">
            {editing ? "Edit Role" : "Add New Role"}
          </div>
        }
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        modal
        className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
          <div className="row">
            {/* User */}
            <div className="col-md-6 mb-3">
              <label className="form-label">User *</label>
              <select
                required
                className="form-select"
                value={formData.userId}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    userId: e.target.value,
                    transferredFromId: "", // reset on user change
                  }))
                }
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {getUserDisplayName(u)}
                  </option>
                ))}
              </select>
            </div>

            {/* Role */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Role *</label>
              <select
                required
                className="form-select"
                value={formData.roleId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, roleId: e.target.value }))
                }
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tenant */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Tenant *</label>
              <select
                required
                className="form-select"
                value={formData.tenantId}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    tenantId: e.target.value,
                    projectId: "",
                  }))
                }
              >
                <option value="">Select Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Project</label>
              <select
                className="form-select"
                value={formData.projectId}
                disabled={!formData.tenantId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, projectId: e.target.value }))
                }
              >
                <option value="">Select Project</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {!formData.tenantId && (
                <small className="text-muted">Select a tenant first</small>
              )}
            </div>

            {/* Valid From */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Valid From *</label>
              <InputText
                type="date"
                className="form-control"
                required
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, validFrom: e.target.value }))
                }
              />
            </div>

            {/* Valid Until */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Valid Until</label>
              <InputText
                type="date"
                className="form-control"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, validUntil: e.target.value }))
                }
              />
            </div>

            {/* Transfer Reason (ENUM) */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Transfer Reason</label>
              <select
                className="form-select"
                value={formData.transferReason}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, transferReason: e.target.value }))
                }
              >
                <option value="">Select Reason</option>
                {TRANSFER_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer Order No */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Transfer Order No</label>
              <InputText
                className="form-control"
                placeholder="e.g. N9/327/2026"
                value={formData.transferOrderNo}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    transferOrderNo: e.target.value,
                  }))
                }
              />
            </div>

            {/* Transferred From (previous assignments) */}
            <div className="col-md-6 mb-3">
              <label className="form-label d-flex align-items-center gap-2">
                Transferred From
                <i
                  className="pi pi-info-circle text-muted transferred-from-info"
                  data-pr-tooltip="Select a previous assignment of the selected user. This is used to track transfer history."
                  data-pr-position="right"
                  style={{ cursor: "pointer" }}
                />
              </label>

              <select
                className="form-select"
                value={formData.transferredFromId}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    transferredFromId: e.target.value,
                  }))
                }
                disabled={!formData.userId}
              >
                <option value="">Select Previous Assignment</option>
                {previousAssignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Assignment #{a.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Tooltip binding */}
            <Tooltip target=".transferred-from-info" />

            {/* Remarks */}
            <div className="col-md-6 mb-3">
              <label className="form-label">Remarks</label>
              <InputText
                className="form-control"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, remarks: e.target.value }))
                }
              />
            </div>

            {/* Status */}
            <div className="col-md-6 mb-3">
              <label className="form-label d-block">Status</label>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, is_active: e.target.checked }))
                  }
                />
                <label className="form-check-label ms-2">
                  {formData.is_active ? "Active" : "Inactive"}
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-end gap-3 pt-3 border-top">
            <Button
              type="button"
              severity="secondary"
              label="Cancel"
              onClick={() => setShowDialog(false)}
            />
            <Button
              type="submit"
              icon="pi pi-check"
              label={editing ? "Update" : "Create"}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
