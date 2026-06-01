'use client';

import { useMemo, useState } from 'react';

type Row = {
  service: string;
  department: string;
  district: string;
  timePeriod: string;
  received: number;
  approved: number;
  rejected: number;
  slaMet: number;
  avgTimeDays: number;
  fees: number;
  feedback: number;
};

const rows: Row[] = [
  {
    service: 'Trade License',
    department: 'Labour Department',
    district: 'Lucknow',
    timePeriod: 'Apr-Jun 2025',
    received: 245,
    approved: 220,
    rejected: 12,
    slaMet: 92,
    avgTimeDays: 5.3,
    fees: 325000,
    feedback: 4.3,
  },
  {
    service: 'Fire NOC',
    department: 'Fire Services',
    district: 'Dehradun',
    timePeriod: 'Apr-Jun 2025',
    received: 188,
    approved: 164,
    rejected: 14,
    slaMet: 88,
    avgTimeDays: 7.1,
    fees: 212000,
    feedback: 4.0,
  },
  {
    service: 'Building Permit',
    department: 'Urban Development',
    district: 'Haridwar',
    timePeriod: 'Apr-Jun 2025',
    received: 132,
    approved: 110,
    rejected: 8,
    slaMet: 94,
    avgTimeDays: 9.6,
    fees: 540000,
    feedback: 4.4,
  },
  {
    service: 'Pollution Consent',
    department: 'Environment',
    district: 'Nainital',
    timePeriod: 'Apr-Jun 2025',
    received: 96,
    approved: 72,
    rejected: 10,
    slaMet: 72,
    avgTimeDays: 12.4,
    fees: 178000,
    feedback: 3.7,
  },
  {
    service: 'Power Connection',
    department: 'Energy',
    district: 'Udham Singh Nagar',
    timePeriod: 'Apr-Jun 2025',
    received: 154,
    approved: 141,
    rejected: 6,
    slaMet: 90,
    avgTimeDays: 6.2,
    fees: 289000,
    feedback: 4.1,
  },
];

const formatMoney = (value: number) => value.toLocaleString('en-IN');

const getSlaClass = (sla: number) => {
  if (sla >= 90) return 'bg-success';
  if (sla >= 75) return 'bg-warning text-dark';
  return 'bg-danger';
};

export default function SwsPerformanceDashboard() {
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [filters, setFilters] = useState({
    department: 'All',
    service: 'All',
    district: 'All',
    slaStatus: 'All',
    applicationStatus: 'All',
    timePeriod: 'All',
  });
  const [lastUpdated] = useState(() => new Date());

  const departments = useMemo(() => ['All', ...new Set(rows.map((r) => r.department))], []);
  const services = useMemo(() => ['All', ...new Set(rows.map((r) => r.service))], []);
  const districts = useMemo(() => ['All', ...new Set(rows.map((r) => r.district))], []);
  const timePeriods = useMemo(() => ['All', ...new Set(rows.map((r) => r.timePeriod))], []);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filters.department !== 'All' && row.department !== filters.department) return false;
      if (filters.service !== 'All' && row.service !== filters.service) return false;
      if (filters.district !== 'All' && row.district !== filters.district) return false;
      if (filters.timePeriod !== 'All' && row.timePeriod !== filters.timePeriod) return false;

      if (filters.slaStatus !== 'All') {
        const status = row.slaMet >= 90 ? 'Met' : 'Unmet';
        if (filters.slaStatus !== status) return false;
      }

      if (filters.applicationStatus !== 'All') {
        if (filters.applicationStatus === 'Approved' && row.approved <= 0) return false;
        if (filters.applicationStatus === 'Rejected' && row.rejected <= 0) return false;
        if (filters.applicationStatus === 'Received' && row.received <= 0) return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">SWS Performance Dashboard</h1>
          <p className="text-muted mb-0">Service-wise performance against SLA targets</p>
        </div>
        <div className="text-end">
          <div className="small text-muted">Last updated</div>
          <div className="fw-semibold">{lastUpdated.toLocaleString()}</div>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Department</label>
              <select
                className="form-select"
                value={filters.department}
                onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
              >
                {departments.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Service</label>
              <select
                className="form-select"
                value={filters.service}
                onChange={(event) => setFilters((prev) => ({ ...prev, service: event.target.value }))}
              >
                {services.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">District</label>
              <select
                className="form-select"
                value={filters.district}
                onChange={(event) => setFilters((prev) => ({ ...prev, district: event.target.value }))}
              >
                {districts.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">SLA Status</label>
              <select
                className="form-select"
                value={filters.slaStatus}
                onChange={(event) => setFilters((prev) => ({ ...prev, slaStatus: event.target.value }))}
              >
                {['All', 'Met', 'Unmet'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Application Status</label>
              <select
                className="form-select"
                value={filters.applicationStatus}
                onChange={(event) => setFilters((prev) => ({ ...prev, applicationStatus: event.target.value }))}
              >
                {['All', 'Received', 'Approved', 'Rejected'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Time Period</label>
              <select
                className="form-select"
                value={filters.timePeriod}
                onChange={(event) => setFilters((prev) => ({ ...prev, timePeriod: event.target.value }))}
              >
                {timePeriods.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-9 d-flex align-items-end justify-content-end gap-2">
              <button
                type="button"
                className={`btn ${view === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('table')}
              >
                Table View
              </button>
              <button
                type="button"
                className={`btn ${view === 'chart' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setView('chart')}
              >
                Chart View
              </button>
              <button type="button" className="btn btn-outline-secondary">
                Export PDF
              </button>
              <button type="button" className="btn btn-outline-secondary">
                Export XLSX
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="alert alert-secondary">
          Chart view placeholder. Hook this to a chart library when data APIs are ready.
        </div>
      ) : (
        <div className="table-responsive card shadow-sm">
          <table className="table table-striped align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Service</th>
                <th>Department</th>
                <th>District</th>
                <th>Time Period</th>
                <th>Applications Received</th>
                <th>Applications Approved</th>
                <th>Applications Rejected</th>
                <th>SLA Met (%)</th>
                <th>Average Time (Days)</th>
                <th>Fees Collected (INR)</th>
                <th>Feedback Score (1-5)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.service}-${row.district}-${row.timePeriod}`}>
                  <td>{row.service}</td>
                  <td>{row.department}</td>
                  <td>{row.district}</td>
                  <td>{row.timePeriod}</td>
                  <td>{row.received}</td>
                  <td>{row.approved}</td>
                  <td>{row.rejected}</td>
                  <td>
                    <span className={`badge ${getSlaClass(row.slaMet)}`}>{row.slaMet.toFixed(1)}%</span>
                  </td>
                  <td>{row.avgTimeDays.toFixed(1)}</td>
                  <td>{formatMoney(row.fees)}</td>
                  <td>{row.feedback.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
