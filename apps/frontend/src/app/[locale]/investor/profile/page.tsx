'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import {
  useMasterOptions,
  type MasterOption,
} from '@/hooks/investor/inprinciple/useMasterOptions';

type InvestorProfile = {
  firstName?: string | null;
  lastName?: string | null;
  panCard?: string | null;
  adhaarNumber?: string | null;
  mobileNumber?: string | null;
  countryName?: string | null;
  stateName?: string | null;
  cityName?: string | null;
  districtName?: string | null;
  pinCode?: string | null;
  address?: string | null;
  legalEntityName?: string | null;
};

type AuthProfileResponse = {
  user: {
    email?: string | null;
    userType?: string | null;
  };
  profile?: InvestorProfile | null;
};

type ProfileFormState = {
  firstName: string;
  lastName: string;
  legalEntityName: string;
  panCard: string;
  adhaarNumber: string;
  countryName: string;
  stateName: string;
  cityName: string;
  districtName: string;
  pinCode: string;
  address: string;
};

const emptyPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const toProfileForm = (profile?: InvestorProfile | null): ProfileFormState => ({
  firstName: profile?.firstName ?? '',
  lastName: profile?.lastName ?? '',
  legalEntityName: profile?.legalEntityName ?? '',
  panCard: profile?.panCard ?? '',
  adhaarNumber: profile?.adhaarNumber ?? '',
  countryName: profile?.countryName ?? '',
  stateName: profile?.stateName ?? '',
  cityName: profile?.cityName ?? '',
  districtName: profile?.districtName ?? '',
  pinCode: profile?.pinCode ?? '',
  address: profile?.address ?? '',
});

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    const responseMessage = response?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const normalizeMasterLabel = (value: string | null | undefined) =>
  String(value ?? '').trim().toLowerCase();

const findOptionValueByLabel = (options: MasterOption[], label: string) => {
  const target = normalizeMasterLabel(label);
  if (!target) return '';
  const match = options.find((option) => normalizeMasterLabel(String(option.label)) === target);
  return match ? String(match.value) : '';
};

