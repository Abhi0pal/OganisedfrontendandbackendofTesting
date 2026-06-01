'use client';

import React from 'react';
import { format, parse } from 'date-fns';

type FormPreviewProps = {
    config: any;
    values: Record<string, any>;
    addMoreValues: Record<number, any[]>;
    onClose: () => void;
};

export function FormPreview({ config, values, addMoreValues, onClose }: FormPreviewProps) {
    const pages = config?.pages ?? [];
    const allFields = React.useMemo(() => {
        const out: any[] = [];
        (pages || []).forEach((p: any) => p.categories?.forEach((c: any) => c.fields?.forEach((f: any) => out.push(f))));
        return out;
    }, [pages]);

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=1000,height=800');
        if (!printWindow) {
            alert('Please allow pop-ups to print the form');
            return;
        }

        const htmlContent = generatePrintHTML();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Wait for content to load, then print
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    const generatePrintHTML = () => {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Application Form - ${config?.serviceName || 'Form'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1f2937;
            line-height: 1.6;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            border-bottom: 3px solid #7a1e1c;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #7a1e1c;
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header p {
            color: #6b7280;
            font-size: 14px;
        }
        .page {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .page-title {
            background: linear-gradient(135deg, #a52a2a 0%, #7a1e1c 100%);
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            border-radius: 6px;
        }
        .category {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .category-title {
            background-color: #f3f4f6;
            padding: 12px 15px;
            border-left: 4px solid #7a1e1c;
            font-weight: 600;
            font-size: 15px;
            color: #1f2937;
            margin-bottom: 15px;
        }
        .field-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .field {
            page-break-inside: avoid;
        }
        .field-label {
            font-weight: 600;
            font-size: 14px;
            color: #374151;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .field-label .required {
            color: #dc2626;
            font-size: 16px;
        }
        .field-value {
            font-size: 15px;
            color: #4b5563;
            padding: 10px;
            background-color: #f9fafb;
            border-left: 2px solid #e5e7eb;
            border-radius: 4px;
            padding-left: 12px;
        }
        .field-value.empty {
            color: #9ca3af;
            font-style: italic;
        }
        .badge {
            display: inline-block;
            background-color: #f5e6e6;
            color: #7a1e1c;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 13px;
            margin-right: 5px;
            margin-bottom: 5px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .table th {
            background-color: #e5e7eb;
            color: #1f2937;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            border: 1px solid #d1d5db;
        }
        .table td {
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            font-size: 14px;
        }
        .table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .container {
                padding: 20px;
            }
            .page {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${config?.serviceName || 'Application Form'}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
`;

        pages.forEach((page: any) => {
            html += `<div class="page">`;
            html += `<div class="page-title">${page.name || 'Form Page'}</div>`;

            page.categories?.forEach((category: any) => {
                html += `<div class="category">`;
                html += `<div class="category-title">${category.name}</div>`;
                html += `<div class="field-row">`;

                category.fields?.forEach((field: any) => {
                    if (field.input_type === 'addmore') {
                        html += `</div><div class="field">`;
                        html += `<div class="field-label">${field.label || field.field_code}`;
                        if (field.is_mandatory === 'Y') html += `<span class="required">*</span>`;
                        html += `</div>`;

                        const groupId = field.id;
                        const rows = addMoreValues[groupId] || [];

                        if (rows.length > 0) {
                            const columns = field.columns || [];
                            html += `<table class="table">`;
                            html += `<thead><tr><th>#</th>`;
                            columns.forEach((col: any) => {
                                html += `<th>${col.label || col.field_code}</th>`;
                            });
                            html += `</tr></thead><tbody>`;

                            rows.forEach((row, rowIdx) => {
                                html += `<tr><td>${rowIdx + 1}</td>`;
                                columns.forEach((col: any) => {
                                    const cellValue = row[col.field_code];
                                    html += `<td>${cellValue || '-'}</td>`;
                                });
                                html += `</tr>`;
                            });

                            html += `</tbody></table>`;
                        } else {
                            html += `<div class="field-value empty">No entries added</div>`;
                        }

                        html += `</div><div class="field-row">`;
                        return;
                    }

                    const value = values[field.field_code];
                    let displayValue = '-';

                    if (value !== null && value !== undefined && value !== '') {
                        if ((field?.input_type === 'select' || field?.input_type === 'multiselect') && field?.options) {
                            if (Array.isArray(value)) {
                                displayValue = value.map((v: any) => {
                                    const option = field.options.find((o: any) => String(o.value) === String(v));
                                    return option?.label || String(v);
                                }).join(', ');
                            } else {
                                const option = field.options.find((o: any) => String(o.value) === String(value));
                                displayValue = option?.label || String(value);
                            }
                        } else if (typeof value === 'object') {
                            if (value.fileName || value.name) {
                                displayValue = `[File: ${value.fileName || value.name}]`;
                            } else {
                                displayValue = JSON.stringify(value);
                            }
                        } else {
                            displayValue = String(value);
                        }
                    }

                    html += `<div class="field">`;
                    html += `<div class="field-label">${field.label || field.field_code}`;
                    if (field.is_mandatory === 'Y') html += `<span class="required">*</span>`;
                    html += `</div>`;
                    html += `<div class="field-value ${displayValue === '-' ? 'empty' : ''}">${displayValue}</div>`;
                    html += `</div>`;
                });

                html += `</div></div>`;
            });

            html += `</div>`;
        });

        html += `
        <div class="footer">
            <p>This is an official application form preview. Please verify all information before submission.</p>
        </div>
    </div>
</body>
</html>
        `;

        return html;
    };

    // Helper to parse and format dates
    const formatDateForDisplay = (value: any, inputType: string): string => {
        if (!value) return '';

        try {
            const valueStr = String(value).trim();
            let dateObj: Date | null = null;

            // Try ISO format first (2026-04-12)
            if (valueStr.includes('-') && valueStr.length === 10) {
                dateObj = new Date(valueStr);
            }
            
            // Try DD/MM/YYYY format
            if (!dateObj || isNaN(dateObj.getTime())) {
                try {
                    dateObj = parse(valueStr, 'dd/MM/yyyy', new Date());
                } catch (e) {
                    // Fall through
                }
            }

            // Try MM/DD/YYYY format
            if (!dateObj || isNaN(dateObj.getTime())) {
                try {
                    dateObj = parse(valueStr, 'MM/dd/yyyy', new Date());
                } catch (e) {
                    // Fall through
                }
            }

            // Fallback: try JavaScript's Date constructor
            if (!dateObj || isNaN(dateObj.getTime())) {
                dateObj = new Date(valueStr);
            }

            if (dateObj && !isNaN(dateObj.getTime())) {
                if (inputType === 'time') {
                    return format(dateObj, 'HH:mm');
                }
                return format(dateObj, 'dd/MM/yyyy');
            }
        } catch (e) {
            // Silent fail, return original value
        }

        return String(value);
    };

    const formatValue = (field: any, value: any) => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-muted">-</span>;
        }

        // Handle date and time fields
        if (field?.input_type === 'date' || field?.input_type === 'time' || field?.input_type === 'daterange') {
            if (field?.input_type === 'daterange' && Array.isArray(value)) {
                return (
                    <div>
                        {value.map((date, idx) => (
                            <div key={idx} className="badge bg-light text-dark me-2 mb-1">
                                {formatDateForDisplay(date, 'date')}
                            </div>
                        ))}
                    </div>
                );
            }
            return <span>{formatDateForDisplay(value, field?.input_type)}</span>;
        }

        // Handle dropdown/select fields - look up label from options
        if ((field?.input_type === 'select' || field?.input_type === 'multiselect') && field?.options) {
            if (Array.isArray(value)) {
                // Multiselect - multiple values
                return (
                    <div>
                        {value.map((v, idx) => {
                            const option = field.options.find((o: any) => String(o.value) === String(v));
                            return (
                                <div key={idx} className="badge bg-light text-dark me-2 mb-1">
                                    {option?.label || String(v)}
                                </div>
                            );
                        })}
                    </div>
                );
            } else {
                // Single select
                const option = field.options.find((o: any) => String(o.value) === String(value));
                return <span>{option?.label || String(value)}</span>;
            }
        }

        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return (
                    <div>
                        {value.map((item, idx) => (
                            <div key={idx} className="badge bg-light text-dark me-2 mb-1">
                                {String(item)}
                            </div>
                        ))}
                    </div>
                );
            }
            // File object or complex object
            if (value.fileName || value.name) {
                return (
                    <div className="text-truncate">
                        <i className="pi pi-file me-2"></i>
                        {value.fileName || value.name}
                    </div>
                );
            }
            return <span className="text-muted">[Complex Value]</span>;
        }

        return <span>{String(value)}</span>;
    };

    const renderFieldValue = (field: any) => {
        const fieldCode = field?.field_code;
        if (!fieldCode) return null;

        const value = values[fieldCode];

        if (field.input_type === 'addmore') {
            const groupId = field.id;
            const rows = addMoreValues[groupId] || [];
            if (rows.length === 0) {
                return <span className="text-muted">No entries added</span>;
            }

            const columns = field.columns || [];
            return (
                <div className="table-responsive mt-2">
                    <table className="table table-sm table-bordered mb-0">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '40px' }}>#</th>
                                {columns.map((col: any) => (
                                    <th key={col.field_code}>{col.label || col.field_code}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    <td className="fw-semibold">{rowIdx + 1}</td>
                                    {columns.map((col: any) => (
                                        <td key={col.field_code}>
                                            {formatValue(col, row[col.field_code])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return formatValue(field, value);
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-bottom" style={{ background: 'linear-gradient(135deg, #a52a2a 0%, #7a1e1c 100%)' }}>
                        <h5 className="modal-title fw-bold text-white">
                            <i className="pi pi-eye me-2"></i>
                            Application Form Preview
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>

                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                        {pages.map((page: any, pageIdx: number) => (
                            <div key={page.id || pageIdx} className="mb-5">
                                <div style={{
                                    background: 'linear-gradient(135deg, #a52a2a 0%, #7a1e1c 100%)',
                                    color: 'white',
                                    padding: '15px 20px',
                                    borderRadius: '6px',
                                    marginBottom: '20px',
                                    fontWeight: '600',
                                    fontSize: '16px'
                                }}>
                                    {page.name || `Page ${pageIdx + 1}`}
                                </div>

                                {page.categories?.map((category: any) => (
                                    <div key={category.id} className="mb-4" style={{
                                        backgroundColor: 'white',
                                        padding: '20px',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        marginBottom: '15px'
                                    }}>
                                        <h6 className="fw-semibold text-dark mb-3" style={{
                                            fontSize: '15px',
                                            borderBottom: '2px solid #7a1e1c',
                                            paddingBottom: '10px',
                                            color: '#7a1e1c'
                                        }}>
                                            {category.name}
                                        </h6>

                                        <div className="row g-3">
                                            {category.fields?.map((field: any) => {
                                                if (field.input_type === 'addmore') {
                                                    return (
                                                        <div key={field.id} className="col-12">
                                                            <div className="preview-field">
                                                                <label className="fw-semibold text-dark" style={{ fontSize: '0.95rem', color: '#1f2937' }}>
                                                                    {field.label || field.field_code}
                                                                    {field.is_mandatory === 'Y' && (
                                                                        <span className="text-danger ms-1">*</span>
                                                                    )}
                                                                </label>
                                                                <div className="mt-2">
                                                                    {renderFieldValue(field)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={field.id}
                                                        className={`col-12 col-md-${field.grid_span === 6 ? 6 : field.grid_span === 4 ? 4 : field.grid_span === 3 ? 3 : 12}`}
                                                    >
                                                        <div className="preview-field">
                                                            <label className="fw-semibold text-dark" style={{ fontSize: '0.95rem', color: '#1f2937' }}>
                                                                {field.label || field.field_code}
                                                                {field.is_mandatory === 'Y' && (
                                                                    <span className="text-danger ms-1">*</span>
                                                                )}
                                                            </label>
                                                            <div className="mt-2 text-break" style={{
                                                                padding: '10px',
                                                                backgroundColor: '#f9fafb',
                                                                borderLeft: '2px solid #7a1e1c',
                                                                borderRadius: '4px',
                                                                color: '#4b5563'
                                                            }}>
                                                                {renderFieldValue(field)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer border-top" style={{ gap: '10px' }}>
                        <button
                            type="button"
                            className="btn"
                            style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                border: '1px solid #d1d5db'
                            }}
                            onClick={onClose}
                        >
                            <i className="pi pi-times me-2"></i>
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn text-white"
                            style={{
                                background: 'linear-gradient(135deg, #a52a2a 0%, #7a1e1c 100%)',
                                border: 'none'
                            }}
                            onClick={handlePrint}
                        >
                            <i className="pi pi-print me-2"></i>
                            Print / PDF
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .preview-field {
                    padding: 0.75rem 0;
                }

                .preview-field label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.95rem;
                }

                .preview-field > div {
                    font-size: 0.95rem;
                    color: #374151;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
