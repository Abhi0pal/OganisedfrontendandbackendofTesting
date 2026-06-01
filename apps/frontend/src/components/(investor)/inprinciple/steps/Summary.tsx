import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type SummaryContext = {
  setFormMethodsRef: (methods: any) => void;
  rbiReason?: string;
  nonCompliantMandatoryDocs?: string[];
};

export const buildSummaryStep = (ctx: SummaryContext): Step => ({
  id: 'step-9',
  title: 'Summary',
  description: String(ctx.rbiReason || '').trim()
    ? `Revert Back to Investor reason: ${String(ctx.rbiReason || '').trim()}`
    : undefined,
  sections: [
    {
      id: 'summary',
      title: 'Summary',
      columns: 1,
      fields: [
        {
          name: 'summary.table',
          type: 'custom',
          render: () => {
            const reason = String(ctx.rbiReason || '').trim();
            const nonCompliantDocs = Array.isArray(ctx.nonCompliantMandatoryDocs)
              ? ctx.nonCompliantMandatoryDocs
              : [];
            return (
              <div className="space-y-3">
                {reason ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <div className="font-semibold">Revert Back to Investor Comment</div>
                    <div className="mt-1">{reason}</div>
                  </div>
                ) : null}
                {nonCompliantDocs.length > 0 ? (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <div className="font-semibold">
                      Mandatory Documents Non-Compliant
                    </div>
                    <ul className="mt-2 list-disc pl-5">
                      {nonCompliantDocs.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-700 text-white">
                      <tr>
                        <th className="px-4 py-3">Sl. No</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        'Company Details',
                        'Authorized and Promoter details',
                        'Proposed Project Details',
                        'Project Finance',
                        'Project Requirement',
                        'Supporting Documents',
                        'Payment',
                        'Application Signing',
                        'Summary',
                      ].map((label, index) => (
                        <tr key={label} className="border-t border-gray-200">
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3">{label}</td>
                          <td className="px-4 py-3 text-green-600">OK</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          },
        },
      ],
    },
  ],
});
