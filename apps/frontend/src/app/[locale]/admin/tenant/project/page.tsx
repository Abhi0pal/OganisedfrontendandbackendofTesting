"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { AxiosError } from "axios";
import { CheckCircle, Hash, XCircle } from "lucide-react";
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
  project_ID?: string;
  name: string;
  code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  updated_at: string;
  tenant_id?: number;
  department_id?: bigint;
  sub_department_id?: bigint;
}

interface MasterData {
  id: bigint;
  data: {
    name: string;
    [key: string]: string | number | boolean;
  };
}

export default function ProjectPage() {
  const toastRef = useRef<Toast>(null);
  const [projects, setProjects] = useState<TenantProject[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [departments, setDepartments] = useState<MasterData[]>([]);
  const [subDepartments, setSubDepartments] = useState<MasterData[]>([]);
  const [filteredSubDepartments, setFilteredSubDepartments] = useState<MasterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    project_ID: "",
    name: "",
    code: "",
    description: "",
    start_date: "",
    end_date: "",
    is_active: true,
    tenant_id: "",
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
  } = useDataTableManager<TenantProject>(projects);

  // Helper function to generate project code from name and start_year
  const generateProjectCode = useCallback((name: string, startDate: string): string => {
    if (!name || !startDate) return "";

    // Extract first 3 letters of project name, uppercase
    const abbrev = name
      .substring(0, 3)
      .toUpperCase()
      .replace(/\s+/g, '');

    // Extract year from start date (format: YYYY-MM-DD)
    const year = startDate.split('-')[0];

    return `${abbrev}_${year}`;
  }, []);

  const isEndDateBeforeStartDate = useCallback((startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate) return false;
    return endDate < startDate;
  }, []);

  // Helper function to reset form
  const resetForm = useCallback(() => {
    setFormData({
      project_ID: "",
      name: "",
      code: "",
      description: "",
      start_date: "",
      end_date: "",
      is_active: true,
      tenant_id: "",
      department_id: "",
      sub_department_id: "",
    });
    setEditingId(null);
    setFilteredSubDepartments([]);
  }, []);

  // Fetch both projects and tenants
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectsRes, tenantsRes, deptRes, subDeptRes] = await Promise.all([
        apiClient.get("/projects"),
        apiClient.get("/tenants"),
        apiClient.get("/master/data?master_code=DEPARTMENT"),
        apiClient.get("/master/data?master_code=SUB_DEPARTMENT"),
      ]);

      setProjects(projectsRes.data || []);
      setTenants(tenantsRes.data || []);
      setDepartments(deptRes.data || []);
      setSubDepartments(subDeptRes.data || []);
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
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value, type } = e.target as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };

        // When department changes, filter sub-departments and reset sub_department_id
        if (name === 'department_id') {
          updated.sub_department_id = '';
          // Filter sub-departments that reference this department
          if (value) {
            const filtered = subDepartments.filter((sd) => {
              // Assuming department_id is stored in sub-department's data
              return sd.data.department_id === value || sd.data.parent_department_id === value;
            });
            setFilteredSubDepartments(filtered);
          } else {
            setFilteredSubDepartments([]);
          }
        }

        // Keep abbreviated project code synced with project name/start date on create and edit.
        if (name === 'name' || name === 'start_date') {
          const newName = name === 'name' ? value : updated.name;
          const newStartDate = name === 'start_date' ? value : updated.start_date;

          if (newName && newStartDate) {
            updated.code = generateProjectCode(newName, newStartDate);
          }

          if (updated.start_date && updated.end_date && isEndDateBeforeStartDate(updated.start_date, updated.end_date)) {
            updated.end_date = '';
          }
        }

        return updated;
      });
    },
    [generateProjectCode, isEndDateBeforeStartDate, subDepartments],
  );

  const handleEdit = useCallback((project: TenantProject) => {
    setFormData({
      project_ID: project.project_ID || "",
      name: project.name,
      code: project.code,
      description: project.description || "",
      start_date: project.start_date
        ? new Date(project.start_date).toISOString().split("T")[0]
        : "",
      end_date: project.end_date
        ? new Date(project.end_date).toISOString().split("T")[0]
        : "",
      is_active: project.is_active,
      tenant_id: project.tenant_id ? project.tenant_id.toString() : "",
      department_id: project.department_id ? project.department_id.toString() : "",
      sub_department_id: project.sub_department_id ? project.sub_department_id.toString() : "",
    });

    // Filter sub-departments if department is set
    if (project.department_id) {
      const deptIdStr = project.department_id!.toString();
      const filtered = subDepartments.filter((sd) => {
        return sd.data.department_id === deptIdStr ||
               sd.data.parent_department_id === deptIdStr;
        return sd.data.department_id === project.department_id!.toString() ||
               sd.data.parent_department_id === project.department_id!.toString();
      });
      setFilteredSubDepartments(filtered);
    }

    setEditingId(project.id);
    setShowDialog(true);
  }, [subDepartments]);

  const handleDelete = useCallback(
    async (project: TenantProject) => {
      if (confirm(`Are you sure you want to delete ${project.name}?`)) {
        try {
          await apiClient.delete(`/projects/${project.id}`);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Project deleted successfully",
          });
          fetchData();
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              axiosError.response?.data?.message || "Error deleting project",
          });
        }
      }
    },
    [fetchData],
  );

  const handleToggle = useCallback(
    async (project: TenantProject) => {
      try {
        const submitData: Record<string, unknown> = {
          name: project.name,
          code: project.code,
          is_active: !project.is_active,
          tenant_id: project.tenant_id,
        };
        if (project.description) submitData.description = project.description;
        if (project.start_date) submitData.start_date = project.start_date;
        if (project.end_date) submitData.end_date = project.end_date;
        if (project.department_id) submitData.department_id = project.department_id;
        if (project.sub_department_id) submitData.sub_department_id = project.sub_department_id;

        await apiClient.patch(`/projects/${project.id}`, submitData);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Project ${project.is_active ? "deactivated" : "activated"} successfully`,
        });
        fetchData();
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            axiosError.response?.data?.message ||
            "Error updating project status",
        });
      }
    },
    [fetchData],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (!formData.tenant_id) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Please select a tenant",
          });
          return;
        }

        const submitData: Record<string, unknown> = {
          name: formData.name,
          code: formData.code,
          is_active: formData.is_active,
          tenant_id: parseInt(formData.tenant_id, 10),
        };

        if (formData.description) submitData.description = formData.description;
        if (formData.start_date)
          submitData.start_date = new Date(formData.start_date).toISOString();
        if (formData.end_date)
          submitData.end_date = new Date(formData.end_date).toISOString();

        if (formData.start_date && formData.end_date && isEndDateBeforeStartDate(formData.start_date, formData.end_date)) {
          toastRef.current?.show({
            severity: "error",
            summary: "Validation Error",
            detail: "Project End Date cannot be earlier than Project Start Date.",
          });
          return;
        }
        if (formData.department_id)
          submitData.department_id = parseInt(formData.department_id, 10);
        if (formData.sub_department_id)
          submitData.sub_department_id = parseInt(formData.sub_department_id, 10);

        if (editingId) {
          await apiClient.patch(`/projects/${editingId}`, submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Project updated successfully",
          });
        } else {
          await apiClient.post("/projects", submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Project created successfully",
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
          detail: axiosError.response?.data?.message || "Error saving project",
        });
      }
    },
    [formData, editingId, resetForm, fetchData],
  );

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

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<TenantProject> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "project_ID",
          header: "Project ID",
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
              <span>{row.project_ID || "-"}</span>
            </span>
          ),
        },
        {
          field: "name",
          header: "Project Name",
          width: "20%",
          filterType: "text",
          body: (row) => (
            <div>
              <span className="font-semibold">{row.name}</span>
              {row.description && (
                <div className="small text-muted">{row.description}</div>
              )}
            </div>
          ),
        },
        {
          field: "code",
          header: "Code",
          width: "12%",
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
          field: "start_date",
          header: "Project Start Date",
          width: "12%",
          filterType: "date",
          body: (row) =>
            row.start_date
              ? new Date(row.start_date).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-",
        },
        {
          field: "end_date",
          header: "Project End Date",
          width: "12%",
          filterType: "date",
          body: (row) =>
            row.end_date
              ? new Date(row.end_date).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-",
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
              day: "2-digit",
              month: "short",
              year: "numeric",
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
      emptyMessage: "No projects found.",
    }),
    [],
  );

  // Memoized row actions
  const rowActions: RowAction<TenantProject>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: (project) => handleEdit(project),
        tooltip: "Edit",
      },
      {
        icon: "pi pi-check",
        label: "Activate",
        severity: "success",
        onClick: (project) => handleToggle(project),
        tooltip: "Activate",
        visible: (project) => !project.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: (project) => handleToggle(project),
        tooltip: "Deactivate",
        visible: (project) => project.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: (project) => handleDelete(project),
        tooltip: "Delete",
      },
    ],
    [handleEdit, handleToggle, handleDelete],
  );

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Project"
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
    [clearFilters, handleGlobalFilterChange, handleFiltersChange],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      {tableStyles}
      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1 className="h2 mb-3">Projects Management</h1>
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
        header={editingId ? "Edit Project" : "Add New Project"}
        modal
        style={{ width: "60vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit}>
          {/* Row 1: Tenant | Department */}
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
              <label htmlFor="department_id" className="form-label">
                Department
              </label>
              <select
                id="department_id"
                name="department_id"
                value={formData.department_id}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept.id as any} value={dept.id as any}>
                    {dept.data.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Sub Department | Project Name */}
          <div className="row">
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
                {filteredSubDepartments.map((subDept) => (
                  <option key={subDept.id as any} value={subDept.id as any}>
                    {subDept.data.name}
                  </option>
                ))}
              </select>
              <small className="text-muted">Optional - Select a department first</small>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">
                Project Name *
              </label>
              <InputText
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
                className="w-100"
                required
              />
            </div>
          </div>

          {/* Row 3: Abbreviated Project Name | Project ID */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="code" className="form-label">
                Abbreviated Project Name {!editingId ? "*" : ""}
              </label>
              <InputText
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                disabled={!editingId}
                placeholder={!editingId ? "Auto-generated when name & start date are entered" : "e.g., PRJ-001"}
                className="w-100"
                required={editingId ? false : true}
              />
              <small className="text-muted">
                {!editingId
                  ? "Automatically generated as <first_3_letters_of_name>_<year>"
                  : "Unique identifier for the project"}
              </small>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="project_ID" className="form-label">
                Project ID
              </label>
              <InputText
                id="project_ID"
                name="project_ID"
                value={formData.project_ID}
                disabled
                placeholder={editingId ? "" : "Auto-generated"}
                className="w-100"
              />
              <small className="text-muted">
                {editingId ? "Auto-generated identifier" : "Auto-generated on creation"}
              </small>
            </div>
          </div>

          {/* Row 4: Description (Full Width) */}
          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description"
              className="form-control"
              rows={3}
            />
          </div>

          {/* Row 5: Start Date | End Date */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="start_date" className="form-label">
                Project Start Date *
              </label>
              <InputText
                id="start_date"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-100"
                required
              />
              <small className="text-muted">
                Required - Used in project code generation
              </small>
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="end_date" className="form-label">
                Project End Date
              </label>
              <InputText
                id="end_date"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-100"
                min={formData.start_date || undefined}
              />
            </div>
          </div>

          {/* Row 6: Active Checkbox (Full Width) with Green Styling */}
          <div className="mb-4">
            <div className="form-check">
              <input
                id="is_active"
                className="form-check-input"
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                style={{
                  accentColor: "#22c55e",
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                }}
              />
              <label
                className="form-check-label"
                htmlFor="is_active"
                style={{
                  color: formData.is_active ? "#22c55e" : "#666",
                  fontWeight: formData.is_active ? "600" : "400",
                  marginLeft: "8px",
                  cursor: "pointer",
                }}
              >
                Active
              </label>
            </div>
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
