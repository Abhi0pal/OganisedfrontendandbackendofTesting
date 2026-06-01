'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import StepIndicator from '@/components/(investor)/inprinciple/formcomponent/StepIndicator';
import type { FormStepConfig } from '@/components/(investor)/inprinciple/formcomponent/types';

type FeeRow = {
  sno: number;
  department: string;
  service: string;
  condition: string;
  fee: number;
};

export default function UnifiedApplicationPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submissionId = searchParams?.get('submissionId') || '--';

  const [plotArea, setPlotArea] = useState('1000');
  const [firePreEstablishment, setFirePreEstablishment] = useState('Yes');
  const [waterConnection, setWaterConnection] = useState('Yes');
  const [upclConnection, setUpclConnection] = useState('LT Connection');
  const [industryCategory, setIndustryCategory] = useState('GreenCategory');
  const [capitalInvestmentRange, setCapitalInvestmentRange] = useState('Above 10,000 Cr');
  const [hazardousWaste, setHazardousWaste] = useState('Less Than 5 Cr');
  const [letterOfDistance, setLetterOfDistance] = useState('Yes');
  const [supplyVoltage, setSupplyVoltage] = useState('Less than 75 kW');
  const [labourPreEstablishment, setLabourPreEstablishment] = useState('Yes');

  const rows: FeeRow[] = useMemo(() => {
    const sidadFee =
      Number(plotArea) <= 500 ? 500 : Number(plotArea) <= 2000 ? 1000 : Number(plotArea) <= 4000 ? 2000 : 3000;

    const fireFee = firePreEstablishment === 'Yes' ? 0 : 0;
    const labourFee = labourPreEstablishment === 'Yes' ? 0 : 0;
    const ujsFee = waterConnection === 'Yes' ? 25 : 0;
    const upclFee = upclConnection === 'LT Connection' ? 1500 : 7500;
    const forestFee = letterOfDistance === 'Yes' ? 1500 : 0;
    const pollutionFee = hazardousWaste === 'Less Than 5 Cr' ? 5000 : 10000;

    return [
      { sno: 1, department: 'SIDA', service: 'Map Approval + Transport & Communication', condition: `Plot Area: ${plotArea} sqmt`, fee: sidadFee },
      { sno: 2, department: 'Fire', service: 'Fire Pre-Establishment', condition: `Selected: ${firePreEstablishment}`, fee: fireFee },
      { sno: 3, department: 'Labour', service: 'Labour Pre-Establishment', condition: `Selected: ${labourPreEstablishment}`, fee: labourFee },
      { sno: 4, department: 'UJS', service: 'New Water Connection', condition: waterConnection, fee: ujsFee },
      { sno: 5, department: 'UPCL', service: upclConnection, condition: `Supply Voltage: ${supplyVoltage}`, fee: upclFee },
      { sno: 6, department: 'Forest Dept', service: 'Letter of Distance', condition: `Selected: ${letterOfDistance}`, fee: forestFee },
      { sno: 7, department: 'Pollution Department', service: 'Consent to Establish (Hazardous Waste)', condition: `Hazardous Waste: ${hazardousWaste}`, fee: pollutionFee },
    ];
  }, [
    capitalInvestmentRange,
    firePreEstablishment,
    hazardousWaste,
    labourPreEstablishment,
    letterOfDistance,
    plotArea,
    supplyVoltage,
    upclConnection,
    waterConnection,
    industryCategory,
  ]);

  const total = rows.reduce((sum, row) => sum + row.fee, 0);
  const steps: FormStepConfig[] = [
    { id: 'step-1', title: 'Basic Information', sections: [] },
    { id: 'step-2', title: 'Location & Unit', sections: [] },
    { id: 'step-3', title: 'Utility & Compliance', sections: [] },
    { id: 'step-4', title: 'Pollution & Safety', sections: [] },
    { id: 'step-5', title: 'Documents & Declaration', sections: [] },
    { id: 'step-6', title: 'Payment', sections: [] },
  ];
  const activeStepIndex = 5;

  return (
    <div className="max-w mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-[320px] lg:shrink-0">
          <StepIndicator
            steps={steps}
            currentStep={activeStepIndex}
            completedSteps={[0, 1, 2, 3, 4]}
            allowNavigation={true}
            onStepClick={(step) => {
              if (step === activeStepIndex) return;
              router.push(
                `/investor/departmentservice/unifiedapplication?submissionId=${submissionId}&step=${step}`
              );
            }}
          />
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="bg-[#e9090c] px-3 py-2 text-sm font-semibold text-white rounded-t-md">
          Application Fee Filters (Submission ID: {submissionId})
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 border border-gray-200 border-t-0 rounded-b-md">
          <div>
            <label className="mb-1 block text-sm">Map Approval: Plot Area (sqmt)</label>
            <input value={plotArea} onChange={(e) => setPlotArea(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Fire - Pre Establishment</label>
            <select value={firePreEstablishment} onChange={(e) => setFirePreEstablishment(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">New Water Connection</label>
            <select value={waterConnection} onChange={(e) => setWaterConnection(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">UPCL Connection</label>
            <select value={upclConnection} onChange={(e) => setUpclConnection(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>LT Connection</option>
              <option>HT Connection</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Industry Category</label>
            <select value={industryCategory} onChange={(e) => setIndustryCategory(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>GreenCategory</option>
              <option>OrangeCategory</option>
              <option>RedCategory</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Capital Investment Range</label>
            <select value={capitalInvestmentRange} onChange={(e) => setCapitalInvestmentRange(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Above 10,000 Cr</option>
              <option>Less than 10,000 Cr</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Hazardous Waste Authorization</label>
            <select value={hazardousWaste} onChange={(e) => setHazardousWaste(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Less Than 5 Cr</option>
              <option>Above 5 Cr</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Letter of Distance</label>
            <select value={letterOfDistance} onChange={(e) => setLetterOfDistance(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Supply Voltage</label>
            <select value={supplyVoltage} onChange={(e) => setSupplyVoltage(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Less than 75 kW</option>
              <option>11 KVA</option>
              <option>33 KVA</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">Labour - Pre Establishment</label>
            <select value={labourPreEstablishment} onChange={(e) => setLabourPreEstablishment(e.target.value)} className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>

        <div className="px-0 pt-6">
          <div className="rounded-md border border-gray-300">
            <div className="bg-[#e9090c] px-3 py-2 text-sm font-semibold text-white">Fee Summary</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f8f8f8]">
                  <tr>
                    <th className="border px-3 py-2 text-left">S.No</th>
                    <th className="border px-3 py-2 text-left">Department</th>
                    <th className="border px-3 py-2 text-left">Service</th>
                    <th className="border px-3 py-2 text-left">Condition</th>
                    <th className="border px-3 py-2 text-left">Fee (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sno}>
                      <td className="border px-3 py-2">{row.sno}</td>
                      <td className="border px-3 py-2">{row.department}</td>
                      <td className="border px-3 py-2">{row.service}</td>
                      <td className="border px-3 py-2">{row.condition}</td>
                      <td className="border px-3 py-2">{row.fee}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="border px-3 py-2" colSpan={4}>Total</td>
                    <td className="border px-3 py-2">{total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              className="px-6 py-2.5 text-gray-700 bg-gray-100 border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-gray-200"
              onClick={() =>
                router.push(
                  `/investor/departmentservice/unifiedapplication?submissionId=${submissionId}&step=4`
                )
              }
            >
              ← Previous
            </button>
            <button
              type="button"
              className="rounded bg-[#1aa3c8] px-5 py-2 text-sm font-medium text-white hover:bg-[#1188a8]"
              onClick={() => window.alert('Pay Now integration is under development.')}
            >
              Pay Now
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