function ProfileDetailsCard({
  email,
  profile,
}: {
  email: string;
  profile?: InvestorProfile | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState>(() => toProfileForm(profile));
  const [countryId, setCountryId] = useState('');
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const { data: countries = [] } = useMasterOptions('COUNTRY');
  const resolvedCountryId = countryId || findOptionValueByLabel(countries, form.countryName);
  const { data: states = [] } = useMasterOptions('STATE', resolvedCountryId, !!resolvedCountryId);
  const resolvedStateId = stateId || findOptionValueByLabel(states, form.stateName);
  const { data: districts = [] } = useMasterOptions('DISTRICT', resolvedStateId, !!resolvedStateId);
  const resolvedDistrictId = districtId || findOptionValueByLabel(districts, form.districtName);

  const countryOptions = useMemo(
    () => countries.map((option) => ({ value: String(option.value), label: option.label })),
    [countries],
  );
  const stateOptions = useMemo(
    () => states.map((option) => ({ value: String(option.value), label: option.label })),
    [states],
  );
  const districtOptions = useMemo(
    () => districts.map((option) => ({ value: String(option.value), label: option.label })),
    [districts],
  );

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: ProfileFormState) => {
      const response = await apiClient.patch('/auth/profile', payload);
      return response.data as { message?: string };
    },
    onSuccess: async (response) => {
      setAlert({
        type: 'success',
        text: response.message || 'Profile updated successfully.',
      });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
    onError: (error) => {
      setAlert({
        type: 'danger',
        text: getErrorMessage(error, 'Profile update failed.'),
      });
    },
  });

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextCountryId = e.target.value;
    const selected = countryOptions.find((option) => option.value === nextCountryId);

    setCountryId(nextCountryId);
    setStateId('');
    setDistrictId('');
    setForm((prev) => ({
      ...prev,
      countryName: selected?.label ?? '',
      stateName: '',
      districtName: '',
    }));
  };

  const handleStateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextStateId = e.target.value;
    const selected = stateOptions.find((option) => option.value === nextStateId);

    setStateId(nextStateId);
    setDistrictId('');
    setForm((prev) => ({
      ...prev,
      stateName: selected?.label ?? '',
      districtName: '',
    }));
  };

  const handleDistrictChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextDistrictId = e.target.value;
    const selected = districtOptions.find((option) => option.value === nextDistrictId);

    setDistrictId(nextDistrictId);
    setForm((prev) => ({
      ...prev,
      districtName: selected?.label ?? '',
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);
    updateProfileMutation.mutate(form);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light">
        <h5 className="mb-0">
          <i className="bi bi-person-lines-fill me-2"></i>
          Profile Details
        </h5>
      </div>
      <div className="card-body">
        {alert && (
          <div className={`alert alert-${alert.type}`} role="alert">
            {alert.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                value={form.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                value={form.lastName}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" value={email} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-control"
                value={profile?.mobileNumber ?? ''}
                disabled
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Legal Entity Name</label>
              <input
                type="text"
                name="legalEntityName"
                className="form-control"
                value={form.legalEntityName}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">PAN Card</label>
              <input
                type="text"
                name="panCard"
                className="form-control"
                value={form.panCard}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Aadhaar Number</label>
              <input
                type="text"
                name="adhaarNumber"
                className="form-control"
                value={form.adhaarNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Pin Code</label>
              <input
                type="text"
                name="pinCode"
                className="form-control"
                value={form.pinCode}
                onChange={handleInputChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Country</label>
              <select
                className="form-control"
                value={resolvedCountryId}
                onChange={handleCountryChange}
              >
                <option value="">Select country</option>
                {countryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">State</label>
              <select
                className="form-control"
                value={resolvedStateId}
                onChange={handleStateChange}
                disabled={!resolvedCountryId}
              >
                <option value="">Select state</option>
                {stateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">City</label>
              <input
                type="text"
                name="cityName"
                className="form-control"
                value={form.cityName}
                onChange={handleInputChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">District</label>
              <select
                className="form-control"
                value={resolvedDistrictId}
                onChange={handleDistrictChange}
                disabled={!resolvedStateId}
              >
                <option value="">Select district</option>
                {districtOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-control"
                rows={3}
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasswordCard() {
  const [form, setForm] = useState(emptyPasswordForm);
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post('/auth/change-password', payload);
      return response.data as { message?: string };
    },
    onSuccess: (response) => {
      setAlert({
        type: 'success',
        text: response.message || 'Password updated successfully.',
      });
      setForm(emptyPasswordForm);
    },
    onError: (error) => {
      setAlert({
        type: 'danger',
        text: getErrorMessage(error, 'Password update failed.'),
      });
    },
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAlert(null);

    if (form.newPassword !== form.confirmPassword) {
      setAlert({
        type: 'danger',
        text: 'New password and confirm password must match.',
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-light">
        <h5 className="mb-0">
          <i className="bi bi-shield-lock me-2"></i>
          Update Password
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted small">
          To change your password, enter your current password and then set a new password.
        </p>

        {alert && (
          <div className={`alert alert-${alert.type}`} role="alert">
            {alert.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              className="form-control"
              value={form.currentPassword}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              name="newPassword"
              className="form-control"
              value={form.newPassword}
              onChange={handleInputChange}
              minLength={6}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              value={form.confirmPassword}
              onChange={handleInputChange}
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-outline-primary w-100"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function InvestorProfilePage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<AuthProfileResponse>({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    },
  });

  const email = data?.user?.email || user?.email || '';
  const isInvestor =
    String(data?.user?.userType || user?.userType || '').toUpperCase() === 'INVESTOR';
  const profile = data?.profile;
  const profileKey = JSON.stringify(toProfileForm(profile));

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!isInvestor) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <h1 className="h4 mb-2">Profile</h1>
          <p className="text-muted mb-0">This page is available only for investor accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="mb-4">
        <h1 className="h2 mb-1">My Profile</h1>
        <p className="text-muted mb-0">
          Applicants can update their profile details. Email and mobile number will remain locked.
        </p>
      </div>

      <div className="alert alert-info" role="alert">
        <strong>Note:</strong> Email address and mobile number are not editable. The rest of the profile details can be updated.
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-8">
          <ProfileDetailsCard key={profileKey} email={email} profile={profile} />
        </div>
        <div className="col-12 col-xl-4">
          <PasswordCard />
        </div>
      </div>
    </div>
  );
}
