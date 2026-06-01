"use client";

import { useRef, useState } from "react";

interface DocumentUploadProps {
  label: string;
  field: string;                 // DB field name
  value?: string | null;          // existing file path
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;

  onUpload: (file: File) => Promise<string>;
  onChange: (field: string, value: string | null) => void;
}

export default function DocumentUpload({
  label,
  field,
  value,
  onUpload,
  onChange,
  disabled = false,
  accept = ".pdf,.jpg,.jpeg,.png",
  maxSizeMB = 5,
}: DocumentUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Max file size is ${maxSizeMB} MB`);
      return;
    }

    setUploading(true);
    try {
      const path = await onUpload(file);
      onChange(field, path);
    } catch {
      alert("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="col-md-4">
      <label className="form-label fw-semibold hidden">{label}</label>

      {value ? (
        <div className="d-flex gap-2">
          <a
            href={value}
            target="_blank"
            className="btn btn-sm btn-outline-primary"
          >
            View
          </a>

          {!disabled && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={() => fileRef.current?.click()}
              >
                Replace
              </button>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => onChange(field, null)}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={uploading || disabled}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
