'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/navigation';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsLoading(true);

    try {
      // This form should redirect to the main login page
      // It's a legacy form component
      router.push('/login');
    } catch (err: any) {
      setLocalError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card shadow">
          <div className="card-body p-5">
            <h2 className="card-title text-center mb-4">Sign in to your account</h2>

            {localError && (
              <div className="alert alert-danger" role="alert">
                {localError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-100 mb-3"
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="text-center">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-decoration-none">
                  Sign up
                </Link>
              </p>
            </div>

            <hr className="my-4" />

            <div className="alert alert-info mb-0">
              <small>
                <strong>Demo Credentials:</strong><br />
                Admin: admin@example.com / admin@123<br />
                Investor: investor@example.com / investor@123
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
