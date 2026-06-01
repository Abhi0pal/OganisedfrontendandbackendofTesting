import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';
import ExistingBusinessSelector from '@/components/(investor)/inprinciple/steps/ExistingBusinessSelector';

type Step = DynamicFormConfig['steps'][number];

export type CompanyDetailsContext = {
  countries: { label: string; value: string | number }[];
  corpStates: { label: string; value: string | number }[];
  corrStates: { label: string; value: string | number }[];
  corpDistrictOptions: { label: string; value: string | number }[];
  corpTehsilOptions: { label: string; value: string | number }[];
  corrDistrictOptions: { label: string; value: string | number }[];
  corrTehsilOptions: { label: string; value: string | number }[];
  panPattern: RegExp;
  digitsPattern: RegExp;
  emailPattern: RegExp;
  validateOptionalDigits: (min: number, max: number, label: string) => (value: string) => true | string;
  validateOptionalEmail: (value: string) => true | string;
  setCorpCountryId: (value: string | number) => void;
  setCorpStateId: (value: string | number | undefined) => void;
  setCorpDistrictId: (value: string | number | undefined) => void;
  setCorrCountryId: (value: string | number) => void;
  setCorrStateId: (value: string | number | undefined) => void;
  setCorrDistrictId: (value: string | number | undefined) => void;
  setFormMethodsRef: (methods: any) => void;
  // Existing investor flow
  isExistingMode?: boolean;
  isFormLocked?: boolean;
  sbSelectorDisabled?: boolean;
  sbOptions?: { label: string; value: number }[];
  sbLoading?: boolean;
  sbError?: string | null;
  onSbChange?: (value: number, methods: any) => void;
};

