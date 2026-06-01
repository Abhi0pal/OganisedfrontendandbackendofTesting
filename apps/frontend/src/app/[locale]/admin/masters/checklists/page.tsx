'use client';

import React, { useState, useMemo } from 'react';
import { ChecklistBuilder } from '@/components/inspections/ChecklistBuilder';
import { useInspectionChecklists, useDeleteInspectionChecklist } from '@/hooks/useInspections';
import { useDepartments } from '@/hooks/master/useDepartments';

interface ChecklistItem {
    id: number;
    title: string;
    type: string;
    isMandatory: boolean;
    riskIndicator?: string;
    description?: string;
}

interface Checklist {
    id: number;
    serviceId: number;
    version: string;
    items: ChecklistItem[];
    service?: {
        id: number;
        service_name: string;
        service_id: string;
        department?: {
            id: number;
            name: string;
        };
    };
}

export default function AdminChecklistsPage() {
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
    const [viewingChecklist, setViewingChecklist] = useState<Checklist | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');

    const { data: checklists, isLoading } = useInspectionChecklists();
    const { data: departments = [] } = useDepartments();
    const deleteMutation = useDeleteInspectionChecklist();

    // Stats
    const stats = useMemo(() => {
        if (!checklists) return { total: 0, items: 0, services: 0, departments: 0 };
        const totalItems = checklists.reduce((sum: number, c: Checklist) => sum + (c.items?.length || 0), 0);
        const uniqueServices = new Set(checklists.map((c: Checklist) => c.serviceId)).size;
        const uniqueDepartments = new Set(
            checklists.map((c: Checklist) => c.service?.department?.id).filter(Boolean)
        ).size;
        return {
            total: checklists.length,
            items: totalItems,
            services: uniqueServices,
            departments: uniqueDepartments
        };
    }, [checklists]);

    // Filtered checklists
    const filteredChecklists = useMemo(() => {
        if (!checklists) return [];
        return checklists.filter((c: Checklist) => {
            // Department filter
            if (departmentFilter !== 'all') {
                if (c.service?.department?.id !== departmentFilter) return false;
            }
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesService = c.service?.service_name?.toLowerCase().includes(query);
                const matchesDept = c.service?.department?.name?.toLowerCase().includes(query);
                const matchesVersion = c.version?.toLowerCase().includes(query);
                if (!matchesService && !matchesDept && !matchesVersion) return false;
            }
            return true;
        });
    }, [checklists, searchQuery, departmentFilter]);

    const handleView = (checklist: Checklist) => {
        setViewingChecklist(checklist);
    };

    const handleEdit = (checklist: Checklist) => {
        setEditingChecklist(checklist);
        setShowBuilder(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteMutation.mutateAsync(id);
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Failed to delete:', err);
            alert('Failed to delete checklist');
        }
    };

    const closeViewModal = () => {
        setViewingChecklist(null);
    };

    const handleBuilderClose = () => {
        setShowBuilder(false);
        setEditingChecklist(null);
    };

    const handleCreateNew = () => {
        setEditingChecklist(null);
        setShowBuilder(true);
    };

    const riskColors: Record<string, string> = {
        HIGH: 'bg-danger',
        MEDIUM: 'bg-warning text-dark',
        LOW: 'bg-info'
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* View Modal */}
            {viewingChecklist && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0" style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}>
                                <div>
                                    <h5 className="modal-title fw-bold mb-0">
                                        <i className="bi bi-clipboard-check me-2"></i>
                                        {viewingChecklist.service?.service_name || 'Checklist Details'}
                                    </h5>
                                    <div className="d-flex gap-3 mt-1 opacity-75">
                                        <small>
                                            <i className="bi bi-building me-1"></i>
                                            {viewingChecklist.service?.department?.name || 'No Department'}
                                        </small>
                                        <small>
                                            <i className="bi bi-tag me-1"></i>
                                            Version {viewingChecklist.version}
                                        </small>
                                    </div>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={closeViewModal}></button>
                            </div>
                            <div className="modal-body p-4">
                                <h6 className="text-muted mb-3">
                                    <i className="bi bi-list-check me-2"></i>
                                    Checklist Items ({viewingChecklist.items?.length || 0})
                                </h6>
                                <div className="d-flex flex-column gap-2">
                                    {viewingChecklist.items?.map((item, index) => (
                                        <div key={item.id} className="card border-0 shadow-sm" style={{ borderLeft: `4px solid ${item.riskIndicator === 'HIGH' ? '#dc3545' : item.riskIndicator === 'MEDIUM' ? '#ffc107' : '#0dcaf0'} !important` }}>
                                            <div className="card-body py-3">
                                                <div className="d-flex align-items-start">
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold flex-shrink-0"
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="fw-semibold">{item.title}</div>
                                                        {item.description && (
                                                            <small className="text-muted d-block mb-2">{item.description}</small>
                                                        )}
                                                        <div className="d-flex flex-wrap gap-2">
                                                            <span className="badge bg-secondary-subtle text-secondary">{item.type}</span>
                                                            {item.riskIndicator && (
                                                                <span className={`badge ${riskColors[item.riskIndicator] || 'bg-info'}`}>
                                                                    {item.riskIndicator} Risk
                                                                </span>
                                                            )}
                                                            {item.isMandatory ? (
                                                                <span className="badge bg-danger-subtle text-danger">Required</span>
                                                            ) : (
                                                                <span className="badge bg-light text-muted">Optional</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!viewingChecklist.items || viewingChecklist.items.length === 0) && (
                                        <div className="text-center text-muted py-4">
                                            <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
                                            No items in this checklist
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        closeViewModal();
                                        handleEdit(viewingChecklist);
                                    }}
                                >
                                    <i className="bi bi-pencil me-2"></i>Edit
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={closeViewModal}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
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
                                        onClick={() => setDeleteConfirmId(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-danger px-4"
                                        onClick={() => handleDelete(deleteConfirmId)}
                                        disabled={deleteMutation.isPending}
                                    >
                                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1 fw-bold text-dark">
                        <i className="bi bi-clipboard-check me-2 text-primary"></i>
                        Inspection Checklists
                    </h1>
                    <p className="text-muted mb-0">Manage inspection criteria for services</p>
                </div>
                {!showBuilder && (
                    <button
                        className="btn btn-lg text-white px-4"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none'
                        }}
                        onClick={handleCreateNew}
                    >
                        <i className="bi bi-plus-lg me-2"></i>Create New Checklist
                    </button>
                )}
            </div>

            {showBuilder ? (
                <ChecklistBuilder
                    onSuccess={handleBuilderClose}
                    editingChecklist={editingChecklist}
                />
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        }}
                                    >
                                        <i className="bi bi-list-check text-white fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                        <small className="text-muted">Total Checklists</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                        }}
                                    >
                                        <i className="bi bi-check-circle text-white fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{stats.items}</h3>
                                        <small className="text-muted">Total Items</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                        }}
                                    >
                                        <i className="bi bi-building text-white fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{stats.departments}</h3>
                                        <small className="text-muted">Departments</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                        }}
                                    >
                                        <i className="bi bi-gear text-white fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold">{stats.services}</h3>
                                        <small className="text-muted">Services</small>
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
                                            placeholder="Search by service or department..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold">Filter by Department</label>
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
                                <div className="col-md-2">
                                    <button
                                        className="btn btn-outline-secondary w-100"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setDepartmentFilter('all');
                                        }}
                                    >
                                        <i className="bi bi-x-lg me-1"></i>Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checklists Table */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0 py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold">
                                    <i className="bi bi-table me-2 text-primary"></i>
                                    All Checklists ({filteredChecklists.length})
                                </h5>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {isLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="ps-4 py-3 text-muted fw-semibold">Department</th>
                                                <th className="py-3 text-muted fw-semibold">Service</th>
                                                <th className="py-3 text-muted fw-semibold text-center">Version</th>
                                                <th className="py-3 text-muted fw-semibold text-center">Items</th>
                                                <th className="py-3 text-muted fw-semibold text-center">Status</th>
                                                <th className="py-3 text-muted fw-semibold text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredChecklists.length > 0 ? (
                                                filteredChecklists.map((checklist: Checklist) => (
                                                    <tr key={checklist.id}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="rounded d-flex align-items-center justify-content-center me-3"
                                                                    style={{
                                                                        width: '36px',
                                                                        height: '36px',
                                                                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                                                    }}
                                                                >
                                                                    <i className="bi bi-building text-white small"></i>
                                                                </div>
                                                                <span className="fw-medium">
                                                                    {checklist.service?.department?.name || 'No Department'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div>
                                                                <div className="fw-semibold">{checklist.service?.service_name || 'Unknown Service'}</div>
                                                                <small className="text-muted">ID: {checklist.serviceId}</small>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge bg-light text-dark px-3 py-2">
                                                                v{checklist.version}
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge bg-primary-subtle text-primary px-3 py-2">
                                                                {checklist.items?.length || 0} items
                                                            </span>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge bg-success-subtle text-success px-3 py-2">
                                                                <i className="bi bi-check-circle me-1"></i>Active
                                                            </span>
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <div className="btn-group">
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleView(checklist)}
                                                                    title="View Details"
                                                                >
                                                                    <i className="bi bi-eye me-1"></i>View
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-secondary"
                                                                    onClick={() => handleEdit(checklist)}
                                                                    title="Edit Checklist"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => setDeleteConfirmId(checklist.id)}
                                                                    disabled={deleteMutation.isPending}
                                                                    title="Delete Checklist"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-5">
                                                        <div className="text-muted">
                                                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-50"></i>
                                                            <p className="mb-2">No checklists found</p>
                                                            <button
                                                                className="btn btn-primary btn-sm"
                                                                onClick={handleCreateNew}
                                                            >
                                                                Create your first checklist
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
