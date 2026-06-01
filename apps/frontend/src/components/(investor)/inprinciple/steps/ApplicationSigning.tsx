import { DynamicFormConfig } from '@/components/(investor)/inprinciple/formcomponent';

type Step = DynamicFormConfig['steps'][number];

export type ApplicationSigningContext = {
  setFormMethodsRef: (methods: any) => void;
  rbiReason?: string;
};

export const buildApplicationSigningStep = (ctx: ApplicationSigningContext): Step => {
  const rbiReason = String(ctx.rbiReason || '').trim();
  return {
    id: 'step-8',
    title: 'Application Signing',
    description: rbiReason
      ? `Revert Back to Investor reason: ${rbiReason}`
      : undefined,
    sections: [
      {
        id: 'declaration',
        title: 'Declaration',
        description: 'Terms and Conditions',
        columns: 1,
        fields: [
          {
            name: 'signing.declaration',
            label:
              'I declare that all the information provided in the application form is true, accurate, and complete to the best of my knowledge and belief. I understand that any misrepresentation or omission of facts may result in the rejection of my application or other appropriate action.',
            type: 'checkbox',
            validation: {
              required: 'Please accept the declaration to proceed.',
            },
          },
        ],
      },
      {
        id: 'signing',
        title: 'Signing',
        columns: 3,
        fields: [
          {
            name: 'signing.method',
            label: 'Sign Application Using',
            type: 'radio',
            options: [
              { label: 'DSC', value: 'dsc' },
              { label: 'Aadhaar', value: 'aadhaar' },
            ],
          },
          {
            name: 'signing.token',
            label: 'Tokens',
            type: 'select',
            options: [{ label: 'Select Device', value: 'device' }],
          },
          { name: 'signing.certificate', label: 'Certificate', type: 'text' },
          { name: 'signing.password', label: 'Password', type: 'password' },
        ],
      },
    ],
  };
};
