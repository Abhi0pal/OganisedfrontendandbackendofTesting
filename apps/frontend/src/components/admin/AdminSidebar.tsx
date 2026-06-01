
'use client';

import { Link } from '@/navigation';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

/** ------------------------------
 *  Types: sidebar menu structure
 *  ------------------------------ */
type BaseItem = {
  label: string;
  icon?: string;
  code?: string;            // Optional resource code
};

type LeafItem = BaseItem & {
  href: string;
  id?: string;
};

type DividerItem = {
  type: 'divider';
};

type ParentItem = BaseItem & {
  id: string;
  submenu: (LeafItem | DividerItem)[];
};

type LinkItem = LeafItem | ParentItem;

/** ------------------------------
 *  Component
 *  ------------------------------ */
export const AdminSidebar = () => {
  const pathname = usePathname();

  const locale = pathname.split('/')[1] || 'en';
  const L = (p: string) => `/${locale}${p}`;

  const { logout, user } = useAuth(); // if not used now, you can remove later
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  /** Links (fixed: split into distinct items, no duplicate keys) */
  const links: LinkItem[] = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: 'bi-speedometer2',
      code: 'DASHBOARD_VIEW',
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: 'bi-people',
      code: 'USER_MANAGE',
    },
    {
      id: 'rbac-management',
      label: 'Access Control',
      icon: 'bi-shield-lock',
      submenu: [
        {
          href: '/admin/rbac/roles',
          label: 'Roles',
          icon: 'bi-person-badge',
          code: 'MASTER_ROLES',
        },
        {
          href: '/admin/rbac/resources',
          label: 'Resources',
          icon: 'bi-box-seam',
          code: 'MASTER_RESOURCES',
        },
        {
          href: '/admin/rbac/assignments',
          label: 'Assignments',
          icon: 'bi-link-45deg',
          code: 'MASTER_ROLE_RESOURCES',
        },
      ],
    },
    // {
    //   href: “/admin/information-wizard”,
    //   label: “Information Wizard”,
    //   icon: “bi-journal-text”,
    // },
    // {
    //   id: 'kya-management',
    //   label: 'Know Your Approvals',
    //   icon: 'bi-question-circle',
    //   submenu: [
    //     { href: '/admin/kya/add', label: 'Configuration', icon: 'bi-gear' },
    //     { href: '/admin/kya/questions', label: 'Questions (v1)', icon: 'bi-card-list' },
    //     { href: '/admin/kya/questions-v2', label: 'Questions (v2)', icon: 'bi-star-fill' },
    //   ],
    // },
    {
      href: '/admin/workflow-forms',
      label: 'Workflow & Forms',
      icon: 'bi-diagram-3',
    },
    /** ✅ Dynamic Master Management — new system */
    {
      id: 'dynamic-master',
      label: 'Dynamic Masters',
      icon: 'bi-database-gear',
      submenu: [
        {
          href: '/admin/dynamic-master/definitions',
          label: 'Master Definitions',
          icon: 'bi-box',
        },
        {
          href: '/admin/dynamic-master/data',
          label: 'Master Data',
          icon: 'bi-table',
        },
      ],
    },
    /** ✅ Keep a single “Master Management” item */
    {
      id: 'master-management',
      label: 'Master Management',
      icon: 'bi-gear',
      submenu: [
        {
          href: '/admin/master/country',
          label: 'Country Master',
          icon: 'bi-globe',
        },
        { href: '/admin/master/state', label: 'State Master', icon: 'bi-flag' },
        {
          href: '/admin/master/district',
          label: 'District Master',
          icon: 'bi-map',
        },
        { href: '/admin/master/block', label: 'Block Master', icon: 'bi-grid' },
        {
          href: '/admin/master/tehsil',
          label: 'Tehsil Master',
          icon: 'bi-building',
        },
        {
          href: '/admin/master/village',
          label: 'Village Master',
          icon: 'bi-house',
        },
        { type: 'divider' },

        {
          href: '/admin/master/anchor-types',
          label: 'Anchor Types',
          icon: 'bi-diagram-3',
        },
        {
          href: '/admin/master/beneficiary-types',
          label: 'Beneficiary Types',
          icon: 'bi-people',
        },
        {
          href: '/admin/master/region-categories',
          label: 'Region Categories',
          icon: 'bi-building',
        },
        {
          href: '/admin/master/financial-parameter',
          label: 'Financial Parameters',
          icon: 'bi-currency-dollar',
        },
        {
          href: '/admin/master/incentive-types',
          label: 'Incentive Types',
          icon: 'bi-gift',
        },
        {
          href: '/admin/master/land-categories',
          label: 'Land Categories',
          icon: 'bi-geo-alt',
        },
        {
          href: '/admin/master/land-allotment-stage',
          label: 'Land Allotment Stage',
          icon: 'bi-geo-alt',
        },
        {
          href: '/admin/master/mapping-region-categories',
          label: 'Region Category Mapping',
          icon: 'bi-map',
        },
        {
          href: '/admin/master/msme-year',
          label: 'MSME Year',
          icon: 'bi-calendar',
        },
        {
          href: '/admin/master/occurrences',
          label: 'Occurrences',
          icon: 'bi-activity',
        },
        {
          href: '/admin/master/sectors',
          label: 'Sectors',
          icon: 'bi-building-check',
        },
        {
          href: '/admin/master/sub-sectors',
          label: 'Sub-Sectors',
          icon: 'bi-diagram-3-fill',
        },
        {
          href: '/admin/master/unit-categories',
          label: 'Unit Categories',
          icon: 'bi-stack',
        },
        {
          href: '/admin/master/unit-types',
          label: 'Unit Types',
          icon: 'bi-collection',
        },
        {
          href: '/admin/master/organisation-nature',
          label: 'Organisation Nature',
          icon: 'bi-collection',
        },
        {
          href: '/admin/master/upcl-supply-categories',
          label: 'UPCL Supply Categories',
          icon: 'bi-stack',
        },
        {
          href: '/admin/master/upcl-supply-subcategories',
          label: 'UPCL Supply Subcategories',
          icon: 'bi-stack',
        },
        {
          href: '/admin/master/upcl-voltage',
          label: 'UPCL Voltage',
          icon: 'bi-lightning',
        },
        {
          href: '/admin/master/ujs-division',
          label: 'UJS Division',
          icon: 'bi-building',
        },
        {
          href: '/admin/master/labour-factory-type-master',
          label: 'Labour Factory Type',
          icon: 'bi-building-gear',
        },
        {
          href: '/admin/master/labour-factory-sec85',
          label: 'Labour Factory Sec85',
          icon: 'bi-tools',
        },
        {
          href: '/admin/master/pollution-control-equipments',
          label: 'Pollution Control Equipments',
          icon: 'bi-wind',
        },
        {
          href: '/admin/master/current-landuse',
          label: 'Current Landuse',
          icon: 'bi-tree',
        },
        {
          href: '/admin/master/upcl-division-subdivisions',
          label: 'UPCL Division Subdivisions',
          icon: 'bi-stack',
        },
        {
          href: '/admin/master/kyi-ic-calculator',
          label: 'KYI IC Calculator',
          icon: 'bi-calculator',
        },
      ],
    },
    {
      href: '/admin/ai-form-generate',
      label: 'AI Generate Form & Workfloww',
      icon: 'bi-cpu',
      code: 'MASTER_ALL',
    },
    {
      id: 'formbuilder-management',
      label: 'Formbuilder Management',
      icon: 'bi-gear',
      submenu: [
        {
          href: '/admin/master/form-type',
          label: 'Form Type Master',
          icon: 'bi-map',
          code: 'MASTER_ALL',
        },
        {
          href: '/admin/master/form-category',
          label: 'Form Category Master',
          icon: 'bi-map',
          code: 'MASTER_ALL',
        },
        {
          href: '/admin/master/form-field',
          label: 'Form Field Master',
          icon: 'bi-input-cursor-text',
          code: 'MASTER_ALL',
        },
        {
          href: '/admin/master/form-builder',
          label: 'Form Builder Master',
          icon: 'bi-hammer',
          code: 'MASTER_ALL',
        },
        { type: 'divider' },
        {
          href: '/admin/master/department',
          label: 'Department Master',
          icon: 'bi-list-task',
        },
        {
          href: '/admin/master/issuer',
          label: 'Issuer Master',
          icon: 'bi-badge-cc',
        },
        { type: 'divider' },
        {
          href: '/admin/master/document-type',
          label: 'Document Type Master',
          icon: 'bi-file-text',
        },
        {
          href: '/admin/master/document-checkpoint',
          label: 'Document Checkpoint Master',
          icon: 'bi-calendar-check',
        },
        {
          href: '/admin/master/document',
          label: 'Document Master',
          icon: 'bi-file-earmark',
        },
        { type: 'divider' },
        { href: '/admin/master/service-type', label: 'Service Type Master', icon: 'bi-list-task' },
        { href: '/admin/master/service-incidence', label: 'Service Incidence Master', icon: 'bi-list-task' },
        { href: '/admin/master/service-sector', label: 'Service Sector Master', icon: 'bi-list-task' },
        { href: '/admin/master/service', label: 'Service Master', icon: 'bi-list-task' },
      ]
    },    
    // {
    //   id: 'incentive-form-engine',
    //   label: 'Incentive Form Engine',
    //   icon: 'bi-cpu',
    //   submenu: [
    //     { href: '/admin/master/field', label: 'Field Master', icon: 'bi-input-cursor-text', code: 'MASTER_ALL' },
    //     { href: '/admin/master/policy', label: 'Policy Master', icon: 'bi-journal-text', code: 'MASTER_ALL' },
    //     { href: '/admin/master/scheme', label: 'Scheme Definitions', icon: 'bi-diagram-3', code: 'MASTER_ALL' },
    //     { type: 'divider' },
    //     { href: '/admin/masters/checklists', label: 'Inspection Checklists', icon: 'bi-check2-square' },
    //   ],
    // },
  ];

  const toggleSubmenu = (id: string) => {
    setOpenSubmenu(openSubmenu === id ? null : id);
  };

  return (
    <div className="sidebar d-flex flex-column d-none">
      <h2 className="mb-0">
        <Link href="/" prefetch>
              <Image
                  src="/img/logo-main.png"
                  alt="Invest Uttarakhand"
                  width={180}
                  height={33}
                  priority
              />
          </Link>
      </h2>

      <nav className="nav flex-column flex-grow-1 p-3">
        {links.map((link) => {
          // Parent item (has submenu)
          if ('submenu' in link) {
            const isOpen = openSubmenu === link.id;
            const isActive = link.submenu.some(
              (sublink) => 'href' in sublink && sublink.href && pathname === sublink.href
            );

            return (
              <div key={link.id}>
                <button
                  onClick={() => toggleSubmenu(link.id)}
                  className={`nav-link d-flex align-items-center justify-content-between w-100 text-start ${isActive ? 'active' : ''
                    }`}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    {link.icon && <i className={`bi ${link.icon}`}></i>}
                    <span>{link.label}</span>
                  </span>
                  <i className={`bi bi-chevron-${isOpen ? 'down' : 'right'}`}></i>
                </button>

                {isOpen && (
                  <nav className="nav flex-column ms-3">
                    {link.submenu.map((sublink, index) => {
                      if ('type' in sublink && sublink.type === 'divider') {
                        return (
                          <hr key={`divider-${index}`} className="my-2 border-secondary" />
                        );
                      }

                      if (!('href' in sublink) || !sublink.href) return null;

                      return (
                        <Link
                          key={sublink.href}
                          href={sublink.href}
                          prefetch
                          className={`nav-link d-flex align-items-center gap-2 ${pathname === sublink.href ? 'active' : ''
                            }`}
                        >
                          {sublink.icon && <i className={`bi ${sublink.icon}`}></i>}
                          <span>{sublink.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          }

          // Leaf item (regular link)
          if (!('href' in link) || !link.href) return null;

          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={`nav-link d-flex align-items-center gap-2 ${pathname === link.href ? 'active' : ''
                }`}
            >
              {link.icon && <i className={`bi ${link.icon}`}></i>}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
