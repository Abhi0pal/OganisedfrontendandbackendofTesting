'use client';

import React, { useState, useRef } from 'react';
import { useGenerateFromPdf } from '@/hooks/useInspections';

interface AiChecklistGeneratorModalProps {
    onClose: () => void;
    onSuccess: (generatedItems: any[]) => void;
}

export const AiChecklistGeneratorModal: React.FC<AiChecklistGeneratorModalProps> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [steeringInstructions, setSteeringInstructions] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const generateMutation = useGenerateFromPdf();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            } else {
                alert('Please upload a valid PDF document.');
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        generateMutation.mutate(
            { file, steeringInstructions },
            {
                onSuccess: (data) => {
                    if (data && data.items) {
                        onSuccess(data.items);
                    }
                },
                onError: (error) => {
                    console.error('Failed to generate checklist', error);
                    alert('Failed to generate checklist. Please try again or check the console for details.');
                }
            }
        );
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-0 bg-dark text-white p-4">
                        <div>
                            <h5 className="modal-title fw-bold">
                                <i className="bi bi-magic me-2 text-warning"></i>
                                Enterprise AI Checklist Generator
                            </h5>
                            <p className="mb-0 text-white-50 small mt-1">Upload a policy PDF and let Gemini extract the compliance requirements automatically.</p>
                        </div>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose} disabled={generateMutation.isPending}></button>
                    </div>
                    
                    <div className="modal-body p-4">
                        {generateMutation.isPending ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h5 className="mt-4 fw-bold">Analyzing Document...</h5>
                                <p className="text-muted">Gemini is reading the policy, extracting structure, and mapping compliance rules. This may take up to 20 seconds.</p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                <div className="col-md-12">
                                    <label className="form-label fw-bold">1. Upload Policy Document (PDF)</label>
                                    <div 
                                        className={`border-2 border-dashed rounded-4 p-5 text-center transition-all ${isDragging ? 'border-primary bg-primary bg-opacity-10' : file ? 'border-success bg-success bg-opacity-10' : 'border-secondary bg-light'}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => !file && fileInputRef.current?.click()}
                                        style={{ cursor: file ? 'default' : 'pointer' }}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileChange} 
                                            accept="application/pdf" 
                                            className="d-none" 
                                        />
                                        
                                        {file ? (
                                            <div>
                                                <i className="bi bi-file-earmark-pdf-fill text-danger fs-1 mb-3 d-block"></i>
                                                <h5 className="fw-bold">{file.name}</h5>
                                                <p className="text-muted mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                                    Remove File
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <i className="bi bi-cloud-arrow-up text-muted fs-1 mb-3 d-block"></i>
                                                <h5 className="fw-bold">Drag & Drop your Act/Policy PDF here</h5>
                                                <p className="text-muted mb-0">or click to browse from your computer</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label fw-bold">
                                        2. Context Steering <span className="text-muted fw-normal">(Optional)</span>
                                    </label>
                                    <textarea 
                                        className="form-control" 
                                        rows={3}
                                        placeholder="e.g., 'Focus only on hazardous waste material storage rules' or 'Extract only requirements needing photographic evidence'"
                                        value={steeringInstructions}
                                        onChange={(e) => setSteeringInstructions(e.target.value)}
                                    ></textarea>
                                    <small className="text-muted mt-1 d-block">
                                        Use this to filter the AI's focus on massive, multi-sector documents.
                                    </small>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="modal-footer bg-light border-0 p-4">
                        <button type="button" className="btn btn-secondary px-4" onClick={onClose} disabled={generateMutation.isPending}>Cancel</button>
                        <button 
                            type="button" 
                            className="btn btn-primary px-4 fw-bold" 
                            onClick={handleSubmit} 
                            disabled={!file || generateMutation.isPending}
                        >
                            <i className="bi bi-magic me-2"></i>
                            Generate Checklist
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
