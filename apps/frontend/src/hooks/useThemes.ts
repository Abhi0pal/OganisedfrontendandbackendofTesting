'use client';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface ThemeOption {
  id: string;
  name: string;
  label: string;
}

export const DEFAULT_THEMES: ThemeOption[] = [
  { id: 'light', name: 'Light', label: 'Light' },
  { id: 'dark', name: 'Dark', label: 'Dark' },
  { id: 'brand', name: 'Brand', label: 'Brand' },
];

function toReadableThemeName(value: string) {
  return value
    .replace(/[-_]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeThemeOptions(value: unknown): ThemeOption[] {
  if (!Array.isArray(value)) return [];

  const normalizedThemes = value
    .map((theme) => {
      if (typeof theme === 'string') {
        const id = theme.trim();
        if (!id) return null;
        const readableName = toReadableThemeName(id);
        return { id, name: readableName, label: readableName };
      }

      if (!theme || typeof theme !== 'object') return null;

      const themeRecord = theme as Record<string, unknown>;
      const id = String(themeRecord.id ?? themeRecord.name ?? '').trim();
      if (!id) return null;

      const readableId = toReadableThemeName(id);
      const name = String(themeRecord.name ?? readableId).trim() || readableId;
      const label = String(themeRecord.label ?? name).trim() || name;

      return { id, name, label };
    })
    .filter((theme): theme is ThemeOption => Boolean(theme));

  return Array.from(
    new Map(normalizedThemes.map((theme) => [theme.id, theme])).values(),
  );
}

export function useThemes(tenantId?: number | null) {
  return useQuery<ThemeOption[]>({
    queryKey: ['themes', tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/tenants/${tenantId}/themes`);
        const themes = normalizeThemeOptions(response.data);
        return themes.length > 0 ? themes : DEFAULT_THEMES;
      } catch (error) {
        console.error('Failed to fetch themes:', error);
        return DEFAULT_THEMES;
      }
    },
    placeholderData: DEFAULT_THEMES,
    staleTime: 60 * 60 * 1000,
  });
}
