'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

import { useSaveFormRule, useFormRules } from '@/hooks/master/useFormRules';

type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'in'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';
type LogicActionType = 'visible' | 'required' | 'readonly' | 'none';

type FieldOption = { label: string; value: string; type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  formId: number;
  availableFields: FieldOption[];
  currentFieldCode?: string;
  currentFieldLabel?: string;
};

const ui = {
  shell: { display: 'grid', gap: 14 } as const,
  hero: {
    border: '1px solid #ddd6fe',
    borderRadius: 14,
    background: 'linear-gradient(180deg, #f5f3ff 0%, #fcfcff 100%)',
    padding: 14,
  } as const,
  panel: {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    background: '#fff',
    padding: 14,
  } as const,
  conditionPanel: {
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    background: 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)',
    padding: 14,
  } as const,
  actionPanel: {
    border: '1px solid #bbf7d0',
    borderRadius: 12,
    background: 'linear-gradient(180deg, #f0fdf4 0%, #fcfffd 100%)',
    padding: 14,
  } as const,
  label: {
    display: 'block',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  muted: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
  } as const,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #ddd6fe',
    background: '#fff',
    color: '#5b21b6',
    fontSize: 12,
    fontWeight: 600,
  } as const,
  btnPrimary: {
    borderRadius: 999,
    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    border: '1px solid #6d28d9',
    boxShadow: '0 8px 18px rgba(124, 58, 237, 0.24)',
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
  btnSuccessSoft: {
    borderRadius: 999,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontWeight: 600,
  } as const,
  btnDangerSoft: {
    borderRadius: 999,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#be123c',
  } as const,
};

