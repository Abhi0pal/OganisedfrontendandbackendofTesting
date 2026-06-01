'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';

type ModuleRecord = {
  id: number;
  name: string;
  code?: string | null;
};

type PermissionRecord = {
  id: number;
  module_id: number;
  action: string;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
  module?: ModuleRecord | null;
};

type AssignmentRecord = {
  id: number;
  user_id?: string | number;
  role_id: number;
  tenant_id: number;
  is_active: boolean;
  user?: {
    id?: string | number;
    email?: string | null;
    department_user?: { full_name?: string | null } | null;
  } | null;
  role?: { id: number; name: string } | null;
  tenant?: { id: number; name: string } | null;
};

type OverrideRecord = {
  id: number;
  assignment_id: number;
  permission_id: number;
  effect: 'ALLOW' | 'DENY';
  reason?: string | null;
  created_at?: string;
  created_by?: string | number | null;
  assignment?: AssignmentRecord | null;
  permission?: PermissionRecord | null;
};

type OverrideFormValue = '' | 'ALLOW' | 'DENY';

export default function PermissionOverrideManagementPage() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [overrides, setOverrides] = useState<OverrideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [overrideState, setOverrideState] = useState<Record<number, OverrideFormValue>>({});
  const [reasonState, setReasonState] = useState<Record<number, string>>({});

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.is_active).sort((a, b) => a.id - b.id),
    [assignments],
  );

  const selectedAssignment = useMemo(
    () => activeAssignments.find((assignment) => String(assignment.id) === selectedAssignmentId) || null,
    [activeAssignments, selectedAssignmentId],
  );

  const selectedAssignmentOverrides = useMemo(() => {
    if (!selectedAssignmentId) return [];
    return overrides.filter((override) => String(override.assignment_id) === selectedAssignmentId);
  }, [overrides, selectedAssignmentId]);

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, { module: ModuleRecord | null; permissions: PermissionRecord[] }>();

    permissions
      .filter((permission) => permission.is_active)
      .forEach((permission) => {
        const key = permission.module?.code || `module-${permission.module_id}`;
        if (!map.has(key)) {
          map.set(key, {
            module: permission.module || null,
            permissions: [],
          });
        }
        map.get(key)!.permissions.push(permission);
      });

    return Array.from(map.values()).map((group) => ({
      module: group.module,
      permissions: group.permissions.sort((a, b) => a.action.localeCompare(b.action)),
    }));
  }, [permissions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, permissionsRes, overridesRes] = await Promise.all([
        apiClient.get('/admin/user-management/assignments'),
        apiClient.get('/admin/user-management/permissions'),
        apiClient.get('/admin/user-management/permission-overrides'),
      ]);

      setAssignments(assignmentsRes.data?.data ?? []);
      setPermissions(permissionsRes.data?.data ?? []);
      setOverrides(overridesRes.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load permission overrides', error);
      alert('Failed to load permission override data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openManageModal = (assignment: AssignmentRecord) => {
    const assignmentOverrides = overrides.filter((override) => override.assignment_id === assignment.id);
    const nextOverrideState: Record<number, OverrideFormValue> = {};
    const nextReasonState: Record<number, string> = {};

    assignmentOverrides.forEach((override) => {
      nextOverrideState[override.permission_id] = override.effect;
      nextReasonState[override.permission_id] = override.reason || '';
    });

    setSelectedAssignmentId(String(assignment.id));
    setOverrideState(nextOverrideState);
    setReasonState(nextReasonState);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssignmentId('');
    setOverrideState({});
    setReasonState({});
  };

  const handleSave = async () => {
    if (!selectedAssignmentId) return;

    try {
      setSaving(true);
      const existingOverrides = overrides.filter((override) => String(override.assignment_id) === selectedAssignmentId);
      const existingByPermissionId = new Map(existingOverrides.map((override) => [override.permission_id, override]));

      const createOrUpdateTasks: Promise<any>[] = [];
      const deleteTasks: Promise<any>[] = [];

      permissions.forEach((permission) => {
        const desiredEffect = overrideState[permission.id] || '';
        const desiredReason = (reasonState[permission.id] || '').trim();
        const existing = existingByPermissionId.get(permission.id);

        if (!desiredEffect && existing) {
          deleteTasks.push(
            apiClient.delete(`/admin/user-management/permission-overrides/${existing.id}`),
          );
          return;
        }

        if (!desiredEffect) return;

        if (!existing || existing.effect !== desiredEffect || (existing.reason || '') !== desiredReason) {
          createOrUpdateTasks.push(
            apiClient.post('/admin/user-management/permission-overrides', {
              assignmentId: Number(selectedAssignmentId),
              permissionId: permission.id,
              effect: desiredEffect,
              reason: desiredReason || null,
              createdBy: selectedAssignment?.user?.id || null,
            }),
          );
        }
      });

      await Promise.all([...createOrUpdateTasks, ...deleteTasks]);
      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Failed to save permission overrides', error);
      alert(error?.response?.data?.message || 'Failed to save permission overrides');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (override: OverrideRecord) => {
    if (!confirm(`Reset override for ${override.permission?.action || 'permission'}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/user-management/permission-overrides/${override.id}`);
      await loadData();
    } catch (error: any) {
      console.error('Failed to delete override', error);
      alert(error?.response?.data?.message || 'Failed to delete override');
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Permission Override Management</h2>
          <p className="text-muted mb-0">Manage assignment-specific permission allow and deny overrides from the database table.</p>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
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
                    <th>User / Role</th>
                    <th>Assignment</th>
                    <th>Permission</th>
                    <th>Effect</th>
                    <th>Reason</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((override) => (
                    <tr key={override.id}>
                      <td>{override.id}</td>
                      <td>
                        <div className="fw-semibold">
                          {override.assignment?.user?.department_user?.full_name || override.assignment?.user?.email || '-'}
                        </div>
                        <div className="small text-muted">{override.assignment?.role?.name || '-'}</div>
                      </td>
                      <td>
                        <div>Assignment #{override.assignment_id}</div>
                        <div className="small text-muted">
                          {override.assignment?.tenant?.name || `Tenant ${override.assignment?.tenant_id ?? '-'}`}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{override.permission?.module?.name || '-'}</div>
                        <div className="small text-muted">{override.permission?.action || '-'}</div>
                      </td>
                      <td>
                        <span className={`badge ${override.effect === 'ALLOW' ? 'bg-success' : 'bg-danger'}`}>
                          {override.effect}
                        </span>
                      </td>
                      <td>{override.reason || '-'}</td>
                      <td>
                        <div>{override.created_at ? new Date(override.created_at).toLocaleDateString() : '-'}</div>
                        <div className="small text-muted">
                          {override.created_at ? new Date(override.created_at).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => override.assignment && openManageModal(override.assignment)}
                          disabled={!override.assignment}
                        >
                          <i className="bi bi-sliders"></i> Manage
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(override)}>
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {overrides.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        No permission overrides found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">Assignments</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
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
                    <th>Tenant</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.id}</td>
                      <td>
                        <div className="fw-semibold">
                          {assignment.user?.department_user?.full_name || assignment.user?.email || '-'}
                        </div>
                        <div className="small text-muted">{assignment.user?.email || '-'}</div>
                      </td>
                      <td>{assignment.role?.name || '-'}</td>
                      <td>{assignment.tenant?.name || `Tenant ${assignment.tenant_id}`}</td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openManageModal(assignment)}>
                          <i className="bi bi-sliders"></i> Manage Overrides
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeAssignments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No active assignments available.
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
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Manage Overrides</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              <div className="border rounded p-3 mb-4 bg-light">
                <div>User: {selectedAssignment?.user?.department_user?.full_name || selectedAssignment?.user?.email || '-'}</div>
                <div>Role: {selectedAssignment?.role?.name || '-'}</div>
                <div className="small text-muted">Assignment: #{selectedAssignment?.id || '-'}</div>
              </div>

              <div className="d-flex flex-column gap-4">
                {groupedPermissions.map((group) => (
                  <div key={group.module?.code || group.module?.id || Math.random().toString()}>
                    <div className="fw-semibold mb-2">
                      {group.module?.name || 'Unknown Module'}
                      <span className="small text-muted ms-2">{group.module?.code || ''}</span>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Permission</th>
                            <th>Default</th>
                            <th>Override</th>
                            <th>Reason</th>
                            <th>Current State</th>
                            <th>Reset</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.permissions.map((permission) => {
                            const effect = overrideState[permission.id] || '';
                            const existingOverride = selectedAssignmentOverrides.find(
                              (override) => override.permission_id === permission.id,
                            );

                            return (
                              <tr key={permission.id}>
                                <td>
                                  <div className="fw-semibold">{permission.action}</div>
                                  <div className="small text-muted">{permission.description || '-'}</div>
                                </td>
                                <td>
                                  <span className="badge bg-secondary">Role Default</span>
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={effect}
                                    onChange={(e) =>
                                      setOverrideState((prev) => ({
                                        ...prev,
                                        [permission.id]: e.target.value as OverrideFormValue,
                                      }))
                                    }
                                  >
                                    <option value="">Default</option>
                                    <option value="ALLOW">ALLOW</option>
                                    <option value="DENY">DENY</option>
                                  </select>
                                </td>
                                <td>
                                  <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={reasonState[permission.id] || ''}
                                    onChange={(e) =>
                                      setReasonState((prev) => ({
                                        ...prev,
                                        [permission.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Reason"
                                  />
                                </td>
                                <td>
                                  {effect === 'ALLOW' && <span className="badge bg-success">ALLOW</span>}
                                  {effect === 'DENY' && <span className="badge bg-danger">DENY</span>}
                                  {!effect && <span className="badge bg-secondary">Default</span>}
                                  {existingOverride && (
                                    <div className="small text-muted mt-1">Saved override #{existingOverride.id}</div>
                                  )}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                      setOverrideState((prev) => ({ ...prev, [permission.id]: '' }));
                                      setReasonState((prev) => ({ ...prev, [permission.id]: '' }));
                                    }}
                                  >
                                    Reset
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
