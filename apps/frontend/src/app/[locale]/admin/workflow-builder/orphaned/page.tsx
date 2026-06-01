'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from '@/lib/sonner';

export default function OrphanedDashboardPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrphanedInstances();
  }, []);

  const fetchOrphanedInstances = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/workflow-builder/orphaned');
      setInstances(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === instances.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(instances.map((i) => i.id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await apiClient.post('/workflow-builder/orphaned/bulk-action', {
        instanceIds: selectedIds,
        action,
      });
      toast.success(`${action} applied to ${selectedIds.length} instance(s)`);
      setSelectedIds([]);
      fetchOrphanedInstances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* ─── Page Header ─── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: '#333333' }}>
            <i className="bi bi-exclamation-triangle me-2" style={{ color: '#c77700' }}></i>
            Orphaned Applications
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
            Applications stuck due to workflow changes — reassign or resolve them
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
            style={{ borderRadius: '6px', fontWeight: 600 }}
            disabled={selectedIds.length === 0 || actionLoading}
            onClick={() => handleBulkAction('FORCE_COMPLETE')}
          >
            <i className="bi bi-check-circle"></i> Force Complete
          </button>
          <button
            className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
            style={{ borderRadius: '6px', fontWeight: 600 }}
            disabled={selectedIds.length === 0 || actionLoading}
            onClick={() => handleBulkAction('CANCEL')}
          >
            <i className="bi bi-x-circle"></i> Cancel
          </button>
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
            style={{ borderRadius: '6px' }}
            onClick={fetchOrphanedInstances}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* ─── Table Card ─── */}
      <div className="ey-card-pro">
        <div className="ey-header-pro d-flex justify-content-between align-items-center">
          <div>
            <div className="ey-title-pro">Orphaned Instances</div>
            <div className="ey-subtitle-pro">
              {instances.length} instance(s) found
              {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
            </div>
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
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === instances.length && instances.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Instance ID</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Workflow</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Application</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Orphan Reason</th>
                <th style={{ padding: '11px 14px', borderBottom: '2px solid #FFE600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                    Loading orphaned instances...
                  </td>
                </tr>
              ) : instances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-check-circle fs-3 d-block mb-2" style={{ color: '#2e7d32' }}></i>
                    No orphaned instances found. Everything looks good!
                  </td>
                </tr>
              ) : (
                instances.map((inst: any) => (
                  <tr key={inst.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inst.id)}
                        onChange={() => toggleSelect(inst.id)}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>#{inst.id}</td>
                    <td style={{ padding: '10px 14px' }}>{inst.workflowDef?.name || 'N/A'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <code style={{ background: '#f4f5f7', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {inst.applicationId?.toString()}
                      </code>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="ey-pill pending">{inst.orphanReason || 'Unknown'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="ey-pill inactive">{inst.status}</span>
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
