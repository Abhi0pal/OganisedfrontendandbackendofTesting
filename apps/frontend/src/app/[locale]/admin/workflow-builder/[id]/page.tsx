'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import WorkflowCanvas from '@/components/workflow-builder/WorkflowCanvas';

export default function WorkflowDesignerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [definition, setDefinition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDefinition();
  }, [id]);

  const fetchDefinition = async () => {
    try {
      const res = await apiClient.get(`/workflow-builder/definitions/${id}`);
      setDefinition(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="text-center">
          <div className="spinner-border text-warning mb-3" role="status"></div>
          <p className="text-muted" style={{ fontSize: '13px' }}>Loading workflow designer...</p>
        </div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning d-flex align-items-center" style={{ borderRadius: '10px' }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          Workflow not found.
          <button
            className="btn btn-sm btn-outline-dark ms-3"
            onClick={() => router.push('/en/admin/workflow-builder')}
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 120px)' }}>
      {/* ─── Mini Header ─── */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ borderRadius: '6px' }}
            onClick={() => router.push('/en/admin/workflow-builder')}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <div>
            <span className="fw-bold" style={{ color: '#333', fontSize: '14px' }}>{definition.name}</span>
            <span className="ms-2">
              <code style={{ background: '#e8eaed', padding: '1px 6px', borderRadius: '4px', fontSize: '11px' }}>{definition.code}</code>
            </span>
            <span className={`ms-2 ey-pill ${definition.status === 'PUBLISHED' ? 'success' : 'pending'}`} style={{ fontSize: '10px' }}>
              {definition.status}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Canvas ─── */}
      <div style={{ flex: 1, background: '#fff', overflow: 'hidden' }}>
        <WorkflowCanvas definition={definition} />
      </div>
    </div>
  );
}
