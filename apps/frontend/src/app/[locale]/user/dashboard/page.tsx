'use client';

import { useAuth } from '@/hooks/useAuth';

export default function UserDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="h2">Welcome, {user?.firstName}!</h1>
        <p className="text-muted">You are logged in as a regular user</p>
      </div>

      <div className="row g-4">
        {/* Quick Stats */}
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-person-circle" style={{ fontSize: '2.5rem', color: '#28a745' }}></i>
              <h5 className="card-title mt-3">Profile</h5>
              <p className="card-text text-muted">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-envelope" style={{ fontSize: '2.5rem', color: '#28a745' }}></i>
              <h5 className="card-title mt-3">Email</h5>
              <p className="card-text text-muted small">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-shield-check" style={{ fontSize: '2.5rem', color: '#28a745' }}></i>
              <h5 className="card-title mt-3">Role</h5>
              <p className="card-text text-muted">
                <span className="badge bg-success">{(user as any)?.role?.name}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="card mt-4 shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0"><i className="bi bi-info-circle me-2"></i>Getting Started</h5>
        </div>
        <div className="card-body">
          <p className="text-muted">
            Welcome to the user dashboard! This is your personal space where you can:
          </p>
          <ul className="list-unstyled">
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>View your profile information
            </li>
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>Update your account settings
            </li>
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>Access your personalized content
            </li>
            <li className="mb-2">
              <i className="bi bi-check-circle text-success me-2"></i>Manage your preferences
            </li>
          </ul>
        </div>
      </div>

      {/* Account Info */}
      <div className="card mt-4 shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0"><i className="bi bi-person-badge me-2"></i>Account Information</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>First Name:</strong> {user?.firstName}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Last Name:</strong> {user?.lastName}</p>
              <p><strong>Status:</strong> <span className="badge bg-success">Active</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
