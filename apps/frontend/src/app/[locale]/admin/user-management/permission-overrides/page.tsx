"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import apiClient from "@/lib/api-client";
import {
  useCreateUserAssignmentPermissionOverride,
  useDeleteUserAssignmentPermissionOverride,
  useUpdateUserAssignmentPermissionOverride,
  useUserAssignmentPermissionOverrides,
} from "@/hooks/userManagement/useUserAssignmentPermissionOverrides";

import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import { ReusableDataTableConfig, RowAction } from "@/components/DataTable/types";

type AssignmentRow = {
  id: number;
  user_id: string | number;
  role_id: number;
  valid_from?: string | null;
  valid_until?: string | null;
  transfer_order_no?: string | null;
  assignment_identifier?: string | null;
  updated_at?: string | null;
};

type AssignmentOption = {
  value: string;
  label: string;
};

type PermissionOption = {
  value: string;
  label: string;
};

const buildAssignmentIdentifier = (
  id?: number | null,
  roleId?: number | null,
  transferOrderNo?: string | null,
) => {
  if (id == null) return "";
  const safeRoleId = roleId != null && Number.isFinite(roleId) ? String(roleId) : "NA";
  const safeTransferOrderNo =
    transferOrderNo && transferOrderNo.trim().length > 0
      ? transferOrderNo.trim()
      : "NA";

  return `ASG-${id}-${safeRoleId}-TO-${safeTransferOrderNo}`;
};

