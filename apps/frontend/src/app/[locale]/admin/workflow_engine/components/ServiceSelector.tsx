'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

interface Props {
  value: string;
  onChange: (service_id: string, service_name: string) => void;
}

export default function ServiceSelector({ value, onChange }: Props) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [tenantId, setTenantId] = useState<number | ''>('');
  const [projectId, setProjectId] = useState<number | ''>('');

  useEffect(() => {
    apiClient.get('/workflow-engine/definitions/tenants')
      .then((r) => setTenants(r.data || []))
      .catch(() => {});
  }, []);

  const handleTenantChange = async (id: number | '') => {
    setTenantId(id);
    setProjectId('');
    setProjects([]);
    setServices([]);
    onChange('', '');
    if (!id) return;
    const r = await apiClient.get(`/workflow-engine/definitions/projects?tenant_id=${id}`);
    setProjects(r.data || []);
  };

  const handleProjectChange = async (id: number | '') => {
    setProjectId(id);
    setServices([]);
    onChange('', '');
    if (!id || !tenantId) return;
    const r = await apiClient.get(`/workflow-engine/definitions/services?tenant_id=${tenantId}&project_id=${id}`);
    setServices(r.data || []);
  };

  const handleServiceChange = (sid: string) => {
    const svc = services.find((s) => s.service_id === sid);
    onChange(sid, svc?.service_name || sid);
  };

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 4 };
  const selectStyle: React.CSSProperties = { fontSize: 13 };

  return (
    <div className="d-flex gap-2 align-items-end flex-wrap">
      {/* Tenant */}
      <div style={{ minWidth: 160 }}>
        <div style={labelStyle}>Tenant</div>
        <select
          className="form-select form-select-sm"
          style={selectStyle}
          value={tenantId}
          onChange={(e) => handleTenantChange(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">-- Tenant --</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Project */}
      <div style={{ minWidth: 160 }}>
        <div style={labelStyle}>Project</div>
        <select
          className="form-select form-select-sm"
          style={selectStyle}
          value={projectId}
          onChange={(e) => handleProjectChange(e.target.value ? Number(e.target.value) : '')}
          disabled={!tenantId || projects.length === 0}
        >
          <option value="">-- Project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Service */}
      <div style={{ minWidth: 200 }}>
        <div style={labelStyle}>Service</div>
        <select
          className="form-select form-select-sm"
          style={selectStyle}
          value={value}
          onChange={(e) => handleServiceChange(e.target.value)}
          disabled={!projectId || services.length === 0}
        >
          <option value="">-- Service --</option>
          {services.map((s) => (
            <option key={s.id} value={s.service_id}>
              {s.service_name || s.service_id}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
