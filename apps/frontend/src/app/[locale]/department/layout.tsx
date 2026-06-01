"use client";

import { ReactNode, useEffect, useRef } from 'react';
import '../investor/investor.css'; // Re-use investor styles for consistent dashboard look
import DepartmentHeader from '@/components/(department)/Header';
import DepartmentSidebar from '@/components/(department)/Sidebar';
import DepartmentFooter from '@/components/(department)/Footer';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { resolveTenantTheme, useTheme } from '@/hooks/useTheme';
import { useTenant } from '@/hooks/common/useTenants';

const bottomImages: Record<string, string> = {
  cpcb: '/img/img-bottom/cpcb.png',
  rera: '/img/bg-pattern/rera.png',
  nmc: '/img/img-bottom/nmc.png',
  default: '/img/bg-pattern/default.png',
};

const themeToImageKey: Record<string, string> = {
  default: 'default',
  cpcb: 'cpcb',
  trera: 'rera',
  rera: 'rera',
  nmc: 'nmc',
};

function DepartmentLayoutContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  const { user } = useAuth();
  const { data: tenant } = useTenant(user?.tenantId);
  const { theme, changeTheme, mounted } = useTheme();
  const themeSource = tenant?.availableThemes ?? user?.availableThemes;
  const hasConfiguredThemes = Array.isArray(themeSource) && themeSource.length > 0;
  const tenantTheme = hasConfiguredThemes
    ? resolveTenantTheme(tenant?.slug ?? user?.tenantSlug, themeSource)
    : 'default';
  const imageKey = themeToImageKey[theme] ?? themeToImageKey[tenantTheme] ?? 'default';
  const bottomImage = bottomImages[imageKey];

  // Track the last tenant theme we applied so we only call changeTheme when it
  // actually changes — NOT on every theme update from other components.
  const appliedTenantTheme = useRef('');
  useEffect(() => {
    if (!mounted) return;
    if (tenantTheme !== 'default' && tenantTheme !== appliedTenantTheme.current) {
      appliedTenantTheme.current = tenantTheme;
      changeTheme(tenantTheme);
    }
  }, [mounted, tenantTheme, changeTheme]); // 'theme' intentionally omitted

  return (
    <div className="tailwind-scope" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <DepartmentSidebar />

      {/* Main Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease-in-out',
        }}
        className={`investor-main-content ${collapsed ? 'sidebar-collapsed' : ''}`}
      >
        <DepartmentHeader />

        <main className='' style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </main>
        
        <img src={bottomImage} alt="Dotted Background" className="w-full h-auto pt-5" />

        <DepartmentFooter />
      </div>
    </div>
  );
}

export default function DepartmentLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DepartmentLayoutContent>{children}</DepartmentLayoutContent>
    </SidebarProvider>
  );
}
