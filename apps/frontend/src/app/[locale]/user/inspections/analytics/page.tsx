'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    BarChart3,
    TrendingUp,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Timer,
    Building2,
    Filter,
    RefreshCw
} from 'lucide-react';
import { useInspectionAnalytics } from '@/hooks/useInspections';

export default function InspectionAnalyticsPage() {
    const { data: analytics, isLoading, error, refetch } = useInspectionAnalytics();
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>(undefined);

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

    if (error) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger">
                    Failed to load analytics data
                </div>
            </div>
        );
    }

    const statusCounts = analytics?.statusCounts || {};
    const slaMetrics = analytics?.slaMetrics || { compliant: 0, breached: 0, complianceRate: 0 };
    const riskDistribution = analytics?.riskDistribution || {};

    return (
        <div className="container-fluid py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold">
                        <BarChart3 className="me-2" />
                        Inspection Analytics Dashboard
                    </h2>
                    <p className="text-muted mb-0">Central Inspection System (CIS) Overview</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => refetch()}
                    >
                        <RefreshCw size={16} className="me-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* SLA Metrics Row */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1">Total Inspections</p>
                                    <h2 className="mb-0 fw-bold">{analytics?.totalInspections || 0}</h2>
                                </div>
                                <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                                    <Building2 size={28} className="text-primary" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1">SLA Compliance Rate</p>
                                    <h2 className="mb-0 fw-bold text-success">{slaMetrics.complianceRate}%</h2>
                                </div>
                                <div className="rounded-circle bg-success bg-opacity-10 p-3">
                                    <CheckCircle size={28} className="text-success" />
                                </div>
                            </div>
                            <div className="progress mt-3" style={{ height: '8px' }}>
                                <div
                                    className="progress-bar bg-success"
                                    style={{ width: `${slaMetrics.complianceRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1">SLA Breaches</p>
                                    <h2 className="mb-0 fw-bold text-danger">{slaMetrics.breached}</h2>
                                </div>
                                <div className="rounded-circle bg-danger bg-opacity-10 p-3">
                                    <XCircle size={28} className="text-danger" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted mb-1">Avg. Report Time</p>
                                    <h2 className="mb-0 fw-bold">{analytics?.avgTimeToReportHours || 0}h</h2>
                                </div>
                                <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                                    <Timer size={28} className="text-warning" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-4 mb-4">
                {/* Status Distribution */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-semibold">Status Distribution</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Count</th>
                                            <th>Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(statusCounts).map(([status, count]) => {
                                            const total = Object.values(statusCounts).reduce((a, b) => a + (b as number), 0) as number;
                                            const percentage = total > 0 ? ((count as number) / total) * 100 : 0;
                                            const statusColors: Record<string, string> = {
                                                SCHEDULED: 'bg-info',
                                                IN_PROGRESS: 'bg-warning',
                                                OBSERVATIONS_LOGGED: 'bg-orange',
                                                APPLICANT_RESPONSE_PENDING: 'bg-purple',
                                                FINALIZATION: 'bg-primary',
                                                REPORT_PUBLISHED: 'bg-success',
                                                CLOSED: 'bg-secondary',
                                            };
                                            return (
                                                <tr key={status}>
                                                    <td>
                                                        <span className={`badge ${statusColors[status] || 'bg-secondary'}`}>
                                                            {status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="fw-bold">{count as number}</td>
                                                    <td>
                                                        <div className="progress" style={{ height: '10px', width: '150px' }}>
                                                            <div
                                                                className={`progress-bar ${statusColors[status] || 'bg-secondary'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-semibold">Risk Category Distribution</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {['HIGH', 'MEDIUM', 'LOW', 'UNASSIGNED'].map((risk) => {
                                    const count = riskDistribution[risk] || 0;
                                    const riskConfig: Record<string, { bg: string; icon: any; gradient: string }> = {
                                        HIGH: {
                                            bg: 'bg-danger',
                                            icon: AlertTriangle,
                                            gradient: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)'
                                        },
                                        MEDIUM: {
                                            bg: 'bg-warning',
                                            icon: Clock,
                                            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                        },
                                        LOW: {
                                            bg: 'bg-success',
                                            icon: CheckCircle,
                                            gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                        },
                                        UNASSIGNED: {
                                            bg: 'bg-secondary',
                                            icon: Filter,
                                            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        },
                                    };
                                    const config = riskConfig[risk];
                                    const Icon = config.icon;

                                    return (
                                        <div key={risk} className="col-6">
                                            <div
                                                className="card border-0 text-white"
                                                style={{ background: config.gradient }}
                                            >
                                                <div className="card-body text-center py-4">
                                                    <Icon size={32} className="mb-2" />
                                                    <h3 className="mb-0 fw-bold">{count}</h3>
                                                    <small>{risk} Risk</small>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SLA Performance Indicators */}
            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-bottom py-3">
                            <h5 className="mb-0 fw-semibold">SLA Performance Indicators</h5>
                        </div>
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center mb-3">
                                        <div
                                            className="rounded-circle me-3"
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                backgroundColor: '#28a745'
                                            }}
                                        />
                                        <span className="me-2">Green (≤ 24 hours):</span>
                                        <strong className="text-success">{slaMetrics.compliant}</strong>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="rounded-circle me-3"
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                backgroundColor: '#dc3545'
                                            }}
                                        />
                                        <span className="me-2">Red (&gt; 24 hours):</span>
                                        <strong className="text-danger">{slaMetrics.breached}</strong>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="progress" style={{ height: '30px' }}>
                                        <div
                                            className="progress-bar bg-success"
                                            style={{ width: `${slaMetrics.complianceRate}%` }}
                                        >
                                            Compliant: {slaMetrics.compliant}
                                        </div>
                                        <div
                                            className="progress-bar bg-danger"
                                            style={{ width: `${100 - Number(slaMetrics.complianceRate)}%` }}
                                        >
                                            Breached: {slaMetrics.breached}
                                        </div>
                                    </div>
                                    <p className="text-center text-muted mt-2 mb-0">
                                        SLA Target: Report upload within 24 hours of inspection
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
