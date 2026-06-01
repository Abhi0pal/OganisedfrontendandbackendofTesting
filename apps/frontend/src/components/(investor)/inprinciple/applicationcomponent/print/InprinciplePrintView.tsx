'use client';

import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/api-client';
import { getApplicationStatusLabel, toTitleCase } from '@/components/(investor)/inprinciple/utils/inprincipleUtils';
import {
  valueOrNA,
  getPathValue,
  formatDateTime,
  formatYesNo,
} from '@/components/(investor)/inprinciple/utils/printUtils';
import PrintHeader from './PrintHeader';
import PrintFooter from './PrintFooter';
import PrintSection from './PrintSection';
import PrintActivityLog from './PrintActivityLog';
import PrintUploadedDocuments from './PrintUploadedDocuments';
import {
  buildDocumentUrl,
  resolveStoredDocuments,
  StoredDocumentEntry,
} from '@/components/common/documentUtils';

type PrintInfoRow = {
  label: string;
  value: string;
  label2?: string;
  value2?: string;
};

function PrintInfoTable({
  rows,
  borderless = false,
}: {
  rows: PrintInfoRow[];
  borderless?: boolean;
}) {
  return (
    <table className={borderless ? 'print-table print-table-borderless' : 'print-table'}>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.label}-${index}`}>
            <td className="print-label w-1/4">{row.label}</td>
            <td className="w-1/4">{row.value}</td>
            {row.label2 ? (
              <>
                <td className="print-label w-1/4">{row.label2}</td>
                <td className="w-1/4">{row.value2 || 'N/A'}</td>
              </>
            ) : (
              <>
                <td className="w-1/4"></td>
                <td className="w-1/4"></td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type PrintDataTableProps = {
  headers: string[];
  rows: Array<Array<React.ReactNode>>;
  columnWidths?: string[];
};

function PrintDataTable({ headers, rows, columnWidths }: PrintDataTableProps) {
  return (
    <table className="print-table">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={`${header}-${index}`} style={{ width: columnWidths?.[index] }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={headers.length} style={{ textAlign: 'center' }}>
              No records found.
            </td>
          </tr>
        )}
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


type DraftResponse = {
  submissionId: number;
  formData: any;
  unitName?: string;
  status?: string;
  serviceId?: string;
  ubuId?: string | null;
  applicationCreatedDate?: string | null;
  applicationUpdatedDateTime?: string | null;
};

type InprinciplePrintViewProps = {
  submissionId: number;
};

export default function InprinciplePrintView({ submissionId }: InprinciplePrintViewProps) {
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!submissionId) {
      setLoading(false);
      return;
    }
    const loadDraft = async () => {
      try {
        const res = await apiClient.get('/investor/inprinciple/view', {
          params: { submissionId },
        });
        setDraft(res?.data || null);
      } catch (error) {
        console.error('Failed to load draft for print', error);
        setDraft(null);
      } finally {
        setLoading(false);
      }
    };
    loadDraft();
  }, [submissionId]);

  useEffect(() => {
    if (!loading && draft) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, draft]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('print-view');
    return () => {
      document.body.classList.remove('print-view');
    };
  }, []);

  const data = draft?.formData || {};
  const company = data.company || {};
  const finance = data.finance || {};
  const project = data.project || {};
  const requirement = data.requirement || {};
  const land = requirement.land || {};
  const authorized = data.authorized || {};
  const promoters = Array.isArray(data.promoter?.entries) ? data.promoter.entries : [];
  const resolvedServiceId =
    String(draft?.serviceId || getPathValue(data, 'serviceId') || getPathValue(data, 'service_id') || '');
  const proposalType = String(company.proposal_type || '').toLowerCase();
  const existingTypes = new Set([
    'expansion',
    'diversification',
    'modernisation',
    'modernization',
    'mordenisation',
  ]);
  const isExistingApplication = existingTypes.has(proposalType);
  const existingFinance = data.finance_existing || {};
  const humanizeValue = (value: any) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    return String(value)
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  const formatWordValue = (value: any) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const text = String(value);
    const hasDigits = /\d/.test(text);
    const hasAt = text.includes('@');
    const hasDash = text.includes('-');
    if (hasDigits || hasAt || hasDash) return text;
    return humanizeValue(text);
  };
  const authPhotoUrl = authorized?.photo
    ? String(authorized.photo).startsWith('http')
      ? String(authorized.photo)
      : String(authorized.photo).startsWith('/')
        ? `http://localhost:3001${authorized.photo}`
        : `http://localhost:3001/${authorized.photo}`
    : '';
  const baseApiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const formDocuments = useMemo<StoredDocumentEntry[]>(
    () => resolveStoredDocuments(data.documents as Record<string, string>),
    [data.documents]
  );

  const requirementTypeLabel = useMemo(() => {
    const value = String(land.requirement_type || '').toLowerCase();
    if (value === 'land') return 'Land';
    if (value === 'built_up_space_it_ites') return 'Built-up space (IT/ITES)';
    return valueOrNA(land.requirement_type);
  }, [land.requirement_type]);

  const capacityItems = Array.isArray(project.capacity_items) ? project.capacity_items : [];
  const productItems = Array.isArray(project.product_items) ? project.product_items : [];

  const districtValue =
    land.district || land.district_id || land.districtId || getPathValue(land, 'district_name');

  if (loading) {
    return <div className="p-6 text-sm text-gray-600">Loading application...</div>;
  }

  if (!draft) {
    return <div className="p-6 text-sm text-gray-600">Application not found.</div>;
  }

  return (
    <div className="print-page">
      <style>{`
        @page {
          size: A4;
          margin: 12mm 10mm;
        }
        .print-view .investor-main-content > header,
        .print-view .investor-main-content > footer,
        .print-view .sidebar,
        .print-view .investor-sidebar {
          display: none !important;
        }
        .print-view .investor-main-content {
          margin-left: 0 !important;
        }
        .print-view .investor-main-content main {
          padding: 0 !important;
          overflow: visible !important;
        }
        .print-view main {
          padding: 0 !important;
        }
        .print-view {
          background: #ffffff !important;
        }
        .print-page {
          width: 190mm;
          margin: 0 auto;
          color: #000;
          font-family: "Times New Roman", serif;
          font-size: 14px;
          line-height: 1.2;
          padding-bottom: 18mm;
        }
        .print-divider {
          border-top: 1px solid #000;
          margin-top: 8px;
        }
        .print-header {
          margin-bottom: 10px;
        }
        .print-header-main {
          display: grid;
          grid-template-columns: 70px 1fr 70px;
          align-items: center;
          gap: 8px;
        }
        .print-logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
          justify-self: center;
        }
        .print-header-text {
          text-align: center;
        }
        .print-title {
          font-size: 16px;
          font-weight: 700;
        }
        .print-subtitle {
          font-size: 12px;
        }
        .print-form-title {
          font-size: 13px;
          font-weight: 700;
          margin-top: 2px;
          text-align: center;
        }
        .print-header-lower {
          margin-top: 6px;
        }
        .print-header-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 6px;
        }
        .print-section {
          border: 1px solid #000;
        }
        .print-section-title {
          background: #b91c1c;
          color: #fff;
          font-weight: 700;
          padding: 4px 6px;
        }
        .print-section-body {
          padding: 6px;
        }
        .print-table {
          width: 100%;
          border-collapse: collapse;
        }
        .print-table th,
        .print-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: top;
        }
        .print-table-borderless th,
        .print-table-borderless td {
          border: none;
        }
        .print-table th {
          background: #b91c1c;
          color: #fff;
          font-weight: 700;
        }
        .print-label {
          font-weight: 700;
        }
        .print-link {
          color: #0000ee;
          text-decoration: underline;
        }
        .print-grid-with-photo {
          display: grid;
          grid-template-columns: 1fr 110px;
          gap: 10px;
          align-items: start;
        }
        .print-photo-box {
          border: 1px solid #000;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .print-photo {
          width: 100px;
          height: 110px;
          object-fit: cover;
        }
        .print-footer {
          border-top: 1px solid #000;
          margin-top: 12px;
          padding-top: 6px;
          font-size: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: center;
        }
        .print-footer > :nth-child(2) {
          text-align: center;
        }
        .print-footer > :nth-child(3) {
          text-align: right;
        }
        .print-page-number::after {
          content: "Page " counter(page) " of " counter(pages);
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-footer {
            position: fixed;
            bottom: 10mm;
            left: 10mm;
            right: 10mm;
          }
          .print-actions {
            display: none !important;
          }
        }
      `}</style>
      <PrintHeader
        unitName={valueOrNA(company.name || draft.unitName)}
        submissionId={String(draft.submissionId)}
        statusLabel={getApplicationStatusLabel(draft.status)}
      />

      <div className="print-body space-y-4">
        <PrintSection title="Application Details">
          <div className="print-grid-with-photo">
            <PrintInfoTable
              borderless
              rows={[
                {
                  label: 'SB ID',
                  value: draft.ubuId || 'Not Generated Yet',
                },
                {
                  label: 'Proposal Type',
                  value: formatWordValue(company.proposal_type),
                },
                {
                  label: 'CAF Status',
                  value: getApplicationStatusLabel(draft.status),
                },
                {
                  label: 'CAF Apply Date/Time',
                  value: draft.applicationCreatedDate
                    ? formatDateTime(draft.applicationCreatedDate)
                    : draft.applicationUpdatedDateTime
                      ? formatDateTime(draft.applicationUpdatedDateTime)
                      : valueOrNA(
                          getPathValue(data, 'application.apply_date') ||
                            getPathValue(data, 'application.apply_time')
                        ),
                },
              ]}
            />
            <div className="print-photo-box">
              {authPhotoUrl ? (
                <img src={authPhotoUrl} alt="Authorized Person" className="print-photo" />
              ) : (
                'Photo'
              )}
            </div>
          </div>
        </PrintSection>

        <PrintSection title="Company Details">
          <PrintInfoTable
            rows={[
              {
                label: 'Name of the Company/Unit/Trust',
                value: valueOrNA(company.name || draft.unitName),
                label2: 'Type of Proposal',
                value2: formatWordValue(company.proposal_type),
              },
              {
                label: 'Primary Activity of Project',
                value: formatWordValue(company.primary_activity),
                label2: 'Constitution of the Establishment',
                value2: formatWordValue(company.constitution),
              },
              {
                label: 'PAN Number',
                value: valueOrNA(company.pan),
                label2: 'Corporate Identification Number (CIN)',
                value2: valueOrNA(company.cin),
              },
              ...(isExistingApplication
                ? [
                    {
                      label: 'Date of Incorporation',
                      value: valueOrNA(company.incorporation_date),
                      label2: 'Business Start Date (Month/Year)',
                      value2: valueOrNA(company.business_start_date),
                    },
                  ]
                : [
                    {
                      label: 'Date of Incorporation',
                      value: valueOrNA(company.incorporation_date),
                      label2: 'Country of Origin',
                      value2: formatWordValue(company.country_of_origin || company.country_origin),
                    },
                  ]),
              {
                label: 'Do you have GST Number',
                value: formatYesNo(company.gst_available),
                label2: 'Is a Startup Company?',
                value2: formatYesNo(company.is_startup),
              },
              ...(isExistingApplication
                ? [
                    {
                      label: 'Country of Origin',
                      value: formatWordValue(company.country_of_origin || company.country_origin),
                    },
                  ]
                : []),
            ]}
          />
        </PrintSection>

        <PrintSection title="Corporate Address">
          <PrintInfoTable
            rows={[
              {
                label: 'Address Line 1',
                value: valueOrNA(company?.corp?.address1),
                label2: 'Address Line 2',
                value2: valueOrNA(company?.corp?.address2),
              },
              {
                label: 'City',
                value: valueOrNA(company?.corp?.city),
                label2: 'Block',
                value2: valueOrNA(company?.corp?.block),
              },
              {
                label: 'District',
                value: valueOrNA(company?.corp?.district),
                label2: 'State',
                value2: valueOrNA(company?.corp?.state),
              },
              {
                label: 'Country',
                value: valueOrNA(company?.corp?.country),
                label2: 'Pin Code',
                value2: valueOrNA(company?.corp?.pincode),
              },
              {
                label: 'Email ID',
                value: valueOrNA(company?.corp?.email || company.email),
                label2: 'Mobile No.',
                value2: valueOrNA(company?.corp?.mobile || company.mobile),
              },
            ]}
          />
        </PrintSection>

        {company.corr_same_as_corp === false && company.corr && (
          <PrintSection title="Correspondence Address">
            <PrintInfoTable
              rows={[
                {
                  label: 'Address Line 1',
                  value: valueOrNA(company?.corr?.address1),
                  label2: 'Address Line 2',
                  value2: valueOrNA(company?.corr?.address2),
                },
                {
                  label: 'City',
                  value: valueOrNA(company?.corr?.city),
                  label2: 'Block',
                  value2: valueOrNA(company?.corr?.block),
                },
                {
                  label: 'District',
                  value: valueOrNA(company?.corr?.district),
                  label2: 'State',
                  value2: valueOrNA(company?.corr?.state),
                },
                {
                  label: 'Country',
                  value: valueOrNA(company?.corr?.country),
                  label2: 'Pin Code',
                  value2: valueOrNA(company?.corr?.pincode),
                },
                {
                  label: 'Email ID',
                  value: valueOrNA(company?.corr?.email),
                  label2: 'Mobile No.',
                  value2: valueOrNA(company?.corr?.mobile),
                },
              ]}
            />
          </PrintSection>
        )}

        <PrintSection title="Authorised Person Detail">
          <PrintInfoTable
            rows={[
              {
                label: 'Name',
                value: valueOrNA(authorized.name),
                label2: 'Designation',
                value2: valueOrNA(authorized.designation),
              },
              {
                label: 'Mobile No.',
                value: valueOrNA(authorized.mobile),
                label2: 'Email',
                value2: valueOrNA(authorized.email),
              },
              {
                label: 'Gender',
                value: formatWordValue(authorized.gender),
                label2: 'Category',
                value2: formatWordValue(authorized.category),
              },
              {
                label: 'Address',
                value: valueOrNA(authorized.address),
              },
            ]}
          />
        </PrintSection>

        <PrintSection title="Promoter Details">
          <PrintDataTable
            headers={['S.No.', 'Name', 'Designation', 'Mobile', 'Email', 'Category']}
            columnWidths={['60px', 'auto', '140px', '120px', '160px', '120px']}
            rows={promoters.map((entry: any, index: number) => [
              index + 1,
              valueOrNA(entry?.name),
              valueOrNA(entry?.designation),
              valueOrNA(entry?.mobile),
              valueOrNA(entry?.email),
              formatWordValue(entry?.category),
            ])}
          />
        </PrintSection>

        <PrintSection title="Project Requirement (Land)">
          <PrintInfoTable
            rows={[
              {
                label: 'District',
                value: valueOrNA(districtValue),
                label2: 'Requirement Type',
                value2: requirementTypeLabel,
              },
              {
                label: 'Land required for proposed project (In Acres)',
                value: valueOrNA(land.area),
                label2: 'Is Land / Built-up space available with applicant?',
                value2: formatYesNo(land.available_with_applicant),
              },
              {
                label: 'Nature of ownership of land',
                value: formatWordValue(land.ownership_nature),
                label2: 'Is there any pending loan on the land?',
                value2: formatYesNo(land.pending_loan_outside),
              },
              {
                label: 'Current Land Use',
                value: formatWordValue(land.current_use_outside),
                label2: 'Development Authority',
                value2: formatWordValue(land.development_authority_outside),
              },
              {
                label: 'Name of Local Planning Authority',
                value: valueOrNA(land.lpa_name),
                label2: 'Distance between site and Heritage site (km)',
                value2: valueOrNA(land.heritage_distance),
              },
            ]}
          />
        </PrintSection>

        <PrintSection title="Unit Utility Requirement Details">
          <div className="space-y-4">
            <div>
              <div className="print-label" style={{ marginBottom: '4px' }}>
                Water
              </div>
              <PrintDataTable
                headers={[
                  'Source of Water',
                  'Industrial Water Consumption (Liters/Year)',
                  'Domestic Water Consumption (Liters/Year)',
                  'Total Water Consumption',
                ]}
                rows={(Array.isArray(requirement?.water?.details) ? requirement.water.details : []).map(
                  (item: any) => [
                    formatWordValue(item.source),
                    valueOrNA(item.industrial_consumption),
                    valueOrNA(item.domestic_consumption),
                    valueOrNA(item.total_consumption),
                  ]
                )}
              />
            </div>
            <div>
              <div className="print-label" style={{ marginBottom: '4px' }}>
                Electricity
              </div>
              <PrintDataTable
                headers={[
                  'Source of Electricity',
                  'Annual Electricity Consumption (In KW)',
                  'Electricity Load (In KW)',
                ]}
                rows={(Array.isArray(requirement?.power?.details) ? requirement.power.details : []).map(
                  (item: any) => [
                    formatWordValue(item.source),
                    valueOrNA(item.annual_consumption),
                    valueOrNA(item.load),
                  ]
                )}
              />
            </div>
          </div>
        </PrintSection>

        <PrintSection title="Proposed Capacity">
          <PrintDataTable
            headers={[
              'S.No.',
              'Activity (NIC)',
              'Sector',
              'Item Description',
              ...(isExistingApplication ? ['Existing Capacity', 'New Capacity'] : ['Proposed Capacity']),
              'Unit',
            ]}
            rows={capacityItems.map((item: any, index: number) => [
              index + 1,
              valueOrNA(item.activity_nic),
              valueOrNA(item.sector),
              valueOrNA(item.item_description),
              ...(isExistingApplication
                ? [
                    valueOrNA(item.existing_proposed_capacity ?? item.proposed_capacity),
                    valueOrNA(item.proposed_capacity),
                  ]
                : [valueOrNA(item.proposed_capacity)]),
              valueOrNA(item.unit_type),
            ])}
          />
        </PrintSection>

        <PrintSection title="Product Details">
          <PrintDataTable
            headers={[
              'S.No.',
              'Product/HSN Code',
              'Description',
              ...(isExistingApplication ? ['Existing Annual Capacity', 'New Annual Capacity'] : ['Annual Capacity']),
              'Unit',
            ]}
            rows={productItems.map((item: any, index: number) => [
              index + 1,
              valueOrNA(item.product_hsn),
              valueOrNA(item.product_description),
              ...(isExistingApplication
                ? [
                    valueOrNA(item.existing_annual_capacity ?? item.annual_capacity),
                    valueOrNA(item.annual_capacity),
                  ]
                : [valueOrNA(item.annual_capacity)]),
              valueOrNA(item.product_unit),
            ])}
          />
        </PrintSection>

        <PrintSection title="Employment">
          <PrintInfoTable
            rows={
              isExistingApplication
                ? [
                    {
                      label: 'Existing Direct Employment',
                      value: valueOrNA(project.existing_direct_employment),
                      label2: 'Total Direct Employment',
                      value2: valueOrNA(project.total_direct_employment),
                    },
                  ]
                : [
                    {
                      label: 'Total Direct Employment',
                      value: valueOrNA(project.total_direct_employment),
                    },
                  ]
            }
          />
        </PrintSection>

        <PrintSection title="Other Details">
          <PrintInfoTable
            rows={[
              {
                label: 'Production to be exported',
                value: formatYesNo(project.exported),
                label2: 'Have you signed MoU with Govt?',
                value2: formatYesNo(project.mou_signed),
              },
              {
                label: 'Whether IEM Approval Obtained?',
                value: formatYesNo(project.iem_approval),
                label2: 'Industrial License (IL)',
                value2: Array.isArray(project.industrial_license)
                  ? valueOrNA(project.industrial_license.join(', '))
                  : valueOrNA(project.industrial_license),
              },
            ]}
          />
        </PrintSection>

        <PrintSection title="Pollution Control">
          <PrintInfoTable
            rows={[
              {
                label: 'Type of Activity (UKPCB Guidelines)',
                value: valueOrNA(getPathValue(requirement, 'pollution.activity_type')),
                label2: 'Pollution Category',
                value2: valueOrNA(getPathValue(requirement, 'pollution.category')),
              },
            ]}
          />
        </PrintSection>

        <PrintSection title="Any Support Required from Govt.">
          <div className="text-sm text-gray-700">{valueOrNA(getPathValue(requirement, 'support'))}</div>
        </PrintSection>

        <PrintSection title="Project Finance (Cost)">
          <PrintDataTable
            headers={[
              'Particular',
              ...(isExistingApplication ? ['Existing', 'Modified'] : ['Value']),
            ]}
            columnWidths={['40%', ...(isExistingApplication ? ['30%', '30%'] : ['60%'])]}
            rows={[
              [
                'Land',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.land')), valueOrNA(getPathValue(finance, 'cost.land'))]
                  : [valueOrNA(getPathValue(finance, 'cost.land'))]),
              ],
              [
                'Building',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.building')), valueOrNA(getPathValue(finance, 'cost.building'))]
                  : [valueOrNA(getPathValue(finance, 'cost.building'))]),
              ],
              [
                'Plant & Machinery',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.plant')), valueOrNA(getPathValue(finance, 'cost.plant'))]
                  : [valueOrNA(getPathValue(finance, 'cost.plant'))]),
              ],
              [
                'Working Capital',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.working_capital')), valueOrNA(getPathValue(finance, 'cost.working_capital'))]
                  : [valueOrNA(getPathValue(finance, 'cost.working_capital'))]),
              ],
              [
                'Contingency',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.contingency')), valueOrNA(getPathValue(finance, 'cost.contingency'))]
                  : [valueOrNA(getPathValue(finance, 'cost.contingency'))]),
              ],
              [
                'Others',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'cost.others')), valueOrNA(getPathValue(finance, 'cost.others'))]
                  : [valueOrNA(getPathValue(finance, 'cost.others'))]),
              ],
              [
                <strong key="total-label">Total</strong>,
                ...(isExistingApplication
                  ? [
                      <strong key="total-existing">{valueOrNA(getPathValue(existingFinance, 'cost.total'))}</strong>,
                      <strong key="total-modified">{valueOrNA(getPathValue(finance, 'cost.total'))}</strong>,
                    ]
                  : [<strong key="total-value">{valueOrNA(getPathValue(finance, 'cost.total'))}</strong>]),
              ],
              [
                <strong key="project-category-label">Project Category</strong>,
                ...(isExistingApplication
                  ? [
                      <strong key="project-category-existing">{formatWordValue(existingFinance.project_category)}</strong>,
                      <strong key="project-category-modified">{formatWordValue(finance.project_category)}</strong>,
                    ]
                  : [<strong key="project-category-value">{formatWordValue(finance.project_category)}</strong>]),
              ],
            ]}
          />
        </PrintSection>

        <PrintSection title="Project Finance (Means)">
          <PrintDataTable
            headers={[
              'Particular',
              ...(isExistingApplication ? ['Existing', 'Modified'] : ['Value']),
            ]}
            columnWidths={['40%', ...(isExistingApplication ? ['30%', '30%'] : ['60%'])]}
            rows={[
              [
                'Promoter Equity',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.promoter_equity')), valueOrNA(getPathValue(finance, 'means.promoter_equity'))]
                  : [valueOrNA(getPathValue(finance, 'means.promoter_equity'))]),
              ],
              [
                'Institution Equity',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.institution_equity')), valueOrNA(getPathValue(finance, 'means.institution_equity'))]
                  : [valueOrNA(getPathValue(finance, 'means.institution_equity'))]),
              ],
              [
                'Foreign Equity',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.foreign_equity')), valueOrNA(getPathValue(finance, 'means.foreign_equity'))]
                  : [valueOrNA(getPathValue(finance, 'means.foreign_equity'))]),
              ],
              [
                'Term Loans',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.term_loans')), valueOrNA(getPathValue(finance, 'means.term_loans'))]
                  : [valueOrNA(getPathValue(finance, 'means.term_loans'))]),
              ],
              [
                'Others',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.others')), valueOrNA(getPathValue(finance, 'means.others'))]
                  : [valueOrNA(getPathValue(finance, 'means.others'))]),
              ],
              [
                'Total',
                ...(isExistingApplication
                  ? [valueOrNA(getPathValue(existingFinance, 'means.total')), valueOrNA(getPathValue(finance, 'means.total'))]
                  : [valueOrNA(getPathValue(finance, 'means.total'))]),
              ],
            ]}
          />
        </PrintSection>

        <PrintSection title="Finance Flags">
          <PrintInfoTable
            rows={[
              {
                label: 'ECB / FDI',
                value: formatYesNo(finance.ecb_fdi),
                label2: 'Share details with financial institutions',
                value2: formatYesNo(finance.share_details),
              },
            ]}
          />
        </PrintSection>

        <PrintSection title="Form Documents">
          {formDocuments.length ? (
            <PrintDataTable
              headers={['Document Type', 'Document Name', 'Version']}
              rows={formDocuments.map((doc) => {
                const url = buildDocumentUrl(doc.filePath, baseApiUrl);
                return [
                  doc.label,
                  url ? (
                    <a href={url} target="_blank" rel="noreferrer" className="print-link">
                      {doc.fileName}
                    </a>
                  ) : (
                    doc.fileName
                  ),
                  doc.version,
                ];
              })}
            />
          ) : (
            <div className="text-sm text-gray-600">No documents uploaded within the application.</div>
          )}
        </PrintSection>

        <PrintSection title="Activity Log">
          <PrintActivityLog submissionId={draft.submissionId} />
        </PrintSection>

        <PrintSection title="Uploaded Documents">
          <PrintUploadedDocuments submissionId={draft.submissionId} serviceId={resolvedServiceId} />
        </PrintSection>

        <PrintSection title="Declaration (Terms & Condition)">
          <div className="text-sm text-gray-700">
            I declare that all the information provided in the application form is true, accurate, and complete
            to the best of my knowledge and belief. I understand that any misrepresentation or omission of facts
            may result in rejection of my application or other appropriate action.
          </div>
        </PrintSection>
      </div>

      <PrintFooter />

      <div className="print-actions mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Print
        </button>
      </div>
    </div>
  );
}
