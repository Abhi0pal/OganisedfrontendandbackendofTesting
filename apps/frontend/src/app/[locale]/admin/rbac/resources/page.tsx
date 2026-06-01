'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';

interface Resource {
    id: string; // BigInt serialized to string
    code: string;
    name: string;
    path: string;
    created_at: string;
}

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    // Form state
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [path, setPath] = useState('');

    const fetchResources = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/resources');
            setResources(res.data);
        } catch (error) {
            console.error('Failed to fetch resources', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { code, name, path };
            if (editingResource) {
                await apiClient.patch(`/resources/${editingResource.id}`, payload);
            } else {
                await apiClient.post('/resources', payload);
            }
            setShowModal(false);
            resetForm();
            fetchResources();
        } catch (error) {
            console.error('Failed to save resource', error);
            alert('Failed to save resource');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await apiClient.delete(`/resources/${id}`);
            fetchResources();
        } catch (error) {
            console.error('Failed to delete resource', error);
            alert('Failed to delete resource');
        }
    };

    const resetForm = () => {
        setCode('');
        setName('');
        setPath('');
        setEditingResource(null);
    };

    const openModal = (resource?: Resource) => {
        if (resource) {
            setEditingResource(resource);
            setCode(resource.code);
            setName(resource.name);
            setPath(resource.path);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Resources Management</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <i className="bi bi-plus-lg me-2"></i>Add Resource
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
                                        <th>Code</th>
                                        <th>Name</th>
                                        <th>Path</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resources.map((res) => (
                                        <tr key={res.id}>
                                            <td>{res.id}</td>
                                            <td>
                                                <span className="badge bg-info text-dark">{res.code}</span>
                                            </td>
                                            <td>{res.name}</td>
                                            <td><code>{res.path}</code></td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => openModal(res)}
                                                >
                                                    <i className="bi bi-pencil"></i> Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(res.id)}
                                                >
                                                    <i className="bi bi-trash"></i> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {resources.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-4 text-muted">
                                                No resources found.
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
            <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{editingResource ? 'Edit Resource' : 'Create Resource'}</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Resource Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="e.g. MASTER_COUNTRIES"
                                        required
                                    />
                                    <div className="form-text">Unique identifier for permission checks.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Manage Countries"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Path Pattern</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={path}
                                        onChange={(e) => setPath(e.target.value)}
                                        placeholder="e.g. /master/countries"
                                        required
                                    />
                                    <div className="form-text">URL path prefix to protect automatically.</div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingResource ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
