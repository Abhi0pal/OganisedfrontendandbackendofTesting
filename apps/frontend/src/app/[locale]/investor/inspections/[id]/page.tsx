'use client';

import React, { useState, use } from 'react';
import { Link } from '@/navigation';
import {
    useInspectionDetail,
    useRespondToObservation,
    useSubmitFeedback,
    useInspectionFeedback,
    InspectionObservation
} from '@/hooks/useInspections';

// ===================================
// Status & Severity Configurations
// ===================================
const statusConfig: Record<string, { label: string; bg: string; text: string; icon: string; gradient: string }> = {
    SCHEDULED: {
        label: 'Scheduled',
        bg: 'bg-info',
        text: 'text-white',
        icon: 'bi-calendar-event',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    IN_PROGRESS: {
        label: 'In Progress',
        bg: 'bg-primary',
        text: 'text-white',
        icon: 'bi-hourglass-split',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    OBSERVATIONS_LOGGED: {
        label: 'Observations Logged',
        bg: 'bg-warning',
        text: 'text-dark',
        icon: 'bi-exclamation-triangle',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    APPLICANT_RESPONSE_PENDING: {
        label: 'Response Needed',
        bg: 'bg-warning',
        text: 'text-dark',
        icon: 'bi-exclamation-circle',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    FINALIZATION: {
        label: 'Finalizing',
        bg: 'bg-primary',
        text: 'text-white',
        icon: 'bi-gear',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    REPORT_PUBLISHED: {
        label: 'Report Published',
        bg: 'bg-success',
        text: 'text-white',
        icon: 'bi-check-circle',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    CLOSED: {
        label: 'Closed',
        bg: 'bg-secondary',
        text: 'text-white',
        icon: 'bi-x-circle',
        gradient: 'linear-gradient(135deg, #485563 0%, #29323c 100%)'
    },
};

const severityConfig: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    CRITICAL: { bg: 'bg-danger', text: 'text-white', icon: 'bi-exclamation-octagon-fill', border: '#dc3545' },
    MAJOR: { bg: 'bg-orange', text: 'text-white', icon: 'bi-exclamation-octagon', border: '#fd7e14' },
    MINOR: { bg: 'bg-warning', text: 'text-dark', icon: 'bi-exclamation-triangle', border: '#ffc107' },
    INFO: { bg: 'bg-info', text: 'text-white', icon: 'bi-info-circle', border: '#0dcaf0' },
};

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

function isReportDelayed(inspection: any): boolean {
    const reportDate = inspection.reportUploadedAt || inspection.reportPublishedAt;
    if (!reportDate || !inspection.inspectionDate) return false;
    const inspectionTime = new Date(inspection.inspectionDate).getTime();
    const reportTime = new Date(reportDate).getTime();
    return (reportTime - inspectionTime) > 48 * 60 * 60 * 1000;
}

// ===================================
// Main Component
// ===================================
export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [activeTab, setActiveTab] = useState('report');
    const [responseModal, setResponseModal] = useState<{ open: boolean; observation: InspectionObservation | null }>({ open: false, observation: null });
    const [responseMessage, setResponseMessage] = useState('');
    const [responseAttachments, setResponseAttachments] = useState<File[]>([]);

    const { data: inspection, isLoading, error } = useInspectionDetail(resolvedParams.id);
    const respondMutation = useRespondToObservation();

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
            console.error('Failed to submit response:', err);
            alert('Failed to submit response');
        }
    };

    if (isLoading) {
        return (
            <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !inspection) {
        return (
            <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Failed to load inspection details. Please try again later.
                </div>
            </div>
        );
    }

    const statusInfo = statusConfig[inspection.status] || statusConfig.SCHEDULED;
    const openObservations = inspection.observations?.filter((o: InspectionObservation) => o.status === 'OPEN') || [];
    const resolvedObservations = inspection.observations?.filter((o: InspectionObservation) => o.status === 'RESOLVED') || [];
    const isDelayed = isReportDelayed(inspection);
    const needsAction = ['APPLICANT_RESPONSE_PENDING', 'OBSERVATIONS_LOGGED'].includes(inspection.status);

    const tabs = [
        { id: 'report', label: 'Inspection Report', icon: 'bi-clipboard-data' },
        { id: 'checklist', label: 'Checklist', icon: 'bi-list-check' },
        { id: 'observations', label: 'Observations', icon: 'bi-exclamation-triangle', badge: openObservations.length },
    ];

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                        <Link href="/investor/inspections" className="text-decoration-none text-success">
                            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
                        </Link>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                        Inspection #{resolvedParams.id.slice(0, 8)}
                    </li>
                </ol>
            </nav>

            {/* Alert Banner for Action Required */}
            {needsAction && (
                <div className="alert alert-warning border-0 shadow-sm mb-4" style={{ borderLeft: '4px solid #ffc107 !important' }}>
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                        <div className="flex-grow-1">
                            <h6 className="mb-0 fw-bold">Action Required</h6>
                            <small>You have {openObservations.length} observation(s) requiring your response. Please address them to proceed.</small>
                        </div>
                        <button
                            className="btn btn-warning btn-sm"
                            onClick={() => setActiveTab('observations')}
                        >
                            View Observations
                        </button>
                    </div>
                </div>
            )}

            {/* Main Header Card */}
            <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                <div
                    className="card-header border-0 py-4 text-white"
                    style={{ background: statusInfo.gradient }}
                >
                    <div className="row align-items-center">
                        <div className="col-auto">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center bg-white bg-opacity-25"
                                style={{ width: '70px', height: '70px' }}
                            >
                                <i className="bi bi-clipboard-check fs-1"></i>
                            </div>
                        </div>
                        <div className="col">
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <h3 className="mb-0 fw-bold">{inspection.service?.service_name || 'Inspection'}</h3>
                                {isDelayed && (
                                    <span className="badge bg-danger" title="Report uploaded after 48 hours">
                                        <i className="bi bi-clock-fill me-1"></i>Delayed
                                    </span>
                                )}
                            </div>
                            <div className="d-flex flex-wrap gap-3">
                                <span className="opacity-75">
                                    <i className="bi bi-hash me-1"></i>
                                    ID: {resolvedParams.id.slice(0, 12)}...
                                </span>
                                <span className="opacity-75">
                                    <i className="bi bi-file-text me-1"></i>
                                    Application: {inspection.applicationId}
                                </span>
                                {(inspection as any).service?.department?.name && (
                                    <span className="opacity-75">
                                        <i className="bi bi-building me-1"></i>
                                        {(inspection as any).service.department.name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="col-auto">
                            <span className={`badge ${statusInfo.bg} ${statusInfo.text} px-4 py-2 fs-6`}>
                                <i className={`bi ${statusInfo.icon} me-2`}></i>
                                {statusInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="card-body border-bottom bg-light py-3">
                    <div className="row text-center g-3">
                        <div className="col-md-2 col-6 border-end">
                            <small className="text-muted d-block mb-1">Scheduled Date</small>
                            <strong>{formatDate(inspection.scheduledDate)}</strong>
                        </div>
                        <div className="col-md-2 col-6 border-end">
                            <small className="text-muted d-block mb-1">Inspection Date</small>
                            <strong>{inspection.inspectionDate ? formatDate(inspection.inspectionDate) : '—'}</strong>
                        </div>
                        <div className="col-md-2 col-6 border-end">
                            <small className="text-muted d-block mb-1">Inspector Type</small>
                            <strong className="text-capitalize">
                                {inspection.inspectorType === 'DEPARTMENT_OFFICIAL' ? 'Department' : 'Third Party'}
                            </strong>
                        </div>
                        <div className="col-md-2 col-6 border-end">
                            <small className="text-muted d-block mb-1">Total Observations</small>
                            <strong>{inspection.observations?.length || 0}</strong>
                        </div>
                        <div className="col-md-2 col-6 border-end">
                            <small className="text-muted d-block mb-1">Open Issues</small>
                            <strong className="text-danger">{openObservations.length}</strong>
                        </div>
                        <div className="col-md-2 col-6">
                            <small className="text-muted d-block mb-1">Resolved</small>
                            <strong className="text-success">{resolvedObservations.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Main Content */}
                <div className="col-lg-8">
                    {/* Tabs Navigation */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom p-0">
                            <ul className="nav nav-tabs nav-fill border-0">
                                {tabs.map((tab) => (
                                    <li key={tab.id} className="nav-item">
                                        <button
                                            className={`nav-link rounded-0 py-3 ${activeTab === tab.id ? 'active border-bottom border-primary border-3' : ''}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            <i className={`bi ${tab.icon} me-2`}></i>
                                            {tab.label}
                                            {tab.badge && tab.badge > 0 && (
                                                <span className="badge bg-danger rounded-pill ms-2">{tab.badge}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card-body p-4">
                            {/* Inspection Report (Overview + Download) Tab */}
                            {activeTab === 'report' && (
                                <>
                                    <div className="row g-4">
                                        {/* Timeline */}
                                        <div className="col-12">
                                            <h6 className="fw-bold mb-3">
                                                <i className="bi bi-clock-history me-2 text-primary"></i>
                                                Inspection Timeline
                                            </h6>
                                            <div className="d-flex justify-content-between position-relative mb-4">
                                                <div className="position-absolute" style={{ top: '15px', left: '10%', right: '10%', height: '4px', background: '#e9ecef', zIndex: 0 }}></div>
                                                {[
                                                    { status: 'SCHEDULED', label: 'Scheduled', date: inspection.scheduledDate },
                                                    { status: 'IN_PROGRESS', label: 'Inspection', date: inspection.inspectionDate },
                                                    { status: 'REPORT_PUBLISHED', label: 'Report', date: (inspection as any).reportUploadedAt },
                                                    { status: 'CLOSED', label: 'Closed', date: null },
                                                ].map((step, idx) => {
                                                    const isActive = ['SCHEDULED', 'IN_PROGRESS', 'OBSERVATIONS_LOGGED', 'APPLICANT_RESPONSE_PENDING', 'FINALIZATION', 'REPORT_PUBLISHED', 'CLOSED'].indexOf(inspection.status) >= idx;
                                                    return (
                                                        <div key={step.status} className="text-center position-relative" style={{ zIndex: 1, flex: 1 }}>
                                                            <div
                                                                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2 ${isActive ? 'bg-success text-white' : 'bg-light text-muted'}`}
                                                                style={{ width: '36px', height: '36px' }}
                                                            >
                                                                <i className={`bi ${isActive ? 'bi-check' : 'bi-circle'}`}></i>
                                                            </div>
                                                            <div className="small fw-medium">{step.label}</div>
                                                            {step.date && <small className="text-muted">{formatDate(step.date)}</small>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="col-md-6">
                                            <div className="card bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="text-muted mb-3">
                                                        <i className="bi bi-calendar3 me-2"></i>Schedule Details
                                                    </h6>
                                                    <table className="table table-sm table-borderless mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <td className="text-muted">Scheduled Date</td>
                                                                <td className="fw-semibold text-end">{formatDate(inspection.scheduledDate)}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="text-muted">Actual Inspection</td>
                                                                <td className="fw-semibold text-end">{inspection.inspectionDate ? formatDate(inspection.inspectionDate) : '—'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="text-muted">Created</td>
                                                                <td className="fw-semibold text-end">{formatDateTime(inspection.createdAt)}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="card bg-light border-0">
                                                <div className="card-body">
                                                    <h6 className="text-muted mb-3">
                                                        <i className="bi bi-person-badge me-2"></i>Inspector Info
                                                    </h6>
                                                    <table className="table table-sm table-borderless mb-0">
                                                        <tbody>
                                                            <tr>
                                                                <td className="text-muted">Inspector Type</td>
                                                                <td className="fw-semibold text-end text-capitalize">
                                                                    {inspection.inspectorType === 'DEPARTMENT_OFFICIAL' ? 'Department Official' : 'Third Party Agency'}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="text-muted">Inspector ID</td>
                                                                <td className="fw-semibold text-end">
                                                                    {inspection.departmentInspectorId || inspection.thirdPartyInspectorId || '—'}
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="text-muted">Checklist Version</td>
                                                                <td className="fw-semibold text-end">v{inspection.checklist?.version || '1.0'}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Report Download Integration */}
                                    <div className="col-12 mt-4">
                                        <div className="card text-center py-5 bg-light border-0">
                                            {inspection.status === 'REPORT_PUBLISHED' || inspection.status === 'CLOSED' ? (
                                                <>
                                                    <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: '80px', height: '80px' }}>
                                                        <i className="bi bi-file-earmark-check fs-1 text-success"></i>
                                                    </div>
                                                    <h5>Report Available</h5>
                                                    <p className="text-muted mb-4">The final inspection report is ready for download.</p>
                                                    <div className="d-flex justify-content-center gap-3">
                                                        <button className="btn btn-success btn-lg">
                                                            <i className="bi bi-download me-2"></i>Download PDF
                                                        </button>
                                                        <button className="btn btn-outline-primary btn-lg">
                                                            <i className="bi bi-eye me-2"></i>View Online
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="rounded-circle bg-white shadow-sm d-inline-flex align-items-center justify-content-center mb-3 mx-auto" style={{ width: '80px', height: '80px' }}>
                                                        <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
                                                    </div>
                                                    <h5 className="text-muted">Report Not Yet Published</h5>
                                                    <p className="text-muted mb-4">The final inspection report will be available once the inspection is complete and all observations are addressed.</p>
                                                    <button className="btn btn-secondary btn-lg mx-auto" disabled>
                                                        <i className="bi bi-download me-2"></i>Download Report
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* AI Insights Card */}
                                    {inspection.aiSummary && (
                                        <div className="col-12 mt-4">
                                            <div className="card border-0 shadow-sm" style={{ background: 'linear-gradient(145deg, #f0f7ff, #ffffff)', borderLeft: '4px solid #4f46e5' }}>
                                                <div className="card-body p-4">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <i className="bi bi-robot fs-4 text-primary me-2"></i>
                                                        <h5 className="card-title mb-0 fw-bold text-primary">AI Report Summary</h5>
                                                        <span className="badge bg-primary bg-opacity-10 text-primary ms-auto rounded-pill border border-primary">Gemini AI</span>
                                                    </div>
                                                    <p className="card-text text-gray-700 lead" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                                                        {inspection.aiSummary}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Checklist Tab */}
                            {activeTab === 'checklist' && (
                                <div>
                                    {inspection.checklist?.items && inspection.checklist.items.length > 0 ? (
                                        <>
                                            {/* Summary Stats */}
                                            <div className="row g-3 mb-4">
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-success bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-success mt-1">
                                                                {inspection.checklist.items.filter((item: any) => {
                                                                    const response = (inspection as any).checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                                                                    return response?.complianceStatus === 'COMPLIANT';
                                                                }).length}
                                                            </h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Compliant</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-danger bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-x-circle-fill text-danger fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-danger mt-1">
                                                                {inspection.checklist.items.filter((item: any) => {
                                                                    const response = (inspection as any).checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                                                                    return response?.complianceStatus === 'NON_COMPLIANT';
                                                                }).length}
                                                            </h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Non-Compliant</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-warning bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-warning mt-1">
                                                                {inspection.checklist.items.filter((item: any) => {
                                                                    const response = (inspection as any).checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                                                                    return response?.complianceStatus === 'PARTIALLY_COMPLIANT';
                                                                }).length}
                                                            </h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Partial</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-secondary bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-clock text-secondary fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-secondary mt-1">
                                                                {inspection.checklist.items.filter((item: any) => {
                                                                    const response = (inspection as any).checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                                                                    return !response || !response.complianceStatus;
                                                                }).length}
                                                            </h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Pending</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-danger bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-exclamation-octagon text-danger fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-danger mt-1">{openObservations.length}</h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Open Issues</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-lg-2">
                                                    <div className="card border-0 bg-success bg-opacity-10 h-100">
                                                        <div className="card-body text-center py-3">
                                                            <i className="bi bi-check-all text-success fs-5"></i>
                                                            <h5 className="mb-0 fw-bold text-success mt-1">{resolvedObservations.length}</h5>
                                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Resolved</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Checklist Items with Inspector Answers */}
                                            <div className="d-flex flex-column gap-3">
                                                {inspection.checklist.items.map((item: any, idx: number) => {
                                                    const response = (inspection as any).checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                                                    const linkedObservation = inspection.observations?.find((obs: any) => obs.checklistItemId === item.id);
                                                    const complianceStatus = response?.complianceStatus || 'PENDING';

                                                    const complianceConfig: Record<string, { bg: string; textColor: string; icon: string; label: string; borderColor: string }> = {
                                                        COMPLIANT: { bg: 'bg-success', textColor: 'text-white', icon: 'bi-check-circle-fill', label: 'Compliant', borderColor: '#198754' },
                                                        NON_COMPLIANT: { bg: 'bg-danger', textColor: 'text-white', icon: 'bi-x-circle-fill', label: 'Non-Compliant', borderColor: '#dc3545' },
                                                        PARTIALLY_COMPLIANT: { bg: 'bg-warning', textColor: 'text-dark', icon: 'bi-exclamation-triangle-fill', label: 'Partially Compliant', borderColor: '#ffc107' },
                                                        NOT_APPLICABLE: { bg: 'bg-secondary', textColor: 'text-white', icon: 'bi-dash-circle', label: 'N/A', borderColor: '#6c757d' },
                                                        PENDING: { bg: 'bg-light', textColor: 'text-muted', icon: 'bi-clock', label: 'Pending', borderColor: '#dee2e6' },
                                                    };
                                                    const config = complianceConfig[complianceStatus] || complianceConfig.PENDING;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="card border-0 shadow-sm"
                                                            style={{ borderLeft: `5px solid ${config.borderColor}` }}
                                                        >
                                                            <div className="card-body">
                                                                {/* Header: Item Title + Status */}
                                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                                                                        <div
                                                                            className={`rounded-circle d-flex align-items-center justify-content-center ${config.bg} flex-shrink-0`}
                                                                            style={{ width: '40px', height: '40px' }}
                                                                        >
                                                                            <i className={`bi ${config.icon} ${config.textColor}`}></i>
                                                                        </div>
                                                                        <div className="flex-grow-1">
                                                                            <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                                                                <span className="badge bg-light text-muted small">#{idx + 1}</span>
                                                                                <h6 className="mb-0 fw-semibold">{item.title}</h6>
                                                                            </div>
                                                                            {item.description && (
                                                                                <p className="text-muted small mb-0">{item.description}</p>
                                                                            )}
                                                                            <div className="d-flex flex-wrap gap-2 mt-2">
                                                                                <span className="badge bg-secondary-subtle text-secondary small">
                                                                                    <i className={`bi ${item.type === 'PHOTO' ? 'bi-camera' : item.type === 'VIDEO' ? 'bi-camera-video' : item.type === 'DOCUMENT' ? 'bi-file-earmark' : item.type === 'BOOLEAN' ? 'bi-toggle-on' : 'bi-input-cursor-text'} me-1`}></i>
                                                                                    {item.type === 'BOOLEAN' ? 'Yes/No' : item.type}
                                                                                </span>
                                                                                {item.isMandatory && (
                                                                                    <span className="badge bg-danger-subtle text-danger small">Required</span>
                                                                                )}
                                                                                {item.riskIndicator && (
                                                                                    <span className={`badge small ${item.riskIndicator === 'HIGH' ? 'bg-danger' : item.riskIndicator === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info'}`}>
                                                                                        {item.riskIndicator} Risk
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`badge ${config.bg} ${config.textColor} px-3 py-2`}>
                                                                        {config.label}
                                                                    </span>
                                                                </div>

                                                                {/* Inspector's Answer/Response */}
                                                                {response && (
                                                                    <div className="bg-light rounded p-3 mb-3">
                                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                                            <i className="bi bi-person-badge text-primary"></i>
                                                                            <small className="fw-semibold text-primary">Inspector's Response</small>
                                                                        </div>
                                                                        <div className="ps-4">
                                                                            {/* Boolean Response */}
                                                                            {response.booleanValue !== null && response.booleanValue !== undefined && (
                                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                                    <span className="text-muted small">Answer:</span>
                                                                                    <span className={`badge ${response.booleanValue ? 'bg-success' : 'bg-danger'}`}>
                                                                                        <i className={`bi ${response.booleanValue ? 'bi-check-lg' : 'bi-x-lg'} me-1`}></i>
                                                                                        {response.booleanValue ? 'Yes' : 'No'}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            {/* Text Response */}
                                                                            {response.textValue && (
                                                                                <div className="mb-2">
                                                                                    <span className="text-muted small d-block">Text Response:</span>
                                                                                    <p className="mb-0 bg-white p-2 rounded border small">{response.textValue}</p>
                                                                                </div>
                                                                            )}
                                                                            {/* Numeric Response */}
                                                                            {response.numericValue !== null && response.numericValue !== undefined && (
                                                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                                                    <span className="text-muted small">Value:</span>
                                                                                    <span className="badge bg-info">{response.numericValue}</span>
                                                                                </div>
                                                                            )}
                                                                            {/* File/Photo/Video Response */}
                                                                            {response.fileUrl && (
                                                                                <div className="mb-2">
                                                                                    <span className="text-muted small d-block mb-1">Uploaded File:</span>
                                                                                    <a href={response.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                                                        <i className="bi bi-file-earmark-arrow-down me-1"></i>
                                                                                        View Attachment
                                                                                    </a>
                                                                                </div>
                                                                            )}
                                                                            {/* Inspector Remarks */}
                                                                            {response.remarks && (
                                                                                <div className="mt-2 pt-2 border-top">
                                                                                    <span className="text-muted small d-flex align-items-center gap-1 mb-1">
                                                                                        <i className="bi bi-chat-quote"></i>
                                                                                        Remarks:
                                                                                    </span>
                                                                                    <p className="mb-0 small fst-italic">{response.remarks}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* No response yet */}
                                                                {!response && (
                                                                    <div className="bg-light rounded p-3 mb-3 text-center">
                                                                        <i className="bi bi-hourglass-split text-muted me-2"></i>
                                                                        <small className="text-muted">Awaiting inspector's response</small>
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-5">
                                            <i className="bi bi-clipboard-check fs-1 text-muted"></i>
                                            <h5 className="mt-3 text-muted">No Inspection Report Available</h5>
                                            <p className="text-muted">The inspection report will be displayed here once the inspection is completed.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* View All Observations Tab */}
                            {activeTab === 'observations' && (
                                <div className="d-flex flex-column gap-3">
                                    {inspection.observations && inspection.observations.length > 0 ? (
                                        inspection.observations.map((obs: any, idx: number) => {
                                            const sevInfo = severityConfig[obs.severity] || severityConfig.MINOR;
                                            return (
                                                <div key={obs.id} className={`card border-0 shadow-sm border-start border-4`} style={{ borderLeftColor: sevInfo.text === 'text-white' ? 'inherit' : sevInfo.text.split('-')[1] }}>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <h6 className="mb-0 fw-bold">Observation #{idx + 1}</h6>
                                                                <span className={`badge ${sevInfo.bg} ${sevInfo.text}`}>
                                                                    {obs.severity} Risk
                                                                </span>
                                                            </div>
                                                            <span className={`badge ${obs.status === 'OPEN' ? 'bg-danger' : 'bg-success'}`}>
                                                                {obs.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-dark mb-0">{obs.observationText}</p>

                                                        {obs.responses && obs.responses.length > 0 && (
                                                            <div className="mt-4 bg-light rounded p-3">
                                                                <small className="text-muted fw-semibold d-block mb-3">
                                                                    <i className="bi bi-chat-left-text me-2"></i>Response History
                                                                </small>
                                                                {obs.responses.map((resp: any) => (
                                                                    <div key={resp.id} className="d-flex gap-3 mb-3 pb-3 border-bottom last-child-no-border">
                                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center text-white flex-shrink-0 ${resp.isInternal ? 'bg-secondary' : 'bg-primary'}`} style={{ width: '32px', height: '32px' }}>
                                                                            <i className={`bi ${resp.isInternal ? 'bi-person-badge' : 'bi-person'}`}></i>
                                                                        </div>
                                                                        <div>
                                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                                <span className="fw-semibold small">{resp.isInternal ? 'Inspector' : 'You (Applicant)'}</span>
                                                                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDateTime(resp.createdAt)}</span>
                                                                            </div>
                                                                            <p className="mb-0 small">{resp.message}</p>
                                                                            {resp.attachments && resp.attachments.length > 0 && (
                                                                                <div className="d-flex gap-2 mt-2">
                                                                                    {resp.attachments.map((url: string, attIdx: number) => (
                                                                                        <a key={attIdx} href={url} target="_blank" rel="noopener noreferrer" className="badge bg-white text-primary border text-decoration-none">
                                                                                            <i className="bi bi-paperclip me-1"></i>Attachment {attIdx + 1}
                                                                                        </a>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {obs.status === 'OPEN' && (
                                                            <div className="mt-3 text-end pt-3 border-top">
                                                                <button
                                                                    className="btn btn-outline-danger btn-sm px-4 fw-semibold"
                                                                    onClick={() => setResponseModal({ open: true, observation: obs })}
                                                                >
                                                                    <i className="bi bi-reply-fill me-2"></i>Respond to this Observation
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-5">
                                            <div className="rounded-circle bg-success bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3 text-success mx-auto" style={{ width: '80px', height: '80px' }}>
                                                <i className="bi bi-check2-circle fs-1"></i>
                                            </div>
                                            <h5 className="text-dark fw-semibold mt-3">No Observations Logged</h5>
                                            <p className="text-muted mb-0">The inspector did not log any observations that require your attention during this inspection.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    {/* Quick Actions */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-semibold">
                                <i className="bi bi-lightning me-2 text-warning"></i>
                                Quick Actions
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                {openObservations.length > 0 && (
                                    <button
                                        className="btn btn-warning"
                                        onClick={() => {
                                            if (openObservations.length > 0) {
                                                setResponseModal({ open: true, observation: openObservations[0] });
                                            }
                                        }}
                                    >
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Respond to Observations ({openObservations.length})
                                    </button>
                                )}
                                {(inspection.status === 'REPORT_PUBLISHED' || inspection.status === 'CLOSED') && (
                                    <button className="btn btn-success">
                                        <i className="bi bi-download me-2"></i>Download Report
                                    </button>
                                )}
                                <button className="btn btn-outline-primary">
                                    <i className="bi bi-calendar-plus me-2"></i>Request Reschedule
                                </button>
                                <button className="btn btn-outline-secondary">
                                    <i className="bi bi-chat-dots me-2"></i>Contact Support
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3">
                            <h6 className="mb-0 fw-semibold">
                                <i className="bi bi-info-circle me-2 text-info"></i>
                                Inspection Info
                            </h6>
                        </div>
                        <div className="card-body">
                            <dl className="mb-0">
                                <dt className="text-muted small">Service</dt>
                                <dd className="fw-medium mb-3">{inspection.service?.service_name || '—'}</dd>

                                <dt className="text-muted small">Department</dt>
                                <dd className="fw-medium mb-3">{(inspection as any).service?.department?.name || '—'}</dd>

                                <dt className="text-muted small">Application ID</dt>
                                <dd className="fw-medium mb-3 font-monospace">{inspection.applicationId}</dd>

                                <dt className="text-muted small">Last Updated</dt>
                                <dd className="fw-medium mb-0">{formatDateTime(inspection.updatedAt)}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Response Modal */}
            {
                responseModal.open && responseModal.observation && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg">
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
                                        className="btn btn-primary px-4"
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
                )
            }
        </div >
    );
}
