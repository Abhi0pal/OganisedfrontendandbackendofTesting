"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Legend,
    Bar,
} from 'recharts';
import { useRoleDashboard } from '@/hooks/department/useOfficerWorkflow';
import type { WorkflowDashboardApplication } from '@/hooks/department/workflow/useWorkflowDashboardData';
import { Role7ApplicationsTable } from './Role7ApplicationsTable';
import type { Role7ExtendedStatusFilter } from './types';

const EMPTY_COUNTS = {
    all: 0,
    pending: 0,
    forwarded: 0,
    forwardToApprover: 0,
    approved: 0,
    reverted: 0,
    rejected: 0,
} as const;

const STAT_CARD_STYLES: Array<{ label: string; key: keyof typeof EMPTY_COUNTS; border: string; bg: string }> = [
    { label: 'All Applications', key: 'all', border: '#C4D7E3', bg: '#EEF8FE' },
    { label: 'Pending', key: 'pending', border: '#FAD8D6', bg: '#FEF3F2' },
    { label: 'Forwarded', key: 'forwarded', border: '#D1FAE5', bg: '#ECFDF3' },
    { label: 'Forward to Approver', key: 'forwardToApprover', border: '#E0E7FF', bg: '#EEF2FF' },
    { label: 'Approved', key: 'approved', border: '#C7D2FE', bg: '#EEF2FF' },
    { label: 'Reverted', key: 'reverted', border: '#FDD5D5', bg: '#FEF2F2' },
    { label: 'Rejected', key: 'rejected', border: '#FDE68A', bg: '#FFFBEB' },
];

const STATUS_COLORS = ['#F97316', '#3B82F6', '#6366F1', '#10B981', '#F43F5E', '#EF4444'];
const STATUS_FILTERS: Role7ExtendedStatusFilter[] = [
    'ALL',
    'PENDING',
    'FORWARDED',
    'FORWARD_TO_APPROVER',
    'APPROVED',
    'REVERTED',
    'REJECTED',
];
const STATUS_FILTER_LABELS: Record<Role7ExtendedStatusFilter, string> = {
    ALL: 'All',
    PENDING: 'Pending',
    FORWARDED: 'Forwarded',
    FORWARD_TO_APPROVER: 'Forward to Approver',
    APPROVED: 'Approved',
    REVERTED: 'Reverted',
    REJECTED: 'Rejected',
};

export default function Role7DashboardPage() {
    const { data, isLoading } = useRoleDashboard();
    const [activeStatus, setActiveStatus] = useState<Role7ExtendedStatusFilter>('ALL');
    const applications: WorkflowDashboardApplication[] = useMemo(
        () => (data?.applications || []),
        [data?.applications]
    );
    const counts = useMemo<Record<keyof typeof EMPTY_COUNTS, number>>(
        () => ({
            ...EMPTY_COUNTS,
            all: Number(data?.counts?.all || 0),
            pending: Number(data?.counts?.pending || 0),
            forwarded: Number(data?.counts?.forwarded || 0),
            forwardToApprover: Number(data?.counts?.forwardToApprover || 0),
            approved: Number(data?.counts?.approved || 0),
            reverted: Number(data?.counts?.reverted || 0),
            rejected: Number(data?.counts?.rejected || 0),
        }),
        [data?.counts]
    );

    const statusFilteredRows = useMemo(() => {
        if (activeStatus === 'ALL') return applications;
        return applications.filter((row) => {
            const code = String(row.status || '').toUpperCase();
            if (activeStatus === 'PENDING') return ['P', 'PENDING'].includes(code);
            if (activeStatus === 'FORWARDED') return ['F', 'FORWARDED'].includes(code);
            if (activeStatus === 'FORWARD_TO_APPROVER') return ['FA', 'FORWARD_TO_APPROVER'].includes(code);
            if (activeStatus === 'APPROVED') return ['A', 'APPROVED'].includes(code);
            if (activeStatus === 'REVERTED') return ['RBI', 'REVERTED'].includes(code);
            if (activeStatus === 'REJECTED') return ['R', 'REJECT', 'REJECTED'].includes(code);
            return true;
        });
    }, [applications, activeStatus]);

    const statusBreakdown = useMemo(
        () => [
            { name: 'Pending', value: counts.pending },
            { name: 'Forwarded', value: counts.forwarded },
            { name: 'Forward to Approver', value: counts.forwardToApprover },
            { name: 'Approved', value: counts.approved },
            { name: 'Reverted', value: counts.reverted },
            { name: 'Rejected', value: counts.rejected },
        ],
        [counts]
    );

    const barChartData = useMemo(
        () => statusBreakdown.map((item) => ({ name: item.name, value: item.value })),
        [statusBreakdown]
    );

    return (
        <div className="w-full p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-500">District CAF Verifier overview</p>
                </div>
                <div className="flex items-center justify-end w-[220px] ml-auto">
                    <Link
                        href="/department/workflow"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-pill hover:bg-blue-700 transition-colors w-full h-full"
                    >
                <i className="bi bi-bar-chart text-lg"></i>
                View Pending Task
            </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                {STAT_CARD_STYLES.map((card, idx) => (
                    <div className="flex-1" key={card.key}>
                        <div
                            className="group block"
                            style={{
                                borderRadius: '1.5rem',
                                borderWidth: 2,
                                borderStyle: 'solid',
                                borderColor: card.border,
                                backgroundColor: card.bg,
                                padding: '1.5rem',
                                height: '140px',
                            }}
                        >
                            <p className="text-base font-medium leading-snug text-gray-900">{card.label}</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{counts[card.key]}</span>
                                <span
                                    className="flex h-10 w-10 items-center justify-center rounded-full"
                                    style={{ border: `2px solid ${card.border}` }}
                                >
                                    <i className={`bi ${idx % 2 === 0 ? 'bi-arrow-up-right' : 'bi-arrow-right'}`}></i>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <div className="rounded-2xl border bg-white p-6 h-full">
                        <div className="px-4 py-3 border-b mb-4 flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <h6 className="font-bold text-sm text-gray-800">Received Applications</h6>
                                <p className="text-xs text-gray-500">
                                    Showing {statusFilteredRows.length} of {applications.length} entries
                                </p>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                {STATUS_FILTERS.map((status) => (
                                    <button
                                        key={status}
                                        className={`btn btn-sm ${activeStatus === status ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        type="button"
                                        onClick={() => setActiveStatus(status)}
                                    >
                                        {STATUS_FILTER_LABELS[status]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Role7ApplicationsTable activeStatus={activeStatus} rows={statusFilteredRows} loading={isLoading} />
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="rounded-2xl border bg-white h-full flex flex-col">
                        <div className="px-4 py-3 border-b">
                            <h6 className="font-bold text-sm text-gray-800">Status Distribution</h6>
                        </div>
                        <div className="flex-1 p-4 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={statusBreakdown}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {statusBreakdown.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                {statusBreakdown.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                                        <span
                                            className="inline-block h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}
                                        ></span>
                                        <span className="font-semibold text-gray-600">
                                            {entry.name} ({entry.value})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1">
                <div className="rounded-2xl border bg-white h-full flex flex-col">
                    <div className="px-4 py-3 border-b">
                        <h6 className="font-bold text-sm text-gray-800">Applications by Status</h6>
                    </div>
                    <div className="p-4">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={barChartData} barCategoryGap="20%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    formatter={(value) => <span className="text-sm text-gray-600 ml-1">{value}</span>}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
