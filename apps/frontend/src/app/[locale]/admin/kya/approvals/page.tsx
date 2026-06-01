'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { CgFileDocument } from 'react-icons/cg';

const stageNames: Record<string, string> = {
    'Pre establishment': 'Pre-establishment',
    'Operational': 'Operational',
    'Post operational': 'Post-operational',
};

export default function KyaApprovalsPage() {
    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const searchParams = useSearchParams();

    const [openStage, setOpenStage] = useState<string | null>('Operational');
    const [approvals, setApprovals] = useState<any[]>([]);
    const [timeline, setTimeline] = useState('');
    const [referenceId, setReferenceId] = useState('KYA-GUEST-001');
    const [loading, setLoading] = useState(false);

    // Decode service IDs from URL
    const approvalIds = useMemo(() => {
        const encoded = searchParams.get('data');
        try {
            return encoded ? JSON.parse(encoded) : [];
        } catch {
            return [];
        }
    }, [searchParams]);

    useEffect(() => {
        if (!approvalIds || approvalIds.length === 0) return;

        const now = new Date();
        const formattedTimestamp =
            now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-GB');
        setTimeline(formattedTimestamp);

        async function fetchData() {
            setLoading(true);
            try {
                const serviceUrl = `${API_URL}/common-info/industryservices/byids`;
                const payload = { service_ids: approvalIds };

                const res = await fetch(serviceUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) throw new Error('Failed to fetch services');

                const data = await res.json();
                setApprovals(data);
            } catch (err) {
                console.error('API Error:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [approvalIds, API_URL]);

    const groupedApprovals = useMemo(() => {
        return approvals.reduce((acc, currentItem) => {
            const stageStr = currentItem.service_category || 'Unknown';
            if (!acc[stageStr]) acc[stageStr] = [];
            acc[stageStr].push(currentItem);
            return acc;
        }, {} as Record<string, typeof approvals>);
    }, [approvals]);

    const sortedStages = Object.keys(groupedApprovals).sort(
        (a, b) => Number(b) - Number(a)
    );

    const handleToggle = (stage: string) => {
        setOpenStage((prev) => (prev === stage ? null : stage));
    };

    const handleDownload = () => {
        console.log('Download approvals:', sortedStages);
        // TODO: Implement PDF download functionality
    };

    const openDocument = (documentPath: string | null) => {
        if (!documentPath) return;
        const fileUrl = `${process.env.NEXT_PUBLIC_INDUSTRY_SERVICES_FILE?.replace(/\/$/, '')}/${documentPath.split('\\').pop()}`;
        window.open(fileUrl, '_blank');
    };

    if (loading && approvals.length === 0) {
        return (
            <div className="max-w-5xl mx-auto p-6">
                <div className="text-center text-gray-500">Loading approvals...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Approvals by Stage</h1>
                <Download
                    onClick={handleDownload}
                    className="text-[var(--primary-color)] cursor-pointer hover:opacity-70"
                    size={24}
                />
            </div>

            {/* Accordions */}
            <div className="space-y-4">
                {sortedStages.map((stage) => {
                    const isOpen = openStage === stage;
                    const stageItems = groupedApprovals[stage];

                    return (
                        <div
                            key={stage}
                            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                            {/* Accordion Header */}
                            <button
                                onClick={() => handleToggle(stage)}
                                className={`w-full flex justify-between items-center p-4 text-left transition-colors duration-200 ${isOpen ? 'bg-green-50 text-green-800' : 'bg-white hover:bg-gray-50 text-gray-800'
                                    }`}
                            >
                                <span className="text-lg font-semibold">
                                    {stageNames[stage] || stage}
                                </span>
                                <svg
                                    className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Accordion Body */}
                            {isOpen && (
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-200">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        S.no
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        Approval Name
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        State / Central
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        SOP
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        Fee Details
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        Timeline
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        List of Documents
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-3 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase"
                                                    >
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {stageItems.map((item: any, index: number) => (
                                                    <tr
                                                        key={item.id}
                                                        className="transition-colors duration-200 hover:bg-gray-50"
                                                    >
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                            {item.service_name}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                            {item.is_central_govt_service === 'Y' ? 'Central' : 'State'}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-[var(--primary-color)] whitespace-nowrap">
                                                            {item.sop_document != null ? (
                                                                <CgFileDocument
                                                                    className="cursor-pointer"
                                                                    onClick={() => openDocument(item.sop_document)}
                                                                />
                                                            ) : (
                                                                'NA'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-[var(--primary-color)] whitespace-nowrap">
                                                            {item.fee_structure_document != null ? (
                                                                <CgFileDocument
                                                                    className="cursor-pointer"
                                                                    onClick={() => openDocument(item.fee_structure_document)}
                                                                />
                                                            ) : (
                                                                'NA'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-[var(--primary-color)]">
                                                            {item.timeline ? item.timeline.trim() + ' Days' : 'NA'}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm font-medium text-[var(--primary-color)] whitespace-nowrap">
                                                            {item.list_of_required_documents != null ? (
                                                                <CgFileDocument
                                                                    className="cursor-pointer"
                                                                    onClick={() => openDocument(item.list_of_required_documents)}
                                                                />
                                                            ) : (
                                                                'NA'
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-sm whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[var(--primary-color)] border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:bg-blue-800 transition-colors duration-200"
                                                                onClick={() => {
                                                                    console.log(`Applying for: ${item.service_name}`);
                                                                }}
                                                            >
                                                                Apply
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {stageItems.length === 0 && (
                                            <div className="p-6 text-center text-gray-500">
                                                No approval items found for this stage.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Disclaimer */}
                <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mt-4 text-sm text-gray-800 shadow-sm flex gap-3">
                    <div className="text-yellow-600 mt-1">⚠️</div>
                    <div>
                        <p className="font-semibold text-yellow-700 mb-1">Disclaimer</p>
                        <p className="leading-6">
                            This search result, generated from the
                            <span className="font-medium"> Know Your Approvals (KYA) </span>
                            module on <span className="font-medium">{timeline}</span> (KYA Reference ID:
                            <span className="font-semibold"> {referenceId} </span>), reflects the indicative
                            list of applicable approvals and compliances as per the notified laws and
                            regulations of the Government of {process.env.NEXT_PUBLIC_STATE_NAME || 'Jharkhand'}, based on the information
                            provided by the applicant.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
