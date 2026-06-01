# Dynamic Form Component

A flexible, reusable form component system for building multi-step forms with sections, validation, and various field types.

## Features

- ✅ **Multi-step forms** with step indicator
- ✅ **Sections** within each step (collapsible)
- ✅ **Multiple field types** (text, email, select, radio, checkbox, file, etc.)
- ✅ **Validation** with react-hook-form
- ✅ **Conditional fields** (show/hide based on other field values)
- ✅ **Responsive grid layout**
- ✅ **TypeScript support**
- ✅ **Customizable styling**

## Installation

The component is already available in the project. No additional installation required.

## Basic Usage

```tsx
import { DynamicForm, DynamicFormConfig } from '@/components/ui/DynamicForm';

const formConfig: DynamicFormConfig = {
  id: 'my-form',
  steps: [
    {
      id: 'step-1',
      title: 'Personal Information',
      sections: [
        {
          id: 'basic-info',
          title: 'Basic Information',
          columns: 2,
          fields: [
            {
              name: 'firstName',
              label: 'First Name',
              type: 'text',
              placeholder: 'Enter first name',
              validation: { required: 'First name is required' }
            },
            {
              name: 'lastName',
              label: 'Last Name',
              type: 'text',
              placeholder: 'Enter last name',
              validation: { required: 'Last name is required' }
            }
          ]
        }
      ]
    }
  ],
  onSubmit: async (data) => {
    console.log('Form submitted:', data);
  }
};

export default function MyFormPage() {
  return <DynamicForm config={formConfig} />;
}
```

## Configuration Options

### DynamicFormConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique form identifier |
| `steps` | FormStepConfig[] | Yes | Array of form steps |
| `submitButtonText` | string | No | Custom submit button text (default: "Submit") |
| `showStepIndicator` | boolean | No | Show step progress indicator (default: true) |
| `allowStepNavigation` | boolean | No | Allow clicking on step indicator to navigate |
| `onSubmit` | (data) => void | Yes | Form submission handler |
| `onStepChange` | (step, data) => void | No | Callback when step changes |
| `className` | string | No | Additional CSS classes |

### FormStepConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `title` | string | Yes | Step title |
| `description` | string | No | Step description |
| `sections` | FormSectionConfig[] | Yes | Array of sections in this step |

### FormSectionConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique section identifier |
| `title` | string | Yes | Section title |
| `description` | string | No | Section description |
| `fields` | FormFieldConfig[] | Yes | Array of fields in this section |
| `columns` | 1 \| 2 \| 3 \| 4 | No | Grid columns (default: 2) |
| `collapsible` | boolean | No | Make section collapsible |
| `defaultCollapsed` | boolean | No | Start collapsed |

### FormFieldConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Field name (supports nested: "user.email") |
| `label` | string | Yes | Field label |
| `type` | FieldType | Yes | Input type |
| `placeholder` | string | No | Placeholder text |
| `defaultValue` | any | No | Default field value |
| `validation` | ValidationRule | No | Validation rules |
| `options` | SelectOption[] | No | Options for select/radio/checkbox |
| `disabled` | boolean | No | Disable field |
| `readOnly` | boolean | No | Make field read-only |
| `helpText` | string | No | Help text below field |
| `colSpan` | 1 \| 2 \| 3 \| 4 | No | Column span in grid |
| `rows` | number | No | Rows for textarea |
| `accept` | string | No | Accept types for file input |
| `multiple` | boolean | No | Multiple selection (file/select) |
| `dependsOn` | object | No | Conditional visibility |
| `addMoreConfig` | AddMoreConfig | No | Configuration for 'addmore' type fields |

### Field Types

```typescript
type FieldType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'hidden'
  | 'custom'
  | 'addmore';
```

### AddMoreConfig (for 'addmore' type)

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `columns` | AddMoreColumnConfig[] | Yes | Array of column definitions |
| `minRows` | number | No | Minimum number of rows (default: 1) |
| `maxRows` | number | No | Maximum number of rows (no limit if not set) |
| `addButtonText` | string | No | Custom text for add button (default: "Add More") |
| `deleteButtonText` | string | No | Custom text for delete button (default: "Delete") |
| `defaultRow` | object | No | Default values for new rows |

### AddMoreColumnConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Column field name (part of row object) |
| `label` | string | Yes | Column header label |
| `type` | FieldType | Yes | Field type for this column |
| `placeholder` | string | No | Placeholder text |
| `options` | SelectOption[] | No | Options for select/radio/checkbox |
| `validation` | ValidationRule | No | Validation rules |
| `width` | string | No | Column width (e.g., '150px', '20%') |
| `accept` | string | No | Accept types for file input |
| `multiple` | boolean | No | Multiple selection (file/select) |
| `disabled` | boolean | No | Disable field |
| `readOnly` | boolean | No | Make field read-only |

## Examples

### Multi-Step Form

