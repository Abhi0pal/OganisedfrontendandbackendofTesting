'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

export default function WfeListPage() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/workflow-engine/definitions');
      setDefinitions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this workflow?')) return;
    await apiClient.delete(`/workflow-engine/definitions/${id}`);
    fetchAll();
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#333' }}>
            <i className="bi bi-diagram-3 me-2"></i>Workflow Engine
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Design and manage workflow definitions
          </p>
        </div>
        <button
          className="btn btn-dark btn-sm px-4"
          onClick={() => router.push('/en/admin/workflow_engine/create')}
        >
          <i className="bi bi-plus-lg me-1"></i> New Workflow
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#FFE600' }}>
                <tr>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Service ID</th>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Name</th>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Version</th>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Status</th>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Created</th>
                  <th style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {definitions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4" style={{ fontSize: 13 }}>
                      No workflows yet. Click "New Workflow" to create one.
                    </td>
                  </tr>
                )}
                {definitions.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontSize: 13 }}>
                      <span className="badge" style={{ background: '#f4f5f7', color: '#333', fontWeight: 600 }}>
                        {d.service_id}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ fontSize: 13 }}>v{d.version}</td>
                    <td>
                      {d.is_active ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Draft</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#888' }}>
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-dark me-2"
                        style={{ fontSize: 12 }}
                        onClick={() => router.push(`/en/admin/workflow_engine/${d.id}`)}
                      >
                        <i className="bi bi-pencil me-1"></i>Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ fontSize: 12 }}
                        onClick={() => handleDelete(d.id)}
                      >
                        <i className="bi bi-trash me-1"></i>Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
