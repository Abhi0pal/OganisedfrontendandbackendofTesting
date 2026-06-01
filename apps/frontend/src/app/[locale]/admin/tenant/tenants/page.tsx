"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Tag } from "primereact/tag";
import { AxiosError } from "axios";
import { Hash, CheckCircle, XCircle, Edit2, Trash2, ToggleRight, ToggleLeft, Crop } from "lucide-react";
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
  tenant_ID?: string;
  domain?: string;
  logo_url?: string;
  primary_color?: string;
  plan: "FREE" | "STANDARD" | "ENTERPRISE";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const tenantPlans = [
  { value: "FREE", label: "Free" },
  { value: "STANDARD", label: "Standard" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

type LogoCropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const defaultLogoCrop: LogoCropArea = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function TenantsPage() {
  const toastRef = useRef<Toast>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const logoImageRef = useRef<HTMLImageElement>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoCrop, setLogoCrop] = useState<LogoCropArea>(defaultLogoCrop);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    tenant_ID: "",
    name: "",
    slug: "",
    domain: "",
    logo_url: "",
    primary_color: "",
    plan: "FREE" as "FREE" | "STANDARD" | "ENTERPRISE",
    is_active: true,
  });

  // Fetch tenants data from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/tenants");
      setTenants(response.data || []);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error("Failed to fetch tenants:", error);
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: axiosError.response?.data?.message || "Error fetching tenants",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Tenant>(tenants);

  // Helper function to reset form
  const resetForm = useCallback(() => {
    setFormData({
      id: "",
      tenant_ID: "",
      name: "",
      slug: "",
      domain: "",
      logo_url: "",
      primary_color: "",
      plan: "FREE",
      is_active: true,
    });
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoCrop(defaultLogoCrop);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
    setEditingId(null);
  }, []);

  const generateAbbreviatedName = useCallback((name: string): string => {
    if (!name.trim()) return "";

    const cleanName = name.trim().toLowerCase();
    const words = cleanName.split(/\s+/).filter((word) => word.length > 0);

    // If 2 or more words, create acronym from first letters
    if (words.length >= 2) {
      return words
        .map((word) => word[0])
        .join("")
        .substring(0, 10);
    }

    // If single word with 5+ characters, use first 3 characters
    if (words.length === 1 && words[0].length >= 5) {
      return words[0].substring(0, 3);
    }

    // If single word with 3-4 characters, use first 2 characters
    if (words.length === 1 && words[0].length >= 3) {
      return words[0].substring(0, 2);
    }

    // If very short, use the whole word (shouldn't happen often)
    return words[0];
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target as
        | HTMLInputElement
        | HTMLSelectElement;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };

        // Keep abbreviated tenant code synced with tenant name on create and edit.
        if (name === "name") {
          updated.slug = generateAbbreviatedName(value);
        }

        return updated;
      });
    },
    [editingId, generateAbbreviatedName],
  );

  const handleLogoFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "image/png") {
        toastRef.current?.show({
          severity: "warn",
          summary: "PNG required",
          detail: "Please upload only a PNG logo.",
        });
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toastRef.current?.show({
          severity: "warn",
          summary: "File too large",
          detail: "Logo PNG must be 5 MB or smaller.",
        });
        e.target.value = "";
        return;
      }

      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
      setLogoCrop(defaultLogoCrop);
    },
    [],
  );

  const updateLogoCrop = useCallback(
    (key: keyof LogoCropArea, value: number) => {
      setLogoCrop((prev) => {
        const next = { ...prev, [key]: value };

        next.width = clamp(next.width, 10, 100);
        next.height = clamp(next.height, 10, 100);
        next.x = clamp(next.x, 0, 100 - next.width);
        next.y = clamp(next.y, 0, 100 - next.height);

        return next;
      });
    },
    [],
  );

  const uploadCroppedLogo = useCallback(async () => {
    const image = logoImageRef.current;
    if (!logoFile || !image) {
      return formData.logo_url;
    }

    setIsLogoUploading(true);
    try {
      const sourceX = Math.round((image.naturalWidth * logoCrop.x) / 100);
      const sourceY = Math.round((image.naturalHeight * logoCrop.y) / 100);
      const sourceWidth = Math.round((image.naturalWidth * logoCrop.width) / 100);
      const sourceHeight = Math.round((image.naturalHeight * logoCrop.height) / 100);
      const outputScale = Math.min(1, 600 / sourceWidth);

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sourceWidth * outputScale));
      canvas.height = Math.max(1, Math.round(sourceHeight * outputScale));

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to crop selected logo.");
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to export cropped PNG."));
          }
        }, "image/png");
      });

      const safeBaseName =
        (formData.slug || formData.name || logoFile.name)
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 50) || "tenant-logo";
      const form = new FormData();
      form.append("file", blob, `${safeBaseName}.png`);

      const response = await apiClient.post("/upload/tenant-logo", form);
      const path = response.data?.path;
      if (!path) {
        throw new Error("Logo upload response did not include a path.");
      }

      setFormData((prev) => ({ ...prev, logo_url: path }));
      setLogoFile(null);
      setLogoPreviewUrl(null);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }

      return path as string;
    } finally {
      setIsLogoUploading(false);
    }
  }, [formData.logo_url, formData.name, formData.slug, logoCrop, logoFile]);

  const handleEdit = useCallback((tenant: Tenant) => {
    setFormData({
      id: tenant.id.toString(),
      tenant_ID: tenant.tenant_ID || "",
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain || "",
      logo_url: tenant.logo_url || "",
      primary_color: tenant.primary_color || "",
      plan: tenant.plan,
      is_active: tenant.is_active,
    });
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setLogoCrop(defaultLogoCrop);
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = "";
    }
    setEditingId(tenant.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (tenant: Tenant) => {
      if (confirm(`Are you sure you want to delete ${tenant.name}?`)) {
        try {
          await apiClient.delete(`/tenants/${tenant.id}`);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Tenant deleted successfully",
          });
          fetchData();
        } catch (error: unknown) {
          const axiosError = error as AxiosError<{ message: string }>;
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail:
              axiosError.response?.data?.message || "Error deleting tenant",
          });
        }
      }
    },
    [fetchData],
  );

  const handleToggle = useCallback(
    async (tenant: Tenant) => {
      try {
        const submitData: Record<string, unknown> = {
          name: tenant.name,
          slug: tenant.slug,
          is_active: !tenant.is_active,
          plan: tenant.plan,
        };
        if (tenant.domain) submitData.domain = tenant.domain;
        if (tenant.logo_url) submitData.logo_url = tenant.logo_url;
        if (tenant.primary_color)
          submitData.primary_color = tenant.primary_color;

        await apiClient.patch(`/tenants/${tenant.id}`, submitData);

        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Tenant ${tenant.is_active ? "deactivated" : "activated"} successfully`,
        });
        fetchData();
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail:
            axiosError.response?.data?.message ||
            "Error updating tenant status",
        });
      }
    },
    [fetchData],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const logoUrl = logoFile ? await uploadCroppedLogo() : formData.logo_url;

        // Don't send the id field - only send the data fields
        const submitData = {
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || null,
          logo_url: logoUrl || null,
          primary_color: formData.primary_color || null,
          plan: formData.plan,
          is_active: formData.is_active,
        };

        console.log("Submitting tenant data:", submitData);

        if (editingId) {
          await apiClient.patch(`/tenants/${editingId}`, submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Tenant updated successfully",
          });
        } else {
          console.log("Creating new tenant...");
          await apiClient.post("/tenants", submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Tenant created successfully",
          });
        }
        resetForm();
        setShowDialog(false);
        fetchData();
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message?: string | string[] }>;
        const responseData = axiosError.response?.data;
        const detailMessage = Array.isArray(responseData?.message)
          ? responseData.message.join(", ")
          : responseData?.message ||
            (typeof responseData === "string" ? responseData : null) ||
            axiosError.message ||
            "Error saving tenant";

        console.error("Error details:", {
          status: axiosError.response?.status,
          message: responseData?.message,
          error: axiosError.message,
          data: responseData,
        });
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: detailMessage,
        });
      }
    },
    [formData, logoFile, uploadCroppedLogo, editingId, resetForm, fetchData],
  );

  // Memoized table config
  const tableConfig: ReusableDataTableConfig<Tenant> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%", filterType: "none" },
        {
          field: "tenant_ID",
          header: "Tenant ID",
          width: "10%",
          filterType: "text",
          body: (row) => (
            <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <Hash size={14} style={{ color: '#0d6efd' }} />
              <span style={{ color: '#0d6efd', fontWeight: 600 }}>{row.tenant_ID || "-"}</span>
            </div>
          ),
        },
        {
          field: "name",
          header: "Tenant Name",
          width: "20%",
          filterType: "text",
          body: (row) => <span className="font-semibold">{row.name}</span>,
        },
        {
          field: "slug",
          header: "Abbreviated Tenant Name",
          width: "12%",
          filterType: "text",
          body: (row) => (
            <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {row.slug}
            </span>
          ),
        },
        {
          field: "plan",
          header: "Plan",
          width: "10%",
          filterType: "select",
          filterOptions: tenantPlans.map((plan) => ({
            label: plan.label,
            value: plan.value,
          })),
          body: (row) => (
            <Tag
              value={row.plan}
              severity={
                row.plan === "ENTERPRISE"
                  ? "warning"
                  : row.plan === "STANDARD"
                    ? "info"
                    : "secondary"
              }
            />
          ),
        },
        {
          field: "domain",
          header: "Domain",
          width: "18%",
          filterType: "text",
          body: (row) => <span>{row.domain || "-"}</span>,
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
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: isActive ? '#28a745' : '#dc3545' }}>
                  {isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                </span>
                <span style={{ color: isActive ? '#28a745' : '#dc3545', fontWeight: 600 }}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            );
          },
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
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ["name", "slug", "domain"],
      selectable: true,
      selectionMode: "multiple",
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No tenants found.",
    }),
    [],
  );

  // Memoized row actions
  const rowActions: RowAction<Tenant>[] = useMemo(
    () => [
      {
        icon: <Edit2 size={16} />,
        label: "Edit",
        severity: "info",
        onClick: (tenant) => handleEdit(tenant),
        tooltip: "Edit",
      },
      {
        icon: <ToggleRight size={16} />,
        label: "Activate",
        severity: "success",
        onClick: (tenant) => handleToggle(tenant),
        tooltip: "Activate",
        visible: (tenant) => !tenant.is_active,
      },
      {
        icon: <ToggleLeft size={16} />,
        label: "Deactivate",
        severity: "warn",
        onClick: (tenant) => handleToggle(tenant),
        tooltip: "Deactivate",
        visible: (tenant) => tenant.is_active,
      },
      {
        icon: <Trash2 size={16} />,
        label: "Delete",
        severity: "error",
        onClick: (tenant) => handleDelete(tenant),
        tooltip: "Delete",
      },
    ],
    [handleEdit, handleToggle, handleDelete],
  );

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Tenant"
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
      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1 className="h2 mb-3">Tenants Management</h1>
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

        header={

          <div className="ey-dialog-title">
            {editingId ? "Edit Tenant" : "Add New Tenant"}
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
              <label htmlFor="name" className="form-label">
                Tenant Name *
              </label>
              <InputText
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter tenant name"
                className="w-100"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="slug" className="form-label">
                Abbreviated Tenant Name *
              </label>
              <InputText
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="e.g., my-tenant"
                className="w-100"
                required
              />
              <small className="text-muted">
                Auto-generated from tenant name
              </small>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="tenant_ID" className="form-label">
                Tenant ID
              </label>
              <InputText
                id="tenant_ID"
                name="tenant_ID"
                value={formData.tenant_ID}
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
              <label htmlFor="domain" className="form-label">
                Domain
              </label>
              <InputText
                id="domain"
                name="domain"
                value={formData.domain}
                onChange={handleInputChange}
                placeholder="e.g., tenant.example.com"
                className="w-100"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="logo_file" className="form-label">
                Logo Upload
              </label>
              <input
                ref={logoFileInputRef}
                id="logo_file"
                type="file"
                accept="image/png"
                className="form-control"
                onChange={handleLogoFileChange}
              />
              <small className="text-muted">
                Only PNG is allowed. Crop will be uploaded as a PNG and saved as
                a public /img path.
              </small>

              {formData.logo_url && !logoPreviewUrl && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <img
                    src={formData.logo_url}
                    alt="Current tenant logo"
                    style={{
                      maxWidth: 120,
                      maxHeight: 52,
                      objectFit: "contain",
                      border: "1px solid #dee2e6",
                      borderRadius: 6,
                      padding: 6,
                      background: "#fff",
                    }}
                  />
                  <small className="text-muted">{formData.logo_url}</small>
                </div>
              )}

              {logoPreviewUrl && (
                <div className="mt-3 rounded border p-3 bg-light">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Crop size={16} />
                    <strong>Crop logo before upload</strong>
                  </div>
                  <div
                    className="position-relative d-inline-block bg-white border rounded overflow-hidden"
                    style={{ maxWidth: 360 }}
                  >
                    <img
                      ref={logoImageRef}
                      src={logoPreviewUrl}
                      alt="Logo crop preview"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        maxHeight: 220,
                        objectFit: "contain",
                      }}
                    />
                    <div
                      className="position-absolute border border-2 border-primary"
                      style={{
                        left: `${logoCrop.x}%`,
                        top: `${logoCrop.y}%`,
                        width: `${logoCrop.width}%`,
                        height: `${logoCrop.height}%`,
                        boxShadow: "0 0 0 999px rgba(0,0,0,.35)",
                        pointerEvents: "none",
                      }}
                    />
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <label className="form-label mb-1">Crop width</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={logoCrop.width}
                        onChange={(e) => updateLogoCrop("width", Number(e.target.value))}
                        className="form-range"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label mb-1">Crop height</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={logoCrop.height}
                        onChange={(e) => updateLogoCrop("height", Number(e.target.value))}
                        className="form-range"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label mb-1">Move X</label>
                      <input
                        type="range"
                        min="0"
                        max={100 - logoCrop.width}
                        value={logoCrop.x}
                        onChange={(e) => updateLogoCrop("x", Number(e.target.value))}
                        className="form-range"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label mb-1">Move Y</label>
                      <input
                        type="range"
                        min="0"
                        max={100 - logoCrop.height}
                        value={logoCrop.y}
                        onChange={(e) => updateLogoCrop("y", Number(e.target.value))}
                        className="form-range"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    label="Crop & Upload Logo"
                    icon="pi pi-upload"
                    loading={isLogoUploading}
                    className="mt-2"
                    onClick={async () => {
                      try {
                        await uploadCroppedLogo();
                        toastRef.current?.show({
                          severity: "success",
                          summary: "Uploaded",
                          detail: "Logo cropped and uploaded successfully.",
                        });
                      } catch (error: unknown) {
                        const axiosError = error as AxiosError<{ message: string }>;
                        toastRef.current?.show({
                          severity: "error",
                          summary: "Upload failed",
                          detail:
                            axiosError.response?.data?.message ||
                            axiosError.message ||
                            "Unable to upload logo",
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="primary_color" className="form-label">
                Primary Color
              </label>
              <div className="input-group">
                <InputText
                  id="primary_color"
                  name="primary_color"
                  value={formData.primary_color}
                  onChange={handleInputChange}
                  placeholder="#007bff"
                  className="w-100"
                />
                <input
                  type="color"
                  className="form-control"
                  style={{ maxWidth: "60px" }}
                  name="primary_color"
                  value={formData.primary_color || "#007bff"}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="plan" className="form-label">
                Pricing Plan
              </label>
              <select
                id="plan"
                name="plan"
                value={formData.plan}
                onChange={handleInputChange}
                className="form-select"
              >
                {tenantPlans.map((plan) => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <div style={{ marginTop: "2.125rem" }}>
                <div className="form-check">
                  <input
                    id="is_active"
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
                    htmlFor="is_active"
                    style={{
                      marginLeft: "0.5rem",
                      color: formData.is_active ? "#22c55e" : "inherit",
                    }}
                  >
                    Active
                  </label>
                </div>
                <style>{`
                  #is_active {
                    accent-color: #22c55e !important;
                  }
                  #is_active:checked {
                    background-color: #22c55e !important;
                    border-color: #22c55e !important;
                  }
                `}</style>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">            <Button
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
