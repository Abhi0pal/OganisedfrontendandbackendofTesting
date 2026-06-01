export type InputType =
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
  | 'multiselect'
  | 'addmore';

export const INPUT_TYPE_OPTIONS: Array<{ label: string; value: InputType }> = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Number', value: 'number' },
  { label: 'Telephone', value: 'tel' },
  { label: 'URL', value: 'url' },
  { label: 'Date', value: 'date' },
  { label: 'Datetime', value: 'datetime-local' },
  { label: 'Time', value: 'time' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Select (Dropdown)', value: 'select' },
  { label: 'MUlti Select (Dropdown)', value: 'multiselect' },
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'File Upload', value: 'file' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Custom', value: 'custom' },
  { label: 'Add More (Repeatable)', value: 'addmore' },
];

export const OPTION_CAPABLE_TYPES: InputType[] = ['select', 'radio', 'checkbox', 'multiselect'];