'use client';

import { useState, useRef, useEffect } from 'react';
import { Link, useRouter } from '@/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from "next-intl";
export default function HeaderAuth() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const t = useTranslations("HomePage");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // Calls useAuth logout
      router.push('/'); // Redirect to home page
      router.refresh(); // Refresh to update auth state
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="header-cta-wrap">
        <div className="dropdown me-2 me-sm-4">
          <button className="btn btn-primary rounded-5 dropdown-toggle" data-bs-toggle="dropdown">
            {t("Login as")}
          </button>
          <ul className="dropdown-menu">
            <li><Link className="dropdown-item" href="/login">{t("Investor")}</Link></li>
            <li><Link className="dropdown-item" href="/register">{t("Department")}</Link></li>
            <li><Link className="dropdown-item" href="/login">{t("Exhibitor/Organiser")}</Link></li>
            <li><Link className="dropdown-item" href="/login">{t("Mega Incentive Login")}</Link></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="header-cta-wrap" ref={profileRef}>
      <div className="dropdown me-2 me-sm-4">
        <button
          className="btn btn-outline-primary rounded-5 dropdown-toggle d-flex align-items-center"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
               style={{ width: '30px', height: '30px', fontSize: '14px' }}>
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <span className="d-none d-sm-inline">{user.email}</span>
        </button>

        <ul className={`dropdown-menu dropdown-menu-end ${isProfileOpen ? "show" : ""}`}>
          <li>
            <div className="dropdown-item-text">
              <small className="text-muted">Logged in as</small>
              <div className="fw-semibold">{user.roleName}</div>
            </div>
          </li>
          <li><hr className="dropdown-divider" /></li>
          {user.roleName === 'admin' && (
            <li>
              <Link className="dropdown-item" href="/admin/dashboard">
                <i className="bi bi-speedometer2 me-2"></i> Admin Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link className="dropdown-item" href="/profile">
              <i className="bi bi-person me-2"></i> My Profile
            </Link>
          </li>
          <li>
            <Link className="dropdown-item" href="/settings">
              <i className="bi bi-gear me-2"></i> Settings
            </Link>
          </li>
          <li><hr className="dropdown-divider" /></li>
          <li>
            <button className="dropdown-item text-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
