'use client';

import React, { use, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ClipboardCheck,
    Camera,
    FileText,
    Send,
    Save,
    Timer,
    Building2,
    Calendar,
    User,
    MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import {
    useInspectionDetail,
    useSubmitChecklistResponses,
    useFinalizeReport,
    InspectionChecklistItem
} from '@/hooks/useInspections';

type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NOT_APPLICABLE';

interface ChecklistResponse {
    checklistItemId: number;
    response: ComplianceStatus | string;
    remarks: string;
    evidenceUrls: string[];
}

export default function InspectorInspectionDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = use(params);
    const t = useTranslations('inspections');
    const { data: inspection, isLoading, error } = useInspectionDetail(resolvedParams.id);
    const submitResponses = useSubmitChecklistResponses();
    const finalizeReport = useFinalizeReport();

    const [responses, setResponses] = useState<Record<number, ChecklistResponse>>({});
    const [activeTab, setActiveTab] = useState<'checklist' | 'observations' | 'evidence'>('checklist');

    const handleResponseChange = (itemId: number, field: keyof ChecklistResponse, value: any) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                checklistItemId: itemId,
                [field]: value,
            }
        }));
    };

    const handleSaveResponses = async () => {
        const responseArray = Object.values(responses).filter(r => r.response);
        if (responseArray.length === 0) {
            alert('Please fill at least one checklist item');
            return;
        }

        try {
            await submitResponses.mutateAsync({
                inspectionId: resolvedParams.id,
                responses: responseArray.map(r => ({
                    checklistItemId: r.checklistItemId,
                    response: r.response,
                    remarks: r.remarks || undefined,
                    evidenceUrls: r.evidenceUrls || [],
                })),
            });
            alert('Responses saved successfully!');
        } catch (err) {
            alert('Failed to save responses');
        }
    };

    const handleFinalizeReport = async () => {
        if (!confirm('Are you sure you want to finalize and publish this report? This action cannot be undone.')) {
            return;
        }

        try {
            await finalizeReport.mutateAsync(resolvedParams.id);
            alert('Report published successfully!');
        } catch (err) {
            alert('Failed to finalize report');
        }
    };

    const getComplianceIcon = (status: ComplianceStatus) => {
        switch (status) {
            case 'COMPLIANT':
                return <CheckCircle className="text-success" size={20} />;
            case 'NON_COMPLIANT':
                return <XCircle className="text-danger" size={20} />;
            case 'PARTIALLY_COMPLIANT':
                return <AlertTriangle className="text-warning" size={20} />;
            case 'NOT_APPLICABLE':
                return <span className="text-muted">N/A</span>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !inspection) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger">
                    Failed to load inspection details
                </div>
            </div>
        );
    }

    const checklistItems = inspection.checklist?.items || [];
    const isReadOnly = ['REPORT_PUBLISHED', 'CLOSED'].includes(inspection.status);

    return (
        <div className="container-fluid py-4">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link href="/user/inspections" className="text-decoration-none">
                            <ArrowLeft size={16} className="me-1" />
                            Back to Inspections
                        </Link>
                    </li>
                    <li className="breadcrumb-item active">{resolvedParams.id.slice(0, 8)}...</li>
                </ol>
            </nav>

            {/* Header Card */}
            <div className="card border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }}>
                <div className="card-body text-white p-4">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h3 className="mb-2 fw-bold">
                                {inspection.service?.service_name || 'Inspection Details'}
                            </h3>
                            <div className="d-flex flex-wrap gap-3">
                                <span className="d-flex align-items-center gap-1">
                                    <Building2 size={16} />
                                    App: {inspection.applicationId}
                                </span>
                                <span className="d-flex align-items-center gap-1">
                                    <Calendar size={16} />
                                    {new Date(inspection.scheduledDate).toLocaleDateString()}
                                </span>
                                <span className="d-flex align-items-center gap-1">
                                    <User size={16} />
                                    {inspection.inspectorType === 'THIRD_PARTY' ? 'Third Party' : 'Department'}
                                </span>
                            </div>
                        </div>
                        <div className="col-md-4 text-md-end mt-3 mt-md-0">
                            <span className={`badge fs-6 ${inspection.status === 'REPORT_PUBLISHED' ? 'bg-success' :
                                inspection.status === 'IN_PROGRESS' ? 'bg-warning text-dark' :
                                    'bg-info'
                                }`}>
                                {inspection.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'checklist' ? 'active' : ''}`}
                        onClick={() => setActiveTab('checklist')}
                    >
                        <ClipboardCheck size={16} className="me-2" />
                        Checklist ({checklistItems.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'observations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('observations')}
                    >
                        <MessageSquare size={16} className="me-2" />
                        Observations ({inspection.observations?.length || 0})
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'evidence' ? 'active' : ''}`}
                        onClick={() => setActiveTab('evidence')}
                    >
                        <Camera size={16} className="me-2" />
                        Evidence
                    </button>
                </li>
            </ul>

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                        <h5 className="mb-0 fw-semibold">Inspection Checklist</h5>
                        {!isReadOnly && (
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-outline-primary"
                                    onClick={handleSaveResponses}
                                    disabled={submitResponses.isPending}
                                >
                                    <Save size={16} className="me-1" />
                                    {submitResponses.isPending ? 'Saving...' : 'Save Progress'}
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleFinalizeReport}
                                    disabled={finalizeReport.isPending}
                                >
                                    <Send size={16} className="me-1" />
                                    {finalizeReport.isPending ? 'Publishing...' : 'Finalize & Publish'}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: '5%' }}>#</th>
                                        <th style={{ width: '35%' }}>Checklist Item</th>
                                        <th style={{ width: '15%' }}>Type</th>
                                        <th style={{ width: '20%' }}>Compliance Status</th>
                                        <th style={{ width: '25%' }}>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklistItems.map((item: InspectionChecklistItem, index: number) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <div>
                                                    <span className="fw-medium">{item.title}</span>
                                                    {item.isMandatory && (
                                                        <span className="badge bg-danger ms-2">Required</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">{item.type}</span>
                                            </td>
                                            <td>
                                                {isReadOnly ? (
                                                    <span>{responses[item.id]?.response || 'Not filled'}</span>
                                                ) : (
                                                    <select
                                                        className="form-select form-select-sm"
                                                        value={responses[item.id]?.response || ''}
                                                        onChange={(e) => handleResponseChange(item.id, 'response', e.target.value)}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="COMPLIANT">✓ Compliant</option>
                                                        <option value="NON_COMPLIANT">✗ Non-Compliant</option>
                                                        <option value="PARTIALLY_COMPLIANT">⚠ Partially Compliant</option>
                                                        <option value="NOT_APPLICABLE">N/A</option>
                                                    </select>
                                                )}
                                            </td>
                                            <td>
                                                {isReadOnly ? (
                                                    <span>{responses[item.id]?.remarks || '-'}</span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        placeholder="Add remarks..."
                                                        value={responses[item.id]?.remarks || ''}
                                                        onChange={(e) => handleResponseChange(item.id, 'remarks', e.target.value)}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Observations Tab */}
            {activeTab === 'observations' && (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom py-3">
                        <h5 className="mb-0 fw-semibold">Observations</h5>
                    </div>
                    <div className="card-body">
                        {inspection.observations?.length === 0 ? (
                            <div className="text-center py-4">
                                <MessageSquare size={48} className="text-muted mb-3" />
                                <p className="text-muted">No observations logged yet.</p>
                            </div>
                        ) : (
                            <div className="list-group">
                                {inspection.observations?.map((obs) => (
                                    <div key={obs.id} className="list-group-item">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <p className="mb-1">{obs.observationText}</p>
                                                <small className="text-muted">
                                                    {new Date(obs.createdAt).toLocaleString()}
                                                </small>
                                            </div>
                                            <span className={`badge ${obs.severity === 'CRITICAL' ? 'bg-danger' :
                                                obs.severity === 'MAJOR' ? 'bg-warning text-dark' :
                                                    'bg-info'
                                                }`}>
                                                {obs.severity}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Evidence Tab */}
            {activeTab === 'evidence' && (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom py-3">
                        <h5 className="mb-0 fw-semibold">Evidence & Documents</h5>
                    </div>
                    <div className="card-body">
                        <div className="text-center py-4">
                            <Camera size={48} className="text-muted mb-3" />
                            <p className="text-muted">Evidence upload feature coming soon.</p>
                            <button className="btn btn-primary" disabled>
                                <Camera size={16} className="me-2" />
                                Upload Photo/Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
