"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import "primeicons/primeicons.css";

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        submenuRef.current &&
        !submenuRef.current.contains(event.target as Node)
      ) {
        setActiveSubmenu(null);
      }
    };


    const navigationItems = [
        {
            id: 'home',
            label: 'Dashboard',
            icon: 'pi pi-home',
            href: '/admin/dashboard',
            submenus: [
                { label: 'Overview', href: '/admin/dashboard/overview' },
                { label: 'Analytics', href: '/dashboard/analytics' },
                { label: 'Reports', href: '/dashboard/reports' },
            ]
        },
        {
            id: 'manageTenant',
            label: 'Manage Tenant',
            icon: 'pi pi-building',
            href: '/en/admin/tenant/tenants',
            submenus: [
                { label: 'Tenant', href: '/admin/tenant/tenants' },
                { label: 'Projects', href: '/admin/tenant/project' },
                { label: 'Modules', href: '/admin/tenant/module' },                
            ]
        },
        {
            id: 'roleAndUser',
            label: 'Role & User',
            icon: 'pi pi-users',
            href: '/project',
            submenus: [
                { label: 'Manage Role', href: '' },
                { label: 'Manage User', href: '' },
                { label: 'User Mapping', href: '' },              
            ]
        },
        {
            id: 'manageMaster',
            label: 'Manage Master',
            icon: 'pi pi-database',
            href: '/admin/dynamic-master/definitions',
            submenus: [
                { label: 'Define Master', href: '/admin/dynamic-master/definitions' },
                { label: 'Manage Master', href: '/admin/dynamic-master/data' },
            ]
        },
        {
            id: 'buildForm',
            label: 'Build Form',
            icon: 'pi pi-file-edit',
            href: '/admin/master/form-type',
            submenus: [
               // { label: 'Manage Form Type', href: '/admin/master/form-type' },
                { label: 'Manage Form Section', href: '/admin/master/form-category' },
                { label: 'Manage Form Field', href: '/admin/master/form-field' },
                { label: 'Map Fields with Forms', href: '/admin/master/form-builder' },
            ]
        },
        {
            id: 'manageWorkflow',
            label: 'Manage Workflow',
            icon: 'pi pi-sitemap',
            href: '/permission',
            submenus: [
                { label: 'Build Workflow', href: '' },
                { label: 'Manage Communication', href: '' },
            ]
        },
        {
            id: 'reportAndDashboard',
            label: 'Report & Dashboard',
            icon: 'pi pi-chart-bar',
            href: '/permission',
            submenus: [
                { label: 'Configure', href: 'http://pocey.online:8088/' },
                { label: 'Report', href: '' },
            ]
        },
        //Data Migration
        {
            id: 'dataMigration',
            label: 'Data Migration',
            icon: 'pi pi-sparkles',
            href: '',
            submenus: [
                { label: 'Migrate Through Create Script', href: '/admin/data-migration/ai-data-migration-create-script' },
                { label: 'Migrate Through Excel/CSV', href: '/admin/data-migration/ai-data-migration-excel-csv' }
            ]
        },
        //Data Migration
        {
            id: 'agenticAI',
            label: 'Agentic AI',
            icon: 'pi pi-sparkles',
            href: '/admin/ai-form-generate',
            submenus: [
                { label: 'Track Progress', href: '/admin/ai-form-generate' },
                { label: 'Build SRS', href: '/admin/frs-to-bap-srs' },
                { label: 'Build Your Application', href: '/admin/ai-form-generate' },
                { label: 'Generate Test Cases', href: '/admin/test-case-generation' },
                { label: 'Execute Test Cases', href: '/admin/test-case-execution' },
            ]
        },
    ];

    if (isProfileOpen || activeSubmenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }


    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, activeSubmenu]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigationItems = [
    {
      id: "home",
      label: "Dashboard",
      icon: "pi pi-home",
      href: "/admin/dashboard",
      submenus: [
        { label: "Overview", href: "/admin/dashboard/overview" },
        { label: "Analytics", href: "/dashboard/analytics" },
        { label: "Reports", href: "/dashboard/reports" },
      ],
    },
    {
      id: "manageTenant",
      label: "Manage Tenant",
      icon: "pi pi-building",
      href: "/en/admin/tenant/tenants",
      submenus: [
        { label: "Tenant", href: "/admin/tenant/tenants" },
        { label: "Projects", href: "/admin/tenant/project" },
        { label: "Modules", href: "/admin/tenant/module" },
      ],
    },
    {
      id: "roleAndUser",
      label: "Role & User",
      icon: "pi pi-users",
      href: "/project",
      submenus: [
        { label: "Roles", href: "/admin/user-management/roles" },
        { label: "Permissions", href: "/admin/user-management/permissions" },
        {
          label: "Permissions for Role",
          href: "/admin/user-management/role-permissions",
        },
        {
          label: "Users",
          href: "/admin/user-management/users",
        },

        {
          label: "User Role Assignment",
          href: "/admin/user-management/user-role-assignment",
        },

        {
          label: "User Assignment Overrides",
          href: "/admin/user-management/permission-overrides",
        },

        {
          label: "User Assignment Scope",
          href: "/admin/user-management/user-management-scope",
        },
      ],
    },
    {
      id: "manageMaster",
      label: "Manage Master",
      icon: "pi pi-database",
      href: "/admin/dynamic-master/definitions",
      submenus: [
        { label: "Define Master", href: "/admin/dynamic-master/definitions" },
        { label: "Manage Master", href: "/admin/dynamic-master/data" },
      ],
    },
    {
      id: "buildForm",
      label: "Build Form",
      icon: "pi pi-file-edit",
      href: "/admin/master/form-type",
      submenus: [
        // { label: 'Manage Form Type', href: '/admin/master/form-type' },
        { label: "Add Service", href: "/admin/master/service" },
        { label: "Manage Form Section", href: "/admin/master/form-category" },
        { label: "Manage Form Field", href: "/admin/master/form-field" },
        { label: "Map Fields with Forms", href: "/admin/master/form-builder" },
      ],
    },
    {
      id: "dms",
      label: "DMS",
      icon: "pi pi-file-edit",
      href: "",
      submenus: [
        { label: "Manage Document Type", href: "/admin/master/document-type" },
        { label: "Manage Document Checkpoint", href: "/admin/master/document-checkpoint" },
        { label: "Manage Document", href: "/admin/master/document" },
      ],
    },
    {
      id: "manageWorkflow",
      label: "Manage Workflow",
      icon: "pi pi-sitemap",
      href: "/permission",
      submenus: [
        { label: "Build Workflow", href: "/admin/workflow-builder" },
        { label: "Manage Communication", href: "" },
      ],
    },
    {
      id: "reportAndDashboard",
      label: "Report & Dashboard",
      icon: "pi pi-chart-bar",
      href: "/permission",
      submenus: [
        { label: "Configure", href: "http://pocey.online:8088/" },
        { label: "Report", href: "" },
      ],
    },
    {
      id: "dataMigration",
      label: "Data Migration",
      icon: "pi pi-sparkles",
      href: "",
      submenus: [
        //{ label: 'AI Form Generate', href: '/admin/ai-form-generate' },
        //{ label: 'Test Cases Generate', href: '/admin/generate_test_case' }
      ],
    },
    {
      id: "agenticAI",
      label: "Agentic AI",
      icon: "pi pi-sparkles",
      href: "/admin/ai-form-generate",
      submenus: [
        { label: "Track Progress", href: "/admin/ai-form-generate" },
        { label: "Build SRS", href: "/admin/frs-to-bap-srs" },
        { label: "Build Your Application", href: "/admin/ai-form-generate" },
        { label: "Generate Test Cases", href: "/admin/test-case-generation" },
        { label: "Execute Test Cases", href: "/admin/test-case-execution" },
      ],
    },
  ];

  const pathname = usePathname();

  const isMenuActive = (item: (typeof navigationItems)[0]) => {
    return item.submenus.some((s) => s.href && pathname.includes(s.href));
  };

  const isSubmenuItemActive = (href: string) =>
    !!href && pathname.includes(href);

  // Auto-open the submenu that matches the current page on route change
  useEffect(() => {
    const matched = navigationItems.find((item) =>
      item.submenus.some((s) => s.href && pathname.includes(s.href)),
    );
    setActiveSubmenu(matched ? matched.id : null);
  }, [pathname]);

  const toggleSubmenu = (menuId: string) => {
    setActiveSubmenu(activeSubmenu === menuId ? null : menuId);
  };

  return (
    <header className="position-relative">
      <div className="d-flex justify-content-between align-items-center px-4 py-3">
        {/* Logo */}
        <div className="d-flex align-items-center">
          <Link href="/" prefetch>
            <Image
              src="/img/logo-main.svg"
              alt="Invest Uttarakhand"
              width={120}
              height={54}
              priority
            />
          </Link>
        </div>
        <div className="top-center">
          <span className="premium-title">
            Business Aggregating Platform <strong>V2.0</strong>
          </span>
        </div>
        {/* User Menu */}
        <div ref={profileRef}>
          <div className="dropdown">
            <button
              className="btn btn-light d-flex align-items-center gap-2 border"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ borderRadius: "50px", padding: "0.5rem 1rem" }}
            >
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: "32px",
                  height: "32px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="d-none d-md-inline fw-medium">
                {user?.email || "User"}
              </span>
              <i
                className={`bi bi-chevron-${isProfileOpen ? "up" : "down"}`}
              ></i>
            </button>

            <ul
              className={`dropdown-menu dropdown-menu-end ${isProfileOpen ? "show" : ""}`}
              style={{ marginTop: "0.5rem" }}
            >
              <li>
                <div className="dropdown-item-text">
                  <small className="text-muted">Logged in as</small>
                  <div className="fw-semibold">{user?.roleName || "User"}</div>
                  <small className="text-muted">{user?.email}</small>
                </div>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  href="/profile"
                  prefetch
                  onClick={() => setIsProfileOpen(false)}
                >
                  <i className="bi bi-person me-2"></i> My Profile
                </Link>
              </li>
              <li>
                <Link
                  className="dropdown-item"
                  href="/settings"
                  prefetch
                  onClick={() => setIsProfileOpen(false)}
                >
                  <i className="bi bi-gear me-2"></i> Settings
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Nav bar */}
      <div className="main-navbar">
        <div className="navbar-items d-flex align-items-center gap-1 px-3 py-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleSubmenu(item.id)}
              className={`text-decoration-none d-flex align-items-center rounded nav-link border-0 ${activeSubmenu === item.id || isMenuActive(item) ? "active-nav-link" : ""}`}
            >
              <i
                className={`${item.icon} me-1`}
                style={{ fontSize: "12px" }}
              ></i>
              {item.label}
              <i
                className={`pi pi-chevron-${activeSubmenu === item.id ? "up" : "down"} ms-1`}
                style={{ fontSize: "9px" }}
              ></i>
            </button>
          ))}
        </div>
      </div>

      {/* Submenu — outside the scrollable navbar, positioned relative to <header> */}
      {activeSubmenu && (
        <div
          ref={submenuRef}
          className="position-relative start-0 w-100 submenu-wrap"
        >
          <div className="p-3">
            <div className="d-flex gap-3 justify-content-center">
              {navigationItems
                .find((item) => item.id === activeSubmenu)
                ?.submenus.map((submenu, index) => (
                  <Link
                    key={index}
                    href={submenu.href}
                    className={`text-decoration-none submenu-link${isSubmenuItemActive(submenu.href) ? " submenu-link-active" : ""}`}
                  >
                    {submenu.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
