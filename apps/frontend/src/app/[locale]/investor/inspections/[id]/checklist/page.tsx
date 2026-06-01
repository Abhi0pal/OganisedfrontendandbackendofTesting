'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInspectionDetail, useSubmitChecklistResponse, InspectionTransactionExtended } from '@/hooks/useInspections';
import { Link } from '@/navigation';

export default function ChecklistPage() {
    const params = useParams();
    const router = useRouter();
    const inspectionId = params.id as string;

    const { data: inspection, isLoading } = useInspectionDetail(inspectionId);
    const inspectionExtended = inspection as InspectionTransactionExtended;
    const submitResponseMutation = useSubmitChecklistResponse();

    const [responses, setResponses] = useState<Record<number, { response: string; remarks: string; evidenceUrls: string[]; evidenceFiles?: { name: string; type: string; base64: string }[] }>>({});
    const [uploadingItem, setUploadingItem] = useState<number | null>(null);

    // Initialize local state with existing responses if available
    React.useEffect(() => {
        if (inspectionExtended?.checklist?.items) {
            const initialResponses: Record<number, { response: string; remarks: string; evidenceUrls: string[]; evidenceFiles?: { name: string; type: string; base64: string }[] }> = {};
            inspectionExtended.checklist.items.forEach((item: any) => {
                const existingResponse = inspectionExtended.checklistResponses?.find((r: any) => r.checklistItemId === item.id);
                if (existingResponse) {
                    initialResponses[item.id] = {
                        response: existingResponse.response || '',
                        remarks: existingResponse.remarks || '',
                        evidenceUrls: existingResponse.evidenceUrls || [],
                        evidenceFiles: []
                    };
                } else {
                    initialResponses[item.id] = { response: '', remarks: '', evidenceUrls: [], evidenceFiles: [] };
                }
            });
            setResponses(initialResponses);
        }
    }, [inspection]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!inspection || !inspection.checklist) {
        return (
            <div className="p-8 text-center text-gray-500">
                <h2>No checklist found for this inspection.</h2>
                <Link href="/investor/inspections" className="mt-4 text-indigo-600 hover:text-indigo-800 underline">
                    Back to Inspections
                </Link>
            </div>
        );
    }

    const handleResponseChange = (itemId: number, field: 'response' | 'remarks', value: string) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handleSaveItem = async (itemId: number) => {
        const itemVal = responses[itemId];
        if (!itemVal.response) {
            alert('Please select a compliance status before saving.');
            return;
        }

        try {
            await submitResponseMutation.mutateAsync({
                inspectionId,
                checklistItemId: itemId,
                responseValue: itemVal.response,
                remarks: itemVal.remarks,
                evidenceUrls: itemVal.evidenceUrls,
                evidenceFiles: itemVal.evidenceFiles
            });
            // Clear base64 payload to prevent re-sending unchanged files on next save
            setResponses(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], evidenceFiles: [] }
            }));
            alert('Response saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save response. Please try again.');
        }
    };

    const handleFileUpload = async (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // In a real application, you would upload the file to a cloud storage 
        // bucket (like S3) here and get the URL back. For this implementation, 
        // we'll mock the URL or create an object URL for preview purposes.
        const mockUrl = URL.createObjectURL(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setResponses(prev => ({
                ...prev,
                [itemId]: {
                    ...prev[itemId],
                    evidenceUrls: [...(prev[itemId]?.evidenceUrls || []), mockUrl],
                    evidenceFiles: [...(prev[itemId]?.evidenceFiles || []), { name: file.name, type: file.type, base64: base64String }]
                }
            }));
        };
        reader.readAsDataURL(file);
    };

    const removeEvidence = (itemId: number, urlToRemove: string) => {
        setResponses(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                evidenceUrls: prev[itemId].evidenceUrls.filter(url => url !== urlToRemove)
            }
        }));
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Applicant Self-Reporting: {inspectionExtended.checklist?.service?.service_name || 'Inspection Checklist'}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Provide your responses and upload evidence before the final report is generated.
                        <br />
                        Inspection ID: <span className="font-mono bg-gray-100 px-1 rounded">{inspection.id}</span>
                        {(inspection as any).unit?.name && ` | Unit: ${(inspection as any).unit.name}`}
                    </p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {inspection.checklist.items.map((item: any, index: number) => {
                        const currentResponse = responses[item.id] || { response: '', remarks: '', evidenceUrls: [] };
                        const isSaved = item.response && item.response.response === currentResponse.response && item.response.remarks === currentResponse.remarks && JSON.stringify(item.response.evidenceUrls) === JSON.stringify(currentResponse.evidenceUrls);

                        return (
                            <li key={item.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {index + 1}. {item.question}
                                            {item.isMandatory && <span className="ml-2 text-xs font-semibold text-red-600 uppercase tracking-wide bg-red-100 px-2 py-1 rounded-full">Mandatory</span>}
                                        </h3>
                                        {item.description && (
                                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                        )}

                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Compliance Status */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['YES', 'NO', 'NOT_APPLICABLE'].map((option) => (
                                                        <label key={option} className={`
                                                            cursor-pointer px-4 py-2 border rounded-md text-sm font-medium
                                                            ${currentResponse.response === option
                                                                ? (option === 'YES' ? 'bg-green-50 border-green-500 text-green-700' : option === 'NO' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-100 border-gray-500 text-gray-700')
                                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                                                        `}>
                                                            <input
                                                                type="radio"
                                                                name={`response-${item.id}`}
                                                                value={option}
                                                                checked={currentResponse.response === option}
                                                                onChange={(e) => handleResponseChange(item.id, 'response', e.target.value)}
                                                                className="sr-only"
                                                            />
                                                            {option.replace('_', ' ')}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Explanations / Remarks */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Explanation / Remarks
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    placeholder="Provide any contextual explanations..."
                                                    value={currentResponse.remarks}
                                                    onChange={(e) => handleResponseChange(item.id, 'remarks', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Multimedia Evidence Upload */}
                                        <div className="mt-6 border-t border-gray-100 pt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Evidence (Photos, Videos, Documents)</label>

                                            {currentResponse.evidenceUrls.length > 0 && (
                                                <div className="flex flex-wrap gap-4 mb-4">
                                                    {currentResponse.evidenceUrls.map((url, i) => (
                                                        <div key={i} className="relative group rounded-md border border-gray-200 p-2 bg-gray-50">
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center">
                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"></path></svg>
                                                                Evidence {i + 1}
                                                            </a>
                                                            <button
                                                                onClick={() => removeEvidence(item.id, url)}
                                                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center">
                                                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                                    Upload File
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*,video/*,.pdf,.doc,.docx"
                                                        onChange={(e) => handleFileUpload(item.id, e)}
                                                    />
                                                </label>
                                                <span className="ml-3 text-sm text-gray-500">Max size: 10MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleSaveItem(item.id)}
                                        disabled={submitResponseMutation.isPending}
                                        className={`inline-flex items-center px-4 py-2 shadow-sm text-sm font-medium rounded-md text-white 
                                            ${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} 
                                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                                    >
                                        {submitResponseMutation.isPending ? 'Saving...' : isSaved ? 'Saved' : 'Save Response'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

