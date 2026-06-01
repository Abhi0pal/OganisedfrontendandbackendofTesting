'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from "./AuthForm";
import { useTranslations } from "next-intl";
import { useRouter } from '@/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("LoginPage");

  useEffect(() => {
    if (loading || !user) return;

    const normalizedUserType = String(user.userType || '').toUpperCase();
    const normalizedRole = String(user.roleName || '').toLowerCase();

    if (normalizedUserType === 'INVESTOR') {
      router.replace('/investor/dashboard');
      return;
    }
    if (normalizedUserType === 'CIS_USER') {
      router.replace('/department/inspection');
      return;
    }
    if (normalizedRole === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    if (normalizedRole === 'tenant_admin') {
      router.replace('/admin/workflow-builder');
      return;
    }
    if (normalizedUserType === 'INSPECTOR' || normalizedRole === 'inspector') {
      router.replace('/department/inspector/dashboard');
      return;
    }
    router.replace('/department/dashboard');
  }, [loading, user, router]);

  // Remove redirect logic from here - AuthForm.tsx handles it properly
  // This was causing a race condition where all users were being
  // redirected to /admin/dashboard regardless of their actual role

  // ✅ Show spinner during initial load
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // ✅ After loading completes, show login form if no user
  if (!user) {
    return (

      <AuthForm />

    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Redirecting...</span>
      </div>
    </div>
  );
}
