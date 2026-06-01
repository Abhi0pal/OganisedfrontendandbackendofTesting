"use client";

import { FormEvent, useCallback, useEffect,useRef, useMemo, useState } from "react";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import { ReusableDataTableConfig, RowAction } from "@/components/DataTable/types";
import apiClient from "@/lib/api-client";
import {
  SCOPE_TYPE_OPTIONS,
  ScopeType,
  UserManagementScope,
  UserManagementScopePayload,
  useCreateUserManagementScope,
  useDeleteUserManagementScope,
  useUpdateUserManagementScope,
  useUserManagementScopes,
} from "@/hooks/userManagement/useUserManagementScope";

type ScopeFormState = {
  assignment_id: string;
  scope_type: ScopeType;
  scope: string;
  scope_label: string;
  tenant: string;
  project: string;
  is_active: boolean;
};

const initialFormState: ScopeFormState = {
  assignment_id: "",
  scope_type: "DISTRICT",
  scope: "",
  scope_label: "",
  tenant: "",
  project: "",
  is_active: true,
};

const buildAssignmentIdentifier = (
  id?: number | null,
  roleId?: number | null,
  transferOrderNo?: string | null,
  roleName?: string | null,
) => {
  if (id == null) return "";
  const safeRolePart =
    roleName && roleName.trim().length > 0
      ? roleName.trim()
      : roleId != null && Number.isFinite(roleId)
      ? String(roleId)
      : "NA";
  const safeTransferOrderNo =
    transferOrderNo && transferOrderNo.trim().length > 0
      ? transferOrderNo.trim()
      : "NA";

  return `ASG-${id}-${safeRolePart}-TO-${safeTransferOrderNo}`;
};

type SelectOption = {
  value: string;
  label: string;
};

type ProjectSelectOption = SelectOption & {
  tenant?: string;
};

type AssignmentRow = {
  id: number;
  user_id?: number | string;
  role_id?: number | null;
  transfer_order_no?: string | null;
  assignment_identifier?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  updated_at?: string | null;
  role?: Record<string, unknown> | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const extractArrayFromResponse = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    const data = payload.data;
    if (Array.isArray(data)) return data.filter(isRecord);

    const items = payload.items;
    if (Array.isArray(items)) return items.filter(isRecord);
  }

  return [];
};

