'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    ClipboardList,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Play,
    Eye,
    FileText,
    ChevronRight,
    Building2,
    Timer
} from 'lucide-react';
import Link from 'next/link';
import { useAssignedInspections, InspectionTransactionExtended } from '@/hooks/useInspections';

export default function InspectorDashboardPage() {
    const t = useTranslations('inspections');
    const { data: inspections = [], isLoading, error } = useAssignedInspections();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Filter inspections
    const filteredInspections = statusFilter === 'all'
        ? inspections
        : inspections.filter(i => i.status === statusFilter);

    // Calculate stats
    const stats = {
        total: inspections.length,
        scheduled: inspections.filter(i => i.status === 'SCHEDULED').length,
        inProgress: inspections.filter(i => i.status === 'IN_PROGRESS').length,
        completed: inspections.filter(i => ['REPORT_PUBLISHED', 'CLOSED'].includes(i.status)).length,
        overdue: inspections.filter(i => {
            if (!i.inspectionDate || i.status === 'REPORT_PUBLISHED') return false;
            const inspectionTime = new Date(i.inspectionDate).getTime();
            const now = Date.now();
            return (now - inspectionTime) > 24 * 60 * 60 * 1000 && !i.reportUploadedAt;
        }).length,
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            SCHEDULED: { bg: 'bg-info', text: 'text-white', label: 'Scheduled' },
            IN_PROGRESS: { bg: 'bg-warning', text: 'text-dark', label: 'In Progress' },
            OBSERVATIONS_LOGGED: { bg: 'bg-orange', text: 'text-white', label: 'Observations Logged' },
            APPLICANT_RESPONSE_PENDING: { bg: 'bg-purple', text: 'text-white', label: 'Awaiting Response' },
            FINALIZATION: { bg: 'bg-primary', text: 'text-white', label: 'Finalization' },
            REPORT_PUBLISHED: { bg: 'bg-success', text: 'text-white', label: 'Published' },
            CLOSED: { bg: 'bg-secondary', text: 'text-white', label: 'Closed' },
        };
        const config = statusConfig[status] || { bg: 'bg-secondary', text: 'text-white', label: status };
        return <span className={`badge ${config.bg} ${config.text}`}>{config.label}</span>;
    };

    const getRiskBadge = (riskCategory?: string) => {
        if (!riskCategory) return null;
        const riskConfig: Record<string, { bg: string; icon: any }> = {
            HIGH: { bg: 'bg-danger', icon: AlertTriangle },
            MEDIUM: { bg: 'bg-warning text-dark', icon: Clock },
            LOW: { bg: 'bg-success', icon: CheckCircle },
        };
        const config = riskConfig[riskCategory];
        if (!config) return null;
        const Icon = config.icon;
        return (
            <span className={`badge ${config.bg} d-flex align-items-center gap-1`}>
                <Icon size={12} />
                {riskCategory}
            </span>
        );
    };

    const getSlaTimer = (inspection: InspectionTransactionExtended) => {
        if (!inspection.inspectionDate || inspection.reportUploadedAt) return null;

        const inspectionTime = new Date(inspection.inspectionDate).getTime();
        const now = Date.now();
        const elapsed = now - inspectionTime;
        const hoursElapsed = elapsed / (1000 * 60 * 60);
        const hoursRemaining = 24 - hoursElapsed;

        if (hoursRemaining <= 0) {
            return (
                <span className="badge bg-danger d-flex align-items-center gap-1">
                    <Timer size={12} />
                    SLA Breached
                </span>
            );
        }

        const isUrgent = hoursRemaining < 4;
        return (
            <span className={`badge ${isUrgent ? 'bg-warning text-dark' : 'bg-info'} d-flex align-items-center gap-1`}>
                <Timer size={12} />
                {hoursRemaining.toFixed(1)}h remaining
            </span>
        );
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

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold">Inspector Dashboard</h2>
                    <p className="text-muted mb-0">Manage your assigned inspections</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-2 col-6">
                    <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div className="card-body text-white text-center">
                            <ClipboardList size={24} className="mb-2" />
                            <h3 className="mb-0 fw-bold">{stats.total}</h3>
                            <small>Total Assigned</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                        <div className="card-body text-white text-center">
                            <Calendar size={24} className="mb-2" />
                            <h3 className="mb-0 fw-bold">{stats.scheduled}</h3>
                            <small>Scheduled</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <div className="card-body text-white text-center">
                            <Play size={24} className="mb-2" />
                            <h3 className="mb-0 fw-bold">{stats.inProgress}</h3>
                            <small>In Progress</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <div className="card-body text-white text-center">
                            <CheckCircle size={24} className="mb-2" />
                            <h3 className="mb-0 fw-bold">{stats.completed}</h3>
                            <small>Completed</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-2 col-6">
                    <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' }}>
                        <div className="card-body text-white text-center">
                            <AlertTriangle size={24} className="mb-2" />
                            <h3 className="mb-0 fw-bold">{stats.overdue}</h3>
                            <small>SLA Breach</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-0">
                    <ul className="nav nav-pills nav-fill p-2">
                        {[
                            { value: 'all', label: 'All', count: stats.total },
                            { value: 'SCHEDULED', label: 'Scheduled', count: stats.scheduled },
                            { value: 'IN_PROGRESS', label: 'In Progress', count: stats.inProgress },
                        ].map(tab => (
                            <li className="nav-item" key={tab.value}>
                                <button
                                    className={`nav-link ${statusFilter === tab.value ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(tab.value)}
                                >
                                    {tab.label} <span className="badge bg-light text-dark ms-1">{tab.count}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Inspections List */}
            <div className="row g-3">
                {filteredInspections.length === 0 ? (
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <ClipboardList size={48} className="text-muted mb-3" />
                                <h5 className="text-muted">No inspections assigned</h5>
                                <p className="text-muted mb-0">New inspections will appear here when assigned.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    filteredInspections.map((inspection) => (
                        <div key={inspection.id} className="col-12">
                            <div className="card border-0 shadow-sm hover-shadow">
                                <div className="card-body">
                                    <div className="row align-items-center">
                                        {/* Service Info */}
                                        <div className="col-md-4">
                                            <div className="d-flex align-items-start gap-3">
                                                <div className="rounded-3 p-2 bg-primary bg-opacity-10">
                                                    <Building2 size={24} className="text-primary" />
                                                </div>
                                                <div>
                                                    <h6 className="mb-1 fw-semibold">
                                                        {inspection.service?.service_name || 'Unknown Service'}
                                                    </h6>
                                                    <small className="text-muted">
                                                        App ID: {inspection.applicationId}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dates */}
                                        <div className="col-md-2">
                                            <small className="text-muted d-block">Scheduled</small>
                                            <span className="fw-medium">
                                                {new Date(inspection.scheduledDate).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Status & Risk */}
                                        <div className="col-md-3">
                                            <div className="d-flex flex-wrap gap-2">
                                                {getStatusBadge(inspection.status)}
                                                {getRiskBadge(inspection.riskCategory)}
                                                {getSlaTimer(inspection)}
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="col-md-2">
                                            <small className="text-muted d-block">Checklist Progress</small>
                                            <div className="progress" style={{ height: '8px' }}>
                                                {inspection.checklist?.items && (
                                                    <div
                                                        className="progress-bar bg-success"
                                                        style={{
                                                            width: `${((inspection.checklistResponses?.length || 0) / inspection.checklist.items.length) * 100}%`
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <small className="text-muted">
                                                {inspection.checklistResponses?.length || 0} / {inspection.checklist?.items?.length || 0}
                                            </small>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-md-1 text-end">
                                            <Link
                                                href={`/user/inspections/${inspection.id}`}
                                                className="btn btn-primary btn-sm"
                                            >
                                                <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
