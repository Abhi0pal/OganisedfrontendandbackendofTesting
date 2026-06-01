'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';

type UserOption = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type RoleOption = {
  id: number;
  name: string;
};

type TenantOption = {
  id: number;
  name: string;
  slag?: string | null;
  is_active?: boolean;
};

type ProjectOption = {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  is_active?: boolean;
  tenant?: TenantOption | null;
};

type ScopeOption = {
  id?: number;
  value?: string;
  name: string;
  code?: string;
};

type ScopeRecord = {
  id: number;
  assignment_id: number;
  scope_type: string;
  scope_id: number;
  scope_label?: string | null;
  created_at?: string;
};

type AssignmentRecord = {
  id: number;
  user_id?: string | number;
  role_id: number;
  tenant_id: number;
  project_id?: number | null;
  valid_from?: string;
  valid_until?: string | null;
  transfer_order_no?: string | null;
  transfer_reason?: string | null;
  transferred_from_id?: number | null;
  assigned_by?: string | number | null;
  remarks?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  user?: {
    id?: string | number;
    email?: string | null;
    department_user?: { full_name?: string | null } | null;
  } | null;
  role?: { id: number; name: string } | null;
  tenant?: TenantOption | null;
  project?: ProjectOption | null;
  scopes?: ScopeRecord[];
  transferred_from?: AssignmentRecord | null;
};

type ScopeFormRow = {
  key: string;
  scopeType: string;
  scopeId: string;
  scopeLabel: string;
};

const TRANSFER_REASON_OPTIONS = [
  'PROMOTION',
  'TRANSFER',
  'DEPUTATION',
  'RETIREMENT',
  'RESIGNATION',
  'ADMIN_CHANGE',
];

const SCOPE_TYPE_OPTIONS = ['STATE', 'DISTRICT', 'BLOCK', 'TEHSIL', 'DIVISION', 'VILLAGE', 'PROJECT'];

const createScopeRow = (): ScopeFormRow => ({
  key: `${Date.now()}-${Math.random()}`,
  scopeType: 'DISTRICT',
  scopeId: '',
  scopeLabel: '',
});

const toDateInputValue = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

