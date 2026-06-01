"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import {
  useMasterOptions,
  MasterOption,
  useNicCodes,
} from "@/hooks/investor/inprinciple/useMasterOptions";
import { useServiceSectors } from "@/hooks/master/useServicesectors";
import {
  valueOrNA,
  formatDateTime,
  formatYesNo,
} from "@/components/(investor)/inprinciple/utils/printUtils";
import { buildDocumentUrl } from "@/components/common/documentUtils";
const formatWordValue = (value: any) => {
  if (value === undefined || value === null || value === "") return "N/A";
  const text = String(value);
  const hasDigits = /\d/.test(text);
  const hasSpecial = /[@-]/.test(text);
  if (hasDigits || hasSpecial) return text;
  return text
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ")
    .trim();
};

/* ─── Premium Minimal Context Constants ─── */
const SECTION_COLORS = [
  "#475569", // Slate 600
  "#3f6212", // Lime 800 (subtle green)
  "#1e3a8a", // Blue 900
  "#581c87", // Purple 900
  "#9f1239", // Rose 800
  "#115e59", // Teal 800
  "#78350f", // Amber 900
];
let _sectionIndex = 0;
const resetSectionIndex = () => { _sectionIndex = 0; };
const nextSectionColor = () => SECTION_COLORS[_sectionIndex++ % SECTION_COLORS.length];

const infoTableStyles = `
  .ava-container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
  
  /* Tables */
  .ava-info-table { width: 100%; border-collapse: collapse; }
  .ava-info-table tr { transition: background-color 0.2s ease; border-bottom: 1px solid #f1f5f9; }
  .ava-info-table tr:hover { background-color: #f8fafc; }
  .ava-info-table td { padding: 12px 16px; font-size: 0.85rem; vertical-align: top; line-height: 1.5; }
  .ava-info-table td.ava-label { font-weight: 600; color: #1e293b; width: 22%; }
  .ava-info-table td.ava-value { color: #020617; width: 28%; font-weight: 500; }
  .ava-info-table tr:last-child { border-bottom: none; }
  
  .ava-data-table { width: 100%; border-collapse: collapse; background: #fff; white-space: nowrap; }
  .ava-data-table thead tr { border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
  .ava-data-table thead th { color: #0f172a; padding: 12px 16px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; border: none; }
  .ava-data-table tbody tr { transition: background-color 0.2s ease; border-bottom: 1px solid #f1f5f9; }
  .ava-data-table tbody tr:hover { background-color: #f8fafc; }
  .ava-data-table tbody td { padding: 12px 16px; font-size: 0.85rem; color: #0f172a; font-weight: 500; border: none; }
  .ava-data-table tbody tr:last-child { border-bottom: none; }

  /* Sections */
  .ava-section-details { border: 1px solid #e2e8f0; margin-bottom: 20px; border-radius: 8px; overflow: hidden; background: #ffffff; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
  .ava-section-details:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #cbd5e1; }
  .ava-section-details summary { 
    list-style: none; cursor: pointer; user-select: none; display: flex; align-items: center; gap: 12px; 
    padding: 16px 20px; font-size: 0.95rem; font-weight: 600; color: #1e293b; 
    background: #ffffff; border-bottom: 1px solid transparent; transition: background-color 0.2s ease;
  }
  .ava-section-details[open] summary { border-bottom-color: #e2e8f0; background: #f8fafc; }
  .ava-section-details summary::-webkit-details-marker { display: none; }
  .ava-section-details summary::after { content: "›"; margin-left: auto; font-size: 1.4rem; color: #94a3b8; transition: transform 0.3s cubic-bezier(.4,0,.2,1); }
  .ava-section-details[open] summary::after { transform: rotate(90deg); }
  .ava-section-body { padding: 20px; background: #fff; animation: ava-fade-in 0.3s ease-out; }
  @keyframes ava-fade-in { from { opacity: 0; } to { opacity: 1; } }

  /* Sub labels */
  .ava-sub-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #0f172a; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; margin: 24px 0 12px 0; }
  .ava-sub-label:first-child { margin-top: 0; }

  /* Links & Badges */
  .ava-doc-link { display: inline-flex; align-items: center; gap: 4px; color: #2563eb; font-size: 0.85rem; font-weight: 500; text-decoration: none; transition: color 0.2s ease; }
  .ava-doc-link:hover { color: #1d4ed8; text-decoration: underline; }
  .ava-status-pill { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  .ava-status-pill span { margin-right: 6px; }
  
  /* Header Card */
  .ava-header-card { border-radius: 8px; background: #ffffff; border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
  .ava-header-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 16px; }
  
  .ava-section-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; background: #f8fafc; border: 1px solid #e2e8f0; }
`;

