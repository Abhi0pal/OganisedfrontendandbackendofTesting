'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing token.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setSubmitting(true);

        try {
            await apiClient.post('/auth/reset-password', { token, password });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="alert alert-danger">
                    Invalid or missing token. <Link href="/forgot-password">Request a new link</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
                <h4 className="text-center mb-4">Reset Password</h4>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                        {submitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="text-center mt-3">
                    <Link href="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
