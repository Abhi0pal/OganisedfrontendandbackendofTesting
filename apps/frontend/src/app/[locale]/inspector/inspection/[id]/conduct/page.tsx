'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCISInspectionDetail, useSubmitReport, useGenerateObservations } from '@/hooks/useInspections';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ConductInspectionPage({ params }: { params: Promise<{ id: string, locale: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { data: inspection, isLoading } = useCISInspectionDetail(id);
    const { mutate: submitReport, isPending: isSubmitting } = useSubmitReport();
    const { mutate: generateObservations, isPending: isGenerating } = useGenerateObservations();

    const [activeTab, setActiveTab] = useState('checklist');
    const [responses, setResponses] = useState<Record<number, { response: string; remarks: string; evidenceUrls: string[] }>>({});
    const [observations, setObservations] = useState<Array<{ title: string; severity: string; evidenceUrl: string[]; aiGenerated?: boolean }>>([]);
    const [generalEvidence, setGeneralEvidence] = useState<Array<{ fileType: string; fileName: string; fileUrl: string; fileSize?: number }>>([]);
    const [finalComments, setFinalComments] = useState('');

    // Initialize state from existing data if available
    useEffect(() => {
        if (inspection?.checklist?.items) {
            const initialResponses: any = {};
            inspection.checklist.items.forEach(item => {
                if (item.response) {
                    initialResponses[item.id] = {
                        response: item.response.response,
                        remarks: item.response.remarks || '',
                        evidenceUrls: item.response.evidenceUrls || []
                    };
                } else {
                    initialResponses[item.id] = { response: '', remarks: '', evidenceUrls: [] };
                }
            });
            setResponses(initialResponses);
        }
    }, [inspection]);

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div><div className="mt-2">Loading Inspection...</div></div>;
    if (!inspection) return <div className="alert alert-danger m-4">Inspection not found</div>;

    const handleResponseChange = (itemId: number, field: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleAddObservation = () => {
        setObservations([...observations, { title: '', severity: 'MINOR', evidenceUrl: [], aiGenerated: false }]);
    };

    const handleRemoveObservation = (index: number) => {
        const newObs = [...observations];
        newObs.splice(index, 1);
        setObservations(newObs);
    };

    const handleObservationChange = (index: number, field: string, value: any) => {
        const newObs = [...observations];
        (newObs[index] as any)[field] = value;
        setObservations(newObs);
    };

    const handleGenerateAiObservations = () => {
        const allResponses = Object.entries(responses).map(([key, val]) => {
            const item = inspection?.checklist?.items.find(i => i.id === Number(key));
            return {
                checklistItemId: Number(key),
                response: val.response,
                remarks: val.remarks,
                question: item?.question || '',
            };
        }).filter(r => r.response);

        if (allResponses.length === 0) {
            toast.error('Please fill out the checklist first before generating observations.');
            return;
        }

        const nonCompliant = allResponses.filter(r => r.response === 'NON_COMPLIANT' || r.response === 'PARTIALLY_COMPLIANT');
        if (nonCompliant.length === 0) {
            toast('No non-compliant items found. All items are compliant!', { icon: '✅' });
            return;
        }

        generateObservations(
            { inspectionId: id, responses: allResponses },
            {
                onSuccess: (data) => {
                    const aiObs = data.observations.map(obs => ({
                        title: obs.observationText,
                        severity: obs.severity,
                        evidenceUrl: [] as string[],
                        aiGenerated: true,
                    }));
                    setObservations(prev => [...prev, ...aiObs]);
                    toast.success(data.message || `Generated ${aiObs.length} observation(s)`);
                },
                onError: () => {
                    toast.error('Failed to generate observations. Please try again or add manually.');
                },
            }
        );
    };

    const handleSubmit = () => {
        // Validation
        const mandatoryItems = inspection.checklist?.items.filter(i => i.isMandatory) || [];
        const missingMandatory = mandatoryItems.some(item => !responses[item.id]?.response);

        if (missingMandatory) {
            toast.error('Please complete all mandatory checklist items.');
            setActiveTab('checklist');
            return;
        }

        const payload = {
            inspectionId: id,
            responses: Object.entries(responses).map(([key, val]) => ({
                checklistItemId: Number(key),
                response: val.response,
                remarks: val.remarks,
                evidenceUrls: val.evidenceUrls
            })).filter(r => r.response), // Only send answered items
            observations: observations.filter(o => o.title),
            evidence: generalEvidence,
            startedAt: new Date().toISOString(), // Mock start time
            completedAt: new Date().toISOString(),
            comments: finalComments
        };

        submitReport(payload, {
            onSuccess: () => {
                toast.success('Inspection Report Submitted Successfully!');
                router.push('/inspector/dashboard');
            },
            onError: () => {
                toast.error('Failed to submit report. Please try again.');
            }
        });
    };

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            {/* Header / Breadcrumb */}
            <div className="mb-4 d-flex justify-content-between align-items-center">
                <div>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item"><Link href="/inspector/dashboard">Dashboard</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">{inspection.inspectionId}</li>
                        </ol>
                    </nav>
                    <h4 className="fw-bold mb-0">{inspection.unit.name} <span className="badge bg-primary fs-6 align-text-top ms-2">{inspection.inspectionType}</span></h4>
                    <p className="text-muted small mb-0">{inspection.unit.address} • {inspection.unit.sector}</p>
                </div>
                <div className="text-end">
                    <div className="fw-bold">Scheduled: {format(new Date(inspection.scheduledDate || new Date()), 'dd MMM yyyy')}</div>
                    <div className="text-muted small">ID: {inspection.inspectionId}</div>
                </div>
            </div>

            <div className="row g-4">
                {/* Sidebar / Navigation */}
                <div className="col-lg-3">
                    <div className="card border-0 shadow-sm mb-3">
                        <div className="list-group list-group-flush">
                            <button
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'checklist' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('checklist')}
                            >
                                <i className="bi bi-card-checklist me-2"></i> Checklist
                                <span className="badge bg-light text-dark float-end">
                                    {Object.values(responses).filter(r => r.response).length}/{inspection.checklist?.items.length || 0}
                                </span>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'observations' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('observations')}
                            >
                                <i className="bi bi-exclamation-octagon me-2"></i> Observations
                                <span className="badge bg-light text-dark float-end">{observations.length}</span>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'evidence' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('evidence')}
                            >
                                <i className="bi bi-camera me-2"></i> General Evidence
                                <span className="badge bg-light text-dark float-end">{generalEvidence.length}</span>
                            </button>
                            <button
                                className={`list-group-item list-group-item-action py-3 ${activeTab === 'summary' ? 'active fw-bold' : ''}`}
                                onClick={() => setActiveTab('summary')}
                            >
                                <i className="bi bi-check2-circle me-2"></i> Review & Submit
                            </button>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h6 className="fw-bold mb-2">Unit Contact</h6>
                            <p className="mb-1 text-muted small"><i className="bi bi-person me-1"></i> {inspection.unit.contactPerson}</p>
                            <p className="mb-0 text-muted small"><i className="bi bi-telephone me-1"></i> {inspection.unit.contactNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-lg-9">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">

                            {/* CHECKLIST TAB */}
                            {activeTab === 'checklist' && (
                                <div>
                                    <h5 className="fw-bold mb-4">Inspection Checklist</h5>
                                    <div className="alert alert-info py-2 small">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Please fill out all mandatory fields marked with *
                                    </div>

                                    {inspection.checklist?.items.map((item, idx) => (
                                        <div key={item.id} className="mb-4 pb-4 border-bottom last-border-0">
                                            <div className="d-flex mb-2">
                                                <span className="fw-bold me-2">{idx + 1}.</span>
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold">
                                                        {item.question}
                                                        {item.isMandatory && <span className="text-danger ms-1">*</span>}
                                                    </div>
                                                    {item.description && <div className="text-muted small">{item.description}</div>}
                                                </div>
                                            </div>

                                            <div className="row g-3 ps-4 mt-1">
                                                <div className="col-md-4">
                                                    <label className="form-label small text-muted">Compliance</label>
                                                    <select
                                                        className={`form-select ${!responses[item.id]?.response && item.isMandatory ? 'border-danger' : ''}`}
                                                        value={responses[item.id]?.response || ''}
                                                        onChange={(e) => handleResponseChange(item.id, 'response', e.target.value)}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="COMPLIANT">Compliant (Yes)</option>
                                                        <option value="NON_COMPLIANT">Non-Compliant (No)</option>
                                                        <option value="PARTIALLY_COMPLIANT">Partially Compliant</option>
                                                        <option value="NOT_APPLICABLE">Not Applicable</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-5">
                                                    <label className="form-label small text-muted">Remarks</label>
                                                    <textarea
                                                        className="form-control"
                                                        rows={1}
                                                        placeholder="Add remarks..."
                                                        value={responses[item.id]?.remarks || ''}
                                                        onChange={(e) => handleResponseChange(item.id, 'remarks', e.target.value)}
                                                    ></textarea>
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small text-muted">Evidence</label>
                                                    <button className="btn btn-sm btn-outline-secondary w-100 text-start" disabled>
                                                        <i className="bi bi-paperclip me-2"></i> Attach File...
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="text-end mt-4">
                                        <button className="btn btn-primary px-4" onClick={() => setActiveTab('observations')}>
                                            Next: Observations
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* OBSERVATIONS TAB */}
                            {activeTab === 'observations' && (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold mb-0">Observations & Findings</h5>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-outline-success"
                                                onClick={handleGenerateAiObservations}
                                                disabled={isGenerating}
                                            >
                                                {isGenerating ? (
                                                    <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...</>
                                                ) : (
                                                    <><i className="bi bi-stars me-1"></i> Generate with AI</>
                                                )}
                                            </button>
                                            <button className="btn btn-sm btn-outline-primary" onClick={handleAddObservation}>
                                                <i className="bi bi-plus-lg me-1"></i> Add Observation
                                            </button>
                                        </div>
                                    </div>

                                    {observations.length === 0 ? (
                                        <div className="text-center py-5 bg-light rounded border-dashed">
                                            <i className="bi bi-clipboard-check text-muted fs-1"></i>
                                            <p className="text-muted mt-2">No observations logged yet.</p>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {observations.map((obs, idx) => (
                                                <div key={idx} className="card bg-light border-0">
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <h6 className="fw-bold mb-0">Observation #{idx + 1}</h6>
                                                                {obs.aiGenerated && (
                                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle" style={{ fontSize: '0.7rem' }}>
                                                                        <i className="bi bi-stars me-1"></i>AI Generated
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                className="btn btn-sm btn-link text-danger p-0"
                                                                onClick={() => handleRemoveObservation(idx)}
                                                            >
                                                                <i className="bi bi-trash"></i> Remove
                                                            </button>
                                                        </div>
                                                        <div className="row g-3">
                                                            <div className="col-md-8">
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder="Describe the finding..."
                                                                    value={obs.title}
                                                                    onChange={(e) => handleObservationChange(idx, 'title', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-md-4">
                                                                <select
                                                                    className="form-select"
                                                                    value={obs.severity}
                                                                    onChange={(e) => handleObservationChange(idx, 'severity', e.target.value)}
                                                                >
                                                                    <option value="MINOR">Minor</option>
                                                                    <option value="MAJOR">Major</option>
                                                                    <option value="CRITICAL">Critical</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="d-flex justify-content-between mt-4">
                                        <button className="btn btn-outline-secondary" onClick={() => setActiveTab('checklist')}>Back</button>
                                        <button className="btn btn-primary px-4" onClick={() => setActiveTab('evidence')}>Next: Evidence</button>
                                    </div>
                                </div>
                            )}

                            {/* EVIDENCE TAB */}
                            {activeTab === 'evidence' && (
                                <div>
                                    <h5 className="fw-bold mb-4">General Evidence</h5>
                                    <p className="text-muted">Upload general site photos, videos, or documents that apply to the entire inspection.</p>

                                    <div className="border border-2 border-dashed rounded p-5 text-center mb-4 bg-light">
                                        <i className="bi bi-cloud-arrow-up text-primary fs-1"></i>
                                        <h6 className="mt-3">Drag & drop files here or click to upload</h6>
                                        <p className="text-muted small">Max file size: 10MB. Supported: JPG, PNG, PDF, MP4</p>
                                        <button className="btn btn-primary" disabled>Select Files</button>
                                    </div>

                                    <div className="d-flex justify-content-between mt-4">
                                        <button className="btn btn-outline-secondary" onClick={() => setActiveTab('observations')}>Back</button>
                                        <button className="btn btn-primary px-4" onClick={() => setActiveTab('summary')}>Next: Review</button>
                                    </div>
                                </div>
                            )}

                            {/* SUMMARY TAB */}
                            {activeTab === 'summary' && (
                                <div>
                                    <h5 className="fw-bold mb-4">Review & Submit</h5>

                                    <div className="card bg-light border-0 mb-4">
                                        <div className="card-body">
                                            <div className="row text-center">
                                                <div className="col-4 border-end">
                                                    <h3 className="fw-bold text-primary mb-0">{Object.values(responses).filter(r => r.response).length}</h3>
                                                    <small className="text-muted">Checks Completed</small>
                                                </div>
                                                <div className="col-4 border-end">
                                                    <h3 className="fw-bold text-warning mb-0">{observations.length}</h3>
                                                    <small className="text-muted">Observations</small>
                                                </div>
                                                <div className="col-4">
                                                    <h3 className="fw-bold text-success mb-0">{Object.values(responses).filter(r => r.response === 'COMPLIANT' || r.response === 'YES').length}</h3>
                                                    <small className="text-muted">Compliant Items</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Final Comments / Summary</label>
                                        <textarea
                                            className="form-control"
                                            rows={4}
                                            placeholder="Enter overall conclusion or summary of the inspection..."
                                            value={finalComments}
                                            onChange={(e) => setFinalComments(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div className="form-check mb-4">
                                        <input className="form-check-input" type="checkbox" id="declaration" defaultChecked />
                                        <label className="form-check-label text-muted small" htmlFor="declaration">
                                            I hereby declare that the inspection has been conducted impartially and the information provided is true to the best of my knowledge.
                                        </label>
                                    </div>

                                    <div className="d-flex justify-content-between mt-4">
                                        <button className="btn btn-outline-secondary" onClick={() => setActiveTab('evidence')}>Back</button>
                                        <button
                                            className="btn btn-success btn-lg px-5"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Submitting...
                                                </>
                                            ) : 'Submit Report'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