const SECTION_ICONS: Record<string, string> = {
  "Company Details": "🏢",
  "Corporate Address": "📍",
  "Correspondence Address": "✉️",
  "Authorised Person": "👤",
  "Promoters": "👥",
  "Proposed Capacity": "⚙️",
  "Product Details": "📦",
  "Other Details": "📋",
  "Finance Details": "💰",
  "Finance Flags": "🚩",
  "Project Requirement": "🗺️",
  "Utility Requirement": "⚡",
};

const capitalizeValue = (value: any) => {
  if (value === undefined || value === null || value === "") return "N/A";
  const text = String(value).trim();
  if (!text) return "N/A";
  const lower = text.toLowerCase();
  return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
};

const formatWorkflowStatus = (status?: string | null) => {
  const code = String(status || "").trim().toUpperCase();
  const map: Record<string, string> = {
    P: "Pending",
    PENDING: "Pending",
    F: "Forwarded",
    FORWARDED: "Forwarded",
    FA: "Forwarded to Approver",
    A: "Approved",
    APPROVED: "Approved",
    R: "Rejected",
    REJECTED: "Rejected",
    RBI: "Reverted to Investor",
    H: "On Hold",
    HOLD: "On Hold",
  };
  return map[code] || valueOrNA(status);
};

type AccordionRow = {
  label: string;
  value: string | ReactNode;
  label2?: string;
  value2?: string | ReactNode;
};

const getMasterLabel = (options: MasterOption[] = [], value?: string | number | null) => {
  if (value === undefined || value === null || value === "") return undefined;
  const key = String(value);
  const match = options.find((option) => String(option.value) === key);
  return match?.label;
};

const InfoTable = ({
  rows,
}: {
  rows: AccordionRow[];
}) => {
  return (
    <table className="ava-info-table">
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`}>
            <td className="ava-label">
              {row.label}
            </td>
            <td className="ava-value">
              {row.value || "N/A"}
            </td>
            {row.label2 ? (
              <>
                <td className="ava-label">
                  {row.label2}
                </td>
                <td className="ava-value">
                  {row.value2 || "N/A"}
                </td>
              </>
            ) : (
              <>
                <td className="ava-label"></td>
                <td className="ava-value"></td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const DataTable = ({
  headers,
  rows,
  columnWidths,
  headerAlignments,
  rowAlignments,
}: {
  headers: string[];
  rows: Array<(string | ReactNode)[]>;
  columnWidths?: string[];
  headerAlignments?: Array<'start' | 'center' | 'end'>;
  rowAlignments?: Array<'start' | 'center' | 'end'>;
}) => (
  <table className="ava-data-table">
    <thead>
      <tr>
        {headers.map((header, index) => {
          const align = headerAlignments?.[index] || 'start';
          return (
            <th
              key={header}
              style={{ width: columnWidths?.[index], textAlign: align }}
            >
              {header}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td
            colSpan={headers.length}
            style={{ textAlign: rowAlignments?.[0] || 'start' }}
          >
            No records found.
          </td>
        </tr>
      ) : (
        rows.map((row, idx) => (
          <tr key={`row-${idx}`}>
            {row.map((cell, cellIndex) => {
              const align = rowAlignments?.[cellIndex] || 'start';
              return (
                <td key={`cell-${idx}-${cellIndex}`} style={{ textAlign: align }}>
                  {cell}
                </td>
              );
            })}
          </tr>
        ))
      )}
    </tbody>
  </table>
);

const Section = ({
  title,
  children,
  color,
}: {
  title: string;
  children: ReactNode;
  color?: string;
}) => {
  const accent = color ?? "#475569";
  const icon = SECTION_ICONS[title] ?? "📄";
  return (
    <details className="ava-section-details" open>
      <summary>
        <span className="ava-section-icon" style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}10` }}>{icon}</span>
        {title}
      </summary>
      <div className="ava-section-body" style={{ borderLeft: `3px solid ${accent}` }}>{children}</div>
    </details>
  );
};

const SubLabel = ({ label }: { label: string }) => (
  <div className="ava-sub-label">{label}</div>
);

