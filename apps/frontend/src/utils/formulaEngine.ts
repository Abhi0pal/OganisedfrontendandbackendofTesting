/**
 * Formula Engine — Safe N-Level Expression Evaluator
 *
 * Uses mathjs for safe evaluation (no eval(), no JS injection).
 * Supports: +  -  *  /  ^  %  ()  round  floor  ceil  abs  min  max  sqrt  pow  log
 * Date functions: YEARS(d1,d2)  MONTHS(d1,d2)  DAYS(d1,d2)  AGE(dob)
 * Field tokens: {{fieldCode}}  →  replaced with actual form values before evaluation
 */

import { parse } from 'date-fns';

export type FormulaTrigger = 'onChange' | 'onBlur' | 'onSubmit';
export type FormulaOnError = 'showZero' | 'showBlank' | 'showError';

export type FormulaResultFormat = {
  decimals: number;
  prefix: string;
  suffix: string;
};

export type FormulaConfig = {
  enabled: boolean;
  expression: string;
  trigger: FormulaTrigger;
  resultFormat: FormulaResultFormat;
  onError: FormulaOnError;
};

// ─────────────────────────────────────────────────────────────────────────────
// Date utility helpers (used by preprocessDateFunctions)
// ─────────────────────────────────────────────────────────────────────────────

function _parseDate(val: string | number | null | undefined): Date | null {
  if (val === null || val === undefined || val === '') return null;
  
  const valueStr = String(val).trim();
  
  // Try ISO format first (2026-04-12 or 2026-04-12T...)
  if (valueStr.includes('-') && (valueStr.length === 10 || valueStr.includes('T'))) {
    try {
      const result = new Date(valueStr);
      if (!isNaN(result.getTime())) {
        return result;
      }
    } catch (e) {
      // Fall through to next format
    }
  }
  
  // Try DD/MM/YYYY format (primary — changed from MM/DD/YYYY)
  try {
    const result = parse(valueStr, 'dd/MM/yyyy', new Date());
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Fall through to next format
  }
  
  // Try MM/DD/YYYY format (fallback for older data)
  try {
    const result = parse(valueStr, 'MM/dd/yyyy', new Date());
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Fall through to next format
  }
  
  // Fallback: try JavaScript's Date constructor
  try {
    const result = new Date(valueStr);
    if (!isNaN(result.getTime())) {
      return result;
    }
  } catch (e) {
    // Do nothing
  }
  
  return null;
}

function _yearsBetween(d1: Date, d2: Date): number {
  const [earlier, later] = d1 <= d2 ? [d1, d2] : [d2, d1];
  let years = later.getFullYear() - earlier.getFullYear();
  const monthDiff = later.getMonth() - earlier.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && later.getDate() < earlier.getDate())) years--;
  return Math.max(0, years);
}

function _monthsBetween(d1: Date, d2: Date): number {
  const [earlier, later] = d1 <= d2 ? [d1, d2] : [d2, d1];
  return (later.getFullYear() - earlier.getFullYear()) * 12 + (later.getMonth() - earlier.getMonth());
}

function _daysBetween(d1: Date, d2: Date): number {
  return Math.abs(Math.floor((d2.getTime() - d1.getTime()) / 86_400_000));
}

/**
 * Check whether a formula expression contains any date functions.
 * Used by the UI to decide whether to show date-type test inputs.
 */
