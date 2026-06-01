'use client';
import React from 'react';
import { resolveTenantTheme, useTheme } from '@/hooks/useTheme';
import { DEFAULT_THEMES, normalizeThemeOptions, useThemes } from '@/hooks/useThemes';

export default function ThemeSelector({
  tenantId,
  tenantSlug,
  availableThemes,
}: {
  tenantId?: number | null;
  tenantSlug?: string | null;
  availableThemes?: unknown;
}) {
  const { theme, changeTheme, mounted } = useTheme();
  const { data: fetchedThemes = DEFAULT_THEMES, isLoading } = useThemes(tenantId);
  const userThemes = React.useMemo(
    () => normalizeThemeOptions(availableThemes),
    [availableThemes],
  );
  const tenantThemeFallback = React.useMemo(() => {
    const resolvedTenantTheme = resolveTenantTheme(tenantSlug, availableThemes);
    return resolvedTenantTheme === 'default'
      ? []
      : normalizeThemeOptions([resolvedTenantTheme]);
  }, [availableThemes, tenantSlug]);
  const themes = React.useMemo(() => {
    const mergedThemes = [
      ...tenantThemeFallback,
      ...userThemes,
      ...fetchedThemes,
    ];

    return Array.from(
      new Map(mergedThemes.map((themeOption) => [themeOption.id, themeOption])).values(),
    );
  }, [fetchedThemes, tenantThemeFallback, userThemes]);
  const selectedTheme = themes.some((themeOption) => themeOption.id === theme)
    ? theme
    : (themes[0]?.id ?? 'default');

  // Keep a ref so the effect can read the current theme without it being a dep.
  // This prevents a feedback loop: theme change → effect fires → changeTheme →
  // event → setTheme in all instances → repeat.
  const themeRef = React.useRef(theme);
  themeRef.current = theme;

  React.useEffect(() => {
    if (!mounted || themes.length === 0) return;
    if (!themes.some((themeOption) => themeOption.id === themeRef.current)) {
      changeTheme(themes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeTheme, mounted, themes]); // 'theme' intentionally omitted — use ref

  if (!mounted || (isLoading && themes.length === 0)) return null;

  return (
    <div className="theme-selector">
      <select
        value={selectedTheme}
        onChange={(e) => changeTheme(e.target.value)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
          cursor: 'pointer',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.3s ease',
        }}
      >
        {themes.map((themeOption) => (
          <option key={themeOption.id} value={themeOption.id}>
            {themeOption.label}
          </option>
        ))}
      </select>
    </div>
  );
}
