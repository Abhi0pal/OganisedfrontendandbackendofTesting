'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

import {
  useFormAddMoreGroups,
  useCreateFormAddMoreGroup,
  useUpdateFormAddMoreGroup,
  useSetFormAddMoreColumns,
} from '@/hooks/master/useFormAddMore';
import { useFormBuilderFields } from '@/hooks/master/useFormBuilderFields';
import { useFormRules, useSaveFormRule } from '@/hooks/master/useFormRules';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  formTypeId: number;
  pageId: number;
  categoryId: number;
  triggerBuilderFieldId: number | null;
  onSaved?: () => void;
};

const ui = {
  shell: { display: 'grid', gap: 14 } as const,
  hero: {
    border: '1px solid #dbeafe',
    borderRadius: 14,
    background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
    padding: 14,
  } as const,
  section: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    padding: 14,
  } as const,
  label: {
    display: 'block',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    fontSize: 13,
  } as const,
  helper: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
    marginTop: 6,
  } as const,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #bfdbfe',
    background: '#fff',
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 600,
  } as const,
  btnPrimary: {
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    border: '1px solid #1d4ed8',
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.22)',
    fontWeight: 600,
  } as const,
  btnSecondary: {
    borderRadius: 999,
    background: '#fff',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
    fontWeight: 600,
  } as const,
};

