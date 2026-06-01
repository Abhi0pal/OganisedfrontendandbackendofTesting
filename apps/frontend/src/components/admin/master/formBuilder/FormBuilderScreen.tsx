'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputNumber } from 'primereact/inputnumber';

import type { FbPage, FbPageCategory } from '@/types/formBuilder';
import apiClient from '@/lib/api-client';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import type { DataTableColumnConfig } from '@/components/DataTable/types';

import {
  useFormBuilderFields,
  useDeleteFormBuilderField,
  useUpdateFormBuilderField,
} from '@/hooks/master/useFormBuilderFields';
import { useFormCategories } from '@/hooks/master/useFormCategories';
import { useFormAddMoreGroups } from '@/hooks/master/useFormAddMore';

import { AddInputModal } from './AddInputModal';
import { FieldOptionsModal } from './FieldOptionsModal';
import { AddMoreModal } from './AddMoreModal';
import { EditInputModal } from './EditInputModal';
import { LogicBuilderModal } from './LogicBuilderModal';
import { OPTION_CAPABLE_TYPES } from './constants';

type Props = { serviceId: string; formTypeId: number };
type ParentCandidate = { id: number; field_code: string; label: string; input_type: string };

export function FormBuilderScreen({ serviceId, formTypeId }: Props) {
  const toast = useRef<Toast>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mappingIdRaw = searchParams.get('mappingId');
  const mappingId = (mappingIdRaw === 'undefined' || mappingIdRaw === 'null') ? null : mappingIdRaw;
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  const [builderMeta, setBuilderMeta] = useState<{
    serviceId: string;
    serviceName: string;
    formTypeId: number;
    formTypeName: string;
    tenantId?: number | null;
    projectId?: number | null;
    roleId?: number | null;
    tenantName?: string | null;
    projectName?: string | null;
    roleName?: string | null;
  } | null>(null);

  const [pages, setPages] = useState<FbPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const [pageCategories, setPageCategories] = useState<FbPageCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsFieldId, setOptionsFieldId] = useState<number | null>(null);
  const [addMoreOpen, setAddMoreOpen] = useState(false);
  const [addMoreTriggerId, setAddMoreTriggerId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [logicOpen, setLogicOpen] = useState(false);
  const [logicField, setLogicField] = useState<any | null>(null);
  const [orderDraft, setOrderDraft] = useState<Record<number, number>>({});
  const [savingOrder, setSavingOrder] = useState(false);

  const del = useDeleteFormBuilderField();
  const upd = useUpdateFormBuilderField();
  const { data: categoryMaster = [] } = useFormCategories();

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    if (Array.isArray(categoryMaster)) {
      categoryMaster.forEach((c: any) =>
        map.set(c.id, c.categoryName || c.nameAlt || c.nameInHindi || `Category-${c.id}`),
      );
    }
    return map;
  }, [categoryMaster]);

  const loadPages = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/${formTypeId}/pages`,
        { params: { mappingId } }
      );
      setPages(Array.isArray(res.data) ? res.data : []);
    } catch { setPages([]); }
  }, [serviceId, formTypeId, mappingId]);

  const loadMeta = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/${formTypeId}/meta`,
        { params: { mappingId } }
      );
      setBuilderMeta(res.data ?? null);
    } catch { setBuilderMeta(null); }
  }, [serviceId, formTypeId, mappingId]);

  const loadPageCategories = useCallback(async (pageId: number) => {
    try {
      const res = await apiClient.get(`/master/form-builder/pages/${pageId}/categories`);
      setPageCategories(Array.isArray(res.data) ? res.data : []);
    } catch { setPageCategories([]); }
  }, []);

  useEffect(() => {
    loadMeta();
    loadPages();
    setSelectedPageId(null);
    setSelectedCategoryId(null);
    setPageCategories([]);
  }, [loadMeta, loadPages]);

  useEffect(() => {
    if (!selectedPageId) { setPageCategories([]); return; }
    setSelectedCategoryId(null);
    loadPageCategories(selectedPageId);
  }, [selectedPageId, loadPageCategories]);

  const { data: builderRows = [], isLoading, refetch } = useFormBuilderFields({
    serviceId, formTypeId, mappingId, pageId: selectedPageId, categoryId: selectedCategoryId, locale,
  });

  const { data: addMoreGroups = [], refetch: refetchAddMoreGroups } = useFormAddMoreGroups(
    selectedPageId && selectedCategoryId
      ? { serviceId, formTypeId, pageId: selectedPageId, categoryId: selectedCategoryId }
      : undefined,
  );

  const fieldsUsedInAddMore = useMemo(() => {
    const usedIds = new Set<number>();
    if (Array.isArray(addMoreGroups)) {
      addMoreGroups.forEach((g: any) => {
        if (Array.isArray(g.columns)) g.columns.forEach((c: any) => usedIds.add(c.builder_field_id));
      });
    }
    return usedIds;
  }, [addMoreGroups]);

  // Current page+category fields (used to prevent instant re-add after adding)
  const existingFormFieldIds = useMemo(
    () => (builderRows ?? []).map((r: any) => r.form_field_id).filter(Boolean),
    [builderRows],
  );

  // ALL field IDs already used anywhere in this service's form (all pages, all categories)
  const [allServiceFieldIds, setAllServiceFieldIds] = useState<number[]>([]);
  useEffect(() => {
    if (!serviceId) return;
    apiClient
      .get<{ fields: { form_field_id: number }[] }>(`/master/form-builder/fields?serviceId=${serviceId}`)
      .then((res) => {
        const ids = (res.data?.fields ?? []).map((f) => f.form_field_id).filter(Boolean);
        setAllServiceFieldIds(ids);
      })
      .catch(() => setAllServiceFieldIds([]));
  }, [serviceId, builderRows]); // re-fetch when builderRows change (field added/removed)

  useEffect(() => {
    const next: Record<number, number> = {};
    (builderRows ?? []).forEach((r: any) => { next[Number(r.id)] = Number(r.preference ?? 0); });
    setOrderDraft((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) return next;
      for (const key of nextKeys) {
        if (Number(prev[Number(key)]) !== Number(next[Number(key)])) return next;
      }
      return prev;
    });
  }, [builderRows, selectedPageId, selectedCategoryId]);

  const hasOrderChanges = useMemo(() => {
    return (builderRows ?? []).some((r: any) => {
      const id = Number(r.id);
      const existing = Number(r.preference ?? 0);
      const draft = Number(orderDraft[id] ?? existing);
      return existing !== draft;
    });
  }, [builderRows, orderDraft]);

  const saveOrdering = useCallback(async () => {
    if (!Array.isArray(builderRows) || builderRows.length === 0) return;
    const changedRows = builderRows.filter((r: any) => {
      const id = Number(r.id);
      return Number(r.preference ?? 0) !== Number(orderDraft[id] ?? r.preference ?? 0);
    });
    if (changedRows.length === 0) {
      toast.current?.show({ severity: 'info', summary: 'No Changes', detail: 'Field order is already up to date.', life: 1800 });
      return;
    }
    setSavingOrder(true);
    try {
      await Promise.all(
        changedRows.map((row: any) =>
          upd.mutateAsync({
            id: Number(row.id),
            data: { preference: Number(orderDraft[Number(row.id)] ?? row.preference ?? 0) },
            refetchKey: ['fb-builder-fields', { serviceId, formTypeId, pageId: selectedPageId, categoryId: selectedCategoryId }],
          }),
        ),
      );
      toast.current?.show({ severity: 'success', summary: 'Order Saved', detail: `${changedRows.length} field(s) updated.`, life: 2200 });
      await refetch();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Save Failed', detail: 'Could not update field order.' });
    } finally { setSavingOrder(false); }
  }, [builderRows, formTypeId, orderDraft, refetch, selectedCategoryId, selectedPageId, serviceId, upd]);

  const resetOrderingDraft = useCallback(() => {
    const next: Record<number, number> = {};
    (builderRows ?? []).forEach((r: any) => { next[Number(r.id)] = Number(r.preference ?? 0); });
    setOrderDraft(next);
  }, [builderRows]);

  const autoResequenceOrdering = useCallback(() => {
    const sorted = [...(builderRows ?? [])].sort((a: any, b: any) => {
      const aPref = Number(a?.preference ?? 0);
      const bPref = Number(b?.preference ?? 0);
      if (aPref !== bPref) return aPref - bPref;
      return Number(a?.id ?? 0) - Number(b?.id ?? 0);
    });
    const next: Record<number, number> = {};
    sorted.forEach((row: any, idx: number) => { next[Number(row.id)] = idx + 1; });
    setOrderDraft(next);
    toast.current?.show({ severity: 'info', summary: 'Re-sequenced', detail: 'Click Save Order to apply.', life: 2000 });
  }, [builderRows]);

  const resolveFieldCode = useCallback((row: any): string =>
    String(row?.field_code ?? row?.fieldCode ?? row?.formchk_id ?? row?.formField?.formCheckId ?? '').trim(),
    [],
  );

  const resolveFieldLabel = useCallback((row: any, code: string): string => {
    const label = String(row?.label ?? row?.custom_label ?? row?.formField?.name ?? '').trim();
    return label || code || `Field ${row?.id ?? ''}`.trim();
  }, []);

  const parentCandidates: ParentCandidate[] = useMemo(() => {
    if (!Array.isArray(builderRows) || builderRows.length === 0) return [];
    return builderRows
      .filter((r: any) => r && r.id !== optionsFieldId)
      .map((r: any) => {
        const fieldCode = resolveFieldCode(r);
        return { id: r.id, field_code: fieldCode, label: resolveFieldLabel(r, fieldCode), input_type: String(r?.input_type ?? 'text') };
      })
      .filter((r: ParentCandidate) => r.field_code.length > 0);
  }, [builderRows, optionsFieldId, resolveFieldCode, resolveFieldLabel]);

  const logicFieldOptions = useMemo(() => {
    const seen = new Set<string>();
    return parentCandidates
      .filter((p) => { if (!p.field_code || seen.has(p.field_code)) return false; seen.add(p.field_code); return true; })
      .map((p) => ({ label: `${p.label} (${p.field_code})`, value: p.field_code, type: p.input_type }));
  }, [parentCandidates]);

  const editRuleFieldOptions = useMemo(() => {
    if (!Array.isArray(builderRows) || builderRows.length === 0) return [];
    const seen = new Set<string>();
    return builderRows
      .map((r: any) => {
        const code = resolveFieldCode(r);
        if (!code || seen.has(code)) return null;
        seen.add(code);
        return { label: `${resolveFieldLabel(r, code)} (${code})`, value: code };
      })
      .filter(Boolean) as Array<{ label: string; value: string }>;
  }, [builderRows, resolveFieldCode, resolveFieldLabel]);

  const pageOptions = useMemo(
    () => (pages ?? []).map((p) => ({ label: `Page ${p.preference} — ${p.page_name ?? 'Untitled'}`, value: p.id })),
    [pages],
  );

  const categoryOptions = useMemo(
    () => (pageCategories ?? []).map((c) => ({
      label: categoryNameById.get(c.category_id) ?? `ID: ${c.category_id}`,
      value: c.category_id,
    })),
    [pageCategories, categoryNameById],
  );

  const doDelete = useCallback(async (id: number) => {
    if (!window.confirm('Delete this field?')) return;
    try {
      await del.mutateAsync(id);
      toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Field deleted.', life: 2000 });
      await refetch();
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Failed', detail: 'Could not delete.' });
    }
  }, [del, refetch]);

  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null;

  const columns: DataTableColumnConfig<any>[] = useMemo(() => [
    {
      field: 'preference',
      header: 'Order',
      filterType: 'none',
      sortable: true,
      style: { width: '110px' },
      body: (row: any) => {
        const id = Number(row.id);
        const value = Number(orderDraft[id] ?? row.preference ?? 0);
        return (
          <InputNumber
            value={value}
            min={0}
            useGrouping={false}
            onValueChange={(e) => setOrderDraft((prev) => ({ ...prev, [id]: Number(e.value ?? 0) }))}
            inputStyle={{ width: '80px' }}
            className="p-inputtext-sm"
          />
        );
      },
    },
    { field: 'field_code', header: 'Code', filterType: 'text', width: '12%' },
    { field: 'label', header: 'Label', filterType: 'text' },
    {
      field: 'input_type', header: 'Type', filterType: 'text', width: '10%',
      body: (row: any) => <Tag value={row.input_type} severity="contrast" />,
    },
    {
      field: 'grid_span', header: 'Width', filterType: 'none', width: '8%',
      body: (row: any) => <Tag value={`${row.grid_span ?? 12}/12`} severity="info" />,
    },
    {
      field: 'is_required', header: 'Required', filterType: 'none', width: '9%',
      body: (row: any) => row.is_required === 'Y'
        ? <Tag value="Required" severity="success" />
        : <Tag value="Optional" severity="secondary" />,
    },
    {
      field: 'user_email', header: 'User', filterType: 'text', width: '12%',
      body: (row: any) => row.user_email
        ? <Tag value={row.user_email} severity="warning" icon="pi pi-user" style={{ fontSize: '0.7rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }} />
        : <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>All Users</span>,
    },
    {
      field: 'actions', header: 'Actions', filterType: 'none', width: '11%',
      body: (row: any) => {
        const canOptions = OPTION_CAPABLE_TYPES.includes(row.input_type);
        const isAddMore = row.input_type === 'addmore';
        const isLocked = fieldsUsedInAddMore.has(row.id);
        return (
          <div className="d-flex gap-1 flex-wrap">
            <Button icon="pi pi-pencil" rounded text severity="info" tooltip="Edit" tooltipOptions={{ position: 'top' }}
              onClick={() => { setEditRow(row); setEditOpen(true); }} />
            {canOptions && (
              <Button icon="pi pi-list" rounded text severity="warning" tooltip="Options" tooltipOptions={{ position: 'top' }}
                onClick={() => { setOptionsFieldId(row.id); setOptionsOpen(true); }} />
            )}
            {isAddMore && (
              <Button icon="pi pi-table" rounded text severity="help" tooltip="Columns" tooltipOptions={{ position: 'top' }}
                onClick={() => { setAddMoreTriggerId(row.id); setAddMoreOpen(true); }} />
            )}
            {!isAddMore && (
              <Button icon="pi pi-bolt" rounded severity="success" tooltip="Logic Rule" tooltipOptions={{ position: 'top' }}
                style={{ width: 30, height: 30 }}
                onClick={() => { setLogicField(row); setLogicOpen(true); }} />
            )}
            {!isLocked && (
              <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Delete" tooltipOptions={{ position: 'top' }}
                onClick={() => doDelete(row.id)} />
            )}
          </div>
        );
      },
    },
  ], [doDelete, fieldsUsedInAddMore, orderDraft]);

  // ── Toolbar templates ──────────────────────────────────────────────────────

  const headerLeft = useCallback(() => (
    <div className="d-flex flex-column gap-1">
      <h1 className="h4 mb-0">{builderMeta?.serviceName || 'Form Builder'}</h1>
      <div className="d-flex gap-2 flex-wrap align-items-center">
        <code className="small text-muted">{serviceId}</code>
        <Tag value={builderMeta?.formTypeName || `Form Type ${formTypeId}`} severity="info" />
        {builderMeta?.tenantName && <Tag value={`Tenant: ${builderMeta.tenantName}`} severity="success" icon="pi pi-building" />}
        {builderMeta?.projectName && <Tag value={`Project: ${builderMeta.projectName}`} severity="info" icon="pi pi-folder" />}
        {builderMeta?.roleName && <Tag value={`Role: ${builderMeta.roleName}`} severity="warning" icon="pi pi-users" />}
        <Tag value={`${builderRows.length} field${builderRows.length !== 1 ? 's' : ''}`} severity="secondary" />
        <Tag value={`${pages.length} page${pages.length !== 1 ? 's' : ''}`} severity="secondary" />
      </div>
    </div>
  ), [builderMeta, serviceId, formTypeId, builderRows.length, pages.length]);

  const headerRight = useCallback(() => (
    <div className="d-flex gap-2">
      <Button label="Back" icon="pi pi-arrow-left" severity="secondary" outlined
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        onClick={() => router.push(`/${locale}/admin/master/form-builder`)} />
      <Button label="Preview" icon="pi pi-eye"
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        onClick={() => router.push(`/${locale}/admin/master/form-builder/services/${serviceId}/forms/${formTypeId}/builder/preview`)} />
    </div>
  ), [router, locale, serviceId, formTypeId]);

  const fieldsLeft = useCallback(() => (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <Dropdown value={selectedPageId} options={pageOptions} onChange={(e) => setSelectedPageId(e.value)}
        placeholder="Select Page" style={{ width: '220px' }} filter showClear />
      <Dropdown value={selectedCategoryId} options={categoryOptions} onChange={(e) => setSelectedCategoryId(e.value)}
        placeholder={selectedPageId ? 'Select Category' : 'Select page first'}
        style={{ width: '220px' }} filter showClear disabled={!selectedPageId} />
      {selectedPage && (
        <span className="badge bg-light text-dark border small">
          Page {selectedPage.preference} — {selectedPage.page_name || 'Untitled'}
        </span>
      )}
      {selectedCategoryId && (
        <span className="badge bg-light text-dark border small">
          {categoryNameById.get(selectedCategoryId) ?? `Cat. ${selectedCategoryId}`}
        </span>
      )}
    </div>
  ), [selectedPageId, pageOptions, selectedCategoryId, categoryOptions, selectedPage, categoryNameById]);

  const fieldsRight = useCallback(() => (
    <div className="d-flex gap-2 flex-wrap">
      <Button label="Reset Order" icon="pi pi-refresh" severity="secondary" outlined size="small"
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        onClick={resetOrderingDraft} disabled={!hasOrderChanges || savingOrder} />
      <Button label="Re-sequence" icon="pi pi-sort-numeric-up" severity="secondary" outlined size="small"
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        onClick={autoResequenceOrdering} disabled={savingOrder || (builderRows?.length ?? 0) === 0} />
      <Button label="Save Order" icon="pi pi-check" severity="info" size="small"
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        onClick={saveOrdering} disabled={!hasOrderChanges || savingOrder} loading={savingOrder} />
      <Button label="Add Field" icon="pi pi-plus" severity="success" size="small"
        style={{ height: '36px', whiteSpace: 'nowrap' }}
        disabled={!selectedCategoryId} onClick={() => setAddOpen(true)} />
    </div>
  ), [resetOrderingDraft, hasOrderChanges, savingOrder, autoResequenceOrdering, builderRows?.length, saveOrdering, selectedCategoryId]);

  return (
    <div className="p-4">
      <Toast ref={toast} />

      {/* Header */}
      <div className="mb-3">
        <Toolbar left={headerLeft} right={headerRight} className="mb-3" />
      </div>

      {/* Page hint */}
      {!selectedPageId && (
        <div className="alert alert-info d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
          <i className="pi pi-info-circle" />
          Select a page and category below to manage fields for this form.
        </div>
      )}

      {/* Fields section */}
      <div className="mb-3">
        <Toolbar left={fieldsLeft} right={fieldsRight} className="mb-3" />
        <ReusableDataTable
          data={builderRows}
          loading={isLoading}
          config={{
            dataKey: 'id',
            columns,
            rows: 50,
            stripedRows: true,
            showGridlines: true,
            emptyMessage: !selectedPageId
              ? 'Select a page to view fields.'
              : !selectedCategoryId
                ? 'Select a category to view fields.'
                : 'No fields found. Click Add Field to get started.',
          }}
        />
      </div>

      {/* Modals */}
      {selectedPageId && selectedCategoryId && (
        <AddInputModal open={addOpen} onClose={() => setAddOpen(false)}
          locale={locale} serviceId={serviceId} formTypeId={formTypeId}
          pageId={selectedPageId} categoryId={selectedCategoryId}
          existingFormFieldIds={existingFormFieldIds}
          allServiceFieldIds={allServiceFieldIds}
          onCreated={() => { refetch(); }}
          tenantId={builderMeta?.tenantId} projectId={builderMeta?.projectId}
          mappingId={mappingId} />
      )}

      <EditInputModal open={editOpen} row={editRow} locale={locale}
        availableRuleFields={editRuleFieldOptions}
        currentRuleFieldCode={resolveFieldCode(editRow)}
        tenantId={builderMeta?.tenantId} projectId={builderMeta?.projectId}
        onClose={() => { setEditOpen(false); setEditRow(null); }}
        onSaved={async () => { toast.current?.show({ severity: 'success', summary: 'Saved' }); await refetch(); }} />

      <FieldOptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)}
        builderFieldId={optionsFieldId} parentCandidates={parentCandidates}
        tenantId={builderMeta?.tenantId} projectId={builderMeta?.projectId} />

      {selectedPageId && selectedCategoryId && (
        <AddMoreModal open={addMoreOpen} onClose={() => setAddMoreOpen(false)}
          serviceId={serviceId} formTypeId={formTypeId}
          pageId={selectedPageId} categoryId={selectedCategoryId}
          triggerBuilderFieldId={addMoreTriggerId} onSaved={() => refetchAddMoreGroups()} />
      )}

      <LogicBuilderModal open={logicOpen}
        onClose={() => { setLogicOpen(false); setLogicField(null); }}
        serviceId={serviceId} formId={formTypeId}
        availableFields={logicFieldOptions}
        currentFieldCode={resolveFieldCode(logicField) || undefined}
        currentFieldLabel={resolveFieldLabel(logicField, resolveFieldCode(logicField)) || undefined} />
    </div>
  );
}
