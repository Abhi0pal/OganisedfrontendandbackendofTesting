"use client";

import { CheckCircle, XCircle, CircleDot } from "lucide-react";
import { useRef, useState, useMemo, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { TabView, TabPanel } from "primereact/tabview";
import {
  useSchemes,
  useCreateScheme,
  useUpdateScheme,
  useDeleteScheme,
  useToggleScheme,
} from "@/hooks/master/useSchemes";
import { usePolicies } from "@/hooks/master/usePolicies";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";
import { v4 as uuidv4 } from "uuid";
import { SchemeBasicDetailsBuilder } from "./SchemeBasicDetailsBuilder";
import { CascadingConfigBuilder } from "./CascadingConfigBuilder";
import { PopMessageBuilder } from "./PopMessageBuilder";
import { FormStructureBuilder } from "./FormStructureBuilder";
import { RequiredDocumentsBuilder } from "./RequiredDocumentsBuilder";
import { WorkflowBuilder } from "./WorkflowBuilder";
import { AdminBuilder } from "./AdminBuilder";

interface Scheme {
  id: number;
  policy_id: number;
  service_id: string;
  scheme_name: string;
  scheme_code: string;
  cascading_config: any;
  pop_message_config: any;
  form_structure_json: any;
  required_documents: any;
  calculation_logic: any;
  workflow_config: any;
  admin_view_config: any;
  version: number;
  is_current_version: boolean;
  valid_from: string;
  valid_to: string;
  created_at: string;
  policy?: {
    id: number;
    policy_name: string;
    policy_code: string;
    department?: {
      id: number;
      name: string;
    };
  };
}

export const SchemeMaster = () => {
  const { data: schemes = [], isLoading } = useSchemes();
  const { data: policies = [] } = usePolicies({ isActive: true });
  const createMutation = useCreateScheme();
  const updateMutation = useUpdateScheme();
  const deleteMutation = useDeleteScheme();
  const toggleMutation = useToggleScheme();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const [formData, setFormData] = useState({
    policy_id: 0,
    service_id: "",
    scheme_name: "",
    scheme_code: "",
    cascading_config: "{}",
    pop_message_config: "{}",
    form_structure_json: "{}",
    required_documents: "{}",
    calculation_logic: "{}",
    workflow_config: "{}",
    admin_view_config: "{}",
    version: 1,
    is_current_version: true,
    valid_from: null as Date | null,
    valid_to: null as Date | null,
  });
  // Place this near the top of the component, before return()
  const parseJsonSafe = (jsonString: string, fieldName: string): any | null => {
    try {
      return JSON.parse(jsonString);
    } catch {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: `Invalid JSON in ${fieldName}`,
      });
      return null;
    }
  };

  const [requiredDocuments, setRequiredDocuments] = useState<{
    document_types: any[];
  }>({
    document_types: [],
  });

  // const { data: documentMasters = [] } = useDocumentMasters();
  // const documentOptions = useMemo(
  //   () =>
  //     documentMasters.map((doc: any) => ({
  //       label: `${doc.checklistDocumentName} (${doc.checklistDocumentExtension})`,
  //       value: doc.id,
  //       meta: doc,
  //     })),
  //   [documentMasters],
  // );
  // Generate field_code options from the current formStructure

  // Form structure state (visual builder)
  const [formStructure, setFormStructure] = useState<any[]>([]);
  const allFormFields = useMemo(() => {
    const fields: { label: string; value: string }[] = [];
    formStructure.forEach((section: any) => {
      section.fields?.forEach((field: any) => {
        fields.push({
          label: field.field_label || field.field_code || "Unknown",
          value: field.field_code,
        });
      });
    });
    return fields;
  }, [formStructure]);
  // Form settings state (multi-step mode, etc.)
  const [formSettings, setFormSettings] = useState<{
    is_multi_step: boolean;
    is_approved_caf_required: boolean;
  }>({
    is_multi_step: false,
    is_approved_caf_required: false,
  });

  // const roleOptions = [
  //   { label: "District Officer", value: "DISTRICT_OFFICER" },
  //   { label: "State Officer", value: "STATE_OFFICER" },
  //   { label: "Department Admin", value: "DEPARTMENT_ADMIN" },
  //   { label: "System Admin", value: "SYSTEM_ADMIN" },
  // ];
  const cascadingSafe =
    parseJsonSafe(formData.cascading_config, "Cascading Config") || {};

  const popMessageSafe =
    parseJsonSafe(formData.pop_message_config, "Pop Message Config") || {};

  const workflowValue =
    parseJsonSafe(formData.workflow_config, "Workflow Config") || {};
  const workflowSafe = {
    ...workflowValue,
    stages: workflowValue.stages || [],
    submit_url: workflowValue.submit_url || "",
  };
  const adminviewValue =
    parseJsonSafe(formData.admin_view_config, "Admin View Config") || {};
  const adminviewSafe = {
    ...adminviewValue,
    stages: adminviewValue.stages || [],
    submit_url: adminviewValue.submit_url || "",
  };
  // Sync formSettings with workflow_config
  type FormSettings = {
    is_multi_step: boolean;
    is_approved_caf_required: boolean;
  };

  const handleFormSettingsChange = (settings: FormSettings) => {
    // 1) Update local UI state for settings
    setFormSettings(settings);

    // 2) Merge into workflow_config JSON (string) safely
    setFormData((prev) => {
      let nextConfig: any = {};

      try {
        const parsed = prev.workflow_config
          ? JSON.parse(prev.workflow_config)
          : {};
        // Ensure it's an object before merging
        nextConfig =
          parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed
            : {};
      } catch {
        nextConfig = {};
      }

      // ✅ Persist both flags inside workflow_config
      nextConfig.is_multi_step = !!settings.is_multi_step;
      nextConfig.is_approved_caf_required = !!settings.is_approved_caf_required;

      return {
        ...prev,
        workflow_config: JSON.stringify(nextConfig, null, 2),
      };
    });
  };

  const policyOptions = useMemo(
    () =>
      policies.map((p: any) => ({
        label: `${p.policy_code} - ${p.policy_name}`,
        value: p.id,
      })),
    [policies],
  );
  const schemeOptions = useMemo(
    () =>
      schemes.map((s: any) => ({
        label: `${s.scheme_code} - ${s.scheme_name}`,
        value: s.id, // match trigger field
        policy_id: s.policy_id, // important! used for filtering schemes by policy
        form_structure_json: s.form_structure_json,
      })),
    [schemes],
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
  } = useDataTableManager<Scheme>(schemes);

  const tableConfig: ReusableDataTableConfig<Scheme> = useMemo(
    () => ({
      columns: [
        {
          field: "scheme_code",
          header: "Scheme Code",
          width: "12%",
          filterType: "text",
          body: (row) => (
            <span className="font-semibold">{row.scheme_code}</span>
          ),
        },
        {
          field: "scheme_name",
          header: "Scheme Name",
          width: "18%",
          filterType: "text",
        },
        {
          field: "policy",
          header: "Policy",
          width: "15%",
          filterType: "text",
          body: (row) => (
            <Tag value={row.policy?.policy_name || "N/A"} severity="info" />
          ),
        },
        {
          field: "version",
          header: "Version",
          width: "8%",
          filterType: "number",
          body: (row) => (
            <span style={{ color: '#6c757d', fontFamily: 'monospace', fontWeight: 500 }}>
              v{row.version}
            </span>
          ),
        },
        {
          field: "is_current_version",
          header: "Current",
          width: "10%",
          filterType: "select",
          filterOptions: [
            { label: "Yes", value: true },
            { label: "No", value: false },
          ],
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              {row.is_current_version ? (
                <>
                  <CheckCircle size={14} style={{ color: '#28a745' }} />
                  <span style={{ color: '#28a745', fontWeight: 600 }}>Current</span>
                </>
              ) : (
                <>
                  <CircleDot size={14} style={{ color: '#6c757d' }} />
                  <span style={{ color: '#6c757d', fontWeight: 500 }}>Old</span>
                </>
              )}
            </div>
          ),
        },
        {
          field: "valid_from",
          header: "Valid From",
          width: "10%",
          filterType: "date",
          body: (row) => new Date(row.valid_from).toLocaleDateString(),
        },
        {
          field: "valid_to",
          header: "Valid To",
          width: "10%",
          filterType: "date",
          body: (row) => new Date(row.valid_to).toLocaleDateString(),
        },
        {
          field: "id" as keyof Scheme,
          header: "Form URL",
          width: "15%",
          filterType: "none",
          body: (row) => {
            const policyCode = row.policy?.policy_code || "unknown";
            const formUrl = `/investor/apply/${policyCode}/${row.scheme_code}/${row.version}`;
            const fullUrl = `${
              typeof window !== "undefined" ? window.location.origin : ""
            }${formUrl}`;

            const copyToClipboard = () => {
              navigator.clipboard.writeText(fullUrl);
            };

            return (
              <div className="d-flex align-items-center gap-1">
                <span
                  className="text-truncate"
                  style={{ maxWidth: "120px", fontSize: "11px" }}
                  title={fullUrl}
                >
                  {formUrl}
                </span>
                <Button
                  icon="pi pi-copy"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  tooltip="Copy URL"
                  tooltipOptions={{ position: "top" }}
                  onClick={copyToClipboard}
                  style={{ width: "24px", height: "24px" }}
                />
                <Button
                  icon="pi pi-external-link"
                  size="small"
                  text
                  rounded
                  severity="info"
                  tooltip="Open Form"
                  tooltipOptions={{ position: "top" }}
                  onClick={() => window.open(formUrl, "_blank")}
                  style={{ width: "24px", height: "24px" }}
                />
              </div>
            );
          },
        },
      ],
      dataKey: "id",
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ["scheme_code", "scheme_name"],
      selectable: true,
      selectionMode: "multiple",
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: "No schemes found.",
    }),
    [],
  );

  const rowActions: RowAction<Scheme>[] = useMemo(
    () => [
      {
        icon: "pi pi-pencil",
        label: "Edit",
        severity: "info",
        onClick: (scheme) => handleEdit(scheme),
        tooltip: "Edit",
      },
      {
        icon: "pi pi-copy",
        label: "Duplicate",
        severity: "secondary",
        onClick: (scheme) => handleCopy(scheme),
        tooltip: "Duplicate Scheme",
      },
      {
        icon: "pi pi-check",
        label: "Set Current",
        severity: "success",
        onClick: (scheme) => handleToggle(scheme),
        tooltip: "Set as Current Version",
        visible: (scheme) => !scheme.is_current_version,
      },
      {
        icon: "pi pi-times",
        label: "Unset Current",
        severity: "warn",
        onClick: (scheme) => handleToggle(scheme),
        tooltip: "Unset Current Version",
        visible: (scheme) => scheme.is_current_version,
      },
      {
        icon: "pi pi-trash",
        label: "Delete",
        severity: "error",
        onClick: (scheme) => handleDelete(scheme),
        tooltip: "Delete",
      },
    ],
    [],
  );

  // Helper function to convert text to snake_case code
  const toSnakeCase = useCallback((text: string): string => {
    return text
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_"); // Replace spaces with underscores
  }, []);

  const handleInputChange = useCallback(
    (e: any) => {
      const { name, value, type, checked } = e.target || e;
      setFormData((prev) => {
        const updated = {
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        };
        // Auto-generate scheme_code from scheme_name
        if (name === "scheme_name" && !editingId) {
          updated.scheme_code = toSnakeCase(value);
        }
        return updated;
      });
    },
    [editingId, toSnakeCase],
  );

  const saveScheme = useCallback(async () => {
    const cascadingConf = parseJsonSafe(
      formData.cascading_config,
      "Cascading Config",
    );
    if (cascadingConf === null) return false;

    const popConf = parseJsonSafe(
      formData.pop_message_config,
      "Pop Message Config",
    );
    if (popConf === null) return false;

    const calcLogic = parseJsonSafe(
      formData.calculation_logic,
      "Calculation Logic",
    );
    if (calcLogic === null) return false;

    const workflowConf = parseJsonSafe(
      formData.workflow_config,
      "Workflow Config",
    );
    if (workflowConf === null) return false;

    const adminViewConf = parseJsonSafe(
      formData.admin_view_config,
      "Admin View Config",
    );
    if (adminViewConf === null) return false;

    const submitData = {
      policy_id: formData.policy_id,
      service_id: formData.service_id,
      scheme_name: formData.scheme_name,
      scheme_code: formData.scheme_code,
      cascading_config: cascadingConf,
      pop_message_config: popConf,
      form_structure_json: {
        sections: formStructure,
        is_multi_step: formSettings.is_multi_step,
        is_approved_caf_required: formSettings.is_approved_caf_required,
      },
      required_documents:
        Array.isArray(requiredDocuments.document_types) &&
        requiredDocuments.document_types.length > 0
          ? { document_types: requiredDocuments.document_types }
          : {},

      calculation_logic: calcLogic,
      workflow_config: workflowConf,
      admin_view_config: adminViewConf,
      version: formData.version,
      is_current_version: formData.is_current_version,
      valid_from: formData.valid_from?.toISOString(),
      valid_to: formData.valid_to?.toISOString(),
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
      } else {
        const res = await createMutation.mutateAsync(submitData);
        setEditingId(res.id); // 👈 Important for next updates
      }

      toastRef.current?.show({
        severity: "success",
        summary: "Saved",
        detail: "Progress saved successfully",
      });

      return true;
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Error saving scheme",
      });
      return false;
    }
  }, [formData, formStructure, formSettings, requiredDocuments, editingId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.policy_id || !formData.valid_from || !formData.valid_to) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please fill all required fields in Basic Details tab",
        });
        setActiveTabIndex(0);
        return;
      }

      const cascadingConf = parseJsonSafe(
        formData.cascading_config,
        "Cascading Config",
      );
      if (cascadingConf === null) {
        setActiveTabIndex(1);
        return;
      }
      const popConf = parseJsonSafe(
        formData.pop_message_config,
        "Pop Message Config",
      );
      if (popConf === null) {
        setActiveTabIndex(2);
        return;
      }
      // ✅ Form Structure (Visual Builder)
      const formStructureData = {
        sections: formStructure,
        is_multi_step: formSettings.is_multi_step,
        is_approved_caf_required: formSettings.is_approved_caf_required,
      };

      const documentTypes = requiredDocuments.document_types;

      if (!Array.isArray(documentTypes) || documentTypes.length === 0) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please configure at least one Document Type",
        });
        setActiveTabIndex(4);
        return;
      }

      // ✅ Check at least one document exists inside any type
      const hasAtLeastOneDocument = documentTypes.some(
        (dt: any) => Array.isArray(dt.documents) && dt.documents.length > 0,
      );

      if (!hasAtLeastOneDocument) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Please configure at least one Required Document",
        });
        setActiveTabIndex(4);
        return;
      }

      // ✅ JSON-based sections (still parsed)
      const calcLogic = parseJsonSafe(
        formData.calculation_logic,
        "Calculation Logic",
      );
      if (calcLogic === null) return;

      const workflowConf = parseJsonSafe(
        formData.workflow_config,
        "Workflow Config",
      );
      if (workflowConf === null) {
        setActiveTabIndex(5);
        return;
      }

      const adminViewConf = parseJsonSafe(
        formData.admin_view_config,
        "Admin View Config",
      );
      if (adminViewConf === null) {
        setActiveTabIndex(6);
        return;
      }

      try {
        const submitData = {
          policy_id: formData.policy_id,
          service_id: formData.service_id,
          scheme_name: formData.scheme_name,
          scheme_code: formData.scheme_code,
          cascading_config: cascadingConf,
          pop_message_config: popConf,
          // ✅ Builder-driven configs
          form_structure_json: formStructureData,
          required_documents:
            Array.isArray(requiredDocuments.document_types) &&
            requiredDocuments.document_types.length > 0
              ? { document_types: requiredDocuments.document_types }
              : {},

          // ✅ JSON configs
          calculation_logic: calcLogic,
          workflow_config: workflowConf,
          admin_view_config: adminViewConf,

          version: formData.version,
          is_current_version: formData.is_current_version,
          valid_from: formData.valid_from.toISOString(),
          valid_to: formData.valid_to.toISOString(),
        };

        if (editingId) {
          await updateMutation.mutateAsync({ id: editingId, data: submitData });
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Scheme updated successfully",
          });
        } else {
          await createMutation.mutateAsync(submitData);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Scheme created successfully",
          });
        }

        resetForm();
        setShowDialog(false);
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: err.response?.data?.message || "Error saving scheme",
        });
      }
    },
    [
      formData,
      formStructure,
      formSettings,
      editingId,
      createMutation,
      updateMutation,
    ],
  );

  const handleEdit = useCallback((scheme: Scheme) => {
    const reqDocsData = scheme.required_documents || {};

    const documentTypes =
      (reqDocsData as any).document_types ||
      (Array.isArray(scheme.required_documents)
        ? scheme.required_documents
        : []);

    setRequiredDocuments({
      document_types: Array.isArray(documentTypes) ? documentTypes : [],
    });

    setFormData({
      policy_id: scheme.policy_id,
      service_id: scheme.service_id,
      scheme_name: scheme.scheme_name,
      scheme_code: scheme.scheme_code,
      cascading_config: JSON.stringify(scheme.cascading_config, null, 2),
      pop_message_config: JSON.stringify(scheme.pop_message_config, null, 2),
      form_structure_json: "[]",
      // required_documents: JSON.stringify(reqDocsArray, null, 2),
      required_documents: JSON.stringify(
        { document_types: documentTypes },
        null,
        2,
      ),
      calculation_logic: JSON.stringify(scheme.calculation_logic, null, 2),
      workflow_config: JSON.stringify(scheme.workflow_config, null, 2),
      admin_view_config: JSON.stringify(scheme.admin_view_config, null, 2),
      version: scheme.version,
      is_current_version: scheme.is_current_version,
      valid_from: new Date(scheme.valid_from),
      valid_to: new Date(scheme.valid_to),
    });

    const formStructureObj = scheme.form_structure_json || {};
    const sections =
      (formStructureObj as any).sections ||
      (Array.isArray(scheme.form_structure_json)
        ? scheme.form_structure_json
        : []);

    setFormStructure(sections);

    setFormSettings({
      is_multi_step:
        (formStructureObj as any).is_multi_step === true ||
        (scheme.workflow_config as any)?.is_multi_step === true,
      is_approved_caf_required:
        (formStructureObj as any).is_approved_caf_required === true,
    });

    setEditingId(scheme.id);
    setActiveTabIndex(0);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(
    async (scheme: Scheme) => {
      if (confirm(`Are you sure you want to delete ${scheme.scheme_name}?`)) {
        try {
          await deleteMutation.mutateAsync(scheme.id);
          toastRef.current?.show({
            severity: "success",
            summary: "Success",
            detail: "Scheme deleted successfully",
          });
        } catch (err: any) {
          toastRef.current?.show({
            severity: "error",
            summary: "Error",
            detail: "Error deleting scheme",
          });
        }
      }
    },
    [deleteMutation],
  );

  const handleToggle = useCallback(
    async (scheme: Scheme) => {
      try {
        await toggleMutation.mutateAsync(scheme.id);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `Scheme version ${
            scheme.is_current_version ? "unset" : "set"
          } as current successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: "Error updating scheme version status",
        });
      }
    },
    [toggleMutation],
  );

  const resetForm = useCallback(() => {
    setFormData({
      policy_id: 0,
      service_id: "",
      scheme_name: "",
      scheme_code: "",
      cascading_config: "{}",
      pop_message_config: "{}",
      form_structure_json: "[]",
      required_documents: "[]",
      calculation_logic: "{}",
      workflow_config: "{}",
      admin_view_config: "{}",
      version: 1,
      is_current_version: true,
      valid_from: null,
      valid_to: null,
    });
    setFormStructure([]);
    setFormSettings({ is_multi_step: false, is_approved_caf_required: false });
    setEditingId(null);
    setActiveTabIndex(0);
  }, []);

  const leftToolbarTemplate = useCallback(
    () => (
      <Button
        label="Add Scheme"
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
  const handleCopy = useCallback((scheme: Scheme) => {
    const newSchemeCode = `${scheme.scheme_code}_COPY`;

    const reqDocsData = scheme.required_documents || {};
    const documentTypes =
      (reqDocsData as any).document_types ||
      (Array.isArray(scheme.required_documents)
        ? scheme.required_documents
        : []);

    setRequiredDocuments({
      document_types: Array.isArray(documentTypes) ? documentTypes : [],
    });

    const formStructureObj = scheme.form_structure_json || {};
    const sections =
      (formStructureObj as any).sections ||
      (Array.isArray(scheme.form_structure_json)
        ? scheme.form_structure_json
        : []);

    setFormStructure(sections);

    setFormSettings({
      is_multi_step:
        (formStructureObj as any).is_multi_step === true ||
        (scheme.workflow_config as any)?.is_multi_step === true,
      is_approved_caf_required:
        (formStructureObj as any).is_approved_caf_required === true,
    });

    setFormData({
      policy_id: scheme.policy_id,
      service_id: "",
      scheme_name: `${scheme.scheme_name} (Copy)`,
      scheme_code: newSchemeCode,
      cascading_config: JSON.stringify(scheme.cascading_config, null, 2),
      pop_message_config: JSON.stringify(scheme.pop_message_config, null, 2),
      form_structure_json: JSON.stringify(scheme.form_structure_json, null, 2),
      required_documents: JSON.stringify(
        { document_types: documentTypes },
        null,
        2,
      ),
      calculation_logic: JSON.stringify(scheme.calculation_logic, null, 2),
      workflow_config: JSON.stringify(scheme.workflow_config, null, 2),
      admin_view_config: JSON.stringify(scheme.admin_view_config, null, 2),

      // 🔹 Reset versioning
      version: 1,
      is_current_version: false,

      // 🔹 Reset dates (optional – safer)
      valid_from: scheme.valid_from ? new Date(scheme.valid_from) : null,

      valid_to: scheme.valid_to ? new Date(scheme.valid_to) : null,
    });

    // VERY IMPORTANT: clear editingId so it creates new record
    setEditingId(null);

    setActiveTabIndex(0);
    setShowDialog(true);

    toastRef.current?.show({
      severity: "info",
      summary: "Copied",
      detail: "Scheme duplicated. Please review and save.",
    });
  }, []);

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Scheme Definitions</h1>
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editingId ? "Edit Scheme" : "Add New Scheme"}
        modal
        style={{ width: "85vw", height: "90vh" }}
        breakpoints={{ "1200px": "90vw", "960px": "95vw", "640px": "98vw" }}
        contentStyle={{ height: "calc(90vh - 120px)", overflow: "auto" }}
      >
        <form onSubmit={handleSubmit} className="h-100 d-flex flex-column">
          <TabView
            activeIndex={activeTabIndex}
            onTabChange={(e) => setActiveTabIndex(e.index)}
            className="flex-grow-1"
          >
            {/* Tab 1: Basic Details */}
            <TabPanel header="Basic Details" leftIcon="pi pi-info-circle me-2">
              <SchemeBasicDetailsBuilder
                formData={formData}
                policyOptions={policyOptions}
                editingId={editingId}
                onChange={handleInputChange}
              />
            </TabPanel>

            {/* Tab 2: Cascading Config */}
            <TabPanel header="Cascading" leftIcon="pi pi-sitemap me-2">
              <CascadingConfigBuilder
                value={cascadingSafe}
                formData={formData}
                policyOptions={policyOptions}
                schemeOptions={schemeOptions}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    cascading_config: JSON.stringify(val, null, 2),
                  }))
                }
              />
            </TabPanel>

            {/* Tab 3: Pop Message Config */}
            <TabPanel header="Pop Message" leftIcon="pi pi-comment me-2">
              <PopMessageBuilder
                value={popMessageSafe}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    pop_message_config: JSON.stringify(val, null, 2),
                  }))
                }
              />
            </TabPanel>

            {/* Tab 3: Form Structure */}
            <TabPanel header="Form Structure" leftIcon="pi pi-list me-2">
              <div className="p-3">
                <FormStructureBuilder
                  value={formStructure}
                  onChange={setFormStructure}
                  formSettings={formSettings}
                  onFormSettingsChange={handleFormSettingsChange}
                />
              </div>
            </TabPanel>

            {/* Tab 4: Required Documents */}
            <TabPanel header="Required Documents" leftIcon="pi pi-file me-2">
              <div className="p-3">
                <RequiredDocumentsBuilder
                  value={requiredDocuments}
                  onChange={setRequiredDocuments}
                  availableFields={allFormFields} // <-- Pass field_code dropdown options here
                />
              </div>
            </TabPanel>

            {/* Tab 5: Workflow Config */}
            <TabPanel header="Workflow" leftIcon="pi pi-sitemap me-2">
              <div className="p-3">
                <WorkflowBuilder
                  value={workflowSafe}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      workflow_config: JSON.stringify(val, null, 2),
                    }))
                  }
                  // availableRoles={roleOptions}
                  availableFields={allFormFields}
                />
              </div>
            </TabPanel>

            {/* Tab 6: Admin View Config */}
            <TabPanel header="Admin View" leftIcon="pi pi-user">
              <div className="p-3">
                <AdminBuilder
                  value={adminviewSafe}
                  workflowConfig={workflowSafe}
                  availableFields={allFormFields}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      admin_view_config: JSON.stringify(val, null, 2), // save as JSON string
                    }))
                  }
                  // availableFields={allFormFields} // optional: if AdminBuilder uses these
                />
              </div>
            </TabPanel>
          </TabView>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between gap-2 p-3 border-top">
            {/* Previous Button */}
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              severity="secondary"
              type="button"
              disabled={activeTabIndex === 0}
              onClick={() => setActiveTabIndex((prev) => Math.max(0, prev - 1))}
            />

            <div className="d-flex gap-2">
              {/* Cancel Button */}
              <Button
                label="Cancel"
                icon="pi pi-times"
                severity="secondary"
                outlined
                type="button"
                onClick={() => setShowDialog(false)}
              />

              {/* Next or Submit Button */}
              {activeTabIndex < 6 ? (
                <Button
                  label="Next"
                  icon="pi pi-chevron-right"
                  iconPos="right"
                  type="button"
                  onClick={async () => {
                    const success = await saveScheme();
                    if (success) {
                      setActiveTabIndex((prev) => Math.min(6, prev + 1));
                    }
                  }}
                />
              ) : (
                <Button
                  label={editingId ? "Update Scheme" : "Create Scheme"}
                  icon="pi pi-check"
                  type="button"
                  severity="success"
                  loading={createMutation.isPending || updateMutation.isPending}
                  onClick={async () => {
                    const success = await saveScheme();
                    if (success) {
                      setShowDialog(false);
                      resetForm();
                    }
                  }}
                />
              )}
            </div>
          </div>
        </form>
      </Dialog>

      <ReusableDataTable<Scheme>
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
