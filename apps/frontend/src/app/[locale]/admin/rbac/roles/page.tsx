'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

interface Role {
    id: number;
    name: string;
    updatedAt: string;
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleName, setRoleName] = useState('');
    const { refresh } = useAuth(); // To refresh global roles if needed

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/roles');
            setRoles(res.data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRole) {
                await apiClient.patch(`/roles/${editingRole.id}`, { name: roleName });
            } else {
                await apiClient.post('/roles', { name: roleName });
            }
            setShowModal(false);
            setRoleName('');
            setEditingRole(null);
            fetchRoles();
            refresh(); // Refresh global auth state roles
        } catch (error) {
            console.error('Failed to save role', error);
            alert('Failed to save role');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this role?')) return;
        try {
            await apiClient.delete(`/roles/${id}`);
            fetchRoles();
            refresh();
        } catch (error) {
            console.error('Failed to delete role', error);
            alert('Failed to delete role');
        }
    };

    const openModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setRoleName(role.name);
        } else {
            setEditingRole(null);
            setRoleName('');
        }
        setShowModal(true);
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Roles Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <i className="bi bi-plus-lg me-2"></i>Add Role
                </button>
            </div>

            <div className="card shadow-sm">
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
                                <thead className="table-light">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Last Updated</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.map((role) => (
                                        <tr key={role.id}>
                                            <td>{role.id}</td>
                                            <td>
                                                <span className="badge bg-light text-dark border">
                                                    {role.name}
                                                </span>
                                            </td>
                                            <td>{new Date(role.updatedAt).toLocaleDateString()}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => openModal(role)}
                                                >
                                                    <i className="bi bi-pencil"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(role.id)}
                                                >
                                                    <i className="bi bi-trash"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {roles.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-muted">
                                                No roles found. Create one to get started.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Backdrop */}
            {showModal && (
                <div className="modal-backdrop fade show"></div>
            )}

            {/* Modal */}
            <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{editingRole ? 'Edit Role' : 'Create Role'}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Role Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingRole ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
