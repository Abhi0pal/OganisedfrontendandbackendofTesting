'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Sidebar } from 'primereact/sidebar';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Chip } from 'primereact/chip';
import { MultiSelect } from 'primereact/multiselect';
import { Divider } from 'primereact/divider';
import { Badge } from 'primereact/badge';
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
    isMandatory: boolean;
    isDependent: boolean;
    parentQuestionId?: number | null;
    kyaOptionId?: number | null;
    isTooltipAvailable: boolean;
    tooltipText?: string;
    showReferenceDocument: boolean;
    options: {
        id: number;
        optionLabel: string;
        serviceMappings: { serviceId: number }[];
    }[];
}

const fieldTypeOptions = [
    { label: 'Text', value: 'Text', icon: 'pi pi-align-left', color: '#3b82f6' },
    { label: 'Textarea', value: 'Textarea', icon: 'pi pi-align-justify', color: '#8b5cf6' },
    { label: 'Dropdown', value: 'Dropdown', icon: 'pi pi-chevron-down', color: '#ec4899' },
    { label: 'Radio', value: 'Radio', icon: 'pi pi-circle', color: '#f59e0b' },
    { label: 'Checkbox', value: 'Checkbox', icon: 'pi pi-check-square', color: '#10b981' },
    { label: 'Number', value: 'Number', icon: 'pi pi-hashtag', color: '#06b6d4' },
    { label: 'Date', value: 'Date', icon: 'pi pi-calendar', color: '#6366f1' },
    { label: 'File Upload', value: 'File', icon: 'pi pi-upload', color: '#ef4444' },
];

const categoryColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

