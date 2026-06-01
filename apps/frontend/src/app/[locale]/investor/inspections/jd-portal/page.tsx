'use client';
// Force rebuild

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

// Types
interface UnassignedInspection {
    id: string;
    applicationId: string;
    service: {
        id: number;
        name: string;
        department_id: number;
    };
    riskCategory: string | null;
    priority: string;
    createdAt: string;
    daysPending: number;
    isUrgent: boolean;
}

interface Inspector {
    id: number;
    type: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY';
    name: string;
    email: string;
    mobile?: string;
    role?: string;
    organization?: string;
    currentActiveTasks: number;
    slaBreachRate?: number;
    availability: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';
}

interface DashboardStats {
    pendingAllocation: number;
    allocated: number;
    inProgress: number;
    completed: number;
    slaBreached: number;
    urgentCount: number;
}

// API calls
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchUnassignedAllocations(departmentId?: number): Promise<UnassignedInspection[]> {
    const url = departmentId
        ? `${API_BASE}/inspections/jd-portal/unassigned?departmentId=${departmentId}`
        : `${API_BASE}/inspections/jd-portal/unassigned`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();

}

async function fetchPendingReviews(departmentId?: number): Promise<UnassignedInspection[]> {
    const url = departmentId
        ? `${API_BASE}/inspections/jd-portal/pending-review?departmentId=${departmentId}`
        : `${API_BASE}/inspections/jd-portal/pending-review`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

async function fetchInspectors(departmentId: number, type: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY'): Promise<Inspector[]> {
    const res = await fetch(
        `${API_BASE}/inspections/jd-portal/inspectors?departmentId=${departmentId}&type=${type}`,
        { credentials: 'include' }
    );
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

async function fetchDashboardStats(departmentId: number): Promise<DashboardStats> {
    const res = await fetch(
        `${API_BASE}/inspections/jd-portal/stats?departmentId=${departmentId}`,
        { credentials: 'include' }
    );
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}

async function allocateInspection(data: {
    inspectionId: string;
    inspectorType: 'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY';
    inspectorId: number;
    scheduledDate: string;
    priority?: 'HIGH' | 'NORMAL';
    riskCategory?: 'HIGH' | 'MEDIUM' | 'LOW';
}) {
    const res = await fetch(`${API_BASE}/inspections/jd-portal/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to allocate');
    return res.json();
}

export default function JDPortalPage() {
    const queryClient = useQueryClient();

    // State
    const [departmentId] = useState(1); // TODO: Get from user session
    const [selectedInspection, setSelectedInspection] = useState<UnassignedInspection | null>(null);
    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [inspectorType, setInspectorType] = useState<'DEPARTMENT_OFFICIAL' | 'THIRD_PARTY'>('DEPARTMENT_OFFICIAL');
    const [selectedInspectorId, setSelectedInspectorId] = useState<number | null>(null);
    const [scheduledDate, setScheduledDate] = useState('');
    const [isHighPriority, setIsHighPriority] = useState(false);
    const [riskCategory, setRiskCategory] = useState<'HIGH' | 'MEDIUM' | 'LOW' | ''>('');
    const [sortColumn, setSortColumn] = useState<'daysPending' | 'applicationId' | 'riskCategory'>('daysPending');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Queries
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['jd-stats', departmentId],
        queryFn: () => fetchDashboardStats(departmentId),
    });

    const { data: unassignedInspections, isLoading: inspectionsLoading } = useQuery({
        queryKey: ['jd-unassigned', departmentId],
        queryFn: () => fetchUnassignedAllocations(departmentId),
    });

    const { data: pendingReviews, isLoading: reviewsLoading } = useQuery({
        queryKey: ['jd-pending-reviews', departmentId],
        queryFn: () => fetchPendingReviews(departmentId),
    });

    const { data: inspectors, isLoading: inspectorsLoading } = useQuery({
        queryKey: ['jd-inspectors', departmentId, inspectorType],
        queryFn: () => fetchInspectors(departmentId, inspectorType),
        enabled: showAllocationModal,
    });

    // Mutation
    const allocationMutation = useMutation({
        mutationFn: allocateInspection,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jd-unassigned'] });
            queryClient.invalidateQueries({ queryKey: ['jd-stats'] });
            queryClient.invalidateQueries({ queryKey: ['jd-inspectors'] });
            setShowAllocationModal(false);
            setSelectedInspection(null);
            setSelectedInspectorId(null);
            setScheduledDate('');
            setIsHighPriority(false);
            setRiskCategory('');
        },
    });

    // Sort inspections
    const sortedInspections = [...(unassignedInspections || [])].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
    });

    const handleSort = (column: typeof sortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const handleAllocate = () => {
        if (!selectedInspection || !selectedInspectorId || !scheduledDate) return;

        allocationMutation.mutate({
            inspectionId: selectedInspection.id,
            inspectorType,
            inspectorId: selectedInspectorId,
            scheduledDate,
            priority: isHighPriority ? 'HIGH' : 'NORMAL',
            riskCategory: riskCategory || undefined,
        });
    };

    const openAllocationModal = (inspection: UnassignedInspection) => {
        setSelectedInspection(inspection);
        setRiskCategory((inspection.riskCategory as any) || '');
        setShowAllocationModal(true);
    };

    const getRiskBadge = (risk: string | null) => {
        const config: Record<string, { bg: string; text: string }> = {
            HIGH: { bg: 'bg-danger', text: 'text-white' },
            MEDIUM: { bg: 'bg-warning', text: 'text-dark' },
            LOW: { bg: 'bg-success', text: 'text-white' },
        };
        const c = config[risk || 'LOW'] || config.LOW;
        return <span className={`badge ${c.bg} ${c.text}`}>{risk || 'N/A'}</span>;
    };

    const getAvailabilityDot = (availability: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: '#28a745',
            BUSY: '#dc3545',
            ON_LEAVE: '#6c757d',
        };
        return (
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: colors[availability] || colors.AVAILABLE,
                    marginRight: '8px',
                }}
            />
        );
    };

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold">
                        <i className="bi bi-clipboard-check me-2 text-primary"></i>
                        Joint Director Portal
                    </h2>
                    <p className="text-muted mb-0">Inspection Allocation Dashboard</p>
                </div>
                <div>
                    <Link href="/investor/inspections/jd-portal/checklists" className="btn btn-outline-primary">
                        <i className="bi bi-list-check me-2"></i>
                        Manage Checklists
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #dc3545' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Pending Allocation</p>
                                    <h3 className="mb-0 fw-bold text-danger">
                                        {statsLoading ? '...' : stats?.pendingAllocation || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-hourglass-split fs-2 text-danger opacity-50"></i>
                            </div>
                            {stats?.urgentCount ? (
                                <small className="text-danger">
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    {stats.urgentCount} urgent (&gt;2 days)
                                </small>
                            ) : null}
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #ffc107' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Allocated</p>
                                    <h3 className="mb-0 fw-bold text-warning">
                                        {statsLoading ? '...' : stats?.allocated || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-person-check fs-2 text-warning opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">In Progress</p>
                                    <h3 className="mb-0 fw-bold text-primary">
                                        {statsLoading ? '...' : stats?.inProgress || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-arrow-repeat fs-2 text-primary opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #198754' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Completed</p>
                                    <h3 className="mb-0 fw-bold text-success">
                                        {statsLoading ? '...' : stats?.completed || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-check-circle fs-2 text-success opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #0dcaf0' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">Pending Review</p>
                                    <h3 className="mb-0 fw-bold text-info">
                                        {statsLoading ? '...' : (stats as any)?.pendingReview || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-file-earmark-check fs-2 text-info opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-2">
                    <div className="card border-0 shadow-sm h-100" style={{ borderLeft: '4px solid #6f42c1' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">SLA Breached</p>
                                    <h3 className="mb-0 fw-bold text-purple" style={{ color: '#6f42c1' }}>
                                        {statsLoading ? '...' : stats?.slaBreached || 0}
                                    </h3>
                                </div>
                                <i className="bi bi-exclamation-octagon fs-2 opacity-50" style={{ color: '#6f42c1' }}></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* Unassigned Allocations Queue */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-inbox me-2 text-danger"></i>
                                Unassigned Allocations Queue
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            {inspectionsLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                </div>
                            ) : sortedInspections.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-check-circle fs-1"></i>
                                    <p className="mt-2">All inspections allocated!</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleSort('applicationId')}
                                                >
                                                    Application ID
                                                    {sortColumn === 'applicationId' && (
                                                        <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th>Service</th>
                                                <th
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleSort('riskCategory')}
                                                >
                                                    Risk Level
                                                    {sortColumn === 'riskCategory' && (
                                                        <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleSort('daysPending')}
                                                >
                                                    Days Pending
                                                    {sortColumn === 'daysPending' && (
                                                        <i className={`bi bi-arrow-${sortDirection === 'asc' ? 'up' : 'down'} ms-1`}></i>
                                                    )}
                                                </th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedInspections.map((inspection) => (
                                                <tr
                                                    key={inspection.id}
                                                    className={inspection.isUrgent ? 'table-danger' : ''}
                                                >
                                                    <td className="fw-medium">
                                                        {inspection.applicationId}
                                                        {inspection.priority === 'HIGH' && (
                                                            <span className="badge bg-danger ms-2">VIP</span>
                                                        )}
                                                    </td>
                                                    <td>{inspection.service?.name || 'N/A'}</td>
                                                    <td>{getRiskBadge(inspection.riskCategory)}</td>
                                                    <td>
                                                        <span className={inspection.isUrgent ? 'fw-bold text-danger' : ''}>
                                                            {inspection.daysPending} days
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => openAllocationModal(inspection)}
                                                        >
                                                            <i className="bi bi-person-plus me-1"></i>
                                                            Allocate
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pending Approvals Queue */}
                    <div className="card border-0 shadow-sm mt-4">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-check-all me-2 text-info"></i>
                                Pending Approvals
                            </h5>
                        </div>
                        <div className="card-body p-0">
                            {reviewsLoading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-info"></div>
                                </div>
                            ) : (!pendingReviews || pendingReviews.length === 0) ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-check2-all fs-1"></i>
                                    <p className="mt-2 text-muted">No pending approvals</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="px-3">Application ID</th>
                                                <th>Service</th>
                                                <th>Date Submitted</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingReviews.map((inspection: any) => (
                                                <tr key={inspection.id}>
                                                    <td className="fw-medium px-3">{inspection.applicationId}</td>
                                                    <td>{inspection.service?.name || 'N/A'}</td>
                                                    <td>
                                                        {inspection.reportUploadedAt ? new Date(inspection.reportUploadedAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <Link href={`/investor/inspections/jd-portal/transactions/${inspection.id}/review`} className="btn btn-sm btn-info text-white">
                                                            <i className="bi bi-eye me-1"></i>
                                                            Review
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Load Balancer Widget */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fw-semibold">
                                <i className="bi bi-people me-2 text-primary"></i>
                                Team Load Balancer
                            </h5>
                        </div>
                        <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <InspectorList departmentId={departmentId} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation Modal */}
            {showAllocationModal && selectedInspection && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-clipboard-check me-2"></i>
                                    Assign Inspection Order
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowAllocationModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-light mb-3">
                                    <small className="text-muted">Application ID:</small>
                                    <div className="fw-bold">{selectedInspection.applicationId}</div>
                                    <small className="text-muted">Service:</small>
                                    <div>{selectedInspection.service?.name}</div>
                                </div>

                                {/* Inspector Type Toggle */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Inspector Type</label>
                                    <div className="btn-group w-100">
                                        <button
                                            className={`btn ${inspectorType === 'DEPARTMENT_OFFICIAL' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => {
                                                setInspectorType('DEPARTMENT_OFFICIAL');
                                                setSelectedInspectorId(null);
                                            }}
                                        >
                                            Department Officer
                                        </button>
                                        <button
                                            className={`btn ${inspectorType === 'THIRD_PARTY' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => {
                                                setInspectorType('THIRD_PARTY');
                                                setSelectedInspectorId(null);
                                            }}
                                        >
                                            Third-Party Agency
                                        </button>
                                    </div>
                                </div>

                                {/* Select Inspector */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Select Inspector</label>
                                    {inspectorsLoading ? (
                                        <div className="text-center py-2">
                                            <div className="spinner-border spinner-border-sm"></div>
                                        </div>
                                    ) : (
                                        <select
                                            className="form-select"
                                            value={selectedInspectorId || ''}
                                            onChange={(e) => setSelectedInspectorId(Number(e.target.value) || null)}
                                        >
                                            <option value="">-- Select --</option>
                                            {inspectors?.map((inspector) => (
                                                <option
                                                    key={inspector.id}
                                                    value={inspector.id}
                                                    disabled={inspector.availability === 'ON_LEAVE'}
                                                >
                                                    {getAvailabilityDot(inspector.availability)}
                                                    {inspector.name}
                                                    ({inspector.currentActiveTasks} active tasks)
                                                    {inspector.availability === 'ON_LEAVE' && ' - On Leave'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Schedule Date */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Must Inspect By</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Risk Category */}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Risk Category</label>
                                    <select
                                        className="form-select"
                                        value={riskCategory}
                                        onChange={(e) => setRiskCategory(e.target.value as any)}
                                    >
                                        <option value="">-- Keep Current ({selectedInspection.riskCategory || 'None'}) --</option>
                                        <option value="HIGH">High Risk</option>
                                        <option value="MEDIUM">Medium Risk</option>
                                        <option value="LOW">Low Risk</option>
                                    </select>
                                </div>

                                {/* Priority Checkbox */}
                                <div className="form-check mb-3">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="highPriority"
                                        checked={isHighPriority}
                                        onChange={(e) => setIsHighPriority(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="highPriority">
                                        <i className="bi bi-star-fill text-warning me-1"></i>
                                        High Priority (VIP Case)
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowAllocationModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAllocate}
                                    disabled={!selectedInspectorId || !scheduledDate || allocationMutation.isPending}
                                >
                                    {allocationMutation.isPending ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            Allocating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            Allocate Inspection
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Inspector List Component for sidebar
function InspectorList({ departmentId }: { departmentId: number }) {
    const { data: inspectors, isLoading } = useQuery({
        queryKey: ['jd-inspectors-sidebar', departmentId],
        queryFn: () => fetchInspectors(departmentId, 'DEPARTMENT_OFFICIAL'),
    });

    if (isLoading) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm"></div>
            </div>
        );
    }

    if (!inspectors?.length) {
        return (
            <div className="text-center py-4 text-muted">
                <i className="bi bi-people fs-3"></i>
                <p className="mb-0 mt-2">No inspectors found</p>
            </div>
        );
    }

    return (
        <div className="list-group list-group-flush">
            {inspectors.map((inspector) => (
                <div key={inspector.id} className="list-group-item px-3 py-2">
                    <div className="d-flex align-items-center">
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: inspector.availability === 'AVAILABLE' ? '#28a745' :
                                    inspector.availability === 'BUSY' ? '#dc3545' : '#6c757d',
                                marginRight: '10px',
                                flexShrink: 0,
                            }}
                        />
                        <div className="flex-grow-1">
                            <div className="fw-medium">{inspector.name}</div>
                            <small className="text-muted">{inspector.role}</small>
                        </div>
                        <div className="text-end">
                            <div className="badge bg-light text-dark">
                                {inspector.currentActiveTasks} tasks
                            </div>
                            {inspector.slaBreachRate !== undefined && inspector.slaBreachRate > 0 && (
                                <div className="small text-danger">
                                    {inspector.slaBreachRate}% breach
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
