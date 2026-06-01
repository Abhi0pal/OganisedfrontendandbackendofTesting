'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Link } from '@/navigation';
import { ReactNode } from 'react';

import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function UserLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { logout, user } = useAuth();

  return (
    <ProtectedRoute requiredRole="department_user">
      <div className="d-flex">
        {/* Sidebar */}
        <div className="sidebar d-flex flex-column" style={{ width: '250px', backgroundColor: '#28a745' }}>
          <h2 className="mb-0" style={{ color: 'white', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <i className="bi bi-person me-2"></i>User Portal
          </h2>

          <nav className="nav flex-column flex-grow-1 p-3">
            <Link
              href="/user/dashboard"
              className="nav-link d-flex align-items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/user/profile"
              className="nav-link d-flex align-items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              <i className="bi bi-person"></i>
              <span>Profile</span>
            </Link>
            <Link
              href="/user/settings"
              className="nav-link d-flex align-items-center gap-2"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              <i className="bi bi-gear"></i>
              <span>Settings</span>
            </Link>
          </nav>

          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'white', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <strong>{user?.firstName} {user?.lastName}</strong><br />
              <small style={{ color: 'rgba(255,255,255,0.7)' }}>{user?.email}</small>
            </div>
            <button
              onClick={logout}
              className="btn btn-outline-light btn-sm w-100"
            >
              <i className="bi bi-box-arrow-right me-2"></i>Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="d-flex flex-column flex-grow-1">
          <DashboardHeader />
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
