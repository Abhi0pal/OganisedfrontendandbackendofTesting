'use client';

import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface Category {
    id: number;
    categoryName: string;
}



export default function KyaConfigPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const toastRef = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);


    // Category form state
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [categoryName, setCategoryName] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const catRes = await fetch(`${API_URL}/kya/categories`);
            if (catRes.ok) setCategories(await catRes.json());
        } catch (err) {
            console.error('Error:', err);
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    // Category CRUD handlers
    const handleAddCategory = () => {
        setEditingCategoryId(null);
        setCategoryName('');
        setShowCategoryDialog(true);
    };

    const handleEditCategory = (cat: Category) => {
        setEditingCategoryId(cat.id);
        setCategoryName(cat.categoryName);
        setShowCategoryDialog(true);
    };

    const handleSaveCategory = async () => {
        if (!categoryName.trim()) {
            toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Category name is required' });
            return;
        }

        setLoading(true);
        try {
            const url = editingCategoryId
                ? `${API_URL}/kya/categories/${editingCategoryId}`
                : `${API_URL}/kya/categories`;
            const method = editingCategoryId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryName }),
            });

            if (res.ok) {
                toastRef.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: editingCategoryId ? 'Category updated' : 'Category created',
                });
                setShowCategoryDialog(false);
                setCategoryName('');
                setEditingCategoryId(null);
                fetchData();
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save category' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (cat: Category) => {
        if (!confirm(`Delete category "${cat.categoryName}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/kya/categories/delete/${cat.id}`, { method: 'PUT' });
            if (res.ok) {
                toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Category deleted' });
                fetchData();
            }
        } catch (err) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
    };

    const categoryActionsTemplate = (rowData: Category) => (
        <div className="d-flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                severity="info"
                onClick={() => handleEditCategory(rowData)}
                tooltip="Edit"
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                onClick={() => handleDeleteCategory(rowData)}
                tooltip="Delete"
            />
        </div>
    );

    const leftToolbarTemplate = () => (
        <Button
            label="Add Category"
            icon="pi pi-plus"
            severity="success"
            onClick={handleAddCategory}
        />
    );

    const rightToolbarTemplate = () => (
        <Button
            label="Refresh"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            onClick={fetchData}
            loading={loading}
        />
    );

    const statusBodyTemplate = () => <Tag value="Active" severity="success" />;



    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <div className="mb-4">
                <h1 className="h2 mb-3">KYA Configuration</h1>
            </div>

            <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
            <DataTable
                value={categories}
                loading={loading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                stripedRows
                showGridlines
                emptyMessage="No categories found."
            >
                <Column field="id" header="ID" style={{ width: '10%' }} />
                <Column field="categoryName" header="Category Name" style={{ width: '60%' }} />
                <Column header="Status" body={statusBodyTemplate} style={{ width: '15%' }} />
                <Column header="Actions" body={categoryActionsTemplate} style={{ width: '15%' }} />
            </DataTable>

            {/* Category Dialog */}
            <Dialog
                visible={showCategoryDialog}
                onHide={() => setShowCategoryDialog(false)}
                header={editingCategoryId ? 'Edit Category' : 'Add Category'}
                modal
                style={{ width: '400px' }}
            >
                <div className="mb-3">
                    <label className="form-label">Category Name *</label>
                    <InputText
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="w-100"
                    />
                </div>
                <div className="d-flex gap-2">
                    <Button
                        label={editingCategoryId ? 'Update' : 'Create'}
                        icon="pi pi-check"
                        onClick={handleSaveCategory}
                        loading={loading}
                        className="flex-grow-1"
                    />
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        severity="secondary"
                        onClick={() => setShowCategoryDialog(false)}
                    />
                </div>
            </Dialog>
        </div>
    );
}
