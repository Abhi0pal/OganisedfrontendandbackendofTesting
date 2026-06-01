"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, usePathname } from "@/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import { useTenant } from "@/hooks/common/useTenants";
import { useTenantProjects } from "@/hooks/common/useTenantProjects";
import { useInvestorApplyServices } from "@/hooks/investor/useInvestorApplyServices";
import apiClient from "@/lib/api-client";

/* -------------------------
   Your existing Icons object
   (KEEP IT EXACTLY AS YOU POSTED)
------------------------- */
const Icons = {
  M1: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3764)">
        <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3764">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M2: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3777)">
        <path d="M15.5 11C16.3284 11 17 10.3284 17 9.5C17 8.67157 16.3284 8 15.5 8C14.6716 8 14 8.67157 14 9.5C14 10.3284 14.6716 11 15.5 11Z" fill="#0A1A1A" />
        <path d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z" fill="#0A1A1A" />
        <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12 14C9.67 14 7.68 15.45 6.88 17.5H8.55C9.24 16.31 10.52 15.5 12 15.5C13.48 15.5 14.75 16.31 15.45 17.5H17.12C16.32 15.45 14.33 14 12 14Z" fill="#0A1A1A" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3777">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M3: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3792)">
        <path d="M20 2H4C2.89 2 2 2.89 2 4V15C2 16.11 2.89 17 4 17H8V22L12 20L16 22V17H20C21.11 17 22 16.11 22 15V4C22 2.89 21.11 2 20 2ZM20 15H4V13H20V15ZM20 10H4V4H20V10Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3792">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M4: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3805)">
        <path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3ZM21 19H3V5H13V9H21V19Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3805">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M5: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3818)">
        <path d="M20 4H4V6H20V4ZM21 14V12L20 7H4L3 12V14H4V20H14V14H18V20H20V14H21ZM12 18H6V14H12V18Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3818">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M6: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3831)">
        <path d="M17.0016 12H19.0016L12.0016 2L5.05156 12H7.00156L3.10156 18H10.0216V22H13.9816V18H21.0016L17.0016 12Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3831">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M7: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3846)">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3846">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M8: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3859)">
        <path d="M17.66 8.0001L12 2.3501L6.34 8.0001C4.78 9.5601 4 11.6401 4 13.6401C4 15.6401 4.78 17.7501 6.34 19.3101C7.9 20.8701 9.95 21.6601 12 21.6601C14.05 21.6601 16.1 20.8701 17.66 19.3101C19.22 17.7501 20 15.6401 20 13.6401C20 11.6401 19.22 9.5601 17.66 8.0001ZM6 14.0001C6.01 12.0001 6.62 10.7301 7.76 9.6001L12 5.2701L16.24 9.6501C17.38 10.7701 17.99 12.0001 18 14.0001H6Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3859">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M9: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3872)">
        <path d="M9 4C9 2.89 9.89 2 11 2C12.11 2 13 2.89 13 4C13 5.11 12.11 6 11 6C9.89 6 9 5.11 9 4ZM16 13C15.99 11.66 15.17 10.49 14 10C14 8.34 12.66 7 11 7C9.34 7 8 8.34 8 10V17H10V22H13V17H16V13Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3872">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M10: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3889)">
        <path d="M5 8H7V16H5V8ZM12 8H9C8.45 8 8 8.45 8 9V15C8 15.55 8.45 16 9 16H12C12.55 16 13 15.55 13 15V9C13 8.45 12.55 8 12 8ZM11 14H10V10H11V14ZM18 8H15C14.45 8 14 8.45 14 9V15C14 15.55 14.45 16 15 16H18C18.55 16 19 15.55 19 15V9C19 8.45 18.55 8 18 8ZM17 14H16V10H17V14Z" fill="#121212" />
        <path d="M2 4V20H22V4H2ZM4 18V6H20V18H4Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3889">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M11: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3904)">
        <path d="M7 10H4V17H7V10Z" fill="#121212" />
        <path d="M13.5 10H10.5V17H13.5V10Z" fill="#121212" />
        <path d="M22 19H2V22H22V19Z" fill="#121212" />
        <path d="M20 10H17V17H20V10Z" fill="#121212" />
        <path d="M12 1L2 6V8H22V6L12 1Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3904">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M12: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3924)">
        <path d="M19 3H5C3.9 3 3.01 3.9 3.01 5L3 19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM18 14H14V18H10V14H6V10H10V6H14V10H18V14Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3924">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  M13: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_3002_3937)">
        <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="#121212" />
      </g>
      <defs>
        <clipPath id="clip0_3002_3937">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  logout: (
    <svg
      width="20"
      height="22"
      viewBox="0 0 20 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.9166 14.982C19.8603 14.8487 19.7814 14.7259 19.6832 14.619L16.349 11.319C16.1397 11.1119 15.8558 10.9955 15.5599 10.9955C15.2639 10.9955 14.98 11.1119 14.7708 11.319C14.5615 11.5261 14.4439 11.8071 14.4439 12.1C14.4439 12.3929 14.5615 12.6739 14.7708 12.881L16.2156 14.3H10.0028C9.708 14.3 9.42531 14.4159 9.21688 14.6222C9.00845 14.8285 8.89135 15.1083 8.89135 15.4C8.89135 15.6917 9.00845 15.9715 9.21688 16.1778C9.42531 16.3841 9.708 16.5 10.0028 16.5H16.2156L14.7708 17.919C14.6666 18.0213 14.5839 18.1429 14.5275 18.277C14.4711 18.411 14.442 18.5548 14.442 18.7C14.442 18.8452 14.4711 18.989 14.5275 19.123C14.5839 19.2571 14.6666 19.3787 14.7708 19.481C14.8741 19.5841 14.997 19.6659 15.1324 19.7218C15.2679 19.7776 15.4131 19.8064 15.5599 19.8064C15.7066 19.8064 15.8519 19.7776 15.9873 19.7218C16.1227 19.6659 16.2457 19.5841 16.349 19.481L19.6832 16.181C19.7861 16.0777 19.8657 15.954 19.9166 15.818C20.0278 15.5502 20.0278 15.2498 19.9166 14.982ZM12.2256 19.8H3.33426C3.03949 19.8 2.7568 19.6841 2.54837 19.4778C2.33993 19.2715 2.22284 18.9917 2.22284 18.7V3.3C2.22284 3.00826 2.33993 2.72847 2.54837 2.52218C2.7568 2.31589 3.03949 2.2 3.33426 2.2H8.89135V5.5C8.89135 6.37521 9.24264 7.21458 9.86793 7.83345C10.4932 8.45232 11.3413 8.8 12.2256 8.8H16.6713C16.8907 8.79892 17.1049 8.73357 17.2869 8.61221C17.4688 8.49084 17.6104 8.31888 17.6938 8.118C17.7789 7.91768 17.8022 7.69689 17.7606 7.48351C17.7191 7.27012 17.6146 7.07369 17.4604 6.919L10.7919 0.319C10.7 0.233438 10.595 0.162889 10.4807 0.11H10.3807L10.0695 0H3.33426C2.44996 0 1.60188 0.347678 0.976581 0.966548C0.351287 1.58542 0 2.42479 0 3.3V18.7C0 19.5752 0.351287 20.4146 0.976581 21.0335C1.60188 21.6523 2.44996 22 3.33426 22H12.2256C12.5204 22 12.8031 21.8841 13.0115 21.6778C13.2199 21.4715 13.337 21.1917 13.337 20.9C13.337 20.6083 13.2199 20.3285 13.0115 20.1222C12.8031 19.9159 12.5204 19.8 12.2256 19.8ZM11.1142 3.751L13.9928 6.6H12.2256C11.9308 6.6 11.6481 6.48411 11.4397 6.27782C11.2313 6.07153 11.1142 5.79174 11.1142 5.5V3.751Z"></path>
    </svg>
  ),
  chevronLeft: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  ),
  chevronRight: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
  chevronDown: (
    <svg
      width="15"
      height="9"
      viewBox="0 0 15 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5791 0.41897C14.3125 0.150622 13.9518 0 13.5759 0C13.2 0 12.8394 0.150622 12.5728 0.41897L7.46443 5.51935L2.42724 0.41897C2.16063 0.150622 1.79999 0 1.42407 0C1.04815 0 0.687506 0.150622 0.420902 0.41897C0.287532 0.552909 0.181674 0.712262 0.109433 0.887835C0.0371927 1.06341 0 1.25173 0 1.44193C0 1.63213 0.0371927 1.82045 0.109433 1.99602C0.181674 2.17159 0.287532 2.33095 0.420902 2.46489L6.45414 8.57382C6.58642 8.70886 6.7438 8.81605 6.9172 8.88919C7.0906 8.96234 7.27658 9 7.46443 9C7.65227 9 7.83826 8.96234 8.01165 8.88919C8.18505 8.81605 8.34243 8.70886 8.47471 8.57382L14.5791 2.46489C14.7125 2.33095 14.8183 2.17159 14.8906 1.99602C14.9628 1.82045 15 1.63213 15 1.44193C15 1.25173 14.9628 1.06341 14.8906 0.887835C14.8183 0.712262 14.7125 0.552909 14.5791 0.41897Z"
        fill="#A1A1A1"
      />
    </svg>
  ),
  dot: (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
};

