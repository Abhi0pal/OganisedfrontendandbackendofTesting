"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import {
  DynamicFormRenderer,
  useDynamicForm,
} from "@/components/forms/DynamicFormRenderer";
import { useFields } from "@/hooks/master/useFields";
import apiClient from "@/lib/api-client";
import PreFormPopup from "@/components/forms/PreFormPopup";
import { useAuth } from "@/hooks/useAuth";
import { useServiceDms } from "@/hooks/master/useServiceDms";
import CommonDocumentPage from "@/components/common/CommonDocumentPage";
import { useIncentiveApplicationSubmissions } from "@/hooks/master/useIncentiveApplicationSubmissions";

// Types
interface SchemeData {
  id: number;
  policy_id: number;
  service_id: string;
  scheme_name: string;
  scheme_code: string;
  cascading_config: any[];
  pop_message_config: {
    enabled: boolean;
    title?: string;
    sections?: any[];
    acknowledgement_text?: string;
  } | null;
  form_structure_json: any[];
  required_documents: any;
  workflow_config?: {
    submit_url?: string;
    draft_url?: string;
    is_multi_step?: boolean;
    stages?: any[];
  };
  version: number;
  is_current_version: boolean;
  valid_from: string;
  valid_to: string;
  policy?: {
    policy_code: string;
    policy_name: string;
  };
}

type RuleNode = {
  type: "rule";
  field_code: string;
  operator: string;
  value?: any;
};

type GroupNode = {
  type: "group";
  operator?: "AND" | "OR";
  children: Array<RuleNode | GroupNode>;
};

type ConditionNode = RuleNode | GroupNode;

interface CreateFlowlogPayload {
  applicationId: number;
  currentRoleId: number;
  nextRoleId?: number;
  userId?: number;
  approvalStatus: "V" | "P";
  actionStatus: "SUBMITTED" | "DRAFT";
  remarks?: string;
  additionalPostData?: string;
  userAgent?: string;
  remoteIpAddress?: string;
  status?: "Y" | "N";
}

