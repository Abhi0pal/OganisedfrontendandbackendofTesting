'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { useCISDashboard, CISDepartmentStats } from '@/hooks/useInspections';

// ==========================================
// Constants
// ==========================================

const FINANCIAL_YEARS = ['2023-2024', '2024-2025', '2025-2026'];
const COLORS = ['#ef4444', '#f59e0b', '#22c55e'];

export default function InspectorDashboardPage() {
    const [finYear, setFinYear] = useState('2025-2026');
    const [selectedDept, setSelectedDept] = useState<string | null>(null);

    // Fetch dashboard data from API
    const { data: dashboardData, isLoading, error } = useCISDashboard(finYear);

    // Derived data from API response
    const currentTableData = useMemo(() => {
        return dashboardData?.departments || [];
    }, [dashboardData]);

    const totals = useMemo(() => {
        return dashboardData?.totals || { planned: 0, completed: 0, pending: 0, reschedulePending: 0, overdue: 0, sla: 0 };
    }, [dashboardData]);

    const riskData = useMemo(() => {
        return dashboardData?.riskDistribution || [
            { name: 'High Risk', value: 0 },
            { name: 'Medium Risk', value: 0 },
            { name: 'Low Risk', value: 0 },
        ];
    }, [dashboardData]);

    // Chart Data (Derived from Table Data)
    const chartData = useMemo(() => {
        return currentTableData.map(d => ({
            name: d.name,
            Assigned: d.planned,
            Conducted: d.completed
        }));
    }, [currentTableData]);

    // Filter Stats based on Selected Dept (or show totals)
    const activeStats = selectedDept
        ? currentTableData.find(d => d.name === selectedDept) || totals
        : totals;

    // Loading State
    if (isLoading) {
        return (
            <div className="tailwind-scope w-full p-4">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="tailwind-scope w-full p-4">
                <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50" role="alert">
                    <span className="font-medium">Failed to load dashboard data. Please try again.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full p-6 space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-500">Welcome to Inspections Dashboard</p>
                </div>
                <div className="flex items-center justify-end w-[200px] ml-auto">
                    <Link href="/department/inspection/schedule"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-pill hover:bg-blue-700 transition-colors w-full h-full"
                    >
                        <i className="bi bi-plus-lg text-lg"></i>
                        Schedule
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className='flex-1'>
                    <Link href={`/department/inspection/report?financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${(activeStats as CISDepartmentStats).id}` : ''}`} className="group block" >
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#C4D7E3] bg-[#EEF8FE] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Total Planned</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{activeStats.planned}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#C4D7E3] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
                <div className='flex-1'>
                    <Link href={`/department/inspection/report?status=REPORT_PUBLISHED&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${(activeStats as CISDepartmentStats).id}` : ''}`} className="group block" >
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#CFEFCF] bg-[#F6FDF6] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Completed</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{activeStats.completed}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#95C5AF] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
                <div className='flex-1'>
                    <Link href={`/department/inspection/report?status=SCHEDULED&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${(activeStats as CISDepartmentStats).id}` : ''}`} className="group block" >
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#F0E1B9] bg-[#FFF8E8] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Pending</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{activeStats.pending}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#DED5B2] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
                <div className='flex-1'>
                    <Link href={`/department/inspection/report?rescheduleRequested=true&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${(activeStats as CISDepartmentStats).id}` : ''}`} className="group block" >
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#BEA4E0] bg-[#F5EEFE] p-6 transition hover:shadow-md">
                            <p className="text-base font-medium leading-snug text-gray-900">Reschedule</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{activeStats.reschedulePending || 0}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#BEA4E0] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
                <div className='flex-1'>
                    <Link href={`/department/inspection/report?slaStatus=overdue&financialYear=${finYear}${('id' in activeStats) ? `&departmentId=${(activeStats as CISDepartmentStats).id}` : ''}`} className="group block" >
                        <div className="flex h-[140px] w-100 flex-col justify-between rounded-3xl border-2 !border-[#E3C5C5] bg-[#FEF2F2] p-6 transition hover:shadow-lg">
                            <p className="text-base font-medium leading-snug text-gray-900">Overdue</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl font-semibold text-gray-900">{activeStats.overdue}</span>
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 !border-[#E3C5C5] text-[#B7A36A] transition group-hover:translate-x-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Top Row: Summary Table + Pie Chart Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Summary Table (Compact) */}
                <div className="lg:col-span-8">
                    <div className="rounded-2xl border bg-white p-6 h-full overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b flex justify-between items-center">
                            <h6 className="font-bold text-sm text-gray-800">Departmental Performance Summary</h6>
                            <select
                                className="text-xs py-1 pl-2 pr-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold bg-white"
                                value={finYear}
                                onChange={(e) => setFinYear(e.target.value)}
                            >
                                {FINANCIAL_YEARS.map(year => (
                                    <option key={year} value={year}>FY {year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="overflow-x-auto flex-grow max-h-[400px]">
                            <table className="w-full border border-gray-200 border-collapse divide-y divide-gray-200 text-sm text-center">
                                <thead className="bg-gray-50 sticky top-0 z-10">
                                    <tr>
                                        <th className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Planned</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Completed</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Resched.</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Overdue</th>
                                        <th className="px-2 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">SLA %</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentTableData.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`hover:bg-gray-50 transition-colors ${selectedDept === row.name ? 'bg-blue-50' : ''}`}
                                        >
                                            <td
                                                className="border border-gray-200 px-3 py-2 text-left font-medium text-blue-600 cursor-pointer whitespace-nowrap"
                                                onClick={() => setSelectedDept(selectedDept === row.name ? null : row.name)}
                                            >
                                                {row.name}
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&financialYear=${finYear}`}
                                                    className="font-medium text-blue-600 hover:text-blue-800"
                                                    target="_blank"
                                                >
                                                    {row.planned}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&status=REPORT_PUBLISHED&financialYear=${finYear}`}
                                                    className="font-medium text-green-600 hover:text-green-800"
                                                    target="_blank"
                                                >
                                                    {row.completed}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&status=SCHEDULED&financialYear=${finYear}`}
                                                    className="font-medium text-yellow-600 hover:text-yellow-800"
                                                    target="_blank"
                                                >
                                                    {row.pending}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&rescheduleRequested=true&financialYear=${finYear}`}
                                                    className="font-medium text-cyan-600 hover:text-cyan-800"
                                                    target="_blank"
                                                >
                                                    {row.reschedulePending || 0}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <Link
                                                    href={`/department/inspection/report?departmentId=${row.id}&slaStatus=overdue&financialYear=${finYear}`}
                                                    className="font-medium text-red-600 hover:text-red-800"
                                                    target="_blank"
                                                >
                                                    {row.overdue}
                                                </Link>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${row.sla >= 90 ? 'bg-green-500' : row.sla >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${row.sla}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-700">{row.sla}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50 font-bold border-t-2 border-blue-100">
                                        <td className="px-3 py-2 text-left">Total</td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/department/inspection/report?financialYear=${finYear}`}
                                                className="text-blue-700 hover:text-blue-900"
                                                target="_blank"
                                            >
                                                {totals.planned}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/department/inspection/report?status=REPORT_PUBLISHED&financialYear=${finYear}`}
                                                className="text-green-700 hover:text-green-900"
                                                target="_blank"
                                            >
                                                {totals.completed}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/department/inspection/report?status=SCHEDULED&financialYear=${finYear}`}
                                                className="text-yellow-700 hover:text-yellow-900"
                                                target="_blank"
                                            >
                                                {totals.pending}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/department/inspection/report?rescheduleRequested=true&financialYear=${finYear}`}
                                                className="text-cyan-700 hover:text-cyan-900"
                                                target="_blank"
                                            >
                                                {totals.reschedulePending || 0}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2">
                                            <Link
                                                href={`/department/inspection/report?slaStatus=overdue&financialYear=${finYear}`}
                                                className="text-red-700 hover:text-red-900"
                                                target="_blank"
                                            >
                                                {totals.overdue}
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2 text-xs">{totals.sla}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="lg:col-span-4">
                    <div className="rounded-2xl border bg-white h-full flex flex-col">
                        <div className="px-4 py-3 border-b">
                            <h6 className="font-bold text-sm text-gray-800">Unit Risk Distribution</h6>
                        </div>
                        <div className="flex-1 p-4 flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={riskData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {riskData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            border: 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-4 flex-wrap">
                                {riskData.map((entry, index) => {
                                    const riskValue = entry.name.split(' ')[0].toUpperCase(); // 'High Risk' -> 'HIGH'
                                    return (
                                        <Link
                                            key={entry.name}
                                            href={`/department/inspection/report?riskCategory=${riskValue}`}
                                            className="flex items-center gap-2 text-xs no-underline hover:opacity-80 transition-opacity"
                                        >
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: COLORS[index] }}></div>
                                            <span className="font-semibold text-gray-700">{entry.name} ({entry.value})</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Bar Chart Only (Stats moved to top) */}
            <div className="grid grid-cols-1">
                {/* Bar Chart - Full Width */}
                <div className="w-full">
                    <div className="rounded-2xl border bg-white h-full flex flex-col">
                        <div className="px-4 py-3 border-b">
                            <h6 className="font-bold text-sm text-gray-800">Inspections: Assigned vs Conducted</h6>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} barCategoryGap="20%">
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
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '20px' }}
                                        formatter={(value) => <span className="text-sm text-gray-600 ml-1">{value}</span>}
                                    />
                                    <Bar dataKey="Assigned" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="Conducted" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
