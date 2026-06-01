'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Link, useRouter } from '@/navigation';

export default function ResendActivationPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const resolveVerificationHref = (verificationUrl?: string) => {
        if (!verificationUrl) {
            return null;
        }

        try {
            const parsedUrl = new URL(verificationUrl);
            return `${parsedUrl.pathname}${parsedUrl.search}`;
        } catch {
            return verificationUrl;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setError(null);

        try {
            const response = await apiClient.post('/auth/resend-verification', { email });
            const verificationUrl =
                response?.data?.verificationUrl ||
                response?.data?.data?.verificationUrl;
            const href = resolveVerificationHref(verificationUrl);

            if (href) {
                router.push(href);
                return;
            }

            setMessage('Verification email sent successfully! Please check your inbox.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send verification email.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <h4 className="text-center mb-4">Resend Activation Link</h4>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your registered email"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                        {submitting ? 'Sending...' : 'Send Activation Link'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <Link href="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
