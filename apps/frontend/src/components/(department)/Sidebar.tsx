'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTranslations } from 'next-intl';
import { useTenant } from '@/hooks/common/useTenants';
import {
    getDepartmentMenuByRole,
    DepartmentSidebarIconKey,
    DepartmentSidebarMenuItem,
} from './sidebar/menus';

/* -------------------------
   Icons
   ------------------------- */
const Icons = {
    dashboard: (        
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.22222 10.8889H2.88889C2.65314 10.8889 2.42705 10.9826 2.26035 11.1492C2.09365 11.3159 2 11.542 2 11.7778V17.1111C2 17.3469 2.09365 17.573 2.26035 17.7397C2.42705 17.9063 2.65314 18 2.88889 18H8.22222C8.45797 18 8.68406 17.9063 8.85076 17.7397C9.01746 17.573 9.11111 17.3469 9.11111 17.1111V11.7778C9.11111 11.542 9.01746 11.3159 8.85076 11.1492C8.68406 10.9826 8.45797 10.8889 8.22222 10.8889ZM7.33334 16.2222H3.77778V12.6666H7.33334V16.2222ZM17.1111 2H11.7778C11.542 2 11.3159 2.09365 11.1492 2.26035C10.9826 2.42705 10.8889 2.65314 10.8889 2.88889V8.22222C10.8889 8.45797 10.9826 8.68406 11.1492 8.85076C11.3159 9.01746 11.542 9.11111 11.7778 9.11111H17.1111C17.3469 9.11111 17.573 9.01746 17.7397 8.85076C17.9063 8.68406 18 8.45797 18 8.22222V2.88889C18 2.65314 17.9063 2.42705 17.7397 2.26035C17.573 2.09365 17.3469 2 17.1111 2ZM16.2222 7.33334H12.6666V3.77778H16.2222V7.33334ZM17.1111 13.5555H15.3334V11.7778C15.3334 11.542 15.2397 11.3159 15.073 11.1492C14.9063 10.9826 14.6802 10.8889 14.4445 10.8889C14.2087 10.8889 13.9826 10.9826 13.8159 11.1492C13.6492 11.3159 13.5555 11.542 13.5555 11.7778V13.5555H11.7778C11.542 13.5555 11.3159 13.6492 11.1492 13.8159C10.9826 13.9826 10.8889 14.2087 10.8889 14.4445C10.8889 14.6802 10.9826 14.9063 11.1492 15.073C11.3159 15.2397 11.542 15.3334 11.7778 15.3334H13.5555V17.1111C13.5555 17.3469 13.6492 17.573 13.8159 17.7397C13.9826 17.9063 14.2087 18 14.4445 18C14.6802 18 14.9063 17.9063 15.073 17.7397C15.2397 17.573 15.3334 17.3469 15.3334 17.1111V15.3334H17.1111C17.3469 15.3334 17.573 15.2397 17.7397 15.073C17.9063 14.9063 18 14.6802 18 14.4445C18 14.2087 17.9063 13.9826 17.7397 13.8159C17.573 13.6492 17.3469 13.5555 17.1111 13.5555ZM8.22222 2H2.88889C2.65314 2 2.42705 2.09365 2.26035 2.26035C2.09365 2.42705 2 2.65314 2 2.88889V8.22222C2 8.45797 2.09365 8.68406 2.26035 8.85076C2.42705 9.01746 2.65314 9.11111 2.88889 9.11111H8.22222C8.45797 9.11111 8.68406 9.01746 8.85076 8.85076C9.01746 8.68406 9.11111 8.45797 9.11111 8.22222V2.88889C9.11111 2.65314 9.01746 2.42705 8.85076 2.26035C8.68406 2.09365 8.45797 2 8.22222 2ZM7.33334 7.33334H3.77778V3.77778H7.33334V7.33334Z" fill="black"/>
        </svg>
    ),
    reports: (        
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.4546 7.81818H8.54546C8.35257 7.81818 8.16758 7.89481 8.03119 8.03119C7.89481 8.16758 7.81818 8.35257 7.81818 8.54546V17.2727C7.81818 17.4656 7.89481 17.6506 8.03119 17.787C8.16758 17.9234 8.35257 18 8.54546 18H11.4546C11.6475 18 11.8324 17.9234 11.9688 17.787C12.1052 17.6506 12.1818 17.4656 12.1818 17.2727V8.54546C12.1818 8.35257 12.1052 8.16758 11.9688 8.03119C11.8324 7.89481 11.6475 7.81818 11.4546 7.81818ZM10.7273 16.5454H9.27273V9.27273H10.7273V16.5454ZM17.2727 2H14.3636C14.1708 2 13.9858 2.07662 13.8493 2.21301C13.713 2.3494 13.6364 2.53439 13.6364 2.72727V17.2727C13.6364 17.4656 13.713 17.6506 13.8493 17.787C13.9858 17.9234 14.1708 18 14.3636 18H17.2727C17.4656 18 17.6506 17.9234 17.787 17.787C17.9234 17.6506 18 17.4656 18 17.2727V2.72727C18 2.53439 17.9234 2.3494 17.787 2.21301C17.6506 2.07662 17.4656 2 17.2727 2ZM16.5454 16.5454H15.0909V3.45454H16.5454V16.5454ZM5.63636 12.1818H2.72727C2.53439 12.1818 2.3494 12.2584 2.21301 12.3948C2.07662 12.5312 2 12.7162 2 12.9091V17.2727C2 17.4656 2.07662 17.6506 2.21301 17.787C2.3494 17.9234 2.53439 18 2.72727 18H5.63636C5.82924 18 6.01423 17.9234 6.15062 17.787C6.28701 17.6506 6.36364 17.4656 6.36364 17.2727V12.9091C6.36364 12.7162 6.28701 12.5312 6.15062 12.3948C6.01423 12.2584 5.82924 12.1818 5.63636 12.1818ZM4.90909 16.5454H3.45454V13.6364H4.90909V16.5454Z" fill="black"/>
        </svg>
    ),
    chevronDown: (
        <svg width="15" height="9" viewBox="0 0 15 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.5791 0.41897C14.3125 0.150622 13.9518 0 13.5759 0C13.2 0 12.8394 0.150622 12.5728 0.41897L7.46443 5.51935L2.42724 0.41897C2.16063 0.150622 1.79999 0 1.42407 0C1.04815 0 0.687506 0.150622 0.420902 0.41897C0.287532 0.552909 0.181674 0.712262 0.109433 0.887835C0.0371927 1.06341 0 1.25173 0 1.44193C0 1.63213 0.0371927 1.82045 0.109433 1.99602C0.181674 2.17159 0.287532 2.33095 0.420902 2.46489L6.45414 8.57382C6.58642 8.70886 6.7438 8.81605 6.9172 8.88919C7.0906 8.96234 7.27658 9 7.46443 9C7.65227 9 7.83826 8.96234 8.01165 8.88919C8.18505 8.81605 8.34243 8.70886 8.47471 8.57382L14.5791 2.46489C14.7125 2.33095 14.8183 2.17159 14.8906 1.99602C14.9628 1.82045 15 1.63213 15 1.44193C15 1.25173 14.9628 1.06341 14.8906 0.887835C14.8183 0.712262 14.7125 0.552909 14.5791 0.41897Z" fill="#A1A1A1" />
        </svg>
    ),
    chevronRight: (        
        <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.95204 5.31714C4.92007 5.41432 4.86527 5.50675 4.78763 5.59442L1.05564 9.80101C0.940628 9.93049 0.79607 9.99678 0.621964 9.9999C0.447997 10.0029 0.30081 9.93657 0.180403 9.80101C0.0601343 9.66529 0 9.50087 0 9.30774C0 9.11461 0.0601343 8.95019 0.180403 8.81447L3.5628 5.00218L0.180403 1.18988C0.0655318 1.06025 0.00671239 0.897305 0.00394441 0.701058C0.00131484 0.504968 0.0601343 0.339063 0.180403 0.203344C0.30081 0.0677811 0.446682 -2.10968e-07 0.61802 -2.10968e-07C0.789357 -2.10968e-07 0.93523 0.0677811 1.05564 0.203344L4.78763 4.40993C4.86527 4.4976 4.92007 4.59003 4.95204 4.68721C4.98402 4.7844 5 4.88939 5 5.00218C5 5.11496 4.98402 5.21995 4.95204 5.31714Z" fill="white"/>
        </svg>
    ),
    chevronLeft: (                
        <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0.0479551 5.31714C0.0799252 5.41432 0.134731 5.50675 0.212373 5.59442L3.94436 9.80101C4.05937 9.93049 4.20393 9.99678 4.37804 9.9999C4.552 10.0029 4.69919 9.93657 4.8196 9.80101C4.93987 9.66529 5 9.50087 5 9.30774C5 9.11461 4.93987 8.95019 4.8196 8.81447L1.4372 5.00218L4.8196 1.18988C4.93447 1.06025 4.99329 0.897305 4.99606 0.701058C4.99869 0.504968 4.93987 0.339063 4.8196 0.203344C4.69919 0.0677811 4.55332 -2.10968e-07 4.38198 -2.10968e-07C4.21064 -2.10968e-07 4.06477 0.0677811 3.94436 0.203344L0.212373 4.40993C0.134731 4.4976 0.0799252 4.59003 0.0479551 4.68721C0.015985 4.7844 1.51206e-07 4.88939 1.51206e-07 5.00218C1.51206e-07 5.11496 0.015985 5.21995 0.0479551 5.31714Z" fill="white"/>
        </svg>
    ),
    dot: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    ),
    services: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
        </svg>
    ),
    inspections: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
};