export default function UserAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentRecord | null>(null);
  const [scopeOptionsByType, setScopeOptionsByType] = useState<Record<string, ScopeOption[]>>({});
  const [formData, setFormData] = useState({
    userId: '',
    roleId: '',
    tenantId: '',
    projectId: '',
    validFrom: '',
    validUntil: '',
    transferReason: '',
    transferOrderNo: '',
    transferredFromId: '',
    assignedBy: '',
    remarks: '',
    isActive: true,
    scopes: [createScopeRow()],
  });

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) => !formData.tenantId || String(project.tenant_id) === String(formData.tenantId),
      ),
    [projects, formData.tenantId],
  );

  const loadScopeOptions = async (scopeType: string) => {
    if (!scopeType || scopeOptionsByType[scopeType]) return;

    try {
      const res = await apiClient.get('/admin/user-management/assignment-scope-options', {
        params: { scopeType },
      });
      setScopeOptionsByType((prev) => ({
        ...prev,
        [scopeType]: res.data?.data ?? [],
      }));
    } catch (error) {
      console.error(`Failed to load scope options for ${scopeType}`, error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, tenantsRes, projectsRes, assignmentsRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/user-management/tenants'),
        apiClient.get('/admin/user-management/projects'),
        apiClient.get('/admin/user-management/assignments'),
      ]);

      setUsers(usersRes.data?.data ?? []);
      setRoles(rolesRes.data?.data ?? []);
      setTenants(tenantsRes.data?.data ?? []);
      setProjects(projectsRes.data?.data ?? []);
      setAssignments(assignmentsRes.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load assignment data', error);
      alert('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    formData.scopes.forEach((scope) => {
      if (scope.scopeType) {
        loadScopeOptions(scope.scopeType);
      }
    });
  }, [formData.scopes]);

  const resetForm = () => {
    setEditingAssignment(null);
    setFormData({
      userId: '',
      roleId: '',
      tenantId: tenants[0] ? String(tenants[0].id) : '',
      projectId: '',
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '',
      transferReason: '',
      transferOrderNo: '',
      transferredFromId: '',
      assignedBy: '',
      remarks: '',
      isActive: true,
      scopes: [createScopeRow()],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (assignment: AssignmentRecord) => {
    setEditingAssignment(assignment);
    setFormData({
      userId: String(assignment.user?.id ?? assignment.user_id ?? ''),
      roleId: String(assignment.role?.id ?? assignment.role_id ?? ''),
      tenantId: String(assignment.tenant?.id ?? assignment.tenant_id ?? ''),
      projectId: assignment.project?.id != null || assignment.project_id != null
        ? String(assignment.project?.id ?? assignment.project_id ?? '')
        : '',
      validFrom: toDateInputValue(assignment.valid_from),
      validUntil: toDateInputValue(assignment.valid_until),
      transferReason: assignment.transfer_reason ?? '',
      transferOrderNo: assignment.transfer_order_no ?? '',
      transferredFromId: assignment.transferred_from?.id != null || assignment.transferred_from_id != null
        ? String(assignment.transferred_from?.id ?? assignment.transferred_from_id ?? '')
        : '',
      assignedBy: assignment.assigned_by != null ? String(assignment.assigned_by) : '',
      remarks: assignment.remarks ?? '',
      isActive: assignment.is_active,
      scopes:
        assignment.scopes && assignment.scopes.length > 0
          ? assignment.scopes.map((scope) => ({
              key: `${scope.id}`,
              scopeType: scope.scope_type,
              scopeId: String(scope.scope_id),
              scopeLabel: scope.scope_label ?? '',
            }))
          : [createScopeRow()],
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const updateScopeRow = (key: string, patch: Partial<ScopeFormRow>) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.map((scope) => {
        if (scope.key !== key) return scope;
        const next = { ...scope, ...patch };
        if (patch.scopeType && patch.scopeType !== scope.scopeType) {
          next.scopeId = '';
          next.scopeLabel = '';
        }
        return next;
      }),
    }));
  };

  const addScopeRow = () => {
    setFormData((prev) => ({
      ...prev,
      scopes: [...prev.scopes, createScopeRow()],
    }));
  };

  const removeScopeRow = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.length > 1 ? prev.scopes.filter((scope) => scope.key !== key) : prev.scopes,
    }));
  };

  const buildScopePayload = () =>
    formData.scopes
      .map((scope) => {
        const options = scopeOptionsByType[scope.scopeType] ?? [];
        const selectedOption = options.find((option) => String(option.id ?? option.value ?? '') === scope.scopeId);

        return {
          scopeType: scope.scopeType,
          scopeId: Number(scope.scopeId),
          scopeLabel: scope.scopeLabel || selectedOption?.name || null,
        };
      })
      .filter((scope) => scope.scopeType && Number.isFinite(scope.scopeId) && scope.scopeId > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId || !formData.roleId || !formData.tenantId || !formData.validFrom) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        userId: formData.userId,
        roleId: Number(formData.roleId),
        tenantId: Number(formData.tenantId),
        projectId: formData.projectId ? Number(formData.projectId) : null,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil || null,
        transferReason: formData.transferReason || null,
        transferOrderNo: formData.transferOrderNo || null,
        transferredFromId: formData.transferredFromId ? Number(formData.transferredFromId) : null,
        assignedBy: formData.assignedBy || null,
        remarks: formData.remarks || null,
        isActive: formData.isActive,
        scopes: buildScopePayload(),
      };

      if (editingAssignment) {
        await apiClient.put(`/admin/user-management/assignments/${editingAssignment.id}`, payload);
      } else {
        await apiClient.post('/admin/user-management/assignments', payload);
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Failed to save assignment', error);
      alert(error?.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment: AssignmentRecord) => {
    const userName = assignment.user?.department_user?.full_name || assignment.user?.email || `User ${assignment.user_id}`;
    if (!confirm(`Are you sure you want to delete assignment for ${userName}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/user-management/assignments/${assignment.id}`);
      await loadData();
    } catch (error: any) {
      console.error('Failed to delete assignment', error);
      alert(error?.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleStatusToggle = async (assignment: AssignmentRecord) => {
    try {
      setTogglingId(assignment.id);
      await apiClient.put(`/admin/user-management/assignments/${assignment.id}`, {
        isActive: !assignment.is_active,
      });
      await loadData();
    } catch (error: any) {
      console.error('Failed to update assignment status', error);
      alert(error?.response?.data?.message || 'Failed to update assignment status');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">User Role Assignment</h2>
          <p className="text-muted mb-0">Manage user-role assignments directly from the database-backed assignment tables.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-2"></i>Assign Role
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Tenant / Project</th>
                    <th>Validity</th>
                    <th>Scope</th>
                    <th>Transfer / Audit</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.id}</td>
                      <td>
                        <div className="fw-semibold">
                          {assignment.user?.department_user?.full_name || assignment.user?.email || '-'}
                        </div>
                        <div className="small text-muted">{assignment.user?.email || '-'}</div>
                        <div className="small text-muted">User ID: {String(assignment.user?.id ?? assignment.user_id ?? '-')}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{assignment.role?.name || '-'}</div>
                        <div className="small text-muted">Role ID: {assignment.role?.id ?? assignment.role_id}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{assignment.tenant?.name || '-'}</div>
                        <div className="small text-muted">Tenant ID: {assignment.tenant?.id ?? assignment.tenant_id}</div>
                        <div className="small text-muted">
                          Project: {assignment.project?.name || (assignment.project_id ? `#${assignment.project_id}` : 'N/A')}
                        </div>
                      </td>
                      <td>
                        <div>From: {assignment.valid_from ? new Date(assignment.valid_from).toLocaleDateString() : '-'}</div>
                        <div className="small text-muted">
                          Until: {assignment.valid_until ? new Date(assignment.valid_until).toLocaleDateString() : 'Open-ended'}
                        </div>
                      </td>
                      <td>
                        {assignment.scopes && assignment.scopes.length > 0 ? (
                          assignment.scopes.map((scope) => (
                            <div key={scope.id} className="small mb-1">
                              <span className="fw-semibold">{scope.scope_type}</span>: {scope.scope_label || scope.scope_id}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted small">No scopes</span>
                        )}
                      </td>
                      <td>
                        <div className="small">Assigned By: {assignment.assigned_by ? String(assignment.assigned_by) : '-'}</div>
                        <div className="small">Transfer Reason: {assignment.transfer_reason || '-'}</div>
                        <div className="small">Order No: {assignment.transfer_order_no || '-'}</div>
                        <div className="small">Transferred From: {assignment.transferred_from?.id ?? assignment.transferred_from_id ?? '-'}</div>
                        <div className="small text-muted">{assignment.remarks || 'No remarks'}</div>
                      </td>
                      <td>
                        <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={assignment.is_active}
                            disabled={togglingId === assignment.id}
                            onChange={() => handleStatusToggle(assignment)}
                          />
                          <span className={`badge ${assignment.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>{assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : '-'}</div>
                        <div className="small text-muted">
                          {assignment.created_at ? new Date(assignment.created_at).toLocaleTimeString() : ''}
                        </div>
                        <div className="small text-muted">
                          Updated: {assignment.updated_at ? new Date(assignment.updated_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(assignment)}>
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(assignment)}>
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-4 text-muted">
                        No user role assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && <div className="modal-backdrop fade show"></div>}

      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingAssignment ? 'Edit Assignment' : 'Assign Role'}</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">User *</label>
                    <select
                      className="form-select"
                      value={formData.userId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, userId: e.target.value }))}
                      required
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name || user.email || user.id} {user.email ? `(${user.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      value={formData.roleId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roleId: e.target.value }))}
                      required
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tenant *</label>
                    <select
                      className="form-select"
                      value={formData.tenantId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tenantId: e.target.value,
                          projectId: '',
                        }))
                      }
                      required
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Project</label>
                    <select
                      className="form-select"
                      value={formData.projectId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, projectId: e.target.value }))}
                    >
                      <option value="">Select project (optional)</option>
                      {filteredProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Valid From *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.validFrom}
                      onChange={(e) => setFormData((prev) => ({ ...prev, validFrom: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Valid Until</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.validUntil}
                      onChange={(e) => setFormData((prev) => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Scope</label>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addScopeRow}>
                      <i className="bi bi-plus-lg me-1"></i>Add More
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {formData.scopes.map((scope, index) => {
                      const options = scopeOptionsByType[scope.scopeType] ?? [];

                      return (
                        <div key={scope.key} className="row g-2 align-items-start">
                          <div className="col-md-3">
                            <select
                              className="form-select"
                              value={scope.scopeType}
                              onChange={(e) => updateScopeRow(scope.key, { scopeType: e.target.value })}
                            >
                              {SCOPE_TYPE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <select
                              className="form-select"
                              value={scope.scopeId}
                              onChange={(e) => updateScopeRow(scope.key, { scopeId: e.target.value })}
                            >
                              <option value="">Select scope value</option>
                              {options.map((option) => (
                                <option key={`${scope.scopeType}-${option.id ?? option.value}`} value={String(option.id ?? option.value ?? '')}>
                                  {option.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Scope label"
                              value={scope.scopeLabel}
                              onChange={(e) => updateScopeRow(scope.key, { scopeLabel: e.target.value })}
                            />
                          </div>
                          <div className="col-md-1">
                            <button
                              type="button"
                              className="btn btn-outline-danger w-100"
                              onClick={() => removeScopeRow(scope.key)}
                              disabled={formData.scopes.length === 1}
                              title={`Remove scope ${index + 1}`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">Transfer Reason</label>
                    <select
                      className="form-select"
                      value={formData.transferReason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transferReason: e.target.value }))}
                    >
                      <option value="">Select reason</option>
                      {TRANSFER_REASON_OPTIONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Transfer Order No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.transferOrderNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transferOrderNo: e.target.value }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Transferred From Assignment</label>
                    <select
                      className="form-select"
                      value={formData.transferredFromId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transferredFromId: e.target.value }))}
                    >
                      <option value="">Select assignment</option>
                      {assignments
                        .filter((assignment) => !editingAssignment || assignment.id !== editingAssignment.id)
                        .map((assignment) => (
                          <option key={assignment.id} value={assignment.id}>
                            #{assignment.id} - {assignment.user?.department_user?.full_name || assignment.user?.email || assignment.user_id}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assigned By</label>
                    <select
                      className="form-select"
                      value={formData.assignedBy}
                      onChange={(e) => setFormData((prev) => ({ ...prev, assignedBy: e.target.value }))}
                    >
                      <option value="">Select user</option>
                      {users.map((user) => (
                        <option key={`assigned-by-${user.id}`} value={user.id}>
                          {user.name || user.email || user.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Remarks</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.remarks}
                      onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between border rounded px-3 py-2 mt-4">
                  <div>
                    <div className="fw-semibold">Status</div>
                    <div className="small text-muted">Toggle assignment status between active and inactive.</div>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      id="assignmentActive"
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label className="form-check-label ms-2" htmlFor="assignmentActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingAssignment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
