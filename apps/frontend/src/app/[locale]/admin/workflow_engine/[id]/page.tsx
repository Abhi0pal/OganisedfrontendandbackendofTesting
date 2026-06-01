'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import WfeCanvas from '../components/WfeCanvas';

export default function WfeEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [definition, setDefinition] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canvasData, setCanvasData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  useEffect(() => { if (id) fetchDef(); }, [id]);

  const fetchDef = async () => {
    try {
      const res = await apiClient.get(`/workflow-engine/definitions/${id}`);
      setDefinition(res.data);
      const cfg = res.data.config_json || {};
      // deduplicate nodes by ID on load — keep startNode/endNode over taskNode
      const nodeMap = new Map<string, any>();
      for (const n of (cfg.nodes || [])) {
        const ex = nodeMap.get(n.id);
        if (!ex || n.type === 'startNode' || n.type === 'endNode') nodeMap.set(n.id, n);
      }
      setCanvasData({ nodes: Array.from(nodeMap.values()), edges: cfg.edges || [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish = false) => {
    try {
      setSaving(true);
      await apiClient.put(`/workflow-engine/definitions/${id}`, {
        config_json: canvasData,
        is_active: publish,
      });
      if (publish) await apiClient.put(`/workflow-engine/definitions/${id}/publish`);
      router.push('/en/admin/workflow_engine');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="spinner-border text-warning" role="status"></div>
    </div>
  );

  if (!definition) return (
    <div className="container-fluid p-4">
      <div className="alert alert-warning">Workflow not found.</div>
    </div>
  );

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div
        className="d-flex align-items-center gap-3 px-3 py-2"
        style={{ background: '#fff', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}
      >
        <button className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <span className="fw-bold" style={{ fontSize: 14 }}>{definition.name}</span>
          <span className="ms-2 text-muted" style={{ fontSize: 12 }}>
            {definition.service_id} · v{definition.version}
          </span>
        </div>
        {definition.is_active && (
          <span className="badge bg-success ms-1" style={{ fontSize: 11 }}>Active</span>
        )}
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-sm btn-outline-dark" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm"></span> : 'Save Draft'}
          </button>
          <button className="btn btn-sm btn-success" onClick={() => handleSave(true)} disabled={saving}>
            Publish
          </button>
        </div>
      </div>

      {/* Canvas */}
      <WfeCanvas
        initialNodes={canvasData.nodes}
        initialEdges={canvasData.edges}
        onChange={setCanvasData}
      />
    </div>
  );
}
