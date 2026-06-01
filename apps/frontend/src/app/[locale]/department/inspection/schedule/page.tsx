'use client';
// Recompile check

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    useCISDistricts,
    useCISDepartments,
    useCISUnits,
    useCISInspectors,
    useScheduleInspection,
    CISUnit
} from '@/hooks/useInspections';
import InspectionScheduleCalendar from '@/components/inspections/InspectionScheduleCalendar';
import AutoAssignmentDisplay from './AutoAssignmentDisplay';
import { useAuth } from '@/hooks/useAuth';

export default function ScheduleInspectionPage() {
    const router = useRouter();
    const { user } = useAuth();
    const userDeptId = user?.deptId;

    const [step, setStep] = useState(1);
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
    const [unitDetailsOpen, setUnitDetailsOpen] = useState(false);

    const [formData, setFormData] = useState({
        unitId: 0,
        inspectionType: 'SINGLE' as 'SINGLE' | 'JOINT', // default SINGLE, updated by effect if CIS_USER
        selectedDepartments: [] as number[],
        assignmentMode: 'AUTO', // 'AUTO' or 'MANUAL'
        manualInspectors: {} as Record<number, string>, // deptId -> inspectorId
        jointInspectorType: 'DEPARTMENT' as 'DEPARTMENT' | 'THIRD_PARTY', // For joint inspection
        singleDeptId: 0,
        singleInspectorId: '',
        singleInspectorType: 'DEPARTMENT' as 'DEPARTMENT' | 'THIRD_PARTY',
        scheduledDate: '',
        comments: '',
    });

    const [autoInspectors, setAutoInspectors] = useState<Record<number, string>>({});

    useEffect(() => {
        if (userDeptId) {
            setFormData(prev => ({
                ...prev,
                singleDeptId: prev.singleDeptId || userDeptId,
                selectedDepartments: prev.selectedDepartments.includes(userDeptId)
                    ? prev.selectedDepartments
                    : [...prev.selectedDepartments, userDeptId]
            }));
        }
        if (user?.userType === 'CIS_USER') {
            setFormData(prev => ({ ...prev, inspectionType: 'JOINT' }));
        }
    }, [userDeptId, user?.userType]);

    // Fetch dynamic data
    const { data: districts = [], isLoading: loadingDistricts } = useCISDistricts();
    const { data: departments = [], isLoading: loadingDepts } = useCISDepartments();
    const { data: units = [], isLoading: loadingUnits } = useCISUnits(selectedDistrictId || undefined);

    // Fetch inspectors for selected department (single mode)
    const { data: singleDeptInspectors = [] } = useCISInspectors(formData.singleDeptId, formData.singleInspectorType, selectedDistrictId || undefined);

    // Schedule mutation
    const scheduleInspection = useScheduleInspection();

    // Get selected unit details
    const selectedUnit = useMemo(() => {
        return units.find(u => u.id === formData.unitId);
    }, [units, formData.unitId]);

    const toggleDept = (deptId: number) => {
        setFormData(prev => {
            const current = prev.selectedDepartments;
            const updated = current.includes(deptId)
                ? current.filter(id => id !== deptId)
                : [...current, deptId];
            return { ...prev, selectedDepartments: updated };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const departmentIds = formData.inspectionType === 'JOINT'
                ? formData.selectedDepartments
                : [formData.singleDeptId];

            if (formData.assignmentMode === 'AUTO') {
                console.log('Submitting Auto Assignment with inspectors:', autoInspectors);
            }

            const inspectorAssignments = formData.assignmentMode === 'MANUAL'
                ? (formData.inspectionType === 'JOINT'
                    ? formData.manualInspectors
                    : { [formData.singleDeptId]: formData.singleInspectorId })
                : autoInspectors;

            await scheduleInspection.mutateAsync({
                unitId: formData.unitId,
                inspectionType: formData.inspectionType,
                departmentIds,
                inspectorAssignments,
                scheduledDate: formData.scheduledDate,
                comments: formData.comments,
            });

            alert('Inspection Scheduled Successfully!');
            router.push('/department/inspection');
        } catch (error) {
            console.error('Failed to schedule inspection:', error);
            alert('Failed to schedule inspection. Please try again.');
        }
    };

    const canProceedStep1 = formData.unitId > 0;
    const canProceedStep2 = formData.inspectionType === 'SINGLE'
        ? formData.singleDeptId > 0
        : formData.selectedDepartments.length > 0;
    const canSubmit = formData.scheduledDate !== '' && (
        formData.assignmentMode === 'MANUAL'
            ? true
            : Object.keys(autoInspectors).length === (formData.inspectionType === 'SINGLE' ? 1 : formData.selectedDepartments.length)
    );

    // Department icons and colors
    const getDeptStyle = (deptName: string) => {
        const styles: Record<string, { icon: string; color: string }> = {
            'Labour': { icon: 'bi-people-fill', color: '#6366f1' },
            'PCB': { icon: 'bi-cloud-haze2-fill', color: '#10b981' },
            'Factory': { icon: 'bi-gear-wide-connected', color: '#f59e0b' },
            'Fire': { icon: 'bi-fire', color: '#ef4444' },
        };
        const abbr = deptName.split(' ')[0];
        return styles[abbr] || { icon: 'bi-building', color: '#6366f1' };
    };

    return (
        <div className="container-fluid" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4 pt-3">
                <Link href="/department/inspection" className="btn btn-light me-3" style={{ borderRadius: '12px', padding: '10px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <i className="bi bi-arrow-left"></i>
                </Link>
                <div>
                    <h4 className="fw-bold mb-0" style={{ color: '#1e293b', letterSpacing: '-0.5px' }}>Schedule New Inspection</h4>
                    <p className="text-muted mb-0 small">Complete the form below to schedule an inspection</p>
                </div>
            </div>

            <div className="d-flex">
                {/* Modern Progress Steps */}
                <div className="d-flex justify-content-center mb-5 me-4">
                    <div className="flex flex-col items-start gap-0 py-4" style={{ background: '#ffefef', padding: '12px 24px', borderRadius: '12px' }}>
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="d-flex align-items-center mb-5 position-relative">
                                <div
                                    className="d-flex align-items-center justify-content-center fw-bold"
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        flexShrink:0,
                                        background: step > s ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : step === s ? '#e9090c' : '#ffefef',
                                        color: step >= s ? 'white' : '#535353',
                                        transition: 'all 0.3s ease',
                                        boxShadow: 'none',
                                        border: step === s ? '2px solid #e9090c' : '2px solid #535353'
                                    }}
                                >
                                    {step > s ? <i className="bi bi-check-lg"></i> : s}
                                </div>
                                <span className={`mx-3 small text-nowrap ${step >= s ? 'fw-semibold' : ''}`} style={{ color: step >= s ? '#e9090c' : '#4d525c' }}>
                                    {s === 1 ? 'Select Unit' : s === 2 ? 'Configure' : 'Schedule'}
                                </span>
                                {s < 3 && (
                                    <div className='position-absolute' style={{
                                        width: 2,
                                        height: 39,
                                        left:18,
                                        top: 46,
                                        background: step > s ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : '#d3b3b3',
                                        borderRadius: '2px',
                                        transition: 'all 0.3s ease'
                                    }}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-full pb-5">
                    <div className="card border-1" style={{ borderRadius: '12px'}}>
                        <div className="card-body p-4 p-lg-5">
                            <form onSubmit={handleSubmit}>

                                {/* Step 1: Select Unit */}
                                {step === 1 && (
                                    <div className="animate__animated animate__fadeIn">
                                        <h5 className="fw-bold mb-4"><i className="bi bi-building me-2 text-primary"></i>Select Industry Unit</h5>

                                        {/* District Dropdown */}
                                        <div className="mb-4">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-geo-alt me-1"></i>Select District
                                            </label>
                                            <select
                                                className="form-select form-select-lg fs-6"
                                                value={selectedDistrictId || ''}
                                                onChange={(e) => {
                                                    const distId = e.target.value ? parseInt(e.target.value) : null;
                                                    setSelectedDistrictId(distId);
                                                    setFormData({ ...formData, unitId: 0 });
                                                }}
                                                disabled={loadingDistricts}
                                            >
                                                <option value="">-- Choose District --</option>
                                                {districts.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Units Dropdown */}
                                        {selectedDistrictId && (
                                            <div className="mb-4">
                                                <label className="form-label fw-semibold">
                                                    <i className="bi bi-building me-1"></i>Select Unit
                                                    <span className="text-muted fw-normal ms-2">
                                                        ({loadingUnits ? 'Loading...' : `${units.length} available`})
                                                    </span>
                                                </label>
                                                <select
                                                    className="form-select form-select-lg fs-6"
                                                    value={formData.unitId}
                                                    onChange={(e) => setFormData({ ...formData, unitId: parseInt(e.target.value) || 0 })}
                                                    disabled={loadingUnits}
                                                >
                                                    <option value={0}>-- Choose Unit --</option>
                                                    {units.map(unit => (
                                                        <option key={unit.id} value={unit.id}>
                                                            {unit.name} • {unit.sector}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Selected Unit Preview */}
                                        {selectedUnit && (
                                            <div className="p-3 bg-opacity-10 rounded mb-4" style={{
                                                background: 'rgb(255, 239, 239)',
                                                border:'1px solid #d9bdbd'
                                                }}>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-primary text-white rounded p-2">
                                                        <i className="bi bi-building fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{selectedUnit.name}</div>
                                                        <small className="text-muted">{selectedUnit.district} • {selectedUnit.sector}</small>
                                                    </div>
                                                    <i className="bi bi-check-circle-fill text-success ms-auto fs-5"></i>
                                                </div>
                                            </div>
                                        )}

                                        {!selectedDistrictId && (
                                            <div className="text-center py-5 text-muted bg-light rounded">
                                                <i className="bi bi-arrow-up-circle fs-1 d-block mb-2"></i>
                                                Please select a district first to view available units
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-end mt-4">
                                            <button
                                                type="button"
                                                className="btn btn-primary px-4"
                                                disabled={!canProceedStep1}
                                                onClick={() => setStep(2)}
                                            >
                                                Continue <i className="bi bi-arrow-right ms-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Inspection Type & Departments */}
                                {step === 2 && (
                                    <div className="animate__animated animate__fadeIn">
                                        {/* Unit Details Accordion */}
                                        <div style={{
                                            marginBottom: '24px',
                                            borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            overflow: 'hidden',
                                            background: 'white'
                                        }}>
                                            {/* Accordion Header */}
                                            <div
                                                onClick={() => setUnitDetailsOpen(!unitDetailsOpen)}
                                                style={{
                                                    padding: '16px 20px',
                                                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <div className="d-flex align-items-center gap-3">
                                                    <div style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <i className="bi bi-building text-white fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ color: '#1e293b' }}>{selectedUnit?.name}</div>
                                                        <small className="text-muted">{selectedUnit?.district} • {selectedUnit?.sector}</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        background: '#dcfce7',
                                                        color: '#166534'
                                                    }}>
                                                        <i className="bi bi-check-circle-fill me-1"></i>Active
                                                    </span>
                                                    <i className={`bi bi-chevron-${unitDetailsOpen ? 'up' : 'down'} text-muted`}></i>
                                                </div>
                                            </div>

                                            {/* Accordion Body */}
                                            {unitDetailsOpen && (
                                                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                                                    <div className="row g-4">
                                                        {/* Contact Information */}
                                                        <div className="col-md-6">
                                                            <h6 className="fw-bold mb-3" style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                <i className="bi bi-person-lines-fill me-2"></i>Contact Information
                                                            </h6>
                                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Owner Name</span>
                                                                    <span className="fw-semibold small">Rajesh Kumar Sharma</span>
                                                                </div>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Mobile</span>
                                                                    <span className="fw-semibold small">+91 98765 43210</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted small">Email</span>
                                                                    <span className="fw-semibold small">rajesh.sharma@email.com</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Infrastructure Details */}
                                                        <div className="col-md-6">
                                                            <h6 className="fw-bold mb-3" style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                <i className="bi bi-bricks me-2"></i>Infrastructure
                                                            </h6>
                                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Land Area</span>
                                                                    <span className="fw-semibold small">5,000 sq. meters</span>
                                                                </div>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Built-up Area</span>
                                                                    <span className="fw-semibold small">2,500 sq. meters</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span className="text-muted small">No. of Buildings</span>
                                                                    <span className="fw-semibold small">3 Buildings</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Compliance Status */}
                                                        <div className="col-md-6">
                                                            <h6 className="fw-bold mb-3" style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                <i className="bi bi-shield-check me-2"></i>Compliance Status
                                                            </h6>
                                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                                                                <div className="mb-2 d-flex justify-content-between align-items-center">
                                                                    <span className="text-muted small">Fire Safety</span>
                                                                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Compliant</span>
                                                                </div>
                                                                <div className="mb-2 d-flex justify-content-between align-items-center">
                                                                    <span className="text-muted small">Environment</span>
                                                                    <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>Pending Review</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="text-muted small">Labour Laws</span>
                                                                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Compliant</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Last Inspection */}
                                                        <div className="col-md-6">
                                                            <h6 className="fw-bold mb-3" style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                <i className="bi bi-clock-history me-2"></i>Last Inspection
                                                            </h6>
                                                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Date</span>
                                                                    <span className="fw-semibold small">15 Nov 2025</span>
                                                                </div>
                                                                <div className="mb-2 d-flex justify-content-between">
                                                                    <span className="text-muted small">Type</span>
                                                                    <span className="fw-semibold small">Joint Inspection</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="text-muted small">Result</span>
                                                                    <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Approved</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Inspection Type Toggle - Modern Design */}
                                        <div className="mb-4">
                                            <h5 className="fw-bold mb-3" style={{ color: '#1e293b' }}>
                                                <i className="bi bi-diagram-3 me-2" style={{ color: '#3b82f6' }}></i>Inspection Type
                                            </h5>
                                            <div className="row g-3">
                                                {user?.userType === 'CIS_USER' && (
                                                <div className="col-6">
                                                    <div
                                                        onClick={() => setFormData({ ...formData, inspectionType: 'JOINT', selectedDepartments: [], singleDeptId: 0 })}
                                                        style={{
                                                            cursor: 'pointer',
                                                            padding: '20px',
                                                            borderRadius: '16px',
                                                            border: formData.inspectionType === 'JOINT' ? '2px solid #d9bdbd' : '2px solid #e2e8f0',
                                                            background: formData.inspectionType === 'JOINT' ? 'rgb(255, 239, 239)' : 'white',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: formData.inspectionType === 'JOINT' ? '0 4px 15px rgba(59, 130, 246, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: '12px',
                                                                background: formData.inspectionType === 'JOINT' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <i className={`bi bi-people-fill fs-5 ${formData.inspectionType === 'JOINT' ? 'text-white' : 'text-muted'}`}></i>
                                                            </div>
                                                            <div className="ms-3">
                                                                <div className="fw-bold" style={{ color: '#1e293b' }}>Joint Inspection</div>
                                                                <small className="text-muted">Multiple departments</small>
                                                            </div>
                                                            {formData.inspectionType === 'JOINT' && (
                                                                <i className="bi bi-check-circle-fill ms-auto" style={{ color: 'rgb(233, 9, 12)', fontSize: '1.25rem' }}></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                )}
                                                <div className="col-6">
                                                    <div
                                                        onClick={() => setFormData({ ...formData, inspectionType: 'SINGLE', selectedDepartments: [], singleDeptId: 0 })}
                                                        style={{
                                                            cursor: 'pointer',
                                                            padding: '20px',
                                                            borderRadius: '16px',
                                                            border: formData.inspectionType === 'SINGLE' ? '2px solid #d9bdbd' : '2px solid #e2e8f0',
                                                            background: formData.inspectionType === 'SINGLE' ? 'rgb(255, 239, 239)' : 'white',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: formData.inspectionType === 'SINGLE' ? '0 4px 15px rgba(139, 92, 246, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div style={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: '12px',
                                                                background: formData.inspectionType === 'SINGLE' ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' : '#f1f5f9',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <i className={`bi bi-person-fill fs-5 ${formData.inspectionType === 'SINGLE' ? 'text-white' : 'text-muted'}`}></i>
                                                            </div>
                                                            <div className="ms-3">
                                                                <div className="fw-bold" style={{ color: '#1e293b' }}>Single Department</div>
                                                                <small className="text-muted">One department only</small>
                                                            </div>
                                                            {formData.inspectionType === 'SINGLE' && (
                                                                <i className="bi bi-check-circle-fill ms-auto" style={{ color: 'rgb(233, 9, 12)', fontSize: '1.25rem' }}></i>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Department Selection */}
                                        {formData.inspectionType === 'JOINT' ? (
                                            <>
                                                <h6 className="fw-bold mb-3">Select Involved Departments</h6>
                                                <MultiSelectDropdown
                                                    options={departments.map(d => ({ id: d.id, label: d.abbreviation || d.name }))}
                                                    selectedIds={formData.selectedDepartments}
                                                    onChange={(ids) => setFormData({
                                                        ...formData,
                                                        selectedDepartments: userDeptId && !ids.includes(userDeptId) ? [...ids, userDeptId] : ids
                                                    })}
                                                    placeholder="Search and select departments..."
                                                    isLoading={loadingDepts}
                                                />

                                                {/* Assignment Mode */}
                                                {formData.selectedDepartments.length > 0 && (
                                                    <div style={{
                                                        padding: '24px',
                                                        borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                                                        border: '1px solid #e2e8f0',
                                                        marginBottom: '16px'
                                                    }}>
                                                        <h6 className="fw-bold mb-3" style={{ color: '#1e293b' }}>
                                                            <i className="bi bi-person-check me-2" style={{ color: '#3b82f6' }}></i>Inspector Assignment
                                                        </h6>

                                                        {/* Inspector Type Toggle for Joint Inspection */}
                                                        <div className="mb-4">
                                                            <label className="form-label fw-semibold small text-muted">Inspector Type</label>
                                                            <div className="d-flex gap-2">
                                                                <div
                                                                    onClick={() => setFormData({ ...formData, jointInspectorType: 'DEPARTMENT', manualInspectors: {} })}
                                                                    style={{
                                                                        flex: 1,
                                                                        cursor: 'pointer',
                                                                        padding: '12px 16px',
                                                                        borderRadius: '10px',
                                                                        border: formData.jointInspectorType === 'DEPARTMENT' ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                                                                        background: formData.jointInspectorType === 'DEPARTMENT' ? '#eff6ff' : 'white',
                                                                        transition: 'all 0.2s ease',
                                                                        textAlign: 'center' as const
                                                                    }}
                                                                >
                                                                    <i className={`bi bi-building me-2 ${formData.jointInspectorType === 'DEPARTMENT' ? 'text-primary' : 'text-muted'}`}></i>
                                                                    <span className={formData.jointInspectorType === 'DEPARTMENT' ? 'fw-semibold text-primary' : 'text-muted'}>Dept. Inspector</span>
                                                                </div>
                                                                <div
                                                                    onClick={() => setFormData({ ...formData, jointInspectorType: 'THIRD_PARTY', manualInspectors: {} })}
                                                                    style={{
                                                                        flex: 1,
                                                                        cursor: 'pointer',
                                                                        padding: '12px 16px',
                                                                        borderRadius: '10px',
                                                                        border: formData.jointInspectorType === 'THIRD_PARTY' ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                                                                        background: formData.jointInspectorType === 'THIRD_PARTY' ? '#fffbeb' : 'white',
                                                                        transition: 'all 0.2s ease',
                                                                        textAlign: 'center' as const
                                                                    }}
                                                                >
                                                                    <i className={`bi bi-person-badge me-2 ${formData.jointInspectorType === 'THIRD_PARTY' ? 'text-warning' : 'text-muted'}`}></i>
                                                                    <span className={formData.jointInspectorType === 'THIRD_PARTY' ? 'fw-semibold' : 'text-muted'} style={{ color: formData.jointInspectorType === 'THIRD_PARTY' ? '#f59e0b' : undefined }}>Third Party</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Assignment Mode */}
                                                        <div className="row g-3 mb-3">
                                                            <div className="col-6">
                                                                <div
                                                                    onClick={() => setFormData({ ...formData, assignmentMode: 'AUTO', manualInspectors: {} })}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        padding: '16px',
                                                                        borderRadius: '12px',
                                                                        border: formData.assignmentMode === 'AUTO' ? '2px solid #10b981' : '2px solid #e2e8f0',
                                                                        background: formData.assignmentMode === 'AUTO' ? '#ecfdf5' : 'white',
                                                                        transition: 'all 0.2s ease',
                                                                        textAlign: 'center' as const
                                                                    }}
                                                                >
                                                                    <i className={`bi bi-cpu fs-4 d-block mb-2 ${formData.assignmentMode === 'AUTO' ? 'text-success' : 'text-muted'}`}></i>
                                                                    <div className={`fw-semibold ${formData.assignmentMode === 'AUTO' ? 'text-success' : 'text-dark'}`}>Automatic</div>
                                                                    <small className="text-muted">System assigns</small>
                                                                </div>
                                                            </div>
                                                            <div className="col-6">
                                                                <div
                                                                    onClick={() => setFormData({ ...formData, assignmentMode: 'MANUAL' })}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        padding: '16px',
                                                                        borderRadius: '12px',
                                                                        border: formData.assignmentMode === 'MANUAL' ? '2px solid #8b5cf6' : '2px solid #e2e8f0',
                                                                        background: formData.assignmentMode === 'MANUAL' ? '#f5f3ff' : 'white',
                                                                        transition: 'all 0.2s ease',
                                                                        textAlign: 'center' as const
                                                                    }}
                                                                >
                                                                    <i className={`bi bi-hand-index-thumb fs-4 d-block mb-2 ${formData.assignmentMode === 'MANUAL' ? '' : 'text-muted'}`} style={{ color: formData.assignmentMode === 'MANUAL' ? '#8b5cf6' : undefined }}></i>
                                                                    <div className={`fw-semibold ${formData.assignmentMode === 'MANUAL' ? '' : 'text-dark'}`} style={{ color: formData.assignmentMode === 'MANUAL' ? '#8b5cf6' : undefined }}>Manual</div>
                                                                    <small className="text-muted">Choose yourself</small>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {formData.assignmentMode === 'MANUAL' && (
                                                            <div className="mt-3 p-3 bg-white rounded" style={{ border: '1px solid #e2e8f0' }}>
                                                                {formData.selectedDepartments.map(deptId => {
                                                                    const dept = departments.find(d => d.id === deptId);
                                                                    return (
                                                                        <ManualInspectorSelect
                                                                            key={deptId}
                                                                            departmentId={deptId}
                                                                            departmentName={dept?.abbreviation || dept?.name || ''}
                                                                            value={formData.manualInspectors[deptId] || ''}
                                                                            inspectorType={formData.jointInspectorType}
                                                                            districtId={selectedDistrictId || undefined}
                                                                            onChange={(inspectorId) => setFormData({
                                                                                ...formData,
                                                                                manualInspectors: { ...formData.manualInspectors, [deptId]: inspectorId }
                                                                            })}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Auto Assignment Display */}
                                                        {formData.assignmentMode === 'AUTO' && (
                                                            <div className="mt-3">
                                                                {formData.selectedDepartments.map(deptId => {
                                                                    const dept = departments.find(d => d.id === deptId);
                                                                    return (
                                                                        <AutoAssignmentDisplay
                                                                            key={deptId}
                                                                            departmentId={deptId}
                                                                            departmentName={dept?.abbreviation || dept?.name || ''}
                                                                            inspectorType={formData.jointInspectorType === 'DEPARTMENT' ? 'DEPARTMENT_OFFICIAL' : 'THIRD_PARTY'}
                                                                            districtId={selectedDistrictId || undefined}
                                                                            onAssign={(inspectorId) => {
                                                                                setAutoInspectors(prev => {
                                                                                    if (prev[deptId] === inspectorId) return prev;
                                                                                    return { ...prev, [deptId]: inspectorId };
                                                                                });
                                                                            }}
                                                                        />
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            </>
                                        ) : (
                                            <>
                                                <h6 className="fw-bold mb-3">Select Department & Inspector</h6>
                                                <div className="row g-3 mb-4">
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Department</label>
                                                        <select
                                                            className="form-select form-select-lg fs-6"
                                                            value={formData.singleDeptId}
                                                            onChange={(e) => setFormData({ ...formData, singleDeptId: parseInt(e.target.value) || 0, singleInspectorId: '' })}
                                                            disabled={!!userDeptId}
                                                        >
                                                            <option value={0}>-- Choose Department --</option>
                                                            {departments.map(d => (
                                                                <option key={d.id} value={d.id}>{d.abbreviation || d.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="form-label fw-semibold">Inspector Type</label>
                                                        <div className="btn-group w-100" role="group">
                                                            <input
                                                                type="radio"
                                                                className="btn-check"
                                                                name="inspectorType"
                                                                id="typeDept"
                                                                checked={formData.singleInspectorType === 'DEPARTMENT'}
                                                                onChange={() => setFormData({ ...formData, singleInspectorType: 'DEPARTMENT', singleInspectorId: '' })}
                                                            />
                                                            <label className="btn btn-outline-secondary" htmlFor="typeDept">
                                                                <i className="bi bi-building me-1"></i>Dept. Inspector
                                                            </label>
                                                            <input
                                                                type="radio"
                                                                className="btn-check"
                                                                name="inspectorType"
                                                                id="typeThirdParty"
                                                                checked={formData.singleInspectorType === 'THIRD_PARTY'}
                                                                onChange={() => setFormData({ ...formData, singleInspectorType: 'THIRD_PARTY', singleInspectorId: '' })}
                                                            />
                                                            <label className="btn btn-outline-secondary" htmlFor="typeThirdParty">
                                                                <i className="bi bi-person-badge me-1"></i>Third Party
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                {formData.singleDeptId > 0 && (
                                                    <div className="mb-4">
                                                        <label className="form-label fw-semibold">
                                                            Select {formData.singleInspectorType === 'THIRD_PARTY' ? 'Third Party' : 'Department'} Inspector
                                                        </label>
                                                        <select
                                                            className="form-select form-select-lg"
                                                            value={formData.singleInspectorId}
                                                            onChange={(e) => setFormData({ ...formData, singleInspectorId: e.target.value })}
                                                        >
                                                            <option value="">-- Choose Inspector (Optional) --</option>
                                                            {singleDeptInspectors.map(insp => (
                                                                <option key={insp.id} value={insp.id}>
                                                                    {insp.name} ({insp.activeInspections} active)
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {singleDeptInspectors.length === 0 && (
                                                            <div className="text-muted small mt-2">
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                No {formData.singleInspectorType === 'THIRD_PARTY' ? 'third party inspectors' : 'department inspectors'} available
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="d-flex justify-content-between mt-5 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                style={{
                                                    padding: '12px 24px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    background: 'white',
                                                    color: '#64748b',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <i className="bi bi-arrow-left me-2"></i>Back
                                            </button>
                                            <button
                                                type="button"
                                                disabled={!canProceedStep2}
                                                onClick={() => setStep(3)}
                                                style={{
                                                    padding: '12px 28px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: canProceedStep2 ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e2e8f0',
                                                    color: canProceedStep2 ? 'white' : '#94a3b8',
                                                    fontWeight: 600,
                                                    cursor: canProceedStep2 ? 'pointer' : 'not-allowed',
                                                    boxShadow: canProceedStep2 ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                Continue<i className="bi bi-arrow-right ms-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Schedule & Comments */}
                                {step === 3 && (
                                    <div className="animate__animated animate__fadeIn">
                                        {/* Summary Card */}
                                        <div style={{
                                            padding: '20px',
                                            borderRadius: '16px',
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                            border: '1px solid #e2e8f0',
                                            marginBottom: '24px'
                                        }}>
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: '12px',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <i className="bi bi-building text-white fs-5"></i>
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold" style={{ color: '#1e293b' }}>{selectedUnit?.name}</div>
                                                        <small className="text-muted">
                                                            {formData.inspectionType === 'JOINT'
                                                                ? `Joint Inspection • ${formData.selectedDepartments.length} Departments`
                                                                : `Single Department Inspection`}
                                                        </small>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '6px 14px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: formData.inspectionType === 'JOINT' ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                                    color: 'white'
                                                }}>
                                                    {formData.inspectionType}
                                                </span>
                                            </div>
                                        </div>

                                        <h5 className="fw-bold mb-4" style={{ color: '#1e293b' }}>
                                            <i className="bi bi-calendar-event me-2" style={{ color: '#3b82f6' }}></i>Schedule Details
                                        </h5>

                                        {/* Calendar Integration */}
                                        <div className="mb-4">
                                            <InspectionScheduleCalendar
                                                inspectorIds={
                                                    formData.inspectionType === 'SINGLE'
                                                        ? (formData.singleInspectorId ? [formData.singleInspectorId] : [])
                                                        : (formData.assignmentMode === 'AUTO'
                                                            ? Object.values(autoInspectors).filter(Boolean)
                                                            : Object.values(formData.manualInspectors).filter(Boolean))
                                                }
                                                onDateSelect={(date) => {
                                                    // Format date to YYYY-MM-DD for input[type="date"]
                                                    // Use local time to avoid timezone shifts
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    const formatted = `${year}-${month}-${day}`;
                                                    setFormData({ ...formData, scheduledDate: formatted });
                                                }}
                                                selectedDate={formData.scheduledDate ? new Date(formData.scheduledDate) : null}
                                                height={450}
                                            />
                                        </div>

                                        {!formData.scheduledDate && (
                                            <div className="mb-4">
                                                <label className="form-label fw-semibold small text-muted">Inspection Date</label>
                                                <input
                                                    type="date"
                                                    style={{
                                                        width: '100%',
                                                        padding: '14px 16px',
                                                        borderRadius: '12px',
                                                        border: '2px solid #e2e8f0',
                                                        fontSize: '1rem',
                                                        transition: 'all 0.2s ease',
                                                        outline: 'none'
                                                    }}
                                                    required
                                                    value={formData.scheduledDate}
                                                    onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="form-label fw-semibold small text-muted">
                                                <i className="bi bi-chat-left-text me-1"></i>
                                                Additional Comments <span className="fw-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 16px',
                                                    borderRadius: '12px',
                                                    border: '2px solid #e2e8f0',
                                                    fontSize: '1rem',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none',
                                                    resize: 'vertical' as const,
                                                    minHeight: '120px'
                                                }}
                                                placeholder="Add any special instructions, requirements, or notes for the inspection team..."
                                                value={formData.comments}
                                                onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                            ></textarea>
                                        </div>

                                        <div className="d-flex justify-content-between mt-5 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                                            <button
                                                type="button"
                                                onClick={() => setStep(2)}
                                                style={{
                                                    padding: '12px 24px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0',
                                                    background: 'white',
                                                    color: '#64748b',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <i className="bi bi-arrow-left me-2"></i>Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={!canSubmit || scheduleInspection.isPending}
                                                style={{
                                                    padding: '14px 32px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: (canSubmit && !scheduleInspection.isPending) ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#e2e8f0',
                                                    color: (canSubmit && !scheduleInspection.isPending) ? 'white' : '#94a3b8',
                                                    fontWeight: 600,
                                                    fontSize: '1rem',
                                                    cursor: (canSubmit && !scheduleInspection.isPending) ? 'pointer' : 'not-allowed',
                                                    boxShadow: (canSubmit && !scheduleInspection.isPending) ? '0 4px 15px rgba(16, 185, 129, 0.3)' : 'none',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {scheduleInspection.isPending ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                                        Scheduling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        Confirm & Schedule
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

// Subcomponent for manual inspector selection per department
function ManualInspectorSelect({
    departmentId,
    departmentName,
    value,
    onChange,
    inspectorType = 'DEPARTMENT',
    districtId
}: {
    departmentId: number;
    departmentName: string;
    value: string;
    onChange: (id: string) => void;
    inspectorType?: 'DEPARTMENT' | 'THIRD_PARTY';
    districtId?: number;
}) {
    const { data: inspectors = [], isLoading } = useCISInspectors(departmentId, inspectorType, districtId);

    return (
        <div className="mb-3">
            <label className="form-label small fw-semibold">{departmentName}</label>
            <select
                className="form-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isLoading}
            >
                <option value="">-- Select {inspectorType === 'THIRD_PARTY' ? 'Third Party Inspector' : 'Inspector'} --</option>
                {inspectors.map(insp => (
                    <option key={insp.id} value={insp.id}>
                        {insp.name} ({insp.activeInspections} active)
                    </option>
                ))}
            </select>
        </div>
    );
}

// Multi-select searchable dropdown component
function MultiSelectDropdown({
    options,
    selectedIds,
    onChange,
    placeholder = 'Select...',
    isLoading = false
}: {
    options: { id: number; label: string }[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    placeholder?: string;
    isLoading?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id: number) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const removeOption = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(sid => sid !== id));
    };

    const selectedLabels = selectedIds.map(id => options.find(o => o.id === id)?.label).filter(Boolean);

    return (
        <div className="position-relative mb-4" ref={dropdownRef}>
            {/* Selected tags display */}
            <div
                className="form-control d-flex flex-wrap align-items-center gap-2 cursor-pointer"
                style={{ minHeight: '48px', cursor: 'pointer' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedIds.length === 0 ? (
                    <span className="text-muted">{placeholder}</span>
                ) : (
                    selectedIds.map(id => {
                        const opt = options.find(o => o.id === id);
                        return opt ? (
                            <span key={id} className="badge bg-primary d-flex align-items-center gap-1 py-2 px-2">
                                {opt.label}
                                <i
                                    className="bi bi-x-lg"
                                    style={{ cursor: 'pointer', fontSize: '0.7rem' }}
                                    onClick={(e) => removeOption(id, e)}
                                ></i>
                            </span>
                        ) : null;
                    })
                )}
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} ms-auto text-muted`}></i>
            </div>

            {/* Dropdown panel */}
            {isOpen && (
                <div
                    className="position-absolute w-100 bg-white border rounded shadow-sm mt-1"
                    style={{ zIndex: 1050, maxHeight: '280px', overflowY: 'auto' }}
                >
                    {/* Search input */}
                    <div className="p-2 border-bottom sticky-top bg-white">
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-transparent border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0"
                                placeholder="Search departments..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    {isLoading ? (
                        <div className="p-3 text-center text-muted">
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Loading...
                        </div>
                    ) : filteredOptions.length === 0 ? (
                        <div className="p-3 text-center text-muted">
                            No departments found
                        </div>
                    ) : (
                        filteredOptions.map(opt => (
                            <div
                                key={opt.id}
                                className={`d-flex align-items-center gap-2 px-3 py-2 cursor-pointer ${selectedIds.includes(opt.id) ? 'bg-primary bg-opacity-10' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => toggleOption(opt.id)}
                            >
                                <input
                                    type="checkbox"
                                    className="form-check-input m-0"
                                    checked={selectedIds.includes(opt.id)}
                                    readOnly
                                />
                                <span className={selectedIds.includes(opt.id) ? 'fw-semibold text-primary' : ''}>
                                    {opt.label}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
