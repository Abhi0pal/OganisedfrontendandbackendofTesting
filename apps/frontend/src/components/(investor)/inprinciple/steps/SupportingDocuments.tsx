import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import CommonDocumentPage from '@/components/common/CommonDocumentPage';

type Step = DynamicFormConfig['steps'][number];

export type SupportingDocumentsContext = {
  serviceId: string;
  submissionId: number | null;
  deptId?: number;
};

export const buildSupportingDocumentsStep = (ctx: SupportingDocumentsContext): Step => {
  const { serviceId, submissionId, deptId = 0 } = ctx;

  return {
    id: 'step-6',
    title: 'Supporting Documents',
    sections: [
      {
        id: 'supporting-documents',
        title: 'Supporting Documents',
        columns: 1,
        fields: [
          {
            name: 'documents.table',
            type: 'custom',
            colSpan: 1,
            render: () =>
              !submissionId ? (
                <div className="text-sm text-gray-500">
                  Please save the form once to enable document uploads.
                </div>
              ) : (
                <CommonDocumentPage
                  serviceId={serviceId}
                  submissionId={submissionId}
                  deptId={deptId}
                />
              ),
          },
        ],
      },
    ],
  };
};
