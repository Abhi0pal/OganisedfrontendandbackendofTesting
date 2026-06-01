
'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

interface Role {
  id: number;
  name: string;
  updatedAt?: string;
  _count?: { users?: number };
}

interface Resource {
  id: string; // API returns stringified BigInt (confirmed)
  code: string;
  name: string;
  path: string;
  created_at?: string;
}

interface RoleResource {
  role_id: number;
  resource_id: string; // API returns stringified BigInt (consistent with Resource.id)
  resource: Resource;
}

export default function AssignmentsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [assignedResourceIds, setAssignedResourceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null); // Resource ID being processed

  // Fetch roles & resources on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [rolesRes, resourcesRes] = await Promise.all([
          // NOTE: roles endpoint is /admin/roles and returns {success, message, data: Role[]}
          apiClient.get<{ success: boolean; message: string; data: Role[] }>('/admin/roles'),
          apiClient.get<Resource[]>('/resources'),
        ]);

        const rolesData = rolesRes.data?.data ?? [];
        setRoles(rolesData);
        setResources(resourcesRes.data);

        if (rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch initial data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch assignments whenever role changes
  useEffect(() => {
    if (!selectedRoleId) return;

    const fetchAssignments = async () => {
      try {
        const res = await apiClient.get<RoleResource[]>(`/role-resources/role/${selectedRoleId}`);

        // Ensure Set<string> by coercing ids to string (defensive)
        const ids = res.data.map((rr) => String(rr.resource.id));
        const assignedIds = new Set<string>(ids);

        setAssignedResourceIds(assignedIds);
      } catch (error) {
        console.error('Failed to fetch assignments', error);
      }
    };

    fetchAssignments();
  }, [selectedRoleId]);

  // Toggle assignment
  const handleToggle = async (resourceId: string, isAssigned: boolean) => {
    if (!selectedRoleId) return;
    setProcessing(resourceId);

    try {
      if (isAssigned) {
        // Remove assignment
        await apiClient.delete(`/role-resources/role/${selectedRoleId}/resource/${resourceId}`);
        setAssignedResourceIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      } else {
        // Add assignment
        await apiClient.post('/role-resources', {
          roleId: selectedRoleId,
          resourceId: resourceId,
        });
        setAssignedResourceIds((prev) => {
          const next = new Set(prev);
          next.add(resourceId);
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to toggle assignment', error);
      alert('Failed to update assignment');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">Role Assignments</h2>

      <div className="row">
        {/* Roles list */}
        <div className="col-md-3 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <h5 className="mb-0">Select Role</h5>
            </div>
            <div className="list-group list-group-flush">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`list-group-item list-group-item-action ${
                    selectedRoleId === role.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  {role.name}
                  {role._count?.users !== undefined && (
                    <span className="badge bg-secondary ms-2">{role._count.users}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources table */}
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Permissions for:{' '}
                <strong>{roles.find((r) => r.id === selectedRoleId)?.name ?? '—'}</strong>
              </h5>
              <span className="badge bg-primary">{assignedResourceIds.size} Assigned</span>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Access</th>
                        <th>Resource Code</th>
                        <th>Name</th>
                        <th>Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => {
                        const isAssigned = assignedResourceIds.has(resource.id);
                        const isProcessing = processing === resource.id;
                        return (
                          <tr key={resource.id} className={isAssigned ? 'table-success' : ''}>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isAssigned}
                                  disabled={isProcessing}
                                  onChange={() => handleToggle(resource.id, isAssigned)}
                                  style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                />
                              </div>
                            </td>
                            <td>
                              <code>{resource.code}</code>
                            </td>
                            <td>{resource.name}</td>
                            <td className="text-muted small">{resource.path}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
