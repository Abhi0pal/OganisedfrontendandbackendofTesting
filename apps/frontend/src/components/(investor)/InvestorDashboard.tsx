'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Modal from '@/components/common/Modal';
import InprincipleNewProjectModal from './inprinciple/InprincipleNewProjectModal';
import { InprincipleApplicationList } from './inprinciple/applicationcomponent';
import { PopupTabContent } from '@/components/popups/UnifiedServicePopup';

export const InvestorDashboard = () => {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [showNewProject, setShowNewProject] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [applicationCount, setApplicationCount] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTabs, setPopupTabs] = useState<PopupTabContent[]>([]);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupServiceName, setPopupServiceName] = useState('');
  const [activeTab, setActiveTab] = useState('document-checklist');

  useEffect(() => {
    // One-time defensive cleanup. Continuous cleanup is handled at layout level.
    if (typeof document === 'undefined') return;
    document.querySelectorAll('.modal-backdrop').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.display = 'none';
      el.style.pointerEvents = 'none';
    });
    document.body.classList.remove('modal-open');
    if (document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    if (document.body.style.paddingRight) document.body.style.paddingRight = '';
  }, []);

  useEffect(() => {
    if (!isRouting) return;
    const id = window.setTimeout(() => setIsRouting(false), 8000);
    return () => window.clearTimeout(id);
  }, [isRouting]);

  const handleOpenMarriageChecklist = () => {
    const tabs: PopupTabContent[] = [
      {
        id: 'document-checklist',
        label: 'Document Checklist',
        icon: 'bi bi-file-earmark-check',
        content: (
          <div className="max-h-[500px] overflow-y-auto space-y-6 pr-4 text-gray-800">

            <div>
              <p className="text-lg font-bold text-gray-900">
                1. Memorandum of Marriage
              </p>
              <p className="text-base mt-1">
                • Form D details are correctly entered
              </p>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">
                2. Proof of Age (Attested photocopy of any one)
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>School / College Leaving Certificate</li>
                <li>Birth Certificate</li>
                <li>Passport</li>
                <li>Domicile Certificate</li>
                <li>SSC / HSC Certificate</li>
              </ul>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">
                3. Proof of Residence (Attested photocopy of any one)
              </p>
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
              <p className="text-lg font-bold text-gray-900">
                4. Registered Address Proof of Witnesses
              </p>
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
              <p className="text-lg font-bold text-gray-900">
                5. Wedding Card Proof
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1 text-base">
                <li>Marriage Invitation Card</li>
                <li>₹100/- General Stamp Paper (if invitation card is not available)</li>
              </ul>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">
                6. Photographs & Declarations
              </p>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Fill Application Form</p>
                  <p className="text-gray-600 mt-1">
                    Fill the Marriage Application Form and complete document checklist
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Submit & Get Registration Number
                  </p>
                  <p className="text-gray-600 mt-1">
                    Registration number generated after submission
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Make Online Payment</p>
                  <p className="text-gray-600 mt-1">
                    Pay scrutiny fees and get appointment date & time
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                  4
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Visit Office for Verification
                  </p>
                  <p className="text-gray-600 mt-1">
                    Visit registrar office with original documents
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white font-semibold">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    Approval & Certificate Issued
                  </p>
                  <p className="text-gray-600 mt-1">
                    Certificate issued after approval
                  </p>
                </div>
              </div>

            </div>
          </div>
        ),
      },
    ];

    setPopupTitle('Marriage Registration Information');
    setPopupServiceName('Marriage Registration');
    setPopupTabs(tabs);
    setActiveTab('document-checklist');
    setPopupVisible(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Welcome to Applicant Monitoring Panel</h1>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold">
              {applicationCount}
            </span>
            <span className="text-sm font-medium">Active Projects</span>
          </div>

          <button
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition"
            onClick={() => setShowNewProject(true)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 24C8.8174 24 5.76516 22.7357 3.51472 20.4853C1.26428 18.2348 0 15.1826 0 12C0 8.8174 1.26428 5.76516 3.51472 3.51472C5.76516 1.26428 8.8174 0 12 0C15.1826 0 18.2348 1.26428 20.4853 3.51472C22.7357 5.76516 24 8.8174 24 12C24 15.1826 22.7357 18.2348 20.4853 20.4853C18.2348 22.7357 15.1826 24 12 24ZM12 21.6C14.5461 21.6 16.9879 20.5886 18.7882 18.7882C20.5886 16.9879 21.6 14.5461 21.6 12C21.6 9.45392 20.5886 7.01212 18.7882 5.21178C16.9879 3.41143 14.5461 2.4 12 2.4C9.45392 2.4 7.01212 3.41143 5.21178 5.21178C3.41143 7.01212 2.4 9.45392 2.4 12C2.4 14.5461 3.41143 16.9879 5.21178 18.7882C7.01212 20.5886 9.45392 21.6 12 21.6ZM13.2 10.8H15.6C15.9183 10.8 16.2235 10.9264 16.4485 11.1515C16.6736 11.3765 16.8 11.6817 16.8 12C16.8 12.3183 16.6736 12.6235 16.4485 12.8485C16.2235 13.0736 15.9183 13.2 15.6 13.2H13.2V15.6C13.2 15.9183 13.0736 16.2235 12.8485 16.4485C12.6235 16.6736 12.3183 16.8 12 16.8C11.6817 16.8 11.3765 16.6736 11.1515 16.4485C10.9264 16.2235 10.8 15.9183 10.8 15.6V13.2H8.4C8.08174 13.2 7.77652 13.0736 7.55147 12.8485C7.32643 12.6235 7.2 12.3183 7.2 12C7.2 11.6817 7.32643 11.3765 7.55147 11.1515C7.77652 10.9264 8.08174 10.8 8.4 10.8H10.8V8.4C10.8 8.08174 10.9264 7.77652 11.1515 7.55147C11.3765 7.32643 11.6817 7.2 12 7.2C12.3183 7.2 12.6235 7.32643 12.8485 7.55147C13.0736 7.77652 13.2 8.08174 13.2 8.4V10.8Z" fill="white" />
            </svg>
            Add Project
          </button>
        </div>

        <div className="mt-10">
          <InprincipleApplicationList
            serviceId="943.0"
            onCountChange={setApplicationCount}
            onServiceClick={(serviceName) => {
              if (serviceName.toLowerCase().includes('marriage')) {
                handleOpenMarriageChecklist();
              }
            }}
          />
        </div>

        <InprincipleNewProjectModal
          isOpen={showNewProject}
          onClose={() => setShowNewProject(false)}
          onProceed={({ proposalType, serviceId, departmentId }) => {
            setShowNewProject(false);
            setIsRouting(true);
            const params = new URLSearchParams({ proposal: proposalType, departmentId });
            if (serviceId) {
              params.set('serviceId', serviceId);
            }
            router.push(`/${locale}/investor/inprinciple/new?${params.toString()}`);
          }}
        />

        {/* Unified Service Popup with Radio Buttons */}
        {popupVisible && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex flex-col gap-2 border-b px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{popupTitle}</h2>
                  <p className="text-sm text-slate-600">{popupServiceName}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setPopupVisible(false)}
                  aria-label="Close popup"
                >
                  <span className="text-2xl leading-none">×</span>
                </button>
              </div>

              <div className="border-b px-6 py-4">
                <div className="flex flex-wrap gap-3">
                  {popupTabs.map((tab) => (
                    <div key={tab.id} className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="investorPopupTab"
                        id={`tab-${tab.id}`}
                        value={tab.id}
                        checked={activeTab === tab.id}
                        onChange={(e) => setActiveTab(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor={`tab-${tab.id}`}>
                        {tab.icon && <i className={`${tab.icon} me-2`}></i>}
                        <span className="fw-semibold">{tab.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {popupTabs.find((tab) => tab.id === activeTab)?.content}
              </div>
            </div>
          </div>
        )}

        {isRouting && (
          <div className="investor-route-loader pointer-events-none">
            <div className="investor-route-loader-track">
              <img
                src="https://investuttarakhand.uk.gov.in/themes/new_investuk/img/logo-invest-uttarakhand.png"
                alt="Invest Uttarakhand"
                className="investor-route-loader-logo"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
