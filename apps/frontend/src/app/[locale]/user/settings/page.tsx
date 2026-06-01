'use client';

export default function UserSettingsPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="h2">Settings</h1>
        <p className="text-muted">Manage your account settings and preferences</p>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0"><i className="bi bi-gear me-2"></i>Preferences</h5>
        </div>
        <div className="card-body">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="emailNotifications"
              defaultChecked
            />
            <label className="form-check-label" htmlFor="emailNotifications">
              Email Notifications
            </label>
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="pushNotifications"
              defaultChecked
            />
            <label className="form-check-label" htmlFor="pushNotifications">
              Push Notifications
            </label>
          </div>

          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="twoFactor"
            />
            <label className="form-check-label" htmlFor="twoFactor">
              Two-Factor Authentication
            </label>
          </div>

          <button className="btn btn-primary mt-3">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
