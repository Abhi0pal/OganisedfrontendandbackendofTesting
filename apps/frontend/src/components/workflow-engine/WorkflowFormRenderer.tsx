'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';
import { toast } from '@/lib/sonner';
import { FormRenderer } from '../investor/FormRenderer';

interface WorkflowFormRendererProps {
  workflowDefId?: number;     // If starting a new workflow instance (Applicant filling form)
  forwardLevelId?: string;    // If processing an existing step (Officer processing form)
  applicationId?: string;     // If existing application
  serviceId: string;
  departmentId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function WorkflowFormRenderer({
  workflowDefId,
  forwardLevelId,
  applicationId,
  serviceId,
  departmentId,
  onSuccess,
  onCancel
}: WorkflowFormRendererProps) {
  const [applicantConfig, setApplicantConfig] = useState<any>(null);
  const [processingConfig, setProcessingConfig] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState<any>({ fields: {}, addMore: {} });
  const [loading, setLoading] = useState(true);

  // If there's a forwardLevelId, we need applicant read-only + processing editable
  // If there's ONLY workflowDefId, we just need applicant editable
  const isOfficerProcessing = !!forwardLevelId;

  useEffect(() => {
    fetchConfigs();
  }, [workflowDefId, forwardLevelId]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      // 1. Fetch form configs
      if (isOfficerProcessing) {
        // Fetch processing form
        const procRes = await apiClient.get(`/workflow-engine/form/step/${forwardLevelId}`);
        setProcessingConfig(procRes.data);

        // Fetch instance detail to get config ID and application ID
        const instRes = await apiClient.get(`/workflow-engine/instances/${forwardLevelId}`);
        
        // In the consolidated schema, instance.configuration is the WorkflowConfiguration record
        const configRecord = instRes.data.configuration;
        const appId = instRes.data.applicationId;
        
        if (configRecord?.id) {
          const appRes = await apiClient.get(`/workflow-engine/form/applicant/${configRecord.id}`);
          setApplicantConfig(appRes.data);
        }

        if (appId) {
          // Submission data fetching handled by FormRenderer internally or via parent
        }

      } else if (workflowDefId) {
        // Just applicant starting
        const appRes = await apiClient.get(`/workflow-engine/form/applicant/${workflowDefId}`);
        setApplicantConfig(appRes.data);
      }
    } catch (err: any) {
      toast.error('Failed to load workflow form structure');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicantSubmit = async (values: any) => {
    try {
      // Generate dummy application ID or use real logic
      const generatedAppId = Date.now().toString(); 
      await apiClient.post('/workflow-engine/form/submit', {
        applicationId: generatedAppId,
        serviceId,
        departmentId,
        formData: values,
        formTypeId: applicantConfig?.formTypeId
      });

      // Now start instance
      await apiClient.post('/workflow-engine/start', {
        serviceId,
        departmentId,
        applicationId: generatedAppId
      });

      toast.success('Application submitted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Submission failed');
    }
  };

  const handleOfficerSubmit = async (values: any, actionCode: string) => {
    try {
      // 1. Save form data
      if (applicationId) {
        await apiClient.post('/workflow-engine/form/submit', {
          applicationId,
          serviceId,
          departmentId,
          formData: values,
          formTypeId: processingConfig?.formTypeId
        });
      }

      // 2. Execute Action
      await apiClient.post('/workflow-engine/execute', {
        forwardLevelId: forwardLevelId,
        actionCode,
        remarks: 'Processed via form',
        applicationData: values
      });

      toast.success(`Action ${actionCode} completed successfully!`);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Failed to process workflow action');
    }
  };

  if (loading) return <div>Loading form...</div>;

  return (
    <div className="workflow-form-wrapper">
      {/* 1. If Officer Processing: Show Applicant Data as Read-Only */}
      {isOfficerProcessing && applicantConfig && (
        <div className="applicant-data mb-4">
          <h5 className="mb-3 text-secondary">Applicant Submission</h5>
          <div className="card p-3 shadow-sm" style={{ pointerEvents: 'none', opacity: 0.85 }}>
            <FormRenderer 
              config={applicantConfig} 
              initialData={submissionData} 
              readOnly={true} 
              onCancel={() => {}} 
              serviceId={serviceId} 
            />
          </div>
        </div>
      )}

      {/* 2. Editable Form Area */}
      {isOfficerProcessing && processingConfig ? (
        <div className="processing-data">
          <h5 className="mb-3">Officer Assessment</h5>
          <div className="card p-3 shadow-sm border-primary">
            {/* 
              We're relying on FormRenderer to trigger the action button click 
              via its finalActionLabel or onActionButton callback if it supports it.
              If not, we can intercept onSubmit and perform default action, 
              or render custom buttons below it. 
            */}
            <FormRenderer 
              config={processingConfig} 
              initialData={submissionData} 
              onSubmit={(v) => handleOfficerSubmit(v, 'FORWARD')} 
              onCancel={onCancel || (() => {})} 
              serviceId={serviceId}
            />
          </div>
        </div>
      ) : (
        <div className="applicant-entry">
          <h5 className="mb-3">Submit New Application</h5>
          {applicantConfig && (
            <FormRenderer 
              config={applicantConfig} 
              initialData={submissionData} 
              onSubmit={(v) => handleApplicantSubmit(v)} 
              onCancel={onCancel || (() => {})} 
              serviceId={serviceId}
            />
          )}
        </div>
      )}
    </div>
  );
}
