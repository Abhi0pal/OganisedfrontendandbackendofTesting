'use client';
import { useCallback, useEffect, useState } from 'react';

export const ACTIVE_TENANT_SLUG_STORAGE_KEY = 'activeTenantSlug';
const THEME_STORAGE_KEY = 'theme';
const THEME_CHANGE_EVENT = 'app-theme-change';

const TENANT_THEME_ALIASES: Record<string, string> = {
  cp: 'cpcb',
  cpcb: 'cpcb',
  nmc: 'nmc',
  tsra: 'rera',
  trsra: 'rera',
  trera: 'rera',
  rera: 'rera',
  default: 'default',
};

function normalizeThemeValue(value?: string | null) {
  const normalizedValue = String(value || '')
    .trim()
    .toLowerCase();

  return TENANT_THEME_ALIASES[normalizedValue] ?? normalizedValue ?? 'default';
}

function applyTheme(value?: string | null) {
  const normalizedTheme = normalizeThemeValue(value);

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', normalizedTheme);
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: normalizedTheme }),
    );
  }

  return normalizedTheme;
}

export function resolveTenantTheme(tenantSlug?: string | null, availableThemes?: unknown) {
  const normalizedTenantTheme = normalizeThemeValue(tenantSlug);

  if (normalizedTenantTheme !== 'default') {
    return normalizedTenantTheme;
  }

  if (Array.isArray(availableThemes)) {
    for (const theme of availableThemes) {
      if (typeof theme === 'string') {
        const normalizedTheme = normalizeThemeValue(theme);
        if (normalizedTheme !== 'default') return normalizedTheme;
        continue;
      }

      if (theme && typeof theme === 'object') {
        const themeRecord = theme as Record<string, unknown>;
        const candidate = normalizeThemeValue(
          String(themeRecord.id ?? themeRecord.name ?? ''),
        );

        if (candidate !== 'default') return candidate;
      }
    }
  }

  return 'default';
}

export function useTheme() {
  const [theme, setTheme] = useState<string>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = normalizeThemeValue(localStorage.getItem(THEME_STORAGE_KEY));
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const next = normalizeThemeValue(customEvent.detail);
      setTheme(prev => (prev === next ? prev : next));
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      setTheme(normalizeThemeValue(event.newValue));
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        handleThemeChange as EventListener,
      );
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changeTheme = useCallback((newTheme: string) => {
    const normalizedTheme = applyTheme(newTheme);
    setTheme(normalizedTheme);
  }, []);

  return { theme, changeTheme, mounted };
}
