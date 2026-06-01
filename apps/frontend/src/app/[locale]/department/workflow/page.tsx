'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { useAuth } from '@/hooks/useAuth';
import WorkflowInboxDashboard from '@/components/(department)/workflow/WorkflowInboxDashboard';

export default function DepartmentWorkflowPage() {
  const toastRef = useRef<Toast>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const roleId = Number(user?.roleId || 0);
  const title = roleId === 33 ? 'Approver Workflow' : 'Department Workflow';
  const subtitle =
    roleId === 7
      ? 'Pending with me workflow inbox for nodal role.'
      : roleId === 33
        ? 'Pending with me workflow inbox for approver role.'
        : 'Pending with me workflow inbox for department roles.';

  useEffect(() => {
    const toastCode = searchParams.get('wfToast');
    if (!toastCode) return;
    if (toastCode === 'forwardedDepartments') {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Forwarded to departments successfully',
      });
    } else if (toastCode === 'actionSubmitted') {
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Action submitted successfully.',
      });
    }
    router.replace('/department/workflow');
  }, [router, searchParams]);

  return (
    <>
      <Toast ref={toastRef} />
      <WorkflowInboxDashboard
        title={title}
        subtitle={subtitle}
      />
    </>
  );
}

