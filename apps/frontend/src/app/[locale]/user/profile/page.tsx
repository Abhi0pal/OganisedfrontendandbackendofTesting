'use client';

import { useAuth } from '@/hooks/useAuth';

export default function UserProfilePage() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="h2">My Profile</h1>
        <p className="text-muted">View and manage your profile information</p>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0"><i className="bi bi-person me-2"></i>Personal Information</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label"><strong>First Name</strong></label>
              <input
                type="text"
                className="form-control"
                value={user?.firstName || ''}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label className="form-label"><strong>Last Name</strong></label>
              <input
                type="text"
                className="form-control"
                value={user?.lastName || ''}
                disabled
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Email Address</strong></label>
            <input
              type="email"
              className="form-control"
              value={user?.email || ''}
              disabled
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Role</strong></label>
            <input
              type="text"
              className="form-control"
              value={(user as any)?.role?.name || ''}
              disabled
            />
          </div>

          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            Contact support to update your profile information
          </div>
        </div>
      </div>
    </div>
  );
}