export function LogicBuilderModal({
  open,
  onClose,
  serviceId,
  formId,
  availableFields,
  currentFieldCode,
  currentFieldLabel,
}: Props) {
  const toast = useRef<Toast>(null);

  const { data: existingRules = [] } = useFormRules(serviceId, formId);
  const saveRuleMutation = useSaveFormRule();

  const [ruleId, setRuleId] = useState<number | null>(null);
  const [triggerField, setTriggerField] = useState<string>(currentFieldCode || '');
  const [operator, setOperator] = useState<LogicOperator>('equals');
  const [triggerValue, setTriggerValue] = useState<string>('');
  const [actions, setActions] = useState<Array<{ target: string; type: LogicActionType; value: boolean }>>([
    { target: '', type: 'visible', value: true },
  ]);

  const whenFieldOptions = (() => {
    const normalize = (v: string) => String(v ?? '').trim().toLowerCase();
    const base = Array.isArray(availableFields) ? availableFields : [];
    if (!triggerField) return base;
    const exists = base.some((f) => normalize(String(f?.value ?? '')) === normalize(String(triggerField)));
    if (exists) return base;
    const safeLabel = String(currentFieldLabel ?? '').trim() || triggerField;
    return [{ label: `${safeLabel} (${triggerField})`, value: triggerField, type: 'text' }, ...base];
  })();

  const operators = [
    { label: 'Equals (=)', value: 'equals' },
    { label: 'Not Equals (!=)', value: 'not_equals' },
    { label: 'Contains (In)', value: 'in' },
    { label: 'Is Empty', value: 'is_empty' },
    { label: 'Is Not Empty', value: 'is_not_empty' },
  ];

  const actionTypes = [
    { label: '-- No Action --', value: 'none-false' },
    { label: 'Show Field', value: 'visible-true' },
    { label: 'Hide Field', value: 'visible-false' },
    { label: 'Make Required', value: 'required-true' },
    { label: 'Make Optional', value: 'required-false' },
    { label: 'Disable (Readonly)', value: 'readonly-true' },
  ];

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

  const normalizeLooseCode = (value: string) =>
    String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '')
      .replace(/0+/g, '');

  const fieldCodeMatches = (a: string, b: string) => {
    const x = String(a ?? '').trim();
    const y = String(b ?? '').trim();
    if (!x || !y) return false;
    if (x === y) return true;
    return normalizeLooseCode(x) === normalizeLooseCode(y);
  };

  useEffect(() => {
    if (!open) return;

    setTriggerField(currentFieldCode || '');
    setRuleId(null);
    setOperator('equals');
    setTriggerValue('');
    setActions([{ target: '', type: 'visible', value: true }]);

    if (currentFieldCode && Array.isArray(existingRules)) {
      const matches = existingRules
        .map((r: any) => ({ ...r, __when: parseJsonSafe(r?.when_json), __then: parseJsonSafe(r?.then_json) }))
        .filter((r: any) => fieldCodeMatches(String(r?.__when?.field ?? ''), String(currentFieldCode)))
        .sort((a: any, b: any) => Number(b?.id || 0) - Number(a?.id || 0));
      const match = matches[0];

      if (match) {
        setRuleId(match.id);
        setTriggerField(String(match.__when?.field || currentFieldCode));
        setOperator(match.__when?.operator || 'equals');
        if (Array.isArray(match.__when?.value)) {
          setTriggerValue(match.__when.value.join(','));
        } else {
          setTriggerValue(String(match.__when?.value || ''));
        }

        const loadedActions: any[] = [];
        const thenActions = match.__then?.actions || [];

        if (Array.isArray(thenActions)) {
          thenActions.forEach((a: any) => {
            if (a.targetField && a.action) {
              loadedActions.push({
                target: a.targetField,
                type: a.action,
                value: a.value,
              });
            }
          });
        }

        if (loadedActions.length > 0) {
          setActions(loadedActions);
        } else {
          setActions([{ target: '', type: 'visible', value: true }]);
        }
      }
    }
  }, [open, currentFieldCode, existingRules]);

  const handleAddAction = () => {
    setActions([...actions, { target: '', type: 'visible', value: true }]);
  };

  const handleRemoveAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const effectiveActions = actions.filter((a) => a.type !== 'none');
    const shouldDeactivate = effectiveActions.length === 0;
    const effectiveTriggerField = String(triggerField || currentFieldCode || '').trim();

    if (!shouldDeactivate) {
      if (!effectiveTriggerField || (!triggerValue && operator !== 'is_empty' && operator !== 'is_not_empty')) {
        toast.current?.show({ severity: 'warn', summary: 'Invalid Rule', detail: 'Please complete the condition.' });
        return;
      }
    }

    if (effectiveActions.some((a) => !a.target)) {
      toast.current?.show({ severity: 'warn', summary: 'Invalid Action', detail: 'Please select target fields.' });
      return;
    }

    let effectiveRuleId: number | null = ruleId;
    if (!effectiveRuleId && Array.isArray(existingRules) && effectiveTriggerField) {
      const matched = existingRules
        .map((r: any) => ({ ...r, __when: parseJsonSafe(r?.when_json) }))
        .filter((r: any) => fieldCodeMatches(String(r?.__when?.field ?? ''), effectiveTriggerField))
        .sort((a: any, b: any) => Number(b?.id || 0) - Number(a?.id || 0))[0];
      if (matched?.id) effectiveRuleId = Number(matched.id);
    }

    const rulePayload: any = {
      ...(effectiveRuleId ? { id: effectiveRuleId } : {}),
      service_id: serviceId,
      form_id: formId,
      scope: 'field',
      is_active: shouldDeactivate ? 'N' : 'Y',
      when_json: {
        field: effectiveTriggerField,
        operator,
        value: triggerValue,
      },
      then_json: {
        actions: effectiveActions.map((a) => ({
          targetField: a.target,
          action: a.type,
          value: a.value,
        })),
      },
    };

    try {
      await saveRuleMutation.mutateAsync(rulePayload);
      toast.current?.show({
        severity: 'success',
        summary: shouldDeactivate ? 'Rule Inactivated' : 'Rule Saved',
        detail: shouldDeactivate ? 'Logic removed successfully.' : 'Logic applied successfully.',
      });
      setTimeout(onClose, 500);
    } catch (error) {
      console.error(error);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save rule.' });
    }
  };

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <i className="pi pi-bolt" style={{ color: '#7c3aed' }} />
          <span style={{ fontWeight: 700 }}>{ruleId ? 'Edit Custom Logic' : 'Configure Custom Logic'}</span>
          {currentFieldCode && <span style={ui.badge}>Trigger: {currentFieldCode}</span>}
        </div>
      }
      visible={open}
      onHide={onClose}
      style={{ width: 'min(920px, 96vw)' }}
      modal
      draggable={false}
      closable={!saveRuleMutation.isPending}
    >
      <Toast ref={toast} />

      <div style={ui.shell}>
        <div style={ui.hero}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Build field-level conditional logic
          </div>
          <div style={{ ...ui.muted, marginBottom: 10 }}>
            Define an IF condition and one or more THEN actions to control visibility, required state, or readonly behavior.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={ui.badge}>Service: {serviceId}</span>
            <span style={ui.badge}>Form: {formId}</span>
            <span style={ui.badge}>{actions.length} Action{actions.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div style={ui.conditionPanel}>
          <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <i className="pi pi-filter" />
            IF Condition
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={ui.label}>When Field</label>
              <Dropdown
                value={triggerField}
                options={whenFieldOptions}
                optionLabel="label"
                optionValue="value"
                onChange={(e) => setTriggerField(e.value)}
                className="w-100"
                placeholder="Select Field"
                filter
                panelStyle={{ width: 'min(520px, 92vw)' }}
              />
            </div>
            <div>
              <label style={ui.label}>Operator</label>
              <Dropdown value={operator} options={operators} onChange={(e) => setOperator(e.value)} className="w-100" />
            </div>
            <div style={{ minWidth: 0 }}>
              <label style={ui.label}>Value</label>
              <InputText
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                disabled={operator === 'is_empty' || operator === 'is_not_empty'}
                className="w-100"
                placeholder="Enter value (e.g. Yes)"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ ...ui.badge, color: '#334155', borderColor: '#e2e8f0' }}>
            <i className="pi pi-arrow-down" />
            Apply Actions
          </div>
        </div>

        <div style={ui.actionPanel}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#166534', display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="pi pi-bolt" />
                THEN Actions
              </div>
              <div style={ui.muted}>Each action targets another field and changes how it behaves.</div>
            </div>
            <Button label="Add Action" icon="pi pi-plus" size="small" onClick={handleAddAction} style={ui.btnSuccessSoft} />
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {actions.map((action, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #d1fae5',
                  background: '#ffffff',
                  borderRadius: 12,
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(220px, 1fr) auto',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <Dropdown
                  value={action.target}
                  options={availableFields.filter((f) => f.value !== triggerField)}
                  optionLabel="label"
                  optionValue="value"
                  onChange={(e) => {
                    const newActions = [...actions];
                    newActions[idx].target = e.value;
                    setActions(newActions);
                  }}
                  className="w-100"
                  placeholder="Select Target Field"
                  filter
                  disabled={action.type === 'none'}
                  panelStyle={{ width: 'min(520px, 92vw)' }}
                />
                <Dropdown
                  value={`${action.type}-${action.value}`}
                  options={actionTypes}
                  onChange={(e) => {
                    const [type, valStr] = e.value.split('-');
                    const newActions = [...actions];
                    newActions[idx].type = type as LogicActionType;
                    newActions[idx].value = valStr === 'true';
                    if (type === 'none') newActions[idx].target = '';
                    setActions(newActions);
                  }}
                  className="w-100"
                />
                <Button
                  icon="pi pi-trash"
                  rounded
                  onClick={() => handleRemoveAction(idx)}
                  disabled={actions.length === 1}
                  title="Remove action"
                  style={ui.btnDangerSoft}
                />
              </div>
            ))}
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
          <div style={ui.muted}>
            Tip: For empty checks, leave the Value field blank and use `Is Empty` or `Is Not Empty`.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button label="Cancel" icon="pi pi-times" onClick={onClose} style={ui.btnSecondary} />
            <Button
              label="Save Logic"
              icon="pi pi-check"
              onClick={handleSave}
              loading={saveRuleMutation.isPending}
              style={ui.btnPrimary}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
