'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useCISInspectionDetail } from '@/hooks/useInspections';

export default function UnitDetailPage() {
    const params = useParams();
    const unitId = params.unitId as string; // This is actually inspectionId currently
    const [activeTab, setActiveTab] = useState('overview');

    const { data: unitData, isLoading, error } = useCISInspectionDetail(unitId);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !unitData) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    Failed to load details. The record might not exist or you don't have permission.
                </div>
                <Link href="/department/inspection/report" className="btn btn-primary">Go Back</Link>
            </div>
        );
    }

    // Find reschedule reason from timeline/audit logs
    const rescheduleLog = unitData.timeline?.find((log: any) =>
        log.action?.includes('RESCHEDULE') ||
        (log.details && typeof log.details === 'string' && log.details.toLowerCase().includes('reschedule'))
    );
    const rescheduleReason = rescheduleLog?.details || rescheduleLog?.toValue || null;

    const getRiskBadge = (risk: string) => {
        switch (risk) {
            case 'HIGH': return { bg: '#fee2e2', color: '#dc2626', text: 'High Risk' };
            case 'MEDIUM': return { bg: '#fef3c7', color: '#d97706', text: 'Medium Risk' };
            case 'LOW': return { bg: '#dcfce7', color: '#16a34a', text: 'Low Risk' };
            default: return { bg: '#f1f5f9', color: '#64748b', text: 'Unknown' };
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status || '';
        if (s.includes('PUBLISHED') || s.includes('CLOSED')) return { bg: '#dcfce7', color: '#16a34a' };
        if (s.includes('SCHEDULED')) return { bg: '#fef3c7', color: '#d97706' };
        if (s.includes('PROGRESS')) return { bg: '#dbeafe', color: '#2563eb' };
        return { bg: '#f1f5f9', color: '#64748b' };
    };

    const riskStyle = getRiskBadge(unitData.riskCategory);

    return (
        <div className="container-fluid" style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4 pt-3">
                <Link
                    href="/department/inspection/report"
                    className="btn btn-light me-3"
                    style={{ borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                >
                    <i className="bi bi-arrow-left"></i>
                </Link>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-3">
                        <h4 className="fw-bold mb-0" style={{ color: '#1e293b', letterSpacing: '-0.5px' }}>{unitData.unit.name}</h4>
                        <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: riskStyle.bg,
                            color: riskStyle.color
                        }}>
                            {riskStyle.text}
                        </span>
                    </div>
                    <p className="text-muted mb-0 small">
                        <i className="bi bi-geo-alt me-1"></i>{unitData.location.district} • <code>{unitData.unit.submissionId}</code>
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px' }}>
                        <i className="bi bi-bell me-1"></i>Send Notification
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                        <i className="bi bi-file-earmark-text me-1"></i>Inspection Report
                    </button>
                </div>
            </div>

            {/* Reschedule Alert if reason exists */}
            {rescheduleReason && (
                <div className="alert alert-warning border-warning d-flex align-items-center mb-4" role="alert" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-exclamation-circle-fill fs-4 me-3"></i>
                    <div>
                        <div className="fw-bold">Inspection Rescheduled</div>
                        <div className="small">Reason: {typeof rescheduleReason === 'object' ? JSON.stringify(rescheduleReason) : rescheduleReason}</div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-4">
                <div className="d-flex gap-2" style={{ background: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    {[
                        { id: 'overview', label: 'Overview', icon: 'bi-grid' },
                        { id: 'inspections', label: 'Inspection History', icon: 'bi-list-check' },
                        { id: 'compliance', label: 'Compliance', icon: 'bi-shield-check' },
                        { id: 'feedback', label: 'Feedback & Rating', icon: 'bi-star' },
                        { id: 'notifications', label: 'Notifications', icon: 'bi-bell' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: activeTab === tab.id ? '#e9090c' : 'transparent',
                                color: activeTab === tab.id ? 'white' : '#64748b',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="row g-4 pb-4">
                    {/* Unit Information Card */}
                    <div className="col-lg-8">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-4" style={{ color: '#1e293b' }}>
                                    <i className="bi bi-building me-2 text-primary"></i>Unit Information
                                </h6>

                                <div className="row g-4">
                                    {/* Contact Information */}
                                    <div className="col-md-6">
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                                            <h6 className="text-muted small fw-bold mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <i className="bi bi-person-lines-fill me-2"></i>Contact Information
                                            </h6>
                                            <div className="mb-2 d-flex justify-content-between">
                                                <span className="text-muted small">Owner Name</span>
                                                <span className="fw-semibold small">{unitData.unit.contactPerson}</span>
                                            </div>
                                            <div className="mb-2 d-flex justify-content-between">
                                                <span className="text-muted small">Email</span>
                                                <a href={`mailto:${unitData.unit.email}`} className="fw-semibold small text-primary text-decoration-none">{unitData.unit.email}</a>
                                            </div>
                                            <div className="mb-2 d-flex justify-content-between">
                                                <span className="text-muted small">Mobile</span>
                                                <span className="fw-semibold small">{unitData.unit.contactNumber}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Infrastructure */}
                                    <div className="col-md-6">
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                                            <h6 className="text-muted small fw-bold mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <i className="bi bi-bricks me-2"></i>Infrastructure
                                            </h6>
                                            <div className="mb-2 d-flex justify-content-between text-truncate">
                                                <span className="text-muted small">Sector</span>
                                                <span className="fw-semibold small">{unitData.unit.sector}</span>
                                            </div>
                                            <div className="mb-2 d-flex justify-content-between">
                                                <span className="text-muted small">Investment</span>
                                                <span className="fw-semibold small">₹ {unitData.unit.investmentAmount || 0} Cr</span>
                                            </div>
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted small">Employment</span>
                                                <span className="fw-semibold small">{unitData.unit.employmentGenerated || 0} Employees</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="col-12">
                                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                                            <h6 className="text-muted small fw-bold mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <i className="bi bi-geo-alt me-2"></i>Address
                                            </h6>
                                            <p className="mb-0 small">{unitData.unit.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Inspector Card */}
                        <div className="card border-0 mt-4" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-4">
                                    <i className="bi bi-person-badge me-2 text-primary"></i>Assigned Inspector
                                </h6>
                                {unitData.inspector ? (
                                    <div className="d-flex align-items-center gap-4">
                                        <div style={{
                                            width: 64,
                                            height: 64,
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            color: 'white',
                                            fontWeight: 600
                                        }}>
                                            {unitData.inspector.name.charAt(0)}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-bold" style={{ color: '#1e293b' }}>{unitData.inspector.name}</div>
                                            <div className="text-muted small">{unitData.department.name}</div>
                                        </div>
                                        <div className="text-end">
                                            <div className="small text-muted mb-1">Contact</div>
                                            <div className="small fw-semibold">
                                                <i className="bi bi-telephone me-1"></i>{unitData.inspector.mobile}
                                            </div>
                                            <div className="small">
                                                <a href={`mailto:${unitData.inspector.email}`} className="text-primary text-decoration-none">
                                                    <i className="bi bi-envelope me-1"></i>{unitData.inspector.email}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted text-center py-3">No inspector assigned currently.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="col-lg-4">
                        {/* Compliance Score */}
                        <div className="card border-0 mb-4" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4 text-center">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>Compliance Score</h6>
                                <div style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: '50%',
                                    background: `conic-gradient(${(unitData.complianceScore || 0) >= 80 ? '#22c55e' : (unitData.complianceScore || 0) >= 60 ? '#f59e0b' : '#ef4444'} ${(unitData.complianceScore || 0) * 3.6}deg, #e2e8f0 0deg)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <div style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        background: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.75rem',
                                        fontWeight: 700,
                                        color: (unitData.complianceScore || 0) >= 80 ? '#22c55e' : (unitData.complianceScore || 0) >= 60 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {unitData.complianceScore || 0}%
                                    </div>
                                </div>
                                <div className="text-muted small">
                                    Last Status: <span className="fw-semibold">{unitData.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Department Status */}
                        <div className="card border-0 mb-4" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>
                                    <i className="bi bi-shield-check me-2 text-primary"></i>Department Compliance
                                </h6>
                                <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                    <span className="small">{unitData.department.name}</span>
                                    <span className="badge" style={{
                                        background: '#dcfce7',
                                        color: '#16a34a'
                                    }}>
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>
                                    <i className="bi bi-bar-chart me-2 text-primary"></i>Quick Stats
                                </h6>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <div className="text-center p-3" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                            <div className="h4 fw-bold text-primary mb-0">{unitData.timeline?.length || 0}</div>
                                            <div className="small text-muted">Activities</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-center p-3" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                            <div className="h4 fw-bold text-warning mb-0">
                                                {unitData.feedback ? unitData.feedback.rating : '-'}
                                            </div>
                                            <div className="small text-muted">Rating</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspection History Tab */}
            {activeTab === 'inspections' && (
                <div className="card border-0 mb-4" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    <div className="card-body p-4">
                        <h6 className="fw-bold mb-4" style={{ color: '#1e293b' }}>
                            <i className="bi bi-list-check me-2 text-primary"></i>Inspection Timeline
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Action</th>
                                        <th>Performed By</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitData.timeline?.map((log: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>{new Date(log.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}</td>
                                            <td>
                                                <span className="badge bg-light text-dark border">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td>{log.performedBy}</td>
                                            <td>
                                                <small className="text-muted">{log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : log.details) : '-'}</small>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!unitData.timeline || unitData.timeline.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted">No history available</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Compliance Tab */}
            {activeTab === 'compliance' && (
                <div className="row g-4 pb-4">
                    <div className="col-lg-8">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-4" style={{ color: '#1e293b' }}>
                                    <i className="bi bi-shield-check me-2 text-primary"></i>Compliance Details
                                </h6>
                                <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    Compliance details for {unitData.department?.name}
                                </div>
                                <div className="mb-3 p-3" style={{ background: '#f8fafc', borderRadius: '12px' }}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="fw-bold">Report Status</div>
                                            <div className="text-muted small">Current status of inspection report</div>
                                        </div>
                                        <span className="badge" style={getStatusBadge(unitData.status)}>
                                            {unitData.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>SLA Due Date</h6>
                                <div className="text-center py-3">
                                    <i className="bi bi-calendar-event text-primary" style={{ fontSize: '2.5rem' }}></i>
                                    <div className="h5 fw-bold mt-2 mb-0">
                                        {unitData.slaDueDate ? new Date(unitData.slaDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                    </div>
                                    <div className="text-muted small">Target completion date</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Tab */}
            {activeTab === 'feedback' && (
                <div className="row g-4 pb-4">
                    <div className="col-lg-8">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-4" style={{ color: '#1e293b' }}>
                                    <i className="bi bi-star me-2 text-primary"></i>Investor Feedback
                                </h6>
                                {unitData.feedback ? (
                                    <div className="mb-4 p-4" style={{ background: '#fefce8', borderRadius: '12px', border: '1px solid #fde047' }}>
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <span className="text-warning" style={{ fontSize: '1.5rem' }}>
                                                {'★'.repeat(unitData.feedback.rating)}
                                                <span className="text-muted">{'★'.repeat(5 - unitData.feedback.rating)}</span>
                                            </span>
                                            <span className="badge bg-warning text-dark">{unitData.feedback.rating}/5</span>
                                        </div>
                                        <p className="mb-2">&quot;{unitData.feedback.comment}&quot;</p>
                                        <small className="text-muted">Submitted on: {new Date(unitData.feedback.submittedAt).toLocaleDateString('en-IN')}</small>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted p-4">No feedback received for this inspection yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4 text-center">
                                <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>Current Rating</h6>
                                <div className="display-3 fw-bold text-warning mb-2">
                                    {unitData.feedback ? unitData.feedback.rating : '-'}
                                </div>
                                <div className="text-warning mb-2" style={{ fontSize: '1.5rem' }}>
                                    {unitData.feedback ? '★'.repeat(unitData.feedback.rating) : ''}
                                </div>
                                <div className="text-muted small">{unitData.feedback ? 'Based on investor feedback' : 'No rating available'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <div className="row g-4 pb-4">
                    <div className="col-lg-8">
                        <div className="card border-0" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h6 className="fw-bold mb-0" style={{ color: '#1e293b' }}>
                                        <i className="bi bi-bell me-2 text-primary"></i>Notification History
                                    </h6>
                                    <button className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
                                        <i className="bi bi-plus-lg me-1"></i>Send New Notification
                                    </button>
                                </div>
                                <div className="text-muted text-center py-4">
                                    No notifications found for this inspection.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
