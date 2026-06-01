'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Download, Search, ArrowLeft, CheckCircle2, Building2, Clock, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { CgFileDocument } from 'react-icons/cg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const stageOrder: Record<string, number> = {
    'Pre Establishment': 1,
    'Pre Operation': 2,
    'Post Operation': 3,
};

const DEMO_DATA = [
    {
        id: 1,
        kya_reference_id: 'KYA-LA-001',
        service_name: 'Factory License',
        department: 'Labour',
        service_category: 'Pre establishment',
        is_central_govt_service: 'N',
        timeline: 7,
        steps: 3,
        list_of_required_documents: 'PAN, Building Plan',
        document_link: 'https://example.com/documents/factory-license-docs.pdf',
        fee_structure_document: 'https://example.com/documents/factory-license-fees.pdf',
        legal_provision: 'Factories Act, Sec. 6',
    },
    {
        id: 2,
        kya_reference_id: 'KYA-EC-002',
        service_name: 'Consent to Establish',
        department: 'Environment',
        service_category: 'Pre establishment',
        is_central_govt_service: 'N',
        timeline: 13,
        steps: 5,
        list_of_required_documents: 'EIA, Report, Site Plan',
        document_link: 'https://example.com/documents/consent-establish-docs.pdf',
        fee_structure_document: 'https://example.com/documents/consent-establish-fees.pdf',
        legal_provision: 'Water Act, Sec. 25',
    },
    {
        id: 3,
        kya_reference_id: 'KYA-IL-003',
        service_name: 'Industrial License',
        department: 'Industries',
        service_category: 'Operational',
        is_central_govt_service: 'N',
        timeline: 45,
        steps: 4,
        list_of_required_documents: 'Technical Details, Clearances',
        document_link: 'https://example.com/documents/industrial-license-docs.pdf',
        fee_structure_document: 'https://example.com/documents/industrial-license-fees.pdf',
        legal_provision: 'Industries Act, Sec. 12',
    },
    {
        id: 4,
        kya_reference_id: 'KYA-LC-004',
        service_name: 'Labor Compliance Filing',
        department: 'Labour',
        service_category: 'Operational',
        is_central_govt_service: 'Y',
        timeline: 15,
        steps: 2,
        list_of_required_documents: 'Employee Details, Payroll',
        document_link: 'https://example.com/documents/labor-compliance-docs.pdf',
        fee_structure_document: null,
        legal_provision: 'Labor Code, Sec. 2.1',
    },
    {
        id: 5,
        kya_reference_id: 'KYA-BC-005',
        service_name: 'Building Completion Certificate',
        department: 'Municipal',
        service_category: 'Post operational',
        is_central_govt_service: 'N',
        timeline: 60,
        steps: 6,
        list_of_required_documents: 'Building Drawings, Inspection Report',
        document_link: 'https://example.com/documents/building-completion-docs.pdf',
        fee_structure_document: 'https://example.com/documents/building-completion-fees.pdf',
        legal_provision: 'Building Code, Sec. 45',
    },
    {
        id: 6,
        kya_reference_id: 'KYA-AR-006',
        service_name: 'Annual Return Filing',
        department: 'Corporate Affairs',
        service_category: 'Post operational',
        is_central_govt_service: 'Y',
        timeline: 30,
        steps: 3,
        list_of_required_documents: 'Financial Statements, Board Minutes',
        document_link: 'https://example.com/documents/annual-return-docs.pdf',
        fee_structure_document: 'https://example.com/documents/annual-return-fees.pdf',
        legal_provision: 'Companies Act, Sec. 92',
    },
];