export function formulaHasDateFunctions(expression: string): boolean {
  return /\b(YEARS|MONTHS|DAYS|AGE)\s*\(/.test(expression);
}

/**
 * Pre-process date functions in an expression before passing to mathjs.
 *
 * Supported:
 *   YEARS({{field1}}, {{field2}})  →  integer years between two dates
 *   MONTHS({{field1}}, {{field2}}) →  integer months between two dates
 *   DAYS({{field1}}, {{field2}})   →  integer days between two dates
 *   AGE({{dob}})                   →  years from dob to today
 *
 * Tokens can also be bare quoted strings, e.g. YEARS('2000-01-01', '2025-01-01')
 */
export function preprocessDateFunctions(
  expression: string,
  fieldValues: Record<string, string | number>,
): string {
  // Resolves a single argument: either {{code}} or 'literal' or "literal"
  const resolve = (token: string): string => {
    const m = token.match(/^\{\{([^}]+)\}\}$/);
    if (m) return String(fieldValues[m[1].trim()] ?? '');
    return token.replace(/^['"]|['"]$/g, '');
  };

  // Matches: {{token}}, 'string', or "string"
  const T = `(?:\\{\\{[^}]+\\}\\}|'[^']*'|"[^"]*")`;

  let result = expression;

  // YEARS(d1, d2)
  result = result.replace(
    new RegExp(`YEARS\\s*\\(\\s*(${T})\\s*,\\s*(${T})\\s*\\)`, 'g'),
    (_, a: string, b: string) => {
      const d1 = _parseDate(resolve(a));
      const d2 = _parseDate(resolve(b));
      return d1 && d2 ? String(_yearsBetween(d1, d2)) : '0';
    },
  );

  // MONTHS(d1, d2)
  result = result.replace(
    new RegExp(`MONTHS\\s*\\(\\s*(${T})\\s*,\\s*(${T})\\s*\\)`, 'g'),
    (_, a: string, b: string) => {
      const d1 = _parseDate(resolve(a));
      const d2 = _parseDate(resolve(b));
      return d1 && d2 ? String(_monthsBetween(d1, d2)) : '0';
    },
  );

  // DAYS(d1, d2)
  result = result.replace(
    new RegExp(`DAYS\\s*\\(\\s*(${T})\\s*,\\s*(${T})\\s*\\)`, 'g'),
    (_, a: string, b: string) => {
      const d1 = _parseDate(resolve(a));
      const d2 = _parseDate(resolve(b));
      return d1 && d2 ? String(_daysBetween(d1, d2)) : '0';
    },
  );

  // AGE(dob)  — years from dob to today
  result = result.replace(
    new RegExp(`AGE\\s*\\(\\s*(${T})\\s*\\)`, 'g'),
    (_, a: string) => {
      const d1 = _parseDate(resolve(a));
      return d1 ? String(_yearsBetween(d1, new Date())) : '0';
    },
  );

  return result;
}

/**
 * Extract all unique {{fieldCode}} tokens from a formula expression.
 * Example: "({{A}} + {{B}}) * {{A}}"  →  ["A", "B"]
 */
export function extractFieldTokens(expression: string): string[] {
  const matches = expression.match(/\{\{([^}]+)\}\}/g) ?? [];
  const unique = [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
  return unique.filter(Boolean);
}

/**
 * Build a preview string of the formula with field labels substituted.
 * Example: "{{UK-FCL-00010_0}} + {{UK-FCL-00011_0}}"
 *       →  "[Area] + [Extra Area]"
 */
export function buildFormulaPreview(
  expression: string,
  fieldLabelMap: Record<string, string>,
): string {
  return expression.replace(/\{\{([^}]+)\}\}/g, (_, code) => {
    const trimmed = code.trim();
    return `[${fieldLabelMap[trimmed] ?? trimmed}]`;
  });
}

/**
 * Format a numeric result according to the result format config.
 */
export function formatResult(value: number, format: Partial<FormulaResultFormat>): string {
  const decimals = format.decimals ?? 2;
  const prefix = format.prefix ?? '';
  const suffix = format.suffix ?? '';
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

/**
 * Safely evaluate a formula expression with given field values.
 *
 * Steps:
 *  1. Extract {{fieldCode}} tokens → map to safe variable names (f0_, f1_, ...)
 *  2. Build a scope object with numeric values
 *  3. Call mathjs evaluate(expr, scope)
 *  4. Return result or error
 *
 * Returns: { value, formatted, error }
 */
export async function evaluateFormula(
  expression: string,
  fieldValues: Record<string, string | number>,
  format?: Partial<FormulaResultFormat>,
): Promise<{ value: number | null; formatted: string; error: string | null }> {
  if (!expression.trim()) {
    return { value: null, formatted: '', error: null };
  }

  try {
    // Dynamic import to avoid SSR issues and keep initial bundle light
    const { evaluate } = await import('mathjs');

    // Step 1: resolve date functions (YEARS, MONTHS, DAYS, AGE) before mathjs sees them
    const withDates = preprocessDateFunctions(expression, fieldValues);

    // Step 2: replace remaining {{tokens}} (numeric fields) with safe var names
    const tokenMap = new Map<string, string>();
    const scope: Record<string, number> = {};
    let expr = withDates;

    const tokens = withDates.match(/\{\{([^}]+)\}\}/g) ?? [];
    tokens.forEach((token) => {
      if (!tokenMap.has(token)) {
        const fieldCode = token.slice(2, -2).trim();
        const varName = `_fv${tokenMap.size}`;
        tokenMap.set(token, varName);
        const raw = fieldValues[fieldCode];
        scope[varName] = parseFloat(String(raw ?? 0)) || 0;
      }
    });

    // Replace all tokens in expression
    tokenMap.forEach((varName, token) => {
      // Use split/join to avoid regex issues with special chars in fieldCode
      expr = expr.split(token).join(varName);
    });

    const raw = evaluate(expr, scope);
    const numResult = Number(raw);

    if (!isFinite(numResult) || isNaN(numResult)) {
      return { value: null, formatted: '', error: 'Result is not a finite number (check for division by zero)' };
    }

    return {
      value: numResult,
      formatted: formatResult(numResult, format ?? {}),
      error: null,
    };
  } catch (err: any) {
    return {
      value: null,
      formatted: '',
      error: String(err?.message ?? 'Invalid formula expression'),
    };
  }
}

// Module-level cache for the mathjs evaluate function.
// Populated by evaluateFormula() on first call. Used by evaluateFormulaSync().
let _cachedEvaluate: ((expr: string, scope: Record<string, number>) => unknown) | null = null;

/**
 * Pre-load mathjs asynchronously and cache the evaluate function.
 * Call this once in a useEffect so evaluateFormulaSync works immediately after.
 */
export async function preloadMathjs(): Promise<void> {
  if (_cachedEvaluate) return;
  const { evaluate } = await import('mathjs');
  _cachedEvaluate = evaluate as (expr: string, scope: Record<string, number>) => unknown;
}

/**
 * Synchronous version for cases where async is not practical.
 * Requires preloadMathjs() or evaluateFormula() to have been called first.
 * Falls back gracefully if mathjs is not yet loaded.
 */
export function evaluateFormulaSync(
  expression: string,
  fieldValues: Record<string, string | number>,
  format?: Partial<FormulaResultFormat>,
): { value: number | null; formatted: string; error: string | null } {
  if (!expression.trim()) return { value: null, formatted: '', error: null };

  const evaluate = _cachedEvaluate;
  if (!evaluate) {
    // mathjs not loaded yet — return silent empty (will update once loaded)
    return { value: null, formatted: '', error: null };
  }

  try {
    // Step 1: resolve date functions (YEARS, MONTHS, DAYS, AGE) before mathjs sees them
    const withDates = preprocessDateFunctions(expression, fieldValues);

    // Step 2: replace remaining {{tokens}} (numeric fields) with safe var names
    const tokenMap = new Map<string, string>();
    const scope: Record<string, number> = {};
    let expr = withDates;

    const tokens = withDates.match(/\{\{([^}]+)\}\}/g) ?? [];
    tokens.forEach((token) => {
      if (!tokenMap.has(token)) {
        const fieldCode = token.slice(2, -2).trim();
        const varName = `_fv${tokenMap.size}`;
        tokenMap.set(token, varName);
        scope[varName] = parseFloat(String(fieldValues[fieldCode] ?? 0)) || 0;
      }
    });

    tokenMap.forEach((varName, token) => {
      expr = expr.split(token).join(varName);
    });

    const raw = evaluate(expr, scope);
    const numResult = Number(raw);

    if (!isFinite(numResult) || isNaN(numResult)) {
      return { value: null, formatted: '', error: 'Result is not a finite number (check for division by zero)' };
    }

    return {
      value: numResult,
      formatted: formatResult(numResult, format ?? {}),
      error: null,
    };
  } catch (err: unknown) {
    return {
      value: null,
      formatted: '',
      error: String((err as Error)?.message ?? 'Invalid formula expression'),
    };
  }
}