export function AddMoreModal({
  open,
  onClose,
  serviceId,
  formTypeId,
  pageId,
  categoryId,
  triggerBuilderFieldId,
  onSaved,
}: Props) {
  const toast = useRef<Toast>(null);
  const appendTo = useMemo(() => (typeof window === 'undefined' ? undefined : document.body), []);

  const { data: builderRows = [] } = useFormBuilderFields({ serviceId, formTypeId, pageId, categoryId });
  const { data: groups = [] } = useFormAddMoreGroups(
    triggerBuilderFieldId ? { serviceId, formTypeId, pageId, categoryId, triggerBuilderFieldId } : undefined,
  );
  const { data: formRules = [] } = useFormRules(serviceId, formTypeId);

  const createGroup = useCreateFormAddMoreGroup();
  const updateGroup = useUpdateFormAddMoreGroup();
  const setCols = useSetFormAddMoreColumns();
  const saveRule = useSaveFormRule();

  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupLabel, setGroupLabel] = useState<string>('Add More Details');
  const [minRows, setMinRows] = useState<number>(0);
  const [maxRows, setMaxRows] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [enableConditionalRule, setEnableConditionalRule] = useState(false);
  const [conditionalRuleId, setConditionalRuleId] = useState<number | null>(null);
  const [sourceFieldCode, setSourceFieldCode] = useState<string>('');
  const [rowMode, setRowMode] = useState<'exact' | 'min' | 'max'>('exact');
  const [whenFieldCode, setWhenFieldCode] = useState<string>('');
  const [whenOperator, setWhenOperator] = useState<string>('always');
  const [whenValue, setWhenValue] = useState<string>('');
  const [applyOn, setApplyOn] = useState<string[]>(['add', 'page_save', 'submit']);
  const [ruleMessage, setRuleMessage] = useState<string>('');

  const busy = createGroup.isPending || setCols.isPending || updateGroup.isPending || saveRule.isPending;

  const parseJsonSafe = (input: any) => {
    if (typeof input === 'string') {
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    }
    return input;
  };

  const sortedBuilderRows = useMemo(
    () => [...(builderRows ?? [])].sort((a: any, b: any) => (a.preference ?? 0) - (b.preference ?? 0)),
    [builderRows],
  );

  const triggerField = useMemo(
    () => sortedBuilderRows.find((r: any) => r.id === triggerBuilderFieldId) ?? null,
    [sortedBuilderRows, triggerBuilderFieldId],
  );

  const fieldCodeOptions = useMemo(
    () =>
      sortedBuilderRows.map((r: any) => ({
        label: `${r.label} (${r.field_code})`,
        value: String(r.field_code),
      })),
    [sortedBuilderRows],
  );

  const numericSourceFieldOptions = useMemo(
    () =>
      sortedBuilderRows
        .filter((r: any) => String(r.input_type || '').toLowerCase() !== 'addmore')
        .map((r: any) => ({ label: `${r.label} (${r.field_code})`, value: String(r.field_code) })),
    [sortedBuilderRows],
  );

  const columnOptions = useMemo(
    () =>
      sortedBuilderRows
        .filter((r: any) => r.id !== triggerBuilderFieldId)
        .map((r: any) => ({ label: `${r.label} (${r.field_code})`, value: r.id })),
    [sortedBuilderRows, triggerBuilderFieldId],
  );

  const whenOperatorOptions = [
    { label: 'Always (No Condition)', value: 'always' },
    { label: 'Equals (=)', value: 'equals' },
    { label: 'Not Equals (!=)', value: 'not_equals' },
    { label: 'Contains (In)', value: 'in' },
    { label: 'Greater Than (>)', value: 'greater_than' },
    { label: 'Less Than (<)', value: 'less_than' },
    { label: 'Is Empty', value: 'is_empty' },
    { label: 'Is Not Empty', value: 'is_not_empty' },
  ];

  const rowModeOptions = [
    { label: 'Exact Rows = Source Value', value: 'exact' },
    { label: 'Min Rows >= Source Value', value: 'min' },
    { label: 'Max Rows <= Source Value', value: 'max' },
  ];

  const applyOnOptions = [
    { label: 'On Add Row Click', value: 'add' },
    { label: 'On Save & Continue', value: 'page_save' },
    { label: 'On Final Submit', value: 'submit' },
  ];

  const findExistingConditionalRuleForGroup = (targetGroupId: number) => {
    const rules = Array.isArray(formRules) ? formRules : [];
    return rules
      .map((r: any) => ({ ...r, __when: parseJsonSafe(r?.when_json), __then: parseJsonSafe(r?.then_json) }))
      .filter((r: any) => {
        const actions = Array.isArray(r?.__then?.actions) ? r.__then.actions : [];
        return actions.some((a: any) => Number(a?.targetGroupId) === Number(targetGroupId) && String(a?.action || '') === 'addmore_row_count');
      })
      .sort((a: any, b: any) => Number(b?.id || 0) - Number(a?.id || 0))[0];
  };

  useEffect(() => {
    if (!open) return;
    const first = groups?.[0];

    if (first) {
      if (groupId !== first.id) setGroupId(first.id);
      setGroupLabel(first.label ? first.label : 'Add More Details');
      if (minRows !== (first.min_rows ?? 0)) setMinRows(first.min_rows ?? 0);
      if (maxRows !== (first.max_rows ?? null)) setMaxRows(first.max_rows ?? null);

      const newCols = (first.columns ?? []).map((c: any) => c.builder_field_id);
      const isSame =
        newCols.length === selectedColumns.length && newCols.every((v: number, i: number) => v === selectedColumns[i]);
      if (!isSame) setSelectedColumns(newCols);

      const existingRule = findExistingConditionalRuleForGroup(first.id);
      if (existingRule) {
        const when = existingRule.__when || {};
        const action = (existingRule.__then?.actions || []).find(
          (a: any) => Number(a?.targetGroupId) === Number(first.id) && String(a?.action || '') === 'addmore_row_count',
        );
        setConditionalRuleId(Number(existingRule.id));
        setEnableConditionalRule(String(existingRule.is_active || 'Y').toUpperCase() === 'Y');
        setSourceFieldCode(String(action?.sourceField || ''));
        setRowMode((String(action?.mode || 'exact').toLowerCase() as 'exact' | 'min' | 'max') || 'exact');
        setRuleMessage(String(action?.message || ''));
        setApplyOn(Array.isArray(action?.applyOn) && action.applyOn.length ? action.applyOn : ['add', 'page_save', 'submit']);
        if (Array.isArray(when?.all)) {
          setWhenOperator('always');
          setWhenFieldCode('');
          setWhenValue('');
        } else {
          setWhenFieldCode(String(when?.field || ''));
          setWhenOperator(String(when?.operator || 'always'));
          const rawWhenVal = when?.value;
          setWhenValue(Array.isArray(rawWhenVal) ? rawWhenVal.join(',') : String(rawWhenVal ?? ''));
        }
      } else {
        setConditionalRuleId(null);
        setEnableConditionalRule(false);
        setSourceFieldCode('');
        setRowMode('exact');
        setWhenFieldCode('');
        setWhenOperator('always');
        setWhenValue('');
        setApplyOn(['add', 'page_save', 'submit']);
        setRuleMessage('');
      }
    } else {
      setGroupId(null);
      setGroupLabel('Add More Details');
      setMinRows(0);
      setMaxRows(null);
      setSelectedColumns([]);
      setConditionalRuleId(null);
      setEnableConditionalRule(false);
      setSourceFieldCode('');
      setRowMode('exact');
      setWhenFieldCode('');
      setWhenOperator('always');
      setWhenValue('');
      setApplyOn(['add', 'page_save', 'submit']);
      setRuleMessage('');
    }
  }, [open, groups, formRules]);

  async function ensureGroup(): Promise<number> {
    if (!triggerBuilderFieldId) throw new Error('Missing trigger field.');

    if (groupId) {
      await updateGroup.mutateAsync({
        groupId,
        label: groupLabel,
        minRows,
        maxRows,
      });
      return groupId;
    }

    const created = await createGroup.mutateAsync({
      serviceId,
      formTypeId,
      pageId,
      categoryId,
      triggerBuilderFieldId,
      label: groupLabel,
      minRows,
      maxRows,
    });

    return created.id;
  }

  async function save() {
    try {
      if (!triggerBuilderFieldId) return;
      if (!selectedColumns.length) {
        toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select at least one column.', life: 2500 });
        return;
      }

      const gid = await ensureGroup();
      const sortedSelection = [...selectedColumns].sort((a, b) => {
        const indexA = builderRows.findIndex((r: any) => r.id === a);
        const indexB = builderRows.findIndex((r: any) => r.id === b);
        return indexA - indexB;
      });

      await setCols.mutateAsync({ groupId: gid, columnBuilderFieldIds: sortedSelection });

      if (enableConditionalRule) {
        if (!sourceFieldCode) {
          toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select source field for conditional row rule.', life: 2500 });
          return;
        }
        const effectiveWhenOperator = whenFieldCode ? whenOperator : 'always';
        if (
          effectiveWhenOperator !== 'always' &&
          effectiveWhenOperator !== 'is_empty' &&
          effectiveWhenOperator !== 'is_not_empty' &&
          !String(whenValue || '').trim()
        ) {
          toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Enter condition value.', life: 2500 });
          return;
        }

        const existingRule = conditionalRuleId ? { id: conditionalRuleId } : findExistingConditionalRuleForGroup(gid);
        const whenJson =
          effectiveWhenOperator === 'always'
            ? { all: [] }
            : {
                field: whenFieldCode,
                operator: effectiveWhenOperator,
                value:
                  effectiveWhenOperator === 'in'
                    ? String(whenValue || '')
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean)
                    : String(whenValue || '').trim(),
              };

        await saveRule.mutateAsync({
          ...(existingRule?.id ? { id: Number(existingRule.id) } : {}),
          service_id: serviceId,
          form_id: formTypeId,
          scope: 'addmore_row_count',
          is_active: 'Y',
          when_json: whenJson,
          then_json: {
            actions: [
              {
                action: 'addmore_row_count',
                targetGroupId: gid,
                sourceField: sourceFieldCode,
                mode: rowMode,
                applyOn: Array.isArray(applyOn) && applyOn.length ? applyOn : ['add', 'page_save', 'submit'],
                message: String(ruleMessage || '').trim() || null,
              },
            ],
          },
        });
      } else {
        const existingRule = conditionalRuleId ? { id: conditionalRuleId } : findExistingConditionalRuleForGroup(gid);
        if (existingRule?.id) {
          await saveRule.mutateAsync({
            id: Number(existingRule.id),
            scope: 'addmore_row_count',
            is_active: 'N',
            when_json: { all: [] },
            then_json: { actions: [] },
          });
        }
      }

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'AddMore config saved.', life: 2000 });
      if (onSaved) onSaved();
      onClose();
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message || 'Failed to save.',
        life: 3500,
      });
    }
  }

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <i className="pi pi-table" style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>Add More Configuration</span>
          <span style={ui.badge}>Trigger: {triggerField?.label || triggerBuilderFieldId || '-'}</span>
        </div>
      }
      visible={open}
      onHide={onClose}
      style={{ width: 'min(820px, 96vw)' }}
      modal
      draggable={false}
      closable={!busy}
      className="p-fluid"
    >
      <Toast ref={toast} />

      <div style={ui.shell}>
        <div style={ui.hero}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Configure repeating table/section columns
          </div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
            Set a display label, define row limits, and choose which fields should repeat inside the Add More group.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={ui.badge}>Page: {pageId}</span>
            <span style={ui.badge}>Category: {categoryId}</span>
            <span style={ui.badge}>{columnOptions.length} Available Columns</span>
          </div>
        </div>

        <div style={ui.section}>
          <label style={ui.label}>Table / Section Label</label>
          <InputText
            value={groupLabel}
            onChange={(e) => setGroupLabel(e.target.value)}
            placeholder="e.g. Director Details"
            disabled={busy}
          />
          <div style={ui.helper}>This label appears above the repeating section in preview/runtime forms.</div>
        </div>

        <div style={ui.section}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            <label style={{ ...ui.label, marginBottom: 0 }}>Conditional Row Rule (Optional)</label>
            <div className="d-flex align-items-center gap-2">
              <Checkbox
                inputId="enableConditionalAddMoreRule"
                checked={enableConditionalRule}
                onChange={(e) => setEnableConditionalRule(!!e.checked)}
                disabled={busy}
              />
              <label htmlFor="enableConditionalAddMoreRule" className="mb-0" style={{ fontSize: 13 }}>
                Enable
              </label>
            </div>
          </div>
          <div style={ui.helper}>
            Keep current min/max logic as-is. This adds extra conditional row validation from a source field.
          </div>

          <div className="mt-3" style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={ui.label}>Source Field (Row Count)</label>
                <Dropdown
                  value={sourceFieldCode}
                  options={numericSourceFieldOptions}
                  onChange={(e) => setSourceFieldCode(e.value)}
                  placeholder="Select source field"
                  filter
                  disabled={busy || !enableConditionalRule}
                  className="w-100"
                  appendTo={appendTo}
                />
              </div>
              <div>
                <label style={ui.label}>Rule Type</label>
                <Dropdown
                  value={rowMode}
                  options={rowModeOptions}
                  onChange={(e) => setRowMode(e.value)}
                  disabled={busy || !enableConditionalRule}
                  className="w-100"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={ui.label}>When Field</label>
                <Dropdown
                  value={whenFieldCode}
                  options={fieldCodeOptions}
                  onChange={(e) => setWhenFieldCode(e.value)}
                  placeholder="Optional"
                  filter
                  disabled={busy || !enableConditionalRule || whenOperator === 'always'}
                  className="w-100"
                  appendTo={appendTo}
                />
              </div>
              <div>
                <label style={ui.label}>Operator</label>
                <Dropdown
                  value={whenOperator}
                  options={whenOperatorOptions}
                  onChange={(e) => setWhenOperator(e.value)}
                  disabled={busy || !enableConditionalRule}
                  className="w-100"
                />
              </div>
              <div>
                <label style={ui.label}>Value</label>
                <InputText
                  value={whenValue}
                  onChange={(e) => setWhenValue(e.target.value)}
                  placeholder="Example: 4 or 1,2"
                  disabled={
                    busy ||
                    !enableConditionalRule ||
                    whenOperator === 'always' ||
                    whenOperator === 'is_empty' ||
                    whenOperator === 'is_not_empty'
                  }
                />
              </div>
            </div>

            <div>
              <label style={ui.label}>Apply On</label>
              <MultiSelect
                value={applyOn}
                options={applyOnOptions}
                onChange={(e) => setApplyOn(e.value)}
                disabled={busy || !enableConditionalRule}
                className="w-100"
                display="chip"
                maxSelectedLabels={3}
              />
            </div>

            <div>
              <label style={ui.label}>Validation Message (Optional)</label>
              <InputText
                value={ruleMessage}
                onChange={(e) => setRuleMessage(e.target.value)}
                placeholder="Example: Rows must match Number of Insecticides."
                disabled={busy || !enableConditionalRule}
              />
            </div>
          </div>
        </div>

        <div style={ui.section}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={ui.label}>Min Rows</label>
              <InputNumber
                value={minRows}
                onValueChange={(e) => setMinRows(e.value ?? 0)}
                min={0}
                showButtons
                disabled={busy}
                inputClassName="w-100"
              />
              <div style={ui.helper}>Minimum rows shown by default.</div>
            </div>
            <div>
              <label style={ui.label}>Max Rows (Optional)</label>
              <InputNumber
                value={maxRows}
                onValueChange={(e) => setMaxRows(e.value ?? null)}
                min={1}
                showButtons
                placeholder="Unlimited"
                disabled={busy}
                inputClassName="w-100"
              />
              <div style={ui.helper}>Leave blank for unlimited rows.</div>
            </div>
          </div>
        </div>

        <div style={ui.section}>
          <label style={ui.label}>Columns (fields to repeat)</label>
          <MultiSelect
            value={selectedColumns}
            options={columnOptions}
            onChange={(e) => setSelectedColumns(e.value)}
            className="w-full"
            placeholder="Select fields"
            filter
            display="chip"
            maxSelectedLabels={5}
            disabled={busy}
            appendTo={appendTo}
            panelStyle={{ width: 'min(620px, 92vw)' }}
          />
          <div style={ui.helper}>
            Selected columns will be rendered in the same order as the field list in the builder table.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            borderTop: '1px solid #e2e8f0',
            paddingTop: 12,
          }}
        >
          <div style={ui.helper}>
            Tip: Choose only child/detail fields here. Do not include the Add More trigger field itself.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button label="Cancel" icon="pi pi-times" onClick={onClose} style={ui.btnSecondary} disabled={busy} />
            <Button label="Save Configuration" icon="pi pi-check" onClick={save} loading={busy} style={ui.btnPrimary} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
