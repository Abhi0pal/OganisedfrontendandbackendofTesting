'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useServices } from '@/hooks/master/useServices';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useCreateInspectionChecklist, useUpdateInspectionChecklist } from '@/hooks/useInspections';
import { AiChecklistGeneratorModal } from './AiChecklistGeneratorModal';

interface ChecklistItem {
    title: string;
    type: string;
    isMandatory: boolean;
    description?: string;
    riskIndicator?: string;
}

interface ChecklistForm {
    serviceId: string;
    version: string;
    items: ChecklistItem[];
}

interface ExistingChecklist {
    id: number;
    serviceId: number;
    version: string;
    items: ChecklistItem[];
    service?: {
        department?: {
            id: number;
        };
    };
}

interface Props {
    onSuccess: () => void;
    editingChecklist?: ExistingChecklist | null;
}

const itemTypes = [
    { value: 'BOOLEAN', label: 'Yes/No Check', icon: 'bi-check-square' },
    { value: 'TEXT', label: 'Text Response', icon: 'bi-fonts' },
    { value: 'DOCUMENT', label: 'Document Upload', icon: 'bi-file-earmark-arrow-up' },
    { value: 'PHOTO', label: 'Photo Evidence', icon: 'bi-camera' },
    { value: 'VIDEO', label: 'Video Recording', icon: 'bi-camera-video' },
];

const riskLevels = [
    { value: 'HIGH', label: '🔴 High Risk', color: 'danger' },
    { value: 'MEDIUM', label: '🟡 Medium Risk', color: 'warning' },
    { value: 'LOW', label: '🟢 Low Risk', color: 'info' },
];

