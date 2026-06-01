'use client';

import React, { useMemo, useState } from 'react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (payload: {
    proposalType: 'new' | 'expansion' | 'modernisation' | 'diversification' | 'amendment';
    serviceId?: string;
    departmentId: string;
  }) => void;
}

export default function InprincipleNewProjectModal({ isOpen, onClose, onProceed }: NewProjectModalProps) {
  const [applyAs, setApplyAs] = useState<'new' | 'existing' | ''>('');
  const [applyFor, setApplyFor] = useState<'new' | 'expansion' | 'modernisation' | 'diversification' | 'amendment' | ''>('');

  const serviceIdByProposal: Record<string, string> = {
    new: '943.0',
    expansion: '943.0',
    modernisation: '943.0',
    diversification: '943.0',
    amendment: '943.0',
  };

  const canProceed = useMemo(() => {
    if (!applyAs) return false;
    if (applyAs === 'existing') return Boolean(applyFor);
    return true;
  }, [applyAs, applyFor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-5xl rounded-[22px] bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Project</h2>
            <p className="mt-1 text-sm text-gray-500">Select your application type before proceeding.</p>
          </div>
          <button onClick={onClose} className="text-[#f05a28] hover:text-[#d84a1e]" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-gray-200 p-2">
            <h3 className="text-base font-semibold text-gray-800">Apply as</h3>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="applyAs"
                  value="new"
                  checked={applyAs === 'new'}
                  onChange={() => {
                    setApplyAs('new');
                    setApplyFor('');
                  }}
                  className="h-4 w-4 accent-red-500 m-1"
                />
                New Investor
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="radio"
                  name="applyAs"
                  value="existing"
                  checked={applyAs === 'existing'}
                  onChange={() => setApplyAs('existing')}
                  className="h-4 w-4 accent-red-500 m-1"
                />
                Existing Investor
              </label>
            </div>
          </div>

          {applyAs === 'existing' && (
            <div className="rounded-2xl border border-gray-200 p-2">
              <h3 className="text-base font-semibold text-gray-800">Applying For</h3>
              <div className="mt-4 flex flex-wrap gap-5">
                {[
                  { label: 'New project', value: 'new' },
                  { label: 'Expansion', value: 'expansion' },
                  { label: 'Modernisation', value: 'modernisation' },
                  { label: 'Diversification', value: 'diversification' },
                  { label: 'Amendment', value: 'amendment' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-3 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="applyFor"
                      value={item.value}
                      checked={applyFor === item.value}
                      onChange={() =>
                        setApplyFor(
                          item.value as 'new' | 'expansion' | 'modernisation' | 'diversification' | 'amendment',
                        )
                      }
                      className="h-4 w-4 accent-red-500 m-1"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold text-gray-800">Instructions & Guidelines for CAF applications</h3>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid bg-[#4a4a4a] text-sm font-semibold text-white sm:grid-cols-2">
              <div className="px-4 py-3">Pre Requisites</div>
              <div className="border-t border-white/20 px-4 py-3 sm:border-t-0 sm:border-l">Documents</div>
            </div>
            <div className="grid gap-6 bg-white px-6 py-4 text-sm text-gray-600 sm:grid-cols-2">
              <ul className="list-disc space-y-2 pl-4">
                <li>Have a valid/active PAN in the name of the entity/proprietor.</li>
                <li>Register as an investor and log in to the Single Window System.</li>
                <li>
                  Use a valid Digital Signature Certificate (DSC) or Aadhaar-based e-sign to affix the signature of the
                  authorized signatory on the CAF.
                </li>
                <li>Be ready with necessary documents to be submitted along with the CAF.</li>
              </ul>
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  In-principle approval process document, fee details, list of documents to be attached, and
                  constitution of various clearance committees <a className="text-blue-600 underline">(attach)</a>.
                </li>
                <li>
                  Blank CAF <a className="text-blue-600 underline">(attach)</a>.
                </li>
                <li>
                  DPR template for MSMEs <a className="text-blue-600 underline">(attach)</a>.
                </li>
                <li>
                  DPR template for Large, Mega, Ultra-Mega & Super-Mega enterprises{' '}
                  <a className="text-blue-600 underline">(attach)</a>.
                </li>
                <li>
                  User guide for filling the CAF <a className="text-blue-600 underline">(attach)</a>.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            className="rounded-full bg-[#e11d2e] px-7 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={!canProceed}
            onClick={() => {
              const proposalType = applyAs === 'existing' && applyFor ? applyFor : 'new';
              onProceed({
                proposalType,
                serviceId: serviceIdByProposal[proposalType] || undefined,
                departmentId: '1',
              });
            }}
          >
            I Understand !
          </button>
        </div>
      </div>
    </div>
  );
}
