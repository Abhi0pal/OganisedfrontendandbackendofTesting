
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, Link } from '@/navigation';
import apiClient from '@/lib/api-client'; // default export per your useAuth.ts

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const [localError, setLocalError] = useState('');
  // Align with useAuth.ts: it returns { user, loading, error, setUser, ... }
  const { user, loading, error, setUser } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  /**
   * Register a new user via your backend.
   * Adjust the payload keys and URL if your Nest DTO differs.
   * Your useAuth.ts uses apiClient.get('/auth/profile'); we'll follow the same base.
   */
  const registerUser = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const payload = { email, password, firstName, lastName };
    const res = await apiClient.post('/auth/register', payload);
    return res.data; // may be { user, token } or direct user object based on API
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      const data = await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      // Set the auth store user depending on the response shape
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(data);
      }
      // Redirect handled in useEffect below
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed';
      setLocalError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  useEffect(() => {
    // Derive authentication from presence of user (since useAuth doesn't expose isAuthenticated)
    const isAuthenticated = !!user;
    if (!isAuthenticated) return;

    /**
     * Your stored user (from useAuth.ts -> setUser) has:
     * { id, email, userType, roleId, roleName, isEmailVerified, lastLoginAt, firstName?, lastName? }
     * So use roleName primarily, but tolerate alternate shapes if they ever arrive.
     */
    const roleName: string | undefined =
      (user as any)?.roleName ??
      (user as any)?.role?.name ??
      (typeof (user as any)?.role === 'string' ? (user as any).role : undefined);

    if (roleName === 'admin') {
      router.push('/admin/dashboard');
    } else if (roleName === 'investor') {
      router.push('/investor/dashboard');
    } else if (roleName === 'user') {
      router.push('/user/dashboard');
    } else {
      router.push('/landing');
    }
  }, [user, router]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <div style={{ width: '100%', maxWidth: '450px' }}>
        <div className="card shadow">
          <div className="card-body p-5">
            <h2 className="card-title text-center mb-4">Create your account</h2>

            {(error || localError) && (
              <div className="alert alert-danger" role="alert">
                {error || localError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className="form-control"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className="form-control"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Password (min 6 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-100 mb-3"
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating account...
                  </>
                ) : (
                  'Sign up'
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="mb-0">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-decoration-none">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};
