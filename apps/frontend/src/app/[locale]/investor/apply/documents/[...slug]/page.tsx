"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import apiClient from "@/lib/api-client"; // your API helper
import { ProgressSpinner } from "primereact/progressspinner";

/* -------------------- Types -------------------- */
// Types
interface SchemeData {
  id: string;
  policy_id: string;
  scheme_name: string;
  scheme_code: string;
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
interface RequiredDocument {
  document_id: number;
  description?: string;
  is_mandatory: boolean;
  max_size_mb: number;
  allowed_types: string[];
  condition?: {
    field_code: string;
    operator: "equals";
    value: any;
  };
  document_meta: {
    checklistDocumentName: string;
  };
}

/* -------------------- Page -------------------- */
export default function DocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const toastRef = useRef<Toast>(null);

  const [policyCode, schemeCode, version] = params.slug as string[];

  // Load documents & form data from localStorage
  const [documents, setDocuments] = useState<RequiredDocument[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [scheme, setScheme] = useState<SchemeData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isUploaded = (docId: number) => Boolean(uploadedFiles[docId]);

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

  useEffect(() => {
    const fetchRequiredDocuments = async () => {
      if (!policyCode || !schemeCode) {
        setError("Invalid URL: policy or scheme code missing");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append("policy_code", policyCode);
        params.append("scheme_code", schemeCode);
        params.append("version", version.replace("v", ""));

        const response = await apiClient.get(
          `/master/schemes/by-code?${params}`,
        );

        const data = response.data;

        // Correct extraction of documents
        if (
          !data.required_documents ||
          !Array.isArray(data.required_documents.documents)
        ) {
          throw new Error("No documents found for this scheme");
        }

        setDocuments(data.required_documents.documents);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch documents",
        );
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequiredDocuments();
  }, [policyCode, schemeCode, version]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <ProgressSpinner />
      </div>
    );
  }

  if (error) {
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

  /* -------------------- Condition Evaluator -------------------- */
  const shouldRenderDocument = (doc: RequiredDocument) => {
    if (!doc.condition) return true;
    const { field_code, operator, value } = doc.condition;
    const formValue = formData[field_code];
    if (operator === "equals") return formValue === value;
    return true;
  };

  /* -------------------- Upload Handler -------------------- */
  const handleFileSelect = (docId: number, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
  };

  /* -------------------- Submit Documents -------------------- */
  const handleSubmitDocuments = async () => {
    const mandatoryDocsMissing = documents.some(
      (doc) =>
        doc.is_mandatory &&
        shouldRenderDocument(doc) &&
        !uploadedFiles[doc.document_id],
    );

    if (mandatoryDocsMissing) {
      toastRef.current?.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Please upload all mandatory documents",
      });
      return;
    }

    try {
      setSubmitting(true);

      const formPayload = new FormData();
      Object.entries(uploadedFiles).forEach(([docId, file]) => {
        formPayload.append(`documents[${docId}]`, file);
      });
      formPayload.append("policy_code", policyCode);
      formPayload.append("scheme_code", schemeCode);
      formPayload.append("version", version.replace("v", ""));

      await fetch("/applications/documents/upload", {
        method: "POST",
        body: formPayload,
      });

      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Documents uploaded successfully",
      });

      router.push("/investor/applications");
    } catch (err) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to upload documents",
      });
    } finally {
      setSubmitting(false);
    }
  };
  const visibleDocuments = Array.isArray(documents) ? documents : [];
  const mandatoryDocuments = visibleDocuments.filter((doc) => doc.is_mandatory);
  console.log(documents);
  const optionalDocuments = visibleDocuments.filter((doc) => !doc.is_mandatory);
  return (
    <div className="p-6 bg-white">
      <Toast ref={toastRef} />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {scheme?.scheme_name}
        </h1>
        <p className="text-gray-500 mt-1">
          Upload the required documents to proceed with your application.
        </p>
      </div>

      {/* Mandatory Documents */}
      {mandatoryDocuments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-3">
            Mandatory Documents
          </h3>

          {mandatoryDocuments.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between border-l-4 border-red-500 bg-red-50 rounded-lg p-4 mb-4"
            >
              <div className="flex-1 pr-6">
                <h5 className="font-medium text-gray-800">
                  {doc.document_meta.checklistDocumentName}
                </h5>
                {doc.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {doc.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Allowed: {doc.allowed_types.join(", ").toUpperCase()} | Max{" "}
                  {doc.max_size_mb} MB
                </p>
              </div>

              <div className="text-right">
                {isUploaded(doc.document_id) ? (
                  <div className="text-green-600 text-sm font-medium mb-2">
                    ✔ Uploaded
                  </div>
                ) : (
                  <div className="text-red-600 text-sm font-medium mb-2">
                    Required
                  </div>
                )}

                <FileUpload
                  mode="basic"
                  name="file"
                  accept={doc.allowed_types.map((t) => `.${t}`).join(",")}
                  maxFileSize={doc.max_size_mb * 1024 * 1024}
                  chooseLabel={
                    isUploaded(doc.document_id) ? "Replace File" : "Upload File"
                  }
                  customUpload
                  uploadHandler={(e) =>
                    handleFileSelect(doc.document_id, e.files[0])
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optional Documents */}
      {optionalDocuments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Optional Documents
          </h3>

          {optionalDocuments.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-center justify-between border rounded-lg p-4 mb-4 bg-white"
            >
              <div className="flex-1 pr-6">
                <h5 className="font-medium text-gray-800">
                  {doc.document_meta.checklistDocumentName}
                </h5>
                {doc.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {doc.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Allowed: {doc.allowed_types.join(", ").toUpperCase()} | Max{" "}
                  {doc.max_size_mb} MB
                </p>
              </div>

              <div className="text-right">
                {isUploaded(doc.document_id) && (
                  <div className="text-green-600 text-sm font-medium mb-2">
                    ✔ Uploaded
                  </div>
                )}

                <FileUpload
                  mode="basic"
                  name="file"
                  accept={doc.allowed_types.map((t) => `.${t}`).join(",")}
                  maxFileSize={doc.max_size_mb * 1024 * 1024}
                  chooseLabel={
                    isUploaded(doc.document_id) ? "Replace File" : "Upload File"
                  }
                  customUpload
                  uploadHandler={(e) =>
                    handleFileSelect(doc.document_id, e.files[0])
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Action */}
      <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Mandatory documents uploaded:{" "}
          <strong>
            {
              mandatoryDocuments.filter((d) => uploadedFiles[d.document_id])
                .length
            }
            /{mandatoryDocuments.length}
          </strong>
        </p>

        <Button
          label="Submit Documents"
          icon="pi pi-check"
          loading={submitting}
          disabled={mandatoryDocuments.some(
            (d) => !uploadedFiles[d.document_id],
          )}
          onClick={handleSubmitDocuments}
        />
      </div>
    </div>
  );
}
