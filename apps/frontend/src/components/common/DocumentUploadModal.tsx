'use client';

import React from 'react';

type UploadFormState = {
  uploadType: 'new' | 'duplicate';
  comments: string;
  validFrom: string;
  validTo: string;
  docDateOfIssuance: string;
  isDocumentActive: string;
  file: File | null;
};

interface DocumentUploadModalProps {
  isOpen: boolean;
  doc: {
    extension?: string;
    isMultiVersionAllowed?: boolean;
    isDocValidityRequired?: boolean;
  } | null;
  uploadForm: UploadFormState;
  setUploadForm: (next: UploadFormState) => void;
  uploadError: string;
  uploading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  buildAccept: (ext?: string) => string;
}

export default function DocumentUploadModal({
  isOpen,
  doc,
  uploadForm,
  setUploadForm,
  uploadError,
  uploading,
  onClose,
  onSubmit,
  buildAccept,
}: DocumentUploadModalProps) {
  if (!isOpen || !doc) return null;

  const selectedFileName = uploadForm.file?.name || 'No file selected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-[560px] max-w-[90vw] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Upload Document</h3>
          <button type="button" onClick={onClose} className="text-gray-500">
            ×
          </button>
        </div>

        <div className="space-y-3">
          {doc?.isMultiVersionAllowed !== false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Type</label>
              <select
                value={uploadForm.uploadType}
                onChange={(event) =>
                  setUploadForm({
                    ...uploadForm,
                    uploadType: event.target.value as 'new' | 'duplicate',
                  })
                }
                className="w-full px-3 py-2.5 border rounded text-sm bg-gray-50 border-gray-300"
              >
                <option value="new">New</option>
                <option value="duplicate">Replace</option>
              </select>
            </div>
          )}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Select File</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700">
                Choose file
                <input
                  type="file"
                  accept={buildAccept(doc.extension)}
                  onChange={(event) =>
                    setUploadForm({
                      ...uploadForm,
                      file: event.target.files?.[0] || null,
                    })
                  }
                  className="hidden"
                />
              </label>
              <span className="max-w-[260px] truncate text-xs leading-4 text-gray-500">
                {selectedFileName}
              </span>
            </div>
          </div>
          {doc?.isDocValidityRequired ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={uploadForm.validFrom}
                  onChange={(event) =>
                    setUploadForm({ ...uploadForm, validFrom: event.target.value })
                  }
                  className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid To <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={uploadForm.validTo}
                  onChange={(event) =>
                    setUploadForm({ ...uploadForm, validTo: event.target.value })
                  }
                  className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3" />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
            <textarea
              rows={3}
              value={uploadForm.comments}
              onChange={(event) =>
                setUploadForm({ ...uploadForm, comments: event.target.value })
              }
              className="w-full px-3 py-2.5 border rounded text-sm bg-white border-gray-300"
            />
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={onSubmit}
            className="px-4 py-2 rounded-md bg-red-600 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
