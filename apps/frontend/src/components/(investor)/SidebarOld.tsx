"use client";

import { Link } from "@/navigation";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/hooks/useAuth";

// SVG Icons
const Icons = {
  dashboard: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  add: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  list: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  search: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  folder: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  payment: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  bell: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  settings: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  logout: (
    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  chevronLeft: (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  chevronRight: (
    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

const styles = {
  sidebar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    zIndex: 40,
    height: '100vh',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    transition: 'all 0.3s ease-in-out',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  logoSection: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    borderBottom: '1px solid #f3f4f6',
  },
  logo: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  brandName: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: '18px',
  },
  brandSub: {
    color: '#9ca3af',
    fontSize: '10px',
  },
  toggleButton: {
    position: 'absolute' as const,
    right: '-12px',
    top: '80px',
    width: '24px',
    height: '24px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 50,
  },
  nav: {
    flex: 1,
    padding: '24px 12px',
    overflowY: 'auto' as const,
  },
  menuLabel: {
    color: '#9ca3af',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '16px',
    padding: '0 12px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    textDecoration: 'none',
    marginBottom: '4px',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    background: 'linear-gradient(90deg, #ef4444, #dc2626)',
    color: '#ffffff',
    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
  },
  menuItemInactive: {
    color: '#4b5563',
    backgroundColor: 'transparent',
  },
  userSection: {
    padding: '16px',
    borderTop: '1px solid #f3f4f6',
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#374151',
    fontWeight: 600,
    border: '1px solid #e5e7eb',
  },
  userName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  userEmail: {
    fontSize: '12px',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  logoutButton: {
    marginTop: '16px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default function Sidebar() {
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const getUserInitials = () => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
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

  const menuItems = [
    { name: 'Dashboard', icon: Icons.dashboard, href: '/investor/dashboard' },
    { name: 'New Application', icon: Icons.add, href: '/investor/applications/new' },
    { name: 'My Applications', icon: Icons.list, href: '/investor/applications' },
    { name: 'Track Status', icon: Icons.search, href: '/investor/track' },
    { name: 'Documents', icon: Icons.folder, href: '/investor/documents' },
    { name: 'Payments', icon: Icons.payment, href: '/investor/payments' },
    { name: 'Notifications', icon: Icons.bell, href: '/investor/notifications' },
    { name: 'Settings', icon: Icons.settings, href: '/investor/settings' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? '80px' : '256px',
      }}
      className="d-none d-lg-flex flex-column"
    >
      {/* Logo */}
      <div style={styles.logoSection}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={styles.logo}>
              <span style={styles.logoText}>S</span>
            </div>
            <div>
              <span style={styles.brandName}>SWCS</span>
              <p style={styles.brandSub}>Single Window</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ ...styles.logo, margin: '0 auto' }}>
            <span style={styles.logoText}>S</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button onClick={toggleSidebar} style={styles.toggleButton}>
        {collapsed ? Icons.chevronRight : Icons.chevronLeft}
      </button>

      {/* Navigation */}
      <nav style={styles.nav}>
        {!collapsed && <p style={styles.menuLabel}>Menu</p>}
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            style={{
              ...styles.menuItem,
              ...(isActive(item.href) ? styles.menuItemActive : styles.menuItemInactive),
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            title={collapsed ? item.name : ''}
          >
            <span style={{ color: isActive(item.href) ? '#ffffff' : '#9ca3af' }}>
              {item.icon}
            </span>
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div style={styles.userSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={styles.userAvatar}>{getUserInitials()}</div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={styles.userName}>{getDisplayName()}</p>
              <p style={styles.userEmail}>{user?.email || 'Investor'}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={handleLogout} style={styles.logoutButton}>
            {Icons.logout}
            <span>Sign Out</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={handleLogout}
            style={{ ...styles.logoutButton, marginTop: '16px', padding: '10px' }}
            title="Sign Out"
          >
            {Icons.logout}
          </button>
        )}
      </div>
    </aside>
  );
}
