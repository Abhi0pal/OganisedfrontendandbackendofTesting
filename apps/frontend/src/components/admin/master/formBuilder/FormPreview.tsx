'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';
import { RadioButton } from 'primereact/radiobutton';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Tooltip } from 'primereact/tooltip';

import apiClient from '@/lib/api-client';
import {
  PreviewAddMoreGroup,
  PreviewAddMoreColumn,
  PreviewField,
  PreviewOption,
  PreviewRule,
  YnFlag,
  useFormBuilderPreview,
} from '@/hooks/master/useFormBuilderPreview';
import { useServicePlugin } from '@/service-plugins/_loader';
import {
  buildDefaultValuesForFields,
  isAadhaarVerhoeffEnabled,
  isValidAadhaarNumber,
} from '@/utils/formFieldRuntime';

const BOOTSTRAP_SPANS: Record<number, string> = {
  1: "col-md-1", 2: "col-md-2", 3: "col-md-3", 4: "col-md-4",
  5: "col-md-5", 6: "col-md-6", 7: "col-md-7", 8: "col-md-8",
  9: "col-md-9", 10: "col-md-10", 11: "col-md-11", 12: "col-md-12",
};

type Props = { serviceId: string; formTypeId: number; };
type Errors = Record<string, string>;
type AddMoreValues = Record<number, Array<Record<string, any>>>;
type FieldOverrides = { required?: boolean; visible?: boolean; readonly?: boolean; editable?: boolean; };
type AddMoreRowRule = {
  id: number;
  targetGroupId: number;
  sourceField: string;
  mode: 'exact' | 'min' | 'max';
  applyOn: Array<'add' | 'page_save' | 'submit'>;
  message?: string;
  when?: any;
};

function safeParseJSON(input: any) {
  if (typeof input === 'string') { try { return JSON.parse(input); } catch (e) { return null; } }
  return input;
}

function isEmptyValue(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function allowsFutureDate(rules: unknown) {
  const ruleMap = rules && typeof rules === 'object' ? rules as Record<string, unknown> : {};
  const raw = ruleMap.allow_future_date ?? ruleMap.allowFutureDate;
  if (raw === undefined || raw === null || raw === '') return true;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  return !['false', '0', 'n', 'no'].includes(String(raw).trim().toLowerCase());
}

function allowsPreviousDate(rules: unknown) {
  const ruleMap = rules && typeof rules === 'object' ? rules as Record<string, unknown> : {};
  const raw = ruleMap.allow_previous_date ?? ruleMap.allowPreviousDate;
  if (raw === undefined || raw === null || raw === '') return true;
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw !== 0;
  return !['false', '0', 'n', 'no'].includes(String(raw).trim().toLowerCase());
}

function getDateValidationBounds(inputType: string, rules: unknown) {
  const now = new Date();
  const isDateOnly = inputType === 'date';
  const minDate = allowsPreviousDate(rules)
    ? undefined
    : (() => {
      const date = new Date(now);
      if (isDateOnly) date.setHours(0, 0, 0, 0);
      return date;
    })();
  const maxDate = allowsFutureDate(rules)
    ? undefined
    : (() => {
      const date = new Date(now);
      if (isDateOnly) date.setHours(23, 59, 59, 999);
      return date;
    })();

  return { minDate, maxDate };
}

function isFutureDateValue(value: unknown, inputType: string) {
  if (isEmptyValue(value)) return false;
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (inputType === 'date') {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date.getTime() > today.getTime();
  }

  return date.getTime() > Date.now();
}

function isPreviousDateValue(value: unknown, inputType: string) {
  if (isEmptyValue(value)) return false;
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (inputType === 'date') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  }

  return date.getTime() < Date.now();
}

function normalizeAllowedFormats(allowedFormats: any): string[] {
  const raw = Array.isArray(allowedFormats) ? allowedFormats : [];
  return raw
    .map((item: any) => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .map((item: string) => (item.startsWith('.') ? item : `.${item}`));
}

function normalizeOptions(options: any): PreviewOption[] {
  const parsed = safeParseJSON(options);
  if (!Array.isArray(parsed)) return [];
  const sorted = [...parsed].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.map((o) => ({
    label: o.label || o.name || String(o.value),
    value: String(o.value),
    disabled: o.disabled,
    order: o.order
  }));
}

function fieldDisabled(isEditable: YnFlag, isReadonly: YnFlag, override?: FieldOverrides) {
  const base = isEditable === 'N' || isReadonly === 'Y';
  if (override?.readonly === true) return true;
  if (override?.editable === false) return true;
  return base;
}

// ✅ ISOLATED DYNAMIC DROPDOWN FOR ADD-MORE ROWS
function AddMoreDynamicDropdown({ masterId, parentValue, value, onChange, disabled, placeholder, className, appendTo, isMulti }: any) {
  const [opts, setOpts] = useState<any[]>([]);

  useEffect(() => {
    if (!masterId) return;
    if (parentValue !== undefined && isEmptyValue(parentValue)) {
      setOpts([]);
      return;
    }

    const parentValueParam = Array.isArray(parentValue) ? parentValue.join(',') : String(parentValue ?? '');

    apiClient.get(`/master/form-builder/master-tables/${masterId}/options`, {
      params: { parentValue: parentValueParam, includeInactive: 1, take: 2000 }
    }).then(res => setOpts(res.data || [])).catch(() => setOpts([]));

  }, [masterId, parentValue]);

  const normalizedOpts = opts.map(o => ({ label: o.label, value: String(o.value) }));

  if (isMulti) return <MultiSelect className={className} value={value ?? []} options={normalizedOpts} onChange={(e) => onChange(e.value)} disabled={disabled} placeholder={placeholder} filter display="chip" />;
  return <Dropdown className={className} value={value ? String(value) : null} options={normalizedOpts} onChange={(e) => onChange(e.value)} placeholder={placeholder} disabled={disabled} appendTo={appendTo} showClear filter />;
}

function DynamicFieldDropdown({ masterId, parentValue, value, onChange, disabled, placeholder, className, appendTo, isMulti }: any) {
  const [opts, setOpts] = useState<any[]>([]);

  useEffect(() => {
    if (!masterId) return;

    if (parentValue !== undefined && isEmptyValue(parentValue)) {
      setOpts([]);
      return;
    }

    const parentValueParam = Array.isArray(parentValue) ? parentValue.join(',') : String(parentValue ?? '');

    apiClient.get(`/master/form-builder/master-tables/${masterId}/options`, {
      params: { parentValue: parentValueParam, includeInactive: 1, take: 2000 }
    }).then(res => setOpts(res.data || [])).catch(() => setOpts([]));
  }, [masterId, parentValue]);

  const normalizedOpts = opts.map(o => ({ label: o.label, value: String(o.value) }));

  if (isMulti) {
    return (
      <MultiSelect
        className={className}
        value={value ?? []}
        options={normalizedOpts}
        onChange={(e) => onChange(e.value)}
        disabled={disabled}
        placeholder={placeholder}
        filter
        display="chip"
      />
    );
  }

  return (
    <Dropdown
      className={className}
      value={value ? String(value) : null}
      options={normalizedOpts}
      onChange={(e) => onChange(e.value)}
      placeholder={placeholder}
      disabled={disabled}
      appendTo={appendTo}
      showClear
      filter
    />
  );
}

function normalizeThenActions(thenJson: any, resolveFieldCode: (ref: any) => string | null): Array<{ field: string; prop: keyof FieldOverrides; value: boolean }> {
  const actions: Array<{ field: string; prop: keyof FieldOverrides; value: boolean }> = [];
  const parsed = safeParseJSON(thenJson);
  if (!parsed || typeof parsed !== 'object') return actions;

  const pushSet = (fieldRef: any, set: any) => {
    const code = resolveFieldCode(fieldRef);
    if (!code || !set || typeof set !== 'object') return;
    for (const [k, v] of Object.entries(set)) {
      if (['required', 'visible', 'readonly', 'editable'].includes(k) && typeof v === 'boolean') {
        actions.push({ field: code, prop: k as keyof FieldOverrides, value: v });
      }
    }
  };

  const toBool = (v: any): boolean | null => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true' || s === '1' || s === 'y' || s === 'yes') return true;
      if (s === 'false' || s === '0' || s === 'n' || s === 'no') return false;
    }
    if (typeof v === 'number') {
      if (v === 1) return true;
      if (v === 0) return false;
    }
    return null;
  };

  const toProp = (action: any): keyof FieldOverrides | null => {
    const raw = String(action ?? '').trim().toLowerCase();
    if (!raw) return null;
    if (raw === 'visible' || raw === 'show' || raw === 'hide') return 'visible';
    if (raw === 'required' || raw === 'mandatory' || raw === 'optional') return 'required';
    if (raw === 'readonly' || raw === 'read_only' || raw === 'read-only' || raw === 'disable' || raw === 'disabled') return 'readonly';
    if (raw === 'editable' || raw === 'enable') return 'editable';
    return null;
  };

  if (Array.isArray(parsed.actions)) {
    for (const a of parsed.actions) {
      if (a?.targetField && a?.action !== undefined) {
        const prop = toProp(a.action);
        const val = toBool(a?.value);
        if (prop && val !== null) {
          actions.push({ field: String(a.targetField), prop, value: val });
        } else if (prop === 'visible' && String(a.action).toLowerCase() === 'hide') {
          actions.push({ field: String(a.targetField), prop: 'visible', value: false });
        } else if (prop === 'visible' && String(a.action).toLowerCase() === 'show') {
          actions.push({ field: String(a.targetField), prop: 'visible', value: true });
        } else if (prop === 'required' && String(a.action).toLowerCase() === 'optional') {
          actions.push({ field: String(a.targetField), prop: 'required', value: false });
        }
      } else { pushSet(a?.field ?? a?.targetField ?? a?.builderFieldId ?? a?.targetBuilderFieldId, a?.set); }
    }
  }

  if (parsed.set && typeof parsed.set === 'object') {
    for (const [field, patch] of Object.entries(parsed.set)) { pushSet(field, patch); }
  }

  return actions;
}

