'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import {
    useInspectionChecklist,
    useUpdateInspectionChecklist,
    InspectionChecklistItem
} from '@/hooks/useInspections';

// ===================================
// Types
// ===================================
interface ChecklistItemFormData {
    id?: number;
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
export default function ChecklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const checklistId = parseInt(resolvedParams.id);
    const { data: checklist, isLoading, error } = useInspectionChecklist(checklistId);
    const updateChecklist = useUpdateInspectionChecklist();

    // State
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState<ChecklistItemFormData[]>([]);
    const [editVersion, setEditVersion] = useState('');

    // Initialize edit mode
    const startEditing = () => {
        if (checklist) {
            setEditItems(checklist.items?.map((item: any, idx: number) => ({
                id: item.id,
                title: item.title || '',
                type: item.type || 'BOOLEAN',
                description: item.description || '',
                isMandatory: item.isMandatory ?? true,
                riskIndicator: item.riskIndicator || 'MEDIUM',
                order: item.order || idx + 1
            })) || []);
            setEditVersion(checklist.version || '1.0');
            setIsEditing(true);
        }
    };

    const handleAddItem = () => {
        setEditItems(prev => [...prev, {
            title: '',
            type: 'BOOLEAN',
            description: '',
            isMandatory: true,
            riskIndicator: 'MEDIUM',
            order: prev.length + 1
        }]);
    };

    const handleRemoveItem = (index: number) => {
        setEditItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof ChecklistItemFormData, value: any) => {
        setEditItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        ));
    };

    const handleSave = async () => {
        try {
            await updateChecklist.mutateAsync({
                id: checklistId,
                data: {
                    version: editVersion,
                    items: editItems.filter(item => item.title.trim())
                }
            });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update checklist:', err);
            alert('Failed to save changes');
        }
    };

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

    if (error || !checklist) {
        return (
            <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Failed to load checklist. Please try again.
                </div>
            </div>
        );
    }

    const riskColors: Record<string, string> = {
        HIGH: 'bg-danger',
        MEDIUM: 'bg-warning text-dark',
        LOW: 'bg-info'
    };

    const typeIcons: Record<string, string> = {
        PHOTO: 'bi-camera',
        VIDEO: 'bi-camera-video',
        DOCUMENT: 'bi-file-earmark',
        TEXT: 'bi-input-cursor-text',
        BOOLEAN: 'bi-toggle-on'
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <Link href="/admin/inspections/checklists" className="text-decoration-none text-primary">
                            <i className="bi bi-arrow-left me-1"></i>Back to Checklists
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Checklist #{checklistId}
                    </li>
                </ol>
            </nav>

            {/* Header Card */}
            <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                <div
                    className="card-header border-0 py-4 text-white"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                >
                    <div className="row align-items-center">
                        <div className="col-auto">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <i className="bi bi-list-check fs-2"></i>
                            </div>
                        </div>
                        <div className="col">
                            <h3 className="mb-1 fw-bold">{checklist.service?.service_name || 'Checklist'}</h3>
                            <div className="d-flex gap-3">
                                <span className="opacity-75">
                                    <i className="bi bi-tag me-1"></i>Version {checklist.version}
                                </span>
                                <span className="opacity-75">
                                    <i className="bi bi-list-ol me-1"></i>{checklist.items?.length || 0} Items
                                </span>
                            </div>
                        </div>
                        <div className="col-auto">
                            {!isEditing ? (
                                <button className="btn btn-light" onClick={startEditing}>
                                    <i className="bi bi-pencil me-2"></i>Edit Checklist
                                </button>
                            ) : (
                                <div className="d-flex gap-2">
                                    <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-success"
                                        onClick={handleSave}
                                        disabled={updateChecklist.isPending}
                                    >
                                        {updateChecklist.isPending ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="card-body border-bottom bg-light py-3">
                    <div className="row text-center">
                        <div className="col-md-3 border-end">
                            <small className="text-muted d-block">Total Items</small>
                            <strong>{isEditing ? editItems.length : (checklist.items?.length || 0)}</strong>
                        </div>
                        <div className="col-md-3 border-end">
                            <small className="text-muted d-block">Mandatory</small>
                            <strong className="text-danger">
                                {isEditing
                                    ? editItems.filter(i => i.isMandatory).length
                                    : (checklist.items?.filter((i: InspectionChecklistItem) => i.isMandatory).length || 0)}
                            </strong>
                        </div>
                        <div className="col-md-3 border-end">
                            <small className="text-muted d-block">High Risk</small>
                            <strong className="text-warning">
                                {isEditing
                                    ? editItems.filter(i => i.riskIndicator === 'HIGH').length
                                    : (checklist.items?.filter((i: any) => i.riskIndicator === 'HIGH').length || 0)}
                            </strong>
                        </div>
                        <div className="col-md-3">
                            <small className="text-muted d-block">Service ID</small>
                            <strong>{checklist.serviceId}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Mode - Version */}
            {isEditing && (
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Version</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editVersion}
                                    onChange={(e) => setEditVersion(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Checklist Items */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-semibold">
                        <i className="bi bi-list-ol me-2 text-primary"></i>
                        Checklist Items
                    </h5>
                    {isEditing && (
                        <button className="btn btn-sm btn-outline-primary" onClick={handleAddItem}>
                            <i className="bi bi-plus me-1"></i>Add Item
                        </button>
                    )}
                </div>
                <div className="card-body p-4">
                    {isEditing ? (
                        // Edit Mode
                        <div className="d-flex flex-column gap-3">
                            {editItems.map((item, index) => (
                                <div key={index} className="card bg-light border-0">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <span className="badge bg-primary">#{index + 1}</span>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </div>
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label small">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={item.title}
                                                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                                                    placeholder="Enter item title"
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
                                                    <option value="TEXT">Text</option>
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
                                                        checked={item.isMandatory}
                                                        onChange={(e) => handleItemChange(index, 'isMandatory', e.target.checked)}
                                                    />
                                                    <label className="form-check-label">Mandatory</label>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small">Description</label>
                                                <textarea
                                                    className="form-control"
                                                    rows={2}
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // View Mode
                        <div className="d-flex flex-column gap-3">
                            {checklist.items && checklist.items.length > 0 ? (
                                checklist.items.map((item: any, index: number) => (
                                    <div
                                        key={item.id}
                                        className="card border-0 shadow-sm"
                                        style={{ borderLeft: `4px solid ${item.riskIndicator === 'HIGH' ? '#dc3545' : item.riskIndicator === 'MEDIUM' ? '#ffc107' : '#0dcaf0'} !important` }}
                                    >
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <span className="badge bg-light text-muted">#{index + 1}</span>
                                                        <h6 className="mb-0 fw-semibold">{item.title}</h6>
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-muted small mb-2">{item.description}</p>
                                                    )}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        <span className="badge bg-secondary-subtle text-secondary">
                                                            <i className={`bi ${typeIcons[item.type] || 'bi-circle'} me-1`}></i>
                                                            {item.type}
                                                        </span>
                                                        <span className={`badge ${riskColors[item.riskIndicator] || 'bg-info'}`}>
                                                            {item.riskIndicator} Risk
                                                        </span>
                                                        {item.isMandatory && (
                                                            <span className="badge bg-danger-subtle text-danger">Required</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <i className="bi bi-inbox fs-1 text-muted"></i>
                                    <p className="text-muted mt-2">No items in this checklist</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
