"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams, useSelectedLayoutSegments } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/homepage/Header";
import Footer from "@/components/homepage/Footer";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { ACTIVE_TENANT_SLUG_STORAGE_KEY } from "@/hooks/useTheme";

const TENANT_PUBLIC_THEMES = ["trera", "nmc", "cpcb"] as const;

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const segments = useSelectedLayoutSegments();
  const queryClient = useQueryClient();
  const { user, setUser, setResources, fetchRoles } = useAuth();
  const [isNmcBootstrapping, setIsNmcBootstrapping] = useState(false);
  const bootstrapTokenRef = useRef<string | null>(null);
  const tenantParam = String(searchParams.get("tenant") || "").toLowerCase().trim();
  const tenantTheme = TENANT_PUBLIC_THEMES.includes(tenantParam as typeof TENANT_PUBLIC_THEMES[number])
    ? tenantParam
    : "default";
  const incomingNmcAccessToken = String(
    searchParams.get("accessToken") ||
      searchParams.get("access_token") ||
      "",
  ).trim();
  const incomingNmcRefreshToken = String(
    searchParams.get("refreshToken") ||
      searchParams.get("refresh_token") ||
      "",
  ).trim();

  const isDashboard = segments.includes("admin")
    || segments.includes("user")
    || segments.includes("investor")
    || segments.includes("department");

  useEffect(() => {
    if (!incomingNmcAccessToken) {
      return;
    }

    if (bootstrapTokenRef.current === incomingNmcAccessToken) {
      return;
    }

    bootstrapTokenRef.current = incomingNmcAccessToken;
    setIsNmcBootstrapping(true);

    const cleanCurrentUrl = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      params.delete("accessToken");
      params.delete("access_token");
      params.delete("refreshToken");
      params.delete("refresh_token");
      const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
    };

    const bootstrap = async () => {
      try {
        const response = await apiClient.post("/auth/nmc/session/bootstrap", {
          accessToken: incomingNmcAccessToken,
          refreshToken: incomingNmcRefreshToken || undefined,
        });
        const payload = response?.data?.data;
        const nextUser = payload?.user;
        const nextProfile = payload?.profile;
        const nextResources = payload?.resources || [];

        if (!nextUser) {
          throw new Error("Invalid bootstrap response");
        }

        queryClient.setQueryData(["auth", "profile"], {
          user: nextUser,
          profile: nextProfile,
          resources: nextResources,
        });

        const resolvedTenantSlug = nextUser.tenantSlug ?? user?.tenantSlug ?? "nmc";
        if (typeof window !== "undefined") {
          if (resolvedTenantSlug) {
            localStorage.setItem(
              ACTIVE_TENANT_SLUG_STORAGE_KEY,
              resolvedTenantSlug,
            );
          } else {
            localStorage.removeItem(ACTIVE_TENANT_SLUG_STORAGE_KEY);
          }
        }

        setUser({
          id: nextUser.id,
          email: nextUser.email,
          userType: nextUser.userType,
          roleId: nextUser.roleId,
          roleName: nextUser.roleName,
          isEmailVerified: nextUser.isEmailVerified,
          lastLoginAt: nextUser.lastLoginAt,
          firstName: nextProfile?.firstName || nextProfile?.fullName || "",
          lastName: nextProfile?.lastName || "",
          deptId: nextProfile?.deptId,
          tenantId: nextUser.tenantId ?? null,
          projectId: nextUser.projectId ?? null,
          tenantSlug: resolvedTenantSlug,
          tenantName: nextUser.tenantName ?? null,
          logoUrl: nextUser.logoUrl ?? null,
          availableThemes: nextUser.availableThemes ?? [],
          tenantSource: nextUser.tenantSource ?? null,
          userTenantId: nextUser.userTenantId ?? null,
          userProjectId: nextUser.userProjectId ?? null,
          assignmentTenantId: nextUser.assignmentTenantId ?? null,
          assignmentProjectId: nextUser.assignmentProjectId ?? null,
        });
        setResources(nextResources);
        fetchRoles().catch(() => undefined);
      } catch (error) {
        console.error("NMC session bootstrap failed:", error);
      } finally {
        cleanCurrentUrl();
        setIsNmcBootstrapping(false);
      }
    };

    bootstrap();
  }, [
    fetchRoles,
    incomingNmcAccessToken,
    incomingNmcRefreshToken,
    queryClient,
    setResources,
    setUser,
    user?.tenantSlug,
  ]);


  useEffect(() => {
    const handleScroll = () => {
      document.body.classList.toggle("sticky-header", window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isDashboard) {
      document.body.classList.add("dashboard-page");
    } else {
      document.body.classList.remove("dashboard-page");
    }
  }, [isDashboard]);

  useEffect(() => {
    const safeTenantTheme = String(tenantTheme || "default").toLowerCase();
    document.body.classList.add(`tenant-${safeTenantTheme}`);
    document.body.setAttribute("data-tenant-theme", safeTenantTheme);
    
    return () => {
      TENANT_PUBLIC_THEMES.forEach((theme) => {
        document.body.classList.remove(`tenant-${theme}`);
      });
      document.body.classList.remove("tenant-default");
      document.body.removeAttribute("data-tenant-theme");
    };
  }, [tenantTheme]);

  return (
    <>
      {isNmcBootstrapping && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "100vh" }}
        >
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}
      {!isNmcBootstrapping && (
        <>
      {!isDashboard && <Header tenantTheme={tenantTheme} />}
      <main className={`public-page tenant-${tenantTheme}`}>{children}</main>
      {!isDashboard && <Footer tenantTheme={tenantTheme} />}
        </>
      )}

      <Script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