const toTime = (value?: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const pickLatestOpenAssignmentsByUser = (rows: AssignmentRow[]): AssignmentRow[] => {
  const openRows = rows.filter((row) => row.valid_until == null);
  const latestByUser = new Map<string, AssignmentRow>();

  openRows.forEach((row) => {
    const userKey = String(row.user_id ?? "");
    if (!userKey) return;

    const existing = latestByUser.get(userKey);
    if (!existing) {
      latestByUser.set(userKey, row);
      return;
    }

    const nextValidFrom = toTime(row.valid_from);
    const currentValidFrom = toTime(existing.valid_from);

    if (nextValidFrom > currentValidFrom) {
      latestByUser.set(userKey, row);
      return;
    }

    if (nextValidFrom === currentValidFrom) {
      const nextUpdatedAt = toTime(row.updated_at);
      const currentUpdatedAt = toTime(existing.updated_at);

      if (nextUpdatedAt > currentUpdatedAt) {
        latestByUser.set(userKey, row);
        return;
      }

      if (nextUpdatedAt === currentUpdatedAt && Number(row.id) > Number(existing.id)) {
        latestByUser.set(userKey, row);
      }
    }
  });

  return Array.from(latestByUser.values()).sort((a, b) => Number(a.id) - Number(b.id));
};

export default function PermissionOverridesPage() {
  const toastRef = useRef<Toast>(null);

  const { data = [], isLoading } = useUserAssignmentPermissionOverrides();
  const createOverride = useCreateUserAssignmentPermissionOverride();
  const updateOverride = useUpdateUserAssignmentPermissionOverride();
  const deleteOverride = useDeleteUserAssignmentPermissionOverride();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [assignmentOptions, setAssignmentOptions] = useState<AssignmentOption[]>([]);
  const [permissionOptions, setPermissionOptions] = useState<PermissionOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [formData, setFormData] = useState<{
    assignment_id: string;
    permission_id: string;
    effect: "ALLOW" | "DENY";
    reason: string;
    is_active: boolean;
  }>({
    assignment_id: "",
    permission_id: "",
    effect: "ALLOW",
    reason: "",
    is_active: true,
  });

  const { data: tableData, filters, globalFilter, handleGlobalFilterChange, handleFiltersChange, clearFilters } =
    useDataTableManager(data);

  const assignmentSelectOptions = useMemo(() => {
    if (!formData.assignment_id.trim()) return assignmentOptions;
    if (assignmentOptions.some((option) => option.value === formData.assignment_id)) {
      return assignmentOptions;
    }

    return [
      { value: formData.assignment_id, label: formData.assignment_id },
      ...assignmentOptions,
    ];
  }, [assignmentOptions, formData.assignment_id]);

  const permissionSelectOptions = useMemo(() => {
    if (!formData.permission_id.trim()) return permissionOptions;
    if (permissionOptions.some((option) => option.value === formData.permission_id)) {
      return permissionOptions;
    }

    return [
      { value: formData.permission_id, label: `Permission ${formData.permission_id}` },
      ...permissionOptions,
    ];
  }, [permissionOptions, formData.permission_id]);

  const loadFormOptions = useCallback(async () => {
    try {
      setOptionsLoading(true);

      const [assignmentsRes, permissionsRes, usersRes] = await Promise.all([
        apiClient.get("/user-role-assignments"),
        apiClient.get("/permissions", { params: { skip: 0, take: 1000 } }),
        apiClient.get("/users"),
      ]);

      const assignmentRows: AssignmentRow[] = Array.isArray(assignmentsRes.data)
        ? assignmentsRes.data
        : [];
      const latestOpenAssignments = pickLatestOpenAssignmentsByUser(assignmentRows);

      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const userNameMap = new Map<number, string>();
      users.forEach((user: any) => {
        const name = user.name || `${user.investor_profile?.first_name || ''} ${user.investor_profile?.last_name || ''}`.trim() || user.department_user?.full_name || `User ${user.id}`;
        userNameMap.set(Number(user.id), name);
      });

      const normalizedAssignments = latestOpenAssignments.map((assignment) => {
        const identifier =
          assignment.assignment_identifier ||
          buildAssignmentIdentifier(
            Number(assignment.id),
            Number(assignment.role_id),
            assignment.transfer_order_no,
          );

        const userName = userNameMap.get(Number(assignment.user_id)) || `User ${assignment.user_id}`;

        return {
          value: identifier,
          label: `${identifier} | USER-${userName}`,
        };
      });
      setAssignmentOptions(normalizedAssignments);

      const permissionRows = Array.isArray(permissionsRes?.data?.data)
        ? permissionsRes.data.data
        : [];
      const normalizedPermissions = permissionRows.map((permission: any) => ({
        value: String(permission.id),
        label: `P-${permission.id} | ${permission.action} | M-${permission.module_id}`,
      }));
      setPermissionOptions(normalizedPermissions);
    } catch (error) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load assignment/permission options",
      });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showDialog) return;
    void loadFormOptions();
  }, [showDialog, loadFormOptions]);

  const resetForm = () => {
    setFormData({
      assignment_id: "",
      permission_id: "",
      effect: "ALLOW",
      reason: "",
      is_active: true,
    });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assignment_id || !formData.permission_id) {
      toastRef.current?.show({
        severity: "warn",
        summary: "Validation",
        detail: "Assignment and Permission are required",
      });
      return;
    }

    try {
      if (editing) {
        await updateOverride.mutateAsync({
          id: editing.id,
          data: {
            effect: formData.effect,
            reason: formData.reason || undefined,
            is_active: formData.is_active,
          },
        });
      } else {
        await createOverride.mutateAsync({
          assignment_id: formData.assignment_id.trim(),
          permission_id: Number(formData.permission_id),
          effect: formData.effect,
          reason: formData.reason || undefined,
          is_active: formData.is_active,
        });
      }

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: editing ? "Override updated" : "Override created",
      });

      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          error?.response?.data?.message ||
          "Operation failed. Please verify selected assignment is latest open role for that user.",
      });
    }
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setFormData({
      assignment_id: String(row.assignment_id),
      permission_id: String(row.permission_id),
      effect: row.effect,
      reason: row.reason || "",
      is_active: row.is_active,
    });
    setShowDialog(true);
  };

  const handleToggle = useCallback(
    async (row: any) => {
      await updateOverride.mutateAsync({
        id: row.id,
        data: { is_active: !row.is_active },
      });
    },
    [updateOverride],
  );

  const handleDelete = async (row: any) => {
    if (!window.confirm("Delete this override?")) return;
    await deleteOverride.mutateAsync(row.id);
  };

  const tableConfig: ReusableDataTableConfig<any> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "assignment_id",
          header: "Assignment ID",
          width: "20%",
          filterType: "text",
          body: (r) =>
            r.assignment_id ||
            r.assignment_identifier ||
            r.assignment?.assignment_identifier ||
            buildAssignmentIdentifier(
              r.assignment?.id,
              r.assignment?.role_id,
              r.assignment?.transfer_order_no,
            ) ||
            `ASG-${r.assignment_id}`,
        },
        {
          field: "permission_id",
          header: "Permission",
          width: "14%",
          filterType: "text",
          body: (r) =>
            r.permission
              ? `P-${r.permission.id} | ${r.permission.action}`
              : `P-${r.permission_id}`,
        },
        {
          field: "effect",
          header: "Effect",
          width: "8%",
          filterType: "select",
          filterOptions: [
            { label: "ALLOW", value: "ALLOW" },
            { label: "DENY", value: "DENY" },
          ],
          body: (r) => <b>{r.effect}</b>,
        },
        {
          field: "reason",
          header: "Reason",
          width: "20%",
          body: (r) => (
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "block",
              }}
              title={r.reason}
            >
              {r.reason || "-"}
            </span>
          ),
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
          body: (r) => (
            <Tag
              value={r.is_active ? "Active" : "Inactive"}
              severity={r.is_active ? "success" : "danger"}
            />
          ),
        },
        {
          field: "created_at",
          header: "Created Date",
          width: "12%",
          filterType: "date",
          body: (r) =>
            new Date(r.created_at).toLocaleDateString("en-US", {
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
      showGridlines: true,
      emptyMessage: "No overrides found.",
    }),
    [],
  );

  const rowActions: RowAction<any>[] = [
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
      visible: (row) => !row.is_active,
    },
    {
      icon: "pi pi-times",
      label: "Deactivate",
      severity: "warn",
      onClick: handleToggle,
      visible: (row) => row.is_active,
    },
    {
      icon: "pi pi-trash",
      label: "Delete",
      severity: "error",
      onClick: handleDelete,
    },
  ];

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mb-4">
        <h1 className="h2 mb-3">User Assignment Override</h1>
        <Toolbar
          left={
            <Button
              label="Add Override"
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
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        rowActions={rowActions}
      />

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header= {
          <div className="ey-dialog-title">
        {editing ? "Edit Override" : "Add Override"}
        </div>
        }
        modal
         className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="alert alert-info py-2 mb-3">
            Assignment list only shows latest role assignment per user where <b>valid_until = null</b>.
          </div>

          <div className="row">
            <div className="col-md-12 mb-3">
              <label>Assignment (ID-Role-Transfer) *</label>
              <select
                className="form-select"
                value={formData.assignment_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, assignment_id: e.target.value }))
                }
                required
                disabled={!!editing || optionsLoading}
              >
                <option value="">
                  {optionsLoading ? "Loading assignments..." : "Select Assignment"}
                </option>
                {assignmentSelectOptions.map((option) => (
                  <option key={`assignment-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-12 mb-3">
              <label>Permission *</label>
              <select
                className="form-select"
                value={formData.permission_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, permission_id: e.target.value }))
                }
                required
                disabled={!!editing || optionsLoading}
              >
                <option value="">
                  {optionsLoading ? "Loading permissions..." : "Select Permission"}
                </option>
                {permissionSelectOptions.map((option) => (
                  <option key={`permission-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label>Effect</label>
              <select
                className="form-select"
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

            <div className="col-md-6 mb-3">
              <label>Reason</label>
              <input
                className="form-control"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, reason: e.target.value }))
                }
              />
            </div>

            <div className="col-md-12 mb-3">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      is_active: e.target.checked,
                    }))
                  }
                />{" "}
                Active
              </label>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
            <Button label={editing ? "Update" : "Create"} type="submit" />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
