'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from '@/navigation';
import { ReactNode, useEffect, useMemo, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string; // Use role name like 'admin', 'investor'
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthorized = useMemo(() => {
    if (loading) return true; // Wait for loading to finish
    if (!user) return false; // Not logged in
    if (!requiredRole) return true; // No specific role required

    // For admin routes, also accept TENANT_ADMIN role
    const acceptableRoleNames = requiredRole.toLowerCase() === 'admin'
      ? ['admin', 'tenant_admin']
      : [requiredRole.toLowerCase()];

    // Safety check: Prevent investors from accessing admin routes
    if (requiredRole.toLowerCase() === 'admin' && (user.userType === 'INVESTOR')) {
      return false;
    }

    // Path 1: Direct check on user.roleName (works even if roles list is empty)
    if (user.roleName && acceptableRoleNames.includes(user.roleName.toLowerCase())) {
      return true;
    }

    // Path 2: Check against the fetched roles list by ID
    if (roles && roles.length > 0) {
      const role = roles.find((r: any) => acceptableRoleNames.includes(r.name.toLowerCase()));
      if (role && user.roleId === role.id) {
        return true;
      }
    }

    console.warn(`[ProtectedRoute] User roleId=${user.roleId}, roleName=${user.roleName} not authorized for requiredRole='${requiredRole}'`);
    return false;
  }, [user, roles, loading, requiredRole]);

  useEffect(() => {
    if (!loading && !isAuthorized) {
      if (!user) {
        router.push('/login');
      } else {
        // User is logged in but unauthorized
        // We can redirect them to their appropriate dashboard or show unauthorized
        // For now, we let the render logic show the "Unauthorized Access" message
      }
    }
  }, [loading, isAuthorized, user, router]);

  if (loading) return <div className="d-flex justify-content-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

  if (!user) return null; // Will redirect in useEffect

  if (!isAuthorized) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>
            <strong>Unauthorized Access</strong>
            <p className="mb-0">You do not have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
