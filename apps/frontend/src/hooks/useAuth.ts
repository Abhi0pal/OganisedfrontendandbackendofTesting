'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ACTIVE_TENANT_SLUG_STORAGE_KEY } from './useTheme';

const NMC_CITIZEN_LOGIN_URL =
  'https://dev-upyog.nmc.gov.in/upyog-ui/citizen/login';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const autoLogoutRef = useRef(false);

  const {
    user,
    roles,
    resources,
    hasFetched,
    setUser,
    setRoles,
    setResources,
    setLoading,
    setError,
    setHasFetched,
  } = useAuthStore();

  const isPublicRoute =
    pathname === '/' ||
    pathname === `/${locale}` ||
    pathname?.includes('/login') ||
    pathname?.includes('/register') ||
    pathname?.includes('/forgot-password') ||
    pathname?.includes('/reset-password') ||
    pathname?.includes('/resend-activation') ||
    pathname?.includes('/verify-email') ||
    pathname?.includes('/know-your-incentive') ||
    pathname?.includes('/incentive-calculator') ||
    pathname?.includes('/incentive-report') ||
    pathname?.includes('/kya');
  const hasIncomingNmcAccessToken = Boolean(
    String(
      searchParams?.get('accessToken') ||
        searchParams?.get('access_token') ||
        '',
    ).trim(),
  );

  // Fetch User Profile Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileAuthError,
  } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/auth/profile', { timeout: 8000 });
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 401) {
          // Return an explicit unauthenticated object instead of throwing
          // This allows React Query to cache the 'logged out' state
          // and prevents infinite unmount/remount loops from failed fetches
          return { unauthenticated: true };
        }
        throw err;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 15 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isActuallyUnauthorized = profileData?.unauthenticated || (profileAuthError as any)?.response?.status === 401;

  const getLoginTenantParam = useCallback((tenantSlug?: string | null) => {
    const normalizedTenantSlug = String(tenantSlug || "").trim().toLowerCase();

    if (normalizedTenantSlug === 'cp' || normalizedTenantSlug === 'cpcb') {
      return 'cpcb';
    }

    if (
      normalizedTenantSlug === 'rera' ||
      normalizedTenantSlug === 'trera' ||
      normalizedTenantSlug === 'trsra' ||
      normalizedTenantSlug === 'tsra'
    ) {
      return 'trera';
    }

    if (normalizedTenantSlug === 'nmc') {
      return 'nmc';
    }

    return normalizedTenantSlug;
  }, []);

  const getTenantAwareLoginPath = useCallback((tenantSlug?: string | null) => {
    const normalizedTenantSlug = getLoginTenantParam(tenantSlug);
    return normalizedTenantSlug
      ? `/${locale}/login?tenant=${encodeURIComponent(normalizedTenantSlug)}`
      : `/${locale}/login`;
  }, [getLoginTenantParam, locale]);

  const getPostLogoutPath = useCallback((tenantSlug?: string | null) => {
    const normalizedTenantSlug = getLoginTenantParam(tenantSlug);

    if (normalizedTenantSlug === 'nmc') {
      return NMC_CITIZEN_LOGIN_URL;
    }

    return getTenantAwareLoginPath(tenantSlug);
  }, [getLoginTenantParam, getTenantAwareLoginPath]);

  // Fetch Roles Query
  const { data: rolesData, refetch: fetchRolesQuery } = useQuery({
    queryKey: ['auth', 'roles'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/roles');
      return response.data.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache, roles rarely change
    retry: 1,
    enabled: !!profileData && !profileData.unauthenticated, // Only fetch roles if authenticated
  });

  // Sync Query Data to Zustand Store
  useEffect(() => {
    if (isProfileLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);
    setHasFetched(true);

    if (profileData && !profileData.unauthenticated) {
      const existingUser = useAuthStore.getState().user;
      const storedTenantSlug =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_TENANT_SLUG_STORAGE_KEY)
          : null;
      const resolvedTenantSlug =
        profileData.user.tenantSlug ?? existingUser?.tenantSlug ?? storedTenantSlug ?? null;

      if (typeof window !== 'undefined') {
        if (resolvedTenantSlug) {
          localStorage.setItem(ACTIVE_TENANT_SLUG_STORAGE_KEY, resolvedTenantSlug);
        } else {
          localStorage.removeItem(ACTIVE_TENANT_SLUG_STORAGE_KEY);
        }
      }

      setUser({
        id: profileData.user.id,
        email: profileData.user.email,
        userType: profileData.user.userType,
        roleId: profileData.user.roleId,
        roleName: profileData.user.roleName,
        isEmailVerified: profileData.user.isEmailVerified,
        lastLoginAt: profileData.user.lastLoginAt,
        firstName: profileData.profile?.firstName || profileData.profile?.fullName || '',
        lastName: profileData.profile?.lastName || '',
        deptId: profileData.profile?.deptId,
        tenantId: profileData.user.tenantId ?? existingUser?.tenantId ?? null,
        projectId: profileData.user.projectId ?? existingUser?.projectId ?? null,
        tenantSlug: resolvedTenantSlug,
        tenantName: profileData.user.tenantName ?? existingUser?.tenantName ?? null,
        logoUrl: profileData.user.logoUrl ?? existingUser?.logoUrl ?? null,
        availableThemes: profileData.user.availableThemes ?? existingUser?.availableThemes ?? [],
        tenantSource: profileData.user.tenantSource ?? existingUser?.tenantSource ?? null,
        userTenantId: profileData.user.userTenantId ?? existingUser?.userTenantId ?? null,
        userProjectId: profileData.user.userProjectId ?? existingUser?.userProjectId ?? null,
        assignmentTenantId: profileData.user.assignmentTenantId ?? existingUser?.assignmentTenantId ?? null,
        assignmentProjectId:
          profileData.user.assignmentProjectId ?? existingUser?.assignmentProjectId ?? null,
      });

      if (profileData.resources) {
        setResources(profileData.resources);
      }
      setError(null);
    }

    if (rolesData) {
      setRoles(rolesData);
    }
  }, [profileData, rolesData, isProfileLoading, setUser, setResources, setRoles, setLoading, setError, setHasFetched]);

  // Handle Auth Errors (401 Redirects)
  useEffect(() => {
    if (hasIncomingNmcAccessToken) {
      return;
    }

    if (isProfileError || profileData?.unauthenticated) {
      // Guard: if the store already has a user from a prior successful fetch,
      // do NOT clear state — trigger a refetch instead to re-verify.
      const existingUser = useAuthStore.getState().user;
      const storedTenantSlug =
        typeof window !== 'undefined'
          ? localStorage.getItem(ACTIVE_TENANT_SLUG_STORAGE_KEY)
          : null;
      if (existingUser) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
        return;
      }

      setUser(null);
      setResources([]);

      setError(isActuallyUnauthorized ? 'Not authenticated' : 'Access denied');

      if (isActuallyUnauthorized && !isPublicRoute) {
        router.replace(getTenantAwareLoginPath());
      }
    }
  }, [getTenantAwareLoginPath, hasIncomingNmcAccessToken, isProfileError, isActuallyUnauthorized, profileData, setUser, setResources, setError, isPublicRoute, router, queryClient]);

  // Logout Function
  const logout = useCallback(async () => {
    const currentUser = useAuthStore.getState().user;
    const loginPath = getPostLogoutPath(currentUser?.tenantSlug);
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      queryClient.removeQueries({ queryKey: ['auth'] });
      setHasFetched(false);
      setUser(null);
      setRoles([]);
      setResources([]);
      setError(null);
      setLoading(false);

      if (typeof window !== 'undefined') {
        window.location.href = loginPath;
        return;
      }
      router.replace(loginPath);
    }
  }, [getPostLogoutPath, queryClient, setUser, setRoles, setResources, setError, setLoading, setHasFetched, router]);

  // Handle Auto-Logout
  // Guard: skip auto-logout if the Zustand store already holds a valid user.
  // This prevents false logouts caused by stale React Query cache returning
  // { unauthenticated: true } momentarily during client-side navigation.
  useEffect(() => {
    if (hasIncomingNmcAccessToken) {
      return;
    }

    if (autoLogoutRef.current) return;

    if (!isProfileLoading && isActuallyUnauthorized && !isPublicRoute) {
      // If we already have a user in the store (from a previous successful fetch),
      // do NOT auto-logout — instead trigger a fresh refetch to confirm.
      const existingUser = useAuthStore.getState().user;
      if (existingUser) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
        return;
      }
      autoLogoutRef.current = true;
      logout();
    }
  }, [hasIncomingNmcAccessToken, isProfileLoading, isActuallyUnauthorized, isPublicRoute, logout, queryClient]);

  // loading stays true until React Query finishes AND the useEffect has
  // synced profileData into the Zustand store (hasFetched becomes true).
  // This prevents a brief window where loading=false but user=null.
  const isLoading = isProfileLoading || !hasFetched;

  return {
    user,
    roles,
    resources,
    loading: isLoading,
    error: isProfileError ? 'Authentication error' : null,
    setUser,
    setRoles,
    setResources,
    setLoading,
    setError,
    logout,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] }),
    fetchRoles: fetchRolesQuery,
  };
}
