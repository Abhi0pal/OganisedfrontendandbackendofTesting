'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChecklistItem {
    id: number;
    title: string;
    description: string;
    type: string;
    isMandatory: boolean;
    riskIndicator: string | null;
}

interface ChecklistResponse {
    id: string;
    checklistItemId: number;
    response: string;
    remarks: string | null;
    evidenceUrls: string[];
    isApproved: boolean;
    rejectionReason: string | null;
}

interface InspectionTransaction {
    id: string;
    applicationId: string;
    status: string;
    service: {
        id: number;
        name: string;
    };
    inspectorType: string;
    scheduledDate: string;
    checklistResponses: ChecklistResponse[];
    checklist: {
        items: ChecklistItem[];
    };
}

async function fetchInspectionDetails(id: string): Promise<InspectionTransaction> {
    const res = await fetch(`${API_BASE}/inspections/transactions/${id}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch inspection');
    return res.json();
}

async function reviewResponse(data: { responseId: string; isApproved: boolean; rejectionReason?: string }) {
    const res = await fetch(`${API_BASE}/inspections/jd-portal/responses/${data.responseId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update review');
    return res.json();
}

async function publishReport(inspectionId: string) {
    const res = await fetch(`${API_BASE}/inspections/jd-portal/transactions/${inspectionId}/publish`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to publish report');
    return res.json();
}

export default function JDInspectionReviewPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const inspectionId = params.id as string;

    const [activeTab, setActiveTab] = useState<'overview' | 'checklist'>('checklist');
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const { data: inspection, isLoading } = useQuery({
        queryKey: ['inspection-review', inspectionId],
        queryFn: () => fetchInspectionDetails(inspectionId),
    });

    const reviewMutation = useMutation({
        mutationFn: reviewResponse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inspection-review', inspectionId] });
            setRejectingId(null);
            setRejectionReason('');
        },
    });

    const publishMutation = useMutation({
        mutationFn: publishReport,
        onSuccess: () => {
            alert('Report published successfully!');
            router.push('/investor/inspections/jd-portal');
        },
    });

    const handleApprove = (responseId: string) => {
        reviewMutation.mutate({ responseId, isApproved: true });
    };

    const handleReject = (responseId: string) => {
        setRejectingId(responseId);
    };

    const confirmReject = () => {
        if (!rejectingId || !rejectionReason.trim()) return;
        reviewMutation.mutate({
            responseId: rejectingId,
            isApproved: false,
            rejectionReason,
        });
    };

    const handlePublish = () => {
        if (!inspection) return;
        const pendingItems = inspection.checklistResponses.some(r => !r.isApproved && !r.rejectionReason);
        if (pendingItems) {
            alert('Please review all items before publishing.');
            return;
        }
        if (confirm('Are you sure you want to publish this report? This action cannot be undone.')) {
            publishMutation.mutate(inspectionId);
        }
    };

    if (isLoading) {
        return (
            <div className="container-fluid p-4 d-flex justify-content-center">
                <div className="spinner-border text-primary"></div>
            </div>
        );
    }

    if (!inspection) return <div className="p-4">Inspection not found</div>;

    const completedReviews = inspection.checklistResponses.filter(r => r.isApproved || r.rejectionReason).length;
    const totalItems = inspection.checklist.items.length;
    const progress = Math.round((completedReviews / totalItems) * 100);

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Link href="/investor/inspections/jd-portal" className="text-decoration-none text-muted small mb-2 d-inline-block">
                        <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
                    </Link>
                    <h2 className="fw-bold mb-1">
                        Inspection Review: {inspection.applicationId}
                    </h2>
                    <span className={`badge ${inspection.status === 'PENDING_APPROVAL' ? 'bg-info' : 'bg-secondary'}`}>
                        {inspection.status.replace('_', ' ')}
                    </span>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-success btn-lg px-4"
                        onClick={handlePublish}
                        disabled={completedReviews < totalItems || publishMutation.isPending}
                    >
                        {publishMutation.isPending ? 'Publishing...' : 'Publish Final Report'}
                        <i className="bi bi-send ms-2"></i>
                    </button>
                </div>
            </div>

            <div className="row g-4">
                {/* Details Sidebar */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fw-semibold">Overview</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="text-muted small">Service</label>
                                <div className="fw-medium">{inspection.service.name}</div>
                            </div>
                            <div className="mb-3">
                                <label className="text-muted small">Inspector Type</label>
                                <div className="badge bg-light text-dark">{inspection.inspectorType}</div>
                            </div>
                            <div className="mb-3">
                                <label className="text-muted small">Scheduled Date</label>
                                <div>{new Date(inspection.scheduledDate).toLocaleDateString()}</div>
                            </div>
                            <hr />
                            <div className="mb-2">
                                <label className="fw-semibold">Review Progress</label>
                                <div className="d-flex justify-content-between small text-muted mb-1">
                                    <span>{completedReviews} of {totalItems} items reviewed</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div
                                        className="progress-bar bg-success"
                                        role="progressbar"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checklist Review */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white py-3 d-flex justify-content-between">
                            <h5 className="mb-0 fw-semibold">Checklist Responses</h5>
                        </div>
                        <div className="card-body p-0">
                            {inspection.checklist.items.map((item) => {
                                const response = inspection.checklistResponses.find(r => r.checklistItemId === item.id);
                                if (!response) return null;

                                const isRejected = !!response.rejectionReason;
                                const isApproved = response.isApproved && !isRejected;

                                return (
                                    <div key={item.id} className="p-4 border-bottom">
                                        <div className="d-flex justify-content-between mb-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">{item.title}</h6>
                                                <p className="text-muted small mb-0">{item.description}</p>
                                            </div>
                                            <div>
                                                {item.isMandatory && <span className="badge bg-danger">Mandatory</span>}
                                            </div>
                                        </div>

                                        <div className="bg-light p-3 rounded mb-3">
                                            <div className="d-flex gap-3 mb-2">
                                                <div className="fw-semibold text-primary">Inspector's Response:</div>
                                                <div>{response.response}</div>
                                            </div>
                                            {response.remarks && (
                                                <div className="small text-muted mb-2">
                                                    <i className="bi bi-chat-left-text me-2"></i>
                                                    {response.remarks}
                                                </div>
                                            )}
                                            {response.evidenceUrls.length > 0 && (
                                                <div className="d-flex gap-2 mt-2">
                                                    {response.evidenceUrls.map((url, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-secondary bg-white"
                                                        >
                                                            <i className="bi bi-paperclip me-1"></i>
                                                            Evidence {idx + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Review Actions */}
                                        <div className="d-flex justify-content-end align-items-center gap-2">
                                            {rejectingId === response.id ? (
                                                <div className="d-flex gap-2 align-items-center w-100 justify-content-end">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm w-50"
                                                        placeholder="Reason for rejection..."
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <button className="btn btn-sm btn-danger" onClick={confirmReject}>Confirm</button>
                                                    <button className="btn btn-sm btn-light" onClick={() => setRejectingId(null)}>Cancel</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        className={`btn btn-sm ${isApproved ? 'btn-success' : 'btn-outline-success'}`}
                                                        onClick={() => handleApprove(response.id)}
                                                    >
                                                        <i className="bi bi-check-lg me-1"></i>
                                                        {isApproved ? 'Approved' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${isRejected ? 'btn-danger' : 'btn-outline-danger'}`}
                                                        onClick={() => handleReject(response.id)}
                                                    >
                                                        <i className="bi bi-x-lg me-1"></i>
                                                        {isRejected ? 'Rejected' : 'Reject'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {response.rejectionReason && !rejectingId && (
                                            <div className="mt-2 text-danger small text-end">
                                                <strong>Rejection Reason:</strong> {response.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