export default function KyaApprovalsPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const searchParams = useSearchParams();
    const router = useRouter();

    const [approvals, setApprovals] = useState<any[]>([]);
    const [timeline, setTimeline] = useState('');
    const [referenceId] = useState(() => `KYA-${Date.now().toString(36).toUpperCase()}`);
    const [loading, setLoading] = useState(false);
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openStages, setOpenStages] = useState<Record<string, boolean>>({});

    const stageNames: Record<string, string> = {
        'Pre Establishment': 'Pre Establishment',
        'Pre Operation': 'Pre Operation',
        'Post Operation': 'Post Operation',
    };

    const stageColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
        'Pre Establishment': { bg: '#eff6ff', border: '#3b82f6', badge: '#3b82f6', text: '#1e40af' },
        'Pre Operation':     { bg: '#f0fdf4', border: '#22c55e', badge: '#22c55e', text: '#15803d' },
        'Post Operation':    { bg: '#fff7ed', border: '#f97316', badge: '#f97316', text: '#c2410c' },
    };

    const toggleStage = (stage: string) => {
        setOpenStages(prev => ({ ...prev, [stage]: !( prev[stage] !== false) }));
    };

    const totalTimeline = useMemo(() => {
        const max = approvals.reduce((acc, item) => {
            const days = parseInt(item.timeline, 10);
            return isNaN(days) ? acc : Math.max(acc, days);
        }, 0);
        return max || 'NA';
    }, [approvals]);

    const approvalIds = useMemo(() => {
        const encoded = searchParams.get('data');
        try {
            return encoded ? JSON.parse(encoded) : [];
        } catch {
            return [];
        }
    }, [searchParams]);

    useEffect(() => {
        const now = new Date();
        setTimeline(now.toLocaleDateString('en-GB') + ' at ' + now.toLocaleTimeString('en-GB'));

        // Use demo data if no approval IDs provided
        if (!approvalIds || approvalIds.length === 0) {
            setApprovals(DEMO_DATA);
            return;
        }

        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/kya/service-details/byids`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service_ids: approvalIds }),
                });
                if (!res.ok) throw new Error('Failed to fetch services');
                const data = await res.json();
                setApprovals(data);

                // Auto-open all stages
                const stages: Record<string, boolean> = {};
                data.forEach((item: any) => { stages[item.service_category || 'Unknown'] = true; });
                setOpenStages(stages);
            } catch (err) {
                console.error('API Error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [approvalIds, API_URL]);

    const groupedApprovals = useMemo(() => {
        return approvals.reduce((acc, item) => {
            const stage = item.service_category || 'Unknown';
            if (!acc[stage]) acc[stage] = [];
            acc[stage].push(item);
            return acc;
        }, {} as Record<string, typeof approvals>);
    }, [approvals]);

    const sortedStages = Object.keys(groupedApprovals).sort(
        (a, b) => (stageOrder[a] || 99) - (stageOrder[b] || 99)
    );

    // Filter approvals by search query
    const filteredApprovals = useMemo(() => {
        let filtered = approvals;
        if (selectedStage) {
            filtered = filtered.filter(item => item.service_category === selectedStage);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                (item.service_name || '').toLowerCase().includes(q) ||
                (item.department || '').toLowerCase().includes(q) ||
                (item.kya_reference_id || '').toLowerCase().includes(q) ||
                (item.service_category || '').toLowerCase().includes(q) ||
                (item.legal_provision || '').toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [approvals, selectedStage, searchQuery]);

    const handleDownload = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // ── Title ──
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Know Your Approvals (KYA) Report', 14, 18);

        // Subtitle info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Reference ID: ${referenceId}`, 14, 26);
        doc.text(`Generated on: ${timeline}`, 14, 31);
        doc.text(`Total Approvals: ${filteredApprovals.length}`, 14, 36);

        let currentY = 42;

        // ── Section 1: Question & Answer Summary ──
        let qaSummary: { question: string; answer: string }[] = [];
        try {
            const stored = sessionStorage.getItem('kya_qa_summary');
            if (stored) qaSummary = JSON.parse(stored);
        } catch { /* ignore */ }

        if (qaSummary.length > 0) {
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(41, 128, 185);
            doc.text('Section 1: Your KYA Questionnaire Responses', 14, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += 4;

            const qaTableData = qaSummary.map((qa, idx) => [
                idx + 1,
                qa.question,
                qa.answer,
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['#', 'Question', 'Your Answer']],
                body: qaTableData,
                styles: { fontSize: 8, cellPadding: 3 },
                headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                alternateRowStyles: { fillColor: [235, 245, 255] },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 150 },
                    2: { cellWidth: 100 },
                },
                margin: { left: 14, right: 14 },
            });

            currentY = (doc as any).lastAutoTable.finalY + 10;
        }

        // ── Section 2: Approvals Table ──
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 128, 185);
        doc.text(`Section ${qaSummary.length > 0 ? '2' : '1'}: Required Approvals & Compliances`, 14, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 4;

        const tableData = filteredApprovals.map((item, idx) => [
            idx + 1,
            item.kya_reference_id || 'NA',
            item.service_name || 'NA',
            item.department || 'NA',
            item.is_central_govt_service === 'Y' ? 'Central' : 'State',
            stageNames[item.service_category] || item.service_category || 'NA',
            item.timeline ? `${item.timeline} Days` : 'NA',
            item.steps || 'NA',
            item.fee_structure_document || 'NA',
            item.legal_provision || 'NA',
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['#', 'KYA Ref ID', 'Approval Name', 'Department', 'State/Central', 'Stage', 'SLA', 'Steps', 'Fee', 'Legal Provision']],
            body: tableData,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            columnStyles: {
                0: { cellWidth: 8 },
                1: { cellWidth: 22 },
                2: { cellWidth: 55 },
                3: { cellWidth: 35 },
                4: { cellWidth: 18 },
                5: { cellWidth: 25 },
                6: { cellWidth: 18 },
                7: { cellWidth: 12 },
                8: { cellWidth: 25 },
                9: { cellWidth: 40 },
            },
            margin: { left: 14, right: 14 },
        });

        // ── Disclaimer Section ──
        const disclaimerY = (doc as any).lastAutoTable.finalY + 12;

        // Check if disclaimer fits on current page, otherwise add new page
        if (disclaimerY + 30 > pageHeight) {
            doc.addPage();
            currentY = 20;
        } else {
            currentY = disclaimerY;
        }

        // Disclaimer box
        doc.setDrawColor(200, 150, 50);
        doc.setFillColor(255, 248, 225);
        doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(133, 100, 4);
        doc.text('⚠ Disclaimer', 18, currentY + 6);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 60, 0);
        const disclaimerText = `This search result, generated from the Know Your Approvals (KYA) module on ${timeline} (KYA Reference ID: ${referenceId}), reflects the indicative list of applicable approvals and compliances as per the notified laws and regulations of the Government of ${process.env.NEXT_PUBLIC_STATE_NAME || 'Uttarakhand'}, based on the information provided by the applicant.`;
        const disclaimerNote = 'This is an indicative list and may vary based on specific project requirements and regulatory updates. The applicant is advised to verify the latest requirements with the respective departments.';

        doc.text(doc.splitTextToSize(disclaimerText, pageWidth - 36), 18, currentY + 11);
        doc.setFont('helvetica', 'italic');
        doc.text(doc.splitTextToSize(disclaimerNote, pageWidth - 36), 18, currentY + 21);

        doc.setTextColor(0, 0, 0);

        doc.save(`KYA-Report-${referenceId}.pdf`);
    };

    const openDocument = (documentLink: string | null) => {
        if (!documentLink) return;
        window.open(documentLink, '_blank');
    };

    const getSLAColor = (days: number | string) => {
        console.log('Calculating SLA color for days:', days);
        if (days === 'NA' || !days) return { color: 'inherit' };
        const numDays = typeof days === 'string' ? parseInt(days, 10) : days;
        if (numDays <= 7) return { backgroundColor: '#d4edda', color: '#155724' };
        if (numDays <= 14) return { backgroundColor: '#fff3cd', color: '#856404' };
        return { backgroundColor: '#f8d7da', color: '#721c24' };
    };

    if (loading && approvals.length === 0) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
                <p style={styles.loadingText}>Fetching your required approvals...</p>
            </div>
        );
    }

    if (!loading && approvals.length === 0 && approvalIds.length === 0) {
        return (
            <div style={styles.pageWrapper}>
                <div style={styles.heroSection}>
                    <h1 style={styles.heroTitle}>Your Required Approvals</h1>
                    <p style={styles.heroSubtitle}>No approval data found. Please complete the KYA questionnaire first.</p>
                </div>
                <div style={{ ...styles.mainContainer, textAlign: 'center', padding: '60px 20px' }}>
                    <button
                        onClick={() => router.push('/kya')}
                        style={{ ...styles.backButton, margin: '0 auto' }}
                    >
                        <ArrowLeft size={18} />
                        Go to KYA Questionnaire
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageWrapper}>
            {/* Hero */}
            <div style={styles.heroSection}>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>Your Required Approvals</h1>
                    <p style={styles.heroSubtitle}>
                        Based on your answers to the KYA questionnaire, here are the approvals you need
                    </p>
                </div>
            </div>

            <div style={styles.mainContainer}>
                {/* Summary Cards */}
                <div style={styles.summaryRow}>
                    <div style={styles.summaryCard}>
                        <CheckCircle2 size={28} color="#c41e3a" />
                        <div>
                            <div style={styles.summaryNumber}>{approvals.length}</div>
                            <div style={styles.summaryLabel}>Total Approvals</div>
                        </div>
                    </div>
                    <div style={styles.summaryCard}>
                        <Building2 size={28} color="#2563eb" />
                        <div>
                            <div style={styles.summaryNumber}>{sortedStages.length}</div>
                            <div style={styles.summaryLabel}>Stage Categories</div>
                        </div>
                    </div>
                    <div style={styles.summaryCard}>
                        <Clock size={28} color="#d97706" />
                        <div>
                            <div style={styles.summaryNumber}>{totalTimeline}</div>
                            <div style={styles.summaryLabel}>Max Timeline (Days)</div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={styles.disclaimer}>
                    <Shield size={20} color="#d97706" style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Disclaimer:</strong> This indicative list (Reference ID:{' '}
                        <span style={styles.refBadge}>{referenceId}</span>) was generated on{' '}
                        <strong>{timeline}</strong> based on your inputs. Actual requirements may vary
                        based on regulatory updates and specific project details.
                    </div>
                </div>

                {/* Action Bar */}
                <div style={styles.actionBar}>
                    <button onClick={() => router.push('/kya')} style={styles.backButton}>
                        <ArrowLeft size={18} />
                        Back to KYA
                    </button>
                    <button onClick={() => window.print()} style={styles.downloadButton}>
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>

                {/* Approval Stages */}
                {sortedStages.map((stage, stageIdx) => {
                    const isOpen = openStages[stage] !== false;
                    const items = groupedApprovals[stage];
                    const colors = stageColors[stage] || stageColors['Pre Establishment'];

                    return (
                        <div key={stage} style={styles.stageCard}>
                            {/* Stage Header */}
                            <div
                                style={{
                                    ...styles.stageHeader,
                                    backgroundColor: isOpen ? colors.bg : '#fff',
                                    borderBottom: isOpen ? `2px solid ${colors.border}` : '2px solid #e2e8f0',
                                }}
                                onClick={() => toggleStage(stage)}
                            >
                                <div style={styles.stageHeaderLeft}>
                                    <span style={{
                                        ...styles.stageBadge,
                                        backgroundColor: colors.badge,
                                    }}>
                                        {stageIdx + 1}
                                    </span>
                                    <h3 style={{ ...styles.stageTitle, color: colors.text }}>{stage}</h3>
                                    <span style={{
                                        ...styles.stageCount,
                                        backgroundColor: colors.bg,
                                        color: colors.text,
                                        border: `1px solid ${colors.border}`,
                                    }}>
                                        {items.length} {items.length === 1 ? 'Approval' : 'Approvals'}
                                    </span>
                                </div>
                                {isOpen ? <ChevronUp size={24} color="#64748b" /> : <ChevronDown size={24} color="#64748b" />}
                            </div>

                            {/* Approvals Summary Cards */}
                            {isOpen && (
                                <div className="row mb-4">
                                    <div className="col-12">
                                        <div className="card border-0 shadow-sm bg-light">
                                            <div className="card-body">
                                                <div className="row g-3 text-center">
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-white rounded">
                                                            <h3 className="text-primary mb-1 fw-bold">{approvals.length}</h3>
                                                            <p className="text-muted mb-0 small">Total Approvals Required</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-white rounded">
                                                            <h3 className="text-success mb-1 fw-bold">{groupedApprovals ? Object.keys(groupedApprovals).length : 0}</h3>
                                                            <p className="text-muted mb-0 small">Stage Categories</p>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="p-3 bg-white rounded">
                                                            <h3 className="text-info mb-1 fw-bold">
                                                                {approvals.length > 0 ? Math.max(...approvals.map(a => a.timeline || 0)) : 0}
                                                            </h3>
                                                            <p className="text-muted mb-0 small">Max Timeline (Days)</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* No results fallback */}
                {!loading && approvals.length === 0 && approvalIds.length > 0 && (
                    <div style={styles.emptyState}>
                        <p style={{ fontSize: '1.1rem', color: '#64748b' }}>
                            No service details found for the selected approvals. Please check your KYA configuration.
                        </p>
                    </div>
                )}

                                    {/* Stage Filter Tabs + Search */}
                                    <div className="row mb-4">
                                        <div className="col-12 d-flex flex-wrap justify-content-between align-items-center gap-3">
                                            <div className="btn-group" role="group">
                                                <button
                                                    type="button"
                                                    className={`btn ${selectedStage === null ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setSelectedStage(null)}
                                                >
                                                    All Stages
                                                </button>
                                                {Object.keys(groupedApprovals).map(stage => (
                                                    <button
                                                        key={stage}
                                                        type="button"
                                                        className={`btn ${selectedStage === stage ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setSelectedStage(stage)}
                                                    >
                                                        {stageNames[stage] || stage}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="position-relative" style={{ minWidth: '250px', maxWidth: '350px' }}>
                                                <Search size={16} className="position-absolute top-50 translate-middle-y" style={{ left: '12px', color: '#6c757d' }} />
                                                <input
                                                    type="text"
                                                    className="form-control ps-5"
                                                    placeholder="Search approvals..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Approvals Table */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="card border-0 shadow-sm">
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="fw-semibold" style={{ minWidth: '120px' }}>KYA Reference ID</th>
                                                                <th className="fw-semibold" style={{ minWidth: '180px' }}>Approval Name</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '120px' }}>Department</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '110px' }}>State/Central</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '140px' }}>Stage of Business</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '100px' }}>SLA (Days)</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '80px' }}>Steps</th>
                                                                <th className="fw-semibold" style={{ minWidth: '180px' }}>Documents Required</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '120px' }}>Fee Details</th>
                                                                <th className="fw-semibold" style={{ minWidth: '150px' }}>Legal Provision</th>
                                                                <th className="fw-semibold text-center" style={{ minWidth: '100px' }}>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredApprovals
                                                                .map((item: any) => (
                                                                    <tr key={item.id}>
                                                                        <td className="fw-medium align-middle">
                                                                            {item.kya_reference_id || 'NA'}
                                                                            {item.service_type === 'Mandatory' && (
                                                                                <span style={{ color: 'red', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="fw-medium align-middle">{item.service_name || 'NA'}</td>
                                                                        <td className="align-middle text-center">{item.department || 'NA'}</td>
                                                                        <td className="align-middle text-center">
                                                                            <span className={`badge ${item.is_central_govt_service === 'Y' ? 'bg-primary' : 'bg-success'}`}>
                                                                                {item.is_central_govt_service === 'Y' ? 'Central' : item.is_central_govt_service === 'N' ? 'State' : 'NA'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {stageNames[item.service_category] || item.service_category || 'NA'}
                                                                        </td>
                                                                        <td className="align-middle text-center fw-semibold" style={{ ...getSLAColor(item.timeline || 'NA'), borderRadius: '4px' }}>
                                                                            {item.timeline ? `${item.timeline} Days` : 'NA'}
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {item.steps ? (
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                                                                                    onClick={() => openDocument(item.steps)}
                                                                                    title="View SOP document"
                                                                                >
                                                                                    <CgFileDocument size={18} />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-muted small">NA</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {item.document_link ? (
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                                                                                    onClick={() => openDocument(item.document_link)}
                                                                                    title="View required documents"
                                                                                >
                                                                                    <CgFileDocument size={18} />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-muted small">NA</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="align-middle text-center">
                                                                            {item.fee_structure_document ? (
                                                                                <button
                                                                                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2"
                                                                                    onClick={() => openDocument(item.fee_structure_document)}
                                                                                    title="View fee details"
                                                                                >
                                                                                    <CgFileDocument size={18} />
                                                                                </button>
                                                                            ) : (
                                                                                <span className="text-muted small">NA</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="align-middle small">{item.legal_provision || 'NA'}</td>
                                                                        <td className="align-middle text-center">
                                                                            <a
                                                                                href="/en/login"
                                                                                className="btn btn-sm btn-primary"
                                                                            >
                                                                                Apply
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>

                                                    {approvals.length === 0 && (
                                                        <div className="p-5 text-center text-muted">
                                                            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                                                            <p className="mb-0">No approvals found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div >
                            );
}

                            const styles: Record<string, React.CSSProperties> = {
                                pageWrapper: {
                                minHeight: '100vh',
                            backgroundColor: '#f8fafc',
    },
                            heroSection: {
                                background: 'linear-gradient(135deg, #c41e3a 0%, #8b1225 100%)',
                            padding: '140px 20px 60px',
                            color: '#fff',
                            textAlign: 'center',
    },
                            heroContent: {maxWidth: '700px', margin: '0 auto' },
                            heroTitle: {
                                fontSize: '2.5rem',
                            fontWeight: '700',
                            marginBottom: '16px',
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
                            heroSubtitle: {fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 },
                            mainContainer: {
                                maxWidth: '1200px',
                            margin: '-40px auto 60px',
                            padding: '0 20px',
    },
                            loadingContainer: {
                                display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '100vh',
                            backgroundColor: '#f8fafc',
    },
                            loadingSpinner: {
                                width: '48px',
                            height: '48px',
                            border: '4px solid #e2e8f0',
                            borderTop: '4px solid #c41e3a',
                            borderRadius: '50%',
        // animation is CSS-only, won't work inline, but good enough for structure
    },
                            loadingText: {marginTop: '16px', color: '#64748b', fontSize: '1rem' },
                            summaryRow: {
                                display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px',
    },
                            summaryCard: {
                                display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '20px 24px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    },
                            summaryNumber: {fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' },
                            summaryLabel: {fontSize: '0.875rem', color: '#64748b' },
                            disclaimer: {
                                display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '16px 20px',
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '10px',
                            marginBottom: '24px',
                            fontSize: '0.9rem',
                            color: '#78350f',
                            lineHeight: 1.6,
    },
                            refBadge: {
                                display: 'inline-block',
                            padding: '2px 8px',
                            backgroundColor: '#fde68a',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
    },
                            actionBar: {
                                display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '24px',
    },
                            backButton: {
                                display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
    },
                            downloadButton: {
                                display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            backgroundColor: '#c41e3a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
    },
                            stageCard: {
                                backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            marginBottom: '16px',
                            overflow: 'hidden',
    },
                            stageHeader: {
                                display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '16px 24px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
    },
                            stageHeaderLeft: {display: 'flex', alignItems: 'center', gap: '12px' },
                            stageBadge: {
                                display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '0.9rem',
    },
                            stageTitle: {fontSize: '1.1rem', fontWeight: '700', margin: 0 },
                            stageCount: {
                                padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
    },
                            stageBody: {padding: '0', overflowX: 'auto' },
                            table: {
                                width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.9rem',
    },
                            th: {
                                padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: '600',
                            color: '#64748b',
                            borderBottom: '2px solid #e2e8f0',
                            backgroundColor: '#f8fafc',
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
    },
                            thCenter: {textAlign: 'center' },
                            tr: {borderBottom: '1px solid #f1f5f9' },
                            td: {
                                padding: '14px 16px',
                            verticalAlign: 'middle',
                            color: '#334155',
    },
                            authorityName: {fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' },
                            levelBadge: {
                                display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
    },
                            timelineBadge: {
                                display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
    },
                            docButton: {
                                display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            color: '#3b82f6',
                            cursor: 'pointer',
    },
                            naText: {color: '#94a3b8', fontSize: '0.85rem' },
                            applyButton: {
                                display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 14px',
                            backgroundColor: '#c41e3a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
    },
                            emptyState: {
                                textAlign: 'center',
                            padding: '60px 20px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    },
};
