'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Toast } from 'primereact/toast';
import CommonDocumentPage from '@/components/common/CommonDocumentPage';
import { useCommonDocuments } from '@/hooks/common/useCommonDocuments';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';

export default function FormBuilderDocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useRef<Toast>(null);
    useAuth();

    const locale = String(params?.locale || 'en');
    const serviceId = String(params?.serviceId || '');
    const formTypeId = Number(params?.formTypeId || 1);
    const submissionId = Number(searchParams?.get('submissionId') || 0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasMarkedDocumentsProgress, setHasMarkedDocumentsProgress] = useState(false);

    const {
        documents,
        uploadedDocuments,
        setUploadedDocuments,
        syncDocuments,
    } = useCommonDocuments(serviceId, submissionId, 0);

    const missingRequiredDocuments = useMemo(
        () =>
            (documents || [])
                .filter((doc: any) => String(doc?.isRequired || '').toUpperCase() === 'Y')
                .filter((doc: any) => !uploadedDocuments?.[String(doc.id)]),
        [documents, uploadedDocuments]
    );

    useEffect(() => {
        if (!submissionId || hasMarkedDocumentsProgress) return;
        let active = true;

        apiClient
            .post('/investor/services/documents-progress', {
                serviceId,
                formTypeId,
                submissionId,
            })
            .then(() => {
                if (active) setHasMarkedDocumentsProgress(true);
            })
            .catch((error: any) => {
                if (!active) return;
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Status Update Pending',
                    detail: error?.response?.data?.message || error?.message || 'Unable to mark documents step progress.',
                });
            });

        return () => {
            active = false;
        };
    }, [formTypeId, hasMarkedDocumentsProgress, serviceId, submissionId]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUploaded = (event: Event) => {
            const detail = (event as CustomEvent)?.detail || {};
            if (Number(detail?.submissionId) !== submissionId) return;
            if (String(detail?.serviceId || '') !== serviceId) return;
            if (!detail?.documentId || !detail?.uploaded) return;

            setUploadedDocuments((prev: Record<string, any>) => ({
                ...prev,
                [String(detail.documentId)]: detail.uploaded,
            }));
        };

        window.addEventListener('common-documents:uploaded', handleUploaded as EventListener);
        return () => {
            window.removeEventListener('common-documents:uploaded', handleUploaded as EventListener);
        };
    }, [serviceId, setUploadedDocuments, submissionId]);

    const handleFinalSubmit = async () => {
        if (!submissionId) {
            toast.current?.show({
                severity: 'error',
                summary: 'Invalid Submission',
                detail: 'Submission id is missing.',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await syncDocuments();
            await apiClient.post('/investor/services/final-submit', {
                serviceId,
                formTypeId,
                submissionId,
            });
            toast.current?.show({
                severity: 'success',
                summary: 'Submitted',
                detail: 'Application submitted successfully.',
            });
            router.replace(`/${locale}/investor/applications?submitted=1`);
        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Submission Failed',
                detail: error?.response?.data?.message || error?.message || 'Unable to submit application.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w mx-auto space-y-6">
            <Toast ref={toast} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Supporting Documents</h1>
                <p className="text-gray-500 mt-1">
                    Upload required documents and then complete the final submission.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {submissionId ? (
                    <CommonDocumentPage
                        serviceId={serviceId}
                        submissionId={submissionId}
                        deptId={0}
                    />
                ) : (
                    <div className="text-sm text-red-600">Submission id is missing.</div>
                )}
            </div>

            {missingRequiredDocuments.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Upload all mandatory documents before final submission.
                </div>
            )}

            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => router.push(`/${locale}/investor/services/${serviceId}/apply/${formTypeId}?submissionId=${submissionId}&mode=edit`)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border-0 rounded-lg fw-medium text-sm"
                    style={{ background: '#f3f4f6', color: '#374151', opacity: isSubmitting ? 0.6 : 1 }}
                >
                    Back to Form
                </button>
                <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || missingRequiredDocuments.length > 0 || !submissionId}
                    className="px-4 py-2 border-0 rounded-lg fw-medium text-sm text-white"
                    style={{
                        background: isSubmitting || missingRequiredDocuments.length > 0 || !submissionId ? '#9ca3af' : '#dc2626',
                        opacity: isSubmitting ? 0.8 : 1,
                    }}
                >
                    {isSubmitting ? 'Submitting...' : 'Save & Proceed'}
                </button>
            </div>
        </div>
    );
}
