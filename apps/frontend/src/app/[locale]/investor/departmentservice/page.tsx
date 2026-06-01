"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { useServices } from "@/hooks/master/useServices";
import { useProjectStatusCafOptions } from "@/hooks/investor/useProjectStatusCafOptions";
import { useTranslations } from "next-intl";

type ServiceRow = {
  id: number;
  serviceId: string;
  departmentId: number;
  department: string;
  service: string;
  stage: string;
};

type SortField = "department" | "service" | "stage" | null;
type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function UnifiedApplicationPage() {
  const router = useRouter();
  const t = useTranslations("DepartmentService");

  const [selectedCAF, setSelectedCAF] = useState("");
  const [cafError, setCafError] = useState("");
  const [serviceError, setServiceError] = useState("");

  // search / sort / page
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: projectStatusCafData = [] } = useProjectStatusCafOptions();
  const cafList = useMemo(
    () =>
      projectStatusCafData.map((item) => ({
        id: String(item.submissionId),
        name: item.label || `${item.unitName || "CAF"} - ${item.submissionId}`,
      })),
    [projectStatusCafData]
  );

  const { data: servicesData = [] } = useServices({
    isActive: true,
    departmentIds: [23, 8, 4, 5, 11, 9, 3],
    swcsServiceIds: [11, 39, 23, 41, 2, 309, 42],
  });

  const services: ServiceRow[] = useMemo(
    () =>
      servicesData.map((srv: any) => ({
        id: srv.id,
        serviceId: String(srv.service_id ?? srv.id),
        departmentId: Number(srv.department_id ?? 0),
        department: srv.department_name ?? "-",
        service: srv.service_name ?? "-",
        stage: "Pre-Establishment",
      })),
    [servicesData]
  );

  const [checkedServices, setCheckedServices] = useState<number[]>([]);

  useEffect(() => {
    if (services.length && checkedServices.length === 0) {
      setCheckedServices(services.map((s) => s.id));
    }
  }, [services, checkedServices.length]);

  useEffect(() => {
    if (!cafList.length) { if (selectedCAF !== "") setSelectedCAF(""); return; }
    if (selectedCAF && !cafList.some((c) => c.id === selectedCAF)) setSelectedCAF("");
  }, [cafList, selectedCAF]);

  function toggleService(id: number) {
    setCheckedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (serviceError) setServiceError("");
  }

  // ── derived data ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = q
      ? services.filter(
          (s) =>
            s.department.toLowerCase().includes(q) ||
            s.service.toLowerCase().includes(q) ||
            s.stage.toLowerCase().includes(q)
        )
      : [...services];

    if (sortField) {
      rows.sort((a, b) => {
        const av = a[sortField].toLowerCase();
        const bv = b[sortField].toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [services, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // reset to page 1 on search/sort/pageSize change
  useEffect(() => { setPage(1); }, [search, sortField, sortDir, pageSize]);

  const allCheckedOnPage = paginated.length > 0 && paginated.every((s) => checkedServices.includes(s.id));

  function togglePageAll() {
    const ids = paginated.map((s) => s.id);
    if (allCheckedOnPage) {
      setCheckedServices((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setCheckedServices((prev) => [...new Set([...prev, ...ids])]);
    }
    if (serviceError) setServiceError("");
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span style={{ opacity: 0.4, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const handleApplyNow = () => {
    let valid = true;
    if (!selectedCAF) { setCafError(t("cafRequired")); valid = false; } else setCafError("");
    if (checkedServices.length === 0) { setServiceError(t("selectAtLeastOneService")); valid = false; } else setServiceError("");
    if (!valid) return;

    const selectedServices = services
      .filter((srv) => checkedServices.includes(srv.id))
      .map(({ id, serviceId, departmentId, department, service }) => ({
        id, serviceId, departmentId, department, service,
      }));

    sessionStorage.setItem("unified-selection", JSON.stringify({ caf: selectedCAF, services: checkedServices, selectedServices }));
    router.push("/investor/departmentservice/unifiedapplication");
  };

  // ── page number buttons ───────────────────────────────────────
  function pageNumbers() {
    const delta = 2;
    const range: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }

  // ── styles ────────────────────────────────────────────────────
  const RED = "#e9090c";
  const thStyle: React.CSSProperties = {
    padding: "11px 14px",
    textAlign: "left",
    fontWeight: 600,
    fontSize: "0.85rem",
    color: "#fff",
    background: RED,
    border: "none",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };
  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "0.875rem",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    verticalAlign: "middle",
  };

  return (
    <div style={{ maxWidth: "100%", padding: "1.5rem" }}>
      {/* Heading */}
      <h3 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111827" }}>
        {t("pageTitle")}
      </h3>

      {/* CAF Dropdown */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: "0.9rem" }}>
          {t("selectCaf")}
        </label>
        <select
          style={{
            width: "100%",
            border: cafError ? "1px solid #e9090c" : "1px solid #d1d5db",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: "0.9rem",
            outline: "none",
            background: "#fff",
          }}
          value={selectedCAF}
          onChange={(e) => { setSelectedCAF(e.target.value); if (cafError) setCafError(""); }}
        >
          <option value="">--Select CAF--</option>
          {cafList.map((caf) => (
            <option key={caf.id} value={caf.id}>{caf.name}</option>
          ))}
        </select>
        {cafError && <div style={{ color: RED, fontSize: "0.82rem", marginTop: 4 }}>{cafError}</div>}
      </div>

      {/* Card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "0.85rem" }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search department, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "7px 10px 7px 30px",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 12px", fontSize: "0.8rem", background: "#fff", cursor: "pointer", color: "#6b7280" }}
            >
              ✕ Clear
            </button>
          )}

          {/* record count */}
          <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "#6b7280", background: "#e5e7eb", borderRadius: 999, padding: "3px 10px", fontWeight: 500 }}>
            {filtered.length} service{filtered.length !== 1 ? "s" : ""}
          </span>

          {/* rows per page */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "6px 8px", fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>Show {n}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 60, textAlign: "center" }}>{t("serialNo")}</th>
                <th style={thStyle} onClick={() => handleSort("department")}>
                  {t("department")} <SortIcon field="department" />
                </th>
                <th style={thStyle} onClick={() => handleSort("service")}>
                  {t("services")} <SortIcon field="service" />
                </th>
                <th style={{ ...thStyle, width: 160 }} onClick={() => handleSort("stage")}>
                  {t("stage")} <SortIcon field="stage" />
                </th>
                <th style={{ ...thStyle, width: 80, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allCheckedOnPage}
                    onChange={togglePageAll}
                    title="Select all on this page"
                    style={{ width: 16, height: 16, accentColor: "#fff", cursor: "pointer" }}
                  />
                  &nbsp;{t("select")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                    No services found.
                  </td>
                </tr>
              ) : (
                paginated.map((srv, index) => {
                  const isChecked = checkedServices.includes(srv.id);
                  return (
                    <tr
                      key={srv.id}
                      style={{ background: isChecked ? "#fff7f7" : index % 2 === 0 ? "#fff" : "#fafafa", transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe6e6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = isChecked ? "#fff7f7" : index % 2 === 0 ? "#fff" : "#fafafa")}
                    >
                      <td style={{ ...tdStyle, textAlign: "center", fontWeight: 500, color: "#6b7280" }}>
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: "#1d4ed8" }}>{srv.department}</td>
                      <td style={tdStyle}>{srv.service}</td>
                      <td style={tdStyle}>
                        <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 999, padding: "2px 10px", fontSize: "0.78rem", fontWeight: 600 }}>
                          {t("preEstablishmentStage")}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleService(srv.id)}
                          style={{ width: 17, height: 17, accentColor: RED, cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 16px", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
          <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
            Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            &nbsp;·&nbsp; {checkedServices.length} selected
          </span>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtnStyle(false, page === 1)}>«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnStyle(false, page === 1)}>‹</button>

            {pageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`e${i}`} style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>
              ) : (
                <button key={p} onClick={() => setPage(p as number)} style={pageBtnStyle(p === page, false)}>
                  {p}
                </button>
              )
            )}

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnStyle(false, page === totalPages)}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtnStyle(false, page === totalPages)}>»</button>
          </div>
        </div>
      </div>

      {serviceError && <div style={{ color: RED, fontSize: "0.82rem", marginTop: 8 }}>{serviceError}</div>}

      {/* Apply button */}
      <div style={{ textAlign: "right", marginTop: "1.25rem" }}>
        <button
          onClick={handleApplyNow}
          style={{ background: RED, color: "#fff", fontWeight: 600, padding: "9px 24px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: "0.95rem", boxShadow: "0 2px 6px rgba(233,9,12,0.3)", transition: "background 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
          onMouseLeave={(e) => (e.currentTarget.style.background = RED)}
        >
          {t("applyNow")}
        </button>
      </div>
    </div>
  );
}

function pageBtnStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    minWidth: 32,
    height: 32,
    padding: "0 8px",
    border: active ? "none" : "1px solid #d1d5db",
    borderRadius: 6,
    background: active ? "#e9090c" : disabled ? "#f3f4f6" : "#fff",
    color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
    fontWeight: active ? 700 : 400,
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
