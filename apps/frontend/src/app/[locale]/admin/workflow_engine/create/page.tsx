'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import WfeCanvas from '../components/WfeCanvas';
import ServiceSelector from '../components/ServiceSelector';

export default function WfeCreatePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [canvasData, setCanvasData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

  const handleSave = async (publish = false) => {
    if (!serviceId.trim()) { alert('Please select a Service'); return; }
    if (!name.trim())      { alert('Please enter Workflow Name'); return; }
    try {
      setSaving(true);
      const res = await apiClient.post('/workflow-engine/definitions', {
        service_id: serviceId.trim(),
        name: name.trim(),
        config_json: canvasData,
        is_active: publish,
      });
      if (publish) await apiClient.put(`/workflow-engine/definitions/${res.data.id}/publish`);
      router.push('/en/admin/workflow_engine');
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div
        className="d-flex align-items-center gap-3 px-3 py-2 flex-wrap"
        style={{ background: '#fff', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}
      >
        <button className="btn btn-sm btn-outline-secondary" onClick={() => router.back()}>
          <i className="bi bi-arrow-left"></i>
        </button>

        {/* Tenant → Project → Service cascading */}
        <ServiceSelector
          value={serviceId}
          onChange={(sid) => setServiceId(sid)}
        />

        {/* Workflow Name */}
        <div style={{ minWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 }}>Workflow Name</div>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="e.g. RERA Registration Workflow"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="ms-auto d-flex gap-2 align-self-end">
          <button className="btn btn-sm btn-outline-dark" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm"></span> : 'Save Draft'}
          </button>
          <button className="btn btn-sm btn-success" onClick={() => handleSave(true)} disabled={saving}>
            Publish
          </button>
        </div>
      </div>

      {/* Canvas */}
      <WfeCanvas initialNodes={[]} initialEdges={[]} onChange={setCanvasData} />
    </div>
  );
}
