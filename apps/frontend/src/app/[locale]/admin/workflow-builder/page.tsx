'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function WorkflowBuilderListPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefinitions();
  }, []);

  const fetchDefinitions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/workflow-builder/definitions');
      setDefinitions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="ey-pill success">PUBLISHED</span>;
      case 'DRAFT':
        return <span className="ey-pill pending">DRAFT</span>;
      case 'ARCHIVED':
        return <span className="ey-pill inactive">ARCHIVED</span>;
      default:
        return <span className="ey-pill inactive">{status}</span>;
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* ─── Page Header ─── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#333333' }}>
            <i className="bi bi-diagram-3 me-2"></i>
            Workflow Builder (V2)
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
            Manage and design multi-tenant workflows
          </p>
        </div>
        <button
          className="btn btn-dark d-flex align-items-center gap-2"
          style={{ fontWeight: 600, borderRadius: '7px', padding: '8px 20px' }}
          onClick={() => router.push('/en/admin/workflow-builder/create')}
        >
          <i className="bi bi-plus-lg"></i> Create Workflow
        </button>
      </div>

      {/* ─── Table Card ─── */}
      <div className="ey-card-pro">
        <div className="ey-header-pro d-flex justify-content-between align-items-center">
          <div>
            <div className="ey-title-pro">Existing Workflows</div>
            <div className="ey-subtitle-pro">{definitions.length} workflow(s) found</div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table table-hover mb-0" style={{ fontSize: '13px' }}>
            <thead>
              <tr style={{
                background: '#333333',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
              }}>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Code</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Name</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Service</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Department</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Status</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Version</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                    Loading workflows...
                  </td>
                </tr>
              ) : definitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-3 d-block mb-2 text-muted"></i>
                    No workflows found. Click &quot;Create Workflow&quot; to get started.
                  </td>
                </tr>
              ) : (
                definitions.map((def: any) => (
                  <tr key={def.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#333' }}>
                      <code style={{ background: '#f4f5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {def.code}
                      </code>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#333' }}>{def.name}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{def.service?.service_name || 'N/A'}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{def.department?.name || 'N/A'}</td>
                    <td style={{ padding: '10px 14px' }}>{getStatusBadge(def.status)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        background: '#e8eaed',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        v{def.version}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1"
                        style={{ borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}
                        onClick={() => router.push(`/en/admin/workflow-builder/${def.id}`)}
                      >
                        <i className="bi bi-pencil-square"></i> Designer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
