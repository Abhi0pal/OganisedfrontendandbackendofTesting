import React, { useRef, useState } from 'react';

interface PanUploadProps {
    onUpload: (file: File) => void;
    onManualClick: () => void;
}

export default function PanUpload({ onUpload, onManualClick }: PanUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="text-center p-4 h-100 d-flex flex-column justify-content-center align-items-center bg-light">
            <h5 className="mb-4">Upload PAN Card</h5>

            <div
                className={`upload-box p-4 border rounded-3 mb-4 w-100 ${dragActive ? 'border-primary bg-white' : 'border-secondary'}`}
                style={{ borderStyle: 'dashed', cursor: 'pointer' }}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
            >
                <div className="mb-3">
                    <i className="bi bi-cloud-upload fs-1 text-primary"></i>
                </div>
                <h6 className="mb-2">Click or Drag & Drop</h6>
                <p className="text-muted small mb-0">Upload PAN to auto-fill details</p>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="d-none"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                />
            </div>

            <p className="text-muted small">
                Supported formats: JPG, PNG, PDF
            </p>
        </div>
    );
}
