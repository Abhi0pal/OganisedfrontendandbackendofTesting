'use client';

import { useEffect } from 'react';
import CommonDocumentPage from '@/components/common/CommonDocumentPage';

type DocumentsModalProps = {
  open: boolean;
  submissionId: number | null;
  serviceId: string;
  deptId?: number;
  onClose: () => void;
};

export default function DocumentsModal({
  open,
  submissionId,
  serviceId,
  deptId = 0,
  onClose,
}: DocumentsModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !submissionId) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Documents"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h5 className="mb-0 text-base font-semibold text-gray-900">Documents</h5>
          <button
            type="button"
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[72vh] overflow-auto p-4">
          <CommonDocumentPage
            serviceId={serviceId}
            submissionId={submissionId}
            deptId={deptId}
            readOnly
          />
        </div>

        <div className="flex justify-end border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
