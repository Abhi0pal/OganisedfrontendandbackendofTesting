'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from '@/navigation';
import { usePathname, useRouter } from "@/navigation";
import { useLocale, useTranslations } from 'next-intl';
import ThemeSelector from '@/components/ThemeSelector';
import { useTenant } from '@/hooks/common/useTenants';
export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();
  const t = useTranslations('InvestorDashboard');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: tenant } = useTenant(user?.tenantId);

  const changeLanguage = (lang: string) => {
    router.replace(pathname, { locale: lang });
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return user.email || 'User';
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  
  const [fontScale, setFontScale] = useState(1);

  const increaseFont = () => setFontScale((s) => Math.min(s + 0.1, 1.3));
  const decreaseFont = () => setFontScale((s) => Math.max(s - 0.1, 0.8));
  const resetFont = () => setFontScale(0.8);


  return (
    <header className="investor-bg header-main investor-headerflex items-center justify-between shrink-0 d-flex flex-col">
      <div
      style={{ fontSize: `${fontScale}rem` }}
      className="w-full text-xs top-bar"
    >
      <div className="flex items-center justify-between px-4 py-2">
        
        {/* Left section */}
        <div className="flex items-center gap-2">
          <img
            src="/img/indian-flag.png"
            alt="Indian Flag"
            className="w-4 h-3 object-cover"
          />
          <span className="font-medium">Government of India</span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          <a href="#main" className="hover:underline">
            Skip to Main Content
          </a>

          <span className="flex items-center gap-1 cursor-pointer hover:underline">
            Screen Reader
          </span>

          {/* Font controls */}
          <div className="flex items-center gap-1 border-l border-[#cba7a2] pl-3">
            <button onClick={decreaseFont} className="px-1 hover:underline">
              A-
            </button>
            <button onClick={resetFont} className="px-1 font-semibold hover:underline">
              A
            </button>
            <button onClick={increaseFont} className="px-1 hover:underline">
              A+
            </button>
          </div>

          {/* Language selector */}
          <select
            className="bg-transparent border-none outline-none cursor-pointer"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </div>
    </div>
      <div className="flex justify-between items-center w-full mt-2 p-3">
        {/* Left: Search */}
        <div className="relative w-[320px] hidden md:block">
          <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search"
            className="w-full h-[50px] pl-12 pr-4 py-2 rounded-full border-1 border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <select
            className="h-10 rounded-full bg-white px-4 text-sm text-slate-600 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            value={locale}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="en">Eng</option>
            <option value="hi">Hin</option>
          </select>

          <ThemeSelector
            tenantId={tenant?.id ?? user?.tenantId ?? null}
            tenantSlug={tenant?.slug ?? user?.tenantSlug ?? null}
            availableThemes={tenant?.availableThemes ?? user?.availableThemes}
          />

          <button className="header-icon-btn">
            <svg className="header-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 5.33301C4 4.27214 4.42143 3.25473 5.17157 2.50458C5.92172 1.75444 6.93913 1.33301 8 1.33301C9.06087 1.33301 10.0783 1.75444 10.8284 2.50458C11.5786 3.25473 12 4.27214 12 5.33301C12 9.99967 14 11.333 14 11.333H2C2 11.333 4 9.99967 4 5.33301Z" stroke="#121212" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.86719 14C6.97878 14.203 7.14282 14.3722 7.34218 14.4901C7.54154 14.608 7.76891 14.6702 8.00052 14.6702C8.23213 14.6702 8.4595 14.608 8.65886 14.4901C8.85822 14.3722 9.02227 14.203 9.13385 14" stroke="#121212" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="header-icon-btn"
            >
              <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </span>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-slate-800 font-medium text-sm">{t('Notifications')}</h4>
                  <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">3</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 border-l-4 border-green-500 cursor-pointer hover:bg-slate-50">
                    <p className="text-slate-900 text-sm font-medium">{t('Application Approved')}</p>
                    <p className="text-slate-500 text-xs mt-1">LA-2024-001 has been approved</p>
                    <p className="text-slate-400 text-xs mt-1">2 hours ago</p>
                  </div>
                  <div className="px-4 py-3 border-l-4 border-yellow-500 cursor-pointer hover:bg-slate-50">
                    <p className="text-slate-900 text-sm font-medium">{t('Document Required')}</p>
                    <p className="text-slate-500 text-xs mt-1">{t('Upload PAN card for verification')}</p>
                    <p className="text-slate-400 text-xs mt-1">1 day ago</p>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-slate-100">
                  <button className="text-primary text-sm font-medium w-full text-center hover:text-primary">
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-3 pl-3 border-l border-slate-200"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 font-semibold">
                <img src="/img/icons/profile.svg" alt="User profile" />
              </div>
              <div className="leading-tight text-left hidden md:block">
                <p className="text-sm font-medium text-slate-800">{getDisplayName()}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
              </div>
            </button>

            {showProfile && (
              <div className="user-dropdown absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
                <Link prefetch href="/investor/settings" className="flex items-center px-4 py-2 hover:bg-slate-100">
                  {t('Settings')}
                </Link>
                <Link prefetch href="/investor/profile" className="flex items-center px-4 py-2 hover:bg-slate-100">
                  {t('My Profile')}
                </Link>
                <div className="border-t border-slate-100"></div>
                <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 hover:bg-slate-100">
                  {t('Sign Out')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
