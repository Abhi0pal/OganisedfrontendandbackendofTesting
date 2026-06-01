'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';

type DraftResponse = {
  submissionId: number;
  formData: any;
  serviceId?: string;
};

type ChecklistItem = {
  id: number;
  name: string;
  extension?: string;
  maxSize?: string;
  isRequired?: string;
  comment?: string;
};

export default function InprincipleDocumentsPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ submissionId?: string }> }) {
  const resolvedSearchParams = React.use(searchParams);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uploadsByMaster, setUploadsByMaster] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const decodeParam = (value?: string | null) => {
    if (!value) return '';
    return value;
  };

  const submissionId = useMemo(() => {
    const token = resolvedSearchParams?.submissionId;
    const decoded = decodeParam(token);
    const parsedId = Number(decoded);
    return Number.isFinite(parsedId) ? parsedId : null;
  }, [resolvedSearchParams]);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/draft', {
          params: { submissionId },
        });
        setDraft(res?.data || null);
        const serviceId = res?.data?.serviceId || '943.0';
        const docs = await apiClient.get('/investor/inprinciple/documents', {
          params: { serviceId },
        });
        setChecklist(docs?.data || []);
        const uploadsRes = await apiClient.get('/common/documents/uploads', {
          params: { submissionId, serviceId },
        });
        const uploads = Array.isArray(uploadsRes?.data?.uploads)
          ? uploadsRes.data.uploads
          : [];
        const map: Record<string, any> = {};
        uploads.forEach((item: any) => {
          if (item?.documentMasterId) {
            map[String(item.documentMasterId)] = item;
          }
        });
        setUploadsByMaster(map);
      } catch (error) {
        console.error('Failed to load documents', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionId]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading documents...</div>;
  }

  if (!draft) {
    return <div className="p-6 text-sm text-gray-600">Documents not found.</div>;
  }

  const documents = draft.formData?.documents || {};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Supporting Documents</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-4 py-3">Sl. No</th>
              <th className="px-4 py-3">Document Name</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">View</th>
            </tr>
          </thead>
          <tbody>
            {checklist.length === 0 && (
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 text-center text-gray-500" colSpan={5}>
                  No document checklist mapped for this service.
                </td>
              </tr>
            )}
            {checklist.map((doc, index) => {
              const uploaded = uploadsByMaster[String(doc.id)];
              const filePath = uploaded?.filePath || documents?.[String(doc.id)];
              const statusCode = String(uploaded?.status || '').toUpperCase();
              const statusLabel = statusCode === 'R' ? 'Rejected' : filePath ? 'Uploaded' : 'Pending';
              const statusClass =
                statusCode === 'R'
                  ? 'text-red-600 font-semibold'
                  : filePath
                    ? 'text-emerald-600'
                    : 'text-gray-700';
              return (
                <tr key={doc.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{doc.name}</div>
                    {doc.comment && <div className="text-xs text-gray-500">{doc.comment}</div>}
                  </td>
                  <td className="px-4 py-3">{doc.isRequired === 'Y' ? 'Yes' : 'No'}</td>
                  <td className={`px-4 py-3 ${statusClass}`}>{statusLabel}</td>
                  <td className="px-4 py-3 text-red-600">
                    {filePath ? (
                      <a href={filePath} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      '--'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
