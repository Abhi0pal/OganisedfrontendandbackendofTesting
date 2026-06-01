'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import {
  useMasterDefinitions,
  useMasterData,
  useCreateMasterData,
  useUpdateMasterData,
  useDeleteMasterData,
  useToggleMasterData,
  useImportMasterData,
  MasterData,
  ExtraField,
} from '@/hooks/master/useDynamicMaster';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';

const toInputTextValue = (val: unknown): string =>
  val == null ? '' : String(val);

const getErrorMessage = (e: any, fallback: string = 'Operation failed'): string => {
  if (e?.response?.data?.message) {
    const msg = e.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  if (e instanceof Error) return e.message;
  return fallback;
};

interface MasterFormData {
  name: string;
  abbr?: string;
  parent_id?: number | null;
  [key: string]: any;
}

export const DynamicMasterData = () => {
  const toastRef = useRef<Toast>(null);
  const [selectedDefId, setSelectedDefId] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MasterFormData>({ name: '', abbr: '' });

  const { data: definitions = [] } = useMasterDefinitions();
  const selectedDef = useMemo(() => definitions.find((d) => d.id === selectedDefId), [definitions, selectedDefId]);
  const extraFields: ExtraField[] = useMemo(
    () => selectedDef?.json_definition?.extra_fields || [],
    [selectedDef],
  );

  // Parent master — for N-level hierarchy
  const parentMasterCode = selectedDef?.parent_master_code ?? null;
  const parentDef = useMemo(
    () => definitions.find((d) => d.code === parentMasterCode) ?? null,
    [definitions, parentMasterCode]
  );
  const { data: parentRecordsPage } = useMasterData(parentDef?.id ?? 0, { limit: 500 });
  const parentRecords = useMemo(() => parentRecordsPage?.data ?? [], [parentRecordsPage]);
  const parentOptions = useMemo(
    () => parentRecords.map((r) => ({ label: r.name, value: r.id })),
    [parentRecords]
  );

  const { data: dataPage, isLoading } = useMasterData(selectedDefId, { search, page, limit: 50000 });
  const createMutation = useCreateMasterData();
  const updateMutation = useUpdateMasterData();
  const deleteMutation = useDeleteMasterData();
  const toggleMutation = useToggleMasterData();
  const importMutation = useImportMasterData();
  const csvInputRef = useRef<HTMLInputElement>(null);

  const defOptions = useMemo(
    () => definitions.map((d) => ({ label: d.name, value: d.id })),
    [definitions]
  );

  const flatData: MasterData[] = useMemo(() => dataPage?.data || [], [dataPage]);

  const {
    data: tableData, filters, globalFilter,
    handleGlobalFilterChange, handleFiltersChange, clearFilters,
  } = useDataTableManager<MasterData>(flatData);

  const openAdd = useCallback(() => {
    const init: MasterFormData = { name: '', abbr: '', parent_id: null };
    extraFields.forEach((f) => { init[f.key] = f.type === 'boolean' ? false : ''; });
    setFormData(init);
    setEditingId(null);
    setShowDialog(true);
  }, [extraFields]);

  const openEdit = useCallback((row: MasterData) => {
    setFormData({
      name: row.name,
      abbr: row.abbr || '',
      ...(row.json_definition || {}),
    });
    setEditingId(row.id);
    setShowDialog(true);
  }, []);

  const handleDelete = useCallback(async (row: MasterData) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(row.id);
      toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: `"${row.name}" deleted` });
    } catch (e: unknown) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: getErrorMessage(e, 'Delete failed') });
    }
  }, [deleteMutation]);

  const handleToggle = useCallback(async (row: MasterData) => {
    try {
      await toggleMutation.mutateAsync(row.id);
    } catch {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Toggle failed' });
    }
  }, [toggleMutation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, abbr, parent_id, ...rest } = formData;
    // parent_id is always stored in json_definition if hierarchy is defined
    const jsonDef: Record<string, unknown> = { ...rest };
    if (parentMasterCode && parent_id) jsonDef.parent_id = parent_id;
    const safeName = String(name || '').trim();
    const safeAbbr = String(abbr || '').trim();
    const payload = {
      name: safeName,
      abbr: safeAbbr || undefined,
      master_definition_id: selectedDefId,
      json_definition: (extraFields.length > 0 || (parentMasterCode && parent_id)) ? jsonDef : undefined,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toastRef.current?.show({ severity: 'success', summary: 'Updated', detail: `"${safeName}" updated` });
      } else {
        await createMutation.mutateAsync(payload);
        toastRef.current?.show({ severity: 'success', summary: 'Created', detail: `"${safeName}" added` });
      }
      setShowDialog(false);
    } catch (e: unknown) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: getErrorMessage(e, 'Save failed') });
    }
  }, [formData, editingId, selectedDefId, extraFields, parentMasterCode, createMutation, updateMutation]);

  const renderField = (field: ExtraField) => {
    const val = formData[field.key];
    const set = (v: string | number | boolean | Date | null | undefined) => setFormData(p => ({ ...p, [field.key]: v }));
    switch (field.type) {
      case 'number':
        return <InputNumber value={val != null && val !== '' ? Number(val) : null} onValueChange={(e) => set(e.value)} className="w-100" />;
      case 'date':
        return <Calendar value={val ? new Date(String(val)) : null} onChange={(e) => set(e.value instanceof Date ? e.value : null)} className="w-100" dateFormat="dd/mm/yy" />;
      case 'boolean':
        return (
          <div className="d-flex align-items-center gap-2 pt-1">
            <InputSwitch checked={!!val} onChange={(e) => set(e.value)} />
            <span className="small text-muted">{val ? 'Yes' : 'No'}</span>
          </div>
        );
      case 'select':
        const opts = (field.options || []).map((o) => ({ label: o.label, value: o.value }));
        return <Dropdown value={val} options={opts} onChange={(e) => set(e.value)} className="w-100" placeholder="Select..." />;
      default:
        return <InputText value={toInputTextValue(val)} onChange={(e) => set(e.target.value)} className="w-100" />;
    }
  };

  const tableConfig: ReusableDataTableConfig<MasterData> = useMemo(() => {
    const extraColumns = extraFields.map((f) => ({
      field: f.key as keyof MasterData,
      header: f.label,
      filterType: 'text' as const,
      body: (row: MasterData) => {
        const v = row.json_definition?.[f.key];
        if (v === undefined || v === '') return <span className="text-muted small">—</span>;
        if (f.type === 'boolean') return <Tag value={v ? 'Yes' : 'No'} severity={v ? 'success' : 'secondary'} />;
        return <span className="small">{String(v)}</span>;
      },
    }));

    return {
      columns: [
        {
          field: 'master_definition_name',
          header: 'Master Type',
          width: '14%',
          filterType: 'text',
          body: (row) => <span className="fw-semibold">{row.master_definition_name || selectedDef?.name || '—'}</span>,
        },
        // Show parent column only when hierarchy is defined
        ...(parentMasterCode ? [{
          field: 'json_definition' as keyof MasterData,
          header: parentDef?.name || 'Parent',
          width: '14%',
          filterType: 'text' as const,
          body: (row: MasterData) => {
            const pid = row.json_definition?.parent_id;
            const parentRec = parentRecords.find((r) => r.id === pid);
            return <span className="text-muted small">{parentRec?.name || (pid ? `ID:${pid}` : '—')}</span>;
          },
        }] : []),
        {
          field: 'abbr',
          header: 'Abbr.',
          width: '8%',
          filterType: 'text',
          body: (row) => <span className="text-muted small">{row.abbr || '—'}</span>,
        },
        {
          field: 'name',
          header: 'Name',
          width: '18%',
          filterType: 'text',
          body: (row) => <span>{row.name}</span>,
        },
        ...extraColumns,
        {
          field: 'is_active',
          header: 'Status',
          width: '9%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row) => (
            <Tag value={row.is_active ? 'Active' : 'Inactive'} severity={row.is_active ? 'success' : 'danger'} />
          ),
        },
        {
          field: 'created_at',
          header: 'Created At',
          width: '11%',
          filterType: 'date',
          body: (row) =>
            new Date(row.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            }),
        },
        {
          field: 'updated_at',
          header: 'Updated At',
          width: '11%',
          filterType: 'date',
          body: (row) =>
            new Date(row.updated_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric',
            }),
        },
        {
          field: 'created_by_email',
          header: 'Created By',
          width: '12%',
          filterType: 'text',
          body: (row) => <span className="text-muted small">{row.created_by_email || '—'}</span>,
        },
        {
          field: 'updated_by_email',
          header: 'Updated By',
          width: '12%',
          filterType: 'text',
          body: (row) => <span className="text-muted small">{row.updated_by_email || '—'}</span>,
        },
      ],
      dataKey: 'id',
      rows: 20,
      rowsPerPageOptions: [10, 20, 50],
      globalFilterFields: ['name', 'code', 'abbr'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: selectedDefId
        ? `No records found. Click "Add ${selectedDef?.name}" to add one.`
        : 'Select a master type to view records.',
    };
  }, [extraFields, selectedDefId, selectedDef, parentMasterCode, parentDef?.name, parentRecords]);

  const rowActions: RowAction<MasterData>[] = useMemo(() => [
    {
      icon: 'pi pi-pencil', label: 'Edit', severity: 'info', tooltip: 'Edit',
      onClick: (row) => openEdit(row),
    },
    {
      icon: 'pi pi-check', label: 'Activate', severity: 'success', tooltip: 'Activate',
      onClick: (row) => handleToggle(row),
      visible: (row) => !row.is_active,
    },
    {
      icon: 'pi pi-times', label: 'Deactivate', severity: 'warn', tooltip: 'Deactivate',
      onClick: (row) => handleToggle(row),
      visible: (row) => row.is_active,
    },
    {
      icon: 'pi pi-trash', label: 'Delete', severity: 'error', tooltip: 'Delete',
      onClick: (row) => handleDelete(row),
    },
  ], [openEdit, handleToggle, handleDelete]);

  const downloadTemplate = useCallback(() => {
    const masterName = selectedDef?.name || 'Master';
    const masterCode = selectedDef?.code || '';
    const extraHeaders = extraFields.map((f) => f.key).join(',');
    const headersList = ['name', 'abbr'];
    if (parentMasterCode) headersList.push('parent_name');
    extraFields.forEach((f) => headersList.push(f.key));

    // Info comment rows (lines starting with # are ignored by importer)
    const info = [
      `# Template for: ${masterName} (${masterCode})`,
      `# Instructions:`,
      `#   - Do NOT delete or rename the header row`,
      `#   - 'name' column is required for every row`,
      `#   - 'abbr' column is optional (short form)`,
      parentMasterCode ? `#   - 'parent_name' is required. Use the ${parentDef?.name || 'parent'} name, abbr, or ID.` : null,
      extraHeaders ? `#   - Extra columns: ${extraHeaders}` : null,
      `#   - Duplicate names will be skipped automatically`,
      `#   - This file will import data into: ${masterName}`,
      ``,
    ].filter((l) => l !== null).join('\n');

    const headers = headersList.join(',');
    const exampleValues = ['Example ' + masterName, 'EX'];
    if (parentMasterCode) exampleValues.push(`${parentDef?.name || 'Parent'} Name`);
    extraFields.forEach((f) => exampleValues.push(f.type === 'boolean' ? 'false' : f.type === 'number' ? '0' : ''));
    const example = exampleValues.join(',');

    const csv = `${info}${headers}\n${example}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${masterName.replace(/\s+/g, '_')}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [extraFields, selectedDef, parentMasterCode, parentDef]);

  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDefId) return;
    e.target.value = '';
    try {
      const result = await importMutation.mutateAsync({ masterDefinitionId: selectedDefId, file });
      toastRef.current?.show({
        severity: result.errors?.length ? 'warn' : 'success',
        summary: 'Import Complete',
        detail: `Created: ${result.created}, Skipped (duplicates): ${result.skipped}${result.errors?.length ? `, Errors: ${result.errors.length}` : ''}`,
        life: 6000,
      });
    } catch (e: unknown) {
      toastRef.current?.show({ severity: 'error', summary: 'Import Failed', detail: getErrorMessage(e, 'Import failed') });
    }
  }, [selectedDefId, importMutation]);

  const leftToolbar = useCallback(() => (
    <div className="d-flex align-items-center gap-2">
      <Dropdown
        value={selectedDefId || null}
        options={defOptions}
        onChange={(e) => { setSelectedDefId(e.value); setPage(1); setSearch(''); }}
        placeholder="Choose a master type..."
        style={{ width: '220px' }}
        filter
      />
      {selectedDefId > 0 && (
        <>
          <Button
            label={`Add ${selectedDef?.name}`}
            icon="pi pi-plus"
            severity="success"
            onClick={openAdd}
            style={{ whiteSpace: 'nowrap', height: '36px' }}
          />
          <Button
            label="Import CSV"
            icon="pi pi-upload"
            severity="info"
            onClick={() => csvInputRef.current?.click()}
            loading={importMutation.isPending}
            style={{ whiteSpace: 'nowrap', height: '36px' }}
          />
          <Button
            label="CSV Template"
            icon="pi pi-download"
            severity="secondary"
            outlined
            onClick={downloadTemplate}
            style={{ whiteSpace: 'nowrap', height: '36px' }}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCsvImport}
          />
        </>
      )}
    </div>
  ), [selectedDefId, defOptions, selectedDef, openAdd, importMutation.isPending, downloadTemplate, handleCsvImport]);

  const rightToolbar = useCallback(() => (
    <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" outlined
      style={{ whiteSpace: 'nowrap', height: '36px' }}
      onClick={() => { clearFilters(); handleGlobalFilterChange(''); handleFiltersChange({}); }} />
  ), [clearFilters, handleGlobalFilterChange, handleFiltersChange]);

  return (
    <div className="p-4">
      <Toast ref={toastRef} />

      <div className="mt-4 mb-5 d-flex align-items-center justify-content-between page-header">
        <h1>Master Data</h1>
        <Toolbar left={leftToolbar} right={rightToolbar} />
      </div>

      {!selectedDefId ? (
        <div className="text-center py-5 text-muted">
          <i className="pi pi-arrow-up fs-2 d-block mb-2" />
          Select a master type above to view and manage its records
        </div>
      ) : (
        <ReusableDataTable
          data={tableData}
          config={tableConfig}
          loading={isLoading}
          rowActions={rowActions}
          externalFilters={filters}
          externalGlobalFilter={globalFilter}
          onFiltersChange={handleFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
        />
      )}

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={<div className="ey-dialog-title">{editingId ? `Edit ${selectedDef?.name}` : `Add New ${selectedDef?.name}`}</div>}
        modal className="ey-dialog" style={{ width: '480px' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
        contentStyle={{ overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
          <div className="row g-3">
            {/* Parent selector — shown only when this master has a parent_master_code */}
            {parentMasterCode && (
              <div className="col-12">
                <label className="form-label fw-semibold">
                  {parentDef?.name || 'Parent'} <span className="text-danger">*</span>
                </label>
                <Dropdown
                  value={formData.parent_id}
                  options={parentOptions}
                  onChange={(e) => setFormData(p => ({ ...p, parent_id: e.value }))}
                  placeholder={`Select ${parentDef?.name || 'parent'}...`}
                  className="w-100"
                  filter
                  showClear
                />
                {!formData.parent_id && (
                  <small className="text-danger">Please select a {parentDef?.name || 'parent'}</small>
                )}
              </div>
            )}
            <div className="col-8">
              <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
              <InputText
                value={toInputTextValue(formData.name)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\b\w/g, (c) => c.toUpperCase());
                  setFormData(p => ({ ...p, name: val }));
                }}
                placeholder={`Enter ${selectedDef?.name} name`} className="w-100" required />
            </div>
            <div className="col-4">
              <label className="form-label fw-semibold">Abbr.</label>
              <InputText value={toInputTextValue(formData.abbr)} onChange={(e) => setFormData(p => ({ ...p, abbr: e.target.value }))}
                placeholder="Short form" className="w-100" />
            </div>

            {extraFields.length > 0 && (
              <>
                <div className="col-12">
                  <hr className="my-1" />
                  <small className="text-muted text-uppercase fw-semibold">Additional Details</small>
                </div>
                {extraFields.map((field) => (
                  <div key={field.key} className="col-12">
                    <label className="form-label fw-semibold">
                      {field.label}
                      {field.required && <span className="text-danger ms-1">*</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </>
            )}

            <div className="col-12 d-flex gap-2 pt-1">
              <Button label={editingId ? 'Save Changes' : `Add ${selectedDef?.name}`} icon="pi pi-check"
                type="submit" loading={createMutation.isPending || updateMutation.isPending} className="flex-grow-1" />
              <Button label="Cancel" icon="pi pi-times" severity="secondary" type="button"
                onClick={() => setShowDialog(false)} />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