/* -------------------------
   Types
   ------------------------- */
type Child = {
  name: string;
  href?: string;
  icon?: React.ReactNode;
  children?: Child[];
};
type MenuItem = {
  name: string;
  icon?: React.ReactNode;
  href?: string;
  children?: Child[];
};
const normalizeRoleKey = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

const hasRoleToken = (roleName: string, token: string) => {
  if (!roleName || !token) return false;
  return roleName === token || roleName.includes(token);
};

const normalizeLogoUrl = (value?: string | null) => {
  const logoUrl = String(value || "").trim();
  if (!logoUrl) return "";
  if (/^(https?:)?\/\//i.test(logoUrl) || logoUrl.startsWith("/") || logoUrl.startsWith("data:")) {
    return logoUrl;
  }
  return `/${logoUrl.replace(/^\/+/, "")}`;
};

export default function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("InvestorDashboard");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { user } = useAuth();
  const resolvedTenantId =
    user?.tenantId ?? user?.assignmentTenantId ?? user?.userTenantId ?? null;
  const resolvedProjectId =
    user?.projectId ?? user?.assignmentProjectId ?? user?.userProjectId ?? null;
  const { data: tenant } = useTenant(resolvedTenantId);
  const { data: tenantProjects = [], isLoading: isTenantProjectsLoading } =
    useTenantProjects(resolvedTenantId);
  const currentTenantId = Number(tenant?.id ?? resolvedTenantId ?? 0) || null;
  const activeTenantProjects = tenantProjects.filter((project) => project.is_active);
  const activeProjectIds = new Set(activeTenantProjects.map((project) => Number(project.id)));
  const currentProjectId =
    Number(resolvedProjectId ?? 0) > 0 && activeProjectIds.has(Number(resolvedProjectId))
      ? Number(resolvedProjectId)
      : activeTenantProjects.length === 1
        ? Number(activeTenantProjects[0].id)
        : Number(resolvedProjectId ?? 0) || null;
  const {
    data: applyServices = [],
    isLoading: isApplyServicesLoading,
    isError: isApplyServicesError,
    error: applyServicesError,
  } =
    useInvestorApplyServices(currentTenantId, currentProjectId, {
      enabled:
        Boolean(currentTenantId) &&
        (!resolvedTenantId || !isTenantProjectsLoading),
    });
  const tenantLogoUrl = normalizeLogoUrl(tenant?.logo_url || user?.logoUrl) || "/img/logo.png";
  const tenantLogoAlt = tenant?.name?.trim() || user?.tenantName?.trim() || "Invest Uttarakhand";
  const tenantSlug = String(tenant?.slug || "").trim().toLowerCase();
  const tenantName = String(tenant?.name || user?.tenantName || "").trim().toLowerCase();
  const isNmcTenant =
    tenantSlug === "nmc" ||
    String(user?.tenantSlug || "").trim().toLowerCase() === "nmc";
  const isCpcbTenant =
    tenantSlug === "cpcb" ||
    tenantSlug === "cp" ||
    tenantName.includes("cpcb") ||
    tenantName.includes("central pollution control board");
  const normalizedRoleName = normalizeRoleKey(user?.roleName);
  const isBwgRole =
    hasRoleToken(normalizedRoleName, "bwg") ||
    hasRoleToken(normalizedRoleName, "bulk-waste-generator");
  const isMrfRole =
    hasRoleToken(normalizedRoleName, "mrf") ||
    hasRoleToken(normalizedRoleName, "material-recovery-facility");
  const isLandfillRole = hasRoleToken(normalizedRoleName, "landfill");
  const isFacilityRole =
    hasRoleToken(normalizedRoleName, "facility") ||
    hasRoleToken(normalizedRoleName, "facility-operator") ||
    hasRoleToken(normalizedRoleName, "processing-facility");
  const shouldHideApplyServices =
    isCpcbTenant && (isBwgRole || isMrfRole || isLandfillRole || isFacilityRole);

  const withLocale = (href: string) => {
    return href;
  };

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    console.log("[InvestorSidebar] Apply Services context", {
      email: user?.email ?? null,
      roleName: user?.roleName ?? null,
      tenantId: currentTenantId,
      resolvedProjectId,
      effectiveProjectId: currentProjectId,
      tenantSlug,
      tenantProjects,
      loading: isApplyServicesLoading,
      error: isApplyServicesError
        ? applyServicesError instanceof Error
          ? applyServicesError.message
          : String(applyServicesError)
        : null,
      count: Array.isArray(applyServices) ? applyServices.length : 0,
      services: applyServices,
    });
  }, [
    applyServices,
    applyServicesError,
    currentProjectId,
    currentTenantId,
    isApplyServicesError,
    isApplyServicesLoading,
    resolvedProjectId,
    tenantSlug,
    tenantProjects,
    user?.email,
    user?.roleName,
  ]);

  const applyServiceChildren: Child[] = useMemo(() => {
    const treeServiceButton: Child = {
      name: "Tree Cutting / Tree Trimming Services",
      href: "/investor/tree-cutting-permission",
      icon: Icons.dot,
    };
    if (isTenantProjectsLoading || isApplyServicesLoading) {
      return [{ name: "Loading services...", href: "#", icon: Icons.dot }];
    }

    if (isApplyServicesError) {
      return [{ name: "Unable to load services", href: "#", icon: Icons.dot }];
    }
    const hiddenServiceIds = [969, 12223];
    return [
      treeServiceButton,
      ...applyServices
        .filter((service) => !hiddenServiceIds.includes(Number(service.serviceId)))
        .map((service) => ({
          name: service.serviceName,
          href: `/investor/services/${service.serviceId}/apply/1`,
        icon: Icons.dot,
      })),
    ];
  }, [
    applyServices,
    isApplyServicesError,
    isApplyServicesLoading,
    isTenantProjectsLoading,
  ]);

  const roleBasedMenuItems: MenuItem[] = useMemo(() => {
    if (isBwgRole) {
      return [
        {
          name: "BWG (Bulk Waste Generator) Operation",
          icon: Icons.M6,
          href: "#",
          children: [
            { name: "BWG registration", icon: Icons.dot, href: "/investor/services/12245.0/apply/1" },
            { name: "Waste details", icon: Icons.dot, href: "#" },
            { name: "Payment", icon: Icons.dot, href: "#" },
            { name: "Compliance returns", icon: Icons.dot, href: "/investor/services/12278.0/apply/1" },
            { name: "EBWGR forms", icon: Icons.dot, href: "#" },
            { name: "Grievance", icon: Icons.dot, href: "/investor/services/12235.0/apply/1" },
            { name: "Appeal", icon: Icons.dot, href: "/investor/services/12234.0/apply/1" },
          ],
        },
      ];
    }

    if (isMrfRole) {
      return [
        {
          name: "MRF (Material Recovery Facility) Operation",
          icon: Icons.M5,
          href: "#",
          children: [
            { name: "MRF registration", icon: Icons.dot, href: "/investor/services/12270.0/apply/1" },
            { name: "Payment", icon: Icons.dot, href: "#" },
            { name: "Compliance returns", icon: Icons.dot, href: "/investor/services/12278.0/apply/1" },
            { name: "Grievance", icon: Icons.dot, href: "/investor/services/12235.0/apply/1" },
            { name: "Appeal", icon: Icons.dot, href: "/investor/services/12234.0/apply/1" },
          ],
        },
      ];
    }

    if (isLandfillRole) {
      return [
        {
          name: "Landfill Facility Operation",
          icon: Icons.M8,
          href: "#",
          children: [
            { name: "Landfill registration", icon: Icons.dot, href: "/investor/services/12247.0/apply/1" },
          ],
        },
      ];
    }

    if (isFacilityRole) {
      return [
        {
          name: "Facility Operator Operation",
          icon: Icons.M7,
          href: "#",
          children: [
            { name: "Facility registration", icon: Icons.dot, href: "/investor/services/12256.0/apply/1" },
            { name: "Payment", icon: Icons.dot, href: "#" },
            { name: "Grievance", icon: Icons.dot, href: "/investor/services/12235.0/apply/1" },
            { name: "Appeal", icon: Icons.dot, href: "/investor/services/12234.0/apply/1" },
            { name: "Capacity / location / operational forms", icon: Icons.dot, href: "#" },
            { name: "Returns", icon: Icons.dot, href: "/investor/services/12276.0/apply/1" },
            { name: "Audit", icon: Icons.dot, href: "/investor/services/12246.0/apply/1" },
            { name: "Inspection Response", icon: Icons.dot, href: "#" },
          ],
        },
      ];
    }

    return [];
  }, [isBwgRole, isFacilityRole, isLandfillRole, isMrfRole]);

  /* Menu definition */
  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: Icons.M1, href: "/investor/dashboard" },
    { name: "My Documents", icon: Icons.M4, href: "/investor/documents" },
    { name: "Grievance Redressal", icon: Icons.M2, href: "#" },
    { name: "My Applications", icon: Icons.M3, href: "/investor/applications" },
    ...(!shouldHideApplyServices
      ? [
        {
          name: "Apply Services",
          icon: Icons.M5,
          href: "#",
          children:
            applyServiceChildren.length > 0
              ? applyServiceChildren
              : [{ name: "No services available", href: "#", icon: Icons.dot }],
        } satisfies MenuItem,
      ]
      : []),
    ...(isCpcbTenant
      ? [
        {
          name: "Verification & Inspection",
          icon: Icons.M7,
          href: "#",
          children: [
            { name: "BWG Physical Verification", icon: Icons.dot, href: "#" },
            { name: "Inspection Assignment", icon: Icons.dot, href: "#" },
            { name: "Inspection Reports", icon: Icons.dot, href: "#" },
            { name: "Weighment Entry", icon: Icons.dot, href: "#" },
          ],
        },
        { name: "Reporting", icon: Icons.M10, href: "#" },
      ]
      : []),
    // { name: "Tree Cutting/Trimming Permission", icon: Icons.M3, href: "/investor/tree-cutting-permission" },
    ...roleBasedMenuItems,
  ];

  const isValidMenuHref = (href?: string) => {
    return Boolean(href && href.startsWith("/"));
  };

  const getOpenFromPath = (path: string) => {
    for (const item of menuItems) {
      if (item.children) {
        if (isValidMenuHref(item.href) && path === item.href) return item.name;
        if (
          item.children.some(
            (c) => c.href && isValidMenuHref(c.href) && path.startsWith(c.href),
          )
        ) {
          return item.name;
        }
      }
    }
    return null;
  };

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() =>
    getOpenFromPath(pathname),
  );

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

  const isParentActive = (item: MenuItem) => {
    if (item.href && isValidMenuHref(item.href) && pathname === item.href)
      return true;

    if (item.children) {
      return item.children.some(
        (c) =>
          c.href &&
          isValidMenuHref(c.href) &&
          (pathname === c.href || pathname.startsWith(c.href)),
      );
    }

    return false;
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const submitNmcDashboardForm = (targetUrl: string, payload: any) => {
    if (typeof document === "undefined") {
      return;
    }

    const requestInfo = payload?.RequestInfo || {};
    const form = document.createElement("form");
    form.method = "POST";
    form.action = targetUrl;
    form.style.display = "none";

    const appendField = (name: string, value: unknown) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = typeof value === "string" ? value : JSON.stringify(value ?? {});
      form.appendChild(input);
    };

    appendField("RequestInfo[apiId]", requestInfo.apiId || "Rainmaker");
    appendField("RequestInfo[authToken]", requestInfo.authToken || "");
    appendField("RequestInfo[msgId]", requestInfo.msgId || "");
    appendField(
      "RequestInfo[plainAccessRequest]",
      requestInfo.plainAccessRequest || {},
    );

    document.body.appendChild(form);
    form.submit();
    form.remove();
  };

  const handleNmcDashboardLaunch = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await apiClient.get("/auth/nmc/dashboard-launch");
      const targetUrl =
        response?.data?.data?.targetUrl ||
        "https://dev-upyog.nmc.gov.in/upyog-ui/citizen/pgr-home";
      const payload = response?.data?.data?.payload;

      if (!payload?.RequestInfo?.authToken) {
        throw new Error("Missing NMC auth token for dashboard launch.");
      }

      submitNmcDashboardForm(targetUrl, payload);
    } catch (error) {
      console.error("NMC dashboard launch failed:", error);
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
      {/* Logo + collapse button */}
      <div className="px-4 py-3 text-lg font-semibold flex items-center gap-2 border-b-1">
        <img
          src={tenantLogoUrl}
          alt={tenantLogoAlt}
          data-tenant-id={tenant?.id ?? user?.tenantId ?? ""}
          data-tenant-source={user?.tenantSource ?? ""}
          data-user-tenant-id={user?.userTenantId ?? ""}
          data-assignment-tenant-id={user?.assignmentTenantId ?? ""}
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
      <nav className="flex-1 px-2.5 py-4 space-y-6 overflow-y-auto">
        {isSidebarOpen && (
          <p className="menu-title px-3 mb-3 text-xs font-semibold tracking-wider uppercase">
            Menu
          </p>
        )}

        {menuItems.map((item) => {
          const hasChildren = Boolean(
            item.children && item.children.length > 0,
          );
          const parentActive = isParentActive(item);
          const isOpen = openSubmenu === item.name;

          if (!hasChildren) {
            const shouldLaunchNmcDashboard =
              isNmcTenant && item.name === "Dashboard" && item.href === "/investor/dashboard";

            return (
              <Link
                key={item.name}
                href={withLocale(item.href || "#")}
                prefetch
                onClick={shouldLaunchNmcDashboard ? handleNmcDashboardLaunch : undefined}
                className={`menu-link group flex items-center gap-3 py-2 rounded-md no-underline px-2 ${pathname === item.href ? "active" : ""}`}
              >
                {/* ICON MUST ALWAYS BE VISIBLE */}
                <span className="relative shrink-0">{item.icon}</span>
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          }

          return (
            <details
              key={item.name}
              className={`group menu-dropdown ${parentActive ? "active" : ""}`}
              open={isSidebarOpen && isOpen}
            >
              <summary
                className="menu-link flex items-start justify-between py-2 rounded-md cursor-pointer list-none px-2"
                title={item.name}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isSidebarOpen) return;
                  toggleSubmenu(item.name);
                }}
              >
                <span className="flex items-start gap-3">
                  <span className="relative shrink-0">{item.icon}</span>

                  {isSidebarOpen && (
                    <span className="m-txt grow">{item.name}</span>
                  )}

                  {isSidebarOpen && (
                    <span
                      className={`transition mt-3 ${isOpen ? "rotate-180" : ""}`}
                    >
                      {Icons.chevronDown}
                    </span>
                  )}
                </span>
              </summary>
              {isSidebarOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children!.map((child, childIdx) => {
                    const hasGrandChildren =
                      child.children && child.children.length > 0;

                    // 🔹 If policy has schemes → render dropdown
                    if (hasGrandChildren) {
                      const isOpen = openDropdown === child.name;

                      return (
                        <details
                          key={`${childIdx}-${child.name}`}
                          className="ml-2 group"
                          open={isOpen}
                        >
                          <summary
                            onClick={(e) => {
                              e.preventDefault(); // prevent default toggle
                              setOpenDropdown(isOpen ? null : child.name);
                            }}
                            className="d-flex items-center justify-between px-3 py-2 text-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                          >
                            <span>{child.name}</span>
                            <span
                              className={`transition ${isOpen ? "rotate-180" : ""
                                }`}
                            >
                              {Icons.chevronDown}
                            </span>
                          </summary>

                          <div className="ml-4 space-y-1">
                            {child.children!.map((scheme, schemeIdx) => {
                              const active = pathname === scheme.href;
                              return (
                                <Link
                                  key={`${schemeIdx}-${scheme.href || scheme.name}`}
                                  href={withLocale(scheme.href!)}
                                  prefetch
                                  className={`sidebar-submenu-link flex items-center gap-2 px-3 py-2 text-sm rounded-md ${active ? "active" : ""
                                    }`}
                                >
                                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                                  <span>{scheme.name}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </details>
                      );
                    }

                    // 🔹 Normal child
                    return (
                      <Link
                        key={`${childIdx}-${child.href || child.name}`}
                        href={withLocale(child.href!)}
                        prefetch
                        className="sidebar-submenu-link flex items-center gap-2 px-3 py-2 text-sm rounded-md"
                      >
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </details>
          );
        })}

        {isSidebarOpen && (
          <p className="menu-title px-3 mb-3 pt-6 text-xs font-semibold tracking-wider uppercase hidden">
            General
          </p>
        )}

        <a
          href="#"
          onClick={handleLogout}
          className="menu-link group flex items-center gap-3 py-2 rounded-md no-underline px-3 hidden"
        >
          <span className="relative shrink-0">{Icons.logout}</span>
          {isSidebarOpen && <span>{t("Sign Out")}</span>}
        </a>
      </nav>
    </aside>
  );
}
