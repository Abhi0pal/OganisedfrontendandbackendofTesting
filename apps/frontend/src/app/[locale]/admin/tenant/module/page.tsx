"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { AxiosError } from "axios";
import { CheckCircle, Globe, Hash, XCircle } from "lucide-react";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import apiClient from "@/lib/api-client";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

interface TenantProject {
  id: number;
  name: string;
  code: string;
  tenant_id: number;
  department_id?: string | number | null;
  sub_department_id?: string | number | null;
}

interface MasterData {
  id: string | number;
  data: {
    name?: string;
    department_id?: string | number;
    parent_department_id?: string | number;
    parent_id?: string | number;
    [key: string]: string | number | boolean | null | undefined;
  };
}

interface Module {
  id: number;
  module_ID?: string;
  code: string;
  name: string;
  name_hindi?: string | null;
  route?: string;
  icon?: string;
  portal: "ADMIN" | "DEPARTMENT" | "APPLICANT";
  order: number;
  is_leaf: boolean;
  is_active: boolean;
  parent_id?: number | null;
  tenant_id?: number | null;
  tenant_project_id?: number | null;
  department_id?: string | number | null;
  sub_department_id?: string | number | null;
  updated_at: string;
  parent?: Module | null;
}

const portalOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "APPLICANT", label: "Applicant" },
];

const iconOptions = [
  { value: "", label: "Choose an icon..." },
  { value: "pi pi-home", label: "Home" },
  { value: "pi pi-users", label: "Users" },
  { value: "pi pi-cog", label: "Settings" },
  { value: "pi pi-briefcase", label: "Briefcase" },
  { value: "pi pi-building", label: "Building" },
  { value: "pi pi-file", label: "File" },
  { value: "pi pi-chart-line", label: "Reports" },
  { value: "pi pi-folder", label: "Folder" },
  { value: "pi pi-list", label: "List" },
];

const indianLanguageOptions = [
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "ta", label: "Tamil" },
  { value: "ur", label: "Urdu" },
  { value: "gu", label: "Gujarati" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "pa", label: "Punjabi" },
  { value: "or", label: "Odia" },
  { value: "as", label: "Assamese" },
  { value: "sa", label: "Sanskrit" },
  { value: "ne", label: "Nepali" },
  { value: "ks", label: "Kashmiri" },
  { value: "sd", label: "Sindhi" },
  { value: "kok", label: "Konkani" },
  { value: "mai", label: "Maithili" },
  { value: "mni", label: "Manipuri" },
  { value: "doi", label: "Dogri" },
  { value: "sat", label: "Santhali" },
  { value: "bodo", label: "Bodo" },
];

const languageLabelMap = indianLanguageOptions.reduce<Record<string, string>>(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {},
);

const normalizeId = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const parseLocalizedNames = (value?: string | null): Record<string, string> => {
  const raw = value?.trim();

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed).reduce<Record<string, string>>(
        (acc, [langCode, label]) => {
          if (typeof label === "string" && label.trim()) {
            acc[langCode] = label;
          }
          return acc;
        },
        {},
      );
    }
  } catch {
    return { hi: raw };
  }

  return { hi: raw };
};

const serializeLocalizedNames = (
  localizedNames: Record<string, string>,
): string | undefined => {
  const cleaned = Object.entries(localizedNames).reduce<Record<string, string>>(
    (acc, [langCode, label]) => {
      if (label.trim()) {
        acc[langCode] = label.trim();
      }
      return acc;
    },
    {},
  );

  if (Object.keys(cleaned).length === 0) {
    return undefined;
  }

  return JSON.stringify(cleaned);
};

