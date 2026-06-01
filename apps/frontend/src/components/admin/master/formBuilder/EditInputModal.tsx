import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import apiClient from '@/lib/api-client';
import { useFormFields } from '@/hooks/master/useFormFields';
import { isValidAadhaarNumber } from '@/utils/formFieldRuntime';
import {
  extractFieldTokens,
  evaluateFormulaSync,
  preloadMathjs,
  formulaHasDateFunctions,
  FORMULA_OPERATORS,
  FORMULA_FUNCTIONS,
  type FormulaTrigger,
  type FormulaOnError,
} from '@/utils/formulaEngine';

const INPUT_TYPES = [
  { label: 'Text Input', value: 'text' },
  { label: 'Select (Dropdown)', value: 'select' },
  { label: 'Multi-Select', value: 'multiselect' },
  { label: 'Number', value: 'number' },
  { label: 'Date Picker', value: 'date' },
  { label: 'Date & Time Picker', value: 'datetime-local' },
  { label: 'Time Picker', value: 'time' },
  { label: 'Email', value: 'email' },
  { label: 'Phone / Mobile', value: 'tel' },
  { label: 'File Upload', value: 'file' },
  { label: 'Radio Button', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Text Area', value: 'textarea' },
  { label: 'Add More (Repeating Group)', value: 'addmore' },
  { label: 'Button', value: 'button' },
];

const DATE_INPUT_TYPES = ['date', 'datetime-local'];

const isDateInputType = (value: string) =>
  DATE_INPUT_TYPES.includes(String(value || '').toLowerCase().trim());

const parseBooleanRule = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'n', 'no'].includes(normalized)) return false;
  if (['true', '1', 'y', 'yes'].includes(normalized)) return true;
  return fallback;
};

const GRID_OPTIONS = [
  { label: 'Full Width (12/12)', value: 12 },
  { label: 'Half Width (6/12)', value: 6 },
  { label: 'One Third (4/12)', value: 4 },
  { label: 'Two Thirds (8/12)', value: 8 },
  { label: 'Quarter (3/12)', value: 3 },
];

const FILE_ACCEPT_OPTIONS = [
  { label: 'PDF (.pdf)', value: '.pdf' },
  { label: 'JPG (.jpg)', value: '.jpg' },
  { label: 'JPEG (.jpeg)', value: '.jpeg' },
  { label: 'PNG (.png)', value: '.png' },
  { label: 'Excel (.xls)', value: '.xls' },
  { label: 'Excel (.xlsx)', value: '.xlsx' },
  { label: 'Word (.doc)', value: '.doc' },
  { label: 'Word (.docx)', value: '.docx' },
  { label: 'CSV (.csv)', value: '.csv' },
];

const RULE_OPERATOR_OPTIONS = [
  { label: 'Contains (In)', value: 'in' },
  { label: 'Not In', value: 'not_in' },
  { label: 'Equals (=)', value: 'equals' },
  { label: 'Not Equals (!=)', value: 'not_equals' },
  { label: 'Is Empty', value: 'is_empty' },
  { label: 'Is Not Empty', value: 'is_not_empty' },
];
const TEXT_API_METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
];

type RuleFieldOption = { label: string; value: string };
type Props = {
  open: boolean;
  row: any;
  locale: string;
  onClose: () => void;
  onSaved: () => void;
  availableRuleFields?: RuleFieldOption[];
  currentRuleFieldCode?: string;
  tenantId?: number | null;
  projectId?: number | null;
};

const safeParseJson = (input: any) => {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
  }
  if (typeof input === 'object') return input;
  return {};
};

const parseRuleValueForSave = (operator: string, rawValue: string) => {
  if (operator === 'is_empty' || operator === 'is_not_empty') return '';
  if (operator === 'in' || operator === 'not_in') {
    return rawValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return rawValue.trim();
};

const resolveFieldCode = (obj: any): string => {
  return String(
    obj?.field_code ??
    obj?.fieldCode ??
    obj?.formchk_id ??
    obj?.form_check_id ??
    obj?.formCheckId ??
    '',
  ).trim();
};

const normalizeLooseCode = (value: string): string =>
  String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/0+/g, '');

const reconcileCodeWithOptions = (
  rawCode: string,
  options: Array<{ value: string; label: string }>,
): string => {
  const code = String(rawCode || '').trim();
  if (!code) return '';
  const exact = options.find((o) => String(o.value) === code);
  if (exact) return exact.value;

  const addZeroBeforeSuffix = code.replace(/_(\d+)$/, '0_$1');
  const byInsertedZero = options.find((o) => String(o.value) === addZeroBeforeSuffix);
  if (byInsertedZero) return byInsertedZero.value;

  const loose = normalizeLooseCode(code);
  if (!loose) return code;
  const looseCandidates = options.filter((o) => normalizeLooseCode(String(o.value)) === loose);
  if (looseCandidates.length === 1) return looseCandidates[0].value;
  if (looseCandidates.length > 1) {
    return looseCandidates.sort(
      (a, b) => Math.abs(String(a.value).length - code.length) - Math.abs(String(b.value).length - code.length),
    )[0].value;
  }

  return code;
};

