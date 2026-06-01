'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

type ModuleRecord = {
  id: number;
  name: string;
  code?: string | null;
  portal?: string | null;
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

const ACTION_OPTIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'APPROVE', 'REJECT', 'MANAGE'];

export default function PermissionManagementPage() {
  const [permissions, setPermissions] = useState<PermissionRecord[]>([]);
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPermissionId, setTogglingPermissionId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<PermissionRecord | null>(null);
  const [formData, setFormData] = useState({
    moduleId: '',
    action: 'READ',
    description: '',
    isActive: true,
  });

  const availableActionOptions = ACTION_OPTIONS.filter((action) => {
    if (!formData.moduleId) return true;

    const duplicate = permissions.some((permission) => {
      if (editingPermission && permission.id === editingPermission.id) return false;
      return String(permission.module_id) === String(formData.moduleId) && permission.action === action;
    });

    return !duplicate;
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [modulesRes, permissionsRes] = await Promise.all([
        apiClient.get('/admin/user-management/modules'),
        apiClient.get('/admin/user-management/permissions'),
      ]);
      setModules(modulesRes.data?.data ?? []);
      setPermissions(permissionsRes.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load permission management data', error);
      alert('Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showModal || !formData.moduleId) return;

    const nextAvailableActions = ACTION_OPTIONS.filter((action) => {
      const duplicate = permissions.some((permission) => {
        if (editingPermission && permission.id === editingPermission.id) return false;
        return String(permission.module_id) === String(formData.moduleId) && permission.action === action;
      });

      return !duplicate;
    });

    if (nextAvailableActions.length === 0) {
      if (formData.action !== '') {
        setFormData((prev) => ({ ...prev, action: '' }));
      }
      return;
    }

    if (!nextAvailableActions.includes(formData.action)) {
      setFormData((prev) => ({ ...prev, action: nextAvailableActions[0] }));
    }
  }, [showModal, formData.moduleId, permissions, editingPermission, formData.action]);

  const resetForm = () => {
    setEditingPermission(null);
    setFormData({
      moduleId: '',
      action: 'READ',
      description: '',
      isActive: true,
    });
  };

  const openCreateModal = () => {
    resetForm();
    const defaultModuleId = modules[0] ? String(modules[0].id) : '';
    const defaultAction =
      ACTION_OPTIONS.find((action) =>
        !permissions.some(
          (permission) =>
            String(permission.module_id) === defaultModuleId && permission.action === action,
        ),
      ) || 'READ';
    setFormData({
      moduleId: defaultModuleId,
      action: defaultAction,
      description: '',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (permission: PermissionRecord) => {
    const fallbackAction = permission.action;
    setEditingPermission(permission);
    setFormData({
      moduleId: String(permission.module_id),
      action: fallbackAction,
      description: permission.description ?? '',
      isActive: permission.is_active,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.moduleId) {
      alert('Please select a module.');
      return;
    }
    if (!formData.action) {
      alert('Please select an action.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        moduleId: Number(formData.moduleId),
        action: formData.action,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (editingPermission) {
        await apiClient.put(`/admin/user-management/permissions/${editingPermission.id}`, payload);
      } else {
        await apiClient.post('/admin/user-management/permissions', payload);
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Failed to save permission record', error);
      alert(error?.response?.data?.message || 'Failed to save permission record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (permission: PermissionRecord) => {
    const moduleName = permission.module?.name || `Module ${permission.module_id}`;
    if (!confirm(`Are you sure you want to delete ${permission.action} permission for ${moduleName}?`)) {
      return;
    }

    try {
      await apiClient.delete(`/admin/user-management/permissions/${permission.id}`);
      await loadData();
    } catch (error: any) {
      console.error('Failed to delete permission record', error);
      alert(error?.response?.data?.message || 'Failed to delete permission record');
    }
  };

  const handleStatusToggle = async (permission: PermissionRecord) => {
    try {
      setTogglingPermissionId(permission.id);
      await apiClient.put(`/admin/user-management/permissions/${permission.id}`, {
        isActive: !permission.is_active,
      });
      await loadData();
    } catch (error: any) {
      console.error('Failed to update permission status', error);
      alert(error?.response?.data?.message || 'Failed to update permission status');
    } finally {
      setTogglingPermissionId(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Permission Management</h2>
          <p className="text-muted mb-0">Manage permissions directly from the database-backed permission table.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <i className="bi bi-plus-lg me-2"></i>Add Permission
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
                    <th>Module</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((permission) => (
                    <tr key={permission.id}>
                      <td>{permission.id}</td>
                      <td>
                        <div className="fw-semibold">{permission.module?.name || '-'}</div>
                        <div className="small text-muted">{permission.module?.code || '-'}</div>
                        <div className="small text-muted">Module ID: {permission.module_id}</div>
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border">{permission.action}</span>
                      </td>
                      <td>{permission.description || '-'}</td>
                      <td>
                        <div className="form-check form-switch d-inline-flex align-items-center gap-2 m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={permission.is_active}
                            disabled={togglingPermissionId === permission.id}
                            onChange={() => handleStatusToggle(permission)}
                          />
                          <span className={`badge ${permission.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {permission.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>{permission.created_at ? new Date(permission.created_at).toLocaleDateString() : '-'}</div>
                        <div className="small text-muted">
                          {permission.created_at ? new Date(permission.created_at).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(permission)}>
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(permission)}>
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {permissions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No permissions found.
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
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingPermission ? 'Edit Permission' : 'Create Permission'}</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Module *</label>
                  <select
                    className="form-select"
                    value={formData.moduleId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, moduleId: e.target.value }))}
                    required
                  >
                    <option value="">Select module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name} {module.code ? `(${module.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Action *</label>
                  <select
                    className="form-select"
                    value={formData.action}
                    onChange={(e) => setFormData((prev) => ({ ...prev, action: e.target.value }))}
                    required
                  >
                    {availableActionOptions.length === 0 && (
                      <option value="">No action available</option>
                    )}
                    {availableActionOptions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                  {formData.moduleId && availableActionOptions.length === 0 && (
                    <div className="small text-danger mt-1">
                      All actions already exist for this module.
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="d-flex align-items-center justify-content-between border rounded px-3 py-2">
                  <div>
                    <div className="fw-semibold">Status</div>
                    <div className="small text-muted">Toggle permission status between active and inactive.</div>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      id="permissionActive"
                      type="checkbox"
                      className="form-check-input"
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <label className="form-check-label ms-2" htmlFor="permissionActive">
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
                  {saving ? 'Saving...' : editingPermission ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
