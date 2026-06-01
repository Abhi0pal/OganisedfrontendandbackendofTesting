'use client';

import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
    const { isLoading } = useLoading();
    const showLoader = isLoading;

    if (!showLoader) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                backdropFilter: 'blur(2px)',
                pointerEvents: 'none',
            }}
        >
            <div className="text-center">
                <div
                    className="spinner-border text-primary"
                    role="status"
                    style={{ width: '3rem', height: '3rem', borderWidth: '0.3rem' }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted fw-semibold">Loading...</p>
            </div>
        </div>
    );
}
