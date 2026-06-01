import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import { toNumber } from '@/components/(investor)/inprinciple/utils/numberUtils';

type Step = DynamicFormConfig['steps'][number];

export type ProjectFinanceContext = {
  computeFinanceDerived: (methods: any) => void;
  computeFinanceMeansTotal: (methods: any) => void;
  // Existing investor flow
  isExistingMode?: boolean;
  isFormLocked?: boolean;
  existingFinance?: any;
};

export const buildProjectFinanceStep = (ctx: ProjectFinanceContext): Step => {
  type FinanceField = DynamicFormConfig['steps'][number]['sections'][number]['fields'][number];

  const { computeFinanceDerived, computeFinanceMeansTotal } = ctx;
  const isReadOnly = !!ctx.isFormLocked;
  const existingFinance = ctx.existingFinance || {};
  const numberPattern = /^\d+(\.\d+)?$/;

  const minExisting = (path: string) => (value: any) => {
    if (!ctx.isExistingMode) return true;
    const parts = path.split('.');
    let current: any = existingFinance;
    for (const part of parts) {
      current = current?.[part];
    }
    if (current === undefined || current === null || current === '') return true;
    const existingValue = toNumber(current);
    const nextValue = toNumber(value);
    return nextValue >= existingValue || 'Value cannot be less than existing';
  };

  const buildTagField = (name: string, label: string, className: string, marginClass = 'mb-2 mt-2'): FinanceField => ({
    name,
    label: '',
    type: 'custom',
    colSpan: 3,
    render: () => (
      <div className={marginClass}>
        <span className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${className}`}>
          {label}
        </span>
      </div>
    ),
  });

  const buildNumberField = (
    name: string,
    label: string,
    requiredMessage: string,
    patternMessage: string,
    onChange: (methods: any) => void,
    minPath: string
  ): FinanceField => ({
    name,
    label,
    type: 'text',
    disabled: isReadOnly,
    validation: {
      required: requiredMessage,
      pattern: { value: numberPattern, message: patternMessage },
      validate: minExisting(minPath),
    },
    onChange: (_value: any, methods: any) => onChange(methods),
  });

  const buildReadOnlyField = (name: string, label: string): FinanceField => ({
    name,
    label,
    type: 'custom',
    colSpan: 1,
    render: (methods: any) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          readOnly
          value={methods.watch(name) || ''}
          className="w-full px-3 py-2.5 border rounded text-sm bg-gray-100 border-gray-300"
        />
      </div>
    ),
  });

  return {
    id: 'step-4',
    title: 'Project Finance',
    sections: [
      {
        id: 'project-cost',
        title: 'Proposed Cost of the Project (Rs in Crores)',
        columns: 3,
        fields: [
          buildTagField('finance.cost.vfa_tag', 'VFA', 'bg-red-200 text-red-700', 'mb-2'),
          buildNumberField(
            'finance.cost.land',
            'Land',
            'Please enter land cost',
            'Land should be numeric',
            computeFinanceDerived,
            'cost.land'
          ),
          buildNumberField(
            'finance.cost.building',
            'Building',
            'Please enter building cost',
            'Building should be numeric',
            computeFinanceDerived,
            'cost.building'
          ),
          buildNumberField(
            'finance.cost.plant',
            'Plant & Machinery',
            'Please enter plant & machinery cost',
            'Plant & Machinery should be numeric',
            computeFinanceDerived,
            'cost.plant'
          ),
          buildTagField('finance.cost.other_tag', 'Other Investment', 'bg-cyan-200 text-cyan-800'),
          buildNumberField(
            'finance.cost.working_capital',
            'Work Capital Margin',
            'Please enter working capital margin',
            'Working Capital should be numeric',
            computeFinanceDerived,
            'cost.working_capital'
          ),
          buildNumberField(
            'finance.cost.contingency',
            'Contingency',
            'Please enter contingency',
            'Contingency should be numeric',
            computeFinanceDerived,
            'cost.contingency'
          ),
          buildNumberField(
            'finance.cost.others',
            'Others',
            'Please enter others',
            'Others should be numeric',
            computeFinanceDerived,
            'cost.others'
          ),
          buildReadOnlyField('finance.cost.total', 'Total'),
          buildReadOnlyField('finance.project_category', 'Project Category'),
          {
            name: 'finance.cost.total_spacer',
            label: '',
            type: 'custom',
            colSpan: 1,
            render: () => <div className="h-0" />,
          },
        ],
      },
      {
        id: 'means-of-finance',
        title: 'Means of Finance (Rs in Crores)',
        columns: 3,
        fields: [
          buildNumberField(
            'finance.means.promoter_equity',
            "Promoter's Equity",
            'Please enter promoter equity',
            "Promoter's Equity should be numeric",
            computeFinanceMeansTotal,
            'means.promoter_equity'
          ),
          buildNumberField(
            'finance.means.institution_equity',
            "Institution's Equity",
            'Please enter institution equity',
            "Institution's Equity should be numeric",
            computeFinanceMeansTotal,
            'means.institution_equity'
          ),
          buildNumberField(
            'finance.means.foreign_equity',
            'Foreign Equity',
            'Please enter foreign equity',
            'Foreign Equity should be numeric',
            computeFinanceMeansTotal,
            'means.foreign_equity'
          ),
          buildNumberField(
            'finance.means.term_loans',
            'Term Loans',
            'Please enter term loans',
            'Term Loans should be numeric',
            computeFinanceMeansTotal,
            'means.term_loans'
          ),
          buildNumberField(
            'finance.means.others',
            'Others',
            'Please enter others',
            'Others should be numeric',
            computeFinanceMeansTotal,
            'means.others'
          ),
          buildReadOnlyField('finance.means.total', 'Total'),
          {
            name: 'finance.means.total_spacer',
            label: '',
            type: 'custom',
            colSpan: 2,
            render: () => <div className="h-0" />,
          },
        ],
      },
      {
        id: 'finance-flags',
        title: 'Finance Flags',
        columns: 2,
        fields: [
          {
            name: 'finance.ecb_fdi',
            label: 'External Commercial Borrowing (ECB) / FDI',
            type: 'radio',
            disabled: isReadOnly,
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
            validation: { required: 'Please select an option' },
          },
          {
            name: 'finance.share_details',
            label: 'Share application details with financial institutions?',
            type: 'radio',
            disabled: isReadOnly,
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
            validation: { required: 'Please select an option' },
          },
        ],
      },
    ],
  };
};
