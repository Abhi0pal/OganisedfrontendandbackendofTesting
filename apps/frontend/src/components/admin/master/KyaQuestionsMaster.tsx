'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface Category {
    id: number;
    categoryName: string;
}

interface Service {
    id: number;
    service_name: string;
    department?: { id: number; name: string };
}

interface Option {
    id?: number;
    option_label: string;
    approvals: number[];
}

interface Question {
    id: number;
    categoryId: number;
    questionLabel: string;
    fieldType: string;
    isDependent: boolean;
    parentQuestionId: number | null;
    kyaOptionId: number | null;
    isMandatory: boolean;
    isTooltipAvailable: boolean;
    tooltipText: string | null;
    options: {
        id: number;
        optionLabel: string;
        serviceMappings: { serviceId: number }[];
    }[];
}

const fieldTypeOptions = [
    { label: 'Text', value: 'Text' },
    { label: 'Textarea', value: 'Textarea' },
    { label: 'Dropdown', value: 'Dropdown' },
    { label: 'Radio', value: 'Radio' },
    { label: 'Checkbox', value: 'Checkbox' },
];

export const KyaQuestionsMaster = () => {
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    const toastRef = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    const [formData, setFormData] = useState({
        categoryId: null as number | null,
        questionLabel: '',
        fieldType: '',
        isMandatory: true,
        isDependent: false,
        parentQuestionId: null as number | null,
        kyaOptionId: null as number | null,
        isTooltipAvailable: false,
        tooltipText: '',
        optionDetails: [] as Option[],
    });

    // Fetch data on mount
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, qRes, svcRes] = await Promise.all([
                fetch(`${API_URL}/kya/categories`),
                fetch(`${API_URL}/kya/questions/fetch`),
                fetch(`${API_URL}/kya/services`),
            ]);
            if (catRes.ok) setCategories(await catRes.json());
            if (qRes.ok) setQuestions(await qRes.json());
            if (svcRes.ok) setServices(await svcRes.json());
        } catch (err) {
            console.error('Error:', err);
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    const isOptionField = ['Dropdown', 'Radio', 'Checkbox'].includes(formData.fieldType);

    const categoryOptions = useMemo(
        () => categories.map((c) => ({ label: c.categoryName, value: c.id })),
        [categories]
    );

    const serviceOptions = useMemo(
        () => services.map((s) => ({ label: s.service_name || 'N/A', value: s.id })),
        [services]
    );

    const parentQuestionOptions = useMemo(
        () => questions.map((q) => ({ label: q.questionLabel, value: q.id })),
        [questions]
    );

    const handleInputChange = useCallback((e: any) => {
        const { name, value, type, checked } = e.target || e;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    }, []);

    const addOption = () => {
        setFormData((prev) => ({
            ...prev,
            optionDetails: [...prev.optionDetails, { option_label: '', approvals: [] }],
        }));
    };

    const updateOption = (index: number, field: string, value: any) => {
        const updated = [...formData.optionDetails];
        (updated[index] as any)[field] = value;
        setFormData((prev) => ({ ...prev, optionDetails: updated }));
    };

    const removeOption = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            optionDetails: prev.optionDetails.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = new FormData();
        payload.append('categoryId', String(formData.categoryId));
        payload.append('questionLabel', formData.questionLabel);
        payload.append('fieldType', formData.fieldType);
        payload.append('isMandatory', String(formData.isMandatory));
        payload.append('isDependent', String(formData.isDependent));
        payload.append('isTooltipAvailable', String(formData.isTooltipAvailable));
        payload.append('tooltipText', formData.tooltipText);
        if (formData.parentQuestionId) payload.append('parentQuestionId', String(formData.parentQuestionId));
        if (formData.kyaOptionId) payload.append('kyaOptionId', String(formData.kyaOptionId));
        payload.append('optionDetails', JSON.stringify(formData.optionDetails));
        payload.append('userId', '1');

        try {
            const url = editingId
                ? `${API_URL}/kya/questions/update/${editingId}`
                : `${API_URL}/kya/questions`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: payload });
            if (res.ok) {
                toastRef.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: editingId ? 'Question updated successfully' : 'Question created successfully',
                });
                resetForm();
                setShowDialog(false);
                fetchData();
            } else {
                const err = await res.json();
                throw new Error(err.message || 'Failed');
            }
        } catch (err: any) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: err.message });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            categoryId: null,
            questionLabel: '',
            fieldType: '',
            isMandatory: true,
            isDependent: false,
            parentQuestionId: null,
            kyaOptionId: null,
            isTooltipAvailable: false,
            tooltipText: '',
            optionDetails: [],
        });
        setEditingId(null);
    };

    const handleEdit = (question: Question) => {
        setFormData({
            categoryId: question.categoryId,
            questionLabel: question.questionLabel,
            fieldType: question.fieldType.trim(),
            isMandatory: question.isMandatory,
            isDependent: question.isDependent,
            parentQuestionId: question.parentQuestionId,
            kyaOptionId: question.kyaOptionId,
            isTooltipAvailable: question.isTooltipAvailable,
            tooltipText: question.tooltipText || '',
            optionDetails: question.options.map((o) => ({
                id: o.id,
                option_label: o.optionLabel,
                approvals: o.serviceMappings.map((s) => s.serviceId),
            })),
        });
        setEditingId(question.id);
        setShowDialog(true);
    };

    const handleDelete = async (question: Question) => {
        if (!confirm(`Are you sure you want to delete "${question.questionLabel}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/kya/questions/delete/${question.id}/1`, { method: 'PUT' });
            if (res.ok) {
                toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Question deleted' });
                fetchData();
            }
        } catch (err) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
    };

    const leftToolbarTemplate = () => (
        <Button
            label="Add Question"
            icon="pi pi-plus"
            severity="success"
            onClick={() => {
                resetForm();
                setShowDialog(true);
            }}
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

    const actionBodyTemplate = (rowData: Question) => (
        <div className="d-flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                outlined
                severity="info"
                onClick={() => handleEdit(rowData)}
                tooltip="Edit"
            />
            <Button
                icon="pi pi-trash"
                rounded
                outlined
                severity="danger"
                onClick={() => handleDelete(rowData)}
                tooltip="Delete"
            />
        </div>
    );

    const statusBodyTemplate = (rowData: Question) => (
        <Tag value={rowData.isMandatory ? 'Required' : 'Optional'} severity={rowData.isMandatory ? 'success' : 'secondary'} />
    );

    const categoryBodyTemplate = (rowData: Question) => {
        const cat = categories.find((c) => c.id === rowData.categoryId);
        return <span>{cat?.categoryName || 'N/A'}</span>;
    };

    return (
        <div className="p-4">
            <Toast ref={toastRef} />
            <div className="mb-4">
                <h1 className="h2 mb-3">KYA Questions Master</h1>
                <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
            </div>

            <Dialog
                visible={showDialog}
                onHide={() => {
                    resetForm();
                    setShowDialog(false);
                }}
                header={editingId ? 'Edit Question' : 'Add New Question'}
                modal
                style={{ width: '60vw' }}
                breakpoints={{ '960px': '80vw', '640px': '95vw' }}
            >
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Category *</label>
                            <Dropdown
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.value }))}
                                options={categoryOptions}
                                placeholder="Select Category"
                                className="w-100"
                                filter
                            />
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label">Field Type *</label>
                            <Dropdown
                                name="fieldType"
                                value={formData.fieldType}
                                onChange={(e) => setFormData((prev) => ({ ...prev, fieldType: e.value }))}
                                options={fieldTypeOptions}
                                placeholder="Select Type"
                                className="w-100"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Question Label *</label>
                        <InputText
                            name="questionLabel"
                            value={formData.questionLabel}
                            onChange={handleInputChange}
                            placeholder="Enter question"
                            className="w-100"
                            required
                        />
                    </div>

                    {/* Options for Dropdown/Radio/Checkbox */}
                    {isOptionField && (
                        <div className="mb-3 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <strong>Options</strong>
                                <Button type="button" icon="pi pi-plus" label="Add Option" size="small" onClick={addOption} />
                            </div>
                            {formData.optionDetails.map((opt, idx) => (
                                <div key={idx} className="row mb-2 align-items-center">
                                    <div className="col-md-5">
                                        <InputText
                                            value={opt.option_label}
                                            onChange={(e) => updateOption(idx, 'option_label', e.target.value)}
                                            placeholder="Option label"
                                            className="w-100"
                                        />
                                    </div>
                                    <div className="col-md-5">
                                        <Dropdown
                                            value={opt.approvals}
                                            onChange={(e) => updateOption(idx, 'approvals', e.value)}
                                            options={serviceOptions}
                                            placeholder="Select Services"
                                            className="w-100"
                                            multiple
                                            filter
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <Button
                                            type="button"
                                            icon="pi pi-trash"
                                            severity="danger"
                                            outlined
                                            onClick={() => removeOption(idx)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Checkboxes */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <div className="form-check">
                                <Checkbox
                                    inputId="isMandatory"
                                    checked={formData.isMandatory}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isMandatory: e.checked || false }))}
                                />
                                <label htmlFor="isMandatory" className="form-check-label ms-2">Required</label>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-check">
                                <Checkbox
                                    inputId="isDependent"
                                    checked={formData.isDependent}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isDependent: e.checked || false }))}
                                />
                                <label htmlFor="isDependent" className="form-check-label ms-2">Dependent</label>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-check">
                                <Checkbox
                                    inputId="isTooltipAvailable"
                                    checked={formData.isTooltipAvailable}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isTooltipAvailable: e.checked || false }))}
                                />
                                <label htmlFor="isTooltipAvailable" className="form-check-label ms-2">Show Tooltip</label>
                            </div>
                        </div>
                    </div>

                    {formData.isTooltipAvailable && (
                        <div className="mb-3">
                            <label className="form-label">Tooltip Text</label>
                            <InputTextarea
                                name="tooltipText"
                                value={formData.tooltipText}
                                onChange={handleInputChange}
                                rows={2}
                                className="w-100"
                            />
                        </div>
                    )}

                    {formData.isDependent && (
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">Parent Question</label>
                                <Dropdown
                                    value={formData.parentQuestionId}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, parentQuestionId: e.value }))}
                                    options={parentQuestionOptions}
                                    placeholder="Select Parent"
                                    className="w-100"
                                    filter
                                />
                            </div>
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <Button
                            label={editingId ? 'Update' : 'Create'}
                            icon="pi pi-check"
                            type="submit"
                            loading={loading}
                            className="flex-grow-1"
                        />
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            severity="secondary"
                            type="button"
                            onClick={() => {
                                resetForm();
                                setShowDialog(false);
                            }}
                        />
                    </div>
                </form>
            </Dialog>

            <DataTable
                value={questions}
                loading={loading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                stripedRows
                showGridlines
                emptyMessage="No questions found."
            >
                <Column field="id" header="ID" style={{ width: '5%' }} />
                <Column header="Category" body={categoryBodyTemplate} style={{ width: '15%' }} />
                <Column field="questionLabel" header="Question" style={{ width: '35%' }} />
                <Column field="fieldType" header="Type" style={{ width: '10%' }} />
                <Column header="Status" body={statusBodyTemplate} style={{ width: '10%' }} />
                <Column header="Options" body={(row) => row.options?.length || 0} style={{ width: '10%' }} />
                <Column header="Actions" body={actionBodyTemplate} style={{ width: '15%' }} />
            </DataTable>
        </div>
    );
};
