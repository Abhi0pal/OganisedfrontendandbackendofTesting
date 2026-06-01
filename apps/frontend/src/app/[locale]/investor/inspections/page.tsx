'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from '@/navigation';
import {
    useMyInspections,
    useRespondToObservation,
    useSubmitFeedback,
    InspectionTransaction,
    InspectionObservation
} from '@/hooks/useInspections';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useServices } from '@/hooks/master/useServices';
import FloatingAiChat from '@/components/investor/FloatingAiChat';

// ===================================
// Types
// ===================================
interface Department {
    id: number;
    name: string;
    abbreviation?: string;
}

interface Service {
    id: number;
    service_name: string;
    department_id?: number;
}

// ===================================
// Helper Functions
// ===================================
function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getHoursSince(dateString: string): number {
    const now = new Date().getTime();
    const then = new Date(dateString).getTime();
    return (now - then) / (1000 * 60 * 60);
}

function isReportDelayed(inspection: InspectionTransaction): boolean {
    // Check if report upload time > 48 hours from inspection date
    const reportDate = (inspection as any).reportUploadedAt || (inspection as any).reportPublishedAt;
    if (!reportDate || !inspection.inspectionDate) return false;
    const inspectionTime = new Date(inspection.inspectionDate).getTime();
    const reportTime = new Date(reportDate).getTime();
    return (reportTime - inspectionTime) > 48 * 60 * 60 * 1000;
}

function hasOpenObservations(inspection: InspectionTransaction): boolean {
    return (inspection.observations?.filter(o => o.status === 'OPEN').length || 0) > 0;
}

