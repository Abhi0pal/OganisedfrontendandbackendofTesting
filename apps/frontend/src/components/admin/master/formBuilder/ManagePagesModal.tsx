'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';

import apiClient from '@/lib/api-client';
import { FbPage, FbPageCategory } from '@/types/formBuilder';
import { useFormCategories } from '@/hooks/master/useFormCategories';

type Props = {
  open: boolean;
  onClose: () => void;
  serviceId: string;
  formTypeId: number;
  formName: string;
  tenantId?: number | null;
  projectId?: number | null;
  roleId?: number | null;
  tenantName?: string | null;
  tenantCode?: string | null;
  projectName?: string | null;
  projectCode?: string | null;
};

const ui = {
  panel: {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
    padding: 14,
  } as const,
  muted: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 1.4,
  } as const,
  label: {
    display: 'block',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 6,
    fontSize: 13,
  } as const,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #dbeafe',
    background: '#eff6ff',
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: 600,
  } as const,
  btnPrimary: {
    borderRadius: 999,
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    border: '1px solid #1d4ed8',
    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.2)',
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
  btnDangerSoft: {
    borderRadius: 999,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    color: '#be123c',
    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.08)',
    fontWeight: 600,
  } as const,
};

export function ManagePagesModal({ open, onClose, serviceId, formTypeId, formName, tenantId: tenantIdProp, projectId: projectIdProp, roleId: roleIdProp, tenantName: tenantNameProp, tenantCode: tenantCodeProp, projectName: projectNameProp, projectCode: projectCodeProp }: Props) {
  const toast = useRef<Toast>(null);

  const [pages, setPages] = useState<FbPage[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback: fetch tenant/project from service API if IDs are not passed as props
  const [fetchedTenantId, setFetchedTenantId] = useState<number | null>(null);
  const [fetchedProjectId, setFetchedProjectId] = useState<number | null>(null);
  const [fetchedTenant, setFetchedTenant] = useState<{ name: string | null; code: string | null } | null>(null);
  const [fetchedProject, setFetchedProject] = useState<{ name: string | null; code: string | null } | null>(null);

  useEffect(() => {
    if (!open || !serviceId) return;
    if (tenantIdProp && projectIdProp) return; // IDs already provided via props
    apiClient.get('/master/service').then((res) => {
      const svc = (res.data ?? []).find((s: any) => String(s.service_id) === String(serviceId));
      if (svc?.tenantId) setFetchedTenantId(Number(svc.tenantId));
      if (svc?.projectId) setFetchedProjectId(Number(svc.projectId));
      if (svc?.tenant) setFetchedTenant({ name: svc.tenant.name ?? null, code: svc.tenant.tenant_ID ?? null });
      if (svc?.project) setFetchedProject({ name: svc.project.name ?? null, code: svc.project.project_ID ?? svc.project.code ?? null });
    }).catch(() => {});
  }, [open, serviceId, tenantIdProp, projectIdProp]);

  const resolvedTenantId = tenantIdProp ?? fetchedTenantId ?? null;
  const resolvedProjectId = projectIdProp ?? fetchedProjectId ?? null;
  const resolvedRoleId = roleIdProp ?? null;
  const displayTenantName = tenantNameProp ?? fetchedTenant?.name ?? null;
  const displayTenantCode = tenantCodeProp ?? fetchedTenant?.code ?? null;
  const displayProjectName = projectNameProp ?? fetchedProject?.name ?? null;
  const displayProjectCode = projectCodeProp ?? fetchedProject?.code ?? null;

  const [selectedPage, setSelectedPage] = useState<FbPage | null>(null);
  const [pageName, setPageName] = useState('');
  const [pageHindiName, setPageHindiName] = useState('');

  const [pageCategories, setPageCategories] = useState<FbPageCategory[]>([]);
  const [savingCats, setSavingCats] = useState(false);

  const { data: categories } = useFormCategories({ tenantId: resolvedTenantId, projectId: resolvedProjectId });

  const categoryOptions = useMemo(() => {
    return (categories ?? []).map((c: any) => ({
      label: c.categoryName ?? c.nameAlt ?? c.category_code ?? `Category-${c.id}`,
      value: c.id,
    }));
  }, [categories]);

  async function loadPages(keepSelectedId?: number) {
    setLoading(true);
    try {
      const res = await apiClient.get(`/master/form-builder/services/${serviceId}/forms/${formTypeId}/pages`, {
        params: {
          tenantId: resolvedTenantId,
          projectId: resolvedProjectId,
          roleId: resolvedRoleId
        }
      });
      const newPages: FbPage[] = res.data ?? [];
      setPages(newPages);

      if (keepSelectedId) {
        const stillThere = newPages.find((p) => p.id === keepSelectedId);
        if (stillThere) {
          setSelectedPage(stillThere);
          setPageName(stillThere.page_name ?? '');
          setPageHindiName((stillThere as any).name_in_hindi ?? '');

          const catRes = await apiClient.get(`/master/form-builder/pages/${stillThere.id}/categories`);
          setPageCategories(catRes.data ?? []);
          return;
        }
      }

      setSelectedPage(null);
      setPageCategories([]);
      setPageName('');
      setPageHindiName('');
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to load pages.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId, formTypeId]);

  async function addPage() {
    setLoading(true);
    try {
      await apiClient.post(`/master/form-builder/services/${serviceId}/forms/${formTypeId}/pages`, {
        pageName: undefined,
        nameInHindi: undefined,
        formCode: null,
        tenantId: resolvedTenantId,
        projectId: resolvedProjectId,
        roleId: resolvedRoleId
      });

      toast.current?.show({ severity: 'success', summary: 'Added', detail: 'New page created.', life: 2500 });
      await loadPages(selectedPage?.id);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to add page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  async function deletePage(pageId: number) {
    const ok = window.confirm('Are you sure you want to delete this page?');
    if (!ok) return;

    setLoading(true);
    try {
      await apiClient.delete(`/master/form-builder/pages/${pageId}`);

      toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Page deleted.', life: 2500 });

      const keep = selectedPage?.id === pageId ? undefined : selectedPage?.id;
      await loadPages(keep);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to delete page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  async function selectPage(p: FbPage) {
    setSelectedPage(p);
    setPageName(p.page_name ?? '');
    setPageHindiName((p as any).name_in_hindi ?? '');

    try {
      const res = await apiClient.get(`/master/form-builder/pages/${p.id}/categories`);
      setPageCategories(res.data ?? []);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to load categories.',
        life: 3500,
      });
      setPageCategories([]);
    }
  }

  async function updatePage() {
    if (!selectedPage) return;

    setLoading(true);
    try {
      await apiClient.patch(`/master/form-builder/pages/${selectedPage.id}`, {
        pageName,
        nameInHindi: pageHindiName,
      });

      toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Page updated successfully.', life: 2500 });
      await loadPages(selectedPage.id);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to update page.',
        life: 3500,
      });
    } finally {
      setLoading(false);
    }
  }

  function updateCategoryRow(idx: number, patch: Partial<FbPageCategory>) {
    setPageCategories((prev) => prev.map((r, i) => (i === idx ? ({ ...r, ...patch } as any) : r)));
  }

  function addCategoryRow() {
    if (!selectedPage) return;
    setPageCategories((prev: any) => [
      ...prev,
      {
        id: -Date.now(),
        page_id: selectedPage.id,
        category_id: 0,
        preference: prev.length + 1,
        help_text: '',
        is_active: 'Y',
      },
    ]);
  }

  function removeCategoryRow(idx: number) {
    setPageCategories((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveCategories() {
    if (!selectedPage) return;

    setSavingCats(true);
    try {
      const payload = {
        categories: pageCategories
          .filter((c) => c.category_id && c.category_id > 0)
          .map((c) => ({
            categoryId: c.category_id,
            helpText: c.help_text ?? '',
          })),
      };

      await apiClient.put(`/master/form-builder/pages/${selectedPage.id}/categories`, payload);

      toast.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: 'Categories saved successfully.',
        life: 2500,
      });

      const res = await apiClient.get(`/master/form-builder/pages/${selectedPage.id}/categories`);
      setPageCategories(res.data ?? []);
    } catch (e: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Failed',
        detail: e?.response?.data?.message ?? 'Failed to save categories.',
        life: 3500,
      });
    } finally {
      setSavingCats(false);
    }
  }

  return (
    <Dialog
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <i className="pi pi-sitemap" style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: 700 }}>Manage Pages</span>
          <span style={{ ...ui.badge, background: '#fff', borderColor: '#dbe3ef', color: '#334155' }}>{formName}</span>
          <span style={ui.badge}>Form Type {formTypeId}</span>
        </div>
      }
      visible={open}
      onHide={onClose}
      style={{ width: 'min(1180px, 98vw)' }}
      modal
      draggable={false}
      closable={!loading && !savingCats}
    >
      <Toast ref={toast} />

      <div style={{ display: 'grid', gap: 14 }}>
        <div
          style={{
            ...ui.panel,
            background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
            borderColor: '#dbeafe',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Configure page flow and category mapping
              </div>
              <div style={ui.muted}>
                Select a page on the left, update its names, and assign the categories shown in the form.
              </div>
              {(displayTenantName || displayProjectName) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {displayTenantName && (
                    <span style={{ ...ui.badge, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                      <i className="pi pi-building" style={{ fontSize: 10 }} />
                      {displayTenantName}
                      {displayTenantCode && <span style={{ opacity: 0.7 }}>&nbsp;({displayTenantCode})</span>}
                    </span>
                  )}
                  {displayProjectName && (
                    <span style={{ ...ui.badge, background: '#fdf4ff', borderColor: '#e9d5ff', color: '#6b21a8' }}>
                      <i className="pi pi-folder" style={{ fontSize: 10 }} />
                      {displayProjectName}
                      {displayProjectCode && <span style={{ opacity: 0.7 }}>&nbsp;({displayProjectCode})</span>}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={ui.badge}>
                <i className="pi pi-file" style={{ fontSize: 11 }} />
                {pages.length} Page{pages.length === 1 ? '' : 's'}
              </span>
              <Button
                label="Add Page"
                icon="pi pi-plus"
                size="small"
                onClick={addPage}
                loading={loading}
                style={ui.btnPrimary}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <div style={{ ...ui.panel, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Pages</div>
              <span style={{ ...ui.muted, fontWeight: 600 }}>{pages.length} total</span>
            </div>
            <div style={{ ...ui.muted, marginBottom: 10 }}>
              Click a page to edit details and category rows.
            </div>

            <div style={{ display: 'grid', gap: 8, maxHeight: '60vh', overflowY: 'auto', paddingRight: 2 }}>
              {pages.map((p) => {
                const selected = selectedPage?.id === p.id;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectPage(p)}
                    onKeyDown={(e) => e.key === 'Enter' && selectPage(p)}
                    style={{
                      textAlign: 'left',
                      border: selected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      background: selected
                        ? 'linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)'
                        : '#ffffff',
                      borderRadius: 12,
                      padding: 10,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                          Page {p.preference}
                        </div>
                        <div style={{ ...ui.muted, color: '#475569' }}>
                          {p.page_name || 'Untitled page'}
                        </div>
                      </div>

                      <Button
                        icon="pi pi-trash"
                        rounded
                        text
                        severity="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePage(p.id);
                        }}
                        title="Delete Page"
                        disabled={loading}
                      />
                    </div>
                  </div>
                );
              })}

              {!pages.length && (
                <div
                  style={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 12,
                    padding: 14,
                    color: '#475569',
                    background: '#fff',
                    fontSize: 13,
                  }}
                >
                  No pages yet. Click <strong>Add Page</strong> to create the first page.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {!selectedPage ? (
              <div style={ui.panel}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No page selected</div>
                <div style={ui.muted}>
                  Choose a page from the left panel to edit page details and manage category rows.
                </div>
              </div>
            ) : (
              <>
                <div style={ui.panel}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>Edit Page Details</div>
                      <div style={ui.muted}>Update page names shown in the form flow.</div>
                    </div>
                    <Button
                      label="Save Page"
                      icon="pi pi-save"
                      onClick={updatePage}
                      loading={loading}
                      style={ui.btnPrimary}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <div>
                      <label style={ui.label}>Page Name</label>
                      <InputText
                        value={pageName}
                        onChange={(e) => setPageName(e.target.value)}
                        className="w-100"
                        placeholder="Enter page name"
                      />
                    </div>

                    <div>
                      <label style={ui.label}>Page Name (Hindi)</label>
                      <InputText
                        value={pageHindiName}
                        onChange={(e) => setPageHindiName(e.target.value)}
                        className="w-100"
                        placeholder="Enter Hindi page name"
                      />
                    </div>
                  </div>
                </div>

                <div style={ui.panel}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>Categories</div>
                      <div style={ui.muted}>
                        Add rows, pick categories, and optionally provide help text for each row.
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        label="Add Row"
                        icon="pi pi-plus"
                        size="small"
                        onClick={addCategoryRow}
                        style={ui.btnSecondary}
                      />
                      <Button
                        label="Save Categories"
                        icon="pi pi-check"
                        size="small"
                        onClick={saveCategories}
                        loading={savingCats}
                        style={ui.btnPrimary}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    {pageCategories.map((c: any, idx) => (
                      <div
                        key={c.id ?? idx}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          background: '#f8fafc',
                          padding: 10,
                          display: 'grid',
                          gridTemplateColumns: 'minmax(220px, 1.1fr) minmax(180px, 1fr) auto',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <Dropdown
                          value={c.category_id}
                          options={categoryOptions}
                          placeholder="Select Category"
                          className="w-100"
                          filter
                          showClear
                          onChange={(e) => updateCategoryRow(idx, { category_id: e.value } as any)}
                        />
                        <InputText
                          value={c.help_text ?? ''}
                          className="w-100"
                          placeholder="Help text (optional)"
                          onChange={(e) => updateCategoryRow(idx, { help_text: e.target.value } as any)}
                        />
                        <Button
                          icon="pi pi-times"
                          rounded
                          onClick={() => removeCategoryRow(idx)}
                          title="Remove row"
                          style={ui.btnDangerSoft}
                        />
                      </div>
                    ))}

                    {!pageCategories.length && (
                      <div
                        style={{
                          border: '1px dashed #cbd5e1',
                          borderRadius: 12,
                          padding: 14,
                          color: '#475569',
                          background: '#fff',
                          fontSize: 13,
                        }}
                      >
                        No categories mapped yet. Click <strong>Add Row</strong> to start.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
            Tip: Save page details and categories separately. Categories save only rows with a selected category.
          </div>
          <Button label="Close" icon="pi pi-times" onClick={onClose} style={ui.btnSecondary} />
        </div>
      </div>
    </Dialog>
  );
}
