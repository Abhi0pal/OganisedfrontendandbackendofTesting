'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInspectorDashboard } from '@/hooks/useInspections';
import * as useInspectorDashboardHooks from '@/hooks/useInspections';
import { format } from 'date-fns';

export default function InspectorDashboardPage() {
    const [statusFilter, setStatusFilter] = useState<string>('upcoming');
    const { data, isLoading, error } = useInspectorDashboard(statusFilter);

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div><div className="mt-2">Loading Dashboard...</div></div>;
    if (error) return <div className="alert alert-danger m-4">Error loading dashboard. Please try again.</div>;

    const stats = data?.stats || { scheduled: 0, active: 0, completed: 0, slaBreached: 0, total: 0 };
    const inspections = data?.data || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SCHEDULED':
            case 'ALLOCATED': return <span className="badge bg-primary">Scheduled</span>;
            case 'IN_PROGRESS': return <span className="badge bg-warning text-dark">In Progress</span>;
            case 'OBSERVATIONS_LOGGED': return <span className="badge bg-info text-dark">Observations Logged</span>;
            case 'REPORT_PUBLISHED': return <span className="badge bg-success">Report Published</span>;
            case 'CLOSED': return <span className="badge bg-secondary">Closed</span>;
            default: return <span className="badge bg-light text-dark border">{status}</span>;
        }
    };

    // Reschedule Request Logic
    const [rescheduleModal, setRescheduleModal] = useState<{ id: string, unitName: string } | null>(null);
    const [rescheduleReason, setRescheduleReason] = useState('');
    const { mutate: requestReschedule, isPending: isRequesting } = useInspectorDashboardHooks.useRequestReschedule();

    const handleRequestReschedule = () => {
        if (!rescheduleModal || !rescheduleReason.trim()) return;
        requestReschedule({ id: rescheduleModal.id, reason: rescheduleReason }, {
            onSuccess: () => {
                setRescheduleModal(null);
                setRescheduleReason('');
                // optional toast
            }
        });
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                {/* ... existing header ... */}
                <div>
                    <h4 className="fw-bold mb-1">Inspector Dashboard</h4>
                    <p className="text-muted mb-0">Manage your assigned inspections and reports</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                </div>
            </div>

            {/* Reschedule Request Modal */}
            {rescheduleModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Request Reschedule</h5>
                                <button type="button" className="btn-close" onClick={() => setRescheduleModal(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Requesting reschedule for: <strong>{rescheduleModal.unitName}</strong></p>
                                <div className="mb-3">
                                    <label className="form-label">Reason for Rescheduling <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={rescheduleReason}
                                        onChange={(e) => setRescheduleReason(e.target.value)}
                                        placeholder="Please explain why you need to reschedule..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setRescheduleModal(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!rescheduleReason.trim() || isRequesting}
                                    onClick={handleRequestReschedule}
                                >
                                    {isRequesting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {/* ... stats ... */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
                        <div className="card-body">
                            <h6 className="text-uppercase text-muted small fw-bold mb-2">Upcoming Checks</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <h2 className="mb-0 fw-bold text-primary">{stats.scheduled}</h2>
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-calendar-event text-primary fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-warning">
                        <div className="card-body">
                            <h6 className="text-uppercase text-muted small fw-bold mb-2">In Progress</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <h2 className="mb-0 fw-bold text-warning">{stats.active}</h2>
                                <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-hourglass-split text-warning fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-success">
                        <div className="card-body">
                            <h6 className="text-uppercase text-muted small fw-bold mb-2">Completed</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <h2 className="mb-0 fw-bold text-success">{stats.completed}</h2>
                                <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-check-circle text-success fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100 border-start border-4 border-danger">
                        <div className="card-body">
                            <h6 className="text-uppercase text-muted small fw-bold mb-2">SLA Breaches</h6>
                            <div className="d-flex align-items-center justify-content-between">
                                <h2 className="mb-0 fw-bold text-danger">{stats.slaBreached}</h2>
                                <div className="bg-danger bg-opacity-10 rounded-circle p-2">
                                    <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3 border-bottom-0">
                    <ul className="nav nav-tabs card-header-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${statusFilter === 'upcoming' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                onClick={() => setStatusFilter('upcoming')}
                            >
                                <i className="bi bi-calendar-check me-2"></i>Upcoming
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${statusFilter === 'active' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                onClick={() => setStatusFilter('active')}
                            >
                                <i className="bi bi-play-circle me-2"></i>In Progress
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${statusFilter === 'completed' ? 'active fw-bold border-bottom-0' : 'text-muted border-0'}`}
                                onClick={() => setStatusFilter('completed')}
                            >
                                <i className="bi bi-archive me-2"></i>Completed
                            </button>
                        </li>
                    </ul>
                </div>
                <div className="card-body p-0">
                    {inspections.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="ps-4">Inspection ID</th>
                                        <th>Unit & Location</th>
                                        <th>Service & Dept</th>
                                        <th>Scheduled Date</th>
                                        <th>Status</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inspections.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="ps-4">
                                                <div className="fw-bold text-dark">{item.inspectionId}</div>
                                                <small className="text-muted">{item.type} Check</small>
                                            </td>
                                            <td>
                                                <div className="fw-semibold">{item.unitName}</div>
                                                <small className="text-muted"><i className="bi bi-geo-alt"></i> {item.district}</small>
                                            </td>
                                            <td>
                                                <div className="text-truncate" style={{ maxWidth: 200 }} title={item.serviceName}>{item.serviceName}</div>
                                                <span className="badge bg-light text-dark border">{item.department}</span>
                                            </td>
                                            <td>
                                                <div>{format(new Date(item.scheduledDate), 'dd MMM yyyy')}</div>
                                                <small className={item.slaStatus === 'Overdue' ? 'text-danger fw-bold' : 'text-success'}>
                                                    {item.slaStatus}
                                                </small>
                                            </td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td className="text-end pe-4">
                                                <div className="d-flex justify-content-end gap-2">
                                                    {statusFilter === 'completed' ? (
                                                        <Link href={`/department/inspection/${item.id}`} className="btn btn-sm btn-outline-primary">
                                                            View Report
                                                        </Link>
                                                    ) : (
                                                        <>
                                                            {['SCHEDULED', 'ALLOCATED'].includes(item.status) && !item.rescheduleRequested && (
                                                                <button
                                                                    className="btn btn-sm btn-outline-warning"
                                                                    onClick={() => setRescheduleModal({ id: item.id, unitName: item.unitName })}
                                                                    title="Request Reschedule"
                                                                >
                                                                    <i className="bi bi-calendar-event"></i>
                                                                </button>
                                                            )}
                                                            {item.rescheduleRequested && (
                                                                <span className="badge bg-warning text-dark align-self-center">Reschedule Requested</span>
                                                            )}

                                                            <Link href={`/inspector/inspection/${item.id}/conduct`} className="btn btn-sm btn-primary">
                                                                {statusFilter === 'active' ? 'Resume' : 'Start'} Inspection
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5">
                            <div className="mb-3">
                                <i className="bi bi-clipboard-x text-muted" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="text-muted">No inspections found</h5>
                            <p className="text-muted">You don't have any {statusFilter} inspections assigned.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
