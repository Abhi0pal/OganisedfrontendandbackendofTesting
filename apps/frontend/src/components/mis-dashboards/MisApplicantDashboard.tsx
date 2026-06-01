'use client';

import { useMemo, useState } from 'react';

type DistrictRow = {
  district: string;
  mean: number;
  median: number;
  mode: number;
  maxDays: number;
  minDays: number;
  total: number;
  incomplete: number;
  archived: number;
  submitted: { total: number; ta: number; tv: number };
  applicant: { total: number; ta: number; tv: number };
  department: { total: number; ta: number; tv: number };
  rejected: { total: number; ta: number; tv: number };
  approved: { total: number; ta: number; tv: number };
  appeal: { total: number; ta: number; tv: number };
  reapply: { total: number; ta: number; tv: number };
};

const districts: DistrictRow[] = [
  {
    district: 'Almora',
    mean: 44.61,
    median: 9,
    mode: 2,
    maxDays: 0,
    minDays: 0,
    total: 50,
    incomplete: 0,
    archived: 0,
    submitted: { total: 50, ta: 31, tv: 19 },
    applicant: { total: 16, ta: 16, tv: 0 },
    department: { total: 18, ta: 18, tv: 0 },
    rejected: { total: 0, ta: 0, tv: 0 },
    approved: { total: 11, ta: 10, tv: 1 },
    appeal: { total: 0, ta: 0, tv: 0 },
    reapply: { total: 0, ta: 0, tv: 0 },
  },
  {
    district: 'Bageshwar',
    mean: 4.32,
    median: 9,
    mode: 2,
    maxDays: 0,
    minDays: 0,
    total: 25,
    incomplete: 0,
    archived: 0,
    submitted: { total: 25, ta: 25, tv: 0 },
    applicant: { total: 4, ta: 4, tv: 0 },
    department: { total: 14, ta: 14, tv: 0 },
    rejected: { total: 0, ta: 0, tv: 0 },
    approved: { total: 1, ta: 1, tv: 0 },
    appeal: { total: 0, ta: 0, tv: 0 },
    reapply: { total: 0, ta: 0, tv: 0 },
  },
];

const getPillClass = (value: number, variant: 'ta' | 'tv') => {
  if (value === 0) return variant === 'ta' ? 'bg-success' : 'bg-danger';
  return variant === 'ta' ? 'bg-success' : 'bg-danger';
};

