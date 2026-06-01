'use client';


import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState, useMemo, useEffect } from 'react';
import { useCISReport, useCISDistricts, useCISDepartments, CISReportFilters, useRescheduleInspection } from '@/hooks/useInspections';
import * as useCISReportHooks from '@/hooks/useInspections'; // For namespace access if needed, or just import logic fixed above

function InspectionReportContent() {
    const searchParams = useSearchParams();

    // Get initial filters from URL
    const initialDeptId = searchParams.get('departmentId') || '';
    const initialStatus = searchParams.get('status') || '';
    const initialRisk = searchParams.get('riskCategory') || '';
    const initialFY = searchParams.get('financialYear') || '2025-2026';
    const initialReschedule = searchParams.get('rescheduleRequested') === 'true';

    // Filter states
    const [filterDeptId, setFilterDeptId] = useState(initialDeptId);
    const [filterDistrictId, setFilterDistrictId] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterRisk, setFilterRisk] = useState(initialRisk);
    const [filterStatus, setFilterStatus] = useState(initialStatus);
    const [filterFY, setFilterFY] = useState(initialFY);
    const [filterReschedule, setFilterReschedule] = useState(initialReschedule);
    const [sortBy, setSortBy] = useState<string>('genDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const limit = 50;

    // Build filter object for API
    const filters: CISReportFilters = useMemo(() => ({
        financialYear: filterFY || undefined,
        departmentId: filterDeptId ? parseInt(filterDeptId) : undefined,
        districtId: filterDistrictId ? parseInt(filterDistrictId) : undefined,
        riskCategory: filterRisk || undefined,
        status: filterStatus || undefined,
        rescheduleRequested: filterReschedule || undefined,
        fromDate: filterFromDate || undefined,
        toDate: filterToDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit
    }), [filterFY, filterDeptId, filterDistrictId, filterRisk, filterStatus, filterReschedule, filterFromDate, filterToDate, sortBy, sortOrder, page]);

    // Fetch data from API
    const { data: reportData, isLoading, error } = useCISReport(filters);
    const { data: districts = [] } = useCISDistricts();
    const { data: departments = [] } = useCISDepartments();

    const filteredData = reportData?.data || [];
    const pagination = reportData?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    const clearFilters = () => {
        setFilterDeptId('');
        setFilterDistrictId('');
        setFilterFromDate('');
        setFilterToDate('');
        setFilterRisk('');
        setFilterStatus('');
        setFilterReschedule(false);
        setPage(1);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            'REPORT_PUBLISHED': 'bg-success',
            'CLOSED': 'bg-success',
            'SCHEDULED': 'bg-warning text-dark',
            'IN_PROGRESS': 'bg-info',
            'PENDING_APPROVAL': 'bg-primary',
            'PENDING_ALLOCATION': 'bg-secondary',
        };
        return statusMap[status] || 'bg-secondary';
    };

    const getStatusLabel = (status: string) => {
        const labelMap: Record<string, string> = {
            'REPORT_PUBLISHED': 'Published',
            'CLOSED': 'Closed',
            'SCHEDULED': 'Scheduled',
            'IN_PROGRESS': 'In Progress',
            'PENDING_APPROVAL': 'Pending Review',
            'PENDING_ALLOCATION': 'Pending Alloc.',
        };
        return labelMap[status] || status;
    };

    const getRiskBadge = (risk: string) => {
        switch (risk) {
            case 'HIGH': return 'bg-danger';
            case 'MEDIUM': return 'bg-warning text-dark';
            case 'LOW': return 'bg-success';
            default: return 'bg-secondary';
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN');
    };

    // Calculate total fees
    const totalFees = filteredData.reduce((sum, item) => sum + (item.totalFeeCharge || 0), 0);

    // Reschedule Logic
    // Reschedule Logic
    const [rescheduleData, setRescheduleData] = useState<{ id: string, displayId: string, current: string, reason?: string } | null>(null);
    const { mutate: reschedule, isPending: isRescheduling } = useCISReportHooks.useRescheduleInspection();

    const handleReschedule = (newDate: string) => {
        if (!rescheduleData) return;
        reschedule({ id: rescheduleData.id, date: newDate }, {
            onSuccess: () => {
                setRescheduleData(null);
                // Optional: Show toast
            }
        });
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc'); // Default to asc for new column, or desc if preferred? Conventionally asc.
        }
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            {/* ... (existing header code) ... */}

            {/* Filters */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body bg-light rounded-3">
                    <div className="row g-2 align-items-end">
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">FY</label>
                            <select className="form-select form-select-sm" value={filterFY} onChange={e => setFilterFY(e.target.value)}>
                                <option value="2025-2026">25-26</option>
                                <option value="2024-2025">24-25</option>
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">District</label>
                            <select className="form-select form-select-sm" value={filterDistrictId} onChange={e => setFilterDistrictId(e.target.value)}>
                                <option value="">All</option>
                                {districts.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label small fw-bold text-muted mb-1">Department</label>
                            <select className="form-select form-select-sm" value={filterDeptId} onChange={e => setFilterDeptId(e.target.value)}>
                                <option value="">All</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.abbreviation || d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">Risk</label>
                            <select className="form-select form-select-sm" value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
                                <option value="">All</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">Status</label>
                            <select className="form-select form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="">All</option>
                                <option value="PENDING_ALLOCATION">Pending</option>
                                <option value="ALLOCATED">Allocated</option>
                                <option value="SCHEDULED">Scheduled</option>
                                <option value="IN_PROGRESS">In Prog.</option>
                                <option value="REPORT_PUBLISHED">Published</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">From</label>
                            <input type="date" className="form-control form-control-sm" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} />
                        </div>
                        <div className="col-md">
                            <label className="form-label small fw-bold text-muted mb-1">To</label>
                            <input type="date" className="form-control form-control-sm" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} />
                        </div>
                        <div className="col-md-auto d-flex align-items-end pb-1">
                            <div className="form-check form-switch mb-0">
                                <input className="form-check-input" type="checkbox" id="rescheduleCheck" checked={filterReschedule} onChange={e => setFilterReschedule(e.target.checked)} />
                                <label className="form-check-label small text-nowrap" htmlFor="rescheduleCheck">Reschedule</label>
                            </div>
                        </div>
                        <div className="col-md-auto">
                            <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={clearFilters}>
                                <i className="bi bi-x-circle"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {rescheduleData && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Reschedule Inspection</h5>
                                <button type="button" className="btn-close" onClick={() => setRescheduleData(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3 text-muted small">
                                    Rescheduling inspection ID: <span className="fw-bold text-dark">{rescheduleData.displayId}</span>
                                </p>
                                {rescheduleData.reason && (
                                    <div className="alert alert-light border border-warning mb-3">
                                        <div className="text-warning fw-bold small text-uppercase mb-1">
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            Inspector's Request Reason
                                        </div>
                                        <div className="text-dark small fst-italic">"{rescheduleData.reason}"</div>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">New Inspection Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        min={new Date().toISOString().split('T')[0]}
                                        id="newDateInput"
                                    />
                                </div>
                                <div className="alert alert-info small mb-0">
                                    <i className="bi bi-info-circle me-2"></i>
                                    This action will notify the inspector and the unit representative.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={() => setRescheduleData(null)}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={isRescheduling}
                                    onClick={() => {
                                        const dateVal = (document.getElementById('newDateInput') as HTMLInputElement).value;
                                        if (dateVal) handleReschedule(dateVal);
                                    }}
                                >
                                    {isRescheduling ? 'Updating...' : 'Confirm Reschedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Report Table */}
            {
                !isLoading && !error && (
                    <div className="card border-0 shadow-sm">
                        {/* ... (existing table header) ... */}
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered mb-0 small align-middle">
                                <thead className="table-light sticky-top">
                                    <tr>
                                        {/* Existing Columns */}
                                        <th className="text-nowrap text-center">S.No.</th>
                                        <th className="text-nowrap">Actions</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                            Inspection ID {sortBy === 'id' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('genDate')}>
                                            Gen. Date {sortBy === 'genDate' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap">District</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('unitName')}>
                                            Unit Name {sortBy === 'unitName' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap">Address</th>
                                        <th className="text-nowrap">Contact</th>
                                        <th className="text-nowrap">Department</th>
                                        <th className="text-nowrap">Inspector</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('allocationDate')}>
                                            Allocation Date {sortBy === 'allocationDate' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap">Type</th>
                                        <th className="text-nowrap">Third Party</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('completion')}>
                                            Completion {sortBy === 'completion' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                            Status {sortBy === 'status' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap">Media</th>
                                        <th className="text-nowrap">Feedback</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('compliance')}>
                                            Compliance {sortBy === 'compliance' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('risk')}>
                                            Risk {sortBy === 'risk' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                        <th className="text-nowrap">SLA</th>
                                        <th className="text-nowrap" style={{ cursor: 'pointer' }} onClick={() => handleSort('fee')}>
                                            Fee {sortBy === 'fee' && <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'} ms-1`}></i>}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((row) => (
                                        <tr key={row.id}>
                                            <td className="text-center fw-semibold">{row.sno}</td>
                                            {/* Action Column Content */}
                                            <td className="text-center">
                                                {(row.reportStatus === 'SCHEDULED' || row.reportStatus === 'PENDING_ALLOCATION') && row.rescheduleRequested && (
                                                    <button
                                                        className="btn btn-sm btn-outline-warning border-0"
                                                        title="Review Reschedule Request"
                                                        onClick={() => setRescheduleData({ id: row.id, displayId: row.inspectionId, current: row.allocationDate || '', reason: row.rescheduleReason })}
                                                    >
                                                        <i className="bi bi-calendar-check-fill position-relative">
                                                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                                                                <span className="visually-hidden">New alerts</span>
                                                            </span>
                                                        </i>
                                                    </button>
                                                )}
                                            </td>
                                            <td className="text-nowrap">
                                                {row.reportStatus === 'REPORT_PUBLISHED' || row.reportStatus === 'CLOSED' ? (
                                                    <Link
                                                        href={`/department/inspection/${row.id}`}
                                                        className="text-decoration-none"
                                                    >
                                                        <code className="text-primary" style={{ cursor: 'pointer' }}>
                                                            {row.inspectionId}
                                                            <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                                                        </code>
                                                    </Link>
                                                ) : (
                                                    <code className="text-muted">{row.inspectionId}</code>
                                                )}
                                            </td>
                                            <td className="text-nowrap">{formatDate(row.generationDate)}</td>
                                            <td>{row.districtName}</td>
                                            <td className="fw-semibold" style={{ minWidth: 180 }}>
                                                <Link
                                                    href={`/department/inspection/unit/${row.id}`}
                                                    className="text-decoration-none text-primary"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {row.unitName}
                                                    <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                                                </Link>
                                            </td>
                                            <td style={{ minWidth: 200 }}>{row.address}</td>
                                            <td className="text-nowrap">{row.contact}</td>
                                            <td>
                                                <span className="badge bg-light text-dark border">{row.department}</span>
                                            </td>
                                            <td className="text-nowrap">{row.inspectorName}</td>
                                            <td className="text-nowrap">{formatDate(row.allocationDate)}</td>
                                            <td>
                                                <span className={`badge ${row.inspectionType === 'JOINT' ? 'bg-primary' : 'bg-info'}`}>
                                                    {row.inspectionType}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {row.isThirdParty
                                                    ? <i className="bi bi-check-circle-fill text-success"></i>
                                                    : <i className="bi bi-x-circle text-muted"></i>}
                                            </td>
                                            <td className="text-nowrap">{formatDate(row.completionDate)}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(row.reportStatus)}`}>
                                                    {getStatusLabel(row.reportStatus)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                {row.hasMedia
                                                    ? <i className="bi bi-camera-video-fill text-success"></i>
                                                    : '-'}
                                            </td>
                                            <td>
                                                {row.investorFeedback
                                                    ? <span className="text-warning">{'★'.repeat(row.investorFeedback)}</span>
                                                    : '-'}
                                            </td>
                                            <td className="text-center">
                                                {row.complianceScore ? (
                                                    <span className={`badge ${row.complianceScore >= 80 ? 'bg-success' : row.complianceScore >= 60 ? 'bg-warning text-dark' : 'bg-danger'}`}>
                                                        {row.complianceScore}%
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getRiskBadge(row.riskCategory)}`}>
                                                    {row.riskCategory}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${row.slaStatus === 'Within SLA' ? 'bg-success' : 'bg-danger'}`}>
                                                    {row.slaStatus}
                                                </span>
                                            </td>
                                            <td className="text-end fw-semibold">
                                                {row.totalFeeCharge ? `₹${row.totalFeeCharge.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {filteredData.length > 0 && (
                                    <tfoot className="table-light">
                                        <tr className="fw-bold">
                                            <td colSpan={20} className="text-end">Total Fees:</td>
                                            <td className="text-end">₹{totalFees.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total}
                                </small>
                                <nav>
                                    <ul className="pagination pagination-sm mb-0">
                                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                                                Previous
                                            </button>
                                        </li>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                                            if (pageNum > pagination.totalPages) return null;
                                            return (
                                                <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => setPage(pageNum)}>
                                                        {pageNum}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}

                        {filteredData.length === 0 && (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                No records found matching the criteria
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    );
}



export default function InspectionReportPage() {
    return (
        <Suspense fallback={<div className="text-center py-5"><div className="spinner-border text-primary"></div></div>}>
            <InspectionReportContent />
        </Suspense>
    );
}
