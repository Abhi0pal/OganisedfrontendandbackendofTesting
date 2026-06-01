'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card } from 'primereact/card';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { FormRenderer } from '@/components/investor/FormRenderer';
import apiClient from '@/lib/api-client';

const EDITABLE_STATUSES = new Set(['I', 'DP', 'H', 'PD']);

export default function ViewApplicationPage() {
    const params       = useParams();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const submissionId = params?.submissionId as string;
    const editParam    = searchParams?.get('edit') === 'true';

    const [data, setData]       = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(false);

    useEffect(() => {
        if (!submissionId) return;
        apiClient.get(`/investor/services/submissions/${submissionId}`)
            .then(res => setData(res.data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [submissionId]);

    if (loading) return <div className="p-5"><Skeleton height="400px" /></div>;
    if (error || !data) return <div className="p-5 text-center text-red-500">Failed to load application details.</div>;

    const statusCode = String(data.status || '').toUpperCase();
    const canEdit    = EDITABLE_STATUSES.has(statusCode);
    const isEditMode = canEdit && editParam;

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'A':  return <Tag severity="success"  value="Approved"    />;
            case 'R':  return <Tag severity="danger"   value="Rejected"    />;
            case 'P':  return <Tag severity="warning"  value="Pending"     />;
            case 'F':  return <Tag severity="info"     value="Processing"  />;
            case 'H':  return <Tag severity="warning"  value="Reverted"    />;
            case 'I':  return <Tag severity="secondary" value="Incomplete" />;
            case 'DP': return <Tag severity="secondary" value="Draft"      />;
            case 'PD': return <Tag severity="warning"  value="Pending Docs"/>;
            default:   return <Tag severity="secondary" value={status}     />;
        }
    };

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                <Button label="Back to List" icon="pi pi-arrow-left" text onClick={() => router.back()} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {getStatusTag(statusCode)}
                    {canEdit && !isEditMode && (
                        <Button
                            label="Edit & Resubmit"
                            icon="pi pi-pencil"
                            size="small"
                            severity="warning"
                            onClick={() => router.push(`?edit=true`)}
                        />
                    )}
                    {isEditMode && (
                        <Button
                            label="View Only"
                            icon="pi pi-eye"
                            size="small"
                            severity="secondary"
                            outlined
                            onClick={() => router.push(`?edit=false`)}
                        />
                    )}
                </div>
            </div>

            <Card title={`${isEditMode ? '✏️ Edit — ' : ''}${data.config?.formName || `Application #${data.submissionId}`}`} className="shadow-sm">
                {data.config ? (
                    <FormRenderer
                        config={data.config}
                        initialData={data.formData}
                        readOnly={!isEditMode}
                        onCancel={() => router.back()}
                        onSubmit={() => router.back()}
                    />
                ) : (
                    <div className="text-center text-muted p-5">
                        <i className="pi pi-file-excel text-4xl mb-3"></i>
                        <p>No Form Builder configuration found for this legacy application.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}