export function EditInputModal({
  open,
  row,
  locale,
  onClose,
  onSaved,
  availableRuleFields = [],
  currentRuleFieldCode,
  tenantId,
}: Props) {
  const editingLang = String(locale || 'en').toLowerCase().startsWith('hi') ? 'HI' : 'EN';
  const [loading, setLoading] = useState(false);
  const { data: allFields = [] } = useFormFields();

  // ✅ User assignment state
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [tenantUsers, setTenantUsers] = useState<{ id: number; email: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formFieldId, setFormFieldId] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [helpText, setHelpText] = useState('');
  const [inputType, setInputType] = useState('text');
  const [gridSpan, setGridSpan] = useState(12);
  const [preference, setPreference] = useState(0);
  const [isRequired, setIsRequired] = useState(false);
  const [isReadonly, setIsReadonly] = useState(false);
  const [minLength, setMinLength] = useState<number | null>(null);
  const [maxLength, setMaxLength] = useState<number | null>(null);
  const [regex, setRegex] = useState('');
  const [regexTestValue, setRegexTestValue] = useState('');
  const [enableAadhaarVerhoeff, setEnableAadhaarVerhoeff] = useState(false);
  const [allowFutureDate, setAllowFutureDate] = useState(true);
  const [allowPreviousDate, setAllowPreviousDate] = useState(true);
  const [defaultCurrentDate, setDefaultCurrentDate] = useState(false);
  const [fileMimeTypes, setFileMimeTypes] = useState<string[]>([]);

  const [enableRequiredAnyOfRule, setEnableRequiredAnyOfRule] = useState(false);
  const [requiredAnyOfFields, setRequiredAnyOfFields] = useState<string[]>([]);
  const [requiredAnyOfWhenField, setRequiredAnyOfWhenField] = useState('');
  const [requiredAnyOfWhenOperator, setRequiredAnyOfWhenOperator] = useState('in');
  const [requiredAnyOfWhenValue, setRequiredAnyOfWhenValue] = useState('');
  const [requiredAnyOfMessage, setRequiredAnyOfMessage] = useState(
    'Please enter at least one value.',
  );
  const [extraAdvancedRules, setExtraAdvancedRules] = useState<any>({});
  const [enableTextApiPrefill, setEnableTextApiPrefill] = useState(false);
  const [textApiUrl, setTextApiUrl] = useState('');
  const [textApiMethod, setTextApiMethod] = useState<'GET' | 'POST'>('GET');
  const [textApiTriggerField, setTextApiTriggerField] = useState('');
  const [textApiResponsePath, setTextApiResponsePath] = useState('');
  const [textApiValueKey, setTextApiValueKey] = useState('');
  const [textApiOverwrite, setTextApiOverwrite] = useState(false);
  const [textApiMappings, setTextApiMappings] = useState<
    Array<{ targetField: string; responsePath: string; valueKey: string }>
  >([]);
  const [extraComponentProps, setExtraComponentProps] = useState<any>({});

  // ── Section 6: Calculation Formula ──────────────────────────────────────
  const [enableFormula, setEnableFormula] = useState(false);
  const [formulaExpression, setFormulaExpression] = useState('');
  const [formulaTrigger, setFormulaTrigger] = useState<FormulaTrigger>('onChange');
  const [formulaDecimals, setFormulaDecimals] = useState(2);
  const [formulaPrefix, setFormulaPrefix] = useState('');
  const [formulaSuffix, setFormulaSuffix] = useState('');
  const [formulaOnError, setFormulaOnError] = useState<FormulaOnError>('showZero');
  const [formulaInsertField, setFormulaInsertField] = useState('');
  const [formulaTestValues, setFormulaTestValues] = useState<Record<string, string>>({});
  const formulaTextareaRef = useRef<HTMLTextAreaElement>(null);

  const masterFieldOptions = useMemo(() => {
    return (allFields || []).map((f: any) => ({
      label: `${f.name || f.field_label || 'Unknown'} (${resolveFieldCode(f) || f.id})`,
      value: f.id,
    }));
  }, [allFields]);

  const fieldCodeOptions = useMemo(() => {
    if (Array.isArray(availableRuleFields) && availableRuleFields.length > 0) {
      return availableRuleFields;
    }
    return (allFields || [])
      .map((f: any) => {
        const code = resolveFieldCode(f);
        if (!code) return null;
        return {
          label: `${f.name || f.field_label || 'Unknown'} (${code})`,
          value: code,
        };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [allFields, availableRuleFields]);

  const textApiTriggerOptions = useMemo(() => {
    return [
      { label: '-- No Trigger (Blank) --', value: '' },
      ...fieldCodeOptions,
    ];
  }, [fieldCodeOptions]);

  const currentFieldCode = useMemo(() => {
    const fromProp = String(currentRuleFieldCode || '').trim();
    if (fromProp) return fromProp;
    const fromRow = resolveFieldCode(row);
    if (fromRow) return fromRow;
    const matched = (allFields || []).find(
      (f: any) => Number(f?.id) === Number(row?.form_field_id ?? row?.formFieldId),
    );
    return resolveFieldCode(matched);
  }, [allFields, row, currentRuleFieldCode]);

  // Extract unique field codes referenced in formula
  const formulaFields = useMemo(
    () => (enableFormula && formulaExpression ? extractFieldTokens(formulaExpression) : []),
    [enableFormula, formulaExpression],
  );

  // Live test result
  const formulaLiveResult = useMemo(() => {
    if (!enableFormula || !formulaExpression.trim() || formulaFields.length === 0) {
      return { value: null, formatted: '', error: null };
    }
    return evaluateFormulaSync(formulaExpression, formulaTestValues, {
      decimals: formulaDecimals,
      prefix: formulaPrefix,
      suffix: formulaSuffix,
    });
  }, [enableFormula, formulaExpression, formulaTestValues, formulaDecimals, formulaPrefix, formulaSuffix, formulaFields]);

  const requiredAnyOfPreviewJson = useMemo(() => {
    if (!enableRequiredAnyOfRule) return '';
    const payload = {
      required_any_of: {
        fields: requiredAnyOfFields,
        when: {
          field: requiredAnyOfWhenField,
          operator: requiredAnyOfWhenOperator,
          value: parseRuleValueForSave(requiredAnyOfWhenOperator, requiredAnyOfWhenValue),
        },
        message: requiredAnyOfMessage || 'Please enter at least one value.',
      },
    };
    return JSON.stringify(payload, null, 2);
  }, [
    enableRequiredAnyOfRule,
    requiredAnyOfFields,
    requiredAnyOfWhenField,
    requiredAnyOfWhenOperator,
    requiredAnyOfWhenValue,
    requiredAnyOfMessage,
  ]);

  // Pre-load mathjs so evaluateFormulaSync works synchronously
  useEffect(() => { preloadMathjs(); }, []);

  // ✅ Fetch tenant users for user assignment dropdown
  useEffect(() => {
    if (!open || !tenantId) { setTenantUsers([]); return; }
    setLoadingUsers(true);
    apiClient.get('/users', { params: { tenant_id: tenantId, user_type: 'DEPARTMENT' } })
      .then((res) => {
        const users = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setTenantUsers(users.map((u: any) => ({ id: Number(u.id), email: u.email || '' })).filter((u: any) => u.email));
      })
      .catch(() => setTenantUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [open, tenantId]);

  useEffect(() => {
    if (!open || !row) return;

    // ✅ Initialize user assignment
    setAssignedUserId(row.user_id || null);

    setFormFieldId(row.form_field_id);
    setCustomLabel(row.custom_label || '');
    setPlaceholder(row.placeholder || '');
    setHelpText(row.help_text || '');
    setInputType(String(row.input_type || 'text').toLowerCase().trim());
    setGridSpan(row.grid_span || 12);
    setPreference(row.preference || 0);
    setIsRequired(row.is_required === 'Y');
    setIsReadonly(row.is_readonly === 'Y');

    const rules = safeParseJson(row.validation_rule);
    const componentProps = safeParseJson(row.component_props);
    setMinLength(rules.min_length ?? null);
    setMaxLength(rules.max_length ?? null);
    setRegex(
      row.pattern !== undefined && row.pattern !== null
        ? String(row.pattern)
        : String(rules.regex ?? ''),
    );
    setRegexTestValue('');
    setEnableAadhaarVerhoeff(
      parseBooleanRule(
        rules.aadhaar_verhoeff ??
          rules.aadhaarVerhoeff ??
          rules.enable_aadhaar_verhoeff ??
          rules.enableAadhaarVerhoeff,
        false,
      ),
    );
    setAllowFutureDate(parseBooleanRule(rules.allow_future_date ?? rules.allowFutureDate, true));
    setAllowPreviousDate(
      parseBooleanRule(rules.allow_previous_date ?? rules.allowPreviousDate, true),
    );
    setDefaultCurrentDate(
      parseBooleanRule(
        rules.default_current_date ??
          rules.defaultCurrentDate ??
          rules.default_to_current_date ??
          rules.defaultToCurrentDate,
        false,
      ),
    );

    const acceptStr = rules.accept ?? '';
    setFileMimeTypes(
      String(acceptStr)
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    );

    const extractedRequiredAnyOf =
      rules?.required_any_of || rules?.conditional_any_of || rules?.at_least_one_of;

    if (extractedRequiredAnyOf && typeof extractedRequiredAnyOf === 'object') {
      setEnableRequiredAnyOfRule(true);
      setRequiredAnyOfFields(
        Array.isArray(extractedRequiredAnyOf.fields)
          ? extractedRequiredAnyOf.fields.map((v: any) =>
            reconcileCodeWithOptions(String(v), fieldCodeOptions),
          )
          : [],
      );
      setRequiredAnyOfWhenField(
        reconcileCodeWithOptions(
          String(extractedRequiredAnyOf?.when?.field || currentFieldCode),
          fieldCodeOptions,
        ),
      );
      setRequiredAnyOfWhenOperator(String(extractedRequiredAnyOf?.when?.operator || 'in'));
      const rawWhenValue = extractedRequiredAnyOf?.when?.value;
      setRequiredAnyOfWhenValue(
        Array.isArray(rawWhenValue)
          ? rawWhenValue.map((v: any) => String(v)).join(', ')
          : String(rawWhenValue ?? ''),
      );
      setRequiredAnyOfMessage(
        String(extractedRequiredAnyOf?.message || 'Please enter at least one value.'),
      );
    } else {
      setEnableRequiredAnyOfRule(false);
      setRequiredAnyOfFields([]);
      setRequiredAnyOfWhenField(reconcileCodeWithOptions(currentFieldCode, fieldCodeOptions));
      setRequiredAnyOfWhenOperator('in');
      setRequiredAnyOfWhenValue('');
      setRequiredAnyOfMessage('Please enter at least one value.');
    }

    const preservedRules = { ...rules };
    delete preservedRules.regex;
    delete preservedRules.required_any_of;
    delete preservedRules.conditional_any_of;
    delete preservedRules.at_least_one_of;
    delete preservedRules.allow_future_date;
    delete preservedRules.allowFutureDate;
    delete preservedRules.allow_previous_date;
    delete preservedRules.allowPreviousDate;
    delete preservedRules.aadhaar_verhoeff;
    delete preservedRules.aadhaarVerhoeff;
    delete preservedRules.enable_aadhaar_verhoeff;
    delete preservedRules.enableAadhaarVerhoeff;
    delete preservedRules.default_current_date;
    delete preservedRules.defaultCurrentDate;
    delete preservedRules.default_to_current_date;
    delete preservedRules.defaultToCurrentDate;
    setExtraAdvancedRules(preservedRules);

    const textApi =
      componentProps?.textApi ||
      componentProps?.text_api ||
      componentProps?.autoFetch ||
      componentProps?.autofill ||
      componentProps?.prefill ||
      null;
    if (textApi && typeof textApi === 'object') {
      setEnableTextApiPrefill(true);
      setTextApiUrl(String(textApi.apiUrl ?? textApi.api_url ?? ''));
      const method = String(textApi.method ?? 'GET').toUpperCase();
      setTextApiMethod(method === 'POST' ? 'POST' : 'GET');
      setTextApiTriggerField(String(textApi.triggerField ?? textApi.trigger_field ?? ''));
      setTextApiResponsePath(String(textApi.responsePath ?? textApi.response_path ?? ''));
      setTextApiValueKey(String(textApi.valueKey ?? textApi.value_key ?? ''));
      setTextApiOverwrite(Boolean(textApi.overwrite));
      const rawMappings = Array.isArray(textApi.mappings) ? textApi.mappings : [];
      const legacyResponsePath = String(textApi.responsePath ?? textApi.response_path ?? '');
      const legacyValueKey = String(textApi.valueKey ?? textApi.value_key ?? '');
      if (rawMappings.length > 0) {
        setTextApiMappings(
          rawMappings.map((m: any) => ({
            targetField: String(
              m?.targetField ??
              m?.target_field ??
              m?.targetFieldCode ??
              m?.target_field_code ??
              m?.field ??
              '',
            ),
            responsePath: String(m?.responsePath ?? m?.response_path ?? ''),
            valueKey: String(m?.valueKey ?? m?.value_key ?? ''),
          })),
        );
      } else {
        setTextApiMappings(
          legacyValueKey
            ? [
              {
                targetField: String(currentFieldCode || ''),
                responsePath: legacyResponsePath,
                valueKey: legacyValueKey,
              },
            ]
            : [],
        );
      }
    } else {
      setEnableTextApiPrefill(false);
      setTextApiUrl('');
      setTextApiMethod('GET');
      setTextApiTriggerField('');
      setTextApiResponsePath('');
      setTextApiValueKey('');
      setTextApiOverwrite(false);
      setTextApiMappings([]);
    }

    // Load formula config
    const formula = componentProps?.formula;
    if (formula?.enabled) {
      setEnableFormula(true);
      setFormulaExpression(String(formula.expression ?? ''));
      setFormulaTrigger((formula.trigger as FormulaTrigger) ?? 'onChange');
      setFormulaDecimals(formula.resultFormat?.decimals ?? 2);
      setFormulaPrefix(formula.resultFormat?.prefix ?? '');
      setFormulaSuffix(formula.resultFormat?.suffix ?? '');
      setFormulaOnError((formula.onError as FormulaOnError) ?? 'showZero');
    } else {
      setEnableFormula(false);
      setFormulaExpression('');
      setFormulaTrigger('onChange');
      setFormulaDecimals(2);
      setFormulaPrefix('');
      setFormulaSuffix('');
      setFormulaOnError('showZero');
    }
    setFormulaTestValues({});
    setFormulaInsertField('');

    const preservedComponentProps = { ...componentProps };
    delete preservedComponentProps.textApi;
    delete preservedComponentProps.text_api;
    delete preservedComponentProps.autoFetch;
    delete preservedComponentProps.autofill;
    delete preservedComponentProps.prefill;
    delete preservedComponentProps.formula;
    setExtraComponentProps(preservedComponentProps);
  }, [open, row, currentFieldCode, fieldCodeOptions]);

  useEffect(() => {
    if (!open || !enableRequiredAnyOfRule) return;
    const available = new Set((fieldCodeOptions || []).map((o) => o.value));
    const reconciledCurrent = reconcileCodeWithOptions(currentFieldCode, fieldCodeOptions);
    if (requiredAnyOfWhenField && available.has(requiredAnyOfWhenField)) return;
    if (reconciledCurrent && available.has(reconciledCurrent)) {
      setRequiredAnyOfWhenField(reconciledCurrent);
    }
  }, [
    open,
    enableRequiredAnyOfRule,
    requiredAnyOfWhenField,
    currentFieldCode,
    fieldCodeOptions,
  ]);

  useEffect(() => {
    if (!open || !enableRequiredAnyOfRule || !Array.isArray(requiredAnyOfFields)) return;
    const reconciled = requiredAnyOfFields
      .map((v) => reconcileCodeWithOptions(String(v), fieldCodeOptions))
      .filter(Boolean);
    const changed =
      reconciled.length !== requiredAnyOfFields.length ||
      reconciled.some((v, i) => v !== requiredAnyOfFields[i]);
    if (changed) setRequiredAnyOfFields(reconciled);
  }, [open, enableRequiredAnyOfRule, requiredAnyOfFields, fieldCodeOptions]);

  // Insert text at current cursor position in formula textarea
  const insertAtCursor = (text: string) => {
    const ta = formulaTextareaRef.current;
    if (!ta) {
      setFormulaExpression((prev) => prev + text);
      return;
    }
    const start = ta.selectionStart ?? formulaExpression.length;
    const end = ta.selectionEnd ?? formulaExpression.length;
    const next = formulaExpression.slice(0, start) + text + formulaExpression.slice(end);
    setFormulaExpression(next);
    // Restore cursor after React re-render
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + text.length;
      ta.selectionEnd = start + text.length;
    }, 0);
  };

  const handleSave = async () => {
    if (!row) return;
    setLoading(true);
    try {
      const generatedAdvancedRules: any = {};
      if (enableRequiredAnyOfRule) {
        if (!requiredAnyOfWhenField) {
          alert('Please select "When Field" for Required Any Of rule.');
          setLoading(false);
          return;
        }
        if (!requiredAnyOfFields.length) {
          alert('Please select at least one target field in "Require At Least One Of".');
          setLoading(false);
          return;
        }
        generatedAdvancedRules.required_any_of = {
          fields: requiredAnyOfFields,
          when: {
            field: requiredAnyOfWhenField,
            operator: requiredAnyOfWhenOperator,
            value: parseRuleValueForSave(requiredAnyOfWhenOperator, requiredAnyOfWhenValue),
          },
          message: requiredAnyOfMessage || 'Please enter at least one value.',
        };
      }

      if (enableTextApiPrefill && !String(textApiUrl || '').trim()) {
        alert('Please enter API URL for Text API Prefill.');
        setLoading(false);
        return;
      }
      if (enableTextApiPrefill) {
        const cleanedMappings = textApiMappings.filter(
          (m) => String(m.targetField || '').trim() && String(m.valueKey || '').trim(),
        );
        if (cleanedMappings.length === 0 && !String(textApiValueKey || '').trim()) {
          alert('Please add at least one target mapping (Target Field + Value Key).');
          setLoading(false);
          return;
        }
      }

      const generatedComponentProps: any = { ...extraComponentProps };

      // Save formula config
      if (enableFormula && formulaExpression.trim()) {
        generatedComponentProps.formula = {
          enabled: true,
          expression: formulaExpression.trim(),
          trigger: formulaTrigger,
          resultFormat: {
            decimals: formulaDecimals,
            prefix: formulaPrefix,
            suffix: formulaSuffix,
          },
          onError: formulaOnError,
        };
      }

      if (enableTextApiPrefill && String(textApiUrl || '').trim()) {
        const cleanedMappings = textApiMappings
          .filter((m) => String(m.targetField || '').trim() && String(m.valueKey || '').trim())
          .map((m) => ({
            targetField: String(m.targetField).trim(),
            targetFieldCode: String(m.targetField).trim(),
            responsePath: String(m.responsePath || '').trim() || null,
            valueKey: String(m.valueKey || '').trim(),
          }));
        generatedComponentProps.textApi = {
          apiUrl: String(textApiUrl).trim(),
          method: textApiMethod,
          triggerField: String(textApiTriggerField || '').trim() || null,
          responsePath: String(textApiResponsePath || '').trim() || null,
          valueKey: String(textApiValueKey || '').trim() || null,
          overwrite: !!textApiOverwrite,
          mappings: cleanedMappings,
        };
      }
      const regexForSave = String(regex ?? '');
      const validationRule: any = {
        ...extraAdvancedRules,
        ...generatedAdvancedRules,
        accept: fileMimeTypes.join(","),
      };
      if (regexForSave.trim() !== '') {
        validationRule.regex = regexForSave;
      }

      if (typeof minLength === "number") {
        validationRule.min_length = minLength;
      }

      if (typeof maxLength === "number") {
        validationRule.max_length = maxLength;
      }

      if (enableAadhaarVerhoeff && ['text', 'textarea', 'tel', 'number'].includes(inputType)) {
        validationRule.aadhaar_verhoeff = true;
      }

      if (isDateInputType(inputType)) {
        validationRule.allow_future_date = allowFutureDate;
        validationRule.allow_previous_date = allowPreviousDate;
        validationRule.default_current_date = defaultCurrentDate;
      }

      const payload = {
        ...(formFieldId ? { formFieldId } : {}),
        locale,
        customLabel,
        placeholder,
        helpText,
        inputType,
        gridSpan,
        preference,
        isRequired: isRequired ? "Y" : "N",
        isReadonly: isReadonly ? "Y" : "N",

        minLength: typeof minLength === "number" ? minLength : null,
        maxLength: typeof maxLength === "number" ? maxLength : null,
        pattern: regexForSave.trim() === '' ? null : regexForSave,
        validationRule,
        componentProps: generatedComponentProps,
        // ✅ User assignment
        userId: assignedUserId ?? null,
      };


      await apiClient.patch(`/master/form-builder/fields/${row.id}`, payload);
      onSaved();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (Array.isArray(error?.response?.data?.message)
          ? error.response.data.message.join(', ')
          : null) ||
        error?.message ||
        'Failed to save changes';
      alert(String(message));
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="d-flex justify-content-end gap-2 pt-3">
      <Button label="Cancel" severity="secondary" text onClick={onClose} />
      <Button
        label="Save Changes"
        icon="pi pi-check"
        severity="success"
        loading={loading}
        onClick={handleSave}
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="d-flex align-items-center gap-2">
          <span>Edit Field Configuration</span>
          <span
            className="badge rounded-pill"
            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
          >
            Language being edited: {editingLang}
          </span>
        </div>
      }
      visible={open}
      style={{ width: '700px' }}
      onHide={onClose}
      footer={footer}
      contentStyle={{ maxHeight: '80vh', overflowY: 'auto' }}
    >
      <div className="d-flex flex-column gap-4 p-2">
        <div className="border rounded p-3 bg-light shadow-sm">
          <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">1. General Settings</h6>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-bold small">Master Field (Source)</label>
              <Dropdown
                value={formFieldId}
                options={masterFieldOptions}
                onChange={(e) => setFormFieldId(e.value)}
                filter
                className="w-100"
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold small">Custom Label</label>
              <InputText
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-100"
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-bold small">Input Type</label>
              <Dropdown
                value={inputType}
                options={INPUT_TYPES}
                onChange={(e) => setInputType(e.value)}
                className="w-100"
                filter
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-bold small">Placeholder</label>
              <InputText
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                className="w-100"
              />
            </div>
            <div className="col-12">
              <label className="form-label fw-bold small">Help Text / Tooltip</label>
              <InputText
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                className="w-100"
                placeholder="Shown as a hoverable (?) icon"
              />
            </div>
          </div>
        </div>

        <div className="border rounded p-3 bg-light shadow-sm">
          <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">2. Layout & State</h6>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fw-bold small">Grid Width (1-12)</label>
              <Dropdown
                value={gridSpan}
                options={GRID_OPTIONS}
                onChange={(e) => setGridSpan(e.value)}
                className="w-100"
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-bold small">Sort Order</label>
              <InputNumber
                value={preference}
                onValueChange={(e) => setPreference(e.value ?? 0)}
                className="w-100"
              />
            </div>
            <div className="col-12 d-flex gap-4 mt-2">
              <div className="d-flex align-items-center">
                <Checkbox
                  inputId="req"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.checked ?? false)}
                />
                <label htmlFor="req" className="ms-2 cursor-pointer fw-bold text-danger">
                  Required Field
                </label>
              </div>
              <div className="d-flex align-items-center">
                <Checkbox
                  inputId="read"
                  checked={isReadonly}
                  onChange={(e) => setIsReadonly(e.checked ?? false)}
                />
                <label htmlFor="read" className="ms-2 cursor-pointer fw-bold text-muted">
                  Read Only
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ User Assignment Section */}
        <div className="border rounded p-3 shadow-sm" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
          <h6 className="fw-bold mb-3 border-bottom pb-2" style={{ color: '#92400e' }}>
            <i className="pi pi-user me-2" style={{ fontSize: 12 }} />
            Assign to Specific User (Optional)
          </h6>
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-bold small">User</label>
              <Dropdown
                value={assignedUserId}
                options={tenantUsers.map(u => ({ label: u.email, value: u.id }))}
                onChange={(e) => setAssignedUserId(e.value)}
                placeholder={loadingUsers ? 'Loading users...' : tenantId ? '-- All Users (no override) --' : 'Select a tenant first'}
                className="w-100"
                filter
                showClear
                disabled={loadingUsers || !tenantId}
              />
              <div style={{ marginTop: 6, fontSize: 11, color: '#78716c', fontStyle: 'italic' }}>
                Leave empty → this field shows for <strong>all</strong> users with the mapped role. Select a user → this field shows <strong>only</strong> for that user.
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 bg-light shadow-sm">
          <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">3. Advanced & Validation</h6>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label fw-bold small">Min Length</label>
              <InputNumber
                value={minLength}
                onValueChange={(e) => setMinLength(e.value ?? null)}
                className="w-100"
              />
            </div>
            <div className="col-6">
              <label className="form-label fw-bold small">Max Length</label>
              <InputNumber
                value={maxLength}
                onValueChange={(e) => setMaxLength(e.value ?? null)}
                className="w-100"
              />
            </div>
            {isDateInputType(inputType) && (
              <>
                <div className="col-12">
                  <div className="d-flex align-items-start p-2 rounded border bg-white">
                    <Checkbox
                      inputId="allowPreviousDate"
                      checked={allowPreviousDate}
                      onChange={(e) => setAllowPreviousDate(e.checked ?? false)}
                    />
                    <div className="ms-2">
                      <label htmlFor="allowPreviousDate" className="form-label fw-bold small mb-1 cursor-pointer">
                        Accept previous date / time
                      </label>
                      <small className="text-muted d-block">
                        Uncheck this to block dates before today for Date Picker, or past date-time values for Date & Time Picker.
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-start p-2 rounded border bg-white">
                    <Checkbox
                      inputId="allowFutureDate"
                      checked={allowFutureDate}
                      onChange={(e) => setAllowFutureDate(e.checked ?? false)}
                    />
                    <div className="ms-2">
                      <label htmlFor="allowFutureDate" className="form-label fw-bold small mb-1 cursor-pointer">
                        Accept future date / time
                      </label>
                      <small className="text-muted d-block">
                        Uncheck this to block dates after today for Date Picker, or future date-time values for Date & Time Picker.
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-start p-2 rounded border bg-white">
                    <Checkbox
                      inputId="defaultCurrentDate"
                      checked={defaultCurrentDate}
                      onChange={(e) => setDefaultCurrentDate(e.checked ?? false)}
                    />
                    <div className="ms-2">
                      <label htmlFor="defaultCurrentDate" className="form-label fw-bold small mb-1 cursor-pointer">
                        Select current {inputType === 'datetime-local' ? 'date & time' : 'date'} by default
                      </label>
                      <small className="text-muted d-block">
                        When enabled, this field will open with today{inputType === 'datetime-local' ? '\'s current time' : '\'s date'} already selected.
                      </small>
                    </div>
                  </div>
                </div>
              </>
            )}
            {['text', 'textarea', 'tel', 'number'].includes(inputType) && (
              <div className="col-12">
                <div className="d-flex align-items-start p-2 rounded border bg-white">
                  <Checkbox
                    inputId="enableAadhaarVerhoeff"
                    checked={enableAadhaarVerhoeff}
                    onChange={(e) => setEnableAadhaarVerhoeff(e.checked ?? false)}
                  />
                  <div className="ms-2">
                    <label htmlFor="enableAadhaarVerhoeff" className="form-label fw-bold small mb-1 cursor-pointer">
                      Enable Aadhaar Verhoeff validation
                    </label>
                    <small className="text-muted d-block">
                      Regex sirf 12-digit Aadhaar format check karta hai. Is option se UIDAI checksum bhi validate hoga.
                    </small>
                  </div>
                </div>
              </div>
            )}
            <div className="col-12">
              <label className="form-label fw-bold small">Regex Pattern</label>
              <InputText
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-100 font-monospace"
                placeholder="e.g. ^\d+$ for numbers only"
              />
              {/* Preset quick-pick buttons */}
              <div className="d-flex flex-wrap gap-1 mt-2">
                {[
                  { label: 'Numbers only',      pattern: '^[0-9]+$' },
                  { label: 'Letters only',       pattern: '^[a-zA-Z]+$' },
                  { label: 'Alphanumeric',       pattern: '^[a-zA-Z0-9]+$' },
                  { label: 'Mobile (10 digit)', pattern: '^[6-9][0-9]{9}$' },
                  { label: 'Email',              pattern: '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$' },
                  { label: 'PIN code (6 digit)', pattern: '^[1-9][0-9]{5}$' },
                  { label: 'Aadhaar (12 digit)', pattern: '^[2-9][0-9]{11}$' },
                  { label: 'PAN',                pattern: '^[A-Z]{5}[0-9]{4}[A-Z]$' },
                  { label: 'Clear',              pattern: '' },
                ].map(({ label, pattern }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setRegex(pattern);
                      if (label === 'Aadhaar (12 digit)') {
                        setEnableAadhaarVerhoeff(true);
                      }
                    }}
                    style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      border: `1px solid ${regex === pattern && pattern !== '' ? '#0d6efd' : '#dee2e6'}`,
                      background: regex === pattern && pattern !== '' ? '#e7f1ff' : '#f8f9fa',
                      color: label === 'Clear' ? '#dc3545' : regex === pattern && pattern !== '' ? '#0d6efd' : '#495057',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Live regex syntax check + interactive test */}
              {regex && (() => {
                let syntaxValid = true;
                let syntaxErr = '';
                try { new RegExp(regex); } catch { syntaxValid = false; syntaxErr = 'Invalid regex syntax'; }
                if (!syntaxValid) return <small className="text-danger mt-1 d-block">{syntaxErr}</small>;

                const regexMatches = regexTestValue !== ''
                  ? new RegExp(regex).test(regexTestValue)
                  : null;
                const aadhaarChecksumMatches =
                  enableAadhaarVerhoeff && regexTestValue !== ''
                    ? isValidAadhaarNumber(regexTestValue)
                    : null;
                const testResult =
                  regexTestValue === ''
                    ? null
                    : regexMatches && (aadhaarChecksumMatches === null || aadhaarChecksumMatches)
                      ? 'match'
                      : 'no-match';

                return (
                  <div className="mt-2">
                    <div className="p-2 rounded mb-2" style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', fontSize: 12 }}>
                      <span className="fw-bold text-primary me-2">Pattern:</span>
                      <code>{regex}</code>
                      <span className="ms-3 text-muted">
                        — Matches: <strong>
                          {regex === '^[0-9]+$' || regex === '^[0-9]*$' ? 'digits only (123 ✓, abc ✗)'
                            : regex === '^[a-zA-Z]+$' ? 'letters only (abc ✓, 123 ✗)'
                            : regex === '^[a-zA-Z0-9]+$' ? 'letters & digits (abc123 ✓, @#$ ✗)'
                            : regex.includes('[6-9]') && regex.includes('{9}') ? '10-digit mobile numbers'
                            : 'custom pattern'}
                        </strong>
                      </span>
                    </div>
                    {/* Interactive test input */}
                    <div className="d-flex align-items-center gap-2">
                      <InputText
                        value={regexTestValue}
                        onChange={(e) => setRegexTestValue(e.target.value)}
                        placeholder="Type a test value to check regex…"
                        className="w-100 font-monospace"
                        style={{ fontSize: 12 }}
                      />
                      {testResult === 'match' && (
                        <span className="text-success fw-bold text-nowrap" style={{ fontSize: 12 }}>✓ Valid</span>
                      )}
                      {testResult === 'no-match' && (
                        <span className="text-danger fw-bold text-nowrap" style={{ fontSize: 12 }}>✗ Invalid</span>
                      )}
                    </div>
                  </div>
                );
              })()}
              <small className="text-muted d-block mt-1">
                Regex must <strong>match valid values</strong>. e.g. <code>^[0-9]+$</code> allows only digits.
              </small>
            </div>
            {inputType === 'file' && (
              <div className="col-12">
                <label className="form-label fw-bold small text-primary">Allowed File Types</label>
                <MultiSelect
                  value={fileMimeTypes}
                  options={FILE_ACCEPT_OPTIONS}
                  onChange={(e) => setFileMimeTypes(e.value)}
                  className="w-100 p-inputtext-sm"
                  placeholder="Select allowed formats"
                  display="chip"
                />
              </div>
            )}

            {(inputType === 'text' || inputType === 'email' || inputType === 'tel') && (
              <div className="col-12">
                <div className="border rounded p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold small text-primary mb-0">
                      Text API Prefill (Optional)
                    </label>
                    <div className="d-flex align-items-center">
                      <Checkbox
                        inputId="enableTextApiPrefill"
                        checked={enableTextApiPrefill}
                        onChange={(e) => setEnableTextApiPrefill(e.checked ?? false)}
                      />
                      <label htmlFor="enableTextApiPrefill" className="ms-2 small">
                        Enable
                      </label>
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-8">
                      <label className="form-label small fw-bold">API URL</label>
                      <InputText
                        value={textApiUrl}
                        onChange={(e) => setTextApiUrl(e.target.value)}
                        className="w-100"
                        disabled={!enableTextApiPrefill}
                        placeholder="/investor/profile/by-pan?pan={{UK-FCL-00009_0}}"
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-bold">Method</label>
                      <Dropdown
                        value={textApiMethod}
                        options={TEXT_API_METHOD_OPTIONS}
                        onChange={(e) => setTextApiMethod(e.value)}
                        className="w-100"
                        disabled={!enableTextApiPrefill}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Trigger Field (Optional)</label>
                      <Dropdown
                        value={String(textApiTriggerField ?? '')}
                        options={textApiTriggerOptions}
                        onChange={(e) => setTextApiTriggerField(String(e.value ?? ''))}
                        className="w-100"
                        filter
                        showClear
                        disabled={!enableTextApiPrefill}
                        placeholder="Select field that should trigger API fetch"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Response Path (Optional)</label>
                      <InputText
                        value={textApiResponsePath}
                        onChange={(e) => setTextApiResponsePath(e.target.value)}
                        className="w-100"
                        disabled={!enableTextApiPrefill}
                        placeholder="data"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Value Key (Optional)</label>
                      <InputText
                        value={textApiValueKey}
                        onChange={(e) => setTextApiValueKey(e.target.value)}
                        className="w-100"
                        disabled={!enableTextApiPrefill}
                        placeholder="name"
                      />
                    </div>
                    <div className="col-12 d-flex align-items-center">
                      <Checkbox
                        inputId="textApiOverwrite"
                        checked={textApiOverwrite}
                        onChange={(e) => setTextApiOverwrite(e.checked ?? false)}
                        disabled={!enableTextApiPrefill}
                      />
                      <label htmlFor="textApiOverwrite" className="ms-2 small">
                        Overwrite existing user value on each fetch
                      </label>
                    </div>
                    <div className="col-12">
                      <div className="border rounded p-2">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label small fw-bold mb-0">Response Mapping (Multi Target)</label>
                          <Button
                            type="button"
                            label="Add Mapping"
                            icon="pi pi-plus"
                            size="small"
                            text
                            disabled={!enableTextApiPrefill}
                            onClick={() =>
                              setTextApiMappings((prev) => [
                                ...prev,
                                { targetField: '', responsePath: '', valueKey: '' },
                              ])
                            }
                          />
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {textApiMappings.length === 0 ? (
                            <small className="text-muted">
                              Add mappings like: Full Name {'->'} architectName, Mobile {'->'} mobile.
                            </small>
                          ) : (
                            textApiMappings.map((m, idx) => (
                              <div key={`map-${idx}`} className="row g-2 align-items-end">
                                <div className="col-4">
                                  <label className="form-label small">Target Field</label>
                                  <Dropdown
                                    value={m.targetField}
                                    options={fieldCodeOptions}
                                    onChange={(e) =>
                                      setTextApiMappings((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, targetField: String(e.value || '') } : x)),
                                      )
                                    }
                                    className="w-100"
                                    filter
                                    disabled={!enableTextApiPrefill}
                                    placeholder="Select target"
                                  />
                                </div>
                                <div className="col-3">
                                  <label className="form-label small">Response Path</label>
                                  <InputText
                                    value={m.responsePath}
                                    onChange={(e) =>
                                      setTextApiMappings((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, responsePath: e.target.value } : x)),
                                      )
                                    }
                                    disabled={!enableTextApiPrefill}
                                    placeholder="data"
                                  />
                                </div>
                                <div className="col-4">
                                  <label className="form-label small">Value Key</label>
                                  <InputText
                                    value={m.valueKey}
                                    onChange={(e) =>
                                      setTextApiMappings((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, valueKey: e.target.value } : x)),
                                      )
                                    }
                                    disabled={!enableTextApiPrefill}
                                    placeholder="architectName"
                                  />
                                </div>
                                <div className="col-1 d-flex justify-content-end">
                                  <Button
                                    type="button"
                                    icon="pi pi-trash"
                                    rounded
                                    text
                                    severity="danger"
                                    disabled={!enableTextApiPrefill}
                                    onClick={() =>
                                      setTextApiMappings((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <small className="text-muted d-block">
                        Token support in URL: <code>{'{{serviceId}}'}</code>,{' '}
                        <code>{'{{submissionId}}'}</code>, or any field code like{' '}
                        <code>{'{{UK-FCL-00009_0}}'}</code>.
                      </small>
                      <small className="text-muted d-block">
                        If Trigger Field is blank, API prefill runs automatically.
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-12">
              <div className="border rounded p-3 bg-white">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label fw-bold small text-primary mb-0">
                    Conditional Required Any Of
                  </label>
                  <div className="d-flex align-items-center">
                    <Checkbox
                      inputId="enableRequiredAnyOfRule"
                      checked={enableRequiredAnyOfRule}
                      onChange={(e) => setEnableRequiredAnyOfRule(e.checked ?? false)}
                    />
                    <label htmlFor="enableRequiredAnyOfRule" className="ms-2 small">
                      Enable
                    </label>
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-12">
                    <label className="form-label small fw-bold">When Field</label>
                    <Dropdown
                      value={requiredAnyOfWhenField}
                      options={fieldCodeOptions}
                      onChange={(e) => setRequiredAnyOfWhenField(e.value)}
                      className="w-100"
                      filter={fieldCodeOptions.length > 25}
                      disabled={!enableRequiredAnyOfRule}
                      placeholder="Select trigger field"
                      panelClassName="fb-rule-dd-panel"
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label small fw-bold">Operator</label>
                    <Dropdown
                      value={requiredAnyOfWhenOperator}
                      options={RULE_OPERATOR_OPTIONS}
                      onChange={(e) => setRequiredAnyOfWhenOperator(e.value)}
                      className="w-100"
                      disabled={!enableRequiredAnyOfRule}
                    />
                  </div>
                  <div className="col-8">
                    <label className="form-label small fw-bold">Value</label>
                    <InputText
                      value={requiredAnyOfWhenValue}
                      onChange={(e) => setRequiredAnyOfWhenValue(e.target.value)}
                      className="w-100"
                      disabled={
                        !enableRequiredAnyOfRule ||
                        requiredAnyOfWhenOperator === 'is_empty' ||
                        requiredAnyOfWhenOperator === 'is_not_empty'
                      }
                      placeholder="Example: 1,2"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Require At Least One Of</label>
                    <MultiSelect
                      value={requiredAnyOfFields}
                      options={fieldCodeOptions}
                      onChange={(e) => setRequiredAnyOfFields(e.value)}
                      className="w-100"
                      filter={fieldCodeOptions.length > 25}
                      maxSelectedLabels={2}
                      disabled={!enableRequiredAnyOfRule}
                      placeholder="Select one or more target fields"
                      display="chip"
                      panelClassName="fb-rule-ms-panel"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-bold">Validation Message</label>
                    <InputText
                      value={requiredAnyOfMessage}
                      onChange={(e) => setRequiredAnyOfMessage(e.target.value)}
                      className="w-100"
                      disabled={!enableRequiredAnyOfRule}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-bold small text-primary">
                      Generated JSON (Read Only)
                    </label>
                    <textarea
                      value={requiredAnyOfPreviewJson}
                      rows={8}
                      className="form-control font-monospace"
                      readOnly
                      placeholder="Enable rule to preview generated JSON."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 6: Calculation Formula ─────────────────────────────── */}
      <div className="border rounded p-3 bg-light shadow-sm">
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <h6 className="fw-bold mb-0 text-primary">6. Calculation Formula</h6>
          <div className="d-flex align-items-center gap-2">
            <Checkbox
              inputId="enableFormula"
              checked={enableFormula}
              onChange={(e) => setEnableFormula(e.checked ?? false)}
            />
            <label htmlFor="enableFormula" className="small mb-0 cursor-pointer">
              Enable
            </label>
          </div>
        </div>

        {!enableFormula && (
          <div className="text-muted small">
            <div className="mb-2">Enable this to auto-calculate this field value using other fields in the form.</div>
            <div className="mb-1 fw-bold" style={{ color: '#555' }}>Examples:</div>
            <div className="d-flex flex-wrap gap-2">
              <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                Male + Female = <strong>Total Employees</strong>
              </span>
              <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                Basic + DA + HRA = <strong>Total Salary</strong>
              </span>
              <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                (Female / Total) × 100 = <strong>Female %</strong>
              </span>
              <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                Area × Rate = <strong>Tax Amount</strong>
              </span>
            </div>
          </div>
        )}

        {enableFormula && (
          <div className="row g-3">

            {/* Formula Expression */}
            <div className="col-12">
              <label className="form-label fw-bold small">
                Formula Expression
                <span className="text-muted fw-normal ms-2">
                  — use <code>{'{{fieldCode}}'}</code> as field variables
                </span>
              </label>
              <textarea
                ref={formulaTextareaRef}
                value={formulaExpression}
                onChange={(e) => setFormulaExpression(e.target.value)}
                className="form-control font-monospace"
                rows={3}
                spellCheck={false}
                placeholder={'e.g. round(({{Area}} + {{ExtraArea}}) * {{Rate}} / 12, 2)'}
                style={{ fontSize: '13px', letterSpacing: '0.02em' }}
              />
            </div>

            {/* Field Picker */}
            <div className="col-12">
              <label className="form-label small fw-bold">Insert Field Token</label>
              <div className="d-flex gap-2">
                <div className="flex-grow-1">
                  <Dropdown
                    value={formulaInsertField}
                    options={fieldCodeOptions}
                    onChange={(e) => setFormulaInsertField(String(e.value ?? ''))}
                    filter
                    showClear
                    placeholder="Select a field…"
                    className="w-100"
                  />
                </div>
                <Button
                  type="button"
                  label="Insert"
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  disabled={!formulaInsertField}
                  onClick={() => {
                    if (formulaInsertField) {
                      insertAtCursor(`{{${formulaInsertField}}}`);
                      setFormulaInsertField('');
                    }
                  }}
                />
              </div>
            </div>

            {/* Operators */}
            <div className="col-12">
              <label className="form-label small fw-bold">Operators</label>
              <div className="d-flex flex-wrap gap-1">
                {FORMULA_OPERATORS.map((op) => (
                  <button
                    key={op.label}
                    type="button"
                    title={op.title}
                    className="btn btn-outline-secondary btn-sm font-monospace px-2"
                    style={{ minWidth: '36px', fontSize: '15px' }}
                    onClick={() => insertAtCursor(op.insert)}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div className="col-12">
              <label className="form-label small fw-bold">Functions</label>
              <div className="d-flex flex-wrap gap-1">
                {FORMULA_FUNCTIONS.map((fn) => (
                  <button
                    key={fn.label}
                    type="button"
                    title={fn.title}
                    className={`btn btn-sm font-monospace px-2 ${'isDate' in fn && fn.isDate ? 'btn-outline-info' : 'btn-outline-dark'}`}
                    style={{ fontSize: '11px' }}
                    onClick={() => insertAtCursor(fn.insert)}
                  >
                    {fn.label}
                  </button>
                ))}
              </div>
              <small className="text-muted mt-1 d-block">
                <span className="border border-info rounded px-1 me-1" style={{ fontSize: '10px', color: '#0dcaf0' }}>DATE</span>
                functions use date fields — insert <code style={{ fontSize: '10px' }}>{'{{fieldCode}}'}</code> as arguments
              </small>
            </div>

            {/* Live Test */}
            <div className="col-12">
              <div className="border rounded p-2 bg-white">
                <label className="form-label small fw-bold text-success mb-2">
                  <i className="pi pi-play-circle me-1" />
                  Live Test
                </label>

                {formulaFields.length === 0 ? (
                  <small className="text-muted d-block">
                    Add field tokens to the formula above to test it here.
                  </small>
                ) : (
                  <>
                    <div className="row g-2 mb-2">
                      {formulaFields.map((fieldCode) => {
                        const opt = fieldCodeOptions.find((o) => o.value === fieldCode);
                        const shortLabel = opt
                          ? opt.label.split('(')[0].trim()
                          : fieldCode;
                        const isDateInput = formulaHasDateFunctions(formulaExpression);
                        return (
                          <div key={fieldCode} className="col-6">
                            <label className="form-label small mb-1">
                              {shortLabel}
                              <code className="ms-1 text-muted" style={{ fontSize: '10px' }}>
                                {`{{${fieldCode}}}`}
                              </code>
                              {isDateInput && (
                                <span className="ms-1 badge bg-info text-white" style={{ fontSize: '9px' }}>DATE</span>
                              )}
                            </label>
                            <InputText
                              value={formulaTestValues[fieldCode] ?? ''}
                              onChange={(e) =>
                                setFormulaTestValues((prev) => ({
                                  ...prev,
                                  [fieldCode]: e.target.value,
                                }))
                              }
                              className="w-100 p-inputtext-sm"
                              placeholder={isDateInput ? 'YYYY-MM-DD' : '0'}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`p-2 rounded d-flex align-items-center gap-2 ${formulaLiveResult.error
                        ? 'bg-danger bg-opacity-10 border border-danger border-opacity-25'
                        : 'bg-success bg-opacity-10 border border-success border-opacity-25'
                        }`}
                    >
                      {formulaLiveResult.error ? (
                        <>
                          <i className="pi pi-times-circle text-danger" />
                          <small className="text-danger">{formulaLiveResult.error}</small>
                        </>
                      ) : (
                        <>
                          <i className="pi pi-check-circle text-success" />
                          <small className="text-success fw-bold">
                            Result:{' '}
                            <span style={{ fontSize: '14px' }}>
                              {formulaLiveResult.formatted || '—'}
                            </span>
                          </small>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Settings Row */}
            <div className="col-12">
              <div className="border rounded p-2 bg-white">
                <label className="form-label small fw-bold mb-3 d-block">Result Settings</label>
                <div className="row g-3">

                  {/* Trigger */}
                  <div className="col-12">
                    <label className="form-label small fw-bold mb-1">
                      When to Calculate?
                      <span className="text-muted fw-normal ms-1">— choose when the formula runs</span>
                    </label>
                    <Dropdown
                      value={formulaTrigger}
                      options={[
                        { label: 'On Every Change — recalculates as user types (Recommended)', value: 'onChange' },
                        { label: 'On Field Blur — recalculates when user leaves the input field', value: 'onBlur' },
                        { label: 'On Form Submit — calculates only when form is submitted', value: 'onSubmit' },
                      ]}
                      onChange={(e) => setFormulaTrigger(e.value)}
                      className="w-100"
                    />
                  </div>

                  {/* Decimals */}
                  <div className="col-12">
                    <label className="form-label small fw-bold mb-1">
                      Decimal Places
                      <span className="text-muted fw-normal ms-1">— how many digits to show after the decimal point</span>
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <InputNumber
                        value={formulaDecimals}
                        onValueChange={(e) => setFormulaDecimals(e.value ?? 0)}
                        min={0}
                        max={10}
                        style={{ width: '100px' }}
                      />
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                          0 → <strong>50</strong> &nbsp;(Employee count, Quantity)
                        </span>
                        <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                          2 → <strong>50.75</strong> &nbsp;(Salary, Area in sqft)
                        </span>
                        <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                          2 → <strong>85.50</strong> &nbsp;(Percentage)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prefix & Suffix */}
                  <div className="col-12">
                    <label className="form-label small fw-bold mb-1">
                      Prefix &amp; Suffix
                      <span className="text-muted fw-normal ms-1">— symbol to display before / after the result</span>
                    </label>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div style={{ width: '130px' }}>
                        <small className="text-muted d-block mb-1">Prefix (before number)</small>
                        <InputText
                          value={formulaPrefix}
                          onChange={(e) => setFormulaPrefix(e.target.value)}
                          className="w-100"
                          placeholder="e.g. ₹"
                        />
                      </div>
                      <div className="text-center pt-3 px-1">
                        <small className="text-muted">Number</small>
                      </div>
                      <div style={{ width: '130px' }}>
                        <small className="text-muted d-block mb-1">Suffix (after number)</small>
                        <InputText
                          value={formulaSuffix}
                          onChange={(e) => setFormulaSuffix(e.target.value)}
                          className="w-100"
                          placeholder="e.g. %"
                        />
                      </div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                        Prefix ₹ → <strong>₹15000</strong> &nbsp;(Salary / Amount)
                      </span>
                      <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                        Suffix % → <strong>85%</strong> &nbsp;(Percentage)
                      </span>
                      <span className="border rounded px-2 py-1" style={{ fontSize: '11px', background: '#f8f9fa', color: '#333' }}>
                        Both empty → <strong>50</strong> &nbsp;(Employee count)
                      </span>
                    </div>
                  </div>

                  {/* On Error */}
                  <div className="col-12">
                    <label className="form-label small fw-bold mb-1">
                      If a field is empty, what should Total show?
                    </label>
                    <div className="border rounded p-2 mb-2" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                      <small style={{ color: '#92400e' }}>
                        <strong>Example:</strong> Formula is <code>Male + Female = Total</code>.
                        If user has not filled Male yet — Total cannot be calculated.
                        What should Total display at that moment?
                      </small>
                    </div>
                    <Dropdown
                      value={formulaOnError}
                      options={[
                        { label: 'Show 0  →  Total displays: 0  (Recommended)', value: 'showZero' },
                        { label: 'Show Blank  →  Total displays: empty  (nothing shown)', value: 'showBlank' },
                        { label: 'Show #ERROR  →  Total displays: #ERROR  (for debugging)', value: 'showError' },
                      ]}
                      onChange={(e) => setFormulaOnError(e.value)}
                      className="w-100"
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Generated JSON Preview */}
            <div className="col-12">
              <label className="form-label fw-bold small text-primary">
                Generated Config (Read Only)
              </label>
              <textarea
                value={
                  enableFormula && formulaExpression.trim()
                    ? JSON.stringify(
                      {
                        enabled: true,
                        expression: formulaExpression.trim(),
                        trigger: formulaTrigger,
                        resultFormat: {
                          decimals: formulaDecimals,
                          prefix: formulaPrefix,
                          suffix: formulaSuffix,
                        },
                        onError: formulaOnError,
                      },
                      null,
                      2,
                    )
                    : ''
                }
                rows={6}
                className="form-control font-monospace"
                readOnly
                placeholder="Enable formula and enter expression to see config."
                style={{ fontSize: '11px' }}
              />
            </div>

          </div>
        )}
      </div>
      {/* ── End Section 6 ─────────────────────────────────────────────── */}

      <style jsx global>{`
        .fb-rule-dd-panel,
        .fb-rule-ms-panel {
          max-width: min(680px, calc(100vw - 32px));
        }
      `}</style>
    </Dialog>
  );
}
