'use client';

import { useRef, useState, useEffect } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Chip } from 'primereact/chip';
import { MultiSelect } from 'primereact/multiselect';
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
}

interface Question {
    id: number;
    categoryId: number;
    questionLabel: string;
    fieldType: string;
    isMandatory: boolean;
    isDependent: boolean;
    isTooltipAvailable: boolean;
    showReferenceDocument: boolean;
    options: any[];
}

const fieldTypeOptions = [
    { label: 'Text', value: 'Text' },
    { label: 'Textarea', value: 'Textarea' },
    { label: 'Dropdown', value: 'Dropdown' },
    { label: 'Radio', value: 'Radio' },
    { label: 'Checkbox', value: 'Checkbox' },
    { label: 'Number', value: 'Number' },
    { label: 'Date', value: 'Date' },
    { label: 'File Upload', value: 'File' },
];

export default function KyaQuestionsPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const toastRef = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        categoryId: null as number | null,
        fieldType: '',
        questionLabel: '',
        isMandatory: true,
        isDependent: false,
        isTooltipAvailable: false,
        showReferenceDocument: false,
        tooltipText: '',
        parentQuestionId: null as number | null,
        kyaOptionId: null as number | null,
        optionDetails: [] as any[],
    });

    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

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
            if (catRes.ok) {
                const cats = await catRes.json();
                setCategories(cats);
                if (cats.length > 0 && !selectedCategoryTab) {
                    setSelectedCategoryTab(cats[0].id);
                    setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
                }
            }
            if (qRes.ok) setQuestions(await qRes.json());
            if (svcRes.ok) setServices(await svcRes.json());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.categoryId || !formData.fieldType || !formData.questionLabel.trim()) {
            toastRef.current?.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please fill required fields',
            });
            return;
        }

        setLoading(true);
        const payload = new FormData();
        payload.append('categoryId', String(formData.categoryId));
        payload.append('questionLabel', formData.questionLabel);
        payload.append('fieldType', formData.fieldType);
        payload.append('isMandatory', String(formData.isMandatory));
        payload.append('isDependent', String(formData.isDependent));
        payload.append('isTooltipAvailable', String(formData.isTooltipAvailable));
        payload.append('showReferenceDocument', String(formData.showReferenceDocument));
        payload.append('tooltipText', formData.tooltipText);
        if (formData.parentQuestionId) payload.append('parentQuestionId', String(formData.parentQuestionId));
        if (formData.kyaOptionId) payload.append('kyaOptionId', String(formData.kyaOptionId));
        payload.append('optionDetails', JSON.stringify(formData.optionDetails));
        payload.append('userId', '1');

        try {
            const url = editingQuestion
                ? `${API_URL}/kya/questions/update/${editingQuestion.id}`
                : `${API_URL}/kya/questions`;
            const method = editingQuestion ? 'PUT' : 'POST';

            const res = await fetch(url, { method, body: payload });
            if (res.ok) {
                toastRef.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: editingQuestion ? 'Question updated' : 'Question created',
                });
                resetForm();
                fetchData();
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            categoryId: selectedCategoryTab,
            fieldType: '',
            questionLabel: '',
            isMandatory: true,
            isDependent: false,
            isTooltipAvailable: false,
            showReferenceDocument: false,
            tooltipText: '',
            parentQuestionId: null,
            kyaOptionId: null,
            optionDetails: [],
        });
        setEditingQuestion(null);
    };

    const handleEdit = (question: any) => {
        setEditingQuestion(question);
        // Transform API option format to form format
        const transformedOptions = (question.options || []).map((opt: any) => ({
            id: opt.id,  // preserve option ID so backend updates instead of re-creating
            option_label: opt.optionLabel || opt.option_label || '',
            approvals: (opt.serviceMappings || []).map((m: any) => m.serviceId),
        }));
        setFormData({
            categoryId: question.categoryId,
            fieldType: question.fieldType,
            questionLabel: question.questionLabel,
            isMandatory: question.isMandatory,
            isDependent: question.isDependent,
            isTooltipAvailable: question.isTooltipAvailable,
            showReferenceDocument: question.showReferenceDocument,
            tooltipText: question.tooltipText || '',
            parentQuestionId: question.parentQuestionId || null,
            kyaOptionId: question.kyaOptionId || null,
            optionDetails: transformedOptions,
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this question?')) return;
        try {
            const res = await fetch(`${API_URL}/kya/questions/delete/${id}/1`, { method: 'PUT' });
            if (res.ok) {
                toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Question deleted' });
                fetchData();
            }
        } catch (err) {
            toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
    };

    const addOption = () => {
        setFormData((prev) => ({
            ...prev,
            optionDetails: [...prev.optionDetails, { option_label: '', approvals: [] }],
        }));
    };

    const updateOption = (index: number, field: string, value: any) => {
        const updated = [...formData.optionDetails];
        updated[index] = { ...updated[index], [field]: value };
        setFormData((prev) => ({ ...prev, optionDetails: updated }));
    };

    const removeOption = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            optionDetails: prev.optionDetails.filter((_, i) => i !== index),
        }));
    };

    const categoryOptions = categories.map((c) => ({ label: c.categoryName, value: c.id }));
    const serviceOptions = services.map((s) => ({ label: s.service_name, value: s.id }));
    const isOptionField = ['Dropdown', 'Radio', 'Checkbox'].includes(formData.fieldType);
    const filteredQuestions = questions.filter((q) => q.categoryId === selectedCategoryTab);

    const actionsTemplate = (rowData: Question) => (
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
                onClick={() => handleDelete(rowData.id)}
                tooltip="Delete"
            />
        </div>
    );

    const fieldTypeTemplate = (rowData: Question) => (
        <Chip label={rowData.fieldType} className="text-sm" />
    );

    const statusTemplate = (rowData: Question) => (
        <Chip
            label={rowData.isMandatory ? 'Required' : 'Optional'}
            className={`text-sm ${rowData.isMandatory ? 'bg-success text-white' : 'bg-secondary text-white'}`}
        />
    );

    return (
        <div className="p-4">
            <Toast ref={toastRef} />

            <div className="mb-4">
                <h1 className="h2 mb-1">Know Your Approvals - Questions</h1>
                <p className="text-muted">Manage questions for each category</p>
            </div>

            {/* Add/Edit Question Form */}
            <Card className="mb-4">
                <h5 className="mb-3">{editingQuestion ? 'Edit Question' : 'Add Question'}</h5>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Category *</label>
                        <Dropdown
                            value={formData.categoryId}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, categoryId: e.value }));
                                setSelectedCategoryTab(e.value);
                            }}
                            options={categoryOptions}
                            placeholder="Select Category"
                            className="w-100"
                            filter
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Field Type *</label>
                        <Dropdown
                            value={formData.fieldType}
                            onChange={(e) => setFormData((prev) => ({ ...prev, fieldType: e.value }))}
                            options={fieldTypeOptions}
                            placeholder="Select Type"
                            className="w-100"
                            filter
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold">Question Label *</label>
                    <InputTextarea
                        value={formData.questionLabel}
                        onChange={(e) => setFormData((prev) => ({ ...prev, questionLabel: e.target.value }))}
                        placeholder="e.g., What is the proposed land area?"
                        rows={3}
                        className="w-100"
                    />
                </div>

                <div className="row mb-3">
                    <div className="col-md-3">
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                inputId="isMandatory"
                                checked={formData.isMandatory}
                                onChange={(e) => setFormData((prev) => ({ ...prev, isMandatory: e.checked || false }))}
                            />
                            <label htmlFor="isMandatory" className="mb-0">Is this field required?</label>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                inputId="isDependent"
                                checked={formData.isDependent}
                                onChange={(e) => setFormData((prev) => ({ ...prev, isDependent: e.checked || false }))}
                            />
                            <label htmlFor="isDependent" className="mb-0">Is dependent on another answer?</label>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                inputId="isTooltipAvailable"
                                checked={formData.isTooltipAvailable}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, isTooltipAvailable: e.checked || false }))
                                }
                            />
                            <label htmlFor="isTooltipAvailable" className="mb-0">Do you want to add tooltip?</label>
                        </div>
                    </div>

                    <div className="col-md-3">
                        <div className="d-flex align-items-center gap-2">
                            <Checkbox
                                inputId="showReferenceDocument"
                                checked={formData.showReferenceDocument}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, showReferenceDocument: e.checked || false }))
                                }
                            />
                            <label htmlFor="showReferenceDocument" className="mb-0">Is document to attach?</label>
                        </div>
                    </div>
                </div>

                {formData.isTooltipAvailable && (
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Tooltip Text</label>
                        <InputText
                            value={formData.tooltipText}
                            onChange={(e) => setFormData((prev) => ({ ...prev, tooltipText: e.target.value }))}
                            placeholder="Enter tooltip text"
                            className="w-100"
                        />
                    </div>
                )}

                {formData.isDependent && (
                    <div className="mb-3 border-start border-primary border-3 ps-3">
                        <h6 className="text-primary mb-3">Dependency Configuration</h6>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Parent Question *</label>
                                <Dropdown
                                    value={formData.parentQuestionId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, parentQuestionId: e.value }))
                                    }
                                    options={questions
                                        .filter(
                                            (q) =>
                                                q.categoryId === formData.categoryId &&
                                                ['Dropdown', 'Radio', 'Checkbox'].includes(q.fieldType) &&
                                                q.id !== editingQuestion?.id
                                        )
                                        .map((q) => ({ label: q.questionLabel, value: q.id }))}
                                    placeholder={
                                        questions.filter(
                                            (q) =>
                                                q.categoryId === formData.categoryId &&
                                                ['Dropdown', 'Radio', 'Checkbox'].includes(q.fieldType)
                                        ).length === 0
                                            ? 'No parent questions available'
                                            : 'Select parent question'
                                    }
                                    className="w-100"
                                    filter
                                    disabled={
                                        questions.filter(
                                            (q) =>
                                                q.categoryId === formData.categoryId &&
                                                ['Dropdown', 'Radio', 'Checkbox'].includes(q.fieldType)
                                        ).length === 0
                                    }
                                />
                                <small className="text-muted">
                                    Only dropdown, radio, or checkbox questions can be parents
                                </small>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">Parent Option (Trigger) *</label>
                                <Dropdown
                                    value={formData.kyaOptionId}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, kyaOptionId: e.value }))
                                    }
                                    options={
                                        formData.parentQuestionId
                                            ? questions
                                                .find((q) => q.id === formData.parentQuestionId)
                                                ?.options?.map((opt: any) => ({
                                                    label: opt.optionLabel,
                                                    value: opt.id,
                                                })) || []
                                            : []
                                    }
                                    placeholder={
                                        formData.parentQuestionId
                                            ? 'Select trigger option'
                                            : 'Select parent question first'
                                    }
                                    className="w-100"
                                    filter
                                    disabled={!formData.parentQuestionId}
                                />
                                <small className="text-muted">
                                    This question will appear when the selected option is chosen
                                </small>
                            </div>
                        </div>
                    </div>
                )}

                {isOptionField && (
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-semibold mb-0">Options</label>
                            <Button
                                label="Add Option"
                                icon="pi pi-plus"
                                size="small"
                                onClick={addOption}
                            />
                        </div>
                        {formData.optionDetails.map((opt, idx) => (
                            <div key={idx} className="border rounded p-3 mb-2 bg-light">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <strong>Option {idx + 1}</strong>
                                    <Button
                                        icon="pi pi-trash"
                                        rounded
                                        text
                                        severity="danger"
                                        size="small"
                                        onClick={() => removeOption(idx)}
                                    />
                                </div>
                                <InputText
                                    value={opt.option_label}
                                    onChange={(e) => updateOption(idx, 'option_label', e.target.value)}
                                    placeholder="Option label"
                                    className="w-100 mb-2"
                                />
                                <MultiSelect
                                    value={opt.approvals || []}
                                    onChange={(e) => updateOption(idx, 'approvals', e.value)}
                                    options={serviceOptions}
                                    placeholder="Select services to trigger"
                                    className="w-100"
                                    display="comma"
                                    filter
                                    maxSelectedLabels={2}
                                    selectedItemsLabel="{0} services selected"
                                    panelStyle={{ maxWidth: '500px', maxHeight: '300px' }}
                                    virtualScrollerOptions={{ itemSize: 40 }}
                                />
                            </div>
                        ))}
                    </div>
                )}

                <div className="d-flex gap-2">
                    <Button
                        label={editingQuestion ? 'Update Question' : 'Add Question'}
                        icon="pi pi-check"
                        onClick={handleSubmit}
                        loading={loading}
                    />
                    {editingQuestion && (
                        <Button
                            label="Cancel"
                            icon="pi pi-times"
                            severity="secondary"
                            outlined
                            onClick={resetForm}
                        />
                    )}
                </div>
            </Card>

            {/* Category Tabs */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
                {categories.map((cat) => (
                    <Button
                        key={cat.id}
                        label={`${cat.categoryName} (${questions.filter((q) => q.categoryId === cat.id).length})`}
                        severity={selectedCategoryTab === cat.id ? 'success' : 'secondary'}
                        outlined={selectedCategoryTab !== cat.id}
                        onClick={() => setSelectedCategoryTab(cat.id)}
                    />
                ))}
            </div>

            {/* Questions List */}
            <Card>
                <h5 className="mb-3">Questions ({filteredQuestions.length})</h5>
                <DataTable
                    value={filteredQuestions}
                    loading={loading}
                    paginator
                    rows={10}
                    emptyMessage="No questions found."
                    stripedRows
                >
                    <Column field="id" header="ID" style={{ width: '5%' }} />
                    <Column field="questionLabel" header="Question" style={{ width: '40%' }} />
                    <Column header="Field Type" body={fieldTypeTemplate} style={{ width: '15%' }} />
                    <Column header="Status" body={statusTemplate} style={{ width: '15%' }} />
                    <Column
                        header="Options"
                        body={(rowData) => rowData.options?.length || 0}
                        style={{ width: '10%' }}
                    />
                    <Column header="Actions" body={actionsTemplate} style={{ width: '15%' }} />
                </DataTable>
            </Card>
        </div>
    );
}