export default function ApplicationFormPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);
  const { user, logout } = useAuth();
  // Extract dynamic params
  const slugArray = params.slug as string[];
  const policyCode = slugArray?.[0];
  const schemeCode = slugArray?.[1];
  const versionParam = slugArray?.[2];

  const [scheme, setScheme] = useState<SchemeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showPrePopup, setShowPrePopup] = useState(false);
  const [popupAcknowledged, setPopupAcknowledged] = useState(false);

  const { data: fieldMaster = [], isLoading: fieldsLoading } = useFields();

  const version = versionParam
    ? parseInt(versionParam.replace("v", ""))
    : undefined;

  const service_id = scheme?.service_id;
  const { data: serviceDetails, isLoading } = useServiceDms(service_id ?? null);
  // ================== APPLICATION GATING (Allow Apply?) ==================

  // Fetch all submissions for this scheme (we'll filter to current user)
  const { data: schemeSubmissions = [], isLoading: appsLoading } =
    useIncentiveApplicationSubmissions(
      scheme?.id
        ? { incentiveId: scheme.id, userId: Number(user?.id) }
        : undefined,
    );
  // Helper: find owner of submission (customize keys if backend differs)
  const getAppOwnerId = (app: any): string | null => {
    const candidate =
      app?.userId ??
      app?.investorId ??
      app?.createdBy ??
      app?.created_by ??
      app?.createdById ??
      app?.created_user_id ??
      null;
    return candidate != null ? String(candidate) : null;
  };

  const getAppOwnerEmail = (app: any): string | null => {
    const candidate =
      app?.userEmail ?? app?.investorEmail ?? app?.email ?? null;
    return candidate != null ? String(candidate).toLowerCase() : null;
  };

  const isOwnedBy = (app: any, u: any): boolean => {
    if (!u) return false;
    const uid = u?.id != null ? String(u.id) : null;
    const aid = getAppOwnerId(app);
    if (uid && aid && uid === aid) return true;

    const uEmail = (u?.email || u?.username || u?.userName || "").toLowerCase();
    const aEmail = getAppOwnerEmail(app);
    return !!uEmail && !!aEmail && uEmail === aEmail;
  };

  // Only this user's applications for this scheme
  const myAppsForScheme = useMemo(() => {
    if (!user) return [];
    return (schemeSubmissions || []).filter((app: any) => isOwnedBy(app, user));
  }, [schemeSubmissions, user]);

  // Normalize reverted-like statuses
  const normalizeStatus = (s?: string) => {
    if (!s) return s;
    if (s === "REVERT_BACK") return "REVERTED";
    return s;
  };

  // Business rule:
  // - 0 apps  -> allow
  // - 1 app   -> allow only if status is REVERTED
  // - else    -> block
  const canApply = useMemo(() => {
    if (!scheme || !user || appsLoading) return null; // not ready
    const count = myAppsForScheme.length;
    // First time applying
    if (count === 0) return true;
    if (count === 1) {
      const status = normalizeStatus(myAppsForScheme[0]?.applicationStatus);
      // Allow edit if REVERTED or DRAFT
      return status === "REVERTED" || status === "DRAFT";
    }
    // More than one application → strictly not allowed
    return false;
  }, [scheme, user, appsLoading, myAppsForScheme]);

  // Fetch scheme data
  useEffect(() => {
    const fetchScheme = async () => {
      if (!policyCode || !schemeCode) {
        setError("Invalid URL. Please provide policy and scheme codes.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("policy_code", policyCode);
        params.append("scheme_code", schemeCode);
        if (version) {
          params.append("version", version.toString());
        }

        const response = await apiClient.get(
          `/master/schemes/by-code?${params}`,
        );
        const data = response.data;

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.id) {
          throw new Error("Scheme not found");
        }

        setScheme(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Failed to load scheme",
        );
        setScheme(null);
      } finally {
        setLoading(false);
      }
    };

    fetchScheme();
  }, [policyCode, schemeCode, version]);
  const popConfig = Array.isArray(scheme?.pop_message_config)
    ? scheme?.pop_message_config?.[0]
    : scheme?.pop_message_config;

  const isPopupEnabled = popConfig?.enabled === true;
  const canGoBackToPrePopup = isPopupEnabled && activeStep === 0;

  useEffect(() => {
    if (scheme && isPopupEnabled) {
      setShowPrePopup(true);
      setPopupAcknowledged(false);
    }
  }, [scheme, isPopupEnabled]);

  // Extract sections from form_structure_json (handles both old array and new object formats)
  // Moved before useDynamicForm so we can pass formSections to the hook for calculations
  const formStructureObj = (scheme?.form_structure_json || {}) as {
    sections?: any[];
    is_multi_step?: boolean;
  };
  const formSections =
    formStructureObj.sections ||
    (Array.isArray(scheme?.form_structure_json)
      ? scheme?.form_structure_json
      : []);

  // Pass formSections to useDynamicForm for calculation support
  const { values, errors, handleChange, setValues, validate, reset } =
    useDynamicForm({}, formSections, scheme?.service_id);

  // Prefill form values if user is editing a REVERTED submission
  useEffect(() => {
    if (!scheme || !user || canApply !== true) return;

    // In REVERTED case, we allowed apply only if exactly 1 record exists
    if (myAppsForScheme.length === 1) {
      const existing = myAppsForScheme[0];

      try {
        const parsedPostData =
          typeof existing.postData === "string"
            ? JSON.parse(existing.postData || "{}")
            : existing.postData || {};

        // Hydrate the form values with previously filled data
        setValues((prev) => ({
          ...prev,
          ...parsedPostData,
          submissionId: existing.id,
          departmentId: existing.departmentId, // may be null/undefined; OK
        }));

        // Optional: if you want to start from step 0 while editing, uncomment:
        // setActiveStep(0);
      } catch (e) {
        // If parsing fails, just skip and let the user start fresh
        console.error("Failed to parse existing postData", e);
      }
    }
  }, [scheme, user, canApply, myAppsForScheme, setValues]);

  // Get config from workflow_config
  const submitUrl = scheme?.workflow_config?.submit_url || "/applications";
  const draftUrl = scheme?.workflow_config?.draft_url;

  // Check if multi-step from form_structure_json or workflow_config
  const isMultiStepFromForm = formStructureObj.is_multi_step === true;
  const isMultiStep =
    isMultiStepFromForm || scheme?.workflow_config?.is_multi_step === true;

  // Group sections by step_number for multi-step mode
  const stepGroups = isMultiStep
    ? (() => {
        const groups: { stepNumber: number; sections: any[] }[] = [];
        const stepMap = new Map<number, any[]>();

        formSections.forEach((section: any) => {
          const stepNum = section.step_number || 1;
          if (!stepMap.has(stepNum)) {
            stepMap.set(stepNum, []);
          }
          stepMap.get(stepNum)!.push(section);
        });

        // Sort by step number
        const sortedSteps = Array.from(stepMap.entries()).sort(
          (a, b) => a[0] - b[0],
        );
        sortedSteps.forEach(([stepNumber, sections]) => {
          groups.push({ stepNumber, sections });
        });

        return groups;
      })()
    : [];

  const documentStepIndex = isMultiStep
    ? stepGroups.length
    : formSections.length;

  const totalSteps = documentStepIndex + 1;

  const currentStepSections = isMultiStep
    ? stepGroups[activeStep]?.sections || []
    : [formSections[activeStep]].filter(Boolean);

  const evaluateCondition = (
    condition: ConditionNode | undefined,
    formValues: Record<string, any>,
  ): boolean => {
    if (!condition) return true;

    // -----------------------
    // RULE NODE
    // -----------------------
    if (condition.type === "rule") {
      const fieldValue = formValues?.[condition.field_code];
      const conditionValue = condition.value;

      switch (condition.operator) {
        case "equals":
          return fieldValue == conditionValue;

        case "not_equals":
          return fieldValue != conditionValue;

        case "in":
          return Array.isArray(conditionValue)
            ? conditionValue.includes(fieldValue)
            : false;

        case "not_in":
          return Array.isArray(conditionValue)
            ? !conditionValue.includes(fieldValue)
            : false;

        case "greater_than":
          return Number(fieldValue) > Number(conditionValue);

        case "less_than":
          return Number(fieldValue) < Number(conditionValue);

        case "contains":
          return typeof fieldValue === "string" &&
            typeof conditionValue === "string"
            ? fieldValue.includes(conditionValue)
            : false;

        case "is_empty":
          return (
            fieldValue === undefined ||
            fieldValue === null ||
            fieldValue === "" ||
            (typeof fieldValue === "string" && fieldValue.trim() === "")
          );

        case "is_not_empty":
          return !(
            fieldValue === undefined ||
            fieldValue === null ||
            fieldValue === "" ||
            (typeof fieldValue === "string" && fieldValue.trim() === "")
          );

        default:
          return true;
      }
    }

    // -----------------------
    // GROUP NODE (Recursive)
    // -----------------------
    if (condition.type === "group") {
      const { children = [], operator = "AND" } = condition;

      if (!Array.isArray(children) || children.length === 0) {
        return true;
      }

      const results = children.map((child) =>
        evaluateCondition(child, formValues),
      );

      if (operator === "OR") {
        return results.some(Boolean);
      }

      // Default AND
      return results.every(Boolean);
    }

    return true;
  };

  const resolveDepartmentRole = (
    stages: any[],
    formValues: Record<string, any>,
  ): number | null => {
    if (!Array.isArray(stages) || stages.length === 0) {
      return null;
    }

    for (const stage of stages) {
      const condition: ConditionNode | undefined = stage?.condition;

      // 🟢 If condition exists → evaluate
      if (condition) {
        const isMatch = evaluateCondition(condition, formValues);

        if (isMatch) {
          return Number(stage.current_role);
        }

        // ❌ Condition failed → move to next stage
        continue;
      }

      // 🟡 No condition → follow sequentially
      return Number(stage.current_role);
    }

    return null;
  };

  const resolveWorkflowStage = (
    stages: any[],
    formValues: Record<string, any>,
  ) => {
    if (!Array.isArray(stages) || stages.length === 0) {
      return null;
    }

    for (const stage of stages) {
      const condition: ConditionNode | undefined = stage?.condition;

      // 🟢 If condition exists → evaluate
      if (condition) {
        const isMatch = evaluateCondition(condition, formValues);

        if (isMatch) {
          return stage;
        }

        // ❌ Condition failed → move to next stage
        continue;
      }

      // 🟡 No condition → follow sequentially
      return stage;
    }

    return null;
  };

  const saveToIncentiveSubmission = async (
    currentValues: any,
    currentStepNumber: number,
    applicationStatus: "DRAFT" | "SUBMITTED" = "DRAFT",
  ): Promise<{ id: number; departmentId: number }> => {
    if (!scheme) {
      throw new Error("Scheme not loaded");
    }

    try {
      setSavingDraft(true);

      if (!user?.id) {
        throw new Error("User not loaded");
      }

      const stages = scheme?.workflow_config?.stages || [];
      if (!stages.length) {
        throw new Error("Workflow stages not configured");
      }

      // Resolve department dynamically based on current form values
      const resolvedDepartmentRole = resolveDepartmentRole(
        stages,
        currentValues,
      );
      if (!resolvedDepartmentRole) {
        throw new Error("No workflow stage matched the submitted form data");
      }

      const isEdit = Boolean(currentValues.submissionId);

      // Build DTO. If editing, keep the existing registrationNo if you have it in values
      const dto: any = {
        userId: Number(user.id),
        incentiveId: Number(scheme.id),
        departmentId: resolvedDepartmentRole,
        postData: JSON.stringify(currentValues),
        applicationStatus,
        status: "Y",
        installmentNo: 1,
        fy: "2025-26",
      };

      // For NEW submission only: generate a registration number
      if (!isEdit) {
        dto.registrationNo = `${policyCode}/${schemeCode}/${versionParam}/${Number(user.id)}`;
      }

      if (isEdit) {
        // 🔄 UPDATE existing submission
        const res = await apiClient.put(
          `/incentive-application-submission/${currentValues.submissionId}`,
          dto,
        );

        toastRef.current?.show({
          severity: "success",
          summary:
            applicationStatus === "DRAFT"
              ? "Progress Saved"
              : "Application Updated",
          detail:
            applicationStatus === "DRAFT"
              ? "Draft updated successfully."
              : "Application updated successfully.",
          life: 2000,
        });

        return {
          id: res.data?.id ?? currentValues.submissionId,
          departmentId: res.data?.departmentId ?? currentValues.departmentId,
        };
      } else {
        // 🆕 CREATE new submission
        const res = await apiClient.post(
          "/incentive-application-submission",
          dto,
        );

        toastRef.current?.show({
          severity: "success",
          summary:
            applicationStatus === "DRAFT"
              ? "Progress Saved"
              : "Application Submitted",
          detail:
            applicationStatus === "DRAFT"
              ? "Form data saved successfully."
              : "Application submitted successfully.",
          life: 2000,
        });

        return {
          id: res.data?.id,
          departmentId: res.data?.departmentId,
        };
      }
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          err.message ||
          "Failed to save form data",
        life: 3000,
      });
      throw err;
    } finally {
      setSavingDraft(false);
    }
  };

  const createFirstLevelFlowlog = async (
    applicationId: number,
    applicationStatus: "SUBMITTED",
    formValues: Record<string, any>,
  ) => {
    if (!scheme || !user?.id) return;

    const stages = scheme?.workflow_config?.stages || [];

    // 🔥 Resolve stage dynamically
    const resolvedStage = resolveWorkflowStage(stages, formValues);

    if (!resolvedStage?.current_role) {
      throw new Error("No matching workflow stage found for flowlog");
    }

    const departmentRoleId = Number(resolvedStage.current_role);

    // 🔹 Applicant role (as per your system)
    const applicantRoleId = Number(user.id);

    /* -------------------------------------------------
     * ENTRY 1: Applicant → Resolved Department
     * ------------------------------------------------- */
    const applicantFlowlog = {
      applicationId,
      currentRoleId: applicantRoleId,
      nextRoleId: departmentRoleId,
      userId: Number(user.id),

      approvalStatus: "V", // Verified / Submitted
      actionStatus: applicationStatus,

      remarks: "Application submitted by applicant",
      additionalPostData: null,

      userAgent: navigator.userAgent,
      remoteIpAddress: null,
      status: "Y",
    };

    /* -------------------------------------------------
     * ENTRY 2: Department Inbox Entry
     * ------------------------------------------------- */
    const departmentFlowlog = {
      applicationId,
      currentRoleId: departmentRoleId,
      nextRoleId: null,
      userId: null,

      approvalStatus: "P", // Pending
      actionStatus: "DRAFT",

      remarks: `Application received for scrutiny (${resolvedStage.stage_name})`,
      additionalPostData: null,

      userAgent: null,
      remoteIpAddress: null,
      status: "Y",
    };

    // 🔥 Sequential insert → preserves timeline
    await apiClient.post("/incentive-application-flowlog", applicantFlowlog);

    await apiClient.post("/incentive-application-flowlog", departmentFlowlog);
  };

  // Navigation
  const handleNext = async () => {
    if (!isDocumentStep) {
      // Validate form
      const isValid = validate(currentStepSections, fieldMaster);

      if (!isValid) {
        toastRef.current?.show({
          severity: "error",
          summary: "Validation Error",
          detail: "Please fill all required fields.",
          life: 3000,
        });
        return;
      }

      // 🔥 Always save as DRAFT before moving forward
      const response = await saveToIncentiveSubmission(
        values,
        activeStep,
        "DRAFT",
      );

      setValues((prev) => ({
        ...prev,
        submissionId: response.id,
        departmentId: response.departmentId,
      }));
    }

    setActiveStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevious = () => {
    if (canGoBackToPrePopup) {
      setShowPrePopup(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!draftUrl) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Draft URL is not available",
        life: 3000,
      });
      return;
    }

    try {
      setSavingDraft(true);
      await apiClient.post(draftUrl, {
        scheme_id: scheme?.id,
        form_data: values,
        current_step: activeStep,
      });
      toastRef.current?.show({
        severity: "success",
        summary: "Draft Saved",
        detail: "Your progress has been saved.",
        life: 2000,
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err.response?.data?.message || "Failed to save draft",
        life: 3000,
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validate(formSections, fieldMaster);

    if (!isValid) {
      toastRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please fix all errors before submitting.",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await saveToIncentiveSubmission(
        values,
        activeStep,
        "DRAFT",
      );

      setValues((prev) => ({
        ...prev,
        submissionId: response.id,
        departmentId: response.departmentId,
      }));

      await createFirstLevelFlowlog(response.id, "SUBMITTED", values);

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Application submitted successfully!",
        life: 3000,
      });

      setTimeout(() => {
        router.push("/investor/dashboard");
      }, 2000);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          err.message ||
          "Failed to submit application",
        life: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };
  const handleDocumentSubmit = async () => {
    if (!values.submissionId) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Application not saved properly.",
        life: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      // 🔥 Update application to SUBMITTED using central save function
      const response = await saveToIncentiveSubmission(
        values,
        activeStep,
        "SUBMITTED",
      );

      // Ensure latest IDs are stored (safety)
      setValues((prev) => ({
        ...prev,
        submissionId: response.id,
        departmentId: response.departmentId,
      }));

      // 🔥 Create workflow flowlog AFTER submission
      await createFirstLevelFlowlog(response.id, "SUBMITTED", values);

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Application submitted successfully!",
        life: 3000,
      });

      setTimeout(() => {
        router.push("/investor/dashboard");
      }, 2000);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail:
          err.response?.data?.message ||
          err.message ||
          "Failed to submit application",
        life: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (scheme) {
      // Pre-fill required_documents if scheme has them
      if (scheme.required_documents?.documents?.length) {
        setValues((prevValues) => ({
          ...prevValues,
          required_documents: scheme.required_documents.documents.map(
            (doc: any) => ({
              ...doc,
              value: doc.value || "", // existing value if any
            }),
          ),
        }));
      }
    }
  }, [scheme, setValues]);

  // Loading
  if (loading || fieldsLoading || appsLoading || canApply === null) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <ProgressSpinner />
      </div>
    );
  }

  // Error
  if (error || !scheme) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Scheme Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            {error || "The requested scheme could not be found."}
          </p>
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }
  // Block opening the form if business rule fails
  if (canApply === false) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-ban text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            You cannot submit a new application for this scheme
          </h2>
          <p className="text-gray-600 mb-4">
            New submissions are allowed only if you have no prior application
            for this scheme, or if your existing application is in{" "}
            <b>REVERTED</b> status.
          </p>

          {/* Small helper: show what the system detected */}
          <div className="text-sm text-gray-500 mb-4">
            {myAppsForScheme.length === 0 ? (
              "No prior applications found (unexpected block)."
            ) : myAppsForScheme.length === 1 ? (
              <>
                Status detected:{" "}
                <b>
                  {normalizeStatus(myAppsForScheme[0]?.applicationStatus) ||
                    "-"}
                </b>
              </>
            ) : (
              <>Multiple applications detected.</>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              label="Go to Dashboard"
              icon="pi pi-home"
              className="p-button-outlined p-button-secondary"
              onClick={() => router.push("/investor/dashboard")}
            />
            {myAppsForScheme.length === 1 && (
              <a
                href={`/investor/incentive/print/${myAppsForScheme[0].id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary"
              >
                View Application
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }
  // No form structure
  if (formSections.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="pi pi-file-edit text-blue-600 text-2xl"></i>
          </div>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Form Not Configured
          </h2>
          <p className="text-gray-500 mb-4">
            The application form for this scheme has not been configured yet.
          </p>
          <Button
            label="Go Back"
            icon="pi pi-arrow-left"
            className="p-button-outlined"
            onClick={() => router.back()}
          />
        </div>
      </div>
    );
  }

  // const isLastStep = activeStep === formSections.length - 1;
  const isDocumentStep = activeStep === documentStepIndex;
  const isLastStep = activeStep === totalSteps - 1;

  const isFirstStep = activeStep === 0;
  const totalStepsWithDocuments = stepGroups.length + 1;

  const progressPercentage = Math.round(
    (activeStep / totalStepsWithDocuments) * 100,
  );

  return (
    <div className="p-6">
      <Toast ref={toastRef} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {scheme.scheme_name}
        </h1>
      </div>
      {myAppsForScheme.length === 1 &&
        normalizeStatus(myAppsForScheme[0]?.applicationStatus) ===
          "REVERTED" && (
          <div className="mb-4 p-3 rounded border border-warning bg-warning bg-opacity-10 text-warning">
            <i className="pi pi-info-circle me-2" />
            You are updating a <b>reverted</b> application. Please review your
            entries and submit again.
          </div>
        )}

      <div className="d-flex gap-3">

      {/* Progress Steps - Only show in multi-step mode with multiple steps */}
      {isMultiStep && totalSteps > 1 && (
        <div className="bg-[#FFEFEF] rounded-lg p-4 mb-6">
          {/* 🔹 Percentage Header */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">
              Form Progress
            </span>
            <span className="text-sm font-semibold text-primary">
              {progressPercentage}%
            </span>
          </div>

          {/* 🔹 Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* 🔹 Step Circles */}
          <div className="flex items-start flex-column">
            {[...stepGroups, { isDocumentStep: true }].map(
              (group: any, index: number) => {
                const isLast = index === stepGroups.length;

                return (
                  <div key={index} className="flex w-100 flex-1 mb-2 flex-column">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index < activeStep
                            ? "bg-green-500 text-white"
                            : index === activeStep
                              ? "bg-primary text-white"
                              : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {index < activeStep ? (
                          <i className="pi pi-check text-xs"></i>
                        ) : (
                          index + 1
                        )}
                      </div>

                      <span
                        className={`ml-2 text-sm hidden md:block ${
                          index === activeStep
                            ? "font-medium text-gray-800"
                            : "text-gray-500"
                        }`}
                      >
                        {isLast
                          ? "Supporting Documents"
                          : group.sections?.[0]?.section_title ||
                            `Step ${group.stepNumber}`}
                      </span>
                    </div>

                    {index < totalStepsWithDocuments - 1 && (
                      <div
                        className={`flex-none h-[30px] w-[2px] ml-[16px] mt-2 rounded  ${
                          index < activeStep ? "bg-[#D3B3B3]" : "bg-[#D3B3B3]"
                        }`}
                      ></div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {isPopupEnabled && (
        <PreFormPopup
          visible={showPrePopup}
          title={popConfig?.title}
          sections={popConfig?.sections}
          acknowledgementText={popConfig?.acknowledgement_text}
          acknowledged={popupAcknowledged}
          onAcknowledgeChange={setPopupAcknowledged}
          onContinue={() => setShowPrePopup(false)}
          onHide={() => setShowPrePopup(false)}
        />
      )}

      {/* Form */}
      <div
        className={
          isPopupEnabled && showPrePopup ? "pointer-events-none opacity-50" : "flex-1"
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Render based on mode */}
          {isDocumentStep ? (
            <CommonDocumentPage
              serviceId={scheme.service_id}
              submissionId={values.submissionId}
              deptId={values.departmentId}
            />
          ) : isMultiStep ? (
            currentStepSections.length > 0 && (
              <DynamicFormRenderer
                formStructure={currentStepSections}
                fieldMaster={fieldMaster}
                values={values}
                serviceId={scheme?.service_id}
                onChange={handleChange}
                errors={errors}
                requiredDocuments={values.required_documents}
              />
            )
          ) : (
            <DynamicFormRenderer
              formStructure={formSections}
              fieldMaster={fieldMaster}
              values={values}
              serviceId={scheme?.service_id}
              onChange={handleChange}
              errors={errors}
              requiredDocuments={values.required_documents}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            {/* Previous button - only in multi-step mode */}
            {isMultiStep ? (
              <Button
                label={canGoBackToPrePopup ? "Back" : "Previous"}
                icon="pi pi-chevron-left"
                className="p-button-outlined p-button-secondary btn btn-secondary"
                type="button"
                disabled={!canGoBackToPrePopup && activeStep === 0}
                onClick={handlePrevious}
              />
            ) : (
              <div></div>
            )}

            <div className="flex gap-3">
              {draftUrl && (
                <Button
                  label="Save Draft"
                  icon="pi pi-save"
                  className="p-button-outlined"
                  type="button"
                  loading={savingDraft}
                  onClick={handleSaveDraft}
                />
              )}

              {!isDocumentStep ? (
                <Button
                  label="Next"
                  icon="pi pi-chevron-right"
                  className="btn btn-primary"
                  iconPos="right"
                  type="button"
                  onClick={handleNext}
                />
              ) : (
                <Button
                  label="Submit Application"
                  icon="pi pi-check"
                  className="p-button-success btn btn-success"
                  type="button"
                  loading={submitting}
                  onClick={handleDocumentSubmit}
                />
              )}
            </div>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