// ===================================
// Main Component
// ===================================
export default function InvestorDashboardPage() {
    const { data: inspections = [], isLoading: inspectionsLoading, error } = useMyInspections();
    const { data: allDepartments = [], isLoading: departmentsLoading } = useDepartments();
    const submitFeedback = useSubmitFeedback();
    const respondMutation = useRespondToObservation();

    // State
    const [activeTab, setActiveTab] = useState<'tracker' | 'checklists'>('tracker');
    const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
    const [serviceFilter, setServiceFilter] = useState<number | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch services based on department
    const { data: allServices = [], isLoading: servicesLoading } = useServices({
        isActive: true,
        departmentIds: departmentFilter !== 'all' ? [departmentFilter] : undefined,
    });

    // Reset service filter when department changes
    useEffect(() => {
        setServiceFilter('all');
    }, [departmentFilter]);

    // Modal States
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; inspectionId: string | null }>({ open: false, inspectionId: null });
    const [responseModal, setResponseModal] = useState<{ open: boolean; observation: InspectionObservation | null }>({ open: false, observation: null });
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [responseAttachments, setResponseAttachments] = useState<File[]>([]);

    // Filter services to only show those from selected department or all
    const filteredServices = useMemo(() => {
        if (!Array.isArray(allServices)) return [];
        if (departmentFilter === 'all') return allServices;
        return allServices.filter((svc: any) => svc.department_id === departmentFilter);
    }, [allServices, departmentFilter]);

    // Filter inspections based on all filters
    const filteredInspections = useMemo(() => {
        return inspections.filter((insp: any) => {
            // Department filter
            if (departmentFilter !== 'all' && insp.service?.department?.id !== departmentFilter) {
                return false;
            }
            // Service filter
            if (serviceFilter !== 'all' && insp.service?.id !== serviceFilter) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all' && insp.status !== statusFilter) {
                return false;
            }
            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesId = insp.id.toLowerCase().includes(query);
                const matchesApp = insp.applicationId.toLowerCase().includes(query);
                const matchesService = insp.service?.service_name?.toLowerCase().includes(query);
                if (!matchesId && !matchesApp && !matchesService) {
                    return false;
                }
            }
            return true;
        });
    }, [inspections, departmentFilter, serviceFilter, statusFilter, searchQuery]);

    // Stats calculation
    const stats = useMemo(() => ({
        upcomingVisits: inspections.filter(i => i.status === 'SCHEDULED' && new Date(i.scheduledDate) > new Date()).length,
        actionRequired: inspections.filter(i => ['APPLICANT_RESPONSE_PENDING', 'OBSERVATIONS_LOGGED'].includes(i.status) || hasOpenObservations(i)).length,
        completedReports: inspections.filter(i => ['REPORT_PUBLISHED', 'CLOSED'].includes(i.status)).length,
    }), [inspections]);

    const statsConfig = [
        { key: 'upcomingVisits', label: 'Upcoming Visits', bg: '#e2e8f0', border: '#64748b', arrow: '#64748b' },
        { key: 'actionRequired', label: 'Action Required', bg: '#fee2e2', border: '#f87171', arrow: '#dc2626' },
        { key: 'completedReports', label: 'Completed Reports', bg: '#dcfce7', border: '#4ade80', arrow: '#16a34a' },
    ];

    // Handlers
    const handleSubmitFeedback = async () => {
        if (!feedbackModal.inspectionId || feedbackRating < 1) {
            alert('Please select a rating');
            return;
        }
        try {
            await submitFeedback.mutateAsync({
                inspectionId: feedbackModal.inspectionId,
                rating: feedbackRating,
                comment: feedbackComment || undefined,
            });
            setFeedbackModal({ open: false, inspectionId: null });
            setFeedbackRating(0);
            setFeedbackComment('');
            alert('Feedback submitted successfully!');
        } catch (err) {
            alert('Failed to submit feedback');
        }
    };

    const handleSubmitResponse = async () => {
        if (!responseModal.observation || !responseMessage.trim()) {
            alert('Please enter your response');
            return;
        }
        try {
            const attachments = responseAttachments.map(file => URL.createObjectURL(file));

            await respondMutation.mutateAsync({
                observationId: responseModal.observation.id,
                message: responseMessage,
                attachments,
            });
            setResponseModal({ open: false, observation: null });
            setResponseMessage('');
            setResponseAttachments([]);
            alert('Response submitted successfully!');
        } catch (err) {
            alert('Failed to submit response');
        }
    };

    // Get compliance status badge
    const getComplianceStatus = (inspection: InspectionTransaction) => {
        const openCount = inspection.observations?.filter(o => o.status === 'OPEN').length || 0;
        if (inspection.status === 'REPORT_PUBLISHED' || inspection.status === 'CLOSED') {
            if (openCount === 0) {
                return { label: 'Compliant', color: 'bg-success', textColor: 'text-white' };
            }
            return { label: 'Non-Compliant', color: 'bg-danger', textColor: 'text-white' };
        }
        if (openCount > 0) {
            return { label: 'Observations Pending', color: 'bg-warning', textColor: 'text-dark' };
        }
        return { label: 'In Progress', color: 'bg-info', textColor: 'text-white' };
    };

    if (inspectionsLoading || departmentsLoading) {
        return (
            <div className="container-fluid p-4">
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container-fluid p-4">
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Failed to load inspections. Please try again later.
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">
                        <i className="bi bi-clipboard-check me-2 text-success"></i>
                        Inspection Dashboard
                    </h3>
                    <p className="text-muted mb-0">Track and manage your inspection requests</p>
                </div>
                <button className="btn btn-outline-success btn-sm" onClick={() => window.location.reload()}>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                </button>
            </div>

            {/* Stats Cards (Annexure 6 Header Stats) */}
            <div className="row g-3 mb-4">
                {statsConfig.map((item, index) => (
                    <div key={index} className="col-md-4">
                        <div
                            className="card h-100 shadow-sm"
                            style={{
                                backgroundColor: item.bg,
                                borderColor: item.border,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderRadius: '12px'
                            }}
                        >
                            <div className="card-body p-4 d-flex flex-column justify-content-between">
                                <div className="mb-3" style={{ fontSize: '1.05rem', color: '#4b5563' }}>
                                    {item.label}
                                </div>
                                <div className="d-flex justify-content-between align-items-end">
                                    <div className="fw-normal text-dark lh-1" style={{ fontSize: '2.5rem', color: '#111827' }}>
                                        {stats[item.key as keyof typeof stats]}
                                    </div>
                                    <i className="bi bi-arrow-right fs-4 mb-1" style={{ color: item.arrow }}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'tracker' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tracker')}
                    >
                        <i className="bi bi-table me-2"></i>
                        Inspection Tracker
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        className={`nav-link ${activeTab === 'checklists' ? 'active' : ''}`}
                        onClick={() => setActiveTab('checklists')}
                    >
                        <i className="bi bi-upload me-2"></i>
                        My Checklists
                    </button>
                </li>
            </ul>

            {/* Tracker Tab */}
            {activeTab === 'tracker' && (
                <>
                    {/* Filters */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold">Department</label>
                                    <select
                                        className="form-select"
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : +e.target.value)}
                                    >
                                        <option value="all">All Departments</option>
                                        {allDepartments.map((dept: Department) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold">Service</label>
                                    <select
                                        className="form-select"
                                        value={serviceFilter}
                                        onChange={(e) => setServiceFilter(e.target.value === 'all' ? 'all' : +e.target.value)}
                                    >
                                        <option value="all">All Services</option>
                                        {filteredServices.map((svc: Service) => (
                                            <option key={svc.id} value={svc.id}>{svc.service_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold">Status</label>
                                    <select
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="SCHEDULED">Scheduled</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="OBSERVATIONS_LOGGED">Observations Logged</option>
                                        <option value="APPLICANT_RESPONSE_PENDING">Response Pending</option>
                                        <option value="REPORT_PUBLISHED">Report Published</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label small fw-semibold">Search</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by ID, App ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Grid (Annexure 6 Tracker) */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-list-ul me-2"></i>
                                Individual Inspection Report Tracker
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Inspection ID</th>
                                            <th>Service / Department</th>
                                            <th>Inspector Name</th>
                                            <th>Date</th>
                                            <th>Compliance Status</th>
                                            <th className="text-center">Photos</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInspections.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-5 text-muted">
                                                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                                    No inspections found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInspections.map((inspection) => {
                                                const compliance = getComplianceStatus(inspection);
                                                const isDelayed = isReportDelayed(inspection);
                                                const needsAction = ['APPLICANT_RESPONSE_PENDING', 'OBSERVATIONS_LOGGED'].includes(inspection.status);
                                                const openObs = inspection.observations?.filter(o => o.status === 'OPEN') || [];

                                                return (
                                                    <tr
                                                        key={inspection.id}
                                                        className={needsAction ? 'table-warning' : ''}
                                                    >
                                                        <td>
                                                            <Link href={`/investor/inspections/${inspection.id}`} className="text-decoration-none fw-semibold text-primary">
                                                                #{inspection.id.slice(0, 8)}
                                                            </Link>
                                                            <br />
                                                            <small className="text-muted">App: {inspection.applicationId}</small>
                                                        </td>
                                                        <td>
                                                            <span className="fw-medium">{inspection.service?.service_name || 'N/A'}</span>
                                                            <br />
                                                            <small className="text-muted">
                                                                {(inspection as any).service?.department?.name || 'Department'}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <span className="fw-medium">
                                                                {inspection.inspectorType === 'DEPARTMENT_OFFICIAL'
                                                                    ? 'Dept. Inspector'
                                                                    : 'Third Party'}
                                                            </span>
                                                            <br />
                                                            <small className="text-muted">
                                                                ID: {inspection.departmentInspectorId || inspection.thirdPartyInspectorId || 'N/A'}
                                                            </small>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div>
                                                                    <span>{formatDate(inspection.scheduledDate)}</span>
                                                                    <br />
                                                                    <small className="text-muted">
                                                                        {inspection.inspectionDate ? formatDate(inspection.inspectionDate) : 'Pending'}
                                                                    </small>
                                                                </div>
                                                                {isDelayed && (
                                                                    <span
                                                                        className="text-danger"
                                                                        title="Report uploaded after 48 hours"
                                                                        style={{ cursor: 'help' }}
                                                                    >
                                                                        <i className="bi bi-clock-fill fs-5"></i>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${compliance.color} ${compliance.textColor}`}>
                                                                {compliance.label}
                                                            </span>
                                                            {openObs.length > 0 && (
                                                                <span className="badge bg-danger ms-1">{openObs.length} issues</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-secondary btn-sm"
                                                                title="View Evidence"
                                                            >
                                                                <i className="bi bi-camera"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <div className="d-flex gap-1 justify-content-center">
                                                                <Link href={`/investor/inspections/${inspection.id}`}>
                                                                    <button className="btn btn-primary btn-sm" title="View Details">
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                </Link>

                                                                {/* Response button for open observations */}
                                                                {openObs.length > 0 && (
                                                                    <button
                                                                        className="btn btn-warning btn-sm"
                                                                        title="Respond to Observations"
                                                                        onClick={() => setResponseModal({ open: true, observation: openObs[0] })}
                                                                    >
                                                                        <i className="bi bi-reply"></i>
                                                                    </button>
                                                                )}

                                                                {/* Feedback button for completed reports */}
                                                                {['REPORT_PUBLISHED', 'CLOSED'].includes(inspection.status) && (
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        title="Submit Feedback"
                                                                        onClick={() => setFeedbackModal({ open: true, inspectionId: inspection.id })}
                                                                    >
                                                                        <i className="bi bi-star"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* My Checklists Tab (Self-Service Section) */}
            {activeTab === 'checklists' && (
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-white border-bottom py-3">
                        <h5 className="mb-0 fw-semibold">
                            <i className="bi bi-upload me-2"></i>
                            Self-Service Checklist Uploads
                        </h5>
                    </div>
                    <div className="card-body">
                        {filteredInspections.filter(i => i.status === 'SCHEDULED').length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <h5 className="mt-3 text-muted">No Upcoming Inspections</h5>
                                <p className="text-muted">Pre-upload documents when you have scheduled inspections.</p>
                            </div>
                        ) : (
                            <div className="accordion" id="checklistAccordion">
                                {filteredInspections.filter(i => i.status === 'SCHEDULED').map((inspection, index) => (
                                    <div key={inspection.id} className="accordion-item">
                                        <h2 className="accordion-header">
                                            <button
                                                className={`accordion-button ${index > 0 ? 'collapsed' : ''}`}
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target={`#checklist-${inspection.id}`}
                                            >
                                                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                    <div>
                                                        <strong>{inspection.service?.service_name}</strong>
                                                        <br />
                                                        <small className="text-muted">Scheduled: {formatDate(inspection.scheduledDate)}</small>
                                                    </div>
                                                    <span className="badge bg-info">Pre-Upload</span>
                                                </div>
                                            </button>
                                        </h2>
                                        <div
                                            id={`checklist-${inspection.id}`}
                                            className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                                        >
                                            <div className="accordion-body">
                                                <div className="alert alert-info py-3 mb-0 d-flex align-items-center justify-content-between">
                                                    <div>
                                                        <h6 className="mb-1"><i className="bi bi-info-circle me-2"></i>Self-Reporting Checklist</h6>
                                                        <p className="mb-0 small text-muted">Complete the checklist questions, provide remarks, and upload photo/video evidence prior to the inspection.</p>
                                                    </div>
                                                    <Link href={`/investor/inspections/${inspection.id}/checklist`} className="btn btn-primary">
                                                        Fill Checklist & Upload Evidence
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModal.open && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-star me-2 text-warning"></i>
                                    Submit Feedback
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setFeedbackModal({ open: false, inspectionId: null });
                                        setFeedbackRating(0);
                                        setFeedbackComment('');
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-4">
                                    Please rate your inspection experience. This feedback is required before archiving the report.
                                </p>

                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Your Rating *</label>
                                    <div className="d-flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`btn btn-lg ${feedbackRating >= star ? 'btn-warning' : 'btn-outline-secondary'}`}
                                                onClick={() => setFeedbackRating(star)}
                                                style={{ fontSize: '1.5rem', padding: '0.25rem 0.75rem' }}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Additional Comments</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        placeholder="Share your experience or suggestions..."
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setFeedbackModal({ open: false, inspectionId: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSubmitFeedback}
                                    disabled={submitFeedback.isPending || feedbackRating === 0}
                                >
                                    {submitFeedback.isPending ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            Submit Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {responseModal.open && responseModal.observation && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-white border-bottom-0 pb-0">
                                <h5 className="modal-title fw-bold text-dark">
                                    Respond to Observation
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setResponseModal({ open: false, observation: null });
                                        setResponseMessage('');
                                        setResponseAttachments([]);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-4">
                                    Please provide a clarification or explanation for the observation raised during the inspection.
                                </p>
                                <div className="bg-light p-4 rounded-3 mb-4 border">
                                    <div className="mb-4">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center">
                                                <span className="badge bg-danger rounded-circle me-3 d-flex justify-content-center align-items-center" style={{ width: '28px', height: '28px', fontSize: '14px' }}>Q</span>
                                                <h6 className="mb-0 fw-bold">Inspector's Observation</h6>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <span className={`badge ${responseModal.observation.severity === 'CRITICAL' ? 'bg-danger' :
                                                    responseModal.observation.severity === 'MAJOR' ? 'bg-warning text-dark' :
                                                        'bg-info'
                                                    }`}>
                                                    {responseModal.observation.severity}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="ms-5 text-dark mb-1 ps-1">{responseModal.observation.observationText}</p>
                                        <div className="ms-5 ps-1">
                                            <small className="text-muted">
                                                <i className="bi bi-clock me-1"></i>
                                                Raised on {responseModal.observation.createdAt ? formatDateTime(responseModal.observation.createdAt) : 'N/A'}
                                            </small>
                                        </div>
                                    </div>

                                    <hr className="my-4 border-secondary opacity-25" />

                                    <div>
                                        <div className="d-flex align-items-center mb-3">
                                            <span className="badge bg-primary rounded-circle me-3 d-flex justify-content-center align-items-center" style={{ width: '28px', height: '28px', fontSize: '14px' }}>A</span>
                                            <h6 className="mb-0 fw-bold">Your Explanation *</h6>
                                        </div>
                                        <div className="ms-5 ps-1">
                                            <textarea
                                                className="form-control bg-white shadow-sm"
                                                rows={5}
                                                placeholder="Provide your response or clarification here..."
                                                value={responseMessage}
                                                onChange={(e) => setResponseMessage(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Attach Supporting Documents</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setResponseAttachments(Array.from(e.target.files));
                                            }
                                        }}
                                    />
                                    {responseAttachments.length > 0 && (
                                        <div className="mt-2 text-sm text-green-600">
                                            {responseAttachments.length} file(s) selected
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setResponseModal({ open: false, observation: null })}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSubmitResponse}
                                    disabled={respondMutation.isPending || !responseMessage.trim()}
                                >
                                    {respondMutation.isPending ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            Submit Response
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant */}
            <FloatingAiChat />
        </div>
    );
}
