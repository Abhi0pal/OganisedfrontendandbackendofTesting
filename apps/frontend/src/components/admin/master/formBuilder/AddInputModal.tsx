import { useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { useFormFields } from '@/hooks/master/useFormFields';
import apiClient from '@/lib/api-client';

const INPUT_TYPES = [
  { label: 'Text Input', value: 'text' },
  { label: 'Select Dropdown', value: 'select' },
  { label: 'Multi-Select', value: 'multiselect' },
  { label: 'Number', value: 'number' },
  { label: 'Date Picker', value: 'date' },
  { label: 'Date & Time Picker', value: 'datetime-local' },
  { label: 'Time Picker', value: 'time' },
  { label: 'Email', value: 'email' },
  { label: 'Password', value: 'password' },
  { label: 'Phone / Mobile', value: 'tel' },
  { label: 'URL / Website', value: 'url' },
  { label: 'File Upload', value: 'file' },
  { label: 'Radio Button', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Text Area', value: 'textarea' },
  { label: 'Add More (Repeating Group)', value: 'addmore' },
  { label: 'Button', value: 'button' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  locale: string;
  serviceId: string;
  formTypeId: number;
  pageId: number;
  categoryId: number;
  existingFormFieldIds: number[];
  allServiceFieldIds: number[];
  onCreated: () => void;
  tenantId?: number | null;
  projectId?: number | null;
  mappingId?: string | null;
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
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 12,
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
};

export function AddInputModal({
  open,
  onClose,
  locale,
  serviceId,
  formTypeId,
  pageId,
  categoryId,
  existingFormFieldIds,
  allServiceFieldIds,
  onCreated,
  tenantId,
  projectId,
  mappingId,
}: Props) {
  const editingLang = String(locale || 'en').toLowerCase().startsWith('hi') ? 'HI' : 'EN';
  const [loading, setLoading] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [inputType, setInputType] = useState('text');

  // ✅ User assignment state
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [tenantUsers, setTenantUsers] = useState<{ id: number; email: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { data: allFields = [] } = useFormFields({ tenantId, projectId });
  const appendTo = useMemo(() => (typeof window === 'undefined' ? undefined : document.body), []);

  useEffect(() => {
    if (!open) return;
    setSelectedFieldId(null);
    setCustomLabel('');
    setInputType('text');
    setAssignedUserId(null);
  }, [open]);

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

  // Build a combined set: fields used anywhere in the service form (all pages/categories)
  // falls back to just the current page/category if allServiceFieldIds not yet loaded
  const usedFieldIds = useMemo(
    () => new Set([...existingFormFieldIds, ...allServiceFieldIds]),
    [existingFormFieldIds, allServiceFieldIds],
  );

  const { availableFields, hiddenCount } = useMemo(() => {
    const all = allFields || [];
    const available: { label: string; value: number; defaultType: string }[] = [];
    let hidden = 0;

    all.forEach((f: any) => {
      const hindiName = f.nameInHindi || f.name_in_hindi;
      const safeName =
        (locale === 'hi' ? hindiName : null) ||
        f.name ||
        f.field_label ||
        `Field-${f.id}`;

      if (usedFieldIds.has(f.id)) {
        hidden++;
        return; // already in form — skip from dropdown
      }

      available.push({
        label: `${safeName} (${f.formCheckId || f.id})`,
        value: f.id,
        defaultType: safeName.toLowerCase().includes('date') ? 'date' : 'text',
      });
    });

    return { availableFields: available, hiddenCount: hidden };
  }, [allFields, usedFieldIds, locale]);

  const selectedFieldLabel =
    availableFields.find((f: any) => f.value === selectedFieldId)?.label ?? 'No field selected';

  const handleSave = async () => {
    if (!selectedFieldId) return;
    setLoading(true);
    try {
      await apiClient.post(`/master/form-builder/pages/${pageId}/categories/${categoryId}/fields`, {
        serviceId,
        formTypeId,
        mappingId: (mappingId === 'undefined' || mappingId === 'null') ? undefined : mappingId,
        locale,
        formFieldId: selectedFieldId,
        inputType,
        customLabel,
        isRequired: 'N',
        gridSpan: 12,
        isActive: 'Y',
        userId: assignedUserId ?? null,
      });
      onCreated();
      onClose();
      setSelectedFieldId(null);
      setCustomLabel('');
    } catch {
      alert('Failed to add field.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="pi pi-plus-circle" style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>Add New Field</span>
          <span style={ui.badge}>Language being edited: {editingLang}</span>
        </div>
      }
      visible={open}
      style={{ width: 'min(720px, 96vw)' }}
      onHide={onClose}
      modal
      draggable={false}
      closable={!loading}
    >
      <div style={ui.shell}>
        <div style={ui.hero}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            Add a master field to the selected page/category
          </div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 10 }}>
            Choose a master field, adjust its display label if needed, and select how it should render.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={ui.badge}>Service: {serviceId}</span>
            <span style={ui.badge}>Form Type: {formTypeId}</span>
            <span style={ui.badge}>Page: {pageId}</span>
            <span style={ui.badge}>Category: {categoryId}</span>
          </div>
        </div>

        <div style={ui.section}>
          <div style={{ marginBottom: 12 }}>
            <label style={ui.label}>
              Select Master Field <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <Dropdown
              value={selectedFieldId}
              options={availableFields}
              optionLabel="label"
              optionValue="value"
              onChange={(e) => {
                setSelectedFieldId(e.value);
                const match = availableFields.find((f: any) => f.value === e.value);
                if (match) {
                  if (match.defaultType) setInputType(match.defaultType);
                }
              }}
              filter
              filterBy="label"
              placeholder="Search master field..."
              emptyMessage="No fields available"
              className="w-100"
              disabled={loading}
              appendTo={appendTo}
              panelStyle={{ width: 'min(540px, 92vw)', maxWidth: '92vw' }}
              panelClassName="add-input-master-field-panel"
              virtualScrollerOptions={{ itemSize: 38 }}
              itemTemplate={(option: any) => (
                <div
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.25rem',
                    maxWidth: '100%',
                  }}
                  title={option?.label}
                >
                  {option?.label}
                </div>
              )}
              valueTemplate={(option: any, props: any) =>
                option ? (
                  <div
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={option.label}
                  >
                    {option.label}
                  </div>
                ) : (
                  <span>{props.placeholder}</span>
                )
              }
            />
            <div style={ui.helper}>
              Only fields not already added anywhere in this form are shown.
              {hiddenCount > 0 && (
                <span style={{ marginLeft: 6, color: '#b45309', fontWeight: 600 }}>
                  {hiddenCount} field{hiddenCount > 1 ? 's' : ''} already used in this form {hiddenCount > 1 ? 'are' : 'is'} hidden.
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <div>
              <label style={ui.label}>Custom Label (Optional)</label>
              <InputText
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-100"
                placeholder="Enter display label"
                disabled={loading}
              />
              <div style={ui.helper}>Leave blank to use the selected master field name.</div>
            </div>

            <div>
              <label style={ui.label}>Input Type</label>
              <Dropdown
                value={inputType}
                options={INPUT_TYPES}
                onChange={(e) => setInputType(e.value)}
                className="w-100"
                filter
                disabled={loading}
                appendTo={appendTo}
                panelStyle={{ width: 'min(420px, 92vw)' }}
              />
              <div style={ui.helper}>Choose how this field should render in the form.</div>
            </div>
          </div>
        </div>

        {/* ✅ User Assignment Section */}
        <div style={{ ...ui.section, background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="pi pi-user" style={{ fontSize: 14 }} />
            Assign to Specific User (Optional)
          </div>
          <div>
            <label style={ui.label}>User</label>
            <Dropdown
              value={assignedUserId}
              options={tenantUsers.map(u => ({ label: u.email, value: u.id }))}
              onChange={(e) => setAssignedUserId(e.value)}
              placeholder={loadingUsers ? 'Loading users...' : tenantId ? '-- All Users (no override) --' : 'Select a tenant first'}
              className="w-100"
              filter
              showClear
              disabled={loadingUsers || !tenantId}
              appendTo={appendTo}
            />
            <div style={{ ...ui.helper, fontStyle: 'italic', marginTop: 8 }}>
              Leave empty → this field shows for <strong>all</strong> users with the mapped role. Select a user → this field shows <strong>only</strong> for that user.
            </div>
          </div>
        </div>



        <div style={ui.footer}>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            {selectedFieldId ? `Selected: ${selectedFieldLabel}` : 'Select a master field to continue.'}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={onClose}
              disabled={loading}
              style={ui.btnSecondary}
            />
            <Button
              label="Add Field"
              icon="pi pi-check"
              disabled={!selectedFieldId}
              loading={loading}
              onClick={handleSave}
              autoFocus
              style={ui.btnPrimary}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        :global(.add-input-master-field-panel .p-dropdown-items .p-dropdown-item) {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </Dialog>
  );
}
