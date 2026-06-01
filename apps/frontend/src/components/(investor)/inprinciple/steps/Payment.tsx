import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type PaymentContext = {
  setFormMethodsRef: (methods: any) => void;
  submissionId: number | null;
  singleBusinessId?: string | null;
  paymentRows: any[];
  paymentLoading: boolean;
  isPaymentSuccess: boolean;
  canRetry: boolean;
  onPay: (amount: number) => void;
  onReceipt: (row: any) => void;
};

export const buildPaymentStep = (ctx: PaymentContext): Step => {
  const toSentenceCase = (value: any) => {
    if (value === null || value === undefined) return '--';
    const text = String(value).trim();
    if (!text) return '--';
    return text
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return {
  id: 'step-7',
  title: 'Payment',
  sections: [
    {
      id: 'payment-summary',
      title: 'Payment',
      columns: 1,
      fields: [
        {
          name: 'payment.summary',
          type: 'custom',
          render: (methods) => {
            const category = String(methods.watch('finance.project_category') || '').toLowerCase();
            const gender = String(methods.watch('authorized.gender') || '').toLowerCase();
            const authCategory = String(methods.watch('authorized.category') || '').toLowerCase();
            const authName = methods.watch('authorized.name') || '--';

            const baseAmount =
              category === 'micro'
                ? 0
                : category === 'small'
                  ? 1000
                  : category === 'medium'
                    ? 5000
                    : category === 'large'
                      ? 10000
                      : 0;

            const discountEligible =
              gender === 'female' || authCategory === 'sc' || authCategory === 'st';
            const payableAmount = discountEligible ? baseAmount / 2 : baseAmount;
            const totalPaid = ctx.paymentRows
              .filter((row) => String(row?.statusCode) === 'S')
              .reduce((sum, row) => sum + Number(row?.amount || 0), 0);
            const remainingAmount = Math.max(0, payableAmount - totalPaid);
            const totalAmount = remainingAmount;

            const companyName = methods.watch('company.name') || 'Company Name';
            const projectCost = methods.watch('finance.cost.total') || '0';
            const plantMachineryCost = methods.watch('finance.cost.plant') || '0';
            const appCategory =
              authCategory === 'sc'
                ? 'SC'
                : authCategory === 'st'
                  ? 'ST'
                  : authCategory === 'obc'
                    ? 'OBC'
                    : 'General';
            const projectCategoryLabel =
              category === 'micro'
                ? 'Micro'
                : category === 'small'
                  ? 'Small'
                  : category === 'medium'
                    ? 'Medium'
                    : category === 'large'
                      ? 'Large'
                      : '--';
            const hasPayments = ctx.paymentRows.length > 0;

            return (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="grid gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 md:grid-cols-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Single Business ID</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {ctx.singleBusinessId || ctx.submissionId || '--'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Company Name</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toSentenceCase(companyName)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Authorized Signatory</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toSentenceCase(authName)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Gender</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toSentenceCase(gender)}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 px-5 py-3 md:grid-cols-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Applicant Category</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toSentenceCase(appCategory)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Project Category</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toSentenceCase(projectCategoryLabel)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Project Cost</div>
                      <div className="text-sm font-semibold text-gray-900">{projectCost}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500">Plant & Machinery Cost</div>
                      <div className="text-sm font-semibold text-gray-900">{plantMachineryCost}</div>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-700 text-white">
                      <tr>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Total Paid Till Date</th>
                        <th className="px-4 py-3">Payable Amount</th>
                        <th className="px-4 py-3">Tax</th>
                        <th className="px-4 py-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-200">
                        <td className="px-4 py-3">Department Name</td>
                        <td className="px-4 py-3">{totalPaid}</td>
                        <td className="px-4 py-3">{remainingAmount}</td>
                        <td className="px-4 py-3">0</td>
                        <td className="px-4 py-3">{totalAmount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {remainingAmount > 0 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={ctx.paymentLoading}
                      onClick={() => ctx.onPay(remainingAmount)}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white"
                    >
                      Pay Using PayGov
                    </button>
                  </div>
                )}

                {hasPayments && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {ctx.isPaymentSuccess
                          ? 'Payment completed'
                          : 'Payment failed. Please retry.'}
                      </div>
                      {ctx.canRetry && (
                        <button
                          type="button"
                          disabled={ctx.paymentLoading}
                          onClick={() => ctx.onPay(remainingAmount)}
                          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white"
                        >
                          Retry Payment
                        </button>
                      )}
                    </div>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-700 text-white">
                          <tr>
                            <th className="px-4 py-3">Sl. No</th>
                            <th className="px-4 py-3">Payment Mode</th>
                            <th className="px-4 py-3">Reference No</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Date of Payment</th>
                            <th className="px-4 py-3">Payment Status</th>
                            <th className="px-4 py-3">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ctx.paymentRows.map((row, index) => (
                            <tr key={String(row.paymentId || index)} className="border-t border-gray-200">
                              <td className="px-4 py-3">{index + 1}</td>
                              <td className="px-4 py-3">{row.paymentMode || 'PayGov'}</td>
                              <td className="px-4 py-3">{row.pgMeTrnRefNo || '--'}</td>
                              <td className="px-4 py-3">{row.amount || 0}</td>
                              <td className="px-4 py-3">
                                {row.created ? new Date(row.created).toLocaleString() : '--'}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full border px-2 py-1 text-xs ${
                                    row.statusCode === 'S'
                                      ? 'border-green-500 text-green-600'
                                      : 'border-red-500 text-red-600'
                                  }`}
                                >
                                  {row.statusCode === 'S' ? 'Success' : 'Failed'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {row.statusCode === 'S' ? (
                                  <button
                                    type="button"
                                    onClick={() => ctx.onReceipt(row)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    View Receipt
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">--</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          },
        },
      ],
    },
  ],
};
};
