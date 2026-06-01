"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api-client";
import { toast } from "@/lib/sonner";
import { useOfficerApplicationView } from "@/hooks/department/useOfficerWorkflow";
import WorkflowFormRenderer from "@/components/workflow-engine/WorkflowFormRenderer";

// Simple spinner component
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function V2WorkflowProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = Number(params?.submissionId);

  const [forwardLevelId, setForwardLevelId] = useState<string | null>(null);
  const [loadingLevel, setLoadingLevel] = useState(true);

  // Fetch applicant view from legacy (it works exactly the same since both store in t_application_submission)
  const { data: appView, isLoading: loadingAppView } = useOfficerApplicationView(
    Number.isFinite(submissionId) && submissionId > 0 ? submissionId : undefined
  );

  useEffect(() => {
    if (!submissionId || !user?.roleId) return;

    // Fetch the active forward level for this submission & role
    const fetchForwardLevel = async () => {
      try {
        setLoadingLevel(true);
        // We'll call a quick check endpoint or the engine's list endpoint
        // For right now, let's look up using instances API endpoint (we'll need to create this in the backend if it doesn't exist)
        const res = await apiClient.get(`/workflow-engine/application/${submissionId}`);
        const activeInstances = res.data;
        const activeInstance = activeInstances.find((inst: any) =>
          inst.status === 'ACTIVE' && String(inst.currentRoleId) === String(user.roleId)
        );

        if (activeInstance && activeInstance.id) {
          setForwardLevelId(activeInstance.id.toString());
        } else {
          toast.error("No active workflow task found for your role");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load workflow task details");
      } finally {
        setLoadingLevel(false);
      }
    };

    fetchForwardLevel();
  }, [submissionId, user?.roleId]);

  if (loadingAppView || loadingLevel) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <span className="text-gray-500 font-medium tracking-wide">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (!appView || !forwardLevelId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-500 mb-6">This task may have been processed or reassigned. Please check your dashboard.</p>
          <button
            onClick={() => router.push('/department/fb-dashboard')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-4 pb-0 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/department/fb-dashboard')}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{appView.serviceName}</h1>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="text-gray-500 font-medium">#{appView.submissionId}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  <span className="text-gray-600">{appView.unitName}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                {appView.statusLabel || 'Pending'}
              </div>
            </div>
          </div>

          <div className="flex gap-8 border-b-2 border-transparent">
            <button className="pb-3 border-b-2 border-indigo-600 text-indigo-700 font-medium">Processing</button>
            <button className="pb-3 text-gray-500 hover:text-gray-800 font-medium transition-colors">Timeline</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Left Column: Read Only Applicant Data */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden relative group">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Applicant Data</h2>
                  <p className="text-sm text-gray-500">Information submitted by the investor</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(appView.formData || {}).map(([key, value]) => {
                  // Format key into human readable label if no schema is found
                  const schema = appView.fieldSchema?.find(s => s.fieldCode === key);
                  const label = schema ? schema.label : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                  if (typeof value === 'object') return null; // Skip complex objects for now, or stringify them

                  return (
                    <div key={key} className="flex flex-col gap-1 border-b border-gray-50 pb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
                      <span className="text-gray-800 font-medium text-[15px]">{String(value) || '—'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Action Processing */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 overflow-hidden sticky top-32">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-1">Process Action</h3>
              <p className="text-indigo-100 text-sm">Review & provide your evaluation</p>
            </div>

            <div className="p-6">
              {/* Inject the dynamic Workflow Form Renderer here */}
              <WorkflowFormRenderer
                forwardLevelId={forwardLevelId}
                applicationId={submissionId.toString()}
                serviceId={appView.serviceId}
                departmentId={0 /* Ideally fetched from submission context */}
                onSuccess={() => {
                  toast.success("Workflow action completed");
                  router.push('/department/fb-dashboard');
                }}
                onCancel={() => router.push('/department/fb-dashboard')}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