```tsx
const multiStepConfig: DynamicFormConfig = {
  id: 'registration-form',
  showStepIndicator: true,
  allowStepNavigation: false,
  steps: [
    {
      id: 'step-1',
      title: 'Personal Info',
      sections: [
        {
          id: 'personal',
          title: 'Personal Details',
          columns: 2,
          fields: [
            { name: 'firstName', label: 'First Name', type: 'text', validation: { required: true } },
            { name: 'lastName', label: 'Last Name', type: 'text', validation: { required: true } },
            { name: 'email', label: 'Email', type: 'email', 
              validation: { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
              } 
            },
          ]
        }
      ]
    },
    {
      id: 'step-2',
      title: 'Address',
      sections: [
        {
          id: 'address',
          title: 'Address Details',
          columns: 2,
          fields: [
            { name: 'street', label: 'Street', type: 'text', colSpan: 2 },
            { name: 'city', label: 'City', type: 'text' },
            { name: 'state', label: 'State', type: 'select', 
              options: [
                { label: 'Maharashtra', value: 'MH' },
                { label: 'Delhi', value: 'DL' },
              ]
            },
            { name: 'pincode', label: 'PIN Code', type: 'text', 
              validation: { 
                pattern: { value: /^[0-9]{6}$/, message: 'Must be 6 digits' } 
              } 
            },
          ]
        }
      ]
    },
    {
      id: 'step-3',
      title: 'Review',
      sections: [
        {
          id: 'confirm',
          title: 'Confirmation',
          fields: [
            { name: 'terms', label: 'I agree to the terms and conditions', type: 'checkbox',
              validation: { required: 'You must agree to terms' }
            },
          ]
        }
      ]
    }
  ],
  submitButtonText: 'Complete Registration',
  onSubmit: async (data) => {
    await api.post('/register', data);
  },
  onStepChange: (step, data) => {
    console.log('Moved to step:', step, data);
  }
};
```

### Form with Collapsible Sections

```tsx
const formWithSections: DynamicFormConfig = {
  id: 'application-form',
  steps: [
    {
      id: 'main',
      title: 'Application Form',
      sections: [
        {
          id: 'applicant',
          title: 'Applicant Information',
          collapsible: true,
          defaultCollapsed: false,
          columns: 2,
          fields: [
            { name: 'name', label: 'Full Name', type: 'text' },
            { name: 'email', label: 'Email', type: 'email' },
          ]
        },
        {
          id: 'documents',
          title: 'Document Upload',
          collapsible: true,
          defaultCollapsed: true,
          columns: 1,
          fields: [
            { name: 'panCard', label: 'PAN Card', type: 'file', accept: '.pdf,.jpg,.png' },
            { name: 'aadhaar', label: 'Aadhaar Card', type: 'file', accept: '.pdf,.jpg,.png' },
          ]
        }
      ]
    }
  ],
  onSubmit: async (data) => console.log(data)
};
```

### Add More (Dynamic Table Rows)

```tsx
const addMoreForm: DynamicFormConfig = {
  id: 'equipment-form',
  steps: [
    {
      id: 'main',
      title: 'Equipment Details',
      sections: [
        {
          id: 'equipment-section',
          title: 'Equipment List',
          columns: 1,
          
        }
      ]
    }
  ],
  onSubmit: async (data) => {
    console.log('Equipments:', data.equipments);
    // data.equipments = [
    //   { equipmentName: 'CNC Machine', category: 'machinery', quantity: 2, rate: 50000, ... },
    //   { equipmentName: 'Laptop', category: 'electronics', quantity: 5, rate: 80000, ... },
    // ]
  }
};
```

### Conditional Fields

```tsx
const conditionalForm: DynamicFormConfig = {
  id: 'conditional-form',
  steps: [
    {
      id: 'main',
      title: 'Conditional Example',
      sections: [
        {
          id: 'main-section',
          title: 'Main',
          columns: 2,
          fields: [
            {
              name: 'userType',
              label: 'User Type',
              type: 'radio',
              options: [
                { label: 'Individual', value: 'individual' },
                { label: 'Company', value: 'company' },
              ]
            },
            {
              name: 'companyName',
              label: 'Company Name',
              type: 'text',
              dependsOn: {
                field: 'userType',
                value: 'company',
                show: true
              }
            },
            {
              name: 'gstNumber',
              label: 'GST Number',
              type: 'text',
              dependsOn: {
                field: 'userType',
                value: 'company',
                show: true
              }
            }
          ]
        }
      ]
    }
  ],
  onSubmit: async (data) => console.log(data)
};
```

### With Default Values

```tsx
function EditForm({ existingData }) {
  const config: DynamicFormConfig = {
    // ... config
  };

  return (
    <DynamicForm 
      config={config} 
      defaultValues={{
        firstName: existingData.firstName,
        lastName: existingData.lastName,
        email: existingData.email,
      }}
    />
  );
}
```

## Validation

Uses react-hook-form validation rules:

```tsx
// Required field
validation: { required: 'This field is required' }

// Min/Max length
validation: {
  minLength: { value: 3, message: 'Must be at least 3 characters' },
  maxLength: { value: 50, message: 'Cannot exceed 50 characters' }
}

// Pattern (regex)
validation: {
  pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format' }
}

// Custom validation
validation: {
  validate: (value) => {
    if (value < 18) return 'Must be 18 or older';
    return true;
  }
}
```

## Styling

The component uses Tailwind CSS classes. You can customize by:

1. Adding className to the config
2. Overriding default styles in your CSS
3. Using the colSpan property for field width

## File Structure

```
src/components/ui/DynamicForm/
├── index.ts           # Main exports
├── types.ts           # TypeScript interfaces
├── DynamicForm.tsx    # Main form component
├── FormSection.tsx    # Section component
├── FormField.tsx      # Individual field component
├── AddMoreField.tsx   # Add More table field component
├── StepIndicator.tsx  # Step progress indicator
└── README.md          # This documentation
```

## Best Practices

1. **Use unique IDs** for steps, sections, and fields
2. **Group related fields** into sections
3. **Provide helpful validation messages**
4. **Use appropriate field types** (email for emails, tel for phones)
5. **Consider mobile responsiveness** with column settings
6. **Add help text** for complex fields