const getDocumentPathFromValue = (doc?: any) => {
  if (!doc) return "";
  if (typeof doc === "string") return doc.trim();
  return (
    (doc.filePath && String(doc.filePath)) ||
    (doc.file_path && String(doc.file_path)) ||
    (doc.path && String(doc.path)) ||
    ""
  ).trim();
};

const getDocumentFileNameFromValue = (doc: any, fallbackPath: string) => {
  if (!doc) return fallbackPath.split("/").pop() || fallbackPath;
  return (
    doc.fileName ||
    doc.file_name ||
    doc.originalName ||
    doc.original_name ||
    fallbackPath.split("/").pop() ||
    fallbackPath
  );
};

const renderDocumentLink = (
  doc: any,
  baseApiUrl: string,
  fallbackLabel?: string
) => {
  const path = getDocumentPathFromValue(doc);
  if (!path) {
    return (
      <span className="text-muted small">{fallbackLabel || "No document uploaded"}</span>
    );
  }
  const fileName = getDocumentFileNameFromValue(doc, path);
  const url = buildDocumentUrl(path, baseApiUrl);
  return (
    <a href={url} target="_blank" rel="noreferrer" className="ava-doc-link" title={fileName}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
      {fallbackLabel || "View"}
    </a>
  );
};

type ApplicationViewAccordionProps = {
  draft: {
    submissionId: number;
    status?: string;
    serviceId?: string;
    ubuId?: string | null;
    submittedOn?: string | null;
    applicationCreatedDate?: string | null;
    applicationUpdatedDateTime?: string | null;
    unitName?: string;
  };
  formData: any;
};

