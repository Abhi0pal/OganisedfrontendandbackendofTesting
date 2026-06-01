'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCISInspectionDetail, useSubmitReport, useUploadInspectorEvidence, useDeleteInspectorEvidence, useFileUpload, useGenerateRecommendation } from '@/hooks/useInspections';
import { format } from 'date-fns';
import Link from 'next/link';
import DocumentUpload from '@/components/common/DocumentUpload';

export default function ConductInspectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { data: inspection, isLoading } = useCISInspectionDetail(id);
    const { mutate: submitReport, isPending: isSubmitting } = useSubmitReport();
    const { mutateAsync: uploadEvidence } = useUploadInspectorEvidence();
    const { mutateAsync: deleteEvidence } = useDeleteInspectorEvidence();
    const { mutateAsync: uploadFile } = useFileUpload();
    const { mutate: generateRecommendation, isPending: isGenerating } = useGenerateRecommendation();

    // State
    const [responses, setResponses] = useState<Record<number, { response: string; remarks: string; evidenceUrls: string[] }>>({});
    const [finalComments, setFinalComments] = useState('');
    const [action, setAction] = useState('APPROVE');
    const [recommendation, setRecommendation] = useState('');
    const [isAccordionOpen, setIsAccordionOpen] = useState(true);
    const [reportFile, setReportFile] = useState<string | null>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [previewEvidence, setPreviewEvidence] = useState<{ url: string, type: string } | null>(null);
    const [uploadedEvidence, setUploadedEvidence] = useState<{ id: string, fileUrl: string, fileType: string, fileName?: string, fileSize?: number }[]>([]);

    // Notification
    const [notification, setNotification] = useState<{ type: 'success' | 'danger', message: string } | null>(null);
    const showToast = (type: 'success' | 'danger', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Initialize state
    useEffect(() => {
        if (inspection?.checklist?.items) {
            const initialResponses: any = {};
            inspection.checklist.items.forEach((item: any) => {
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
        if (inspection?.evidence) {
            setUploadedEvidence(inspection.evidence);
            // Check if report exists
            const report = inspection.evidence.find((e: any) => e.fileType === 'INSPECTION_REPORT');
            if (report) setReportFile(report.fileUrl);
        }
    }, [inspection]);

    // Calculate Compliance Score
    const calculateScore = () => {
        const values = Object.values(responses);
        if (values.length === 0) return 0;

        const totalRelevant = values.filter(r => r.response && r.response !== 'NOT_APPLICABLE').length;
        const compliant = values.filter(r => r.response === 'COMPLIANT').length;

        if (totalRelevant === 0) return 0;
        return Math.round((compliant / totalRelevant) * 100);
    };

    const score = calculateScore();

    // Handlers
    const handleResponseChange = (itemId: number, field: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleEvidenceUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // 1. Upload file to storage
                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await uploadFile(formData);
                // backend returns { path: "uploads/documents/..." }
                // Construct absolute URL
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                // Adjust if API URL has a path prefix that isn't part of static serving
                // Usually localhost:3001/uploads/... works if static assets are at root
                // If baseUrl is localhost:3000/api, we might need to point to 3001 for static
                // For now assuming baseUrl is the backend origin

                // If path is relative "uploads/...", ensure we prepend / if missing
                const relativePath = uploadRes.data.path.replace(/\\/g, '/');
                const finalUrl = `${baseUrl}/${relativePath}`;

                // 2. Create evidence record
                const response = await uploadEvidence({
                    inspectionId: id,
                    data: {
                        fileType: file.type.startsWith('video') ? 'VIDEO' : 'IMAGE',
                        fileUrl: finalUrl,
                        fileName: file.name,
                        fileSize: file.size
                    }
                });

                const result = response.data || response;

                showToast('success', 'Evidence uploaded successfully!');
                setUploadedEvidence(prev => [result, ...prev]);
            } catch (err) {
                console.error(err);
                showToast('danger', 'Failed to upload evidence.');
            }
        }
    }, [id, uploadEvidence, uploadFile, showToast]);

    const handleReportUpload = useCallback(async (file: File) => {
        try {
            // For now, using a mock URL. In a real app, this would be an actual upload to cloud storage.
            const mockFileUrl = 'https://placehold.co/600x400/PDF/EEE?text=Signed+Report'; // Mock URL for demo

            const response = await uploadEvidence({
                inspectionId: id,
                data: {
                    fileType: 'INSPECTION_REPORT',
                    fileUrl: mockFileUrl, // Mock URL for demo
                    fileName: file.name,
                    fileSize: file.size
                }
            });

            const result = response.data || response;
            setReportFile(result.fileUrl);
            showToast('success', 'Signed report uploaded successfully!');
            return result.fileUrl;
        } catch (err) {
            console.error(err);
            showToast('danger', 'Failed to upload signed report.');
            throw err;
        }
    }, [id, uploadEvidence, showToast]);

    const handleDownloadDraft = () => {
        setShowDraftModal(true);
        // We delay the print call slightly to allow the modal to render if we wanted to auto-print,
        // but for better UX, we'll let the user click "Print" in the modal.
    };

    const printDraft = () => {
        const printContent = document.getElementById('draft-table-view');
        const originalContents = document.body.innerHTML;

        if (printContent) {
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); // Reload to restore event listeners destroyed by innerHTML replacement
        }
    };

    const handleGenerateRecommendation = () => {
        const allResponses = Object.entries(responses).map(([key, val]) => {
            const item = inspection?.checklist?.items.find((i: any) => i.id === Number(key));
            return {
                checklistItemId: Number(key),
                response: val.response,
                remarks: val.remarks,
                question: item?.question || '',
            };
        }).filter(r => r.response);

        if (allResponses.length === 0) {
            showToast('danger', 'Please fill out the checklist first.');
            return;
        }

        generateRecommendation(
            { inspectionId: id, responses: allResponses, unitName: inspection?.unit?.name },
            {
                onSuccess: (data) => {
                    setRecommendation(data.recommendation);
                    showToast('success', 'AI recommendation generated successfully!');
                },
                onError: () => {
                    showToast('danger', 'Failed to generate recommendation. Please try again.');
                },
            }
        );
    };

    const handleSubmit = () => {
        // Validation
        const mandatoryItems = inspection?.checklist?.items.filter((i: any) => i.isMandatory) || [];
        const missingMandatory = mandatoryItems.some((item: any) => !responses[item.id]?.response);

        if (missingMandatory) {
            showToast('danger', 'Please complete all mandatory checklist items.');
            window.scrollTo({ top: 500, behavior: 'smooth' });
            return;
        }

        if ((action === 'REVERT' || action === 'REJECT') && !recommendation) {
            showToast('danger', 'Recommendation/Remarks are mandatory for Revert or Reject actions.');
            return;
        }

        const payload = {
            inspectionId: id,
            responses: Object.entries(responses).map(([key, val]) => ({
                checklistItemId: Number(key),
                response: val.response,
                remarks: val.remarks,
                evidenceUrls: val.evidenceUrls
            })).filter(r => r.response),
            // Default empty arrays for observations provided by other logic if needed,
            // but in this design we are simplifying or assuming observations are derived from non-compliance remarks
            observations: [],
            evidence: uploadedEvidence.map(e => ({
                fileType: e.fileType,
                fileUrl: e.fileUrl,
                fileName: e.fileName,
                fileSize: e.fileSize
            })), // General evidence handled via specific upload endpoints or separate section logic
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            comments: finalComments,
            recommendation,
            action // Backend needs to support this
        };

        submitReport(payload, {
            onSuccess: () => {
                showToast('success', 'Inspection Report Submitted Successfully!');
                setTimeout(() => router.push('/department/inspector/dashboard'), 1500);
            },
            onError: () => {
                showToast('danger', 'Failed to submit report. Please try again.');
            }
        });
    };

    if (isLoading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div><div className="mt-2">Loading...</div></div>;
    if (!inspection) return <div className="alert alert-danger m-4">Inspection not found</div>;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'success';
        if (score >= 50) return 'warning';
        return 'danger';
    };

    const handleDeleteEvidence = async (fileUrl: string) => {
        if (confirm('Are you sure you want to delete this evidence?')) {
            try {
                await deleteEvidence({ inspectionId: id, fileUrl });
                setUploadedEvidence(prev => prev.filter(f => f.fileUrl !== fileUrl));
                showToast('success', 'Evidence removed successfully.');
            } catch (error) {
                console.error(error);
                showToast('danger', 'Failed to delete evidence.');
            }
        }
    };

    return (
        <div className="container-fluid py-4 min-vh-100 bg-light">
            {/* Draft View Modal */}
            {showDraftModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Draft Inspection Report</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDraftModal(false)}></button>
                            </div>
                            <div className="modal-body" id="draft-table-view">
                                <div className="text-center mb-4">
                                    <h3>Inspection Report Draft</h3>
                                    <p className="text-muted">Unit: {inspection.unit.name}</p>
                                </div>
                                <table className="table table-bordered">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Sl.</th>
                                            <th>Checklist Question</th>
                                            <th>Response</th>
                                            <th>Remarks & Findings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inspection.checklist?.items.map((item: any, idx: number) => (
                                            <tr key={item.id}>
                                                <td>{idx + 1}</td>
                                                <td>{item.question}</td>
                                                <td>{responses[item.id]?.response === 'COMPLIANT' ? 'Yes' : responses[item.id]?.response === 'NON_COMPLIANT' ? 'No' : '-'}</td>
                                                <td>{responses[item.id]?.remarks || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDraftModal(false)}>Close</button>
                                <button type="button" className="btn btn-primary" onClick={printDraft}>
                                    <i className="bi bi-printer me-2"></i> Print / Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence Preview Modal */}
            {previewEvidence && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000 }} onClick={() => setPreviewEvidence(null)}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content bg-transparent border-0 shadow-none">
                            <div className="modal-body p-0 text-center position-relative">
                                <button
                                    type="button"
                                    className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
                                    style={{ zIndex: 2010 }}
                                    onClick={() => setPreviewEvidence(null)}
                                ></button>
                                {previewEvidence.type === 'VIDEO' ? (
                                    <video
                                        controls
                                        autoPlay
                                        className="w-100 rounded shadow-lg"
                                        style={{ maxHeight: '80vh' }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <source src={previewEvidence.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <img
                                        src={previewEvidence.url}
                                        alt="Evidence Preview"
                                        className="img-fluid rounded shadow-lg"
                                        style={{ maxHeight: '80vh', objectFit: 'contain' }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div className={`alert alert-${notification.type} position-fixed top-0 end-0 m-3 shadow`} style={{ zIndex: 1050 }}>
                    {notification.message}
                </div>
            )}

            {/* 1. Header */}
            <div className="mb-4">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-1 small">
                        <li className="breadcrumb-item"><Link href="/department/inspector/dashboard">Dashboard</Link></li>
                        <li className="breadcrumb-item active" aria-current="page">{inspection.inspectionId}</li>
                    </ol>
                </nav>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">Conduct Inspection</h4>
                        <p className="text-muted small mb-0">ID: {inspection.inspectionId} • Scheduled: {format(new Date(inspection.scheduledDate || new Date()), 'dd MMM yyyy')}</p>
                    </div>
                    <span className="badge bg-primary fs-6 px-3 py-2">{inspection.inspectionType} INSPECTION</span>
                </div>
            </div>

            {/* 2. Application Details Accordion */}
            <div className="card border-0 shadow-sm mb-4">
                <div
                    className="card-header bg-white py-3 d-flex justify-content-between align-items-center cursor-pointer"
                    onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <h5 className="mb-0 fw-bold text-primary"><i className="bi bi-info-circle me-2"></i> Application Details</h5>
                    <i className={`bi bi-chevron-${isAccordionOpen ? 'up' : 'down'}`}></i>
                </div>
                {isAccordionOpen && (
                    <div className="card-body">
                        <div className="row g-4">
                            <div className="col-md-4 border-end">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Unit Information</h6>
                                <p className="mb-1 fw-semibold">{inspection.unit.name}</p>
                                <p className="mb-1 text-muted small"><i className="bi bi-geo-alt me-1"></i> {inspection.unit.address}</p>
                                <p className="mb-1 text-muted small"><i className="bi bi-person me-1"></i> {inspection.unit.contactPerson}</p>
                                <p className="mb-0 text-muted small"><i className="bi bi-telephone me-1"></i> {inspection.unit.contactNumber}</p>
                            </div>
                            <div className="col-md-4 border-end">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Project Details</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Sector:</span>
                                    <span className="fw-medium text-end">{inspection.unit.sector}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Category:</span>
                                    <span className="fw-medium text-end">{inspection.unit.category}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small">Investment:</span>
                                    <span className="fw-medium text-end">₹ {inspection.unit.investmentAmount || 0} Cr</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <h6 className="text-muted text-uppercase small fw-bold mb-3">Location</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">District:</span>
                                    <span className="fw-medium text-end">{inspection.location.district}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Block:</span>
                                    <span className="fw-medium text-end">{inspection.location.block}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted small">Village:</span>
                                    <span className="fw-medium text-end">{inspection.location.village}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Checklist Section (Tabular) */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold"><i className="bi bi-card-checklist me-2"></i> Inspection Checklist</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th style={{ width: '5%' }} className="ps-4">Sl.</th>
                                <th style={{ width: '40%' }}>Checklist Question</th>
                                <th style={{ width: '20%' }}>Response</th>
                                <th style={{ width: '35%' }} className="pe-4">Remarks & Findings</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inspection.checklist?.items.map((item: any, idx: number) => (
                                <tr key={item.id}>
                                    <td className="ps-4 fw-medium text-muted">{idx + 1}</td>
                                    <td>
                                        <div className="fw-medium">{item.question} {item.isMandatory && <span className="text-danger">*</span>}</div>
                                        {item.description && <div className="text-muted small mt-1">{item.description}</div>}
                                    </td>
                                    <td>
                                        <select
                                            className={`form-select form-select-sm ${!responses[item.id]?.response && item.isMandatory ? 'border-danger' : ''}`}
                                            value={responses[item.id]?.response || ''}
                                            onChange={(e) => handleResponseChange(item.id, 'response', e.target.value)}
                                        >
                                            <option value="">Select Option</option>
                                            <option value="COMPLIANT">Yes</option>
                                            <option value="NON_COMPLIANT">No</option>
                                        </select>
                                    </td>
                                    <td className="pe-4">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Enter remarks..."
                                            value={responses[item.id]?.remarks || ''}
                                            onChange={(e) => handleResponseChange(item.id, 'remarks', e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Supporting Documents & Compliance Score */}
            <div className="row g-4 mb-4">
                {/* a) Upload Documents */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold"><i className="bi bi-cloud-upload me-2"></i> Supporting Evidence</h5>
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => document.getElementById('evidence-upload')?.click()}
                            >
                                <i className="bi bi-plus-lg"></i> Add More
                            </button>
                            <input
                                type="file"
                                id="evidence-upload"
                                hidden
                                accept="image/*,video/*"
                                onChange={handleEvidenceUpload}
                            />
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {/* Upload Box Trigger */}
                                <div className="col-md-4" onClick={() => document.getElementById('evidence-upload')?.click()} style={{ cursor: 'pointer' }}>
                                    <div className="border border-2 border-dashed rounded p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center bg-light hover-bg-light-dark">
                                        <i className="bi bi-camera fs-2 text-muted mb-2"></i>
                                        <span className="text-muted small fw-medium">Upload Photos/Videos</span>
                                    </div>
                                </div>
                                {/* Uploaded Items */}
                                {uploadedEvidence.filter(e => e.fileType !== 'INSPECTION_REPORT').map((file, idx) => (
                                    <div className="col-md-4" key={idx}>
                                        <div
                                            className="position-relative border rounded overflow-hidden h-100 bg-white shadow-sm cursor-pointer"
                                            style={{ minHeight: '120px', cursor: 'pointer' }}
                                            onClick={() => setPreviewEvidence({ url: file.fileUrl, type: file.fileType })}
                                        >
                                            <button
                                                className="position-absolute top-0 end-0 btn btn-sm btn-danger m-1 p-0 d-flex align-items-center justify-content-center"
                                                style={{ width: '24px', height: '24px', zIndex: 10 }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteEvidence(file.fileUrl);
                                                }}
                                                title="Remove Evidence"
                                            >
                                                <i className="bi bi-x fs-5"></i>
                                            </button>


                                            {file.fileType === 'VIDEO' ? (
                                                <div className="d-flex align-items-center justify-content-center h-100 bg-dark text-white">
                                                    <i className="bi bi-play-circle fs-1"></i>
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-100 h-100 bg-light"
                                                    style={{
                                                        backgroundImage: `url(${file.fileUrl})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        minHeight: '120px'
                                                    }}
                                                />
                                            )}
                                            <div className="position-absolute bottom-0 start-0 w-100 p-2 bg-white bg-opacity-75 small text-truncate">
                                                Evidence {idx + 1}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* b) Compliance Score */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-4">
                            <h6 className="text-uppercase text-muted fw-bold mb-4">Live Compliance Score</h6>

                            {/* Circular Progress */}
                            <div className="position-relative d-flex justify-content-center align-items-center mb-3" style={{ width: '160px', height: '160px' }}>
                                <svg className="w-100 h-100" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                    {/* Background Circle */}
                                    <circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke="#f1f3f5"
                                        strokeWidth="8"
                                    />
                                    {/* Progress Circle */}
                                    <circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke={`var(--bs-${getScoreColor(score)})`}
                                        strokeWidth="8"
                                        strokeDasharray={339.29} // 2 * pi * 54
                                        strokeDashoffset={339.29 - (339.29 * score) / 100}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease' }}
                                    />
                                </svg>
                                <div className="position-absolute text-center mt-1">
                                    <div className={`display-5 fw-bold text-${getScoreColor(score)}`}>{score}%</div>
                                </div>
                            </div>

                            <div className={`badge bg-${getScoreColor(score)} bg-opacity-25 text-${getScoreColor(score)} px-4 py-2 rounded-pill mb-2 fs-6`}>
                                {score >= 80 ? 'Excellent' : score >= 50 ? 'Average' : 'Critical'}
                            </div>
                            <p className="small text-muted mb-0">
                                Based on {Object.values(responses).filter(r => r.response && r.response !== 'NOT_APPLICABLE').length} items checked
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Action Section */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white py-3">
                    <h5 className="mb-0 fw-bold"><i className="bi bi-receipt me-2"></i> Action & Submission</h5>
                </div>
                <div className="card-body">
                    <div className="row g-4">
                        <div className="col-md-6 border-end">
                            <h6 className="fw-bold mb-3">1. Inspection Report</h6>
                            <div className="d-flex gap-3 mb-4">
                                <button className="btn btn-outline-dark flex-grow-1 py-2" onClick={handleDownloadDraft}>
                                    <i className="bi bi-file-earmark-pdf me-2"></i> Download Draft
                                </button>
                                <div className="flex-grow-1">
                                    <DocumentUpload
                                        label=""
                                        field="report"
                                        value={reportFile}
                                        onUpload={handleReportUpload}
                                        onChange={(f, v) => setReportFile(v)}
                                        accept=".pdf"
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label fw-bold mb-0">Recommendation / Final Remarks</label>
                                    <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={handleGenerateRecommendation}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Generating...</>
                                        ) : (
                                            <><i className="bi bi-stars me-1"></i> Generate with AI</>
                                        )}
                                    </button>
                                </div>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    placeholder="Enter your final recommendation or summary of findings..."
                                    value={recommendation}
                                    onChange={(e) => setRecommendation(e.target.value)}
                                ></textarea>
                                {recommendation && (
                                    <div className="form-text text-muted mt-1">
                                        <i className="bi bi-info-circle me-1"></i>
                                        You can edit the AI-generated text before submitting.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-md-6 d-flex flex-column justify-content-center px-lg-5">
                            <h6 className="fw-bold mb-3">2. Final Action</h6>

                            <div className="mb-4">
                                <label className="form-label small text-muted">Select Action</label>
                                <select
                                    className="form-select form-select-lg"
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                >
                                    <option value="APPROVE">Forward to Joint Director (Approve)</option>
                                    <option value="REVERT">Revert to Applicant (Clarification)</option>
                                    <option value="REJECT">Reject Application</option>
                                </select>
                            </div>

                            <button
                                className={`btn btn-lg w-100 ${action === 'REJECT' ? 'btn-danger' : action === 'REVERT' ? 'btn-warning text-dark' : 'btn-success'}`}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span><span className="spinner-border spinner-border-sm me-2"></span>Processing...</span>
                                ) : (
                                    <span><i className="bi bi-check-circle-fill me-2"></i> Submit Inspection Report</span>
                                )}
                            </button>

                            <div className="mt-3 text-center">
                                <small className="text-muted">
                                    <i className="bi bi-shield-lock me-1"></i>
                                    By submitting, you confirm that all details are accurate.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