function evalConditionTree(tree: any, values: Record<string, any>, resolveFieldCode: (ref: any) => string | null): boolean {
  if (!tree || typeof tree !== 'object') return false;
  if (Array.isArray(tree.all)) return tree.all.every((c: any) => evalConditionTree(c, values, resolveFieldCode));
  if (Array.isArray(tree.any)) return tree.any.some((c: any) => evalConditionTree(c, values, resolveFieldCode));

  const fieldRef = tree.field ?? tree.field_code ?? tree.left ?? tree.builderFieldId ?? tree.fieldId;
  const op = (tree.operator ?? tree.op ?? 'equals') as string;
  const rhs = tree.value ?? tree.right;
  const normalizeList = (input: any): any[] => {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      return input
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    return [input];
  };
  const normalizeToken = (v: any): string => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    const n = Number(s);
    if (Number.isFinite(n)) return String(n);
    return s.toLowerCase();
  };
  const fieldCode = resolveFieldCode(fieldRef);

  if (!fieldCode) return false;
  const lhs = values[fieldCode];

  switch (op) {
    case 'equals': case 'eq': return String(lhs) == String(rhs);
    case 'not_equals': case 'neq': return String(lhs) != String(rhs);
    case 'in': {
      const rhsArr = normalizeList(rhs).map((v) => normalizeToken(v));
      const lhsArr = Array.isArray(lhs) ? lhs : (lhs ? [lhs] : []);
      return lhsArr.some((x: any) => rhsArr.includes(normalizeToken(x)));
    }
    case 'not_in': {
      const rhsArr = normalizeList(rhs).map((v) => normalizeToken(v));
      const lhsArr = Array.isArray(lhs) ? lhs : (lhs ? [lhs] : []);
      return lhsArr.every((x: any) => !rhsArr.includes(normalizeToken(x)));
    }
    case 'contains': {
      const rhsArr = normalizeList(rhs).map((v) => normalizeToken(v));
      if (typeof lhs === 'string') {
        const leftNorm = normalizeToken(lhs);
        return rhsArr.some((v) => leftNorm.includes(v));
      }
      const lhsArr = Array.isArray(lhs) ? lhs : (lhs ? [lhs] : []);
      return lhsArr.some((x: any) => rhsArr.includes(normalizeToken(x)));
    }
    case 'greater_than': return Number(lhs) > Number(rhs);
    case 'less_than': return Number(lhs) < Number(rhs);
    case 'is_empty': return isEmptyValue(lhs);
    case 'is_not_empty': return !isEmptyValue(lhs);
    default: return false;
  }
}

