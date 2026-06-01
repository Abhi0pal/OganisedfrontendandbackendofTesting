'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInspectorDashboard, useRequestReschedule } from '@/hooks/useInspections';
import { format } from 'date-fns';

export default function InspectorDashboardPage() {
    const [statusFilter, setStatusFilter] = useState<string>('upcoming');
    const { data, isLoading, error } = useInspectorDashboard(statusFilter);

    // Reschedule Request State
    const [rescheduleModal, setRescheduleModal] = useState<{ id: string, unitName: string } | null>(null);
    const [rescheduleReason, setRescheduleReason] = useState('');
    const { mutate: requestReschedule, isPending: isRequesting } = useRequestReschedule();


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



    const handleRequestReschedule = () => {
        if (!rescheduleModal || !rescheduleReason.trim()) return;
        requestReschedule({
            id: rescheduleModal.id,
            reason: rescheduleReason
        }, {
            onSuccess: () => {
                setRescheduleModal(null);
                setRescheduleReason('');
            }
        });
    };

    return (
        <div className="container-fluid py-4 min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="flex-1">
                    <a className="group block" href="#">
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#C4D7E3] bg-[#EEF8FE] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Total Inspections</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{stats.total}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#C4D7E3] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </a>
                </div>

                <div className="flex-1">
                    <a className="group block" href="#">
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#F0E1B9] bg-[#FFF8E8] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Pending Inspections</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{stats.scheduled}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#DED5B2] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
                
                <div className="flex-1">
                    <a className="group block" href="#">
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#CFEFCF] bg-[#F6FDF6] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Completed</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{stats.completed}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#95C5AF] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
                
                <div className="flex-1">
                    <a className="group block" href="#">
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#E3C5C5] bg-[#FEF2F2] p-6 transition hover:shadow-lg">
                            <p className="text-base font-medium leading-snug text-gray-900">SLA Breaches</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{stats.slaBreached}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#E3C5C5] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="card border-0 shadow-sm mt-4">
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

                                                            <Link href={`/department/inspection/${item.id}/conduct`} className="btn btn-sm btn-primary rounded-pill text-white">
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

            {/* Reschedule Modal */}
            {rescheduleModal && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Request Reschedule</h5>
                                <button type="button" className="btn-close" onClick={() => setRescheduleModal(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3">
                                    You are requesting to reschedule the inspection for <strong>{rescheduleModal.unitName}</strong>.
                                    This request will be sent to the department administrator for approval.
                                </p>
                                <div className="mb-3">
                                    <label className="form-label">Reason for Reschedule <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={rescheduleReason}
                                        onChange={(e) => setRescheduleReason(e.target.value)}
                                        placeholder="Please provide a valid reason..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setRescheduleModal(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
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
        </div>
    );
}
