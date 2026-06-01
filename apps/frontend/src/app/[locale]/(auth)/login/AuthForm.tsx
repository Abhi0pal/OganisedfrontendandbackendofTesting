"use client";

import "./style.css";
import React, { FormEvent, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useLoading } from "@/contexts/LoadingContext";
import { ACTIVE_TENANT_SLUG_STORAGE_KEY } from "@/hooks/useTheme";
const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || "";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// Environment flags
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";
const IS_PROD = ENVIRONMENT === "production";
const TENANT_LOGIN_THEMES = ["trera", "nmc", "cpcb"] as const;

function normalizeRoleKey(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function isInvestorPortalRole(roleName?: string | null): boolean {
  const normalizedRoleName = normalizeRoleKey(roleName);
  return (
    normalizedRoleName === "investor" ||
    normalizedRoleName.includes("bwg") ||
    normalizedRoleName.includes("mrf") ||
    normalizedRoleName.includes("landfill") ||
    normalizedRoleName.includes("facility")
  );
}

function useDynamicHelp(value: string) {
  const [focused, setFocused] = useState(false);
  const show = focused || value.length > 0;
  return { show, setFocused };
}

function isEmailValid(v: string): boolean {
  if (v.length < 6 || v.length > 254) return false;
  return /.+@.+\..+/.test(v);
}

function validatePassword(pw: string): { ok: boolean; reason?: string } {
  if (pw.length < 6)
    return { ok: false, reason: "Password must be at least 6 characters." };
  if (pw.length > 128)
    return { ok: false, reason: "Password must be at most 128 characters." };
  return { ok: true };
}

export default function AuthForm() {
  const t = useTranslations("LoginPage");
  const { setUser, setResources, fetchRoles } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const tenantParam = String(searchParams.get("tenant") || "").toLowerCase().trim();
  const registeredStatus = searchParams.get("registered");
  const tenantTheme = TENANT_LOGIN_THEMES.includes(tenantParam as typeof TENANT_LOGIN_THEMES[number])
    ? tenantParam
    : "default";
  const registerHref = tenantTheme === "default" ? "/register" : `/register?tenant=${tenantTheme}`;
  const forgotPasswordHref =
    tenantTheme === "default" ? "/forgot-password" : `/forgot-password?tenant=${tenantTheme}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailHelp = useDynamicHelp(email);
  const passwordHelp = useDynamicHelp(password);

  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startLoading();
    setErrorMsg(null);

    if (!isEmailValid(email)) {
      setErrorMsg("Please enter a valid email.");
      stopLoading();
      return;
    }

    const pw = validatePassword(password);
    if (!pw.ok) {
      setErrorMsg(pw.reason || "Invalid password.");
      stopLoading();
      return;
    }

    if (IS_PROD && !captchaToken) {
      setErrorMsg("Please complete the CAPTCHA.");
      stopLoading();
      return;
    }

    setSubmitting(true);

    try {
      const bodyData: any = { email, password };
      if (IS_PROD) {
        bodyData.hcaptchaToken = captchaToken;
      }

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important: include cookies for HttpOnly auth
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data?.message || "Login failed. Try again.");
        if (IS_PROD) {
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
        }
        setSubmitting(false);
        return;
      }

      const { user, profile, resources } = data.data;

      // IMPORTANT: Update React Query cache with the login response data
      // This prevents the stale { unauthenticated: true } from redirecting back to login
      queryClient.setQueryData(['auth', 'profile'], {
        user,
        profile,
        resources,
      });

      // Now set the Zustand store
      const resolvedTenantSlug =
        user.tenantSlug ?? (tenantTheme !== "default" ? tenantTheme : null);
      if (typeof window !== "undefined") {
        if (resolvedTenantSlug) {
          localStorage.setItem(ACTIVE_TENANT_SLUG_STORAGE_KEY, resolvedTenantSlug);
        } else {
          localStorage.removeItem(ACTIVE_TENANT_SLUG_STORAGE_KEY);
        }
      }

      setUser({
        id: user.id,
        email: user.email,
        userType: user.userType,
        roleId: user.roleId,
        roleName: user.roleName,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        firstName: profile?.firstName || profile?.fullName || "",
        lastName: profile?.lastName || "",
        deptId: profile?.deptId,
        tenantId: user.tenantId ?? null,
        projectId: user.projectId ?? null,
        tenantSlug: resolvedTenantSlug,
        tenantName: user.tenantName ?? null,
        logoUrl: user.logoUrl ?? null,
        availableThemes: user.availableThemes ?? [],
        tenantSource: user.tenantSource ?? null,
        userTenantId: user.userTenantId ?? null,
        userProjectId: user.userProjectId ?? null,
        assignmentTenantId: user.assignmentTenantId ?? null,
        assignmentProjectId: user.assignmentProjectId ?? null,
      });

      if (resources) {
        setResources(resources);
      }

      console.log("User logged in:", user);

      // Fetch roles in background; do not block login redirect on this call.
      fetchRoles().catch(() => undefined);

      // Dynamic routing based on resources
      console.log("Determining redirect based on resources...");

      // Primary User Type Checks (Most Specific - Based on user_type enum)
      const normalizedUserType = String(user.userType || "").toUpperCase();
      const numericRoleId = Number(user.roleId || 0);
      const isInvestorPortalUser =
        normalizedUserType === "INVESTOR" || isInvestorPortalRole(user.roleName);

      if (normalizedUserType === "CIS_USER") {
        console.log("CIS User detected, redirecting to Department Dashboard");
        router.replace("/department/fb-dashboard");
        return;
      }

      if (normalizedUserType === "INSPECTOR") {
        console.log("Inspector detected, redirecting to Inspector Dashboard");
        router.replace("/department/inspector/dashboard");
        return;
      }

      // Role-based Checks (For DEPARTMENT type users)
      if (user.roleName === "admin") {
        console.log("Admin User detected, redirecting to Admin Dashboard");
        router.replace("/admin/dashboard");
        return;
      }

      if (user.roleName === "CIS_Admin") {
        console.log(
          "CIS Admin Role detected, redirecting to Department Dashboard",
        );
        router.replace("/department/fb-dashboard");
        return;
      }

      if (user.roleName === "Inspector") {
        console.log(
          "Inspector Role detected, redirecting to Inspector Dashboard",
        );
        router.replace("/department/inspector/dashboard");
        return;
      }
      // Tenant Admin → Workflow Builder
      if (String(user.roleName || "").toUpperCase() === "TENANT_ADMIN") {
        console.log("Tenant Admin detected, redirecting to Workflow Builder");
        router.replace("/admin/workflow-builder");
        return;
      }

      if (
        normalizedUserType === "DEPARTMENT" ||
        [3, 7, 33].includes(numericRoleId)
      ) {
        router.replace("/department/fb-dashboard");
        return;
      }
      // Special check for JD Portal (Only if not caught by above roles)
      if (resources?.some((r: any) => r.code === "JD_PORTAL")) {
        console.log("JD User detected, redirecting to JD Portal");
        router.replace("/investor/inspections/jd-portal");
        return;
      }

      console.log("User type:", user.userType, "Role:", user.roleName);

      let redirectPath = "/"; // Default fallback
      let dashboardResource = null;

      // Match dashboard resource to user type to avoid conflicts
      if (resources && resources.length > 0) {
        if (isInvestorPortalUser) {
          // Investors get INVESTOR_DASHBOARD
          dashboardResource = resources.find(
            (r: any) => r.code === "INVESTOR_DASHBOARD",
          );
        } else if (user.userType === "DEPARTMENT") {
          // Department users - check if admin or regular department user
          if (user.roleName === "admin") {
            // Admin gets DASHBOARD_VIEW (admin dashboard)
            dashboardResource = resources.find(
              (r: any) => r.code === "DASHBOARD_VIEW",
            );
          } else {
            // Regular department user gets DEPARTMENT_DASHBOARD
            dashboardResource = resources.find(
              (r: any) => r.code === "DEPARTMENT_DASHBOARD",
            );
          }
        }

        // Fallback: Look for any dashboard resource if specific one not found
        if (!dashboardResource) {
          dashboardResource = resources.find(
            (r: any) =>
              r.code === "DASHBOARD_VIEW" ||
              r.code === "INVESTOR_DASHBOARD" ||
              r.code === "DEPARTMENT_DASHBOARD",
          );
        }
      }

      if (dashboardResource) {
        console.log("Found dashboard resource:", dashboardResource);
        redirectPath = dashboardResource.path;
      } else {
        console.log(
          "No specific dashboard resource found. Using fallback logic.",
        );
        // Fallback logic if no dashboard resource is assigned
        if (isInvestorPortalUser) {
          redirectPath = "/investor/dashboard";
        } else if (user.roleName === "admin" || user.roleId === 9) {
          redirectPath = "/admin/dashboard";
        } else {
          redirectPath = "/department/fb-dashboard"; // Fixed: was /department/fb-dashboard
        }
      }

      console.log("Redirecting to:", redirectPath);

      // Use replace instead of push to prevent back button issues
      router.replace(redirectPath);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Network error. Please try again.");
      if (IS_PROD) {
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      }
    } finally {
      setSubmitting(false);
      stopLoading();
    }
  };

  return (
    <div className={`login-wrapper tenant-${tenantTheme}`} data-login-tenant={tenantTheme}>

      <div className="login-card">

        {/* LEFT SIDE */}
        <div className="login-left">
          <div className="accent"></div>

          <h1>Login</h1>
          <p className="subtitle">
            Welcome back! Please sign in to continue.
          </p>
          <form onSubmit={onSubmit} noValidate>
            {registeredStatus === "success" && (
              <div className="alert alert-success" role="alert">
                Registration successful. Please log in with your new account.
              </div>
            )}

            {errorMsg && (
              <div className="alert alert-danger" role="alert">
                {errorMsg}
              </div>
            )}

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="emailInput" className="form-label">
                Username or Email
              </label>
              <input
                id="emailInput"
                name="email"
                type="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => emailHelp.setFocused(true)}
                onBlur={() => emailHelp.setFocused(false)}
                required
              />
              {emailHelp.show && (
                <div className="form-text text-danger">
                  We&apos;ll never share your email with anyone else.
                </div>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label htmlFor="passwordInput" className="form-label">
                  {t("Password")}
                </label>
                <a className="forgot" href={forgotPasswordHref}>{t("Forgot Password")}</a>

              </div>
              <div className="input-group">
                <input
                  id="passwordInput"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => passwordHelp.setFocused(true)}
                  onBlur={() => passwordHelp.setFocused(false)}
                  required
                  minLength={6}
                  maxLength={128}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {passwordHelp.show && (
                <div className="form-text text-danger">
                  Use at least 6 characters; longer passphrases are stronger.
                </div>
              )}
            </div>

            {/* CAPTCHA (only in production) */}
            {IS_PROD && (
              <div className="mb-4">
                <label className="form-label">CAPTCHA</label>
                <HCaptcha
                  ref={captchaRef}
                  sitekey={SITEKEY}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn login-btn w-100 justify-content-center"
              disabled={submitting}
            >
              {submitting ? t("Logging in") : t("Log In")}
            </button>

            <div className="signup-section">
              <p className="signup" >
                {t("Don't have an account")}?{" "}
                <a style={{ color: "#FFDB00" }} href={registerHref}>Sign up</a>
              </p>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="resend-btn"
                onClick={() => router.push("/resend-activation")}
              >
                {t("Resend Activation Link")}
              </button>
            </div>
          </form>

        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className="login-right">
          <div className="overlay">

          </div>
        </div>

      </div>
    </div>
  );
}
