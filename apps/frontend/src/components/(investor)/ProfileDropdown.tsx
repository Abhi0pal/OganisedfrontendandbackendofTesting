'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import type { User } from '@/types/user';

interface ProfileDropdownProps {
  user: User | null;
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  setShowNotifications: (show: boolean) => void;
  getUserInitials: () => string;
  getDisplayName: () => string;
  handleLogout: (e: React.MouseEvent) => Promise<void>;
}

export default function ProfileDropdown({
  user,
  showProfile,
  setShowProfile,
  setShowNotifications,
  getUserInitials,
  getDisplayName,
  handleLogout,
}: ProfileDropdownProps) {
  const t = useTranslations('InvestorDashboard');

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowProfile(!showProfile);
          setShowNotifications(false);
        }}
        className="flex items-center gap-3 pl-3 border-l border-slate-200"
      >
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
          {getUserInitials()}
        </div>
        <div className="leading-tight text-left hidden md:block">
          <p className="text-sm font-medium text-slate-800">{getDisplayName()}</p>
          <p className="text-xs text-slate-500">{user?.email || ''}</p>
        </div>
      </button>

      {showProfile && (
        <div className="user-dropdown absolute right-0 mt-3 w-44 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
          <Link prefetch href="/investor/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            {t('Settings')}
          </Link>
          <Link prefetch href="/investor/profile" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
            {t('My Profile')}
          </Link>
          <div className="border-t border-slate-100"></div>
          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-primary hover:bg-red-50">
            {t('Sign Out')}
          </button>
        </div>
      )}
    </div>
  );
}