export const ChecklistBuilder = ({ onSuccess, editingChecklist }: Props) => {
    const { data: services, isLoading: isLoadingServices } = useServices({ isActive: true });
    const { data: departments = [], isLoading: isLoadingDepartments } = useDepartments();
    const createMutation = useCreateInspectionChecklist();
    const updateMutation = useUpdateInspectionChecklist();

    // Department filter for service selection
    const [selectedDepartment, setSelectedDepartment] = useState<number | 'all'>('all');
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);

    const isEditMode = !!editingChecklist;
    const mutation = isEditMode ? updateMutation : createMutation;

    const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ChecklistForm>({
        defaultValues: {
            serviceId: '',
            version: '1.0',
            items: [{ title: '', type: 'BOOLEAN', isMandatory: true, description: '', riskIndicator: 'MEDIUM' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    });

    // Filter services by selected department
    const filteredServices = useMemo(() => {
        if (!services) return [];
        if (selectedDepartment === 'all') return services;
        return services.filter((s: any) => s.department_id === selectedDepartment);
    }, [services, selectedDepartment]);

    // Handle department change
    const handleDepartmentChange = (deptId: number | 'all') => {
        setSelectedDepartment(deptId);
        // Reset service selection when department changes
        setValue('serviceId', '');
    };

    // Populate form when editing
    useEffect(() => {
        if (editingChecklist) {
            // Set department filter if available
            if (editingChecklist.service?.department?.id) {
                setSelectedDepartment(editingChecklist.service.department.id);
            }
            reset({
                serviceId: String(editingChecklist.serviceId),
                version: editingChecklist.version,
                items: editingChecklist.items.map(item => ({
                    title: item.title,
                    type: item.type || 'BOOLEAN',
                    isMandatory: item.isMandatory,
                    description: item.description || '',
                    riskIndicator: item.riskIndicator || 'MEDIUM',
                }))
            });
        }
    }, [editingChecklist, reset]);

    const onSubmit = (data: ChecklistForm) => {
        const payload = {
            serviceId: parseInt(data.serviceId),
            version: data.version,
            items: data.items.map((item, idx) => ({
                ...item,
                order: idx + 1,
            })),
        };

        if (isEditMode && editingChecklist) {
            updateMutation.mutate({ id: editingChecklist.id, data: payload }, {
                onSuccess: () => {
                    reset();
                    setSelectedDepartment('all');
                    onSuccess();
                },
                onError: (error) => {
                    console.error("Failed to update checklist", error);
                    alert('Failed to update checklist');
                }
            });
        } else {
            createMutation.mutate(payload, {
                onSuccess: () => {
                    reset();
                    setSelectedDepartment('all');
                    onSuccess();
                },
                onError: (error) => {
                    console.error("Failed to create checklist", error);
                    alert('Failed to save checklist');
                }
            });
        }
    };

    const handleAiGenerationSuccess = (aiItems: any[]) => {
        aiItems.forEach(item => {
            append({
                title: item.title,
                type: item.type,
                isMandatory: item.isMandatory,
                description: item.description,
                riskIndicator: item.riskIndicator
            });
        });
        setIsAiModalOpen(false);
    };

    if (isLoadingServices || isLoadingDepartments) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-lg overflow-hidden">
            {/* Gradient Header */}
            <div className="card-header border-0 py-4" style={{
                background: isEditMode
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="rounded-circle bg-white bg-opacity-25 p-3">
                        <i className={`bi ${isEditMode ? 'bi-pencil' : 'bi-list-check'} fs-4`}></i>
                    </div>
                    <div>
                        <h4 className="mb-0 fw-bold">
                            {isEditMode ? 'Edit Inspection Checklist' : 'Create Inspection Checklist'}
                        </h4>
                        <small className="opacity-75">
                            {isEditMode ? 'Modify existing checklist items' : 'Define inspection criteria for a service'}
                        </small>
                    </div>
                </div>
            </div>

            <div className="card-body p-4">
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Department & Service Selection */}
                    <div className="card bg-light border-0 mb-4">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">
                                <i className="bi bi-diagram-3 me-2 text-primary"></i>
                                Department & Service Mapping
                            </h6>
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-building me-2 text-primary"></i>
                                        Department
                                    </label>
                                    <select
                                        className="form-select form-select-lg"
                                        value={selectedDepartment}
                                        onChange={(e) => handleDepartmentChange(e.target.value === 'all' ? 'all' : +e.target.value)}
                                        disabled={isEditMode}
                                    >
                                        <option value="all">-- Select Department First --</option>
                                        {departments.map((dept: any) => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    <small className="text-muted">
                                        {isEditMode ? 'Department cannot be changed' : 'Filter services by department'}
                                    </small>
                                </div>
                                <div className="col-md-5">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-gear me-2 text-primary"></i>
                                        Service <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        {...register('serviceId', { required: true })}
                                        className={`form-select form-select-lg ${errors.serviceId ? 'is-invalid' : ''}`}
                                        disabled={isEditMode || selectedDepartment === 'all'}
                                    >
                                        <option value="">
                                            {selectedDepartment === 'all'
                                                ? '-- Select Department First --'
                                                : '-- Choose a Service --'}
                                        </option>
                                        {filteredServices.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.service_name}</option>
                                        ))}
                                    </select>
                                    {errors.serviceId && <div className="invalid-feedback">Please select a service</div>}
                                    {selectedDepartment !== 'all' && filteredServices.length === 0 && (
                                        <small className="text-warning">No services found for this department</small>
                                    )}
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        <i className="bi bi-tag me-2 text-primary"></i>
                                        Version
                                    </label>
                                    <input
                                        {...register('version', { required: true })}
                                        className="form-control form-control-lg"
                                        placeholder="e.g., 1.0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Checklist Items Section */}
                    <div className="border rounded-3 p-4 bg-light mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="mb-1 fw-bold">
                                    <i className="bi bi-clipboard-check me-2 text-primary"></i>
                                    Checklist Items
                                </h5>
                                <small className="text-muted">Add requirements that inspectors must verify</small>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <button 
                                    className="btn btn-outline-warning fw-bold shadow-sm"
                                    type="button"
                                    onClick={() => setIsAiModalOpen(true)}
                                >
                                    <i className="bi bi-magic me-2"></i>
                                    Auto-Generate with AI
                                </button>
                                <span className="badge bg-primary rounded-pill px-3 py-2">
                                    {fields.length} items
                                </span>
                            </div>
                        </div>

                        <div className="d-flex flex-column gap-3">
                            {fields.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="card border-0 shadow-sm"
                                    style={{ borderLeft: '4px solid #667eea !important' }}
                                >
                                    <div className="card-body py-3">
                                        <div className="row g-3">
                                            {/* Item Number & Title */}
                                            <div className="col-12">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div
                                                        className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <input
                                                        {...register(`items.${index}.title` as const, { required: true })}
                                                        placeholder="Enter requirement (e.g., Fire extinguisher installed and valid)"
                                                        className="form-control flex-grow-1"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm flex-shrink-0"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="col-12">
                                                <input
                                                    {...register(`items.${index}.description` as const)}
                                                    placeholder="Optional description or instructions for this item"
                                                    className="form-control form-control-sm bg-light"
                                                />
                                            </div>

                                            {/* Type, Risk, Mandatory */}
                                            <div className="col-md-4">
                                                <label className="form-label small text-muted">Response Type</label>
                                                <select
                                                    {...register(`items.${index}.type` as const)}
                                                    className="form-select form-select-sm"
                                                >
                                                    {itemTypes.map(t => (
                                                        <option key={t.value} value={t.value}>
                                                            {t.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label small text-muted">Risk Level</label>
                                                <select
                                                    {...register(`items.${index}.riskIndicator` as const)}
                                                    className="form-select form-select-sm"
                                                >
                                                    {riskLevels.map(r => (
                                                        <option key={r.value} value={r.value}>
                                                            {r.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4 d-flex align-items-end">
                                                <div className="form-check form-switch">
                                                    <input
                                                        type="checkbox"
                                                        {...register(`items.${index}.isMandatory` as const)}
                                                        className="form-check-input"
                                                        id={`mandatory-${index}`}
                                                        style={{ width: '3em', height: '1.5em' }}
                                                    />
                                                    <label className="form-check-label small" htmlFor={`mandatory-${index}`}>
                                                        Mandatory Item
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Item Button */}
                        <button
                            type="button"
                            className="btn btn-outline-primary w-100 mt-3 py-2"
                            onClick={() => append({ title: '', type: 'BOOLEAN', isMandatory: true, description: '', riskIndicator: 'MEDIUM' })}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Another Item
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-end gap-3">
                        <button
                            type="button"
                            className="btn btn-light btn-lg px-4"
                            onClick={() => onSuccess()}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-lg px-5 text-white"
                            style={{
                                background: isEditMode
                                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none'
                            }}
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className={`bi ${isEditMode ? 'bi-check-lg' : 'bi-check-lg'} me-2`}></i>
                                    {isEditMode ? 'Update Checklist' : 'Save Checklist'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Generator Modal */}
            {isAiModalOpen && (
                <AiChecklistGeneratorModal 
                    onClose={() => setIsAiModalOpen(false)}
                    onSuccess={handleAiGenerationSuccess}
                />
            )}
        </div>
    );
};