function buildAddMoreRowRules(
  rules: any[],
  resolveFieldCode: (ref: any) => string | null,
): AddMoreRowRule[] {
  const out: AddMoreRowRule[] = [];
  const seen = new Set<string>();
  const rows = Array.isArray(rules) ? rules : [];

  rows.forEach((r: any) => {
    if (String(r?.is_active ?? '').toUpperCase() !== 'Y') return;
    const thenJson = safeParseJSON(r?.then_json) || {};
    const actions = Array.isArray(thenJson?.actions) ? thenJson.actions : [];

    actions.forEach((a: any) => {
      if (String(a?.action || '') !== 'addmore_row_count') return;
      const targetGroupId = Number(a?.targetGroupId);
      if (!Number.isFinite(targetGroupId) || targetGroupId <= 0) return;
      const sourceField = resolveFieldCode(a?.sourceField);
      if (!sourceField) return;
      const modeRaw = String(a?.mode || 'exact').toLowerCase();
      const mode: 'exact' | 'min' | 'max' = modeRaw === 'min' || modeRaw === 'max' ? modeRaw : 'exact';
      const defaultApplyOn: Array<'add' | 'page_save' | 'submit'> = ['add', 'page_save', 'submit'];
      const applyOnRaw = Array.isArray(a?.applyOn) ? a.applyOn : defaultApplyOn;
      const applyOn = applyOnRaw
        .map((x: any) => String(x || '').toLowerCase())
        .filter((x: string) => x === 'add' || x === 'page_save' || x === 'submit') as Array<'add' | 'page_save' | 'submit'>;
      const normalizedApplyOn: Array<'add' | 'page_save' | 'submit'> = applyOn.length > 0 ? applyOn : defaultApplyOn;
      const key = `${r?.id}|${targetGroupId}|${sourceField}|${mode}|${normalizedApplyOn.join(',')}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        id: Number(r?.id || 0),
        targetGroupId,
        sourceField,
        mode,
        applyOn: normalizedApplyOn,
        message: typeof a?.message === 'string' ? a.message : undefined,
        when: safeParseJSON(r?.when_json),
      });
    });
  });

  return out.sort((a, b) => a.id - b.id);
}

export function FormPreview({ serviceId, formTypeId }: Props) {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';
  const toast = useRef<Toast>(null);
  const { data, isLoading, isError, refetch } = useFormBuilderPreview(serviceId, formTypeId, locale);
  const plugin = useServicePlugin(serviceId);

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [addMoreValues, setAddMoreValues] = useState<AddMoreValues>({});
  const [addMoreGroupErrors, setAddMoreGroupErrors] = useState<Record<number, string>>({});
  const [dmsChecklists, setDmsChecklists] = useState<any[]>([]);
  const [mockUploadedByDocId, setMockUploadedByDocId] = useState<Record<number, { fileName: string; url: string }>>({});

  const prevValuesRef = useRef<Record<string, any>>({});
  const appendTo = useMemo(() => (typeof window === 'undefined' ? undefined : document.body), []);
  const pages = data?.pages ?? [];
  const meta = data?.meta;
  const rules = (data as any)?.rules as PreviewRule[] | undefined;
  const activePage = pages[activePageIndex];

  useEffect(() => { setTouched(new Set()); setErrors({}); }, [activePageIndex]);

  useEffect(() => {
    if (!serviceId) return;
    apiClient.get('/common/documents/dms', { params: { serviceId } })
      .then((res) => {
        const dms = res?.data;
        const types = Array.isArray(dms?.documentTypes) ? dms.documentTypes : [];
        const rows = types.flatMap((type: any) => {
          const checklists = Array.isArray(type?.checklists) ? type.checklists : [];
          return checklists.map((checklist: any) => ({
            ...checklist,
            __typeName: type?.name || '',
          }));
        });
        setDmsChecklists(rows);
      })
      .catch(() => setDmsChecklists([]));
  }, [serviceId]);

  useEffect(() => {
    return () => {
      Object.values(mockUploadedByDocId).forEach((item) => {
        if (item?.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [mockUploadedByDocId]);

  const hiddenFieldIds = useMemo(() => {
    const ids = new Set<number>();
    if (!data?.pages) return ids;
    for (const p of data.pages) {
      for (const c of p.categories) {
        for (const f of c.fields) {
          if (f.input_type === 'addmore' && f.add_more_groups) {
            for (const g of f.add_more_groups) {
              for (const col of g.columns) { if (col.builder_field_id) ids.add(col.builder_field_id); }
            }
          }
        }
      }
    }
    return ids;
  }, [data]);

  const allTopLevelFields = useMemo(() => {
    const list: PreviewField[] = [];
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          list.push(f);
        }
      }
    }
    return list;
  }, [pages]);

  const fieldIdToCode = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          map.set(f.id, f.field_code);
          if (f.add_more_groups) { f.add_more_groups.forEach(g => g.columns.forEach(col => map.set(col.builder_field_id, col.field_code))); }
        }
      }
    }
    return map;
  }, [pages]);

  const resolveFieldCode = useCallback((ref: any): string | null => {
    if (ref === null || ref === undefined) return null;
    if (typeof ref === 'number') return fieldIdToCode.get(ref) ?? null;
    const s = String(ref).trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) return fieldIdToCode.get(Number(s)) ?? null;
    return s;
  }, [fieldIdToCode]);

  const computedOverrides = useMemo<Record<string, FieldOverrides>>(() => {
    const out: Record<string, FieldOverrides> = {};
    const activeRulesRaw = (rules ?? []).filter((r) => String(r?.is_active ?? '').toUpperCase() === 'Y');
    const latestRuleByWhen = new Map<string, any>();
    activeRulesRaw.forEach((r: any) => {
      const key = JSON.stringify(safeParseJSON(r?.when_json) ?? {});
      const prev = latestRuleByWhen.get(key);
      if (!prev || Number(r?.id || 0) > Number(prev?.id || 0)) {
        latestRuleByWhen.set(key, r);
      }
    });
    const activeRules = Array.from(latestRuleByWhen.values()).sort(
      (a: any, b: any) => Number(a?.id || 0) - Number(b?.id || 0),
    );

    for (const r of activeRules) {
      const whenJson = safeParseJSON(r.when_json);
      const thenJson = safeParseJSON(r.then_json);
      try {
        if (evalConditionTree(whenJson, values, resolveFieldCode)) {
          const actions = normalizeThenActions(thenJson, resolveFieldCode);
          for (const a of actions) {
            if (!out[a.field]) out[a.field] = {};
            out[a.field][a.prop] = a.value;
          }
        }
      } catch { }
    }

    // ✅ Apply plugin-level visibility overrides
    if (plugin?.isFieldVisible) {
      for (const field of allTopLevelFields) {
        const fieldCode = field.field_code;
        const pluginVis = plugin.isFieldVisible(fieldCode, values);
        if (pluginVis !== undefined) {
          if (!out[fieldCode]) out[fieldCode] = {};
          out[fieldCode].visible = pluginVis;
        }
      }
    }

    if (plugin?.isFieldRequired) {
      for (const field of allTopLevelFields) {
        const fieldCode = field.field_code;
        const pluginRequired = plugin.isFieldRequired(fieldCode, values);
        if (pluginRequired !== undefined) {
          if (!out[fieldCode]) out[fieldCode] = {};
          out[fieldCode].required = pluginRequired;
        }
      }
    }

    return out;
  }, [rules, values, resolveFieldCode, plugin, allTopLevelFields]);

  const addMoreRowRules = useMemo(
    () => buildAddMoreRowRules(rules ?? [], resolveFieldCode),
    [rules, resolveFieldCode],
  );

  const getEffectiveAddMoreConstraint = useCallback((
    groupId: number,
    stage: 'add' | 'page_save' | 'submit',
  ): { mode: 'exact' | 'min' | 'max'; expectedRows: number; message?: string } | null => {
    const candidates = addMoreRowRules
      .filter((r) => Number(r.targetGroupId) === Number(groupId) && r.applyOn.includes(stage))
      .filter((r) => {
        if (!r.when || (typeof r.when === 'object' && Array.isArray((r.when as any).all) && (r.when as any).all.length === 0)) return true;
        try {
          return evalConditionTree(r.when, values, resolveFieldCode);
        } catch {
          return false;
        }
      })
      .sort((a, b) => b.id - a.id);
    const selected = candidates[0];
    if (!selected) return null;
    const sourceRaw = values?.[selected.sourceField];
    const expectedRows = Number(sourceRaw);
    if (!Number.isFinite(expectedRows) || expectedRows < 0) return null;
    return { mode: selected.mode, expectedRows: Math.floor(expectedRows), message: selected.message };
  }, [addMoreRowRules, resolveFieldCode, values]);

  useEffect(() => {
    if (!data) return;
    setErrors({});
    const groups: PreviewAddMoreGroup[] = [];
    for (const p of pages) {
      for (const c of p.categories ?? []) {
        for (const f of c.fields ?? []) {
          if (f.input_type === 'addmore' && Array.isArray(f.add_more_groups)) {
            for (const g of f.add_more_groups) groups.push(g);
          }
        }
      }
    }
    setAddMoreValues((prev) => {
      const next: AddMoreValues = { ...prev };
      for (const g of groups) {
        const existing = next[g.id] ?? [];
        const minRows = Math.max(1, Number(g.min_rows ?? 0));
        if (existing.length >= minRows) continue;
        next[g.id] = [
          ...existing,
          ...Array.from({ length: minRows - existing.length }).map(() =>
            buildDefaultValuesForFields((g.columns ?? []) as any[]),
          ),
        ];
      }
      return next;
    });
  }, [data, pages]);

  useEffect(() => {
    if (!data) return;
    const defaults = buildDefaultValuesForFields(allTopLevelFields as any[]);
    if (Object.keys(defaults).length === 0) return;

    setValues((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [fieldCode, defaultValue] of Object.entries(defaults)) {
        if (!isEmptyValue(next[fieldCode])) continue;
        next[fieldCode] = defaultValue;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [data, allTopLevelFields]);

  const headerTitle = useMemo(() => {
    if (!meta) return 'Generate Form — Preview';
    const svc = `${meta.serviceId}${meta.serviceName ? ` (${meta.serviceName})` : ''}`;
    const ft = `${meta.formTypeId}${meta.formTypeName ? ` (${meta.formTypeName})` : ''}`;
    return `Generate Form — Preview • Service: ${svc} • Form Type: ${ft}`;
  }, [meta]);

  const resetAll = useCallback(() => {
    setValues(buildDefaultValuesForFields(allTopLevelFields as any[]));
    setErrors({});
    setAddMoreValues({});
    setTouched(new Set());
    prevValuesRef.current = {};
  }, [allTopLevelFields]);

  const validateField = useCallback((field: any, value: any, override?: FieldOverrides) => {
    const key = field.field_code;
    const required = override?.required ?? field.is_required === 'Y';
    if (required && isEmptyValue(value)) return `${field.label || key} is required`;

    const rules = safeParseJSON(field.validation_rule) || {};

    // ✅ FIX: Strict File Mime Type Validation
    if (value instanceof File || (value && typeof value === 'object' && value.name)) {
      const accept = rules.accept;
      if (accept) {
        const fileExt = '.' + value.name.split('.').pop()?.toLowerCase();
        const acceptedTypes = accept.split(',').map((t: string) => t.trim().toLowerCase());
        // Check if extension or exact mime type matches
        if (!acceptedTypes.includes(fileExt) && !acceptedTypes.includes(value.type)) {
          return `Invalid file type. Allowed: ${accept}`;
        }
      }
      return ''; // Files do not need string length validations
    }

    const pattern = rules.regex || rules.pattern || rules.regexPattern || (field as any).pattern;
    const minL = rules.min_length ?? rules.min ?? rules.minLength ?? (field as any).min_length;
    const maxL = rules.max_length ?? rules.max ?? rules.maxLength ?? (field as any).max_length;

    const inputType = String((field as any).input_type || (field as any).type || '').toLowerCase();

    if (['date', 'datetime-local'].includes(inputType) && !allowsPreviousDate(rules) && isPreviousDateValue(value, inputType)) {
      return inputType === 'date'
        ? `${field.label || key} cannot be a previous date`
        : `${field.label || key} cannot be a previous date/time`;
    }

    if (['date', 'datetime-local'].includes(inputType) && !allowsFutureDate(rules) && isFutureDateValue(value, inputType)) {
      return inputType === 'date'
        ? `${field.label || key} cannot be a future date`
        : `${field.label || key} cannot be a future date/time`;
    }

    if (
      ['text', 'textarea', 'tel', 'number'].includes(inputType) &&
      isAadhaarVerhoeffEnabled(rules) &&
      !isEmptyValue(value) &&
      !isValidAadhaarNumber(value)
    ) {
      return rules.message || `${field.label || key} must be a valid Aadhaar number`;
    }

    // Number field: digit-count based min/max + regex
    if (inputType === 'number' && value !== '' && value !== null && value !== undefined) {
      // Value may be string (InputText digit mode) or number — always use digit count
      const strVal = String(value).replace(/\D/g, '');
      const digitCount = strVal.length;
      if (minL !== undefined && minL !== null && digitCount < Number(minL)) return `At least ${minL} digit${Number(minL) > 1 ? 's' : ''}`;
      if (maxL !== undefined && maxL !== null && digitCount > Number(maxL)) return `At most ${maxL} digit${Number(maxL) > 1 ? 's' : ''}`;
      if (pattern) {
        try { if (!new RegExp(pattern).test(String(value))) return rules.message || 'Invalid format'; } catch (e) { }
      }
      return '';
    }

    // Text / textarea / email / tel: character-count based min/max + regex
    if (typeof value === 'string' && value) {
      const len = value.trim().length;
      if (minL !== undefined && minL !== null && len < Number(minL)) return `At least ${minL} char${Number(minL) > 1 ? 's' : ''}`;
      if (maxL !== undefined && maxL !== null && len > Number(maxL)) return `At most ${maxL} char${Number(maxL) > 1 ? 's' : ''}`;
      // Email: automatic format validation (unless user already set a custom regex)
      if (inputType === 'email' && !pattern) {
        const emailRx = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRx.test(value)) return 'Must be a valid email address';
      }
      if (pattern) {
        try { if (!new RegExp(pattern).test(value)) return rules.message || 'Invalid format'; } catch (e) { }
      }
    }

    // Check plugin's custom validation
    if (plugin?.validateField) {
      const pluginError = plugin.validateField(key, value, values);
      if (pluginError) return pluginError;
    }

    return '';
  }, [plugin, values]);

  const onFieldChange = useCallback((field: PreviewField, nextValue: any) => {
    const key = field.field_code;
    setAddMoreGroupErrors({});
    setValues((prev) => {
      const next = { ...prev, [key]: nextValue };

      // ── Apply plugin field changes (e.g., auto-copy address fields) ─────────
      if (plugin?.onFieldChange) {
        const pluginResult = plugin.onFieldChange(key, nextValue, next);
        if (pluginResult && typeof pluginResult === 'object') {
          Object.assign(next, pluginResult);
        }
      }

      // Clear cascading descendants when a parent field changes (e.g. Country -> State -> District).
      const queue = [key];
      const visited = new Set<string>();
      while (queue.length) {
        const changedCode = queue.shift()!;
        if (visited.has(changedCode)) continue;
        visited.add(changedCode);

        for (const f of allTopLevelFields) {
          const parentId = (f as any)?.option_config?.parent_builder_field_id;
          if (!parentId) continue;
          const parentCode = fieldIdToCode.get(Number(parentId));
          if (parentCode !== changedCode) continue;

          if (next[f.field_code] !== undefined) {
            delete next[f.field_code];
          }
          queue.push(f.field_code);
        }
      }

      return next;
    });
    setTouched((prev) => new Set(prev).add(key));
    const ov = computedOverrides[key];
    const err = validateField(field, nextValue, ov);
    setErrors((prev) => { const copy = { ...prev }; if (err) copy[key] = err; else delete copy[key]; return copy; });
  }, [computedOverrides, validateField, allTopLevelFields, fieldIdToCode, plugin]);

  const onFieldBlur = useCallback((field: PreviewField) => {
    const key = field.field_code;
    const value = values[key];
    const ov = computedOverrides[key];
    const err = validateField(field, value, ov);
    setTouched((prev) => new Set(prev).add(key));
    setErrors((prev) => { const copy = { ...prev }; if (err) copy[key] = err; else delete copy[key]; return copy; });
  }, [computedOverrides, validateField, values]);

  const renderInput = useCallback((field: PreviewField) => {
    const key = field.field_code;
    const value = values[key];
    const ov = computedOverrides[key];
    let disabled = fieldDisabled(field.is_editable, field.is_readonly, ov);

    // Check plugin's isFieldReadonly override
    if (plugin?.isFieldReadonly) {
      const pluginReadonly = plugin.isFieldReadonly(key, values);
      if (pluginReadonly === true) {
        disabled = true;
      }
    }

    const opts = normalizeOptions(field.options);
    const placeholder = (field as any).placeholder ?? 'Enter value';
    const showError = errors[key] && (touched.has(key) || touched.has('ALL_PAGE'));
    const commonClass = `w-100 ${showError ? 'p-invalid' : ''}`;
    const fieldAny = field as any;
    const hasMasterOptions = !!fieldAny?.option_config?.master_table_id;
    const parentFieldId = fieldAny?.option_config?.parent_builder_field_id;
    let parentValue = undefined;
    if (parentFieldId) {
      const parentCode = fieldIdToCode.get(Number(parentFieldId));
      if (parentCode) parentValue = values[parentCode];
    }

    // ... inside renderInput switch statement ...
    switch (field.input_type) {
      case 'textarea': return <InputTextarea className={commonClass} value={value ?? ''} onChange={(e) => onFieldChange(field, e.target.value)} onBlur={() => onFieldBlur(field)} rows={4} autoResize disabled={disabled} placeholder={placeholder} />;
      case 'number': {
        const vRuleP = safeParseJSON((field as any).validation_rule) || {};
        const maxDigitsP: number | undefined = typeof (field as any).max_length === 'number'
          ? (field as any).max_length
          : (typeof vRuleP.max_length === 'number' ? vRuleP.max_length : undefined);
        // When max_length is set: use InputText with digit-only filter — hard character limit
        if (maxDigitsP !== undefined) {
          return <InputText
            className={commonClass}
            value={value !== null && value !== undefined ? String(value) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, ''); // digits only
              if (raw.length > maxDigitsP) return;           // hard block
              onFieldChange(field, raw === '' ? null : raw);
            }}
            onBlur={() => onFieldBlur(field)}
            disabled={disabled}
            placeholder={placeholder}
            inputMode="numeric"
          />;
        }
        return <InputNumber className={commonClass} value={typeof value === 'number' ? value : value ?? null} onValueChange={(e) => onFieldChange(field, e.value)} onBlur={() => onFieldBlur(field)} disabled={disabled} useGrouping={false} step={field.step ? Number(field.step) : undefined} placeholder={placeholder} />;
      }
      case 'select':
        if (hasMasterOptions) {
          return (
            <DynamicFieldDropdown
              masterId={fieldAny.option_config.master_table_id}
              parentValue={parentValue}
              value={value}
              onChange={(v: any) => onFieldChange(field, v)}
              disabled={disabled}
              placeholder={placeholder}
              className={commonClass}
              appendTo={appendTo}
              isMulti={false}
            />
          );
        }
        return <Dropdown className={commonClass} value={value ? String(value) : null} options={opts} onChange={(e) => onFieldChange(field, e.value)} onBlur={() => onFieldBlur(field)} placeholder={placeholder} disabled={disabled} appendTo={appendTo} showClear filter />;
      case 'multiselect':
        if (hasMasterOptions) {
          return (
            <DynamicFieldDropdown
              masterId={fieldAny.option_config.master_table_id}
              parentValue={parentValue}
              value={value}
              onChange={(v: any) => onFieldChange(field, v)}
              disabled={disabled}
              placeholder={placeholder}
              className={commonClass}
              appendTo={appendTo}
              isMulti={true}
            />
          );
        }
        return <MultiSelect className={commonClass} value={value ?? []} options={opts} onChange={(e) => onFieldChange(field, e.value)} disabled={disabled} placeholder={placeholder} filter display="chip" />;
      case 'radio': return <div className="d-flex flex-column gap-2">{opts.length === 0 ? <small className="text-muted">No options configured</small> : opts.map((o) => <label key={`${key}:${String(o.value)}`} className="d-flex align-items-center gap-2"><RadioButton inputId={`${key}:${String(o.value)}`} name={key} value={String(o.value)} onChange={(e) => onFieldChange(field, e.value)} checked={String(value) === String(o.value)} disabled={disabled || Boolean(o.disabled)} /><span>{o.label}</span></label>)}</div>;
      case 'checkbox': {
        if (opts.length > 0) { const arr: any[] = Array.isArray(value) ? value : []; return <div className="d-flex flex-column gap-2">{opts.map((o) => <label key={`${key}:${String(o.value)}`} className="d-flex align-items-center gap-2"><Checkbox inputId={`${key}:${String(o.value)}`} checked={arr.includes(o.value)} onChange={(e) => { const checked = e.checked; const next = checked ? [...arr, o.value] : arr.filter((x) => x !== o.value); onFieldChange(field, next); }} disabled={disabled || Boolean(o.disabled)} /><span>{o.label}</span></label>)}</div>; }
        return <div className="d-flex align-items-center gap-2"><Checkbox inputId={key} checked={Boolean(value)} onChange={(e) => onFieldChange(field, e.checked)} disabled={disabled} /><label htmlFor={key} className="m-0">{field.label}</label></div>;
      }
      case 'date': {
        const rules = safeParseJSON((field as any).validation_rule) || {};
        const { minDate, maxDate } = getDateValidationBounds('date', rules);
        return <Calendar className={commonClass} value={value ? new Date(value) : null} onChange={(e) => onFieldChange(field, e.value)} showIcon dateFormat="dd/mm/yy" disabled={disabled} placeholder={placeholder} minDate={minDate} maxDate={maxDate} />;
      }
      case 'datetime-local': {
        const rules = safeParseJSON((field as any).validation_rule) || {};
        const { minDate, maxDate } = getDateValidationBounds('datetime-local', rules);
        return <Calendar className={commonClass} value={value ? new Date(value) : null} onChange={(e) => onFieldChange(field, e.value)} showIcon showTime disabled={disabled} placeholder={placeholder} minDate={minDate} maxDate={maxDate} />;
      }

      // ✅ FIX: File Upload logic safely isolated. NO 'value' property is set!
      case 'file': {
        // ✅ ADDED (field as any) to bypass strict TypeScript build errors
        const rules = safeParseJSON((field as any).validation_rule) || {};
        return (
          <div className="d-flex flex-column gap-1">
            <input type="file" className={`form-control ${commonClass}`} accept={rules.accept || '*'} onChange={(e) => onFieldChange(field, e.target.files?.[0])} disabled={disabled} />
            {value instanceof File && <small className="text-success fw-bold"><i className="pi pi-check-circle me-1" /> {value.name}</small>}
          </div>
        );
      }

      case 'button': {
        const ACTION_BTN_STYLES: Record<string, { bg: string; border: string }> = {
          APPROVE: { bg: '#16a34a', border: '#15803d' },
          SUBMIT: { bg: '#2563eb', border: '#1d4ed8' },
          SUBMIT_REPORT: { bg: '#2563eb', border: '#1d4ed8' },
          FORWARD: { bg: '#2563eb', border: '#1d4ed8' },
          FORWARD_TO_APPROVER: { bg: '#2563eb', border: '#1d4ed8' },
          FORWARD_TO_DEPARTMENT: { bg: '#2563eb', border: '#1d4ed8' },
          SUBMIT_TO_NODAL: { bg: '#2563eb', border: '#1d4ed8' },
          REJECT: { bg: '#dc2626', border: '#b91c1c' },
          REVERT_TO_APPLICANT: { bg: '#ea580c', border: '#c2410c' },
          REVERT_TO_INVESTOR: { bg: '#ea580c', border: '#c2410c' },
          REVERT_TO_NODAL: { bg: '#ea580c', border: '#c2410c' },
          QUERY: { bg: '#d97706', border: '#b45309' },
          SAVE_DRAFT: { bg: '#64748b', border: '#475569' },
          HOLD: { bg: '#64748b', border: '#475569' },
        };
        const rules = safeParseJSON((field as any).validation_rule) || {};
        const actionCode = String(rules.action_code || '').toUpperCase();
        const btnStyle = ACTION_BTN_STYLES[actionCode] || { bg: '#6b7280', border: '#4b5563' };
        const label = (field as any).custom_label || field.label || actionCode || 'Action';
        return (
          <button
            type="button"
            disabled
            style={{ backgroundColor: btnStyle.bg, borderColor: btnStyle.border, color: '#fff', border: '1px solid', borderRadius: 6, padding: '8px 20px', fontWeight: 600, opacity: 0.85, cursor: 'default' }}
          >
            {label}
          </button>
        );
      }

      default: return <InputText className={commonClass} type={field.input_type || 'text'} value={value ?? ''} onChange={(e) => {
        const next = e.target.value;
        const maxLen = (field as any).max_length ?? (safeParseJSON((field as any).validation_rule) || {}).max_length;
        if (typeof maxLen === 'number' && next.length > maxLen) return;
        onFieldChange(field, next);
      }} onBlur={() => onFieldBlur(field)} disabled={disabled} placeholder={placeholder} />;
    }
  }, [appendTo, computedOverrides, errors, onFieldBlur, onFieldChange, values, touched, fieldIdToCode, plugin]);

  const addRow = useCallback((group: PreviewAddMoreGroup) => {
    setAddMoreValues((prev) => {
      const current = prev[group.id] ?? [];
      const dynamic = getEffectiveAddMoreConstraint(group.id, 'add');
      const enforcedMax =
        dynamic?.mode === 'exact' || dynamic?.mode === 'max'
          ? Number(dynamic.expectedRows)
          : null;
      const staticMax = group.max_rows ?? null;
      const finalMax = Number.isFinite(Number(enforcedMax)) ? Number(enforcedMax) : staticMax;
      if (typeof finalMax === 'number' && current.length >= finalMax) {
        setAddMoreGroupErrors((prevErr) => ({
          ...prevErr,
          [group.id]:
            dynamic?.message ||
            (dynamic?.mode === 'exact'
              ? `You can add exactly ${finalMax} row(s).`
              : `You can add maximum ${finalMax} row(s).`),
        }));
        return prev;
      }
      setAddMoreGroupErrors((prevErr) => {
        if (!prevErr[group.id]) return prevErr;
        const next = { ...prevErr };
        delete next[group.id];
        return next;
      });
      return {
        ...prev,
        [group.id]: [...current, buildDefaultValuesForFields((group.columns ?? []) as any[])],
      };
    });
  }, [getEffectiveAddMoreConstraint]);

  const removeRow = useCallback((group: PreviewAddMoreGroup, rowIndex: number) => {
    setAddMoreValues((prev) => {
      const current = prev[group.id] ?? [];
      const dynamic = getEffectiveAddMoreConstraint(group.id, 'add');
      const dynamicMin =
        dynamic?.mode === 'exact' || dynamic?.mode === 'min'
          ? Number(dynamic.expectedRows)
          : null;
      const staticMin = Number(group.min_rows ?? 0);
      const finalMin = Number.isFinite(Number(dynamicMin)) ? Number(dynamicMin) : staticMin;
      if (current.length <= finalMin) {
        setAddMoreGroupErrors((prevErr) => ({
          ...prevErr,
          [group.id]:
            dynamic?.message ||
            (dynamic?.mode === 'exact'
              ? `At least ${finalMin} row(s) required.`
              : `Minimum ${finalMin} row(s) required.`),
        }));
        return prev;
      }
      setAddMoreGroupErrors((prevErr) => {
        if (!prevErr[group.id]) return prevErr;
        const next = { ...prevErr };
        delete next[group.id];
        return next;
      });
      return { ...prev, [group.id]: current.filter((_, idx) => idx !== rowIndex) };
    });
  }, [getEffectiveAddMoreConstraint]);

  const onAddMoreCellChange = useCallback((groupId: number, rowIndex: number, column: PreviewAddMoreColumn, nextValue: any, groupColumns: any[]) => {
    const key = column.field_code;
    setAddMoreGroupErrors((prevErr) => {
      if (!prevErr[groupId]) return prevErr;
      const next = { ...prevErr };
      delete next[groupId];
      return next;
    });
    setAddMoreValues((prev) => {
      const rows = prev[groupId] ?? [];
      if (!rows[rowIndex]) return prev;
      const nextRows = rows.map((row, idx) => {
        if (idx !== rowIndex) return row;
        const updatedRow = { ...row, [key]: nextValue };

        // ✅ CASCADE CLEAR
        groupColumns.forEach((childCol: any) => {
          const pId = childCol.option_config?.parent_builder_field_id;
          if (pId) {
            const pCode = fieldIdToCode.get(Number(pId));
            if (pCode === key) {
              delete updatedRow[childCol.field_code];
            }
          }
        });
        return updatedRow;
      });
      return { ...prev, [groupId]: nextRows };
    });
    setTouched((prev) => new Set(prev).add(`${groupId}_${rowIndex}_${key}`));
  }, [fieldIdToCode]);

  const renderAddMoreColumnInput = useCallback((groupId: number, rowIndex: number, col: PreviewAddMoreColumn, rowValues: Record<string, any>, groupColumns: any[]) => {
    const key = col.field_code;
    const value = rowValues[key];
    const disabled = fieldDisabled(col.is_editable, col.is_readonly);
    const commonClass = 'w-100';

    const colAny = col as any;
    const mockField = { ...col, validation_rule: colAny.validation_rule, min_length: colAny.min_length, max_length: colAny.max_length, pattern: colAny.pattern };

    const err = validateField(mockField, value);
    const fieldKey = `${groupId}_${rowIndex}_${key}`;
    const showErr = err && (touched.has(fieldKey) || touched.has('ALL_PAGE'));
    const inputProps = { className: `${commonClass} ${showErr ? 'p-invalid' : ''}`, disabled: disabled, placeholder: colAny.placeholder || 'Enter value' };

    const isCascading = !!colAny.option_config?.master_table_id;
    const parentFieldId = colAny.option_config?.parent_builder_field_id;

    if (isCascading) {
      let parentValue = undefined;
      if (parentFieldId) {
        const parentCode = fieldIdToCode.get(Number(parentFieldId));
        if (parentCode) {
          parentValue = rowValues[parentCode]; // Row priority
          if (parentValue === undefined) parentValue = values[parentCode]; // Global fallback
        }
      }

      const isMulti = col.input_type === 'multiselect';
      return (
        <div>
          <AddMoreDynamicDropdown masterId={colAny.option_config.master_table_id} parentValue={parentValue} value={value} onChange={(v: any) => onAddMoreCellChange(groupId, rowIndex, col, v, groupColumns)} disabled={disabled} placeholder={colAny.placeholder || "Select"} className={inputProps.className} appendTo={appendTo} isMulti={isMulti} />
          {showErr && <small className="text-danger d-block mt-1">{err}</small>}
        </div>
      );
    }

    const opts = normalizeOptions(col.options);

    // ... inside renderAddMoreColumnInput switch statement ...
    const inputNode = (() => {
      switch (col.input_type) {
        case 'textarea': return <InputTextarea {...inputProps} value={value ?? ''} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.target.value, groupColumns)} rows={3} autoResize />;
        case 'number': return <InputNumber {...inputProps} value={typeof value === 'number' ? value : value ?? null} onValueChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value, groupColumns)} useGrouping={false} step={col.step ? Number(col.step) : undefined} />;
        case 'date': {
          const rules = safeParseJSON(colAny.validation_rule) || {};
          const { minDate, maxDate } = getDateValidationBounds('date', rules);
          return <Calendar {...inputProps} value={value ? new Date(value) : null} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value, groupColumns)} showIcon dateFormat="dd/mm/yy" minDate={minDate} maxDate={maxDate} />;
        }
        case 'datetime-local': {
          const rules = safeParseJSON(colAny.validation_rule) || {};
          const { minDate, maxDate } = getDateValidationBounds('datetime-local', rules);
          return <Calendar {...inputProps} value={value ? new Date(value) : null} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value, groupColumns)} showIcon showTime minDate={minDate} maxDate={maxDate} />;
        }
        case 'select': return <Dropdown {...inputProps} value={value ? String(value) : null} options={opts} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value, groupColumns)} placeholder={colAny.placeholder || "Select"} appendTo={appendTo} showClear filter />;
        case 'multiselect': return <MultiSelect {...inputProps} value={value ?? []} options={opts} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.value, groupColumns)} placeholder={colAny.placeholder || "Select"} filter display="chip" />;
        case 'checkbox': return <Checkbox checked={Boolean(value)} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.checked, groupColumns)} disabled={disabled} />;

        // ✅ FIX: File Upload logic for AddMore Row
        case 'file': {
          const rules = safeParseJSON(colAny.validation_rule) || {};
          // Delete the invalid value prop before passing to input
          const { value: _discard, ...safeInputProps } = inputProps as any;
          return (
            <div className="d-flex flex-column gap-1">
              <input type="file" className={`form-control ${inputProps.className}`} accept={rules.accept || '*'} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.target.files?.[0], groupColumns)} disabled={disabled} />
              {value instanceof File && <small className="text-success fw-bold"><i className="pi pi-check-circle me-1" /> {value.name}</small>}
            </div>
          );
        }

        default: return <InputText {...inputProps} type={col.input_type || 'text'} value={value ?? ''} onChange={(e) => onAddMoreCellChange(groupId, rowIndex, col, e.target.value, groupColumns)} />;
      }
    })();

    return (
      <div>
        {inputNode}
        {showErr && <small className="text-danger d-block mt-1">{err}</small>}
      </div>
    );
  }, [onAddMoreCellChange, appendTo, validateField, touched, fieldIdToCode, values]);

  const renderAddMoreGroup = useCallback((group: PreviewAddMoreGroup, fieldLabel: string) => {
    const rows = addMoreValues[group.id] ?? [];
    const maxRows = group.max_rows ?? null;

    // ✅ FALLBACK HEURISTIC: Overwrite generic "Add More Details" labels with the main field's label.
    let displayLabel = group.label && group.label.trim() !== '' ? group.label : 'Add Entry';
    if (displayLabel.toLowerCase().includes('add more')) {
      displayLabel = fieldLabel || 'Add Entry';
    }

    const sortedCols = (group.columns ?? []).slice().sort((a, b) => (a.col_order ?? 0) - (b.col_order ?? 0));
    const mappedText =
      typeof maxRows === 'number'
        ? `Rows mapped: ${rows.length} / ${maxRows}`
        : `Rows mapped: ${rows.length}`;

    return (
      <div className="border rounded-3 p-3 bg-white preview-addmore-card">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
          <div className="fw-semibold">{displayLabel}</div>
          <small className="text-muted">{mappedText}</small>
        </div>

        <div className="table-responsive preview-addmore-table-wrap">
          <table className="table table-sm align-middle mb-0 preview-addmore-table">
            <thead>
              <tr>
                {sortedCols.map((col) => (
                  <th key={`hdr:${group.id}:${col.field_code}`} className="fw-semibold small">
                    <span>{col.label}</span>
                    {col.is_required === 'Y' && <span className="text-danger ms-1">*</span>}
                  </th>
                ))}
                <th className="fw-semibold small text-center" style={{ width: 70 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={sortedCols.length + 1} className="text-center text-muted py-3">
                    No rows added. Click "Add" to begin.
                  </td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => (
                  <tr key={`${group.id}:${rowIndex}`}>
                    {sortedCols.map((col) => (
                      <td key={`${group.id}:${rowIndex}:${col.field_code}`}>
                        {renderAddMoreColumnInput(group.id, rowIndex, col, row, sortedCols)}
                      </td>
                    ))}
                    <td className="text-center">
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        text
                        rounded
                        severity="danger"
                        onClick={() => removeRow(group, rowIndex)}
                        disabled={rows.length <= Number(group.min_rows ?? 0)}
                        aria-label={`Remove row ${rowIndex + 1}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="d-flex align-items-center gap-2 mt-2">
          <Button
            type="button"
            label={`Add ${displayLabel}`}
            icon="pi pi-plus"
            size="small"
            outlined
            onClick={() => addRow(group)}
            disabled={typeof maxRows === 'number' ? rows.length >= maxRows : false}
          />
          <small className="text-muted">
            ({rows.length}
            {typeof maxRows === 'number' ? ` / ${maxRows}` : ''} rows)
          </small>
        </div>
        {addMoreGroupErrors[group.id] ? (
          <small className="text-danger d-block mt-2">{addMoreGroupErrors[group.id]}</small>
        ) : null}
      </div>
    );
  }, [addMoreValues, addMoreGroupErrors, addRow, removeRow, renderAddMoreColumnInput]);

  const evaluateCondition = useCallback((condition: any) => {
    if (!condition?.fieldName) return true;
    const left = values?.[condition.fieldName];
    const rightRaw = condition?.value;
    const operator = String(condition?.operator || 'eq').toLowerCase();

    const leftStr = left === undefined || left === null ? '' : String(left);
    const rightStr = rightRaw === undefined || rightRaw === null ? '' : String(rightRaw);
    const leftNum = Number(left);
    const rightNum = Number(rightRaw);

    switch (operator) {
      case 'eq': return leftStr === rightStr;
      case 'neq': return leftStr !== rightStr;
      case 'gt': return Number.isFinite(leftNum) && Number.isFinite(rightNum) ? leftNum > rightNum : false;
      case 'gte': return Number.isFinite(leftNum) && Number.isFinite(rightNum) ? leftNum >= rightNum : false;
      case 'lt': return Number.isFinite(leftNum) && Number.isFinite(rightNum) ? leftNum < rightNum : false;
      case 'lte': return Number.isFinite(leftNum) && Number.isFinite(rightNum) ? leftNum <= rightNum : false;
      case 'contains': return leftStr.toLowerCase().includes(rightStr.toLowerCase());
      default: return true;
    }
  }, [values]);

  const docsForField = useCallback((fieldCode: string) => {
    return dmsChecklists.filter((doc: any) => {
      const showAfterField = String(doc?.showAfter?.fieldName || '').trim();
      if (!showAfterField || showAfterField !== fieldCode) return false;
      return evaluateCondition(doc?.showCondition);
    });
  }, [dmsChecklists, evaluateCondition]);

  const handleMockPreviewUpload = useCallback((docId: number, file?: File | null) => {
    if (!file) return;
    setMockUploadedByDocId((prev) => {
      const existing = prev[docId];
      if (existing?.url) URL.revokeObjectURL(existing.url);
      return { ...prev, [docId]: { fileName: file.name, url: URL.createObjectURL(file) } };
    });

    setTimeout(() => {
      setMockUploadedByDocId((prev) => {
        const existing = prev[docId];
        if (existing?.url) URL.revokeObjectURL(existing.url);
        const { [docId]: _removed, ...rest } = prev;
        return rest;
      });
    }, 20000);
  }, []);

  const renderField = useCallback((field: PreviewField) => {
    const key = field.field_code; const ov = computedOverrides[key]; const visible = ov?.visible ?? true; const required = ov?.required ?? field.is_required === 'Y';
    if (!visible) return null;

    if (field.input_type === 'addmore') {
      const groups = field.add_more_groups ?? [];
      return (
        <div className="d-flex flex-column gap-3">
          {groups.length === 0 ? <Message severity="warn" text="No AddMore group configured." /> : groups.map((g) => <div key={`group:${g.id}`}>{renderAddMoreGroup(g, field.label)}</div>)}
        </div>
      );
    }

    if (field.input_type === 'button') {
      return <div className="d-flex align-items-end h-100">{renderInput(field)}</div>;
    }

    return (
      <div className="d-flex flex-column h-100">
        <label className="form-label fw-semibold d-flex align-items-center mb-2">
          <span className="me-1">{field.label}</span>
          {required ? <span className="text-danger me-2">*</span> : null}
          {field.help_text && (
            <>
              <i className="pi pi-question-circle text-primary cursor-pointer ms-1" id={`tt_${field.id}`} data-pr-tooltip={field.help_text} data-pr-position="top" style={{ fontSize: '1.1rem' }} />
              <Tooltip target={`#tt_${field.id}`} />
            </>
          )}
        </label>
        <div className="preview-input-with-upload d-flex align-items-stretch">
          <div className="preview-input-holder flex-grow-1">
            {renderInput(field)}
          </div>
          {docsForField(String(field.field_code || '')).length > 0 && (
            <div className="d-flex align-items-stretch gap-0 preview-upload-affix-group">
              {docsForField(String(field.field_code || '')).map((doc: any) => {
                const inputId = `preview-upload-${field.id}-${doc.id}`;
                const accept = normalizeAllowedFormats(doc?.allowedFormats).join(',');
                return (
                  <div key={`preview-doc-icon-${field.id}-${doc.id}`}>
                    <input
                      id={inputId}
                      type="file"
                      className="d-none"
                      accept={accept || undefined}
                      onChange={(e) => handleMockPreviewUpload(Number(doc?.id), e.target.files?.[0] || null)}
                    />
                    <label
                      htmlFor={inputId}
                      className="d-inline-flex align-items-center justify-content-center border preview-upload-affix-btn"
                      style={{ padding: 0, cursor: 'pointer' }}
                      title={`Upload: ${doc?.name || `Document ${doc?.id}`}`}
                      aria-label={`Upload: ${doc?.name || `Document ${doc?.id}`}`}
                    >
                      <i className="pi pi-upload" style={{ fontSize: '0.85rem' }} />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {docsForField(String(field.field_code || '')).length > 0 && (
          <div className="mt-2 d-flex flex-column gap-1">
            {docsForField(String(field.field_code || '')).map((doc: any) => {
              const allowedExts = normalizeAllowedFormats(doc?.allowedFormats);
              const uploaded = mockUploadedByDocId[Number(doc?.id)];
              return (
                <div key={`preview-doc-meta-${field.id}-${doc.id}`} className="d-flex align-items-center gap-2 flex-wrap">
                  <small className={uploaded ? 'text-success' : 'text-muted'} style={{ fontSize: '0.72rem' }}>
                    {doc?.name || `Document ${doc?.id}`}: {uploaded ? 'Uploaded (Preview)' : 'Not uploaded'}
                  </small>
                  {allowedExts.length > 0 ? <small className="text-muted" style={{ fontSize: '0.72rem' }}>Allowed: {allowedExts.join(', ')}</small> : null}
                  {uploaded ? (
                    <a href={uploaded.url} target="_blank" rel="noreferrer" className="text-primary text-decoration-underline" style={{ fontSize: '0.72rem' }}>
                      View uploaded file
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {errors[key] && (touched.has(key) || touched.has('ALL_PAGE')) ? <small className="text-danger d-block mt-1">{errors[key]}</small> : null}
      </div>
    );
  }, [computedOverrides, errors, renderAddMoreGroup, renderInput, touched, docsForField, handleMockPreviewUpload, mockUploadedByDocId]);

  const onNext = useCallback(() => {
    setAddMoreGroupErrors({});
    const currentFields = activePage?.categories.flatMap(c => c.fields) || [];
    let valid = true;
    const newErrors: Errors = {};
    const newTouched = new Set(touched);
    newTouched.add('ALL_PAGE');

    for (const field of currentFields) {
      if (!hiddenFieldIds.has(field.id)) {
        const ov = computedOverrides[field.field_code];
        if (ov?.visible === false) continue;
        if (field.input_type === 'addmore') {
          const groups = field.add_more_groups ?? [];
          groups.forEach((g: any) => {
            const rows = addMoreValues[g.id] || [];
            const staticMin = Number(g.min_rows ?? 0);
            const staticMax = typeof g.max_rows === 'number' ? Number(g.max_rows) : null;
            if (rows.length < staticMin) {
              valid = false;
              setAddMoreGroupErrors((prev) => ({ ...prev, [g.id]: `Minimum ${staticMin} row(s) required.` }));
            }
            if (staticMax !== null && rows.length > staticMax) {
              valid = false;
              setAddMoreGroupErrors((prev) => ({ ...prev, [g.id]: `Maximum ${staticMax} row(s) allowed.` }));
            }
            const dynamic = getEffectiveAddMoreConstraint(g.id, 'page_save');
            if (dynamic) {
              const expected = Number(dynamic.expectedRows);
              if (Number.isFinite(expected)) {
                if (dynamic.mode === 'exact' && rows.length !== expected) {
                  valid = false;
                  setAddMoreGroupErrors((prev) => ({
                    ...prev,
                    [g.id]: dynamic.message || `Rows must be exactly ${expected}. Current: ${rows.length}.`,
                  }));
                }
                if (dynamic.mode === 'min' && rows.length < expected) {
                  valid = false;
                  setAddMoreGroupErrors((prev) => ({
                    ...prev,
                    [g.id]: dynamic.message || `At least ${expected} row(s) required.`,
                  }));
                }
                if (dynamic.mode === 'max' && rows.length > expected) {
                  valid = false;
                  setAddMoreGroupErrors((prev) => ({
                    ...prev,
                    [g.id]: dynamic.message || `Maximum ${expected} row(s) allowed.`,
                  }));
                }
              }
            }
          });
        } else {
          if ((field.is_required === 'Y' || ov?.required) && isEmptyValue(values[field.field_code])) {
            newErrors[field.field_code] = `${field.label} is required`;
            valid = false;
            newTouched.add(field.field_code);
          }
          const err = validateField(field, values[field.field_code], ov);
          if (err) { newErrors[field.field_code] = err; valid = false; newTouched.add(field.field_code); }
        }
      }
    }

    setTouched(newTouched);
    setErrors(newErrors);
    if (!valid) { toast.current?.show({ severity: 'error', summary: 'Validation Failed', detail: 'Please fill all required fields.' }); return; }
    setActivePageIndex((p) => Math.min(pages.length - 1, p + 1));
    setTouched(new Set());
    setErrors({});
  }, [activePage, values, errors, computedOverrides, pages.length, validateField, hiddenFieldIds, touched, addMoreValues, getEffectiveAddMoreConstraint]);

  const onPrev = useCallback(() => setActivePageIndex((p) => Math.max(0, p - 1)), []);

  const leftNav = useMemo(() => {
    return (
      <div className="border rounded-4 bg-white overflow-hidden shadow-sm" style={{ borderColor: '#dbe5f0' }}>
        <div className="px-3 py-3" style={{ background: 'linear-gradient(135deg, #093b69 0%, #0b5ea6 60%, #17a2c8 100%)', color: '#fff' }}>
          <div className="fw-semibold">Preview Steps</div>
          <small style={{ opacity: 0.9 }}>Navigate pages like an investor</small>
        </div>
        <div className="p-2">
          {pages.length === 0 ? <div className="p-3 text-muted">No pages configured.</div> : <div className="d-flex flex-column gap-2">{pages.map((p, idx) => {
            const active = idx === activePageIndex;
            return (
              <button
                key={`nav:${p.id}`}
                type="button"
                onClick={() => setActivePageIndex(idx)}
                className="border-0 text-start w-100 rounded-3 p-3 d-flex justify-content-between align-items-start"
                style={{
                  cursor: 'pointer',
                  background: active ? 'linear-gradient(135deg, rgba(13,110,253,0.12), rgba(13,110,253,0.04))' : '#fff',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(13,110,253,0.2)' : 'inset 0 0 0 1px #eef2f7',
                }}
              >
                <span className="d-flex flex-column text-start pe-2">
                  <span className="fw-semibold" style={{ color: active ? '#0b5ed7' : '#1f2937', lineHeight: 1.25 }}>{p.page_name || `Page ${idx + 1}`}</span>
                  <small className="text-muted">Order: {p.preference}</small>
                </span>
                <span className={`badge ${active ? 'bg-primary' : 'bg-light text-dark'}`} style={{ borderRadius: 999 }}>{idx + 1}</span>
              </button>
            );
          })}</div>}
        </div>
      </div>
    );
  }, [activePageIndex, pages]);

  if (isLoading) return <div className="container-fluid py-4"><Skeleton width="100%" height="400px" /></div>;
  if (isError || !data) return <div className="container-fluid py-4"><Message severity="error" text="Failed to load preview." /><Button label="Retry" onClick={() => refetch()} className="mt-3" /></div>;

  const note = (data as any)?.note as string | undefined;

  return (
    <div className="container-fluid py-4 form-builder-preview-shell">
      <style jsx global>{`
        .form-builder-preview-shell .preview-section-card {
          border: 1px solid #e6edf5;
          border-radius: 16px;
          background: #ffffff;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
        }
        .form-builder-preview-shell .form-label {
          margin-bottom: 6px !important;
          font-size: 13px !important;
        }
        .form-builder-preview-shell .p-inputtext,
        .form-builder-preview-shell .p-inputtextarea,
        .form-builder-preview-shell .p-inputnumber-input,
        .form-builder-preview-shell .p-calendar .p-inputtext,
        .form-builder-preview-shell input.form-control {
          min-height: 38px;
          border-radius: 9px !important;
          padding: 8px 10px !important;
          font-size: 13px !important;
        }
        .form-builder-preview-shell .p-dropdown,
        .form-builder-preview-shell .p-multiselect {
          min-height: 38px;
          border-radius: 9px !important;
        }
        .form-builder-preview-shell .p-dropdown .p-dropdown-label,
        .form-builder-preview-shell .p-multiselect .p-multiselect-label {
          padding: 8px 10px !important;
          font-size: 13px !important;
        }
        .form-builder-preview-shell .p-button {
          min-height: 38px;
          padding: 8px 12px;
          font-size: 13px;
          border-radius: 10px;
        }
        .form-builder-preview-shell .preview-field-grid > [class*="col-"] {
          display: flex;
        }
        .form-builder-preview-shell .preview-field-grid > [class*="col-"] > * {
          width: 100%;
        }
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder .p-inputtext,
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder .p-inputtextarea,
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder .p-inputnumber-input,
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder input.form-control,
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder .p-dropdown,
        .form-builder-preview-shell .preview-input-with-upload .preview-input-holder .p-multiselect {
          border-top-right-radius: 0 !important;
          border-bottom-right-radius: 0 !important;
        }
        .form-builder-preview-shell .preview-upload-affix-group .preview-upload-affix-btn {
          width: 42px;
          min-width: 42px;
          height: 42px;
          border-left: 0 !important;
          border-top-right-radius: 10px;
          border-bottom-right-radius: 10px;
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          margin-left: -1px;
          border-color: #d9dee7;
          background: #fff5f5;
          color: #dc2626;
        }
        .form-builder-preview-shell .preview-addmore-card {
          border-color: #dbe5f0 !important;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
        }
        .form-builder-preview-shell .preview-addmore-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
        }
        .form-builder-preview-shell .preview-addmore-table {
          margin-bottom: 0;
        }
        .form-builder-preview-shell .preview-addmore-table thead th {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          color: #334155;
          white-space: nowrap;
        }
        .form-builder-preview-shell .preview-addmore-table tbody td {
          background: #ffffff;
          border-top: 1px solid #eef2f7;
          vertical-align: top;
          min-width: 210px;
        }
        .form-builder-preview-shell .preview-addmore-table tbody td:last-child {
          min-width: 64px;
          width: 64px;
        }
      `}</style>
      <Toast ref={toast} />
      <div className="mb-3">
        <div className="rounded-4 p-4 d-flex flex-column gap-3 shadow-sm" style={{ background: 'radial-gradient(circle at top left, #10b8cf 0%, #0f6fb7 45%, #0b3f71 100%)', color: '#fff' }}>
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div className="d-flex flex-column gap-1">
              <div className="text-uppercase" style={{ letterSpacing: '0.08em', opacity: 0.95, fontSize: 12 }}>Investor Preview (No Submission)</div>
              <h2 className="m-0" style={{ fontWeight: 700, lineHeight: 1.2, fontSize: 'clamp(1.05rem, 1.8vw, 1.7rem)' }}>{headerTitle}</h2>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link href={`/${locale}/admin/master/form-builder/services/${serviceId}/forms/${formTypeId}/builder`} className="btn btn-light" style={{ borderRadius: 12, fontWeight: 600 }}>
                <i className="pi pi-arrow-left me-2" />Back to Builder
              </Link>
              <Button type="button" label="Reset Preview" icon="pi pi-refresh" severity="secondary" onClick={resetAll} rounded />
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <span className="badge bg-light text-dark px-3 py-2" style={{ borderRadius: 999 }}>Pages: {pages.length}</span>
            {activePage ? <span className="badge text-bg-info px-3 py-2" style={{ borderRadius: 999 }}>Active: {activePage.page_name || `Page ${activePageIndex + 1}`}</span> : null}
            {note ? <span className="badge bg-light text-dark px-3 py-2" style={{ borderRadius: 999 }}>{note}</span> : null}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-3">{leftNav}</div>
        <div className="col-12 col-lg-9">
          <div className="border rounded-4 bg-white overflow-hidden shadow-sm" style={{ borderColor: '#dbe5f0' }}>
            <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ borderColor: '#e8edf3' }}>
              <div className="d-flex flex-column">
                <div className="fw-semibold" style={{ color: '#0f172a' }}>{activePage?.page_name || (pages.length ? `Page ${activePageIndex + 1}` : 'No Page')}</div>
                <small className="text-muted">Step {pages.length ? activePageIndex + 1 : 0} of {pages.length}</small>
              </div>
              <div className="d-flex gap-2">
                <Button type="button" label="Previous" icon="pi pi-angle-left" outlined onClick={onPrev} disabled={activePageIndex <= 0} style={{ borderRadius: 10 }} />
                <Button type="button" label={activePageIndex >= pages.length - 1 ? 'Finish' : 'Next'} icon="pi pi-angle-right" iconPos="right" onClick={onNext} disabled={pages.length === 0 || activePageIndex >= pages.length - 1} style={{ borderRadius: 10 }} />
              </div>
            </div>

            <div className="p-4 p-md-4">
              {pages.length === 0 ? <Message severity="warn" text="No pages found." /> : (
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="d-flex flex-column gap-4">
                    {(activePage?.categories ?? []).slice().sort((a, b) => (a.preference ?? 0) - (b.preference ?? 0)).map((cat) => (
                      <div key={`cat:${cat.page_category_mapping_id}`} className="preview-section-card p-4" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)' }}>
                        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-3">
                          <div className="d-flex flex-column">
                            <div className="fw-semibold fs-5" style={{ color: '#0f172a' }}>{cat.category_name}</div>
                            {cat.help_text ? <small className="text-muted">{cat.help_text}</small> : <small className="text-muted">Configure and validate the fields for this category.</small>}
                          </div>
                          <span className="badge text-bg-secondary" style={{ borderRadius: 999 }}>Order: {cat.preference}</span>
                        </div>

                        <div className="row g-3 preview-field-grid">
                          {(cat.fields ?? []).slice().sort((a, b) => ((a.preference ?? 0) - (b.preference ?? 0)) || (a.id - b.id)).map((field) => {
                            if (hiddenFieldIds.has(field.id)) return null;
                            const node = renderField(field);
                            if (!node) return null;
                            const span = (field as any).grid_span || 12;
                            const spanClass = BOOTSTRAP_SPANS[span] || 'col-md-12';
                            const className = field.input_type === 'addmore' ? 'col-12' : `col-12 ${spanClass}`;
                            return <div key={`field:${field.id}`} className={className}>{node}</div>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


