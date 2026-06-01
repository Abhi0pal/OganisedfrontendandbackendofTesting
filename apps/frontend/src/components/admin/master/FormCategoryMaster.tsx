
'use client';
import { useMemo, useRef, useState, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import {
    useFormCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useToggleCategory,
} from '@/hooks/master/useFormCategories';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';

type Category = {
    id: number;
    uid?: string | null;
    categoryName: string;
    nameInHindi?: string | null;
    nameAlt?: string | null;
    parentId: number;
    categoryCode: string;
    isActive: boolean;
    created?: string | null;
    modified?: string | null;
    createdAt: string;
    updatedAt: string;
    tenantId?: number | null;
    projectId?: number | null;
    tenant?: { id: number; name: string; tenant_ID?: string | null } | null;
    project?: { id: number; name: string; project_ID?: string | null; code: string } | null;
};

export const FormCategoryMaster = () => {
    const { data: categories = [], isLoading } = useFormCategories();
    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();
    const deleteMutation = useDeleteCategory();
    const toggleMutation = useToggleCategory();
    const { data: tenants = [] } = useTenants();

    const toastRef = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isRoot, setIsRoot] = useState(true);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        categoryName: '',
        nameInHindi: '',
        nameAlt: '',
        parentId: '0',
        isActive: true,
        tenantId: null as number | null,
        projectId: null as number | null,
    });

    const { data: tenantProjects = [] } = useTenantProjects(selectedTenantId);

    // 👇 anchor for Dropdown panel so it stays inside dialog
    const dialogContentRef = useRef<HTMLDivElement | null>(null);

    const tenantOptions = useMemo(
        () => tenants.map((t: any) => ({ label: t.name, value: t.id })),
        [tenants]
    );

    const projectOptions = useMemo(
        () => tenantProjects.map((p: any) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
        [tenantProjects]
    );

    const rootCategories = useMemo(
        () => (categories || []).filter((c: Category) => c.parentId === 0),
        [categories]
    );

    const rootCategoryOptions = useMemo(
        () =>
            rootCategories.map((c: Category) => ({
                label: `${c.categoryCode} — ${c.categoryName}`,
                value: c.id,
            })),
        [rootCategories]
    );

    const tableConfig: ReusableDataTableConfig<Category> = useMemo(
        () => ({
            columns: [
                { field: 'id', header: 'ID', width: '5%', filterType: 'number' },
                {
                    field: 'tenant',
                    header: 'Tenant Name',
                    width: '13%',
                    filterType: 'text',
                    body: (row) => row.tenant ? <span>{row.tenant.name}</span> : <span className="text-muted">—</span>,
                },
                {
                    field: 'tenantId',
                    header: 'Tenant Code',
                    width: '9%',
                    filterType: 'text',
                    body: (row) => row.tenant?.tenant_ID ? <span>{row.tenant.tenant_ID}</span> : <span className="text-muted">—</span>,
                },
                {
                    field: 'project',
                    header: 'Project Name',
                    width: '13%',
                    filterType: 'text',
                    body: (row) => row.project ? <span>{row.project.name}</span> : <span className="text-muted">—</span>,
                },
                {
                    field: 'projectId',
                    header: 'Project Code',
                    width: '9%',
                    filterType: 'text',
                    body: (row) => row.project ? <span>{row.project.project_ID || row.project.code}</span> : <span className="text-muted">—</span>,
                },
                { field: 'categoryCode', header: 'Code', width: '10%', filterType: 'text' },
                { field: 'categoryName', header: 'Category Name', width: '18%', filterType: 'text' },
                { field: 'nameInHindi', header: 'Name (Hindi)', width: '14%', filterType: 'text' },
                { field: 'parentId', header: 'Parent ID', width: '7%', filterType: 'number' },
                {
                    field: 'isActive',
                    header: 'Status',
                    width: '8%',
                    filterType: 'select',
                    filterOptions: [
                        { label: 'Active', value: true },
                        { label: 'Inactive', value: false },
                    ],
                    body: (row) => (
                        <Tag value={row.isActive ? 'Active' : 'Inactive'} severity={row.isActive ? 'success' : 'danger'} />
                    ),
                },
            ],
            dataKey: 'id',
            rows: 10,
            paginator: true,
            stripedRows: true,
            showGridlines: true,
            globalFilterFields: ['categoryCode', 'categoryName', 'nameInHindi', 'nameAlt'],
            emptyMessage: 'No categories found.',
        }),
        []
    );

    const rowActions: RowAction<Category>[] = useMemo(
        () => [
            { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: (r) => handleEdit(r) },
            { icon: 'pi pi-check', label: 'Activate', severity: 'success', onClick: (r) => handleToggle(r), visible: (r) => !r.isActive },
            { icon: 'pi pi-times', label: 'Deactivate', severity: 'warn', onClick: (r) => handleToggle(r), visible: (r) => r.isActive },
            { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: (r) => handleDelete(r) },
        ],
        []
    );

    const handleEdit = useCallback((r: Category) => {
        setIsRoot(r.parentId === 0);
        const tId = (r as any).tenantId ?? null;
        setSelectedTenantId(tId);
        setFormData({
            categoryName: r.categoryName || '',
            nameInHindi: r.nameInHindi || '',
            nameAlt: r.nameAlt || '',
            parentId: String(r.parentId),
            isActive: r.isActive,
            tenantId: tId,
            projectId: (r as any).projectId ?? null,
        });
        setEditingId(r.id);
        setShowDialog(true);
    }, []);

    const handleToggle = useCallback(
        async (r: Category) => {
            try {
                await toggleMutation.mutateAsync(r.id);
                toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Status updated' });
            } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message || 'Failed to update status';
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
            }
        },
        [toggleMutation]
    );

    const handleDelete = useCallback(
        async (r: Category) => {
            if (!confirm(`Delete ${r.categoryCode} - ${r.categoryName}?`)) return;
            try {
                await deleteMutation.mutateAsync(r.id);
                toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Category deleted' });
            } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message || 'Failed to delete';
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
            }
        },
        [deleteMutation]
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            const payload = {
                categoryName: formData.categoryName.trim(),
                nameInHindi: formData.nameInHindi?.trim() || undefined,
                nameAlt: formData.nameAlt?.trim() || undefined,
                parentId: isRoot ? 0 : Number(formData.parentId),
                isActive: formData.isActive,
                tenantId: formData.tenantId ?? undefined,
                projectId: formData.projectId ?? undefined,
            };

            try {
                if (editingId) {
                    await updateMutation.mutateAsync({ id: editingId, data: payload });
                    toastRef.current?.show({ severity: 'success', summary: 'Updated', detail: 'Category updated' });
                } else {
                    await createMutation.mutateAsync(payload);
                    toastRef.current?.show({ severity: 'success', summary: 'Created', detail: 'Category created' });
                }
                setShowDialog(false);
                setEditingId(null);
                setIsRoot(true);
                setSelectedTenantId(null);
                setFormData({ categoryName: '', nameInHindi: '', nameAlt: '', parentId: '0', isActive: true, tenantId: null, projectId: null });
            } catch (e: any) {
                const msg = e?.response?.data?.message || e?.message || 'Failed to save';
                toastRef.current?.show({ severity: 'error', summary: 'Error', detail: msg });
            }
        },
        [editingId, formData, isRoot, createMutation, updateMutation]
    );

    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <div className="mb-4 d-flex align-items-center justify-content-between page-header">
                <h1 className="h2 mb-3">Form Category Master</h1>
                <Toolbar
                    left={() => (
                        <Button
                            label="Add Category"
                            icon="pi pi-plus"
                            severity="success"
                            onClick={() => {
                                setIsRoot(true);
                                setSelectedTenantId(null);
                                setFormData({ categoryName: '', nameInHindi: '', nameAlt: '', parentId: '0', isActive: true, tenantId: null, projectId: null });
                                setEditingId(null);
                                setShowDialog(true);
                            }}
                        />
                    )}
                />
            </div>

            <Dialog
                visible={showDialog}
                onHide={() => setShowDialog(false)}
                header={editingId ? 'Edit Category' : 'Add New Category'}
                modal
                style={{ width: '50vw' }}
            >
                {/* 👇 anchor element for panel */}
                <div ref={dialogContentRef}>
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Tenant</label>
                                <Dropdown
                                    value={formData.tenantId}
                                    options={tenantOptions}
                                    onChange={(e) => {
                                        setSelectedTenantId(e.value ?? null);
                                        setFormData((p) => ({ ...p, tenantId: e.value ?? null, projectId: null }));
                                    }}
                                    placeholder="Select Tenant"
                                    className="w-100"
                                    filter
                                    showClear
                                    appendTo="self"
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Project</label>
                                <Dropdown
                                    value={formData.projectId}
                                    options={projectOptions}
                                    onChange={(e) => setFormData((p) => ({ ...p, projectId: e.value ?? null }))}
                                    placeholder={formData.tenantId ? 'Select Project' : 'Select Tenant first'}
                                    className="w-100"
                                    filter
                                    showClear
                                    appendTo="self"
                                    disabled={!formData.tenantId}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Category Name *</label>
                                <InputText
                                    value={formData.categoryName}
                                    onChange={(e) => setFormData((p) => ({ ...p, categoryName: (e.target as HTMLInputElement).value }))}
                                    required
                                    className="w-100"
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Name (Hindi)</label>
                                <InputText
                                    value={formData.nameInHindi}
                                    onChange={(e) => setFormData((p) => ({ ...p, nameInHindi: (e.target as HTMLInputElement).value }))}
                                    className="w-100"
                                />
                            </div>

                            {/* Is Root Toggle */}
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Is Root Section?</label>
                                <div className="form-check">
                                    <input
                                        id="isRoot"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={isRoot}
                                        onChange={(e) => {
                                            const checked = (e.target as HTMLInputElement).checked;
                                            setIsRoot(checked);
                                            setFormData((p) => ({ ...p, parentId: checked ? '0' : '' }));
                                        }}
                                    />
                                    <label className="form-check-label" htmlFor="isRoot">Yes</label>
                                </div>
                            </div>

                            {/* Parent (Root) Dropdown */}
                            {!isRoot && (
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Parent (Root)</label>

                                    <Dropdown
                                        value={formData.parentId ? Number(formData.parentId) : null}
                                        options={rootCategoryOptions}
                                        onChange={(e) => setFormData((p) => ({ ...p, parentId: String(e.value) }))}
                                        placeholder="Select Parent Category"
                                        className="w-100"
                                        filter
                                        showClear
                                        appendTo="self"
                                        panelClassName="pcat-panel"
                                        panelStyle={{ maxWidth: '100%', maxHeight: '40vh', overflowY: 'auto' }}
                                        valueTemplate={(opt, props) =>
                                            opt ? (
                                                <span className="text-truncate" title={opt.label} style={{ maxWidth: '100%' }}>
                                                    {opt.label}
                                                </span>
                                            ) : (
                                                <span className="text-muted">{props.placeholder}</span>
                                            )
                                        }
                                    />

                                </div>
                            )}

                            <div className="col-md-6 mb-3">
                                <label className="form-label">Active</label>
                                <div className="form-check">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData((p) => ({ ...p, isActive: (e.target as HTMLInputElement).checked }))}
                                    />
                                    <label className="form-check-label" htmlFor="isActive">Active</label>
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <Button
                                label={editingId ? 'Update' : 'Create'}
                                icon="pi pi-check"
                                type="submit"
                                loading={createMutation.isPending || updateMutation.isPending}
                                className="flex-grow-1"
                            />
                            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
                        </div>
                    </form>
                </div>
            </Dialog>

            <ReusableDataTable<Category> data={categories} config={tableConfig} loading={isLoading} rowActions={rowActions} />

            {/* ✅ file-scoped styles for the dropdown panel */}

            <style jsx>{`
                :global(.pcat-panel) {
                    max-width: 100%;
                    min-width: 100%;
                    width: auto;
                    box-sizing: border-box;
                }
                :global(.pcat-panel .p-dropdown-items .p-dropdown-item) {
                    white-space: normal;
                    word-break: break-word;
                    line-height: 1.3;
                }
                :global(.pcat-panel .p-dropdown-filter-container) {
                    max-width: 100%;
                    box-sizing: border-box;
                }
                `}
            </style>

        </div>
    );
};