export default function ApplicationViewAccordion({
  draft,
  formData,
}: ApplicationViewAccordionProps) {
  const { data: nicCodes = [] } = useNicCodes();
  const { data: serviceSectors = [] } = useServiceSectors({ isActive: true });
  const { data: countryOptions = [] } = useMasterOptions("COUNTRY");
  const { data: stateOptions = [] } = useMasterOptions("STATE");

  const company = formData.company || {};
  const requirement = formData.requirement || {};
  const land = requirement.land || {};
  const finance = formData.finance || {};
  const existingFinance = formData.finance_existing || {};
  const project = formData.project || {};
  const promoters = Array.isArray(formData.promoter?.entries)
    ? formData.promoter.entries
    : [];
  const authorized = formData.authorized || {};
  const capacityItems = Array.isArray(project.capacity_items)
    ? project.capacity_items
    : [];
  const productItems = Array.isArray(project.product_items)
    ? project.product_items
    : [];

  const requirementTypeLabel = useMemo(() => {
    const value = String(land.requirement_type || "").toLowerCase();
    if (value === "land") return "Land";
    if (value === "built_up_space_it_ites") return "Built-up space (IT/ITES)";
    return valueOrNA(land.requirement_type);
  }, [land.requirement_type]);

  const utilityDetails = (requirement.water?.details || []).map((item: any) => item);
  const electricityDetails = (requirement.power?.details || []).map((item: any) => item);

  const landStateId =
    land.state || land.stateId || land.state_id || company?.corp?.state || company?.corp?.stateId || null;
  const corpStateId = company?.corp?.state || company?.corp?.stateId || company?.corp?.state_id || null;
  const reqDistrictId = land.district || land.districtId || land.district_id || null;
  const corpDistrictId =
    company?.corp?.district || company?.corp?.districtId || company?.corp?.district_id || null;
  const reqBlockId = land.block || land.blockId || land.block_id || null;
  const corpBlockId =
    company?.corp?.block || company?.corp?.blockId || company?.corp?.block_id || null;

  const { data: corpDistrictOptions = [] } = useMasterOptions(
    "DISTRICT",
    corpStateId,
    !!corpStateId
  );
  const corpDistrictLabel =
    getMasterLabel(corpDistrictOptions, corpDistrictId) ||
    valueOrNA(company?.corp?.district || company?.corp?.districtId);
  const { data: corpBlockOptions = [] } = useMasterOptions("BLOCK", corpDistrictId, !!corpDistrictId);
  const corpBlockLabel =
    getMasterLabel(corpBlockOptions, corpBlockId) ||
    valueOrNA(company?.corp?.block || company?.corp?.blockId);

  const { data: requirementDistrictOptions = [] } = useMasterOptions(
    "DISTRICT",
    landStateId,
    !!landStateId
  );
  const requirementDistrictLabel =
    getMasterLabel(requirementDistrictOptions, reqDistrictId) ||
    valueOrNA(land.district);
  const { data: requirementBlockOptions = [] } = useMasterOptions(
    "BLOCK",
    reqDistrictId,
    !!reqDistrictId
  );
  const requirementBlockLabel =
    getMasterLabel(requirementBlockOptions, reqBlockId) ||
    valueOrNA(land.block);
  const requirementStateLabel =
    getMasterLabel(stateOptions, land.state) || valueOrNA(land.state);
  const requirementCountryLabel =
    getMasterLabel(countryOptions, land.country) || valueOrNA(land.country);
  const corpStateLabel =
    getMasterLabel(stateOptions, corpStateId) || valueOrNA(company?.corp?.state || company?.corp?.stateId);
  const corpCountryLabel =
    getMasterLabel(countryOptions, company?.corp?.country) || valueOrNA(company?.corp?.country);

  // BUSINESS RULE: show only persisted SB ID; do not reconstruct from form fields.
  const uniqueBusinessIdValue = String(draft.ubuId || "").trim();

  const getNicLabel = (value: any) =>
    valueOrNA(
      (nicCodes || []).find((opt) => String(opt.value) === String(value))?.label ?? value
    );
  const getSectorLabel = (value: any) =>
    valueOrNA(
      (serviceSectors || []).find((sector: any) => String(sector.id) === String(value))?.name ?? value
    );
  const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const authPhoto = authorized?.photo
    ? String(authorized.photo).startsWith('http')
      ? String(authorized.photo)
      : String(authorized.photo).startsWith('/')
        ? `${baseApiUrl}${authorized.photo}`
        : `${baseApiUrl}/${authorized.photo}`
    : '';
  const unitLabel = valueOrNA(draft.unitName || company?.name || company?.corp?.name);
  const formatOfficePhone = (std?: string, office?: string) => `${std || '-'} / ${office || '-'}`;
  const formatMobileNumber = (countryCode?: string, mobile?: string) =>
    `${countryCode ? `${countryCode} ` : ''}${mobile || '-'}`;
  const promoterRows = promoters.map((item: any, index: number) => [
    index + 1,
    formatYesNo(item.foreign_national),
    valueOrNA(item.name),
    valueOrNA(item.aadhaar),
    valueOrNA(item.dob),
    formatWordValue(item.designation),
    valueOrNA(item.net_worth),
    valueOrNA(item.experience),
    formatWordValue(item.gender),
    valueOrNA(item.address),
    formatOfficePhone(item.std_code, item.office_phone),
    formatMobileNumber(item.country_code, item.mobile),
    formatWordValue(item.category),
    valueOrNA(item.email),
    renderDocumentLink(item.photo, baseApiUrl, 'Photo'),
    renderDocumentLink(item.it_return, baseApiUrl, 'IT Return'),
  ]);

  // resetSectionIndex() is intentionally removed here to prevent React render mismatch

  return (
    <div className="ava-container">
      <style>{infoTableStyles}</style>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Minimal Header Card ── */}
      <div className="ava-header-card">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>Application Overview</div>
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Details submitted for processing.</div>
          <div className="ava-header-meta">
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Unique Business ID</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>{uniqueBusinessIdValue || "Not Generated Yet"}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Status</div>
              <span className="ava-status-pill">
                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: draft.status === "A" ? "#10b981" : draft.status === "R" ? "#ef4444" : "#f59e0b" }}></span>
                {formatWorkflowStatus(draft.status)}
              </span>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500, marginBottom: 4 }}>Submission Date</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 500, color: "#334155" }}>{formatDateTime(draft.submittedOn || draft.applicationCreatedDate || draft.applicationUpdatedDateTime)}</div>
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {authPhoto ? (
            <img src={authPhoto} alt="Authorized Person" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: "50%", border: "2px solid #e2e8f0" }} />
          ) : (
            <div style={{ height: 80, width: 80, borderRadius: "50%", background: "#f8fafc", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", color: "#94a3b8" }}>👤</div>
          )}
          <div style={{ fontSize: "0.7rem", fontWeight: 500, color: "#64748b", marginTop: 8 }}>Authorized Profile</div>
        </div>
      </div>

      <Section title="Company Details" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Company",
              value: valueOrNA(company.name || company?.corp?.name || draft.unitName),
              label2: "Unit",
              value2: unitLabel,
            },
            {
              label: "Primary Activity",
              value:
                company.primary_activity && company.primary_activity !== ""
                  ? capitalizeValue(company.primary_activity)
                  : valueOrNA(company.primary_activity),
              label2: "Proposal Type",
              value2:
                company.proposal_type && company.proposal_type !== ""
                  ? capitalizeValue(company.proposal_type)
                  : valueOrNA(company.proposal_type),
            },
            {
              label: "Constitution",
              value:
                company.constitution && company.constitution !== ""
                  ? capitalizeValue(company.constitution)
                  : valueOrNA(company.constitution),
              label2: "PAN",
              value2: valueOrNA(company.pan),
            },
            {
              label: "CIN",
              value: valueOrNA(company.cin),
              label2: "Date of Incorporation",
              value2: valueOrNA(company.incorporation_date),
            },
            {
              label: "Business Start Date",
              value: valueOrNA(company.business_start_date),
              label2: "Country of Origin",
              value2: getMasterLabel(countryOptions, company.origin_country) || valueOrNA(company.origin_country),
            },
            {
              label: "GST Available",
              value: capitalizeValue(company.gst_available),
              label2: company.gst_available === "yes" ? "GST Number" : undefined,
              value2: company.gst_available === "yes" ? valueOrNA(company.gst_number) : undefined,
            },
            {
              label: "Is a Startup Company?",
              value: capitalizeValue(company.is_startup),
            },
          ]}
        />
      </Section>

      <Section title="Corporate Address" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Address 1",
              value: valueOrNA(company?.corp?.address1),
              label2: "Address 2",
              value2: valueOrNA(company?.corp?.address2),
            },
            {
              label: "City",
              value: valueOrNA(company?.corp?.city),
              label2: "Block",
              value2: corpBlockLabel,
            },
            {
              label: "District",
              value: corpDistrictLabel,
              label2: "State",
              value2: corpStateLabel,
            },
            {
              label: "Country",
              value: corpCountryLabel,
              label2: "Pin Code",
              value2: valueOrNA(company?.corp?.pincode),
            },
            {
              label: "Email",
              value: valueOrNA(company?.corp?.email || company.email),
              label2: "Mobile",
              value2: valueOrNA(company?.corp?.mobile || company.mobile),
            },
            {
              label: "Office Phone",
              value: formatOfficePhone(company?.corp?.std_code, company?.corp?.phone),
            },
          ]}
        />
      </Section>

      <Section title="Authorised Person" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Name",
              value: valueOrNA(authorized.name),
              label2: "Designation",
              value2: valueOrNA(authorized.designation),
            },
            {
              label: "Mobile",
              value: valueOrNA(authorized.mobile),
              label2: "Email",
              value2: valueOrNA(authorized.email),
            },
            {
              label: "Aadhaar No",
              value: valueOrNA(authorized.aadhaar),
              label2: "Gender",
              value2: capitalizeValue(authorized.gender),
            },
            {
              label: "Category",
              value: capitalizeValue(authorized.category),
              label2: "Is Foreign National?",
              value2: capitalizeValue(authorized.foreign_national),
            },
            {
              label: "Address",
              value: valueOrNA(authorized.address),
              label2: "Authorization Letter",
              value2: renderDocumentLink(authorized.authorization_letter, baseApiUrl, "Authorization Letter"),
            },
          ]}
        />
      </Section>

      {promoters.length > 0 && (
        <Section title="Promoters" color={nextSectionColor()}>
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", overflowX: "auto" }}>
            <DataTable
              headers={[
                "S.No.",
                "Foreign National",
                "Name",
                "Aadhaar No",
                "Date of Birth",
                "Designation",
                "Net Worth (INR)",
                "Experience (Years)",
                "Gender",
                "Address",
                "STD / Office Phone",
                "Mobile",
                "Category",
                "Email",
                "Photo",
                "IT Return",
              ]}
              rows={promoterRows}
              headerAlignments={[
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
                "center",
              ]}
              rowAlignments={[
                "center",
                "center",
                "start",
                "center",
                "center",
                "start",
                "end",
                "center",
                "center",
                "start",
                "start",
                "start",
                "start",
                "start",
                "center",
                "center",
              ]}
            />
          </div>
        </Section>
      )}

      {capacityItems.length > 0 && (
        <Section title="Proposed Capacity" color={nextSectionColor()}>
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", overflowX: "auto" }}>
            <DataTable
              headers={["S.No.", "Activity", "Sector", "Item Description", "Cap (Qty)", "Unit"]}
              rows={capacityItems.map((item: any, idx: number) => [
                idx + 1,
                getNicLabel(item.activity_nic),
                getSectorLabel(item.sector),
                getSectorLabel(item.item_description),
                valueOrNA(item.proposed_capacity),
                item.unit_type ? capitalizeValue(item.unit_type) : valueOrNA(item.unit_type),
              ])}
              headerAlignments={["center", "center", "center", "center", "center"]}
              rowAlignments={["center", "start", "start", "start", "start"]}
            />
          </div>
        </Section>
      )}

      {productItems.length > 0 && (
        <Section title="Product Details" color={nextSectionColor()}>
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", overflowX: "auto" }}>
            <DataTable
              headers={["S.No.", "Product/HSN", "Description", "Capacity", "Unit"]}
              rows={productItems.map((item: any, idx: number) => [
                idx + 1,
                valueOrNA(item.product_hsn),
                valueOrNA(item.product_description),
                valueOrNA(item.annual_capacity),
                item.product_unit ? capitalizeValue(item.product_unit) : valueOrNA(item.product_unit),
              ])}
              headerAlignments={["center", "center", "center", "center", "center"]}
              rowAlignments={["center", "start", "start", "start", "start"]}
            />
          </div>
        </Section>
      )}

      <Section title="Other Details" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Production to be Exported",
              value: capitalizeValue(project.exported),
              label2: project.exported === "yes" ? "Export Percentage (%)" : undefined,
              value2: project.exported === "yes" ? valueOrNA(project.export_percentage) : undefined,
            },
            {
              label: "Expected Commencement Date",
              value: valueOrNA(project.commencement_date),
            },
            {
              label: "MoU Signed with Govt of Uttarakhand?",
              value: capitalizeValue(project.mou_signed),
              label2: project.mou_signed === "yes" ? "MoU Month/Year" : undefined,
              value2: project.mou_signed === "yes" ? valueOrNA(project.mou_month) : undefined,
            },
            {
              label: "IEM Govt of India Approval Obtained?",
              value: capitalizeValue(project.iem_approval),
              label2: project.iem_approval === "yes" ? "IEM Number" : undefined,
              value2: project.iem_approval === "yes" ? valueOrNA(project.iem_number) : undefined,
            },
            {
              label: "Industrial License Sectors",
              value: Array.isArray(project.industrial_license)
                ? project.industrial_license.map((v: string) => formatWordValue(v)).join(", ") || "N/A"
                : valueOrNA(project.industrial_license),
              label2: "Industrial License Obtained?",
              value2: Array.isArray(project.industrial_license) && project.industrial_license.length > 0 && !project.industrial_license.includes("na")
                ? capitalizeValue(project.industrial_license_obtained)
                : "N/A",
            },
            {
              label: "Industrial License Number",
              value: project.industrial_license_obtained === "yes"
                ? valueOrNA(project.industrial_license_number)
                : "N/A",
            },
            {
              label: "Existing Direct Employment",
              value: valueOrNA(project.existing_direct_employment),
              label2: "Total Direct Employment",
              value2: valueOrNA(project.total_direct_employment),
            },
          ]}
        />
      </Section>

      <Section title="Finance Details" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Land", value: valueOrNA(finance?.cost?.land),
              label2: "Building", value2: valueOrNA(finance?.cost?.building),
            },
            {
              label: "Plant & Machinery", value: valueOrNA(finance?.cost?.plant),
              label2: "Work Capital Margin", value2: valueOrNA(finance?.cost?.working_capital),
            },
            {
              label: "Contingency", value: valueOrNA(finance?.cost?.contingency),
              label2: "Others", value2: valueOrNA(finance?.cost?.others),
            },
            {
              label: "Total", value: valueOrNA(finance?.cost?.total),
              label2: "Project Category", value2: valueOrNA(finance?.project_category),
            },
          ]}
        />
        <DataTable
          headers={["Means of Finance", "Value(in Crores)"]}
          rows={[
            ["Promoter's Equity", valueOrNA(finance?.means?.promoter_equity)],
            ["Institution's Equity", valueOrNA(finance?.means?.institution_equity)],
            ["Foreign Equity", valueOrNA(finance?.means?.foreign_equity)],
            ["Term Loans", valueOrNA(finance?.means?.term_loans)],
            ["Others", valueOrNA(finance?.means?.others)],
            ["Total", valueOrNA(finance?.means?.total)]
          ]}
        />
      </Section>

      <Section title="Finance Flags" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "External Commercial Borrowing (ECB) / FDI",
              value: capitalizeValue(finance?.ecb_fdi),
              label2: "Share application details with financial institutions?",
              value2: capitalizeValue(finance?.share_details),
            },
          ]}
        />
      </Section>

      <Section title="Project Requirement" color={nextSectionColor()}>
        {/* ── Land Details ── */}
        <SubLabel label="Land Details" />
        <InfoTable
          rows={[
            {
              label: "District",
              value: requirementDistrictLabel,
              label2: "Block",
              value2: requirementBlockLabel,
            },
            {
              label: "Village / Town",
              value: valueOrNA(land.village),
              label2: "Survey No / Khata No",
              value2: valueOrNA(land.survey_no),
            },
            {
              label: "Khasra No.",
              value: valueOrNA(land.land_code),
              label2: "State",
              value2: requirementStateLabel,
            },
            {
              label: "Country",
              value: requirementCountryLabel,
              label2: "Project / Business Requires?",
              value2: requirementTypeLabel,
            },
            {
              label: "Land Required for Project (Acres)",
              value: valueOrNA(land.area),
              label2: "Built-up Area Required (Sqm.)",
              value2: valueOrNA(land.built_up_area),
            },
            {
              label: "Is Land / Built-up space available with applicant?",
              value: capitalizeValue(land.available_with_applicant),
              label2: "Nature of Ownership",
              value2: formatWordValue(land.ownership_nature),
            },
            ...(land.ownership_nature === "owned_inside_notified"
              ? [{ label: "Industrial Area", value: formatWordValue(land.industrial_area) }]
              : []),
            ...(land.ownership_nature === "siidcul_lease"
              ? [
                { label: "SIIDCUL Estate", value: formatWordValue(land.siidcul_estate), label2: "SIIDCUL Plot Number", value2: valueOrNA(land.siidcul_plot_number) },
              ]
              : []),
            ...(land.ownership_nature === "mini_industrial_area_dic"
              ? [
                { label: "MSME Estate", value: formatWordValue(land.msme_estate), label2: "MSME Plot Number", value2: valueOrNA(land.msme_plot_number) },
              ]
              : []),
            ...(land.ownership_nature === "owned_outside_notified"
              ? [
                { label: "Pending Loan on Land?", value: capitalizeValue(land.pending_loan_outside), label2: "Current Land Use", value2: formatWordValue(land.current_use_outside) },
                { label: "Development Authority", value: formatWordValue(land.development_authority_outside) },
              ]
              : []),
            ...(land.ownership_nature === "private_rent_lease"
              ? [
                { label: "Is Lessor Physically Challenged?", value: capitalizeValue(land.lessor_physically_challenged), label2: "Is Lessor with Indian Armed Forces?", value2: capitalizeValue(land.lessor_armed_forces) },
                { label: "Caste of Lessor", value: formatWordValue(land.lessor_caste), label2: "Pending Loan on Land?", value2: capitalizeValue(land.pending_loan_lease) },
                { label: "Current Land Use (Lease)", value: formatWordValue(land.current_use_lease), label2: "Development Authority (Lease)", value2: formatWordValue(land.development_authority_lease) },
              ]
              : []),
            ...(land.available_with_applicant === "no"
              ? [
                { label: "Has Land been identified for purchase?", value: capitalizeValue(land.identified_for_purchase) },
                ...(land.identified_for_purchase === "yes"
                  ? [
                    { label: "Are you a resident of Uttarakhand?", value: capitalizeValue(land.resident_uttarakhand), label2: "Do you currently own any land in UK?", value2: capitalizeValue(land.currently_own_uk) },
                    { label: "Will purchase increase holding above 12.5 Acres?", value: capitalizeValue(land.purchase_above_12_5), label2: "Pending Loan on Land?", value2: capitalizeValue(land.pending_loan_purchase) },
                    { label: "Current Land Use (Purchase)", value: formatWordValue(land.current_use_purchase), label2: "Development Authority (Purchase)", value2: formatWordValue(land.development_authority_purchase) },
                    { label: "Caste of Seller", value: formatWordValue(land.seller_caste) },
                  ]
                  : []),
                ...(land.identified_for_purchase === "no"
                  ? [
                    { label: "Would you like assistance to identify land?", value: capitalizeValue(land.assistance_required) },
                    ...(land.assistance_required === "yes"
                      ? [{ label: "Preferred District for Purchase", value: valueOrNA(land.preferred_district) }]
                      : []),
                    ...(land.assistance_required === "no"
                      ? [
                        { label: "District Proposing to Establish Unit", value: valueOrNA(land.proposed_district), label2: "Total Plot Area Required (Sqmt.)", value2: valueOrNA(land.total_plot_area_sqmt) },
                      ]
                      : []),
                  ]
                  : []),
              ]
              : []),
          ]}
        />

        {/* ── Land Documents ── */}
        <SubLabel label="Land Documents & Authority" />
        <InfoTable
          rows={[
            {
              label: "Name of Local Planning Authority",
              value: valueOrNA(land.lpa_name),
              label2: "Distance from Heritage Site (km)",
              value2: valueOrNA(land.heritage_distance),
            },
            {
              label: "Consent Letter",
              value: land.consent_letter ? renderDocumentLink(land.consent_letter, baseApiUrl, "Consent Letter") : "N/A",
              label2: "Land Sketch",
              value2: land.sketch ? renderDocumentLink(land.sketch, baseApiUrl, "Sketch") : "N/A",
            },
            {
              label: "RoR Document",
              value: land.ror ? renderDocumentLink(land.ror, baseApiUrl, "RoR") : "N/A",
              label2: "Agreement to Sell",
              value2: land.agreement_to_sell ? renderDocumentLink(land.agreement_to_sell, baseApiUrl, "Agreement to Sell") : "N/A",
            },
          ]}
        />

        {/* ── Utilities ── */}
        <SubLabel label="Utilities" />
        <InfoTable
          rows={[
            {
              label: "Electricity Required?",
              value: capitalizeValue(requirement.power?.required),
              label2: "Water Required?",
              value2: capitalizeValue(requirement.water?.required),
            },
          ]}
        />

        {/* ── Electricity Details ── */}
        {electricityDetails.length > 0 && (
          <>
            <SubLabel label="Electricity Details" />
            <div className="table-responsive mb-2">
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Source of Electricity</th>
                    <th>Annual Consumption (KW)</th>
                    <th>Electricity Load (KW)</th>
                  </tr>
                </thead>
                <tbody>
                  {electricityDetails.map((item: any, index: number) => (
                    <tr key={`elec-${index}`}>
                      <td>{formatWordValue(item.source)}</td>
                      <td>{valueOrNA(item.annual_consumption)}</td>
                      <td>{valueOrNA(item.load)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Water Details ── */}
        {utilityDetails.length > 0 && (
          <>
            <SubLabel label="Water Details" />
            <div className="table-responsive mb-2">
              <table className="table table-sm table-bordered mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>Source of Water</th>
                    <th>Industrial Consumption (Liters/Year)</th>
                    <th>Domestic Consumption (Liters/Year)</th>
                    <th>Total Consumption (KL/Year)</th>
                  </tr>
                </thead>
                <tbody>
                  {utilityDetails.map((item: any, index: number) => (
                    <tr key={`water-${index}`}>
                      <td>{formatWordValue(item.source)}</td>
                      <td>{valueOrNA(item.industrial_consumption)}</td>
                      <td>{valueOrNA(item.domestic_consumption)}</td>
                      <td>{valueOrNA(item.total_consumption)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Pollution Control ── */}
        <SubLabel label="Pollution Control" />
        <InfoTable
          rows={[
            {
              label: "Type of Activity (UKPCB)",
              value: valueOrNA(requirement.pollution?.activity_type),
              label2: "Pollution Category",
              value2: valueOrNA(requirement.pollution?.category),
            },
            {
              label: "Environment Clearance",
              value: (() => {
                const v = requirement.pollution?.clearance;
                if (v === "moef") return "Ministry of Environment, Forest and Climate Change";
                if (v === "seiaa") return "State Environment Impact Assessment Authority";
                if (v === "na") return "N/A";
                return valueOrNA(v);
              })(),
            },
          ]}
        />

        {/* ── Govt Support ── */}
        {requirement.support && (
          <>
            <SubLabel label="Any Support Required from Govt." />
            <div className="border rounded p-2 text-sm" style={{ whiteSpace: "pre-wrap" }}>
              {requirement.support}
            </div>
          </>
        )}
      </Section>

      <Section title="Utility Requirement" color={nextSectionColor()}>
        <InfoTable
          rows={[
            {
              label: "Water Source",
              value: formatWordValue(utilityDetails[0]?.source),
              label2: "Industrial Consumption",
              value2: valueOrNA(utilityDetails[0]?.industrial_consumption),
            },
            {
              label: "Electricity Source",
              value: formatWordValue(electricityDetails[0]?.source),
              label2: "Annual Consumption (KW)",
              value2: valueOrNA(electricityDetails[0]?.annual_consumption),
            },
          ]}
        />
      </Section>

    </div>
  );
}

