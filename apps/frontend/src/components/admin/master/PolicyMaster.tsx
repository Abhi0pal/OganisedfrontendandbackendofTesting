"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import {
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
  useTogglePolicy,
} from "@/hooks/master/usePolicies";
import { useDepartments } from "@/hooks/master/useDepartments";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";
import { v4 as uuidv4 } from "uuid";

interface Policy {
  id: string;
  department_id: number;
  policy_name: string;
  policy_code: string;
  description?: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    id: number;
    name: string;
  };
}

export const PolicyMaster = () => {
  const { data: policies = [], isLoading } = usePolicies();
  const { data: departments = [] } = useDepartments();
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const deleteMutation = useDeletePolicy();
  const toggleMutation = useTogglePolicy();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    department_id: null as number | null,
    policy_name: "",
    policy_code: "",
    description: "",
    valid_from: null as Date | null,
    valid_to: null as Date | null,
    is_active: true,
  });

  const departmentOptions = useMemo(
    () => departments.map((d: any) => ({ label: d.name, value: d.id })),
    [departments],
  );

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Policy>(policies);

  const tableConfig: ReusableDataTableConfig<Policy> = useMemo(
    () => ({
      columns: [
        {
          field: "policy_code",
          header: "Policy Code",
          width: "12%",
          filterType: "text",
          body: (row) => (
            <span className="font-semibold">{row.policy_code}</span>
          ),
        },
        {
          field: "policy_name",
          header: "Policy Name",
          width: "20%",
          filterType: "text",
        },
        {
          field: "department",
          header: "Department",
          width: "15%",
          filterType: "text",
          body: (row) => (
            <Tag value={row.department?.name || "N/A"} severity="info" />
          ),
        },
        {
          field: "valid_from",
          header: "Valid From",
          width: "12%",
          filterType: "date",
          body: (row) => new Date(row.valid_from).toLocaleDateString(),
        },
        {
          field: "valid_to",
          header: "Valid To",
          width: "12%",
          filterType: "date",
          body: (row) => new Date(row.valid_to).toLocaleDateString(),
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
            <div className="d-flex align-items-center gap-2">
              {row.is_active ? (
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
      ],
      dataKey: "id",
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ["policy_code", "policy_name"],
      selectable: true,
      selectionMode: "multiple",
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No policies found.",
    }),
    [],
  );

  const rowActions: RowAction<Policy>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: (policy) => handleEdit(policy),
        tooltip: "Edit",
      },
      {
        icon: "pi pi-check",
        label: "Toggle",
        severity: "success",
        onClick: (policy) => handleToggle(policy),
        tooltip: "Toggle Status",
        visible: (policy) => !policy.is_active,
      },
      {
        icon: "pi pi-times",
        label: "Deactivate",
        severity: "warn",
        onClick: (policy) => handleToggle(policy),
        tooltip: "Deactivate",
        visible: (policy) => policy.is_active,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: (policy) => handleDelete(policy),
        tooltip: "Delete",
      },
    ],
    [],
  );

  const handleInputChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target || e;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (
        !formData.department_id ||
        !formData.valid_from ||
        !formData.valid_to
      ) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please fill all required fields",
        });
        return;
      }

      try {
        const submitData = {
          department_id: formData.department_id,
          policy_name: formData.policy_name,
          policy_code: formData.policy_code,
          description: formData.description || null,
          valid_from: formData.valid_from.toISOString(),
          valid_to: formData.valid_to.toISOString(),
          is_active: formData.is_active,
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Policy updated successfully",
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Policy created successfully",
          });
        }
        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: err.response?.data?.message || "Error saving policy",
        });
      }
    },
    [formData, editingId, createMutation, updateMutation],
  );

  const handleEdit = useCallback((policy: Policy) => {
    setFormData({
      department_id: policy.department_id,
      policy_name: policy.policy_name,
      policy_code: policy.policy_code,
      description: policy.description || "",
      valid_from: new Date(policy.valid_from),
      valid_to: new Date(policy.valid_to),
      is_active: policy.is_active,
    });
    const id = Number(policy.id);
    setEditingId(isNaN(id) ? null : id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (policy: Policy) => {
      if (confirm(`Are you sure you want to delete ${policy.policy_name}?`)) {
        try {
          const id = Number(policy.id);
          if (!isNaN(id)) {
            await deleteMutation.mutateAsync(id);
          }
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Policy deleted successfully",
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error deleting policy",
          });
        }
      }
    },
    [deleteMutation],
  );

  const handleToggle = useCallback(
    async (policy: Policy) => {
      try {
        const id = Number(policy.id);
        if (!isNaN(id)) {
          await toggleMutation.mutateAsync(id);
        }

        // await toggleMutation.mutateAsync(policy.id);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Policy ${policy.is_active ? "deactivated" : "activated"} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error updating policy status",
        });
      }
    },
    [toggleMutation],
  );

  const resetForm = useCallback(() => {
    setFormData({
      department_id: null,
      policy_name: "",
      policy_code: "",
      description: "",
      valid_from: null,
      valid_to: null,
      is_active: true,
    });
    setEditingId(null);
  }, []);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Policy"
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
      <div className="d-flex gap-2">
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
      </div>
    ),
    [clearFilters, handleGlobalFilterChange, handleFiltersChange],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Policy Master</h1>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Policy" : "Add New Policy"}
        modal
        style={{ width: "60vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="department_id" className="form-label">
                Department *
              </label>
              <Dropdown
                id="department_id"
                name="department_id"
                value={formData.department_id}
                options={departmentOptions}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "department_id", value: e.value },
                  })
                }
                placeholder="Select Department"
                className="w-100"
                filter
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="policy_code" className="form-label">
                Policy Code *
              </label>
              <InputText
                id="policy_code"
                name="policy_code"
                value={formData.policy_code}
                onChange={handleInputChange}
                placeholder="e.g., MSME-2024"
                className="w-100"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="policy_name" className="form-label">
              Policy Name *
            </label>
            <InputText
              id="policy_name"
              name="policy_name"
              value={formData.policy_name}
              onChange={handleInputChange}
              placeholder="e.g., MSME Development Policy 2024"
              className="w-100"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <InputTextarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Policy description..."
              rows={3}
              className="w-100"
            />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="valid_from" className="form-label">
                Valid From *
              </label>
              <Calendar
                id="valid_from"
                name="valid_from"
                value={formData.valid_from}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "valid_from", value: e.value },
                  })
                }
                dateFormat="dd/mm/yy"
                className="w-100"
                showIcon
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="valid_to" className="form-label">
                Valid To *
              </label>
              <Calendar
                id="valid_to"
                name="valid_to"
                value={formData.valid_to}
                onChange={(e) =>
                  handleInputChange({
                    target: { name: "valid_to", value: e.value },
                  })
                }
                dateFormat="dd/mm/yy"
                className="w-100"
                showIcon
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="form-check">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                className="form-check-input"
                checked={formData.is_active}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="is_active">
                Active
              </label>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              label={editingId ? "Update" : "Create"}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-grow-1"
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              severity="secondary"
              onClick={() => setShowDialog(false)}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<Policy>
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