export default function KyaQuestionsV2Page() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const toastRef = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedCategoryTab, setSelectedCategoryTab] = useState<number | null>(null);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

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
        optionDetails: [] as Option[],
    });

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

    const categoryOptions = categories.map((c) => ({ label: c.categoryName, value: c.id }));
    const serviceOptions = services.map((s) => ({ label: s.service_name, value: s.id }));

    const filteredQuestions = questions.filter((q) => q.categoryId === selectedCategoryTab);

    const parentQuestionOptions = useMemo(() => {
        return questions
            .filter((q) =>
                q.categoryId === formData.categoryId &&
                ['Dropdown', 'Radio', 'Checkbox'].includes(q.fieldType) &&
                q.id !== editingQuestion?.id // Exclude current question
            )
            .map((q) => ({ label: q.questionLabel, value: q.id }));
    }, [questions, formData.categoryId, editingQuestion]);

    const isOptionField = ['Dropdown', 'Radio', 'Checkbox'].includes(formData.fieldType);

    const handleAddNew = () => {
        resetForm();
        setEditingQuestion(null);
        setDrawerVisible(true);
    };

    const handleEditQuestion = (q: Question) => {
        setEditingQuestion(q);
        setFormData({
            categoryId: q.categoryId,
            fieldType: q.fieldType,
            questionLabel: q.questionLabel,
            isMandatory: q.isMandatory,
            isDependent: q.isDependent,
            isTooltipAvailable: q.isTooltipAvailable,
            showReferenceDocument: q.showReferenceDocument,
            tooltipText: q.tooltipText || '',
            parentQuestionId: q.parentQuestionId || null,
            kyaOptionId: q.kyaOptionId || null,
            optionDetails: q.options.map((o) => ({
                id: o.id,
                option_label: o.optionLabel,
                approvals: o.serviceMappings.map((s) => s.serviceId),
            })),
        });
        setDrawerVisible(true);
    };

    const handleSubmit = async () => {
        if (!formData.categoryId || !formData.fieldType || !formData.questionLabel.trim()) {
            toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please fill required fields' });
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
                setDrawerVisible(false);
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
    };

    const handleDeleteQuestion = async (id: number) => {
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
        (updated[index] as any)[field] = value;
        setFormData((prev) => ({ ...prev, optionDetails: updated }));
    };

    const removeOption = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            optionDetails: prev.optionDetails.filter((_, i) => i !== index),
        }));
    };

    const getFieldTypeColor = (fieldType: string) => {
        return fieldTypeOptions.find(f => f.value === fieldType)?.color || '#6b7280';
    };

    return (
        <div className="p-4" style={{
            minHeight: 'calc(100vh - 100px)',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
            <Toast ref={toastRef} />

            {/* Animated Header */}
            <div className="mb-4" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%)',
                    pointerEvents: 'none'
                }}></div>

                <div className="d-flex justify-content-between align-items-center position-relative">
                    <div>
                        <h2 className="h3 mb-2" style={{ color: 'white', fontWeight: 700, letterSpacing: '-0.5px' }}>
                            <i className="pi pi-sparkles me-2" style={{ fontSize: '1.5rem' }}></i>
                            Know Your Approvals
                        </h2>
                        <p className="mb-0" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem' }}>
                            Advanced Question Manager v2.0
                        </p>
                    </div>
                    <div className="d-flex gap-2">
                        <Button
                            label={previewMode ? 'Edit Mode' : 'Preview'}
                            icon={previewMode ? 'pi pi-pencil' : 'pi pi-eye'}
                            severity={previewMode ? 'secondary' : 'info'}
                            outlined
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: '2px solid rgba(255,255,255,0.3)',
                                color: 'white',
                                backdropFilter: 'blur(10px)'
                            }}
                            onClick={() => setPreviewMode(!previewMode)}
                        />
                        <Button
                            label="Add Question"
                            icon="pi pi-plus"
                            style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                border: 'none',
                                boxShadow: '0 8px 20px rgba(245, 87, 108, 0.4)',
                                fontWeight: 600
                            }}
                            onClick={handleAddNew}
                        />
                    </div>
                </div>
            </div>

            {/* Vibrant Category Tabs */}
            <div className="d-flex gap-3 mb-4 flex-wrap">
                {categories.map((cat, idx) => {
                    const isActive = selectedCategoryTab === cat.id;
                    const gradient = categoryColors[idx % categoryColors.length];

                    return (
                        <div
                            key={cat.id}
                            onClick={() => setSelectedCategoryTab(cat.id)}
                            style={{
                                background: isActive ? gradient : 'white',
                                padding: '1rem 1.5rem',
                                borderRadius: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isActive
                                    ? '0 10px 30px rgba(102, 126, 234, 0.3)'
                                    : '0 4px 10px rgba(0,0,0,0.08)',
                                transform: isActive ? 'translateY(-2px)' : 'none',
                                border: isActive ? 'none' : '2px solid #f0f0f0',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                                }
                            }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <i className="pi pi-folder" style={{
                                    color: isActive ? 'white' : '#667eea',
                                    fontSize: '1.2rem'
                                }}></i>
                                <span style={{
                                    color: isActive ? 'white' : '#2d3748',
                                    fontWeight: 600,
                                    fontSize: '0.95rem'
                                }}>
                                    {cat.categoryName}
                                </span>
                                <Badge
                                    value={String(questions.filter((q) => q.categoryId === cat.id).length)}
                                    style={{
                                        background: isActive ? 'rgba(255,255,255,0.3)' : '#667eea',
                                        color: isActive ? 'white' : 'white',
                                        minWidth: '24px',
                                        height: '24px',
                                        borderRadius: '12px'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Questions List with Modern Cards */}
            <div className="row">
                <div className="col-md-12">
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '1.5rem',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="mb-0" style={{ fontWeight: 700, color: '#2d3748' }}>
                                <i className="pi pi-list me-2" style={{ color: '#667eea' }}></i>
                                Questions ({filteredQuestions.length})
                            </h5>
                        </div>

                        {filteredQuestions.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {filteredQuestions.map((q, idx) => {
                                    const fieldColor = getFieldTypeColor(q.fieldType);

                                    return (
                                        <div
                                            key={q.id}
                                            style={{
                                                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                                borderRadius: '16px',
                                                padding: '1.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                borderLeft: `5px solid ${fieldColor}`,
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateX(8px) scale(1.01)';
                                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.15)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.06)';
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: '150px',
                                                height: '150px',
                                                background: `radial-gradient(circle, ${fieldColor}20 0%, transparent 70%)`,
                                                pointerEvents: 'none'
                                            }}></div>

                                            <div className="d-flex justify-content-between align-items-start position-relative">
                                                <div className="flex-grow-1" onClick={() => handleEditQuestion(q)}>
                                                    <div className="d-flex align-items-center gap-3 mb-3">
                                                        <div style={{
                                                            background: fieldColor,
                                                            color: 'white',
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 700,
                                                            boxShadow: `0 4px 12px ${fieldColor}40`
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <span style={{
                                                            fontWeight: 600,
                                                            fontSize: '1.1rem',
                                                            color: '#2d3748',
                                                            flex: 1
                                                        }}>
                                                            {q.questionLabel}
                                                        </span>
                                                    </div>

                                                    <div className="d-flex gap-2 flex-wrap">
                                                        <Chip
                                                            label={q.fieldType}
                                                            icon={fieldTypeOptions.find(f => f.value === q.fieldType)?.icon}
                                                            style={{
                                                                background: `${fieldColor}20`,
                                                                color: fieldColor,
                                                                border: `2px solid ${fieldColor}40`,
                                                                fontWeight: 600,
                                                                padding: '0.5rem 1rem'
                                                            }}
                                                        />
                                                        {q.isMandatory && (
                                                            <Chip
                                                                label="Required"
                                                                icon="pi pi-check-circle"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
                                                                }}
                                                            />
                                                        )}
                                                        {q.isDependent && (
                                                            <Chip
                                                                label="Dependent"
                                                                icon="pi pi-sitemap"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)'
                                                                }}
                                                            />
                                                        )}
                                                        {q.isTooltipAvailable && (
                                                            <Chip
                                                                label="Tooltip"
                                                                icon="pi pi-info-circle"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                                                                }}
                                                            />
                                                        )}
                                                        {q.options && q.options.length > 0 && (
                                                            <Chip
                                                                label={`${q.options.length} Options`}
                                                                icon="pi pi-list"
                                                                style={{
                                                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 600,
                                                                    boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="d-flex gap-2">
                                                    <Button
                                                        icon="pi pi-pencil"
                                                        rounded
                                                        style={{
                                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                            border: 'none',
                                                            width: '40px',
                                                            height: '40px',
                                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                                                        }}
                                                        onClick={() => handleEditQuestion(q)}
                                                    />
                                                    <Button
                                                        icon="pi pi-trash"
                                                        rounded
                                                        style={{
                                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                                            border: 'none',
                                                            width: '40px',
                                                            height: '40px',
                                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteQuestion(q.id);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <div style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: '4rem',
                                    marginBottom: '1rem'
                                }}>
                                    <i className="pi pi-inbox"></i>
                                </div>
                                <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                                    No questions in this category yet
                                </p>
                                <Button
                                    label="Create First Question"
                                    icon="pi pi-plus"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        padding: '0.75rem 2rem',
                                        fontWeight: 600,
                                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                                    }}
                                    onClick={handleAddNew}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Drawer */}
            <Sidebar
                visible={drawerVisible}
                position="right"
                onHide={() => setDrawerVisible(false)}
                style={{ width: '650px' }}
                className="p-sidebar-lg"
            >
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    margin: '-1.5rem -1.5rem 1.5rem -1.5rem',
                    padding: '1.5rem',
                    borderRadius: '0 0 20px 20px'
                }}>
                    <h4 className="mb-0" style={{ color: 'white', fontWeight: 700 }}>
                        <i className={`pi ${editingQuestion ? 'pi-pencil' : 'pi-plus'} me-2`}></i>
                        {editingQuestion ? 'Edit Question' : 'Create New Question'}
                    </h4>
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#2d3748' }}>Category *</label>
                    <Dropdown
                        value={formData.categoryId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.value }))}
                        options={categoryOptions}
                        placeholder="Select Category"
                        className="w-100"
                        filter
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#2d3748' }}>Field Type *</label>
                    <Dropdown
                        value={formData.fieldType}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fieldType: e.value }))}
                        options={fieldTypeOptions}
                        placeholder="Select Type"
                        className="w-100"
                        itemTemplate={(option) => (
                            <div className="d-flex align-items-center gap-2">
                                <i className={option.icon} style={{ color: option.color }}></i>
                                <span>{option.label}</span>
                            </div>
                        )}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#2d3748' }}>Question Label *</label>
                    <InputTextarea
                        value={formData.questionLabel}
                        onChange={(e) => setFormData((prev) => ({ ...prev, questionLabel: e.target.value }))}
                        placeholder="Enter your question"
                        rows={3}
                        className="w-100"
                    />
                </div>

                <Divider />

                {isOptionField && (
                    <Accordion className="mb-3">
                        <AccordionTab header={`Options (${formData.optionDetails.length})`}>
                            <Button
                                label="Add Option"
                                icon="pi pi-plus"
                                size="small"
                                outlined
                                onClick={addOption}
                                className="mb-3"
                            />
                            {formData.optionDetails.map((opt, idx) => (
                                <div key={idx} className="mb-3 p-3 border rounded" style={{ background: '#f8f9fa' }}>
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
                                        value={opt.approvals}
                                        onChange={(e) => updateOption(idx, 'approvals', e.value)}
                                        options={serviceOptions}
                                        placeholder="Select services to trigger"
                                        className="w-100"
                                        display="chip"
                                        filter
                                    />
                                </div>
                            ))}
                        </AccordionTab>
                    </Accordion>
                )}

                <Accordion className="mb-3">
                    <AccordionTab header="Question Settings">
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center gap-2">
                                <Checkbox
                                    inputId="isMandatory"
                                    checked={formData.isMandatory}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isMandatory: e.checked || false }))}
                                />
                                <label htmlFor="isMandatory">Required Field</label>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <Checkbox
                                    inputId="isDependent"
                                    checked={formData.isDependent}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isDependent: e.checked || false }))}
                                />
                                <label htmlFor="isDependent">Dependent on Another Question</label>
                            </div>

                            {formData.isDependent && (
                                <div className="ps-4">
                                    <label className="form-label">Parent Question</label>
                                    <Dropdown
                                        value={formData.parentQuestionId}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, parentQuestionId: e.value }))}
                                        options={parentQuestionOptions}
                                        placeholder={
                                            parentQuestionOptions.length === 0
                                                ? 'No parent questions available (need Dropdown/Radio/Checkbox in this category)'
                                                : 'Select parent question'
                                        }
                                        className="w-100"
                                        filter
                                        disabled={parentQuestionOptions.length === 0}
                                    />
                                    {parentQuestionOptions.length === 0 && (
                                        <small className="text-muted d-block mt-1">
                                            💡 Create a Dropdown, Radio, or Checkbox question in this category first
                                        </small>
                                    )}
                                </div>
                            )}

                            <div className="d-flex align-items-center gap-2">
                                <Checkbox
                                    inputId="isTooltipAvailable"
                                    checked={formData.isTooltipAvailable}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, isTooltipAvailable: e.checked || false }))}
                                />
                                <label htmlFor="isTooltipAvailable">Add Tooltip</label>
                            </div>

                            {formData.isTooltipAvailable && (
                                <div className="ps-4">
                                    <InputText
                                        value={formData.tooltipText}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, tooltipText: e.target.value }))}
                                        placeholder="Tooltip text"
                                        className="w-100"
                                    />
                                </div>
                            )}

                            <div className="d-flex align-items-center gap-2">
                                <Checkbox
                                    inputId="showReferenceDocument"
                                    checked={formData.showReferenceDocument}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, showReferenceDocument: e.checked || false }))}
                                />
                                <label htmlFor="showReferenceDocument">Allow Document Attachment</label>
                            </div>
                        </div>
                    </AccordionTab>
                </Accordion>

                <Divider />

                <div className="d-flex gap-2">
                    <Button
                        label={editingQuestion ? 'Update' : 'Create'}
                        icon="pi pi-check"
                        onClick={handleSubmit}
                        loading={loading}
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            flex: 1,
                            padding: '0.75rem',
                            fontWeight: 600,
                            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                        }}
                    />
                    <Button
                        label="Cancel"
                        icon="pi pi-times"
                        severity="secondary"
                        outlined
                        onClick={() => setDrawerVisible(false)}
                    />
                </div>
            </Sidebar>
        </div>
    );
}
