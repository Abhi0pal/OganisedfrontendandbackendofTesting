'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { toast } from '@/lib/sonner';

export default function CreateWorkflowPage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<any>({ departments: [], subDepartments: [], services: [], modules: [] });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    departmentId: '',
    subDepartmentId: '',
    serviceId: '',
    projectId: '',
    moduleId: ''
  });

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const res = await apiClient.get('/workflow-builder/hierarchy');
      setHierarchy(res.data);
    } catch (err) {
      toast.error('Failed to load organizational hierarchy');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        departmentId: Number(formData.departmentId),
        subDepartmentId: formData.subDepartmentId ? Number(formData.subDepartmentId) : undefined,
        serviceId: formData.serviceId || undefined,
        projectId: formData.projectId ? Number(formData.projectId) : undefined,
        moduleId: formData.moduleId ? Number(formData.moduleId) : undefined,
      };

      const res = await apiClient.post('/workflow-builder/definitions', payload);
      toast.success('Workflow definition created successfully');
      router.push(`/en/admin/workflow-builder/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create workflow definition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      {/* ─── Page Header ─── */}
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-sm btn-outline-secondary me-3"
          style={{ borderRadius: '6px' }}
          onClick={() => router.push('/en/admin/workflow-builder')}
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#333333' }}>
            Create New Workflow
          </h4>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
            Define a new workflow by specifying its hierarchy and metadata
          </p>
        </div>
      </div>

      {/* ─── Form Card ─── */}
      <div className="ey-card-pro" style={{ maxWidth: '800px' }}>
        <div className="ey-header-pro">
          <div className="ey-title-pro">Workflow Details</div>
          <div className="ey-subtitle-pro">Fill in the fields below to create a workflow definition</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {/* Name & Code */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Workflow Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g., Standard Service Approval"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const generatedCode = newName.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                    setFormData({...formData, name: newName, code: generatedCode ? `WF_${generatedCode}` : ''});
                  }}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Workflow Code <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control bg-light"
                  required
                  readOnly
                  placeholder="Auto-generated (e.g., WF_STANDARD_SERVICE)"
                  value={formData.code}
                  style={{ borderRadius: '7px', fontSize: '13px', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                Description
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Brief description of this workflow"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                style={{ borderRadius: '7px', fontSize: '13px' }}
              />
            </div>

            <hr className="my-4" style={{ borderColor: '#e9ecef' }} />

            <p className="mb-3" style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              <i className="bi bi-building me-1"></i> Organizational Hierarchy
            </p>

            {/* Project & Department */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Project
                </label>
                <select
                  className="form-select"
                  value={formData.projectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    const proj = hierarchy.projects?.find((p: any) => p.id === Number(pid));
                    // Safely check if the department still exists in our departments array
                    const deptExists = hierarchy.departments?.some((d: any) => d.id === proj?.department_id);
                    const mappedDeptId = (proj?.department_id && deptExists) ? String(proj.department_id) : '';
                    setFormData({...formData, projectId: pid, departmentId: mappedDeptId, subDepartmentId: '', moduleId: ''});
                  }}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                >
                  <option value="">Select Project (Optional)</option>
                  {hierarchy.projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Department <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value, subDepartmentId: '', moduleId: ''})}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                >
                  <option value="">Select Department</option>
                  {hierarchy.departments?.filter((d: any) => {
                    if (!formData.projectId) return true;
                    const proj = hierarchy.projects?.find((p: any) => p.id === Number(formData.projectId));
                    
                    // If project has no department_id, or it points to a non-existent department, show all
                    const deptExists = hierarchy.departments?.some((dept: any) => dept.id === proj?.department_id);
                    if (!proj?.department_id || !deptExists) return true;
                    
                    return d.id === proj.department_id;
                  }).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub Department & Service */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Sub Department
                </label>
                <select
                  className="form-select"
                  value={formData.subDepartmentId}
                  onChange={(e) => setFormData({...formData, subDepartmentId: e.target.value})}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                >
                  <option value="">None</option>
                  {hierarchy.subDepartments?.filter((sd: any) => sd.department_id === Number(formData.departmentId)).map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name_en}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Service <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  required
                  value={formData.serviceId}
                  onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                >
                  <option value="">Select Service</option>
                  {hierarchy.services?.filter((s: any) => 
                    formData.departmentId ? s.department_id === Number(formData.departmentId) : true
                  ).map((s: any) => (
                    <option key={s.id} value={s.service_id}>{s.service_name} ({s.service_id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Module */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#555' }}>
                  Module
                </label>
                <select
                  className="form-select"
                  value={formData.moduleId}
                  onChange={(e) => setFormData({...formData, moduleId: e.target.value})}
                  style={{ borderRadius: '7px', fontSize: '13px' }}
                >
                  <option value="">None</option>
                  {hierarchy.modules?.filter((m: any) => 
                    (formData.projectId ? m.tenant_project_id === Number(formData.projectId) : true) && 
                    (formData.departmentId ? m.department_id === Number(formData.departmentId) : true)
                  ).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className="d-flex justify-content-end gap-2 p-3" style={{ background: '#f8f9fa', borderTop: '1px solid #e9ecef' }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ borderRadius: '7px', fontWeight: 600, padding: '8px 20px' }}
              onClick={() => router.push('/en/admin/workflow-builder')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-dark"
              style={{ borderRadius: '7px', fontWeight: 600, padding: '8px 20px' }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Creating...</>
              ) : (
                <><i className="bi bi-check2 me-1"></i> Create Workflow</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
