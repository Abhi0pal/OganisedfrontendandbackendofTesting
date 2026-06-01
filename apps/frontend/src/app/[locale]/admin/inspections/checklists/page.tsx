'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    useInspectionChecklists,
    useCreateInspectionChecklist,
    useDeleteInspectionChecklist,
    InspectionChecklist
} from '@/hooks/useInspections';
import { useServices } from '@/hooks/master/useServices';
import { useDepartments } from '@/hooks/master/useDepartments';

// ===================================
// Types
// ===================================
interface ChecklistFormData {
    serviceId: number | '';
    version: string;
    items: ChecklistItemFormData[];
}

interface ChecklistItemFormData {
    title: string;
    type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'TEXT' | 'BOOLEAN';
    description: string;
    isMandatory: boolean;
    riskIndicator: 'HIGH' | 'MEDIUM' | 'LOW';
    order: number;
}

// ===================================
// Main Component
// ===================================
export default function AdminInspectionChecklistsPage() {
    const { data: checklists = [], isLoading: checklistsLoading } = useInspectionChecklists();
    const { data: services = [], isLoading: servicesLoading } = useServices({ isActive: true });
    const { data: departments = [] } = useDepartments();
    const createChecklist = useCreateInspectionChecklist();
    const deleteChecklist = useDeleteInspectionChecklist();

    // State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState<ChecklistFormData>({
        serviceId: '',
        version: '1.0',
        items: [{ title: '', type: 'BOOLEAN', description: '', isMandatory: true, riskIndicator: 'MEDIUM', order: 1 }]
    });

    // Stats
    const stats = useMemo(() => {
        const totalItems = checklists.reduce((sum: number, c: any) => sum + (c.items?.length || 0), 0);
        const uniqueServices = new Set(checklists.map((c: any) => c.serviceId)).size;
        return {
            totalChecklists: checklists.length,
            totalItems,
            servicesConfigured: uniqueServices
        };
    }, [checklists]);

    // Filter services by department
    const filteredServices = useMemo(() => {
        if (!Array.isArray(services)) return [];
        if (departmentFilter === 'all') return services;
        return services.filter((s: any) => s.department_id === departmentFilter);
    }, [services, departmentFilter]);

    // Filter checklists
    const filteredChecklists = useMemo(() => {
        return checklists.filter((c: any) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesService = c.service?.service_name?.toLowerCase().includes(query);
                const matchesVersion = c.version?.toLowerCase().includes(query);
                if (!matchesService && !matchesVersion) return false;
            }
            return true;
        });
    }, [checklists, searchQuery]);

    // Handlers
    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                title: '',
                type: 'BOOLEAN',
                description: '',
                isMandatory: true,
                riskIndicator: 'MEDIUM',
                order: prev.items.length + 1
            }]
        }));
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index: number, field: keyof ChecklistItemFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serviceId) {
            alert('Please select a service');
            return;
        }
        if (formData.items.length === 0 || !formData.items[0].title) {
            alert('Please add at least one checklist item');
            return;
        }

        try {
            await createChecklist.mutateAsync({
                serviceId: Number(formData.serviceId),
                version: formData.version,
                items: formData.items.filter(item => item.title.trim())
            });
            setShowCreateModal(false);
            setFormData({
                serviceId: '',
                version: '1.0',
                items: [{ title: '', type: 'BOOLEAN', description: '', isMandatory: true, riskIndicator: 'MEDIUM', order: 1 }]
            });
        } catch (err) {
            console.error('Failed to create checklist:', err);
            alert('Failed to create checklist');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteChecklist.mutateAsync(id);
            setShowDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete checklist');
        }
    };

    const isLoading = checklistsLoading || servicesLoading;

    if (isLoading) {
        return (
            <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="fw-bold mb-1">
                        <i className="bi bi-clipboard-check me-2 text-primary"></i>
                        Inspection Checklists
                    </h2>
                    <p className="text-muted mb-0">Manage inspection criteria for services</p>
                </div>
                <button
                    className="btn btn-primary btn-lg px-4"
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Create New Checklist
                </button>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                                <i className="bi bi-list-check text-white fs-4"></i>
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{stats.totalChecklists}</h3>
                                <small className="text-muted">Total Checklists</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}
                            >
                                <i className="bi bi-check-circle text-white fs-4"></i>
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{stats.totalItems}</h3>
                                <small className="text-muted">Total Items</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center gap-3">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                            >
                                <i className="bi bi-building text-white fs-4"></i>
                            </div>
                            <div>
                                <h3 className="mb-0 fw-bold">{stats.servicesConfigured}</h3>
                                <small className="text-muted">Services Configured</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label small fw-semibold">Search</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by service name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label small fw-semibold">Department</label>
                            <select
                                className="form-select"
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : +e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept: any) => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checklists Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-bottom">
                    <h5 className="mb-0 fw-semibold">
                        <i className="bi bi-table me-2 text-muted"></i>
                        All Checklists
                    </h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="text-center">Version</th>
                                    <th className="text-center">Items</th>
                                    <th className="text-center">Status</th>
                                    <th className="text-center px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredChecklists.length > 0 ? (
                                    filteredChecklists.map((checklist: InspectionChecklist) => (
                                        <tr key={checklist.id}>
                                            <td className="px-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="rounded d-flex align-items-center justify-content-center"
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                        }}
                                                    >
                                                        <i className="bi bi-file-earmark-text text-white"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{checklist.service?.service_name || 'N/A'}</div>
                                                        <small className="text-muted">ID: {checklist.serviceId}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark px-3 py-2">
                                                    v{checklist.version}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-info text-white px-3 py-2">
                                                    {checklist.items?.length || 0} Items
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <span className="badge bg-success px-3 py-2">
                                                    <i className="bi bi-check-circle me-1"></i>Active
                                                </span>
                                            </td>
                                            <td className="text-center px-4">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <Link
                                                        href={`/admin/inspections/checklists/${checklist.id}`}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>View
                                                    </Link>
                                                    <button className="btn btn-sm btn-outline-secondary">
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => setShowDeleteConfirm(checklist.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5">
                                            <i className="bi bi-inbox fs-1 text-muted"></i>
                                            <p className="text-muted mt-2 mb-0">No checklists found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-plus-circle me-2 text-primary"></i>
                                    Create New Checklist
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row g-3 mb-4">
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Department</label>
                                            <select
                                                className="form-select"
                                                value={departmentFilter}
                                                onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : +e.target.value)}
                                            >
                                                <option value="all">All Departments</option>
                                                {departments.map((dept: any) => (
                                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Service <span className="text-danger">*</span></label>
                                            <select
                                                className="form-select"
                                                value={formData.serviceId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: +e.target.value }))}
                                                required
                                            >
                                                <option value="">Select Service</option>
                                                {filteredServices.map((service: any) => (
                                                    <option key={service.id} value={service.id}>{service.service_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Version</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.version}
                                                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                                                placeholder="e.g. 1.0"
                                            />
                                        </div>
                                    </div>

                                    <hr />

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">
                                            <i className="bi bi-list-ol me-2"></i>
                                            Checklist Items
                                        </h6>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={handleAddItem}
                                        >
                                            <i className="bi bi-plus me-1"></i>Add Item
                                        </button>
                                    </div>

                                    {formData.items.map((item, index) => (
                                        <div key={index} className="card bg-light border-0 mb-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <span className="badge bg-primary">Item #{index + 1}</span>
                                                    {formData.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="row g-3">
                                                    <div className="col-12">
                                                        <label className="form-label small">Title <span className="text-danger">*</span></label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={item.title}
                                                            onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                                            placeholder="Enter checklist item title"
                                                            required={index === 0}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Type</label>
                                                        <select
                                                            className="form-select"
                                                            value={item.type}
                                                            onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                                                        >
                                                            <option value="BOOLEAN">Yes/No</option>
                                                            <option value="TEXT">Text Input</option>
                                                            <option value="PHOTO">Photo</option>
                                                            <option value="VIDEO">Video</option>
                                                            <option value="DOCUMENT">Document</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <label className="form-label small">Risk Level</label>
                                                        <select
                                                            className="form-select"
                                                            value={item.riskIndicator}
                                                            onChange={(e) => handleItemChange(index, 'riskIndicator', e.target.value)}
                                                        >
                                                            <option value="HIGH">High</option>
                                                            <option value="MEDIUM">Medium</option>
                                                            <option value="LOW">Low</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-4 d-flex align-items-end">
                                                        <div className="form-check">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                id={`mandatory-${index}`}
                                                                checked={item.isMandatory}
                                                                onChange={(e) => handleItemChange(index, 'isMandatory', e.target.checked)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`mandatory-${index}`}>
                                                                Mandatory
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <label className="form-label small">Description</label>
                                                        <textarea
                                                            className="form-control"
                                                            rows={2}
                                                            value={item.description}
                                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                            placeholder="Optional description for this item"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary px-4"
                                        disabled={createChecklist.isPending}
                                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                                    >
                                        {createChecklist.isPending ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                Create Checklist
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body text-center py-4">
                                <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
                                <h5>Delete Checklist?</h5>
                                <p className="text-muted">This action cannot be undone. All items in this checklist will be permanently deleted.</p>
                                <div className="d-flex justify-content-center gap-3 mt-4">
                                    <button
                                        className="btn btn-secondary px-4"
                                        onClick={() => setShowDeleteConfirm(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-danger px-4"
                                        onClick={() => handleDelete(showDeleteConfirm)}
                                        disabled={deleteChecklist.isPending}
                                    >
                                        {deleteChecklist.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
