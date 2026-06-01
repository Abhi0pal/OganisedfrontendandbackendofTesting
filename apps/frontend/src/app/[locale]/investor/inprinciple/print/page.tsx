import React from 'react';
import InprinciplePrintView from '@/components/(investor)/inprinciple/applicationcomponent/print/InprinciplePrintView';

export default function InprinciplePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const resolvedSearchParams = React.use(searchParams);
  const submissionId = Number(resolvedSearchParams?.submissionId || 0);
  if (!Number.isFinite(submissionId) || submissionId <= 0) {
    return <div className="p-6 text-sm text-gray-600">Application not found.</div>;
  }
  return <InprinciplePrintView submissionId={submissionId} />;
}
