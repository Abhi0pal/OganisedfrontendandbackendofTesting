export function parseBooleanRule(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'n', 'no'].includes(normalized)) return false;
  if (['true', '1', 'y', 'yes'].includes(normalized)) return true;
  return fallback;
}

type RuntimeFieldLike = {
  field_code?: unknown;
  input_type?: unknown;
  type?: unknown;
  validation_rule?: unknown;
};

function parseRuleObject(input: unknown): Record<string, unknown> {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof input === 'object' ? { ...(input as Record<string, unknown>) } : {};
}

export function isAadhaarVerhoeffEnabled(rules: unknown): boolean {
  const ruleMap = parseRuleObject(rules);
  return parseBooleanRule(
    ruleMap.aadhaar_verhoeff ??
      ruleMap.aadhaarVerhoeff ??
      ruleMap.enable_aadhaar_verhoeff ??
      ruleMap.enableAadhaarVerhoeff,
    false,
  );
}

export function isCurrentDateDefaultEnabled(rules: unknown): boolean {
  const ruleMap = parseRuleObject(rules);
  return parseBooleanRule(
    ruleMap.default_current_date ??
      ruleMap.defaultCurrentDate ??
      ruleMap.default_to_current_date ??
      ruleMap.defaultToCurrentDate,
    false,
  );
}

export function getCurrentDateDefaultValue(inputType: string): Date | null {
  const normalizedType = String(inputType || '').toLowerCase().trim();
  if (!['date', 'datetime-local'].includes(normalizedType)) return null;

  const now = new Date();
  if (normalizedType === 'date') {
    now.setHours(0, 0, 0, 0);
  }
  return now;
}

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
] as const;

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaarNumber(value: unknown): boolean {
  const digits = String(value ?? '').replace(/\s+/g, '');
  if (!/^[2-9][0-9]{11}$/.test(digits)) return false;

  let checksum = 0;
  const reversedDigits = digits.split('').reverse().map((digit) => Number(digit));
  for (let index = 0; index < reversedDigits.length; index += 1) {
    checksum = VERHOEFF_D[checksum][VERHOEFF_P[index % 8][reversedDigits[index]]];
  }

  return checksum === 0;
}

export function getFieldDefaultValue(field: RuntimeFieldLike): Date | null {
  const rules = parseRuleObject(field?.validation_rule);
  if (!isCurrentDateDefaultEnabled(rules)) return null;
  return getCurrentDateDefaultValue(String(field?.input_type || field?.type || ''));
}

export function buildDefaultValuesForFields(fields: RuntimeFieldLike[]): Record<string, string | Date> {
  const defaults: Record<string, string | Date> = {};
  for (const field of fields || []) {
    const fieldCode = String(field?.field_code || '').trim();
    if (!fieldCode) continue;
    const value = getFieldDefaultValue(field);
    if (value) {
      // Format date as dd/MM/yyyy string for consistent form value handling
      const inputType = String(field?.input_type || field?.type || '').toLowerCase().trim();
      if (inputType === 'date') {
        // Format as dd/MM/yyyy for date input
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        defaults[fieldCode] = `${day}/${month}/${year}`;
      } else if (inputType === 'datetime-local') {
        // Format as dd/MM/yyyy HH:mm for datetime input
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        const hours = String(value.getHours()).padStart(2, '0');
        const minutes = String(value.getMinutes()).padStart(2, '0');
        defaults[fieldCode] = `${day}/${month}/${year} ${hours}:${minutes}`;
      } else {
        defaults[fieldCode] = value;
      }
    }
  }
  return defaults;
}