const getFirstString = (item: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const getFirstNumber = (item: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const toOptionalText = (value: string): string | undefined => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
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

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string" && message.trim().length > 0) return message;
    if (Array.isArray(message) && message.length > 0) return message.join(", ");
  }
  return fallback;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function UserManagementScopePage() {
  const toastRef = useRef<Toast>(null);
  const { data: scopes = [], isLoading, isError, error } = useUserManagementScopes();
  const createScope = useCreateUserManagementScope();
  const updateScope = useUpdateUserManagementScope();
  const deleteScope = useDeleteUserManagementScope();

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<UserManagementScope>(scopes);

  const sortedTableData = useMemo(() => {
    return [...tableData].sort((a, b) => Number(a.id) - Number(b.id));
  }, [tableData]);

  const displayIdById = useMemo(() => {
    return new Map(sortedTableData.map((row, index) => [Number(row.id), index + 1]));
  }, [sortedTableData]);

  const [showModal, setShowModal] = useState(false);
  const [editingScope, setEditingScope] = useState<UserManagementScope | null>(null);
  const [formData, setFormData] = useState<ScopeFormState>(initialFormState);
  const [assignmentOptions, setAssignmentOptions] = useState<SelectOption[]>([]);
  const [tenantOptions, setTenantOptions] = useState<SelectOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<ProjectSelectOption[]>([]);
  const [scopeOptionsByType, setScopeOptionsByType] = useState<
    Partial<Record<ScopeType, SelectOption[]>>
  >({});
  const [isFormOptionsLoading, setIsFormOptionsLoading] = useState(false);
  const [scopeOptionsLoading, setScopeOptionsLoading] = useState<
    Partial<Record<ScopeType, boolean>>
  >({});

  const loadingAction = createScope.isPending || updateScope.isPending || deleteScope.isPending;

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

  const tenantSelectOptions = useMemo(() => {
    if (!formData.tenant.trim()) return tenantOptions;
    if (tenantOptions.some((option) => option.value === formData.tenant)) {
      return tenantOptions;
    }
    return [{ value: formData.tenant, label: formData.tenant }, ...tenantOptions];
  }, [tenantOptions, formData.tenant]);

  const filteredProjectOptions = useMemo(() => {
    const selectedTenant = toOptionalText(formData.tenant);
    const filtered =
      selectedTenant == null
        ? projectOptions
        : projectOptions.filter((option) => option.tenant === selectedTenant);

    if (!formData.project.trim()) return filtered;
    if (filtered.some((option) => option.value === formData.project)) return filtered;

    return [{ value: formData.project, label: formData.project }, ...filtered];
  }, [projectOptions, formData.project, formData.tenant]);

  const currentScopeOptions = useMemo(() => {
    const mapped = scopeOptionsByType[formData.scope_type] ?? [];
    if (!formData.scope.trim()) return mapped;
    if (mapped.some((option) => option.value === formData.scope)) return mapped;

    return [
      {
        value: formData.scope,
        label: formData.scope_label.trim() || `Scope #${formData.scope}`,
      },
      ...mapped,
    ];
  }, [formData.scope, formData.scope_label, formData.scope_type, scopeOptionsByType]);

  const scopeLabelOptions = useMemo(
    () => currentScopeOptions,
    [currentScopeOptions],
  );

  const loadBaseOptions = useCallback(async () => {
    try {
      setIsFormOptionsLoading(true);

      const [assignmentsResult, tenantsResult, projectsResult, usersResult] = await Promise.allSettled([
        apiClient.get("/user-role-assignments"),
        apiClient.get("/tenants"),
        apiClient.get("/projects"),
        apiClient.get("/users"),
      ]);
      const tenantNameById = new Map<number, string>();

      if (assignmentsResult.status === "fulfilled") {
        const rows = extractArrayFromResponse(assignmentsResult.value.data)
          .map((item): AssignmentRow | null => {
            const id = getFirstNumber(item, ["id"]);
            if (id == null) return null;

            return {
              id,
              user_id: getFirstNumber(item, ["user_id", "userId"]) ?? undefined,
              role_id: getFirstNumber(item, ["role_id", "roleId"]),
              transfer_order_no: getFirstString(item, [
                "transfer_order_no",
                "transferOrderNo",
              ]),
              assignment_identifier: getFirstString(item, [
                "assignment_identifier",
                "assignmentIdentifier",
              ]),
              valid_from: getFirstString(item, ["valid_from", "validFrom"]),
              valid_until: getFirstString(item, ["valid_until", "validUntil"]),
              updated_at: getFirstString(item, ["updated_at", "updatedAt"]),
              role: isRecord(item["role"]) ? (item["role"] as Record<string, unknown>) : null,
            };
          })
          .filter((item): item is AssignmentRow => item !== null);

        const latestOpenAssignments = pickLatestOpenAssignmentsByUser(rows);

        const userNameMap = new Map<number, string>();
        if (usersResult.status === "fulfilled") {
          const users = extractArrayFromResponse(usersResult.value.data);
          users.forEach((user: any) => {
            const name = user.name || `${user.investor_profile?.first_name || ''} ${user.investor_profile?.last_name || ''}`.trim() || user.department_user?.full_name || `User ${user.id}`;
            userNameMap.set(Number(user.id), name);
          });
        }

        const normalized = latestOpenAssignments.map((assignment) => {
          const roleName = isRecord(assignment.role)
            ? getFirstString(assignment.role, ["name"])
            : null;
          const identifier =
            assignment.assignment_identifier ||
            buildAssignmentIdentifier(
              assignment.id,
              assignment.role_id,
              assignment.transfer_order_no,
              roleName,
            );
          const userName = userNameMap.get(Number(assignment.user_id)) || `User ${assignment.user_id}`;

          return {
            value: identifier,
            label: `${identifier} | USER-${userName}`,
          };
        });

        setAssignmentOptions(normalized);
      }

      if (tenantsResult.status === "fulfilled") {
        const rows = extractArrayFromResponse(tenantsResult.value.data);
        const normalized = rows
          .map((item) => {
            const id = getFirstNumber(item, ["id"]);
            const name =
              getFirstString(item, ["name", "label", "title", "slug"]) ||
              (id != null ? `Tenant ${id}` : null);
            if (!name) return null;

            if (id != null) {
              tenantNameById.set(id, name);
            }

            return { value: name, label: name };
          })
          .filter((option): option is SelectOption => option !== null)
          .sort((a, b) => a.label.localeCompare(b.label));

        setTenantOptions(normalized);
      }

      if (projectsResult.status === "fulfilled") {
        const rows = extractArrayFromResponse(projectsResult.value.data);
        const normalized = rows
          .map((item): ProjectSelectOption | null => {
            const id = getFirstNumber(item, ["id"]);
            const name = getFirstString(item, ["name", "label", "title"]) ?? (id != null ? `Project ${id}` : null);
            if (!name) return null;
            const code = getFirstString(item, ["code"]);
            const tenantId = getFirstNumber(item, ["tenant_id", "tenantId"]);
            const tenantName =
              tenantId != null
                ? (tenantNameById.get(tenantId) ?? `Tenant ${tenantId}`)
                : undefined;
            const displayLabel = code ? `${name} (${code})` : name;

            const option: ProjectSelectOption = {
              value: displayLabel,
              label: displayLabel,
            };
            if (tenantName) {
              option.tenant = tenantName;
            }
            return option;
          })
          .filter((option): option is ProjectSelectOption => option !== null)
          .sort((a, b) => a.label.localeCompare(b.label));

        setProjectOptions(normalized);
      }
    } finally {
      setIsFormOptionsLoading(false);
    }
  }, []);

  const loadScopeOptions = useCallback(async (scopeType: ScopeType) => {
    if (scopeOptionsByType[scopeType]) return;

    try {
      setScopeOptionsLoading((prev) => ({ ...prev, [scopeType]: true }));

      let rows: Record<string, unknown>[] = [];

      try {
        const response = await apiClient.get("/admin/user-management/assignment-scope-options", {
          params: { scopeType },
        });
        rows = extractArrayFromResponse(response.data);
      } catch {
        const endpointByType: Record<ScopeType, string> = {
          STATE: "/master/states",
          DISTRICT: "/master/districts",
          BLOCK: "/master/blocks",
          TEHSIL: "/tehsils",
          CIRCLE: "/admin/circle-options",
          DIVISION: "/master/ujs-divisions",
          VILLAGE: "/villages",
          PROJECT: "/projects",
        };

        const fallbackResponse = await apiClient.get(endpointByType[scopeType]);
        rows = extractArrayFromResponse(fallbackResponse.data);
      }

      const normalized = rows
        .map((item) => {
          const idValueRaw = getFirstString(item, ["scope", "id", "scope_id", "value"]);
          const idNumber = getFirstNumber(item, ["id", "value", "scope_id"]);
          const idValue = idValueRaw || (idNumber == null ? null : String(idNumber));

          const name = getFirstString(item, ["name", "label", "scope_label", "title"]);
          const code = getFirstString(item, ["code", "value"]);
          const realValue = (name || code || idValue || "").trim();
          if (!realValue) return null;

          return {
            value: realValue,
            label: code && name && code !== name ? `${name} (${code})` : realValue,
          };
        })
        .filter((option): option is SelectOption => option !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      setScopeOptionsByType((prev) => ({ ...prev, [scopeType]: normalized }));
    } finally {
      setScopeOptionsLoading((prev) => ({ ...prev, [scopeType]: false }));
    }
  }, [scopeOptionsByType]);

  useEffect(() => {
    if (!showModal) return;
    void loadBaseOptions();
  }, [showModal, loadBaseOptions]);

  useEffect(() => {
    if (!showModal) return;
    void loadScopeOptions(formData.scope_type);
  }, [formData.scope_type, loadScopeOptions, showModal]);

  useEffect(() => {
    if (!showModal || !formData.project) return;
    if (filteredProjectOptions.some((option) => option.value === formData.project)) return;

    setFormData((prev) => ({ ...prev, project: "" }));
  }, [filteredProjectOptions, formData.project, showModal]);

  const openCreateModal = () => {
    setEditingScope(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (scope: UserManagementScope) => {
    setEditingScope(scope);
    setFormData({
      assignment_id: scope.assignment_id,
      scope_type: scope.scope_type,
      scope: String(scope.scope),
      scope_label: scope.scope_label ?? "",
      tenant: scope.tenant != null ? String(scope.tenant) : "",
      project: scope.project != null ? String(scope.project) : "",
      is_active: scope.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingScope(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const scopeValue = formData.scope.trim();

    if (!formData.assignment_id.trim()) {
      alert("Please select a valid assignment.");
      return;
    }

    if (!scopeValue) {
      alert("Scope is required.");
      return;
    }

    const payload: UserManagementScopePayload = {
      assignment_id: formData.assignment_id.trim(),
      scope_type: formData.scope_type,
      scope: scopeValue,
      scope_label: formData.scope_label.trim() || undefined,
      tenant: toOptionalText(formData.tenant),
      project: toOptionalText(formData.project),
      is_active: formData.is_active,
    };

    try {
      if (editingScope) {
        await updateScope.mutateAsync({ id: editingScope.id, data: payload });
      } else {
        await createScope.mutateAsync(payload);
      }
      closeModal();
    } catch (submitError) {
      alert(extractErrorMessage(submitError, "Failed to save scope"));
    }
  };

  const handleToggleActive = async (scope: UserManagementScope) => {
    try {
      await updateScope.mutateAsync({
        id: scope.id,
        data: { is_active: !scope.is_active },
      });
    } catch (toggleError) {
      alert(extractErrorMessage(toggleError, "Failed to update scope status"));
    }
  };

  const handleDelete = async (scope: UserManagementScope) => {
    const isConfirmed = window.confirm(`Delete scope #${scope.id}?`);
    if (!isConfirmed) return;

    try {
      await deleteScope.mutateAsync(scope.id);
    } catch (removeError) {
      alert(extractErrorMessage(removeError, "Failed to delete scope"));
    }
  };

  const tableConfig: ReusableDataTableConfig<UserManagementScope> = useMemo(
    () => ({
      columns: [
        {
          field: "id",
          header: "ID",
          width: "6%",
          filterType: "none",
          body: (row) => displayIdById.get(Number(row.id)) ?? row.id,
        },
        {
          field: "assignment_id",
          header: "Assignment ID",
          width: "18%",
          filterType: "text",
          body: (row) => {
            const assignmentIdentifier =
              row.assignment_id ||
              row.assignment_identifier ||
              row.assignment?.assignment_identifier;
            const roleName = row.assignment?.role?.name ?? null;
            const generatedIdentifier = buildAssignmentIdentifier(
              row.assignment?.id,
              row.assignment?.role_id,
              row.assignment?.transfer_order_no,
              roleName,
            );

            return assignmentIdentifier || generatedIdentifier || "-";
          },
        },
        {
          field: "scope_type",
          header: "Scope Type",
          width: "12%",
          filterType: "select",
          filterOptions: SCOPE_TYPE_OPTIONS.map((scopeType) => ({
            label: scopeType,
            value: scopeType,
          })),
          body: (row) => <b>{row.scope_type}</b>,
        },
        {
          field: "scope",
          header: "Scope",
          width: "9%",
          filterType: "text",
        },
        {
          field: "scope_label",
          header: "Scope Label",
          width: "18%",
          filterType: "text",
          body: (row) => row.scope_label || "-",
        },
        {
          field: "tenant",
          header: "Tenant",
          width: "9%",
          filterType: "none",
          body: (row) => row.tenant ?? "-",
        },
        {
          field: "project",
          header: "Project",
          width: "9%",
          filterType: "none",
          body: (row) => row.project ?? "-",
        },
        {
          field: "is_active",
          header: "Status",
          width: "9%",
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
          field: "created_on",
          header: "Created On",
          width: "12%",
          filterType: "date",
          body: (row) => formatDate(row.created_on),
        },
        {
          field: "updated_on",
          header: "Updated On",
          width: "10%",
          filterType: "date",
          body: (row) => formatDate(row.updated_on),
        },
      ],
      dataKey: "id",
      rows: 5,
      rowsPerPageOptions: [5, 10, 25, 50],
      paginator: true,
      stripedRows: true,
      selectable: true,
      selectionMode: "multiple",
      globalFilterFields: [
        "id",
        "assignment_id",
        "assignment_identifier",
        "scope_type",
        "scope",
        "scope_label",
        "tenant",
        "project",
      ],
      showGridlines: true,
      emptyMessage: "No scope records found.",
    }),
    [displayIdById],
  );

  const rowActions: RowAction<UserManagementScope>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: openEditModal,
      },
      {
        icon: "pi pi-check",
        label: "Activate",
        severity: "success",
        onClick: handleToggleActive,
        visible: (scope) => !scope.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: handleToggleActive,
        visible: (scope) => scope.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: handleDelete,
      },
    ],
    [],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
        <div className="mb-4">
                <h1 className="h2 mb-3">User Assignment Scope</h1>
                <Toolbar
                  left={
                    <Button
                      label="Add Scope"
                      icon="pi pi-plus"
                      severity="success"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        openCreateModal();
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
        data={sortedTableData}
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

      <Dialog
        visible={showModal}
        onHide={closeModal}
        header={
          <div className="ey-dialog-title">
            {editingScope ? `Edit Scope #${editingScope.id}` : "Add User Management Scope"}
          </div>
        }
        modal
        className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Assignment (ID-Role-Transfer) *</label>
              <select
                className="form-select"
                value={formData.assignment_id}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignment_id: event.target.value,
                  }))
                }
                required
                disabled={isFormOptionsLoading && assignmentSelectOptions.length === 0}
              >
                <option value="">Select Assignment</option>
                {assignmentSelectOptions.map((option) => (
                  <option key={`assignment-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Scope Type *</label>
              <select
                className="form-select"
                value={formData.scope_type}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    scope_type: event.target.value as ScopeType,
                    scope: "",
                    scope_label: "",
                  }))
                }
                required
              >
                {SCOPE_TYPE_OPTIONS.map((scopeType) => (
                  <option key={scopeType} value={scopeType}>
                    {scopeType}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Scope *</label>
              <select
                className="form-select"
                value={formData.scope}
                onChange={(event) => {
                  const selectedValue = event.target.value;
                  const selectedOption = currentScopeOptions.find(
                    (option) => option.value === selectedValue,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    scope: selectedValue,
                    scope_label: selectedOption?.label ?? "",
                  }));
                }}
                required
                disabled={(scopeOptionsLoading[formData.scope_type] ?? false) && currentScopeOptions.length === 0}
              >
                <option value="">
                  {scopeOptionsLoading[formData.scope_type] ? "Loading scope options..." : "Select Scope"}
                </option>
                {currentScopeOptions.map((option) => (
                  <option key={`scope-id-${formData.scope_type}-${option.value}`} value={option.value}>
                    {option.value} - {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Scope Label</label>
              <select
                className="form-select"
                value={formData.scope}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selectedOption = scopeLabelOptions.find(
                    (option) => option.value === selectedId,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    scope: selectedId,
                    scope_label: selectedOption?.label ?? prev.scope_label,
                  }));
                }}
              >
                <option value="">Select Scope Label</option>
                {scopeLabelOptions.map((option) => (
                  <option key={`scope-label-${formData.scope_type}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Tenant</label>
              <select
                className="form-select"
                value={formData.tenant}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    tenant: event.target.value,
                    project:
                      prev.project &&
                      projectOptions.some(
                        (option) =>
                          option.value === prev.project &&
                          option.tenant === event.target.value,
                      )
                        ? prev.project
                        : "",
                  }))
                }
                disabled={isFormOptionsLoading && tenantSelectOptions.length === 0}
              >
                <option value="">Select Tenant</option>
                {tenantSelectOptions.map((option) => (
                  <option key={`tenant-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Project</label>
              <select
                className="form-select"
                value={formData.project}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    project: event.target.value,
                  }))
                }
                disabled={isFormOptionsLoading && filteredProjectOptions.length === 0}
              >
                <option value="">Select Project</option>
                {filteredProjectOptions.map((option) => (
                  <option key={`project-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <div>
                <div
                  className="fw-semibold text-uppercase mb-1"
                  style={{ letterSpacing: "0.06em", color: "#4b5563", fontSize: "0.95rem" }}
                >
                  Status
                </div>
                <div className="form-check d-flex align-items-center gap-2 mb-0">
                  <input
                    id="scope-is-active"
                    className="form-check-input mt-0"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_active: event.target.checked,
                      }))
                    }
                    style={{ width: "1rem", height: "1rem", accentColor: "#3b82f6" }}
                  />
                  <label
                    className="form-check-label fw-semibold mb-0"
                    htmlFor="scope-is-active"
                    style={{ color: "#16a34a", fontSize: "1rem", lineHeight: 1.1 }}
                  >
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">
            <Button
              type="button"
              label="Cancel"
              severity="secondary"
              onClick={closeModal}
            />
            <Button
              type="submit"
              label={loadingAction ? "Saving..." : editingScope ? "Update Scope" : "Create Scope"}
              disabled={loadingAction}
            />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