export default function MisApplicantDashboard() {
  const [department, setDepartment] = useState('');
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set([15]));

  const totalApplications = useMemo(
    () => districts.reduce((sum, row) => sum + row.total, 0),
    []
  );

  const departmentCards = [
    {
      id: 15,
      name: 'Agriculture Department',
      total: 336,
      ta: 336,
      tv: 0,
      lastSynced: '27-08-2025 03:42:44 AM',
      stats: [
        { label: 'Under Process', value: 537 },
        { label: 'Rejected', value: 9 },
        { label: 'Submitted', value: 1052 },
        { label: 'Approved', value: 417 },
        { label: 'Reverted', value: 113 },
      ],
    },
    {
      id: 21,
      name: 'FCS - Legal Metrology Department',
      total: 175,
      ta: 175,
      tv: 0,
      lastSynced: '27-08-2025 03:42:44 AM',
      stats: [
        { label: 'Under Process', value: 337 },
        { label: 'Rejected', value: 0 },
        { label: 'Submitted', value: 1727 },
        { label: 'Approved', value: 1373 },
        { label: 'Reverted', value: 45 },
      ],
    },
  ];

  const availableDepartments = departmentCards.map((card) => card.name);
  const visibleDepartments = department
    ? departmentCards.filter((card) => card.name === department)
    : departmentCards;

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div
      className="container-fluid px-3 px-lg-4 py-5"
      style={{ marginLeft: 'auto', marginRight: 'auto', paddingTop: 24 }}
    >
      <div className="text-center mb-4" style={{ marginTop: 32 }}>
        <div
          className="rounded-4 py-4 px-3"
          style={{
            background: '#fff6f8',
            border: '1px solid #fde3ea',
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <div className="fw-semibold">Total Application : {totalApplications}</div>
            <div className="text-muted small">TA: Timeline Adhered | TV: Timeline Violated</div>
          </div>
          <h2 className="h4 mb-1">MIS Dashboard</h2>
          <div className="text-muted">Updated on Weekly Basis</div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="">Select Department</option>
                {availableDepartments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Financial year</label>
              <input
                className="form-control"
                value={financialYear}
                onChange={(event) => setFinancialYear(event.target.value)}
              />
            </div>
            <div className="col-md-4">
              <button className="btn btn-danger px-4" type="button">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {visibleDepartments.map((card) => {
        const isExpanded = expandedIds.has(card.id);
        return (
          <div key={card.id}>
            <div
              className="rounded-4 p-4 mb-4 text-white"
              style={{
                background: '#4b4b4b',
              }}
            >
              <div className="d-flex justify-content-between flex-wrap gap-3">
                <div>
                  <div className="text-danger fw-semibold">Department ID : {card.id}</div>
                  <div className="fw-semibold">{card.name}</div>
                  <div className="small text-white-50">Services | Last Synced on : {card.lastSynced}</div>
                </div>
                <div className="text-end">
                  <div className="fw-semibold">Pending With Department</div>
                  <div className="small text-white-50">Total:{card.total} TA: {card.ta} TV: {card.tv}</div>
                  <button
                    className="btn btn-sm rounded-pill mt-2"
                    type="button"
                    onClick={() => toggleExpanded(card.id)}
                    style={{ background: '#d9d9d9', border: '1px solid #cfcfcf' }}
                  >
                    <span className="me-1">{isExpanded ? '-' : '+'}</span>
                    {isExpanded ? 'Click to Collapse' : 'Click to Expand'}
                  </button>
                </div>
              </div>
              <div className="row g-3 mt-3">
                {card.stats.map((stat) => (
                  <div key={stat.label} className="col-6 col-lg">
                    <div className="rounded-3 text-center py-3" style={{ background: '#5b5b5b' }}>
                      <div className="small">{stat.label}</div>
                      <div className="fs-4 fw-semibold">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isExpanded && (
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle">
                  <thead>
                    <tr className="text-center">
                      <th colSpan={2}></th>
                      <th colSpan={4}>Total</th>
                      <th colSpan={2}>Under Process</th>
                      <th colSpan={2}>Disposed</th>
                      <th colSpan={2}>Reopened</th>
                    </tr>
                    <tr>
                      <th>District</th>
                      <th>Time Taken By Department</th>
                      <th>Incomplete</th>
                      <th>Archived</th>
                      <th>Submitted</th>
                      <th>Total</th>
                      <th>Applicant</th>
                      <th>Department</th>
                      <th>Rejected</th>
                      <th>Approved</th>
                      <th>Appeal</th>
                      <th>Re-application</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districts.map((row) => (
                      <tr key={`${card.id}-${row.district}`}>
                        <td>
                          <div className="fw-semibold">{row.district}</div>
                        </td>
                        <td>
                          <div>Mean : {row.mean}</div>
                          <div>Median : {row.median}</div>
                          <div>Mode : {row.mode}</div>
                          <div>Max-Time (In Days) : {row.maxDays}</div>
                          <div>Min-Time (In Days) : {row.minDays}</div>
                        </td>
                        <td className="text-center">{row.incomplete}</td>
                        <td className="text-center">{row.archived}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.submitted.ta, 'ta')}`}>TA: {row.submitted.ta}</span>
                            <span className={`badge ${getPillClass(row.submitted.tv, 'tv')}`}>TV: {row.submitted.tv}</span>
                          </div>
                          <div>Total : {row.submitted.total}</div>
                        </td>
                        <td className="text-center">{row.total}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.applicant.ta, 'ta')}`}>TA: {row.applicant.ta}</span>
                            <span className={`badge ${getPillClass(row.applicant.tv, 'tv')}`}>TV: {row.applicant.tv}</span>
                          </div>
                          <div>Total : {row.applicant.total}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.department.ta, 'ta')}`}>TA: {row.department.ta}</span>
                            <span className={`badge ${getPillClass(row.department.tv, 'tv')}`}>TV: {row.department.tv}</span>
                          </div>
                          <div>Total : {row.department.total}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.rejected.ta, 'ta')}`}>TA: {row.rejected.ta}</span>
                            <span className={`badge ${getPillClass(row.rejected.tv, 'tv')}`}>TV: {row.rejected.tv}</span>
                          </div>
                          <div>Total : {row.rejected.total}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.approved.ta, 'ta')}`}>TA: {row.approved.ta}</span>
                            <span className={`badge ${getPillClass(row.approved.tv, 'tv')}`}>TV: {row.approved.tv}</span>
                          </div>
                          <div>Total : {row.approved.total}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.appeal.ta, 'ta')}`}>TA: {row.appeal.ta}</span>
                            <span className={`badge ${getPillClass(row.appeal.tv, 'tv')}`}>TV: {row.appeal.tv}</span>
                          </div>
                          <div>Total : {row.appeal.total}</div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className={`badge ${getPillClass(row.reapply.ta, 'ta')}`}>TA: {row.reapply.ta}</span>
                            <span className={`badge ${getPillClass(row.reapply.tv, 'tv')}`}>TV: {row.reapply.tv}</span>
                          </div>
                          <div>Total : {row.reapply.total}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
