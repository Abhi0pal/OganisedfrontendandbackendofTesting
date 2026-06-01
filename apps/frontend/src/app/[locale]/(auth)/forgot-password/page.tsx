'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/api-client';
import { Link } from '@/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        setError(null);

        try {
            await apiClient.post('/auth/forgot-password', { email });
            setMessage('If your email is registered, you will receive a password reset link.');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to request password reset.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <h4 className="text-center mb-4">Forgot Password</h4>

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
                        {submitting ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <Link href="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
