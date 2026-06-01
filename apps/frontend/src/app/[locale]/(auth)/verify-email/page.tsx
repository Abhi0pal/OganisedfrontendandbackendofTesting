'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import apiClient from '@/lib/api-client';
import { ACTIVE_TENANT_SLUG_STORAGE_KEY } from '@/hooks/useTheme';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const isRegistered = searchParams.get('registered');
    const { setUser, setResources, fetchRoles } = useAuth();
    const hasTriggeredVerificationRef = useRef(false);

    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('Verifying your email...');
    const registrationMessage =
        'Registration completed successfully. A verification email has been sent to your registered email address. Please click the link to activate your account.';

    useEffect(() => {
        if (!token && !isRegistered) {
            setStatus('error');
            setMessage('No verification token found.');
            return;
        }

        if (token && !hasTriggeredVerificationRef.current) {
            hasTriggeredVerificationRef.current = true;
        } else if (token) {
            return;
        }

        if (token && isRegistered) {
            setStatus('verifying');
            setMessage('Registration successful! Activating your account...');
            handleVerify();
            return;
        }

        if (isRegistered) {
            setStatus('verifying'); // Re-use verifying state for "Check Email" UI
            setMessage(registrationMessage);
            return;
        }

        if (token) {
            handleVerify();
        }
    }, [isRegistered, token]);

    const handleVerify = () => {
        if (!token) return;
        setStatus('verifying');
        setMessage('Verifying your email...');

        apiClient.post('/auth/verify-email', { token })
            .then(async (res) => {
                setStatus('success');
                setMessage('Email verified successfully! Redirecting...');

                const { user, profile, resources } = res.data.data;
                if (typeof window !== 'undefined') {
                    if (user.tenantSlug) {
                        localStorage.setItem(ACTIVE_TENANT_SLUG_STORAGE_KEY, user.tenantSlug);
                    } else {
                        localStorage.removeItem(ACTIVE_TENANT_SLUG_STORAGE_KEY);
                    }
                }

                // Clear previous state
                setUser(null);
                setResources([]);
                await new Promise(resolve => setTimeout(resolve, 50));

                // Set new user data
                setUser({
                    id: user.id,
                    email: user.email,
                    userType: user.userType,
                    roleId: user.roleId,
                    roleName: user.roleName,
                    isEmailVerified: user.isEmailVerified,
                    lastLoginAt: user.lastLoginAt,
                    firstName: profile?.firstName || profile?.fullName || '',
                    lastName: profile?.lastName || '',
                    deptId: profile?.deptId,
                    tenantId: user.tenantId ?? null,
                    projectId: user.projectId ?? null,
                    tenantSlug: user.tenantSlug ?? null,
                    tenantName: user.tenantName ?? null,
                    logoUrl: user.logoUrl ?? null,
                    availableThemes: user.availableThemes ?? [],
                    tenantSource: user.tenantSource ?? null,
                    userTenantId: user.userTenantId ?? null,
                    userProjectId: user.userProjectId ?? null,
                    assignmentTenantId: user.assignmentTenantId ?? null,
                    assignmentProjectId: user.assignmentProjectId ?? null,
                });

                if (resources) {
                    setResources(resources);
                }

                await fetchRoles();

                // Dynamic redirection logic
                let redirectPath = "/";
                let dashboardResource = null;

                if (resources && resources.length > 0) {
                    if (user.userType === 'INVESTOR') {
                        dashboardResource = resources.find((r: any) => r.code === 'INVESTOR_DASHBOARD');
                    } else if (user.userType === 'DEPARTMENT') {
                        if (user.roleName === 'admin') {
                            dashboardResource = resources.find((r: any) => r.code === 'DASHBOARD_VIEW');
                        } else {
                            dashboardResource = resources.find((r: any) => r.code === 'DEPARTMENT_DASHBOARD');
                        }
                    }

                    if (!dashboardResource) {
                        dashboardResource = resources.find((r: any) =>
                            r.code === 'DASHBOARD_VIEW' ||
                            r.code === 'INVESTOR_DASHBOARD' ||
                            r.code === 'DEPARTMENT_DASHBOARD'
                        );
                    }
                }

                if (dashboardResource) {
                    redirectPath = dashboardResource.path;
                } else {
                    if (user.userType === 'INVESTOR') {
                        redirectPath = "/investor/dashboard";
                    } else if (user.roleName === 'admin' || user.roleId === 9) {
                        redirectPath = "/admin/dashboard";
                    } else {
                        redirectPath = "/user/dashboard";
                    }
                }

                setTimeout(() => {
                    router.replace(redirectPath);
                    router.refresh();
                }, 1500);
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Verification failed. Invalid or expired token.');
            });
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-sm p-4 text-center" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="card-body">
                    {/* State: Just Registered / Check Email */}
                    {isRegistered && status !== 'success' && status !== 'error' && (
                        <>
                            <div className="text-primary mb-3">
                                <i className="bi bi-envelope-check" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="card-title">{token ? 'Registration Successful' : 'Check Your Email'}</h5>
                            <p className="card-text text-muted">{message}</p>
                        </>
                    )}

                    {/* State: Token Present, Verifying (Auto) */}
                    {/* Removed manual button, showing verifying state instead */}

                    {/* State: Verifying (Spinner) */}
                    {status === 'verifying' && !isRegistered && (
                        <>
                            <div className="spinner-border text-primary mb-3" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <h5 className="card-title">Verifying...</h5>
                            <p className="card-text text-muted">{message}</p>
                        </>
                    )}

                    {/* State: Success */}
                    {status === 'success' && (
                        <>
                            <div className="text-success mb-3">
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="card-title">Success!</h5>
                            <p className="card-text">{message}</p>
                            <p className="small text-muted">Redirecting...</p>
                        </>
                    )}

                    {/* State: Error */}
                    {status === 'error' && (
                        <>
                            <div className="text-danger mb-3">
                                <i className="bi bi-x-circle-fill" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="card-title">Verification Failed</h5>
                            <p className="card-text text-danger">{message}</p>
                            <button className="btn btn-primary mt-3" onClick={() => router.push('/login')}>
                                Go to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
