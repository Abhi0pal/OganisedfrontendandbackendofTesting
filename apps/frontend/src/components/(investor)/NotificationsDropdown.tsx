'use client';

import { useTranslations } from 'next-intl';

interface NotificationsDropdownProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
}

export default function NotificationsDropdown({
  showNotifications,
  setShowNotifications,
  setShowProfile,
}: NotificationsDropdownProps) {
  const t = useTranslations('InvestorDashboard');

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          setShowProfile(false);
        }}
        className="header-icon-btn"
      >
        <svg className="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
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
  );
}
