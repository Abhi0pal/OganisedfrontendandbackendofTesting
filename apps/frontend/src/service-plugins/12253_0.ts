import type { ServiceFormPlugin } from './_types';
const TYPE_OF_MODIFICATION = 'UK-FCL-03732_0';
const UPDATED_ADDRESS_DETAILS = 'UK-FCL-03736_0';
const UPDATED_EMAIL_ID = 'UK-FCL-03737_0';
const UPDATED_MOBILE_NUMBER = 'UK-FCL-03738_0';
const UPDATED_AREA_OF_OPERATION = 'UK-FCL-03739_0';
const CONDITIONAL_FIELDS = [
  UPDATED_ADDRESS_DETAILS,
  UPDATED_EMAIL_ID,
  UPDATED_MOBILE_NUMBER,
  UPDATED_AREA_OF_OPERATION,
];
function matches(value: unknown, expected: string): boolean {
  return String(value ?? '').trim().toLowerCase() === expected.toLowerCase();
}
const plugin: ServiceFormPlugin = {
  isFieldVisible(fieldCode, values) {
    if (!CONDITIONAL_FIELDS.includes(fieldCode)) {
      return undefined;
    }
    const modificationType = values[TYPE_OF_MODIFICATION];
    if (matches(modificationType, 'Change in Address')) {
      return fieldCode === UPDATED_ADDRESS_DETAILS;
    }
    if (matches(modificationType, 'Change in Contact Details')) {
      return fieldCode === UPDATED_EMAIL_ID || fieldCode === UPDATED_MOBILE_NUMBER;
    }
    if (matches(modificationType, 'Change in Area of Operation')) {
      return fieldCode === UPDATED_AREA_OF_OPERATION;
    }
    // If no expected value is selected yet, keep all dependent fields hidden.
    return false;
  },
};
export default plugin;