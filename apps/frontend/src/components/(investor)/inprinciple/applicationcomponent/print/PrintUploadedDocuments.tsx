import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';

type UploadedRow = {
  documentMasterId: number;
  fileName?: string;
  originalName?: string;
  filePath?: string;
  status?: string;
  version?: number;
  versionType?: string;
  createdAt?: string;
};

type PrintUploadedDocumentsProps = {
  submissionId: number;
  serviceId: string;
};

const getStatusLabel = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'V') return 'Verified';
  if (normalized === 'R') return 'Rejected';
  if (normalized === 'U') return 'Unverified';
  return '--';
};

export default function PrintUploadedDocuments({
  submissionId,
  serviceId,
}: PrintUploadedDocumentsProps) {
  const [uploads, setUploads] = useState<UploadedRow[]>([]);
  const [dms, setDms] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/common/documents/uploads', {
          params: { submissionId, serviceId },
        });
        const rows = res?.data?.uploads || [];
        setUploads(rows);
      } catch (error) {
        console.error('Failed to load uploads', error);
        setUploads([]);
      }
    };
    if (submissionId && serviceId) load();
  }, [submissionId, serviceId]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/common/documents/dms', {
          params: { serviceId },
        });
        setDms(res?.data || null);
      } catch (error) {
        console.error('Failed to load DMS', error);
        setDms(null);
      }
    };
    if (serviceId) load();
  }, [serviceId]);

  if (!serviceId) {
    return <div className="text-sm text-gray-600">No document configuration found.</div>;
  }

  const checklistMap = useMemo(() => {
    const map = new Map<number, { name: string; typeName: string }>();
    const types = Array.isArray(dms?.dms?.documentTypes)
      ? dms.dms.documentTypes
      : Array.isArray(dms?.documentTypes)
        ? dms.documentTypes
        : [];
    types.forEach((type: any) => {
      const typeName = type?.name || '';
      (type.checklists || []).forEach((item: any) => {
        map.set(Number(item.id), { name: item.name || '', typeName });
      });
    });
    return map;
  }, [dms]);

  if (!uploads.length) {
    return <div className="text-sm text-gray-600">No uploaded documents available.</div>;
  }

  return (
    <div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>S.No.</th>
            <th>Document Name</th>
            <th style={{ width: '120px' }}>Status</th>
            <th style={{ width: '120px' }}>Download</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((row, index) => {
            const docInfo = checklistMap.get(Number(row.documentMasterId));
            return (
              <tr key={`${row.documentMasterId}-${index}`}>
                <td>{index + 1}</td>
                <td>{docInfo?.name || row.fileName || row.originalName || '--'}</td>
                <td>{getStatusLabel(row.status)}</td>
                <td>
                  {row.filePath ? (
                    <a
                      href={`/${row.filePath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="print-link"
                    >
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
  );
}
