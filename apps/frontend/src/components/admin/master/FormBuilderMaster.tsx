'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import apiClient from '@/lib/api-client';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { DataTableColumnConfig } from '@/components/DataTable/types';
import { useQuery } from '@tanstack/react-query';
import { useFormBuilderServices } from '@/hooks/master/useFormBuilderServices';
import { ManagePagesModal } from './formBuilder/ManagePagesModal';
import { AddFormTypeModal } from './formBuilder/AddFormTypeModal';
import { FbServiceRow } from '@/types/formBuilder';

export function FormBuilderMaster() {
  const router = useRouter();
  const locale = useLocale();
  const toast = useRef<Toast>(null);
  const prefetchedBuilderRoutes = useRef<Set<string>>(new Set());

  // Fetch ALL departments from ALL tenants — combine master_data from every DEPARTMENT definition
  // (exclude SUB_DEPARTMENT definitions)
  const { data: departments = [], isLoading: isDeptLoading } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['all-departments-formbuilder'],
    queryFn: async () => {
      const defRes = await apiClient.get('/master/definitions?search=Department&is_active=true');
      const defs: any[] = Array.isArray(defRes.data) ? defRes.data : [];
      // Keep only pure department definitions (exclude sub-department)
      const deptDefs = defs.filter((d: any) => {
        const name = (d.name ?? '').toLowerCase();
        const code = (d.code ?? '').toUpperCase();
        return name.includes('department') && !name.includes('sub') && !code.includes('SUB');
      });
      if (deptDefs.length === 0) return [];
      // Fetch master_data for each definition and combine
      const results = await Promise.all(
        deptDefs.map((def: any) =>
          apiClient.get(`/master/data/by-master/${def.id}?is_active=true&limit=1000`)
        )
      );
      const seen = new Set<number>();
      const combined: { id: number; name: string }[] = [];
      for (const res of results) {
        const records: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        for (const r of records) {
          const id = Number(r.id);
          if (!seen.has(id)) {
            seen.add(id);
            combined.push({ id, name: r.name ?? (r.data as any)?.name ?? '' });
          }
        }
      }
      return combined.filter(d => d.name);
    },
    staleTime: 5 * 60 * 1000,
  });

  const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
  const { data: rows = [], isLoading, refetch } = useFormBuilderServices(departmentId);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeService, setActiveService] = useState<{
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
  } | null>(null);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addFormService, setAddFormService] = useState<{
    serviceId: string;
    existingFormTypeIds: number[];
    existingFormCodes: string[];
  } | null>(null);

  const deptOptions = useMemo(
    () => departments.map((d) => ({ label: d.name, value: d.id })),
    [departments],
  );

  const getBuilderHref = useCallback(
    (serviceId: string, formTypeId: number) =>
      `/${locale}/admin/master/form-builder/services/${encodeURIComponent(serviceId)}/forms/${formTypeId}/builder`,
    [locale],
  );

  const prefetchBuilder = useCallback(
    (serviceId: string, formTypeId: number) => {
      const href = getBuilderHref(serviceId, formTypeId);
      if (prefetchedBuilderRoutes.current.has(href)) return;
      prefetchedBuilderRoutes.current.add(href);
      router.prefetch(href);
    },
    [getBuilderHref, router],
  );

  useEffect(() => {
    rows.slice(0, 5).forEach((row) =>
      (row.forms ?? []).slice(0, 3).forEach((f) => prefetchBuilder(row.serviceId, f.formTypeId)),
    );
  }, [rows, prefetchBuilder]);

  async function deleteFormMapping(serviceId: string, formTypeId: number, mappingId?: number) {
    if (!window.confirm('Delete this Form Type mapping?')) return;
    try {
      await apiClient.delete(`/master/form-builder/services/${serviceId}/forms/${formTypeId}`, {
        params: { mappingId }
      });
      toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Form type mapping deleted.', life: 2500 });
      await refetch();
    } catch (e: any) {
      toast.current?.show({ severity: 'error', summary: 'Failed', detail: e?.response?.data?.message ?? 'Could not delete.', life: 3500 });
    }
  }

  const leftToolbar = useCallback(() => (
    <div className="d-flex align-items-center gap-2">
      <Dropdown
        value={departmentId}
        options={deptOptions}
        onChange={(e) => setDepartmentId(e.value)}
        placeholder={isDeptLoading ? 'Loading departments...' : 'Filter by Department'}
        style={{ width: '240px' }}
        filter
        filterBy="label"
        showClear
        disabled={isDeptLoading}
      />
      <span className="text-muted small">
        {rows.length} service{rows.length !== 1 ? 's' : ''} {departmentId ? 'in selected department' : 'total'}
      </span>
    </div>
  ), [departmentId, deptOptions, rows.length]);

  const columns: DataTableColumnConfig<FbServiceRow>[] = [
    {
      field: 'serviceId',
      header: 'Service ID',
      width: '12%',
      filterType: 'text',
      body: (row) => <code className="small fw-semibold">{row.serviceId}</code>,
    },
    {
      field: 'serviceName',
      header: 'Service Name',
      width: '22%',
      filterType: 'text',
      body: (row) => <span className="fw-semibold">{row.serviceName}</span>,
    },
    {
      field: 'forms',
      header: 'Mapped Forms',
      filterType: 'none',
      body: (row) => {
        const forms = row.forms ?? [];
        const existingFormTypeIds = forms.map((f) => f.formTypeId);
        const existingFormCodes = forms
          .map((f) => f.formCode)
          .filter((c): c is string => typeof c === 'string' && c.trim().length > 0);

        return (
          <div className="d-flex flex-column gap-2 py-1">
            {/* Top action bar */}
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
              <div className="d-flex gap-2 align-items-center">
                <Tag
                  value={`${forms.length} form${forms.length !== 1 ? 's' : ''}`}
                  severity={forms.length > 0 ? 'success' : 'secondary'}
                  className="small"
                />
              </div>
              <Button
                label="Add Form Type"
                icon="pi pi-plus"
                size="small"
                severity="success"
                style={{ height: '30px', fontSize: '12px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  setAddFormService({ serviceId: row.serviceId, existingFormTypeIds, existingFormCodes });
                  setAddFormOpen(true);
                }}
              />
            </div>

            {/* Form cards */}
            {forms.length === 0 ? (
              <div className="text-muted small fst-italic">No forms mapped yet.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {forms.map((f) => (
                  <div
                    key={`${row.serviceId}-${f.formTypeId}-${f.id}`}
                    className="d-flex align-items-center justify-content-between gap-2 flex-wrap rounded px-3 py-2"
                    style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}
                  >
                    <div className="d-flex flex-column gap-1">
                      <span className="fw-semibold small">{f.formName}</span>
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="badge bg-light text-secondary border small">Type {f.formTypeId}</span>
                        <span className="badge bg-light text-secondary border small">{f.pagesCount} page{f.pagesCount !== 1 ? 's' : ''}</span>
                        {f.formCode && <span className="badge bg-light text-secondary border small">{f.formCode}</span>}
                        {f.tenant?.name && <span className="badge bg-primary-subtle text-primary border border-primary-subtle small"><i className="pi pi-building" style={{ fontSize: '10px', marginRight: '4px' }} />{f.tenant.name}</span>}
                        {f.project?.name && <span className="badge bg-info-subtle text-info border border-info-subtle small"><i className="pi pi-folder" style={{ fontSize: '10px', marginRight: '4px' }} />{f.project.name}</span>}
                        {f.role?.name && <span className="badge bg-warning-subtle text-warning border border-warning-subtle small"><i className="pi pi-users" style={{ fontSize: '10px', marginRight: '4px' }} />{f.role.name}</span>}
                      </div>
                    </div>
                    <div className="d-flex gap-1 flex-wrap">
                      <Button
                        label="Pages"
                        icon="pi pi-sitemap"
                        size="small"
                        severity="info"
                        style={{ height: '28px', fontSize: '11px', whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setActiveService({
                            serviceId: row.serviceId,
                            formTypeId: f.formTypeId,
                            formName: f.formName,
                            tenantId: f.tenantId,
                            projectId: f.projectId,
                            roleId: f.role_id,
                            tenantName: f.tenant?.name ?? row.tenantName,
                            tenantCode: f.tenant?.tenant_ID ?? row.tenantCode,
                            projectName: f.project?.name ?? row.projectName,
                            projectCode: f.project?.project_ID ?? row.projectCode,
                          });
                          setModalOpen(true);
                        }}
                      />
                      <Button
                        label="Builder"
                        icon="pi pi-pencil"
                        size="small"
                        style={{ height: '28px', fontSize: '11px', whiteSpace: 'nowrap' }}
                        onMouseEnter={() => prefetchBuilder(row.serviceId, f.formTypeId)}
                        onClick={() => {
                          const href = getBuilderHref(row.serviceId, f.formTypeId);
                          const qs = f.id ? `?mappingId=${f.id}` : '';
                          router.push(href + qs);
                        }}
                      />
                      <Button
                        icon="pi pi-trash"
                        size="small"
                        severity="danger"
                        style={{ height: '28px', width: '28px' }}
                        onClick={() => deleteFormMapping(row.serviceId, f.formTypeId, f.id)}
                        tooltip="Delete"
                        tooltipOptions={{ position: 'top' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4">
      <Toast ref={toast} />

      <div className="mb-4 d-flex align-items-center justify-content-between page-header">
        <h1 className="h2 mb-3">Map Fields with Forms</h1>
        <Toolbar left={leftToolbar} className="mb-3" />
      </div>

      <ReusableDataTable<FbServiceRow>
        data={rows}
        loading={isLoading}
        config={{
          dataKey: 'id',
          columns,
          globalFilterFields: ['serviceId', 'serviceName'],
          rows: 10,
          rowsPerPageOptions: [10, 25, 50],
          stripedRows: true,
          showGridlines: true,
          emptyMessage: departmentId
            ? 'No services found for selected department.'
            : 'No services found.',
        }}
      />

      {activeService && (
        <ManagePagesModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          serviceId={activeService.serviceId}
          formTypeId={activeService.formTypeId}
          formName={activeService.formName}
          tenantId={activeService.tenantId}
          projectId={activeService.projectId}
          roleId={activeService.roleId}
          tenantName={activeService.tenantName}
          tenantCode={activeService.tenantCode}
          projectName={activeService.projectName}
          projectCode={activeService.projectCode}
        />
      )}

      {addFormService && (
        <AddFormTypeModal
          open={addFormOpen}
          onClose={() => setAddFormOpen(false)}
          serviceId={addFormService.serviceId}
          existingFormTypeIds={addFormService.existingFormTypeIds}
          existingFormCodes={addFormService.existingFormCodes}
          onSuccess={async () => {
            toast.current?.show({ severity: 'success', summary: 'Added', detail: 'Form type mapping created.', life: 2500 });
            await refetch();
          }}
        />
      )}
    </div>
  );
}