/* -------------------------
   Component
   ------------------------- */
const normalizeLogoUrl = (value?: string | null) => {
    const logoUrl = String(value || '').trim();
    if (!logoUrl) return '';
    if (/^(https?:)?\/\//i.test(logoUrl) || logoUrl.startsWith('/') || logoUrl.startsWith('data:')) {
        return logoUrl;
    }
    return `/${logoUrl.replace(/^\/+/, '')}`;
};

export default function DepartmentSidebar() {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const { data: tenant } = useTenant(user?.tenantId);
    const tenantLogoUrl = normalizeLogoUrl(tenant?.logo_url || user?.logoUrl) || '/img/logo.png';
    const tenantLogoAlt = tenant?.name?.trim() || user?.tenantName?.trim() || 'Invest Uttarakhand';

    const withLocale = (href: string) => {
        return href;
    };

    const menuItems = getDepartmentMenuByRole({
        roleId: Number(user?.roleId || 0),
        roleName: user?.roleName,
        tenantSlug: tenant?.slug ?? user?.tenantSlug ?? null,
        tenantName: tenant?.name ?? user?.tenantName ?? null,
    });
    const resolveIcon = (key?: DepartmentSidebarIconKey) =>
        key ? (Icons[key] as React.ReactNode) : null;

    const getOpenFromPath = (path: string) => {
        for (const item of menuItems) {
            if (item.children) {
                if (item.href && path === item.href) return item.name;
                if (item.children.some((c) => path.startsWith(c.href))) return item.name;
            }
        }
        return null;
    };

    const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => getOpenFromPath(pathname));

    useEffect(() => {
        setOpenSubmenu(getOpenFromPath(pathname));
    }, [pathname]); // eslint-disable-line

    /*const toggleSubmenu = (name: string) => {
        setOpenSubmenu((prev) => (prev === name ? null : name));
    };*/

    /* -------------------------
         COLLAPSE STATE (NEW)
      ------------------------- */
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
    if (isSidebarOpen) {
        setOpenSubmenu(getOpenFromPath(pathname));
    } else {
        setOpenSubmenu(null);
    }
    }, [pathname, isSidebarOpen]);

    const toggleSubmenu = (name: string) => {
    if (!isSidebarOpen) return;
    setOpenSubmenu((prev) => (prev === name ? null : name));
    };

    const isParentActive = (item: DepartmentSidebarMenuItem) => {
        if (item.href && pathname === item.href) return true;
        if (item.children) {
            return item.children.some((c) => pathname === c.href || pathname.startsWith(c.href));
        }
        return false;
    };

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
            className={`tailwind-scope investor-sidebar investor-bg fixed top-0 left-0 z-40
                h-[100vh]
                ${isSidebarOpen ? "w-64" : "w-20"}
                overflow-hidden hidden lg:flex flex-col
                transition-all duration-300 ease-in-out`}
            aria-label="Sidebar"
            >
            {/* Logo Section */}
            <div className="px-4 py-3 text-lg font-semibold flex items-center gap-2 border-b-1">
                <img
                src={tenantLogoUrl}
                alt={tenantLogoAlt}
                className={`logo-investuk transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                />

                <button
                type="button"
                aria-label="Toggle sidebar"
                onClick={() => {
                    setIsSidebarOpen((v) => !v);
                    setOpenSubmenu(null);
                }}
                className={`sidebar-toggle ml-auto flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 ${isSidebarOpen ? "" : "mx-auto"
                    }`}
                >
                {isSidebarOpen ? Icons.chevronLeft : Icons.chevronRight}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2.5 py-4 space-y-6 overflow-y-auto" aria-label="Department navigation">
                <p className="menu-title px-3 text-xs font-semibold tracking-wider uppercase mb-3">Menu</p>

                {menuItems.map((item) => {
                    const hasChildren = Boolean(item.children && item.children.length > 0);
                    const parentActive = isParentActive(item);
                    const isOpen = openSubmenu === item.name;

                    if (!hasChildren) {
                        return (
                            <Link
                                key={item.name}
                                href={withLocale(item.href || '#')}
                                className={`menu-link group flex items-center gap-3 py-2 rounded-md no-underline px-3 ${pathname === item.href ? 'active' : ''}`}
                            >
                                <span className="relative">{resolveIcon(item.iconKey)}</span>
                                {isSidebarOpen && <span>{item.name}</span>}
                            </Link>
                        );
                    }

                    return (
                        <details
                            key={item.name}
                            className={`group menu-dropdown ${parentActive ? 'active' : ''}`}
                            open={isOpen}
                            onToggle={(e) => {
                                const target = e.currentTarget as HTMLDetailsElement;
                                if (target.open) {
                                    setOpenSubmenu(item.name);
                                } else if (openSubmenu === item.name) {
                                    setOpenSubmenu(null);
                                }
                            }}
                        >
                            <summary
                                className="menu-link flex items-start justify-between py-2 rounded-md cursor-pointer list-none px-3"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleSubmenu(item.name);
                                }}
                            >
                                <span className="flex items-start gap-3">
                                    <span className="relative">{resolveIcon(item.iconKey)}</span>
                                    <span className="m-txt grow">{item.name}</span>
                                    <span className={`transition mt-3 ${isOpen ? 'rotate-180' : ''}`}>{Icons.chevronDown}</span>
                                </span>
                            </summary>
                            <div className="ml-4 mt-1 space-y-1">
                                {item.children!.map((child) => {
                                    const childActive = pathname === child.href;
                                    return (
                                        <Link
                                            key={child.href}
                                            href={withLocale(child.href)}
                                            className={`sidebar-submenu-link sm-txt group flex items-center gap-2 px-3 py-2 text-sm rounded-md ${childActive ? 'active' : ''}`}
                                        >
                                            <span className="w-2 h-2 bg-slate-400 rounded-full relative top-[2px] group-hover:bg-primary"></span>
                                            <span className="flex-1">{child.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </details>
                    );
                })}
            </nav>
        </aside>
    );
}
