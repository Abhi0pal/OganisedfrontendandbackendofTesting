'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';

import { useMasterDefinitionsDropdown } from '@/hooks/master/useMasterDefinitionsDropdown';
import { useFormFieldOptions, useSaveFormFieldOptions } from '@/hooks/master/useFormFieldOptions';

type ParentCandidate = { id: number; field_code: string; label: string; input_type: string };

type Props = {
  open: boolean;
  onClose: () => void;
  builderFieldId: number | null;
  parentCandidates?: ParentCandidate[];
  tenantId?: number | null;
  projectId?: number | null;
};

type StaticOpt = { label: string; value: string; disabled?: boolean; order?: number };

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
  masterSection: {
    border: '1px solid #dbeafe',
    borderRadius: 12,
    background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
    padding: 14,
  } as const,
  staticSection: {
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
  btnSoft: {
    borderRadius: 999,
    background: '#f8fafc',
    border: '1px solid #dbe3ef',
    color: '#0f172a',
    fontWeight: 600,
  } as const,
  btnDangerSoft: {
    borderRadius: 999,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#be123c',
  } as const,
};

export function FieldOptionsModal({ open, onClose, builderFieldId, parentCandidates, tenantId, projectId }: Props) {
  const toast = useRef<Toast>(null);

  const { data: existing } = useFormFieldOptions(builderFieldId ?? undefined);
  const save = useSaveFormFieldOptions();
  const { data: definitions = [] } = useMasterDefinitionsDropdown({ tenantId, projectId });

  const appendTo = typeof window !== 'undefined' ? document.body : undefined;

  const parentOptions = useMemo(() => {
    return (parentCandidates ?? [])
      .map((p) => ({
        label: `${p.field_code} - ${p.label}`,
        value: p.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [parentCandidates]);

  const masterOptions = useMemo(
    () =>
      definitions.map((d) => ({
        label: `${d.name} (${d.code})`,
        value: d.id,
      })),
    [definitions],
  );

  const [sourceType, setSourceType] = useState<'STATIC' | 'MASTER'>('STATIC');
  const [masterTableId, setMasterTableId] = useState<number | null>(null);
  const [parentBuilderFieldId, setParentBuilderFieldId] = useState<number | null>(null);
  const [staticOptions, setStaticOptions] = useState<StaticOpt[]>([{ label: 'Option 1', value: '1' }]);

  useEffect(() => {
    if (!open) return;

    if (existing?.source_type) {
      setSourceType(existing.source_type);
      setMasterTableId(existing.master_table_id ?? null);
      setStaticOptions((existing.static_options ?? []) as StaticOpt[]);
      setParentBuilderFieldId(existing.parent_builder_field_id ?? null);
    } else {
      setSourceType('STATIC');
      setMasterTableId(null);
      setStaticOptions([
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
      ]);
      setParentBuilderFieldId(null);
    }
  }, [open, existing]);

  function updateOpt(i: number, patch: Partial<StaticOpt>) {
    setStaticOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function addRow() {
    setStaticOptions((prev) => [...prev, { label: '', value: '' }]);
  }

  function removeRow(i: number) {
    setStaticOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function saveOptions() {
    if (!builderFieldId) return;

    if (sourceType === 'MASTER' && !masterTableId) {
      toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Select a Master Table.', life: 2500 });
      return;
    }

    if (sourceType === 'STATIC') {
      const cleaned = staticOptions
        .map((o, idx) => ({ ...o, order: o.order ?? idx + 1 }))
        .filter((o) => o.label.trim() && String(o.value).trim());

      if (cleaned.length === 0) {
        toast.current?.show({ severity: 'warn', summary: 'Missing', detail: 'Add at least one valid option.', life: 2500 });
        return;
      }

      await save.mutateAsync({
        builderFieldId,
        sourceType: 'STATIC',
        staticOptions: cleaned,
      });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Static options saved.', life: 2000 });
      onClose();
      return;
    }

    await save.mutateAsync({
      builderFieldId,
      sourceType: 'MASTER',
      masterTableId: masterTableId!,
      parentBuilderFieldId: parentBuilderFieldId ?? undefined,
    });

    toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Master table linked.', life: 2000 });
    onClose();
  }

  const sourceTypeLabel = sourceType === 'MASTER' ? 'Master Table (Database)' : 'Static List (Manual)';

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <i className="pi pi-sliders-h" style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>Configure Field Options</span>
          <span style={ui.badge}>Field ID: {builderFieldId ?? '-'}</span>
        </div>
      }
      visible={open}
      onHide={onClose}
      style={{ width: 'min(900px, 96vw)' }}
      modal
      draggable={false}
      closable={!save.isPending}
    >
      <Toast ref={toast} />

      <div style={ui.shell}>
        <div style={ui.hero}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Configure dropdown/select options for this field
          </div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
            Choose a source type, then configure manual items or connect a master table with optional cascading logic.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={ui.badge}>
              <i className="pi pi-database" style={{ fontSize: 11 }} />
              Source: {sourceTypeLabel}
            </span>
            <span style={ui.badge}>
              <i className="pi pi-list" style={{ fontSize: 11 }} />
              {sourceType === 'STATIC' ? `${staticOptions.length} Item(s)` : `Definitions: ${masterOptions.length}`}
            </span>
          </div>
        </div>

        <div style={ui.section}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: sourceType === 'MASTER' ? 'repeat(auto-fit, minmax(260px, 1fr))' : 'minmax(260px, 420px)',
              gap: 12,
              alignItems: 'start',
            }}
          >
            <div>
              <label style={ui.label}>Source Type</label>
              <Dropdown
                value={sourceType}
                options={[
                  { label: 'Static List (Manual)', value: 'STATIC' },
                  { label: 'Master Table (Database)', value: 'MASTER' },
                ]}
                onChange={(e) => {
                  const next = e.value as 'STATIC' | 'MASTER';
                  setSourceType(next);
                  if (next === 'STATIC') {
                    setMasterTableId(null);
                    setParentBuilderFieldId(null);
                  }
                }}
                className="w-100"
                appendTo={appendTo}
              />
              <div style={ui.helper}>Use Static for manual options, Master for dynamic database-driven lists.</div>
            </div>

            {sourceType === 'MASTER' && (
              <div>
                <label style={ui.label}>Select Master Table</label>
                <Dropdown
                  value={masterTableId}
                  options={masterOptions}
                  onChange={(e) => setMasterTableId(e.value)}
                  className="w-100"
                  placeholder="Search master..."
                  filter
                  showClear
                  appendTo={appendTo}
                  panelStyle={{ width: 'min(520px, 92vw)' }}
                />
                <div style={ui.helper}>Options at runtime will come from master_data records for this definition.</div>
              </div>
            )}
          </div>
        </div>

        {sourceType === 'MASTER' && (
          <div style={ui.masterSection}>
            <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Cascading Logic (Optional)</div>
            <div style={{ ...ui.helper, marginTop: 0, marginBottom: 10 }}>
              If this field depends on another field (for example, District depends on State), select the parent field.
              Options will be filtered using the master table `parent_id` relationship.
            </div>
            <Dropdown
              value={parentBuilderFieldId}
              options={parentOptions}
              onChange={(e) => setParentBuilderFieldId(e.value ?? null)}
              className="w-100"
              placeholder="Select Parent Field (e.g. State)"
              filter
              showClear
              disabled={!parentOptions.length}
              appendTo={appendTo}
              panelStyle={{ width: 'min(560px, 92vw)' }}
            />
            {parentOptions.length === 0 && (
              <small style={{ color: '#dc2626', display: 'block', marginTop: 8 }}>
                No other fields found on this page to use as a parent.
              </small>
            )}
          </div>
        )}

        {sourceType === 'STATIC' && (
          <div style={ui.staticSection}>
            <Divider align="center">
              <span className="p-tag">Static Items</span>
            </Divider>

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
              <div style={ui.helper}>Define options manually. Blank rows are ignored on save.</div>
              <Button label="Add Item" icon="pi pi-plus" size="small" onClick={addRow} style={ui.btnSoft} />
            </div>

            <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {staticOptions.map((opt, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    background: '#f8fafc',
                    padding: 10,
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(180px, 1fr) minmax(180px, 1fr) auto',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#64748b', fontSize: 12, width: 24 }}>{idx + 1}.</span>
                  <InputText
                    value={opt.label}
                    onChange={(e) => updateOpt(idx, { label: e.target.value })}
                    placeholder="Label (Displayed)"
                    className="w-100"
                  />
                  <InputText
                    value={opt.value}
                    onChange={(e) => updateOpt(idx, { value: e.target.value })}
                    placeholder="Value (Saved)"
                    className="w-100"
                  />
                  <Button
                    icon="pi pi-trash"
                    rounded
                    onClick={() => removeRow(idx)}
                    disabled={staticOptions.length <= 1}
                    title="Remove item"
                    style={ui.btnDangerSoft}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
            Tip: Use `MASTER` + parent field selection to enable cascading dropdowns like Country -&gt; State -&gt; District.
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button label="Cancel" icon="pi pi-times" onClick={onClose} style={ui.btnSecondary} />
            <Button
              label="Save Options"
              icon="pi pi-check"
              onClick={saveOptions}
              loading={save.isPending}
              style={ui.btnPrimary}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
