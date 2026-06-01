"use client";

import React, { useMemo, useState } from "react";
import { IncentiveMetricsTable } from "./IncentiveReportDashboard";
import { useIncentiveApplicationSubmissions } from "@/hooks/master/useIncentiveApplicationSubmissions";
import { usePolicies } from "@/hooks/master/usePolicies";
import { useSchemes } from "@/hooks/master/useSchemes";
import { useDistricts } from "@/hooks/master/useDistricts";
import { useSubSectors } from "@/hooks/master/useSubSectors";

interface Policy {
  id: number;
  department_id: number;
  policy_name: string;
  policy_code: string;
  description?: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    id: number;
    name: string;
  };
}

interface Scheme {
  id: number;
  policy_id: number;
  service_id: string;
  scheme_name: string;
  scheme_code: string;
  cascading_config: any[];
  pop_message_config: {
    enabled: boolean;
    title?: string;
    sections?: any[];
    acknowledgement_text?: string;
  } | null;
  form_structure_json: any[];
  required_documents: any;
  workflow_config?: {
    submit_url?: string;
    draft_url?: string;
    is_multi_step?: boolean;
    stages?: any[];
  };
  version: number;
  is_current_version: boolean;
  valid_from: string;
  valid_to: string;
  policy?: {
    policy_code: string;
    policy_name: string;
  };
}

interface District {
  id: number;
  name: string;
  abbreviation?: string;
  stateCode?: string;
  districtCode?: string;
  latlong?: string;
  isActive: boolean;
  stateId: number;
  createdAt: string;
  updatedAt: string;
}

interface SubSector {
  id: number;
  name: string;
  sectorId: number;
  sector?: {
    id: number;
    name: string;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  sectorName?: string; // derived field
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Container: React.FC = () => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(10);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<number | null>(
    1,
  );

  // --- Filter States ---
  const [filterSchemeType, setFilterSchemeType] = useState<string>("");
  const [filterSubSectorId, setFilterSubSectorId] = useState<number | null>(
    null,
  ); // ⬅️ use sub-sector id
  const [filterDistrict, setFilterDistrict] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const { data: applications = [], isLoading: isAppLoading } =
    useIncentiveApplicationSubmissions(
      selectedPolicyId && selectedSchemeCode
        ? {
            incentiveId: selectedSchemeCode,
            enabled: true, // ✅ scheme_code → incentiveId
          }
        : { enabled: true },
    );

  const { data: policies = [] } = usePolicies();
  const { data: schemes = [] } = useSchemes();
  const { data: districts = [] } = useDistricts();

  // ⬇️ This is the hook you asked to use for the “Sector” dropdown (actually Sub-Sector)
  const { data: subSectors = [] } = useSubSectors();

  const lookups = useMemo(() => {
    const policyMap = Object.fromEntries(
      (policies as Policy[]).map((p) => [p.id, p.policy_name]),
    );
    return {
      policyNameById: policyMap,
      schemeNameById: Object.fromEntries(
        (schemes as Scheme[]).map((s) => [s.id, s.scheme_name]),
      ),
      // Map sub-sector id -> sub-sector name (for label lookups if needed)
      subSectorNameById: Object.fromEntries(
        (subSectors as SubSector[]).map((s) => [s.id, s.name]),
      ),
      // If your API exposes a scheme type field, map that instead of scheme_name
      schemeTypeById: Object.fromEntries(
        (schemes as Scheme[]).map((s) => [s.id, s.scheme_name]), // FIXME: replace with s.scheme_type when available
      ),
      districtNameById: Object.fromEntries(
        (districts as District[]).map((d) => [d.id, d.name]),
      ),
      policyNameBySchemeId: Object.fromEntries(
        (schemes as Scheme[]).map((s) => [
          s.id,
          s.policy?.policy_name || policyMap[s.policy_id] || "Unknown Policy",
        ]),
      ),
    };
  }, [policies, schemes, districts, subSectors]);

  // --- Filtering Logic ---
  const filteredApplications = useMemo(() => {
    return applications.filter((app: any) => {
      const appDate = new Date(app.createdOn).getTime();
      const start = filterStartDate
        ? new Date(filterStartDate).getTime()
        : null;
      const end = filterEndDate ? new Date(filterEndDate).getTime() : null;

      const matchesSchemeType =
        !filterSchemeType ||
        lookups.schemeTypeById[app.incentiveId] === filterSchemeType;

      // ⬇️ Prefer subSectorId; fallback to sectorId if backend not yet updated
      const appSubSectorId = app.subSectorId ?? app.sectorId;

      const matchesSubSector =
        !filterSubSectorId ||
        Number(appSubSectorId) === Number(filterSubSectorId);

      const matchesDistrict =
        !filterDistrict || Number(app.districtId) === Number(filterDistrict);

      const matchesStatus =
        !filterStatus || app.applicationStatus === filterStatus;

      const matchesDate =
        (!start || appDate >= start) && (!end || appDate <= end);

      return (
        matchesSchemeType &&
        matchesSubSector &&
        matchesDistrict &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    applications,
    filterSchemeType,
    filterSubSectorId,
    filterDistrict,
    filterStatus,
    filterStartDate,
    filterEndDate,
    lookups,
  ]);

  const resetFilters = () => {
    setFilterSchemeType("");
    setFilterSubSectorId(null);
    setFilterDistrict(null);
    setFilterStatus("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <div className="p-5 mt-5">
      <div className="bg-white p-4 rounded shadow border">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="m-0">Incentive Dashboard</h5>
          <button
            className="btn btn-outline-primary rounded-5 btn-sm"
            onClick={resetFilters}
          >
            Reset All Filters
          </button>
        </div>
        {/* Filter Bar */}
        <div className="row g-3 mb-4">
          <div className="col-md-2">
            <label className="form-label small fw-bold">Scheme Type</label>
            <select
              className="form-select form-select-sm"
              value={filterSchemeType}
              onChange={(e) => setFilterSchemeType(e.target.value)}
            >
              <option value="">All Scheme Types</option>
              {Array.from(new Set(Object.values(lookups.schemeTypeById))).map(
                (s) => (
                  <option key={s as string} value={s as string}>
                    {s as string}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* ⬇️ Updated: Use Sub-Sectors from useSubSectors() */}
          <div className="col-md-2">
            <label className="form-label small fw-bold">Sector</label>
            <select
              className="form-select form-select-sm"
              value={filterSubSectorId ?? ""}
              onChange={(e) =>
                setFilterSubSectorId(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">All Sectors</option>
              {subSectors.map((s: SubSector) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-bold">District</label>
            <select
              className="form-select form-select-sm"
              value={filterDistrict ?? ""}
              onChange={(e) =>
                setFilterDistrict(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">All Districts</option>
              {districts.map((d: District) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-bold">Status</label>
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Received</option>
              <option value="APPROVED">Approved</option>
              <option value="DISBURSED">Disbursed</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-bold">From</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-bold">To</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>
        <IncentiveMetricsTable
          application={filteredApplications}
          isLoading={isAppLoading}
          selectedPolicyId={selectedPolicyId}
          selectedSchemeCode={selectedSchemeCode}
          policyNameById={lookups.policyNameById}
          schemeNameById={lookups.schemeNameById}
          districtNameById={lookups.districtNameById}
          policyNameBySchemeId={lookups.policyNameBySchemeId}
          /** ⬇️ new */
          subSectorNameById={lookups.subSectorNameById}
          selectedSubSectorId={filterSubSectorId}
        />
      </div>
    </div>
  );
};

export default Container;