const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export const buildCompanyDetailsStep = (ctx: CompanyDetailsContext): Step => {
  type CompanyField = DynamicFormConfig['steps'][number]['sections'][number]['fields'][number];

  const existingSbIdField: CompanyField = {
    name: 'company.sb_submission_id',
    type: 'hidden',
    validation: { required: 'Please select an approved SB ID' },
  };

  const existingSbSelectorField: CompanyField = {
    name: 'company.sb_selection',
    label: 'Select Approved SB ID',
    type: 'custom',
    colSpan: 1,
    render: (methods) => {
      const rawValue = methods.watch('company.sb_submission_id');
      const selectedId = rawValue ? Number(rawValue) : null;
      return (
        <ExistingBusinessSelector
          value={selectedId}
          options={ctx.sbOptions || []}
          loading={!!ctx.sbLoading}
          disabled={!!ctx.sbSelectorDisabled}
          error={ctx.sbError || null}
          onChange={(value) => {
            methods.setValue('company.sb_submission_id', value, { shouldValidate: true });
            ctx.onSbChange?.(value, methods);
          }}
        />
      );
    },
  };

  const companyFields: DynamicFormConfig['steps'][number]['sections'][number]['fields'] = [
    ...(ctx.isExistingMode ? [existingSbIdField] : []),
    {
      name: 'company.proposal_type',
      label: 'Type of Proposal',
      type: 'select',
      options: [
        { label: 'New Project', value: 'new' },
        { label: 'Extension', value: 'extension' },
        { label: 'Modernisation', value: 'modernisation' },
        { label: 'Diversification', value: 'diversification' },
        { label: 'Amendment', value: 'amendment' },
        { label: 'Expansion', value: 'expansion' },
      ],
      disabled: true,
      validation: { required: 'Please select type of proposal' },
    },
    ...(ctx.isExistingMode ? [existingSbSelectorField] : []),
    {
      name: 'company.primary_activity',
      label: 'Primary Activity of Project',
      type: 'select',
      options: [
        { label: 'Manufacturing', value: 'manufacturing' },
        { label: 'Service', value: 'service' },
      ],
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please select activity' },
    },
    {
      name: 'company.name',
      label: 'Name of the Company/Unit/Trust',
      type: 'text',
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please enter company name' },
    },
    {
      name: 'company.constitution',
      label: 'Constitution of the Establishment',
      type: 'select',
      options: [
        { label: 'Partnership', value: 'partnership' },
        { label: 'Proprietery', value: 'proprietery' },
        { label: 'Private Limited', value: 'private_limited' },
        { label: 'Public Limited', value: 'public_limited' },
        { label: 'Co-operative', value: 'co_operative' },
        { label: 'Other', value: 'other' },
      ],
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please select constitution' },
    },
    {
      name: 'company.pan',
      label: 'PAN Number',
      type: 'text',
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: {
        required: 'Please enter PAN',
        pattern: { value: ctx.panPattern, message: 'Please enter a valid PAN' },
      },
    },
    {
      name: 'company.cin',
      label: 'Corporate Identification Number (CIN)',
      type: 'text',
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please enter CIN' },
    },
    {
      name: 'company.incorporation_date',
      label: 'Date of Incorporation',
      type: 'date',
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please select date of incorporation' },
    },
    {
      name: 'company.business_start_date',
      label: 'Business Start Date (Month/Year)',
      type: 'month',
      disabled: !!ctx.isFormLocked,
      validation: { required: 'Please select business start date' },
      dependsOn: { field: 'company.proposal_type', value: 'new', show: false },
    },
    {
      name: 'company.gst_available',
      label: 'Do you have GST Number',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please select an option' },
    },
    {
      name: 'company.gst_number',
      label: 'GST Number',
      type: 'text',
      placeholder: '22ABCDE1234F1Z5',
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: {
        required: 'Please enter GST Number',
        pattern: { value: gstPattern, message: 'Please enter a valid GST number' },
      },
      dependsOn: { field: 'company.gst_available', value: 'yes', show: true },
    },
    {
      name: 'company.is_startup',
      label: 'Is a Startup Company?',
      type: 'radio',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
      validation: { required: 'Please select an option' },
    },
    {
      name: 'company.origin_country',
      label: 'Country of Origin',
      type: 'select',
      options: ctx.countries || [],
      searchable: true,
      disabled: !!ctx.isFormLocked || !!ctx.isExistingMode,
    },
  ];

  return {
    id: 'step-1',
    title: 'Company Details',
    sections: [
      {
        id: 'company-details',
        title: 'Company Details',
        columns: 3,
        fields: companyFields,
      },
      {
      id: 'corporate-address',
      title: 'Corporate Address',
      columns: 3,
      fields: [
        {
          name: 'company.corp.country',
          label: 'Country',
          type: 'select',
          options: ctx.countries || [],
          searchable: true,
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please select country' },
          onChange: (value, methods) => {
            ctx.setCorpCountryId(value);
            ctx.setCorpStateId(undefined);
            ctx.setCorpDistrictId(undefined);
            methods.setValue('company.corp.state', '');
            methods.setValue('company.corp.district', '');
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.state',
          label: 'State',
          type: 'select',
          options: ctx.corpStates || [],
          searchable: true,
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please select state' },
          onChange: (value, methods) => {
            ctx.setCorpStateId(value);
            ctx.setCorpDistrictId(undefined);
            methods.setValue('company.corp.district', '');
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.district',
          label: 'District',
          type: 'select',
          options: ctx.corpDistrictOptions,
          searchable: true,
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please select district' },
          onChange: (value, methods) => {
            ctx.setCorpDistrictId(value);
            methods.setValue('company.corp.block', '');
          },
        },
        {
          name: 'company.corp.block',
          label: 'Block',
          type: 'select',
          options: ctx.corpTehsilOptions,
          searchable: true,
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please select Block' },
        },
        {
          name: 'company.corp.city',
          label: 'City',
          type: 'text',
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please enter city' },
        },
        {
          name: 'company.corp.address1',
          label: 'Address Line 1',
          type: 'text',
          disabled: !!ctx.isFormLocked,
          validation: { required: 'Please enter address line 1' },
        },
        { name: 'company.corp.address2', label: 'Address Line 2', type: 'text', disabled: !!ctx.isFormLocked },
        {
          name: 'company.corp.pincode',
          label: 'Pin Code',
          type: 'text',
          disabled: !!ctx.isFormLocked,
          validation: {
            required: 'Please enter pin code',
            pattern: { value: ctx.digitsPattern, message: 'Pin code should contain digits only' },
          },
        },
        {
          name: 'company.corp.email',
          label: 'Email ID',
          type: 'email',
          disabled: !!ctx.isFormLocked,
          validation: {
            required: 'Please enter email id',
            pattern: { value: ctx.emailPattern, message: 'Please enter a valid email' },
          },
        },
        {
          name: 'company.corp.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              {(() => {
                ctx.setFormMethodsRef(methods);
                return null;
              })()}
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-2/5 pr-2">
                  Country Code <span className="text-red-600">*</span>
                </span>
                <span className="w-3/5 pl-2">
                  Mobile Number <span className="text-red-600">*</span>
                </span>
              </div>
              <div className="flex gap-2">
                <select
                  {...methods.register('company.corp.country_code', {
                    required: 'Please select country code',
                    pattern: { value: ctx.digitsPattern, message: 'Country code should contain digits only' },
                  })}
                  disabled={!!ctx.isFormLocked}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('company.corp.mobile', {
                    required: 'Please enter mobile number',
                    pattern: { value: ctx.digitsPattern, message: 'Mobile number should contain digits only' },
                    minLength: { value: 6, message: 'Mobile number must be at least 6 digits' },
                    maxLength: { value: 12, message: 'Mobile number must be at most 12 digits' },
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-3/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
        {
          name: 'company.corp.phone_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-1/3 pr-2">STD Code</span>
                <span className="w-2/3 pl-2">Phone Number</span>
              </div>
              <div className="flex gap-2">
                <input
                  {...methods.register('company.corp.std_code', {
                    validate: ctx.validateOptionalDigits(1, 6, 'STD code'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-1/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...methods.register('company.corp.phone', {
                    validate: ctx.validateOptionalDigits(3, 10, 'Phone number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-2/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: 'correspondence-flag',
      title: 'Correspondence Address',
      columns: 1,
      fields: [
        {
          name: 'company.corr_same_as_corp',
          label: 'Correspondence address and corporate address is same',
          type: 'checkbox',
          disabled: !!ctx.isFormLocked,
        },
      ],
    },
    {
      id: 'correspondence-address',
      title: 'Correspondence Address',
      columns: 3,
      dependsOn: { field: 'company.corr_same_as_corp', value: true, show: false },
      fields: [
        {
          name: 'company.corr.country',
          label: 'Country',
          type: 'select',
          options: ctx.countries || [],
          searchable: true,
          disabled: !!ctx.isFormLocked,
          onChange: (value, methods) => {
            ctx.setCorrCountryId(value);
            ctx.setCorrStateId(undefined);
            ctx.setCorrDistrictId(undefined);
            methods.setValue('company.corr.state', '');
            methods.setValue('company.corr.district', '');
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.state',
          label: 'State',
          type: 'select',
          options: ctx.corrStates || [],
          searchable: true,
          disabled: !!ctx.isFormLocked,
          onChange: (value, methods) => {
            ctx.setCorrStateId(value);
            ctx.setCorrDistrictId(undefined);
            methods.setValue('company.corr.district', '');
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.district',
          label: 'District',
          type: 'select',
          options: ctx.corrDistrictOptions,
          searchable: true,
          disabled: !!ctx.isFormLocked,
          onChange: (value, methods) => {
            ctx.setCorrDistrictId(value);
            methods.setValue('company.corr.block', '');
          },
        },
        {
          name: 'company.corr.block',
          label: 'Block',
          type: 'select',
          options: ctx.corrTehsilOptions,
          searchable: true,
          disabled: !!ctx.isFormLocked,
        },
        { name: 'company.corr.city', label: 'City', type: 'text', disabled: !!ctx.isFormLocked },
        { name: 'company.corr.address1', label: 'Address Line 1', type: 'text', disabled: !!ctx.isFormLocked },
        { name: 'company.corr.address2', label: 'Address Line 2', type: 'text', disabled: !!ctx.isFormLocked },
        {
          name: 'company.corr.pincode',
          label: 'Pin Code',
          type: 'text',
          disabled: !!ctx.isFormLocked,
          validation: { pattern: { value: ctx.digitsPattern, message: 'Pin code should contain digits only' } },
        },
        {
          name: 'company.corr.email',
          label: 'Email ID',
          type: 'email',
          disabled: !!ctx.isFormLocked,
          validation: { validate: ctx.validateOptionalEmail },
        },
        {
          name: 'company.corr.mobile_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-2/5 pr-2">Country Code</span>
                <span className="w-3/5 pl-2">Mobile Number</span>
              </div>
              <div className="flex gap-2">
                <select
                  {...methods.register('company.corr.country_code', {
                    validate: ctx.validateOptionalDigits(1, 5, 'Country code'),
                  })}
                  disabled={!!ctx.isFormLocked}
                  className="w-2/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                >
                  <option value="">Select...</option>
                  <option value="+91">India (+91)</option>
                </select>
                <input
                  {...methods.register('company.corr.mobile', {
                    validate: ctx.validateOptionalDigits(6, 12, 'Mobile number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-3/5 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
        {
          name: 'company.corr.phone_group',
          label: '',
          type: 'custom',
          colSpan: 1,
          render: (methods) => (
            <div>
              <div className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="w-1/3 pr-2">STD Code</span>
                <span className="w-2/3 pl-2">Phone Number</span>
              </div>
              <div className="flex gap-2">
                <input
                  {...methods.register('company.corr.std_code', {
                    validate: ctx.validateOptionalDigits(1, 6, 'STD code'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-1/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                <input
                  {...methods.register('company.corr.phone', {
                    validate: ctx.validateOptionalDigits(3, 10, 'Phone number'),
                    onChange: (event: any) => {
                      event.target.value = event.target.value.replace(/\D/g, '');
                    },
                  })}
                  inputMode="numeric"
                  disabled={!!ctx.isFormLocked}
                  className="w-2/3 px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-white border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          ),
        },
      ],
      },
    ],
  };
};
