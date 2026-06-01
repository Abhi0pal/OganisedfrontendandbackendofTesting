"use client";
import "./investor.css";
import React, { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

import DepartmentSidebar from "@/components/(department)/Sidebar";
import Header from "@/components/(investor)/Header";
import Sidebar from "@/components/(investor)/Sidebar";
import Footer from "@/components/(investor)/Footer";

import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import { resolveTenantTheme, useTheme } from "@/hooks/useTheme";

/* ✅ Bottom images map */
const bottomImages: Record<string, string[]> = {
  cpcb: [],
  rera: ["/img/bg-pattern/rera.png", "/img/img-bottom/rera.png"],
  nmc: ["/img/img-bottom/rera.png"],
  default: ["/img/bg-pattern/default.png"],
};

const backgroundImages: Record<string, string> = {
  cpcb: "/img/bg-pattern/cpcb.png",
  rera: "/img/bg-pattern/rera.png",
  nmc: "/img/bg-pattern/nmc.png",
  default: "/img/bg-pattern/default.png",
};

const footerIllustrations: Record<string, string | null> = {
  cpcb: "/img/img-bottom/cpcb.png",
  rera: null,
  nmc: null,
  default: null,
};

console.log("Bottom images map:", bottomImages);

/* ✅ Map actual theme values → image keys */
const themeToImageKey: Record<string, string> = {
  default: "default",
  cpcb: "cpcb",
  trera: "rera",
  rera: "rera",
  nmc: "nmc",
};

const normalizeRoleKey = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

const isInvestorPortalRole = (roleName?: string | null) => {
  const normalizedRoleName = normalizeRoleKey(roleName);
  return (
    normalizedRoleName === 'investor' ||
    normalizedRoleName.includes('bwg') ||
    normalizedRoleName.includes('mrf') ||
    normalizedRoleName.includes('landfill') ||
    normalizedRoleName.includes('facility')
  );
};

function InvestorLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const {
    user,
    loading,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { stopLoading } = useLoading();
  const { theme, changeTheme, mounted } = useTheme();
  const tenantTheme = resolveTenantTheme(user?.tenantSlug, user?.availableThemes);
  const assetVersion = useMemo(
    () => (process.env.NODE_ENV === "development" ? String(Date.now()) : "1"),
    [],
  );

  const withAssetVersion = (path: string) =>
    `${path}${path.includes("?") ? "&" : "?"}v=${assetVersion}`;

  /* Load Bootstrap JS only on the client (accesses `document` at eval time) */
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  /* ✅ Debug theme & image resolution */
  useEffect(() => {
    const imageKey = themeToImageKey[theme] ?? themeToImageKey[tenantTheme] ?? "default";
    console.log("Theme from useTheme():", theme);
    console.log("Resolved tenant theme:", tenantTheme);
    console.log("Resolved image key:", imageKey);
    console.log("Resolved image path:", bottomImages[imageKey]);
  }, [tenantTheme, theme]);

  /* ✅ Load Bootstrap client-side only */
  useEffect(() => {
    if (typeof document === "undefined") return;
    import("bootstrap/dist/js/bootstrap.bundle.min.js").catch(() => {
      // Bootstrap already loaded or optional
    });
  }, []);

  /* ✅ Force tenant theme for logged-in user's tenant */
  useEffect(() => {
    if (!mounted) return;
    if (theme !== tenantTheme) {
      changeTheme(tenantTheme);
      return;
    }

    const validTheme = theme && themeToImageKey[theme] ? theme : "default";
    document.documentElement.setAttribute("data-theme", validTheme);
    console.log("Current theme:", validTheme);
  }, [changeTheme, mounted, tenantTheme, theme]);

  const normalizedRoleName = normalizeRoleKey(user?.roleName);
  const isInvestorUser =
    String(user?.userType || "").toUpperCase() === "INVESTOR" ||
    isInvestorPortalRole(user?.roleName);
  const isDepartmentApplicantUser =
    String(user?.userType || "").toUpperCase() === "DEPARTMENT" &&
    normalizedRoleName === "ulb";
  const isDepartmentApplicantRoute = pathname?.includes("/investor/services/");
  const canAccessInvestorServiceFlow =
    isInvestorUser || (isDepartmentApplicantUser && isDepartmentApplicantRoute);
  const sidebarNode =
    isDepartmentApplicantUser && isDepartmentApplicantRoute
      ? <DepartmentSidebar />
      : <Sidebar />;

  /* ✅ Auth guard */
  useEffect(() => {
    if (loading) return;

    if (!user || !canAccessInvestorServiceFlow) {
      if (pathname?.includes("/investor")) {
        router.replace("/login");
      }
    }
  }, [canAccessInvestorServiceFlow, loading, pathname, router, user]);

  /* ✅ Cleanup orphan modals / overlays */
  useEffect(() => {
    stopLoading();

    if (typeof document === "undefined") return;

    const hideOverlay = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.display = "none";
      el.style.pointerEvents = "none";
    };

    const cleanupOrphanBackdrops = () => {
      const hasBootstrapModal = !!document.querySelector(
        ".modal.show, .modal.d-block"
      );

      if (!hasBootstrapModal) {
        document.querySelectorAll(".modal-backdrop").forEach(hideOverlay);
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }

      const hasPrimeDialog = !!document.querySelector(".p-dialog");
      const hasPrimeSidebar = !!document.querySelector(".p-sidebar");

      if (!hasPrimeDialog && !hasPrimeSidebar) {
        document
          .querySelectorAll(
            ".p-dialog-mask, .p-sidebar-mask, .p-component-overlay"
          )
          .forEach(hideOverlay);
      }

      if (document.body.classList.contains("p-overflow-hidden")) {
        document.body.classList.remove("p-overflow-hidden");
        document.body.style.overflow = "";
      }
    };

    cleanupOrphanBackdrops();

    let rafId: number | null = null;
    const observer = new MutationObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(cleanupOrphanBackdrops);
    });

    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [pathname, stopLoading]);

  /* ✅ Loader */
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!user || !canAccessInvestorServiceFlow) return null;

  /* ✅ Resolve final image */
  const imageKey = themeToImageKey[theme] ?? themeToImageKey[tenantTheme] ?? "default";
  const bgPatternPath = backgroundImages[imageKey] ?? backgroundImages.default;
  const footerIllustrationPath =
    pathname?.includes("/investor/services/")
      ? (footerIllustrations[imageKey] ?? null)
      : null;
  const bottomImagePaths = bottomImages[imageKey] ?? bottomImages.default;
  const layoutStyle: React.CSSProperties & Record<string, string> = {
    "--bg-pattern": `url("${withAssetVersion(bgPatternPath)}")`,
    "--footer-illustration": footerIllustrationPath
      ? `url("${withAssetVersion(footerIllustrationPath)}")`
      : "none",
    "--footer-illustration-size": footerIllustrationPath
      ? "min(92vw, 1320px) auto"
      : "0 0",
    "--footer-illustration-position": footerIllustrationPath
      ? "center calc(121% - 90px)"
      : "center bottom",
    "--footer-illustration-space": footerIllustrationPath
      ? "clamp(180px, 20vw, 320px)"
      : "0px",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    transition: "margin-left 0.3s ease-in-out",
  };

  console.log("Final resolved image key:", imageKey);
  console.log("Final resolved image paths:", bottomImagePaths);

  return (
    <div className="tailwind-scope" style={{ minHeight: "100vh" }}>
      {sidebarNode}

      <div
        className={`investor-main-content ${
          collapsed ? "sidebar-collapsed" : ""
        }`}
        style={layoutStyle}
      >
        <Header />

        <main
          className="inner-main-wrap"
        >
          {children}
        </main>

        {/* ✅ Theme-based bottom image */}
        {bottomImagePaths.map((bottomImage, index) => (
          <Image
            key={`${imageKey}-${index}`}
            src={bottomImage}
            alt="Bottom Decoration"
            width={1920}
            height={200}
            className="w-full h-auto pt-5"
            priority={false}
          />
        ))}

        <Footer />
      </div>
    </div>
  );
}

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <InvestorLayoutContent>{children}</InvestorLayoutContent>
    </SidebarProvider>
  );
}
