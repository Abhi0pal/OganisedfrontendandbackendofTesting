'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/navigation';
import { InfoIcon, ChevronRight, ChevronLeft, CheckCircle2, Send, FileText } from 'lucide-react';

export default function KyaPage() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const [categories1, setCategories1] = useState([]);
    const [questions1, setQuestions1] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const categoriesUrl = `${API_URL}/kya/categories`;
        const questionsUrl = `${API_URL}/kya/questions/fetch`;

        const fetchData = async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch data from ${url}`);
            return res.json();
        };

        Promise.all([fetchData(categoriesUrl), fetchData(questionsUrl)])
            .then(([categoriesData, questionsData]) => {
                setCategories1(categoriesData);
                setQuestions1(questionsData);
            })
            .catch((err) => console.error('Error loading essential data:', err))
            .finally(() => setIsLoading(false));
    }, [API_URL]);

    function transformQuestion(data: any) {
        return {
            id: data.id,
            category_id: data.categoryId,
            question_label: data.questionLabel,
            field_type: data.fieldType,
            tool_tip_available: data.isTooltipAvailable,
            tool_tip_content: data.tooltipText,
            required: data.isMandatory,
            is_dependent: data.isDependent,
            show_refrence_document: data.showReferenceDocument,
            parent_question_id: data.parentQuestionId,
            parent_expected_value: data.kyaOptionId,
            option_details: (data.options || []).map((opt: any) => ({
                option_id: opt.id,
                label: opt.optionLabel,
                approval_ids: opt.serviceMappings?.map((svc: any) => svc.serviceId) || [],
            })),
        };
    }

    const parent_questions = useMemo(() => {
        if (!questions1 || questions1.length === 0) return [];
        return questions1.map((q: any) => transformQuestion(q));
    }, [questions1]);

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center">
                    <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#c41e3a' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="h5 text-secondary">Loading questionnaire...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Hero Banner */}
            <section style={{
                background: 'linear-gradient(135deg, #c41e3a 0%, #8b1225 100%)',
                padding: '120px 0 50px',
                color: '#fff',
                textAlign: 'center',
            }}>
                <div className="container">
                    <h1 className="fw-bold mb-3" style={{ fontSize: '2.2rem' }}>Know Your Approval</h1>
                    <p className="mb-0" style={{ opacity: 0.85, maxWidth: 600, margin: '0 auto', fontSize: '1.05rem' }}>
                        Answer a few simple questions to discover the approvals and licenses required for your business in Uttarakhand
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="container" style={{ marginTop: '-30px', paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
                {categories1.length > 0 ? (
                    <KyaWizard categories={categories1} questions={parent_questions} />
                ) : (
                    <div className="alert alert-warning text-center">
                        No categories found. Please contact the administrator.
                    </div>
                )}
            </div>

            <style>{kyaStyles}</style>
        </div>
    );
}

/* ━━━ Wizard Component ━━━ */
const KyaWizard = ({ categories, questions }: any) => {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const activeCat = categories[activeIndex] || {};
    const [answers, setAnswers] = useState<Record<number, any>>({});

    const visibleQuestions = useMemo(() => {
        if (!activeCat.id) return [];
        const inTab = questions.filter((q: any) => q.category_id === activeCat.id);
        return inTab.filter((q: any) => {
            if (!q.is_dependent) return true;
            const parentAns = answers[q.parent_question_id];
            return parentAns !== undefined && parentAns !== '' && parentAns === q.parent_expected_value;
        });
    }, [questions, activeCat, answers]);

    const handleSelect = (qId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [qId]: value }));
    };

    const allAnswered = useMemo(() => {
        if (!visibleQuestions.length) return true;
        return visibleQuestions.every((q: any) => {
            if (!q.required) return true;
            return answers[q.id] !== undefined && answers[q.id] !== '';
        });
    }, [visibleQuestions, answers]);

    const handleNext = () => {
        if (!allAnswered) { alert('Please answer all required questions before proceeding.'); return; }
        setActiveIndex((i) => i + 1);
    };
    const handleBack = () => setActiveIndex((i) => i - 1);

    const getApprovals = () => {
        const collected = new Set();
        Object.keys(answers).forEach((qid) => {
            const selectedanswer = answers[Number(qid)];
            const answeredQuestion = questions.find((q: any) => q.id === Number(qid));
            if (!answeredQuestion?.option_details) return;
            const selectedOption = answeredQuestion.option_details.find((a: any) => a.option_id === selectedanswer);
            if (selectedOption?.approval_ids) {
                selectedOption.approval_ids.forEach((id: number) => collected.add(id));
            }
        });
        return Array.from(collected);
    };

    const handlesubmit = () => {
        if (!allAnswered) { alert('Please answer all required questions before submitting.'); return; }
        const approvalIds = getApprovals();

        // Build Q&A summary for the PDF
        const qaSummary = Object.keys(answers).map((qid) => {
            const question = questions.find((q: any) => q.id === Number(qid));
            if (!question) return null;
            const selectedOptionId = answers[Number(qid)];
            const selectedOption = question.option_details?.find(
                (opt: any) => opt.option_id === selectedOptionId
            );
            return {
                question: question.question_label,
                answer: selectedOption?.label || String(selectedOptionId),
            };
        }).filter(Boolean);

        // Store Q&A in sessionStorage (URL can be too long for large data)
        sessionStorage.setItem('kya_qa_summary', JSON.stringify(qaSummary));

        console.log(approvalIds);

        const url = `/kya/approvals?data=${encodeURIComponent(
            JSON.stringify(approvalIds)
        )}`;

        router.push(url);
    };

    const progress = Math.round(((activeIndex + 1) / categories.length) * 100);

    return (
        <>
            {/* ── Progress Bar ── */}
            <div className="bg-white rounded-top shadow-sm border p-3 pb-0">
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="fw-semibold text-dark" style={{ fontSize: '0.9rem' }}>
                        Step {activeIndex + 1} of {categories.length}
                    </span>
                    <span className="fw-bold" style={{ color: '#c41e3a', fontSize: '0.9rem' }}>
                        {progress}% Complete
                    </span>
                </div>
                <div className="progress mb-3" style={{ height: '8px' }}>
                    <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: '#c41e3a',
                            transition: 'width 0.4s ease',
                        }}
                    />
                </div>

                {/* ── Step Tabs ── */}
                <div className="d-flex flex-nowrap overflow-auto pb-0" style={{ gap: '0' }}>
                    {categories.map((cat: any, idx: number) => {
                        const isActive = idx === activeIndex;
                        const isCompleted = idx < activeIndex;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveIndex(idx)}
                                className={`kya-step-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <span className={`kya-step-num ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                                </span>
                                {cat.categoryName}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Questions ── */}
            <div className="bg-white shadow-sm border border-top-0 rounded-bottom">
                {/* Category Header */}
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-light">
                    <h5 className="mb-0 fw-bold">{activeCat.categoryName}</h5>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold" style={{ fontSize: '0.82rem' }}>
                        {visibleQuestions.length} {visibleQuestions.length === 1 ? 'question' : 'questions'}
                    </span>
                </div>

                {/* Questions Body */}
                <div className="p-4">
                    {visibleQuestions.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <p className="mb-0">No questions in this category to display based on your previous choices.</p>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {visibleQuestions.map((q: any, qIdx: number) => (
                                <div key={q.id} className="col-12 col-md-6 col-lg-4">
                                    <div className="kya-question-card p-3">
                                        <label className="form-label fw-semibold text-dark d-flex align-items-start gap-2 mb-2" style={{ fontSize: '0.9rem' }}>
                                            <span className="kya-q-num">{qIdx + 1}</span>
                                            <span style={{ flex: 1 }}>
                                                {q.question_label}
                                                {q.required && <span className="text-danger ms-1">*</span>}
                                            </span>
                                            {q.tool_tip_available && (
                                                <span className="text-primary" title={q.tool_tip_content} style={{ cursor: 'pointer' }}>
                                                    <InfoIcon size={16} />
                                                </span>
                                            )}
                                            {q.show_refrence_document && (
                                                <span className="text-primary" title="View reference" style={{ cursor: 'pointer' }}>
                                                    <FileText size={16} />
                                                </span>
                                            )}
                                        </label>

                                        {q.field_type?.trim() === 'Dropdown' ? (
                                            <select
                                                className={`form-select ${answers[q.id] ? 'kya-select-filled' : ''}`}
                                                value={answers[q.id] ?? ''}
                                                onChange={(e) => {
                                                    handleSelect(q.id, e.target.value === '' ? '' : Number(e.target.value));
                                                }}
                                            >
                                                <option value="">-- Select --</option>
                                                {(q.option_details || []).map((opt: any) => (
                                                    <option key={opt.option_id} value={opt.option_id}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : q.field_type?.trim() === 'Text' ? (
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Type your answer..."
                                                value={answers[q.id] ?? ''}
                                                onChange={(e) => handleSelect(q.id, e.target.value)}
                                            />
                                        ) : (
                                            <div className="text-danger small bg-danger bg-opacity-10 p-2 rounded">
                                                Unsupported field type: {q.field_type}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
                    <div>
                        {activeIndex > 0 && (
                            <button onClick={handleBack} className="btn btn-outline-secondary d-flex align-items-center gap-1 fw-semibold">
                                <ChevronLeft size={18} /> Back
                            </button>
                        )}
                    </div>
                    <div>
                        {activeIndex < categories.length - 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={!allAnswered}
                                className="btn d-flex align-items-center gap-1 fw-semibold text-white"
                                style={{ backgroundColor: '#c41e3a', opacity: allAnswered ? 1 : 0.5 }}
                            >
                                Save & Continue <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handlesubmit}
                                disabled={!allAnswered}
                                className="btn btn-success d-flex align-items-center gap-2 fw-semibold"
                                style={{ opacity: allAnswered ? 1 : 0.5 }}
                            >
                                <Send size={16} /> Get Approvals
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

/* ━━━ Scoped Styles ━━━ */
const kyaStyles = `
    .kya-step-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border: none;
        background: none;
        color: #6c757d;
        font-size: 0.85rem;
        font-weight: 500;
        white-space: nowrap;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s ease;
    }
    .kya-step-tab:hover {
        color: #495057;
        background-color: #f8f9fa;
    }
    .kya-step-tab.active {
        color: #c41e3a;
        font-weight: 700;
        border-bottom-color: #c41e3a;
    }
    .kya-step-tab.completed {
        color: #198754;
    }

    .kya-step-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        min-width: 24px;
        border-radius: 50%;
        background-color: #e9ecef;
        color: #6c757d;
        font-size: 0.72rem;
        font-weight: 700;
    }
    .kya-step-num.active {
        background-color: #c41e3a;
        color: #fff;
    }
    .kya-step-num.completed {
        background-color: #d1e7dd;
        color: #198754;
    }

    .kya-question-card {
        border: 1px solid #e9ecef;
        border-radius: 10px;
        transition: border-color 0.2s, box-shadow 0.2s;
        height: 100%;
    }
    .kya-question-card:hover {
        border-color: #c41e3a33;
        box-shadow: 0 2px 8px rgba(196, 30, 58, 0.06);
    }

    .kya-q-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        min-width: 22px;
        border-radius: 50%;
        background-color: #c41e3a;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        margin-top: 1px;
    }

    .kya-select-filled {
        border-color: #198754 !important;
        background-color: #f8fff8 !important;
    }

    .progress {
        background-color: #e9ecef;
        border-radius: 100px;
        overflow: hidden;
    }
    .progress-bar {
        border-radius: 100px;
    }
`;
