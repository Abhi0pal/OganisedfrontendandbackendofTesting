'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';

type ScopeRecord = {
  id: number;
  scope_type: string;
  scope_id: number;
  scope_label?: string | null;
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
  tenant?: { id: number; name: string } | null;
  project?: { id: number; name: string; code?: string } | null;
  scopes?: ScopeRecord[];
  transferred_from?: AssignmentRecord | null;
};

type RoleOption = {
  id: number;
  name: string;
};

type UserOption = {
  id: string;
  email?: string | null;
  name?: string | null;
};

type ScopeOption = {
  id?: number;
  value?: string;
  name: string;
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

const assignmentUserName = (assignment?: AssignmentRecord | null) =>
  assignment?.user?.department_user?.full_name ||
  assignment?.user?.email ||
  (assignment?.user_id != null ? `User ${assignment.user_id}` : '-');

export default function TransferHistoryManagementPage() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRecord | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [scopeOptionsByType, setScopeOptionsByType] = useState<Record<string, ScopeOption[]>>({});
  const [formData, setFormData] = useState({
    newRoleId: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    validUntil: '',
    transferReason: '',
    transferOrderNo: '',
    assignedBy: '',
    remarks: '',
    scopes: [createScopeRow()],
  });

  const activeAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.is_active).sort((a, b) => a.id - b.id),
    [assignments],
  );

  const historyAssignments = useMemo(() => {
    if (!historyUserId) return [];
    return assignments
      .filter((assignment) => String(assignment.user?.id ?? assignment.user_id ?? '') === historyUserId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [assignments, historyUserId]);

  const loadScopeOptions = async (scopeType: string) => {
    if (!scopeType || scopeOptionsByType[scopeType]) return;
    try {
      const res = await apiClient.get('/admin/user-management/assignment-scope-options', {
        params: { scopeType },
      });
      setScopeOptionsByType((prev) => ({ ...prev, [scopeType]: res.data?.data ?? [] }));
    } catch (error) {
      console.error(`Failed to load scope options for ${scopeType}`, error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, rolesRes, usersRes, transfersRes] = await Promise.all([
        apiClient.get('/admin/user-management/assignments'),
        apiClient.get('/admin/roles'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/user-management/transfers'),
      ]);

      const assignmentRows = assignmentsRes.data?.data ?? [];
      const transferRows = transfersRes.data?.data ?? [];
      const mergedById = new Map<number, AssignmentRecord>();

      [...assignmentRows, ...transferRows].forEach((row: AssignmentRecord) => {
        mergedById.set(row.id, row);
      });

      setAssignments(Array.from(mergedById.values()));
      setRoles(rolesRes.data?.data ?? []);
      setUsers(usersRes.data?.data ?? []);
    } catch (error) {
      console.error('Failed to load transfer data', error);
      alert('Failed to load transfer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    formData.scopes.forEach((scope) => {
      if (scope.scopeType) loadScopeOptions(scope.scopeType);
    });
  }, [formData.scopes]);

  const openTransferModal = (assignment: AssignmentRecord) => {
    if (!assignment.is_active) return;

    setSelectedAssignment(assignment);
    setFormData({
      newRoleId: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
      validUntil: '',
      transferReason: '',
      transferOrderNo: '',
      assignedBy: '',
      remarks: '',
      scopes:
        assignment.scopes && assignment.scopes.length > 0
          ? assignment.scopes.map((scope) => ({
              key: `${scope.id}-${Math.random()}`,
              scopeType: scope.scope_type,
              scopeId: String(scope.scope_id),
              scopeLabel: scope.scope_label ?? '',
            }))
          : [createScopeRow()],
    });
    setShowTransferModal(true);
  };

  const closeTransferModal = () => {
    setShowTransferModal(false);
    setSelectedAssignment(null);
  };

  const openHistoryModal = (assignment: AssignmentRecord) => {
    setSelectedAssignment(assignment);
    setHistoryUserId(String(assignment.user?.id ?? assignment.user_id ?? ''));
    setShowHistoryModal(true);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedAssignment(null);
    setHistoryUserId('');
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
    setFormData((prev) => ({ ...prev, scopes: [...prev.scopes, createScopeRow()] }));
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!formData.newRoleId || !formData.transferReason) {
      alert('Please select new role and transfer reason.');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post(`/admin/user-management/assignments/${selectedAssignment.id}/transfer`, {
        newRoleId: Number(formData.newRoleId),
        effectiveDate: formData.effectiveDate,
        validUntil: formData.validUntil || null,
        transferReason: formData.transferReason,
        transferOrderNo: formData.transferOrderNo || null,
        assignedBy: formData.assignedBy || null,
        remarks: formData.remarks || null,
        scopes: buildScopePayload(),
      });

      closeTransferModal();
      await loadData();
    } catch (error: any) {
      console.error('Failed to transfer assignment', error);
      alert(error?.response?.data?.message || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Transfer & History Management</h2>
          <p className="text-muted mb-0">Transfer active assignments and review the full linked role history.</p>
        </div>
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
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.id}</td>
                      <td>
                        <div className="fw-semibold">{assignmentUserName(assignment)}</div>
                        <div className="small text-muted">{assignment.user?.email || '-'}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">{assignment.role?.name || '-'}</div>
                        <div className="small text-muted">Tenant: {assignment.tenant?.name || assignment.tenant_id}</div>
                      </td>
                      <td>
                        {assignment.scopes && assignment.scopes.length > 0 ? (
                          assignment.scopes.map((scope) => (
                            <div key={scope.id} className="small mb-1">
                              <span className="fw-semibold">{scope.scope_type}</span>: {scope.scope_label || scope.scope_id}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted small">No scope</span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-success">Active</span>
                      </td>
                      <td>
                        <div>{assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : '-'}</div>
                        <div className="small text-muted">
                          {assignment.created_at ? new Date(assignment.created_at).toLocaleTimeString() : ''}
                        </div>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openTransferModal(assignment)}>
                          <i className="bi bi-arrow-repeat"></i> Transfer Role
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openHistoryModal(assignment)}>
                          <i className="bi bi-clock-history"></i> View History
                        </button>
                      </td>
                    </tr>
                  ))}
                  {activeAssignments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No active assignments available for transfer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showTransferModal && <div className="modal-backdrop fade show"></div>}
      <div className={`modal fade ${showTransferModal ? 'show d-block' : ''}`} tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Transfer Role</h5>
              <button type="button" className="btn-close" onClick={closeTransferModal}></button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="modal-body">
                <div className="border rounded p-3 mb-4 bg-light">
                  <div className="fw-semibold mb-2">Current</div>
                  <div>Role: {selectedAssignment?.role?.name || '-'}</div>
                  <div>
                    Scope:{' '}
                    {selectedAssignment?.scopes?.length
                      ? selectedAssignment.scopes.map((scope) => `${scope.scope_type}: ${scope.scope_label || scope.scope_id}`).join(', ')
                      : 'No scope'}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">New Role *</label>
                    <select
                      className="form-select"
                      value={formData.newRoleId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, newRoleId: e.target.value }))}
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
                    <label className="form-label">Effective Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">New Scope *</label>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addScopeRow}>
                      <i className="bi bi-plus-lg me-1"></i>Add
                    </button>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {formData.scopes.map((scope) => {
                      const options = scopeOptionsByType[scope.scopeType] ?? [];
                      return (
                        <div key={scope.key} className="row g-2">
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
                    <label className="form-label">Transfer Reason *</label>
                    <select
                      className="form-select"
                      value={formData.transferReason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transferReason: e.target.value }))}
                      required
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
                    <label className="form-label">Order No</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.transferOrderNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, transferOrderNo: e.target.value }))}
                    />
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
                        <option key={user.id} value={user.id}>
                          {user.name || user.email || user.id}
                        </option>
                      ))}
                    </select>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeTransferModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showHistoryModal && <div className="modal-backdrop fade show"></div>}
      <div className={`modal fade ${showHistoryModal ? 'show d-block' : ''}`} tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Transfer History</h5>
              <button type="button" className="btn-close" onClick={closeHistoryModal}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div className="fw-semibold">{assignmentUserName(selectedAssignment)}</div>
                <div className="small text-muted">
                  Timeline: {historyAssignments.map((item) => item.role?.name || `Role ${item.role_id}`).reverse().join(' -> ')}
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Role</th>
                      <th>Previous Role</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Remarks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyAssignments.map((item) => (
                      <tr key={item.id} className={item.is_active ? 'table-success' : ''}>
                        <td>
                          <div className="fw-semibold">{item.role?.name || '-'}</div>
                          <div className="small text-muted">
                            {item.scopes?.map((scope) => `${scope.scope_type}: ${scope.scope_label || scope.scope_id}`).join(', ') || 'No scope'}
                          </div>
                        </td>
                        <td>{item.transferred_from?.role?.name || '-'}</td>
                        <td>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td>{item.transfer_reason || '-'}</td>
                        <td>{item.remarks || '-'}</td>
                        <td>
                          <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {item.is_active ? 'Current' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {historyAssignments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          No transfer history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeHistoryModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
