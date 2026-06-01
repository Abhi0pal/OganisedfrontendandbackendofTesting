'use client';

import { useEffect, useMemo, useState } from 'react';
import { useProjectStatus } from '@/hooks/master/useProjectStatus';
import { useLandCategories } from '@/hooks/master/useLandCategories';
import { useLandAllotmentStage } from '@/hooks/master/useLandAllotmentStage';
import { useProjectStatusCafOptions } from '@/hooks/investor/useProjectStatusCafOptions';
import { CURRENT_STATUS_OPTIONS } from '@/constants/constant';
import apiClient from '@/lib/api-client';

type Option = { label: string; value: string };

export default function ProjectStatusPage() {
  const {
    data: projectStatusCafData,
    isLoading: isCafLoading,
    isError: isCafError,
  } = useProjectStatusCafOptions();
  const cafOptions: Option[] = (projectStatusCafData ?? []).map((item) => ({
    label: item.label || `${item.unitName || 'CAF'} - ${item.submissionId}`,
    value: String(item.submissionId),
  }));

  const statusOptions: Option[] = [
    { label: 'Implemented', value: 'Implemented' },
    { label: 'Under Implementation', value: 'Under Implementation' },
    { label: 'Dropped', value: 'Dropped' },
  ];

  const { data: landCategoryData } = useLandCategories({ isActive: true });
  const landTypeOptions: Option[] = (landCategoryData ?? []).map((item: { id: number; name: string }) => ({
    label: item.name,
    value: String(item.id),
  }));
  landTypeOptions.sort((a, b) => a.label.localeCompare(b.label));

  const sidculLandCategoryId =
    (landCategoryData ?? []).find(
      (item: { id: number; name: string }) => item.name.toLowerCase() === 'sidcul'
    )?.id ?? null;

  const { data: landAllotmentStageData } = useLandAllotmentStage({ isActive: true });
  const landAllotmentStageOptions: Option[] = (landAllotmentStageData ?? []).map(
    (item: { id: number; name: string }) => ({
      label: item.name,
      value: item.name,
    })
  );
  landAllotmentStageOptions.sort((a, b) => a.label.localeCompare(b.label));

  const { data: projectStatusData } = useProjectStatus({ isActive: true });
  const projectStatusOptions: Option[] = (projectStatusData ?? []).map((item: { id: number; name: string }) => ({
    label: item.name,
    value: item.name,
  }));
  projectStatusOptions.sort((a, b) => a.label.localeCompare(b.label));

  const initialFormData = {
    caf: '',
    lastApprovalStatus: '',
    trialProduction: '',
    categoryA: '',
    categoryB: '',
    categoryC: '',
    categoryD: '',
    male: '',
    female: '',
    others: '',
    totalEmployment: '',
    commercialCommencementDate: '',
    landType: '',
    landAllotmentStage: '',
    projectStatus: '',
    currentStatus: '',
    notImplementationReason: '',
    droppedWithdrawnRemarks: '',
    remarks: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const totalEmploymentValue = useMemo(() => {
    const toNumber = (value: string) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };
    return toNumber(formData.male) + toNumber(formData.female) + toNumber(formData.others);
  }, [formData.male, formData.female, formData.others]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');
    try {
      await apiClient.post('/investor/project-status-update', {
        cafId: Number(formData.caf) || 0,
        lastApprovalStatus: formData.lastApprovalStatus,
        trialProduction: formData.trialProduction,
        categoryA: formData.categoryA,
        categoryB: formData.categoryB,
        categoryC: formData.categoryC,
        categoryD: formData.categoryD,
        male: formData.male,
        female: formData.female,
        others: formData.others,
        totalEmployment: String(totalEmploymentValue),
        commercialCommencementDate: formData.commercialCommencementDate || undefined,
        landType: formData.landType,
        landAllotmentStage: formData.landAllotmentStage,
        projectStatus: formData.projectStatus,
        currentStatus: formData.currentStatus,
        notImplementationReason: formData.notImplementationReason,
        droppedWithdrawnRemarks: formData.droppedWithdrawnRemarks,
        remarks: formData.remarks,
      });
      setSubmitMessage('Project status updated successfully.');
      setFormData(initialFormData);
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || 'Failed to submit project status update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!submitMessage && !submitError) return;
    const timer = setTimeout(() => {
      setSubmitMessage('');
      setSubmitError('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [submitMessage, submitError]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w mx-auto">
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      )}
      {submitMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-md bg-green-600 text-white px-4 py-3 shadow-lg">
          {submitMessage}
        </div>
      )}
      {submitError && (
        <div className="fixed top-6 right-6 z-50 rounded-md bg-red-600 text-white px-4 py-3 shadow-lg">
          {submitError}
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-6 pb-3 flex items-center gap-2">
            Project Status Update
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
              <label className="block mb-1 font-semibold">CAF</label>
              <select
                name="caf"
                value={formData.caf}
                onChange={handleChange}
                disabled={isCafLoading}
                className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
              >
                <option value="">
                  {isCafLoading
                    ? 'Loading CAF...'
                    : isCafError
                      ? 'Unable to load CAF'
                      : cafOptions.length
                        ? 'Select CAF...'
                        : 'No approved CAF found'}
                </option>
                {cafOptions.map((caf) => (
                  <option key={caf.value} value={caf.value}>
                    {caf.label}
                  </option>
                ))}
              </select>
              </div>

              <div>
              <label className="block mb-1 font-semibold">Status of the Last Approval</label>
              <select
                name="lastApprovalStatus"
                value={formData.lastApprovalStatus}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
              >
                <option value="">Select...</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              </div>
            </div>

            {formData.lastApprovalStatus !== 'Under Implementation' && formData.lastApprovalStatus !== 'Dropped' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Brief on Trial/Commercial Production</label>
                    <textarea
                      name="trialProduction"
                      value={formData.trialProduction}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                      rows={6}
                    />
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold mb-3">Category-wise Employment</h4>
                    <div className="overflow-x-auto rounded-md border border-gray-200">
                      <table className="min-w-full bg-white">
                        <thead className="bg-[#f8f8f8]">
                          <tr>
                            <th className="px-4 py-3 border text-left">Category</th>
                            <th className="px-4 py-3 border text-left">Total Employees</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-4 py-3 border">Category A</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryA"
                                value={formData.categoryA}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category B</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryB"
                                value={formData.categoryB}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category C</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryC"
                                value={formData.categoryC}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 border">Category D</td>
                            <td className="px-4 py-3 border">
                              <input
                                type="text"
                                name="categoryD"
                                value={formData.categoryD}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold mb-3">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold">Male</label>
                      <input
                        type="text"
                        name="male"
                        value={formData.male}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Female</label>
                      <input
                        type="text"
                        name="female"
                        value={formData.female}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Others</label>
                      <input
                        type="text"
                        name="others"
                        value={formData.others}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold">Total Employment</label>
                      <input
                        type="text"
                        name="totalEmployment"
                        value={totalEmploymentValue}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Date of Commercial Commencement</label>
                    <input
                      type="date"
                      name="commercialCommencementDate"
                      value={formData.commercialCommencementDate}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    />
                  </div>
                </div>
              </>
            )}

            {formData.lastApprovalStatus === 'Under Implementation' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Land Type</label>
                    <select
                      name="landType"
                      value={formData.landType}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select Land Type</option>
                      {landTypeOptions.map((landType) => (
                        <option key={landType.value} value={landType.value}>
                          {landType.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {sidculLandCategoryId && formData.landType === String(sidculLandCategoryId) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1 font-semibold">Land Allotment Stage</label>
                      <select
                        name="landAllotmentStage"
                        value={formData.landAllotmentStage}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                      >
                        <option value="">Select Allotment Stage</option>
                        {landAllotmentStageOptions.map((stage) => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Project status</label>
                    <select
                      name="projectStatus"
                      value={formData.projectStatus}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select Status</option>
                      {projectStatusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.landType &&
                    formData.landType !== '7' &&
                    (!sidculLandCategoryId || formData.landType !== String(sidculLandCategoryId)) && (
                    <div>
                      <label className="block mb-1 font-semibold">Current Status</label>
                      <select
                        name="currentStatus"
                        value={formData.currentStatus}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                      >
                        <option value="">Select Status</option>
                        {CURRENT_STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {formData.lastApprovalStatus === 'Dropped' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-semibold">Not Implementation Reason</label>
                    <select
                      name="notImplementationReason"
                      value={formData.notImplementationReason}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c] text-gray-900 bg-white"
                    >
                      <option value="">Select a reason</option>
                      <option value="Dropped by Investor">Dropped by Investor</option>
                      <option value="Withdrawn by the Government">Withdrawn by the Government</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Brief remarks on Dropped or Withdrawn</label>
                  <textarea
                    name="droppedWithdrawnRemarks"
                    value={formData.droppedWithdrawnRemarks}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    rows={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Remarks/Comments (If Any)</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                    rows={4}
                  />
                </div>
              </>
            )}

            {formData.lastApprovalStatus !== 'Dropped' && (
              <div className="md:col-span-2">
                <label className="block mb-1 font-semibold">Remarks/Comments (If Any)</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-4 py-2 shadow-sm focus:ring-2 focus:ring-[#e9090c]"
                  rows={4}
                />
              </div>
            )}

            <div className="text-right">
              <button
                type="submit"
                className="bg-[#e9090c] hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md shadow-md transition-all disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
