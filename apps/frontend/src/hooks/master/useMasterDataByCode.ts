import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Fetch master_data records by master_definition code (e.g. 'DEPARTMENT', 'SUB_DEPARTMENT').
 * Step 1: resolves the master_definition id via /master/definitions/by-code/:code
 * Step 2: fetches all active master_data for that definition.
 * Returns flat array of { id: number, name: string }.
 */
export const useMasterDataByCode = (code: string) => {
  return useQuery<{ id: number; name: string }[]>({
    queryKey: ['master-data-by-code', code],
    queryFn: async () => {
      const upper = (s: string) => String(s ?? '').toUpperCase();
      const lower = (s: string) => String(s ?? '').toLowerCase();

      // Step 1: search definitions by code keyword, then pick best match
      const defRes = await apiClient.get(
        `/master/definitions?search=${encodeURIComponent(code)}&is_active=true`,
      );
      const defs: any[] = Array.isArray(defRes.data) ? defRes.data : [];
      if (defs.length === 0) return [];

      // Best-match detection: exact code → startsWith → contains → name contains
      const definition =
        defs.find((d) => upper(d.code) === upper(code)) ||
        defs.find((d) => upper(d.code).startsWith(upper(code))) ||
        defs.find((d) => upper(d.code).includes(upper(code))) ||
        defs.find((d) => lower(d.name).includes(lower(code))) ||
        defs[0];

      if (!definition?.id) return [];

      // Step 2: fetch master_data records for that definition
      const dataRes = await apiClient.get(
        `/master/data/by-master/${definition.id}?is_active=true&limit=1000`,
      );
      const raw = dataRes.data;
      const records: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      return records.map((r: any) => ({
        id: Number(r.id),
        name: r.name ?? (r.data as any)?.name ?? '',
      }));
    },
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
};