/** Default empty formula config */
export const DEFAULT_FORMULA_CONFIG: FormulaConfig = {
  enabled: false,
  expression: '',
  trigger: 'onChange',
  resultFormat: { decimals: 2, prefix: '', suffix: '' },
  onError: 'showZero',
};

/** Operator buttons config for UI */
export const FORMULA_OPERATORS = [
  { label: '+', insert: ' + ', title: 'Addition' },
  { label: '−', insert: ' - ', title: 'Subtraction' },
  { label: '×', insert: ' * ', title: 'Multiplication' },
  { label: '÷', insert: ' / ', title: 'Division' },
  { label: '(', insert: '(', title: 'Open Parenthesis' },
  { label: ')', insert: ')', title: 'Close Parenthesis' },
  { label: '^', insert: ' ^ ', title: 'Power / Exponent' },
  { label: '%', insert: ' % ', title: 'Modulo (Remainder)' },
];

/** Function buttons config for UI */
export const FORMULA_FUNCTIONS = [
  { label: 'ROUND(n, d)', insert: 'round(, 2)', title: 'Round to d decimal places' },
  { label: 'FLOOR(n)', insert: 'floor()', title: 'Round down to nearest integer' },
  { label: 'CEIL(n)', insert: 'ceil()', title: 'Round up to nearest integer' },
  { label: 'ABS(n)', insert: 'abs()', title: 'Absolute value' },
  { label: 'MIN(a, b)', insert: 'min(, )', title: 'Minimum of two values' },
  { label: 'MAX(a, b)', insert: 'max(, )', title: 'Maximum of two values' },
  { label: 'SQRT(n)', insert: 'sqrt()', title: 'Square root' },
  { label: 'POW(b, e)', insert: 'pow(, )', title: 'Power: base ^ exponent' },
  { label: 'LOG(n)', insert: 'log()', title: 'Natural logarithm' },
  { label: 'LOG10(n)', insert: 'log(, 10)', title: 'Base-10 logarithm' },
  // ── Date functions ────────────────────────────────────────────────────────
  { label: 'YEARS(d1, d2)', insert: 'YEARS(, )', title: 'Years between two dates — use {{fieldCode}} for date fields', isDate: true },
  { label: 'MONTHS(d1, d2)', insert: 'MONTHS(, )', title: 'Months between two dates', isDate: true },
  { label: 'DAYS(d1, d2)', insert: 'DAYS(, )', title: 'Days between two dates', isDate: true },
  { label: 'AGE(dob)', insert: 'AGE()', title: 'Age in completed years from Date of Birth to today', isDate: true },
];