export default function ModulePage() {
  const toastRef = useRef<Toast>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [projects, setProjects] = useState<TenantProject[]>([]);
  const [departments, setDepartments] = useState<MasterData[]>([]);
  const [subDepartments, setSubDepartments] = useState<MasterData[]>([]);
  const [filteredSubDepartments, setFilteredSubDepartments] = useState<
    MasterData[]
  >([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [localizedNames, setLocalizedNames] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    module_ID: "",
    code: "",
    name: "",
    route: "",
    icon: "",
    portal: "ADMIN" as "ADMIN" | "DEPARTMENT" | "APPLICANT",
    order: "0",
    is_leaf: true,
    is_active: true,
    parent_id: "",
    tenant_id: "",
    tenant_project_id: "",
    department_id: "",
    sub_department_id: "",
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
  } = useDataTableManager<Module>(modules);

  const getSubDepartmentsForDepartment = useCallback(
    (departmentId: string): MasterData[] => {
      if (!departmentId) {
        return [];
      }

      return subDepartments.filter((subDepartment) => {
        const parentCandidates = [
          normalizeId(subDepartment.data.department_id),
          normalizeId(subDepartment.data.parent_department_id),
          normalizeId(subDepartment.data.parent_id),
        ].filter((candidate) => candidate.length > 0);

        return parentCandidates.includes(departmentId);
      });
    },
    [subDepartments],
  );

  const generateModuleCode = useCallback((name: string): string => {
    if (!name) {
      return "";
    }

    const words = name.split(/\s+/).filter((word) => word.length > 0);
    return words.map((word) => word[0].toUpperCase()).join("");
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      module_ID: "",
      code: "",
      name: "",
      route: "",
      icon: "",
      portal: "ADMIN",
      order: "0",
      is_leaf: true,
      is_active: true,
      parent_id: "",
      tenant_id: "",
      tenant_project_id: "",
      department_id: "",
      sub_department_id: "",
    });
    setSelectedLanguage("");
    setLocalizedNames({});
    setFilteredSubDepartments([]);
    setEditingId(null);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [modulesRes, tenantsRes, projectsRes, departmentsRes, subDepartmentsRes] =
        await Promise.all([
          apiClient.get("/modules"),
          apiClient.get("/tenants"),
          apiClient.get("/projects"),
          apiClient.get("/master/data?master_code=DEPARTMENT"),
          apiClient.get("/master/data?master_code=SUB_DEPARTMENT"),
        ]);

      setModules(modulesRes.data || []);
      setTenants(tenantsRes.data || []);
      setProjects(projectsRes.data || []);
      setDepartments(departmentsRes.data || []);
      setSubDepartments(subDepartmentsRes.data || []);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error("Failed to fetch data:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: axiosError.response?.data?.message || "Error fetching data",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = event.target as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      const checked = (event.target as HTMLInputElement).checked;

      setFormData((previous) => {
        const updated = {
          ...previous,
          [name]: type === "checkbox" ? checked : value,
        };

        if (name === "tenant_id") {
          updated.tenant_project_id = "";
          updated.department_id = "";
          updated.sub_department_id = "";
          updated.parent_id = "";
          setFilteredSubDepartments([]);
        }

        if (name === "tenant_project_id") {
          const selectedProject = projects.find(
            (project) => project.id.toString() === value,
          );

          if (!selectedProject) {
            updated.department_id = "";
            updated.sub_department_id = "";
            setFilteredSubDepartments([]);
          } else {
            const departmentId = normalizeId(selectedProject.department_id);
            const subDepartmentId = normalizeId(selectedProject.sub_department_id);

            updated.department_id = departmentId;

            let nextSubDepartmentOptions = departmentId
              ? getSubDepartmentsForDepartment(departmentId)
              : [];

            if (subDepartmentId) {
              const selectedSubDepartment = subDepartments.find(
                (subDepartment) =>
                  normalizeId(subDepartment.id) === subDepartmentId,
              );

              if (
                selectedSubDepartment &&
                !nextSubDepartmentOptions.some(
                  (subDepartment) =>
                    normalizeId(subDepartment.id) === subDepartmentId,
                )
              ) {
                nextSubDepartmentOptions = [
                  ...nextSubDepartmentOptions,
                  selectedSubDepartment,
                ];
              }
            }

            setFilteredSubDepartments(nextSubDepartmentOptions);

            if (
              subDepartmentId &&
              nextSubDepartmentOptions.some(
                (subDepartment) =>
                  normalizeId(subDepartment.id) === subDepartmentId,
              )
            ) {
              updated.sub_department_id = subDepartmentId;
            } else {
              updated.sub_department_id = "";
            }
          }
        }

        if (name === "department_id") {
          const nextSubDepartmentOptions = value
            ? getSubDepartmentsForDepartment(value)
            : [];

          setFilteredSubDepartments(nextSubDepartmentOptions);

          if (
            !value ||
            !nextSubDepartmentOptions.some(
              (subDepartment) =>
                normalizeId(subDepartment.id) === updated.sub_department_id,
            )
          ) {
            updated.sub_department_id = "";
          }
        }

        if (!editingId && name === "name") {
          updated.code = value
            ? generateModuleCode(value)
            : "";
        }

        return updated;
      });
    },
    [editingId, generateModuleCode, getSubDepartmentsForDepartment, projects, subDepartments],
  );

  const handleEdit = useCallback(
    (module: Module) => {
      const departmentId = normalizeId(module.department_id);
      const subDepartmentId = normalizeId(module.sub_department_id);

      const localized = parseLocalizedNames(module.name_hindi);
      const defaultLanguage = Object.keys(localized)[0] || "";

      let nextSubDepartmentOptions = departmentId
        ? getSubDepartmentsForDepartment(departmentId)
        : [];

      if (subDepartmentId) {
        const selectedSubDepartment = subDepartments.find(
          (subDepartment) => normalizeId(subDepartment.id) === subDepartmentId,
        );

        if (
          selectedSubDepartment &&
          !nextSubDepartmentOptions.some(
            (subDepartment) =>
              normalizeId(subDepartment.id) === subDepartmentId,
          )
        ) {
          nextSubDepartmentOptions = [
            ...nextSubDepartmentOptions,
            selectedSubDepartment,
          ];
        }
      }

      setFilteredSubDepartments(nextSubDepartmentOptions);
      setLocalizedNames(localized);
      setSelectedLanguage(defaultLanguage);

      setFormData({
        module_ID: module.module_ID || "",
        code: module.code,
        name: module.name,
        route: module.route || "",
        icon: module.icon || "",
        portal: module.portal,
        order: module.order.toString(),
        is_leaf: module.is_leaf,
        is_active: module.is_active,
        parent_id: module.parent_id ? module.parent_id.toString() : "",
        tenant_id: module.tenant_id ? module.tenant_id.toString() : "",
        tenant_project_id: module.tenant_project_id
          ? module.tenant_project_id.toString()
          : "",
        department_id: departmentId,
        sub_department_id: subDepartmentId,
      });

      setEditingId(module.id);
      setShowDialog(true);
    },
    [getSubDepartmentsForDepartment, subDepartments],
  );

  const handleDelete = useCallback(
    async (module: Module) => {
      if (confirm(`Are you sure you want to delete ${module.name}?`)) {
        try {
          await apiClient.delete(`/modules/${module.id}`);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Module deleted successfully",
          });
          fetchData();
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              axiosError.response?.data?.message || "Error deleting module",
          });
        }
      }
    },
    [fetchData],
  );

  const handleToggle = useCallback(
    async (module: Module) => {
      try {
        await apiClient.patch(`/modules/${module.id}`, {
          is_active: !module.is_active,
        });

        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Module ${module.is_active ? "deactivated" : "activated"} successfully`,
        });
        fetchData();
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            axiosError.response?.data?.message ||
            "Error updating module status",
        });
      }
    },
    [fetchData],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      try {
        if (!formData.tenant_id) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Please select a tenant",
          });
          return;
        }

        if (!formData.tenant_project_id) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Please select a project",
          });
          return;
        }

        const submitData: Record<string, unknown> = {
          code: formData.code,
          name: formData.name,
          portal: formData.portal,
          order: parseInt(formData.order, 10) || 0,
          is_leaf: formData.is_leaf,
          is_active: formData.is_active,
          tenant_id: parseInt(formData.tenant_id, 10),
          tenant_project_id: parseInt(formData.tenant_project_id, 10),
        };

        if (formData.route) {
          submitData.route = formData.route;
        }
        if (formData.icon) {
          submitData.icon = formData.icon;
        }

        if (formData.parent_id) {
          submitData.parent_id = parseInt(formData.parent_id, 10);
        } else if (editingId) {
          submitData.parent_id = null;
        }

        if (formData.department_id) {
          submitData.department_id = formData.department_id;
        } else if (editingId) {
          submitData.department_id = null;
        }

        if (formData.sub_department_id) {
          submitData.sub_department_id = formData.sub_department_id;
        } else if (editingId) {
          submitData.sub_department_id = null;
        }

        const localizedPayload = serializeLocalizedNames(localizedNames);
        if (localizedPayload) {
          submitData.name_hindi = localizedPayload;
        } else if (editingId) {
          submitData.name_hindi = null;
        }

        if (editingId) {
          await apiClient.patch(`/modules/${editingId}`, submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Module updated successfully",
          });
        } else {
          await apiClient.post("/modules", submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Module created successfully",
          });
        }

        resetForm();
        setShowDialog(false);
        fetchData();
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: axiosError.response?.data?.message || "Error saving module",
        });
      }
    },
    [editingId, fetchData, formData, localizedNames, resetForm],
  );

  const availableProjects = useMemo(() => {
    if (!formData.tenant_id) {
      return [];
    }

    return projects.filter(
      (project) => project.tenant_id.toString() === formData.tenant_id,
    );
  }, [formData.tenant_id, projects]);

  const availableParents = useMemo(
    () =>
      modules.filter((module) => {
        const isDifferentModule = !editingId || module.id !== editingId;
        const matchesTenant =
          !formData.tenant_id ||
          normalizeId(module.tenant_id) === formData.tenant_id;
        const matchesProject =
          !formData.tenant_project_id ||
          normalizeId(module.tenant_project_id) === formData.tenant_project_id;

        return isDifferentModule && matchesTenant && matchesProject;
      }),
    [editingId, formData.tenant_id, formData.tenant_project_id, modules],
  );

  const selectedLanguageLabel = selectedLanguage
    ? languageLabelMap[selectedLanguage] || selectedLanguage
    : "";

  const tableStyles = (
    <style>{`
      .table-value {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 600;
        transition: color 0.2s ease;
        color: var(--value-color);
      }

      .table-value:hover {
        color: var(--hover-color);
      }
    `}</style>
  );

  const tableConfig: ReusableDataTableConfig<Module> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "module_ID",
          header: "Module ID",
          width: "10%",
          filterType: "text",
          body: (row) => (
            <span
              className="table-value"
              style={{
                "--value-color": "#0d6efd",
                "--hover-color": "#084298",
              } as React.CSSProperties}
            >
              <Hash size={14} />
              <span>{row.module_ID || "-"}</span>
            </span>
          ),
        },
        {
          field: "code",
          header: "Abbreviated Module Name",
          width: "14%",
          filterType: "text",
          body: (row) => (
            <span
              className="table-value"
              style={{
                "--value-color": "#0d6efd",
                "--hover-color": "#084298",
              } as React.CSSProperties}
            >
              <Hash size={14} />
              <span>{row.code}</span>
            </span>
          ),
        },
        {
          field: "name",
          header: "Module Name",
          width: "27%",
          filterType: "text",
          body: (row) => {
            const localizedEntries = Object.entries(
              parseLocalizedNames(row.name_hindi),
            );

            return (
              <div>
                <span className="font-semibold">{row.name}</span>
                {localizedEntries.length > 0 && (
                  <div className="small text-muted">
                    {localizedEntries
                      .slice(0, 2)
                      .map(
                        ([langCode, label]) =>
                          `${languageLabelMap[langCode] || langCode.toUpperCase()}: ${label}`,
                      )
                      .join(" | ")}
                    {localizedEntries.length > 2 ? " ..." : ""}
                  </div>
                )}
                {row.route && (
                  <div className="small text-info">Route: {row.route}</div>
                )}
              </div>
            );
          },
        },
        {
          field: "portal",
          header: "Portal",
          width: "12%",
          filterType: "select",
          filterOptions: portalOptions,
          body: (row) => {
            const portalColor =
              row.portal === "ADMIN"
                ? "#dc3545"
                : row.portal === "DEPARTMENT"
                ? "#0d6efd"
                : "#fd7e14";
            const portalHover =
              row.portal === "ADMIN"
                ? "#a71d2c"
                : row.portal === "DEPARTMENT"
                ? "#084298"
                : "#c66300";

            return (
              <span
                className="table-value"
                style={{
                  "--value-color": portalColor,
                  "--hover-color": portalHover,
                } as React.CSSProperties}
              >
                <Globe size={14} />
                <span>{row.portal}</span>
              </span>
            );
          },
        },
        {
          field: "parent",
          header: "Parent",
          width: "12%",
          filterType: "none",
          body: (row) => <span>{row.parent?.name || "-"}</span>,
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
          body: (row) => {
            const isActive = row.is_active;
            return (
              <span
                className="table-value"
                style={{
                  "--value-color": isActive ? "#28a745" : "#dc3545",
                  "--hover-color": isActive ? "#1f7a33" : "#a71d2c",
                } as React.CSSProperties}
              >
                {isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                <span>{isActive ? "Active" : "Inactive"}</span>
              </span>
            );
          },
        },
        {
          field: "updated_at",
          header: "Last Updated",
          width: "12%",
          filterType: "date",
          body: (row) =>
            new Date(row.updated_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
        },
      ],
      dataKey: "id",
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ["name", "code"],
      selectable: true,
      selectionMode: "multiple",
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No modules found.",
    }),
    [],
  );

  const rowActions: RowAction<Module>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: (module) => handleEdit(module),
        tooltip: "Edit",
      },
      {
        icon: "pi pi-check",
        label: "Activate",
        severity: "success",
        onClick: (module) => handleToggle(module),
        tooltip: "Activate",
        visible: (module) => !module.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: (module) => handleToggle(module),
        tooltip: "Deactivate",
        visible: (module) => module.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: (module) => handleDelete(module),
        tooltip: "Delete",
      },
    ],
    [handleDelete, handleEdit, handleToggle],
  );

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Module"
        icon="pi pi-plus"
        severity="success"
        onClick={() => {
          resetForm();
          setShowDialog(true);
        }}
      />
    ),
    [resetForm],
  );

  const rightToolbarTemplate = useCallback(
    () => (
      <Button
        label="Clear Filters"
        icon="pi pi-filter-slash"
        severity="secondary"
        outlined
        onClick={() => {
          clearFilters();
          handleGlobalFilterChange("");
          handleFiltersChange({});
        }}
      />
    ),
    [clearFilters, handleFiltersChange, handleGlobalFilterChange],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      {tableStyles}
      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1 className="h2 mb-3">Modules Management</h1>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
      </div>

      <ReusableDataTable
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        rowActions={rowActions}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
      />

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={editingId ? "Edit Module" : "Add New Module"}
        modal
        style={{ width: "65vw" }}
        breakpoints={{ "960px": "80vw", "640px": "95vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="tenant_id" className="form-label">
                Tenant *
              </label>
              <select
                id="tenant_id"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id.toString()}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="tenant_project_id" className="form-label">
                Project *
              </label>
              <select
                id="tenant_project_id"
                name="tenant_project_id"
                value={formData.tenant_project_id}
                onChange={handleInputChange}
                className="form-select"
                required
                disabled={!formData.tenant_id}
              >
                <option value="">Select a project</option>
                {availableProjects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.name} ({project.code})
                  </option>
                ))}
              </select>
              <small className="text-muted">Projects are filtered by selected tenant.</small>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="department_id" className="form-label">
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="form-select"
                disabled={!formData.tenant_project_id}
              >
                <option value="">Select a department</option>
                {departments.map((department) => (
                  <option key={normalizeId(department.id)} value={normalizeId(department.id)}>
                    {department.data.name || normalizeId(department.id)}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Auto-filled from selected project when department is available.
              </small>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="sub_department_id" className="form-label">
                Sub Department
              </label>
              <select
                id="sub_department_id"
                name="sub_department_id"
                value={formData.sub_department_id}
                onChange={handleInputChange}
                className="form-select"
                disabled={!formData.department_id}
              >
                <option value="">Select a sub department</option>
                {filteredSubDepartments.map((subDepartment) => (
                  <option
                    key={normalizeId(subDepartment.id)}
                    value={normalizeId(subDepartment.id)}
                  >
                    {subDepartment.data.name || normalizeId(subDepartment.id)}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Sub departments are filtered by selected department.
              </small>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="parent_id" className="form-label">
                Parent Module
              </label>
              <select
                id="parent_id"
                name="parent_id"
                value={formData.parent_id}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">No Parent</option>
                {availableParents.map((module) => (
                  <option key={module.id} value={module.id.toString()}>
                    {module.name} ({module.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="portal" className="form-label">
                Portal *
              </label>
              <select
                id="portal"
                name="portal"
                value={formData.portal}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                {portalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">
                Module Name *
              </label>
              <InputText
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter module name"
                className="w-100"
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="code" className="form-label">
                Abbreviated Module Name {!editingId ? "*" : ""}
              </label>
              <InputText
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder={
                  !editingId
                    ? "Auto-generated from module name"
                    : "Enter abbreviated module name"
                }
                className="w-100"
                disabled={!editingId}
                required={!editingId}
              />
              <small className="text-muted">
                {!editingId
                  ? "Automatically generated using the initials of module name."
                  : "Unique short name used to identify the module."}
              </small>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="module_ID" className="form-label">
                Module ID
              </label>
              <InputText
                id="module_ID"
                name="module_ID"
                value={formData.module_ID}
                disabled
                placeholder={editingId ? "" : "Auto-generated"}
                className="w-100"
              />
              <small className="text-muted">
                {editingId
                  ? "Auto-generated identifier"
                  : "Auto-generated on creation"}
              </small>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="native_language" className="form-label">
                Name In
              </label>
              <select
                id="native_language"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="form-select"
              >
                <option value="">Select Indian language</option>
                {indianLanguageOptions.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="localized_name" className="form-label">
              Localized Module Name
            </label>
            <InputText
              id="localized_name"
              value={selectedLanguage ? localizedNames[selectedLanguage] || "" : ""}
              onChange={(event) => {
                if (!selectedLanguage) {
                  return;
                }

                const nextValue = event.target.value;
                setLocalizedNames((previous) => ({
                  ...previous,
                  [selectedLanguage]: nextValue,
                }));
              }}
              placeholder={
                selectedLanguageLabel
                  ? `Enter module name in ${selectedLanguageLabel}`
                  : "Select a language to enable this field"
              }
              className="w-100"
              disabled={!selectedLanguage}
            />
            <small className="text-muted">
              {selectedLanguageLabel
                ? `Saved for ${selectedLanguageLabel}. Switch language to manage another value.`
                : "Choose a language first, then enter the translated module name."}
            </small>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="route" className="form-label">
                Module Path
              </label>
              <InputText
                id="route"
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                placeholder="/admin/module-path"
                className="w-100"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="icon" className="form-label">
                Select Icon
              </label>
              <select
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                className="form-select"
              >
                {iconOptions.map((iconOption) => (
                  <option key={iconOption.value || "none"} value={iconOption.value}>
                    {iconOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="order" className="form-label">
                Order
              </label>
              <InputText
                id="order"
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                placeholder="0"
                className="w-100"
                min="0"
              />
            </div>

            <div className="col-md-6 mb-3">
              <div style={{ marginTop: "2.125rem" }}>
                <div className="form-check">
                  <input
                    id="is_leaf"
                    className="form-check-input"
                    type="checkbox"
                    name="is_leaf"
                    checked={formData.is_leaf}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="is_leaf">
                    Does this module have no sub-modules?
                    <i
                      className="pi pi-info-circle ms-2 text-muted"
                      title="Turn this on when the module is a final item and should not contain any child modules."
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="form-check">
              <input
                id="module_is_active"
                className="form-check-input"
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                style={{
                  width: "1.25em",
                  height: "1.25em",
                  cursor: "pointer",
                  accentColor: "#22c55e",
                }}
              />
              <label
                className="form-check-label"
                htmlFor="module_is_active"
                style={{
                  marginLeft: "0.5rem",
                  color: formData.is_active ? "#22c55e" : "inherit",
                  fontWeight: formData.is_active ? 600 : 400,
                }}
              >
                Active
              </label>
            </div>
            <style>{`
              #module_is_active {
                accent-color: #22c55e !important;
              }
              #module_is_active:checked {
                background-color: #22c55e !important;
                border-color: #22c55e !important;
              }
            `}</style>
          </div>

          <div className="d-flex gap-2 justify-content-end">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => {
                resetForm();
                setShowDialog(false);
              }}
            />
            <Button label={editingId ? "Update" : "Create"} type="submit" />
          </div>
        </form>
      </Dialog>
    </div>
  );
}