'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { PopupTabContent, UnifiedServicePopup } from '@/components/popups/UnifiedServicePopup';

type ServiceRow = {
  id: string | number;
  serviceCode: string;
  name: string;
  fee: string;
  timeline: string;
  formTypeId: number;
  firstPageId?: number | null;
  isCafRequired: boolean;
};

export default function ServiceListingPage() {
  const params = useParams();
  const router = useRouter();
  const category = params?.category as string;
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuth();

  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [navigatingServiceCode, setNavigatingServiceCode] = useState<string | null>(null);
  const [approvedCafs, setApprovedCafs] = useState<{ label: string; cafId: string }[]>([]);
  const [selectedCafForService, setSelectedCafForService] = useState<Record<string, string>>({});
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTabs, setPopupTabs] = useState<PopupTabContent[]>([]);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupServiceName, setPopupServiceName] = useState('');
  const [activeTab, setActiveTab] = useState('document-checklist');
  const latestFetchIdRef = useRef(0);

  useEffect(() => {
    apiClient.get('/investor/services/departments').then((res) => setDepartments(res.data));
  }, []);

  useEffect(() => {
    const uid = (user as any)?.id || (user as any)?.userId;
    if (uid) {
      apiClient
        .get(`/investor/services/approved-cafs?userId=${uid}`)
        .then((res) => setApprovedCafs(res.data))
        .catch((err) => console.error('CAF Fetch Error:', err));
    }
  }, [user]);

  useEffect(() => {
    if (!selectedDept || !category) {
      setServices([]);
      setLoading(false);
      return;
    }

    // Clear stale rows immediately and keep only latest department response.
    setServices([]);
    setLoading(true);
    const fetchId = ++latestFetchIdRef.current;

    apiClient
      .get('/investor/services/list', {
        params: { departmentId: Number(selectedDept), category, locale },
      })
      .then((res) => {
        if (fetchId !== latestFetchIdRef.current) return;
        setServices(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (fetchId !== latestFetchIdRef.current) return;
        setServices([]);
      })
      .finally(() => {
        if (fetchId !== latestFetchIdRef.current) return;
        setLoading(false);
      });
  }, [selectedDept, category, locale]);

  useEffect(() => {
    if (!services.length) return;
    // Warm up apply routes so click feels instant.
    services.slice(0, 10).forEach((service) => {
      if (!service?.formTypeId) return;
      const pageIdParam = service?.firstPageId ? `?pageId=${service.firstPageId}` : '';
      router.prefetch(`/${locale}/investor/services/${service.serviceCode}/apply/${service.formTypeId}${pageIdParam}`);
    });
  }, [services, locale, router]);

  const categoryLabel = useMemo(() => {
    if (!category) return 'Services';
    return category
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }, [category]);

  const handleCafChange = (serviceCode: string, cafId: string) => {
    setSelectedCafForService((prev) => ({ ...prev, [serviceCode]: cafId }));
  };

  const selectedDepartmentName = useMemo(
    () => departments.find((d) => d.id === selectedDept)?.name ?? '',
    [departments, selectedDept]
  );

  const handleOpenServicePopup = (service: ServiceRow) => {
    const tabs: PopupTabContent[] = [
      {
        id: 'document-checklist',
        label: 'Document Checklist',
        icon: 'bi bi-file-earmark-check',
        content: (
          <div className="max-h-[500px] overflow-y-auto space-y-6 pr-4 text-gray-800">
            <div>
              <p className="text-lg font-bold text-gray-900">1. Memorandum of Marriage</p>
              <p className="text-base mt-1">• Form D details are correctly entered</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">2. Proof of Age (Attested photocopy of any one)</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>School / College Leaving Certificate</li>
                <li>Birth Certificate</li>
                <li>Passport</li>
                <li>Domicile Certificate</li>
                <li>SSC / HSC Certificate</li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">3. Proof of Residence (Attested photocopy of any one)</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>Ration Card</li>
                <li>Election Card</li>
                <li>Electricity Bill (in the name of person)</li>
                <li>Telephone Bill (in the name of person)</li>
                <li>Passport</li>
                <li>Aadhaar Card</li>
                <li>Others</li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">4. Registered Address Proof of Witnesses</p>
              <p className="text-base mt-1">Witness 1 / 2 / 3</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>Ration Card</li>
                <li>Election Card</li>
                <li>Electricity Bill</li>
                <li>Telephone Bill</li>
                <li>Passport</li>
                <li>Aadhaar Card</li>
                <li>Others</li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">5. Wedding Card Proof</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>Marriage Invitation Card</li>
                <li>₹100/- General Stamp Paper (if invitation card is not available)</li>
              </ul>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">6. Photographs & Declarations</p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>Passport-size photographs of Bride & Groom</li>
                <li>Passport-size photographs of Witness 1 / 2 / 3</li>
                <li>Self Declaration Letter of Bride & Groom (Attested copy)</li>
                <li>Colored Photo of Marriage Ceremony</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: 'process-flow',
        label: 'Process Flow',
        icon: 'bi bi-diagram-3',
        content: (
          <div className="space-y-4 text-sm text-gray-700">
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">1</div>
                <div>
                  <p className="font-semibold text-gray-900">Fill Application Form</p>
                  <p className="text-gray-600 mt-1">Fill the Marriage Application Form and complete document checklist</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">2</div>
                <div>
                  <p className="font-semibold text-gray-900">Submit & Get Registration Number</p>
                  <p className="text-gray-600 mt-1">Registration number generated after submission</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">3</div>
                <div>
                  <p className="font-semibold text-gray-900">Make Online Payment</p>
                  <p className="text-gray-600 mt-1">Pay scrutiny fees and get appointment date & time</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">4</div>
                <div>
                  <p className="font-semibold text-gray-900">Visit Office for Verification</p>
                  <p className="text-gray-600 mt-1">Visit registrar office with original documents</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white font-semibold">✓</div>
                <div>
                  <p className="font-semibold text-gray-900">Approval & Certificate Issued</p>
                  <p className="text-gray-600 mt-1">Certificate issued after approval</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ];

    setPopupTitle(service.name);
    setPopupServiceName(service.name);
    setPopupTabs(tabs);
    setActiveTab('document-checklist');
    setPopupVisible(true);
  };

  const handleApply = async (service: ServiceRow) => {
    const query = new URLSearchParams();
    let selectedCaf = '';

    if (service.isCafRequired) {
      selectedCaf = selectedCafForService[service.serviceCode];
      if (!selectedCaf) {
        alert('Please select an approved Application (CAF) from the dropdown first.');
        return;
      }
    }

    if (service.firstPageId) {
      query.set('pageId', String(service.firstPageId));
    }

    if (service.formTypeId) {
      setNavigatingServiceCode(service.serviceCode);
      try {
        const params: Record<string, string | number> = {
          serviceId: service.serviceCode,
          formTypeId: service.formTypeId,
        };
        if (selectedCaf) {
          params.cafId = selectedCaf;
        }

        const editableRes = await apiClient.get('/investor/services/editable', { params });
        const editable = editableRes?.data;
        const editableStatus = String(editable?.status || '').toUpperCase();

        if (editable?.submissionId && ['I', 'DP', 'PD', 'RBI'].includes(editableStatus)) {
          const editQuery = new URLSearchParams();
          editQuery.set('submissionId', String(editable.submissionId));
          editQuery.set('mode', 'edit');
          router.push(`/${locale}/investor/services/${service.serviceCode}/apply/${service.formTypeId}?${editQuery.toString()}`);
          return;
        }

        if (selectedCaf) {
          query.set('cafId', selectedCaf);
        }
        const queryString = query.toString();
        router.push(`/${locale}/investor/services/${service.serviceCode}/apply/${service.formTypeId}${queryString ? `?${queryString}` : ''}`);
      } catch (error) {
        console.error('Unable to resolve editable application', error);
        if (selectedCaf) {
          query.set('cafId', selectedCaf);
        }
        const queryString = query.toString();
        router.push(`/${locale}/investor/services/${service.serviceCode}/apply/${service.formTypeId}${queryString ? `?${queryString}` : ''}`);
      } finally {
        setNavigatingServiceCode(null);
      }
    } else {
      alert('Form not configured for this service.');
    }
  };

  const cafBodyTemplate = (row: ServiceRow) => {
    if (!row.isCafRequired) {
      return (
        <div className="investor-service-cell-center">
          <Tag value="Not Required" severity="success" />
        </div>
      );
    }

    if (approvedCafs.length === 0) {
      return (
        <div className="investor-service-cell-center">
          <Tag value="No Approved CAF" severity="danger" />
        </div>
      );
    }

    return (
      <Dropdown
        value={selectedCafForService[row.serviceCode]}
        options={approvedCafs}
        optionLabel="label"
        optionValue="cafId"
        onChange={(e) => handleCafChange(row.serviceCode, e.value)}
        placeholder="Select Approved CAF"
        className="w-100 investor-service-dropdown investor-service-caf-dropdown"
        style={{ minWidth: 220 }}
        filter
        showClear
        appendTo={typeof window === 'undefined' ? undefined : document.body}
      />
    );
  };

  const actionBodyTemplate = (row: ServiceRow) => (
    <div className="investor-service-cell-center">
      <Button
        label="Apply Now"
        icon="pi pi-arrow-right"
        iconPos="right"
        size="small"
        onClick={() => handleApply(row)}
        loading={navigatingServiceCode === row.serviceCode}
        onMouseEnter={() => {
          if (!row?.formTypeId) return;
          const pageIdParam = row?.firstPageId ? `?pageId=${row.firstPageId}` : '';
          router.prefetch(`/${locale}/investor/services/${row.serviceCode}/apply/${row.formTypeId}${pageIdParam}`);
        }}
        className="investor-service-apply-btn"
      />
    </div>
  );

  const timelineBody = (row: ServiceRow) => (
    <div className="investor-service-cell-center">
      <Tag value={row.timeline || 'Not Specified'} severity="info" />
    </div>
  );

  const MARRIAGE_SERVICE_CODES = new Set(['968.0', '968']);
  const isMarriageService = (row: ServiceRow) => {
    const serviceCode = String(row.serviceCode || '').trim();
    return (
      row.name.toLowerCase().includes('marriage') ||
      MARRIAGE_SERVICE_CODES.has(serviceCode)
    );
  };

  const handleServiceRowClick = (event: any) => {
    if (!event?.data) return;

    const target = event.originalEvent?.target as HTMLElement | null;
    if (
      target?.closest('button') ||
      target?.closest('a') ||
      target?.closest('input') ||
      target?.closest('select')
    ) {
      return;
    }

    if (isMarriageService(event.data)) {
      handleOpenServicePopup(event.data);
    }
  };

  const serviceNameBody = (row: ServiceRow) => (
    <div>
      {isMarriageService(row) ? (
        <button
          type="button"
          className="investor-service-name text-primary underline"
          style={{ cursor: 'pointer' }}
          onClick={() => handleOpenServicePopup(row)}
        >
          {row.name}
        </button>
      ) : (
        <div className="investor-service-name">{row.name}</div>
      )}
      <div className="investor-service-meta">Service ID: {row.serviceCode}</div>
    </div>
  );

  const departmentValueTemplate = (option: { id: number; name: string } | null, props: any) => {
    if (!option) {
      return <span className="investor-service-dropdown-placeholder">{props.placeholder}</span>;
    }

    return (
      <div className="investor-service-dropdown-value">
        <span className="investor-service-dropdown-dot" />
        <span className="investor-service-dropdown-text">{option.name}</span>
      </div>
    );
  };

  const departmentItemTemplate = (option: { id: number; name: string }) => (
    <div className="investor-service-dropdown-option">
      <span className="investor-service-dropdown-dot" />
      <div className="min-w-0">
        <div className="investor-service-dropdown-option-name">{option.name}</div>
        <div className="investor-service-dropdown-option-meta">Department ID: {option.id}</div>
      </div>
    </div>
  );

  return (
    <div className="investor-service-list-page mx-auto max-w-[1400px]">
      <section className="investor-service-hero">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="investor-service-kicker mb-2">Investor Services</p>
            <div className="investor-service-title">{categoryLabel} Services</div>
            <div className="investor-service-muted mt-1">
              Select a department to view available services and apply using the configured form builder form.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="investor-service-pill">
              <i className="pi pi-building" />
              {selectedDept ? `Department #${selectedDept}` : 'Select Department'}
            </span>
            <span className="investor-service-pill">
              <i className="pi pi-list" />
              {services.length} Service{services.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </section>

      <section className="investor-service-filter-panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="investor-service-panel-title">Filter Services</div>
            <div className="investor-service-muted">Choose a department to load services for this category.</div>
          </div>
          <div className="investor-service-muted">
            {approvedCafs.length > 0 ? `${approvedCafs.length} approved CAF(s) available` : 'No approved CAFs found'}
          </div>
        </div>

        <div className="max-w-[560px]">
          <label className="investor-service-label">
            Select Department
          </label>
          <div className="investor-service-dropdown-wrap">
            <Dropdown
              value={selectedDept}
              options={departments}
              optionLabel="name"
              optionValue="id"
              onChange={(e) => setSelectedDept(e.value)}
              placeholder="-- Select Department --"
              filter
              filterBy="name"
              filterPlaceholder="Search department name..."
              showClear
              appendTo={typeof window === 'undefined' ? undefined : document.body}
              className="w-100 investor-service-dropdown"
              panelClassName="investor-service-dropdown-panel"
              itemTemplate={departmentItemTemplate}
              valueTemplate={departmentValueTemplate}
            />
          </div>
          <div className="investor-service-dropdown-help">
            {selectedDept && selectedDepartmentName
              ? `Selected: ${selectedDepartmentName}`
              : `${departments.length} department${departments.length === 1 ? '' : 's'} available`}
          </div>
        </div>
      </section>

      <section className="investor-service-table-shell">
        <div className="investor-service-table-header">
          <div>
            <h3 className="mb-1">Available Services</h3>
            <p className="mb-0">
              {selectedDept ? `Showing services for ${categoryLabel}` : 'Select a department to begin'}
            </p>
          </div>
          <Tag
            value={loading ? 'Loading...' : `${services.length} result${services.length === 1 ? '' : 's'}`}
            severity="danger"
          />
        </div>

        <DataTable
          value={services}
          loading={loading}
          emptyMessage={selectedDept ? 'No services found for this department.' : 'Select a department to load services.'}
          stripedRows
          showGridlines={false}
          responsiveLayout="scroll"
          className="investor-service-table"
          onRowClick={handleServiceRowClick}
          rowClassName={(data) => (isMarriageService(data) ? 'cursor-pointer' : '')}
        >
          <Column field="serviceCode" header="Service ID" style={{ width: '120px' }} />
          <Column header="Service Name" body={serviceNameBody} />
          <Column header="Timeline" body={timelineBody} style={{ width: '150px' }} />
          <Column header="CAF" body={cafBodyTemplate} style={{ width: '280px' }} />
          <Column header="Action" body={actionBodyTemplate} style={{ width: '170px', textAlign: 'center' }} />
        </DataTable>

        <UnifiedServicePopup
          visible={popupVisible}
          onHide={() => setPopupVisible(false)}
          title={popupTitle}
          serviceName={popupServiceName}
          tabs={popupTabs}
          defaultTab={activeTab}
          size="large"
        />
      </section>

      <style jsx global>{`
        .investor-service-list-page {
          display: grid;
          gap: 1rem;
        }

        .investor-service-hero {
          border: 1px solid #f2d6d6;
          border-radius: 20px;
          background: radial-gradient(circle at top left, #fff1f2 0%, #ffffff 58%);
          box-shadow: 0 10px 26px rgba(233, 9, 12, 0.06);
          padding: 1rem 1.1rem;
        }

        .investor-service-kicker {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #e9090c;
        }

        .investor-service-title {
          font-size: 1.35rem;
          line-height: 1.2;
          font-weight: 700;
          color: #111827;
        }

        .investor-service-muted {
          color: #64748b;
          font-size: 0.82rem;
          line-height: 1.45;
        }

        .investor-service-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.42rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #f0d4d4;
          background: #fff;
          color: #7f1d1d;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .investor-service-pill .pi {
          font-size: 0.75rem;
        }

        .investor-service-filter-panel,
        .investor-service-table-shell {
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
          padding: 0.95rem;
        }

        .investor-service-panel-title {
          font-weight: 700;
          color: #111827;
        }

        .investor-service-label {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
        }

        .investor-service-dropdown.p-dropdown {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #cfd8e3;
          min-height: 44px;
          box-shadow: none;
          background: #fff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .investor-service-dropdown.p-dropdown:not(.p-disabled):hover {
          border-color: #e2a8af;
        }

        .investor-service-dropdown.p-dropdown.p-focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.12);
        }

        .investor-service-dropdown-wrap {
          position: relative;
        }

        .investor-service-dropdown-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          pointer-events: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .investor-service-dropdown .p-dropdown-label {
          padding: 0.65rem 0.75rem;
          display: flex;
          align-items: center;
          color: #111827;
          font-size: 0.88rem;
        }

        .investor-service-dropdown .p-dropdown-trigger {
          width: 2.4rem;
          color: #64748b;
        }

        .investor-service-dropdown-placeholder {
          color: #94a3b8;
          font-size: 0.84rem;
        }

        .investor-service-dropdown-value {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-width: 0;
        }

        .investor-service-dropdown-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 600;
          color: #1f2937;
        }

        .investor-service-dropdown-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.12);
          flex: 0 0 auto;
        }

        .investor-service-dropdown-help {
          margin-top: 0.45rem;
          font-size: 0.76rem;
          color: #64748b;
        }

        .investor-service-dropdown-panel.p-dropdown-panel {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
          overflow: hidden;
        }

        .investor-service-dropdown-panel .p-dropdown-header {
          background: #fff7f7;
          border-bottom: 1px solid #f2dede;
          padding: 0.6rem;
        }

        .investor-service-dropdown-panel .p-dropdown-filter {
          border-radius: 10px;
          border: 1px solid #d1d5db;
          min-height: 38px;
          box-shadow: none;
        }

        .investor-service-dropdown-panel .p-dropdown-filter:focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.1);
        }

        .investor-service-dropdown-panel .p-dropdown-items {
          padding: 0.35rem;
        }

        .investor-service-dropdown-panel .p-dropdown-item {
          border-radius: 10px;
          margin-bottom: 0.15rem;
          padding: 0.5rem 0.6rem;
        }

        .investor-service-dropdown-panel .p-dropdown-item.p-highlight {
          background: #fff1f2;
          color: #7f1d1d;
        }

        .investor-service-dropdown-panel .p-dropdown-item:not(.p-highlight):not(.p-disabled):hover {
          background: #f8fafc;
        }

        .investor-service-dropdown-option {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          min-width: 0;
        }

        .investor-service-dropdown-option-name {
          font-size: 0.84rem;
          font-weight: 600;
          color: #111827;
          line-height: 1.3;
          word-break: break-word;
        }

        .investor-service-dropdown-option-meta {
          font-size: 0.72rem;
          color: #6b7280;
          margin-top: 0.1rem;
        }

        .investor-service-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 0.8rem;
        }

        .investor-service-table-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
        }

        .investor-service-table-header p {
          color: #64748b;
          font-size: 0.82rem;
        }

        .investor-service-table-header .p-tag {
          border-radius: 999px;
          background: #fff1f2;
          color: #7f1d1d;
          border: 1px solid #f2c7cc;
          font-weight: 700;
          padding: 0.35rem 0.7rem;
        }

        .investor-service-table .p-datatable-wrapper {
          border: 1px solid #eef0f3;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }

        .investor-service-table .p-datatable-thead > tr > th {
          background: #fff7f7;
          color: #7f1d1d;
          font-weight: 700;
          border-color: #f1dede;
          padding: 0.9rem 0.85rem;
          white-space: nowrap;
          font-size: 0.9rem;
        }

        .investor-service-table .p-datatable-tbody > tr > td {
          border-color: #eef0f3;
          padding: 0.95rem 0.85rem;
          vertical-align: top;
          background: #fff;
        }

        .investor-service-table .p-datatable-tbody > tr:hover > td {
          background: #fffafa;
        }

        .investor-service-table .p-datatable-tbody > tr:nth-child(even) > td {
          background: #fcfcfd;
        }

        .investor-service-table .p-datatable-tbody > tr:nth-child(even):hover > td {
          background: #fff7f7;
        }

        .investor-service-table .p-datatable-emptymessage > td {
          padding: 1.1rem 0.9rem;
          color: #64748b;
          font-size: 0.88rem;
          text-align: center;
          background: #fff;
        }

        .investor-service-table .p-datatable-tbody > tr > td:last-child {
          vertical-align: middle;
        }

        .investor-service-table .p-column-title {
          font-weight: 700;
        }

        .investor-service-name {
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.2rem;
          font-size: 0.98rem;
          line-height: 1.45;
          max-width: 780px;
        }

        .investor-service-meta {
          color: #64748b;
          font-size: 0.78rem;
        }

        .investor-service-table .p-dropdown {
          border-radius: 10px;
          min-height: 38px;
          border: 1px solid #d1d5db;
          box-shadow: none;
          background: #fff;
        }

        .investor-service-table .p-dropdown:not(.p-disabled):hover {
          border-color: #e5b8b9;
        }

        .investor-service-table .p-dropdown.p-focus {
          border-color: #e9090c;
          box-shadow: 0 0 0 3px rgba(233, 9, 12, 0.1);
        }

        .investor-service-table .p-dropdown .p-dropdown-label {
          font-size: 0.82rem;
          padding: 0.45rem 0.65rem;
        }

        .investor-service-table .p-dropdown .p-dropdown-trigger {
          width: 2rem;
          color: #64748b;
        }

        .investor-service-apply-btn.p-button {
          border-radius: 999px;
          background: #e9090c;
          border-color: #e9090c;
          color: #fff;
          font-weight: 700;
          min-height: 36px;
          padding: 0.35rem 0.8rem;
          box-shadow: 0 8px 18px rgba(233, 9, 12, 0.18);
        }

        .investor-service-apply-btn.p-button:not(:disabled):hover {
          background: #c80a0d;
          border-color: #c80a0d;
        }

        .investor-service-apply-btn.p-button .p-button-label {
          white-space: nowrap;
          color: #fff;
        }

        .investor-service-apply-btn.p-button .p-button-icon {
          color: #fff;
          font-size: 0.8rem;
        }

        .investor-service-table .p-tag {
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.72rem;
          line-height: 1;
          padding: 0.3rem 0.5rem;
        }

        .investor-service-table .p-tag.p-tag-info {
          background: #e0f2fe;
          color: #075985;
          border: 1px solid #bae6fd;
        }

        .investor-service-table .p-tag.p-tag-success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .investor-service-table .p-tag.p-tag-danger {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        @media (max-width: 640px) {
          .investor-service-hero,
          .investor-service-filter-panel,
          .investor-service-table-shell {
            padding: 0.8rem;
            border-radius: 16px;
          }

          .investor-service-title {
            font-size: 1.15rem;
          }

          .investor-service-apply-btn.p-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
