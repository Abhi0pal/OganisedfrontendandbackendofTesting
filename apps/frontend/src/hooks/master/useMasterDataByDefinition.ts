import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MasterDataOption {
  id: string;
  name: string;
  abbr?: string;
  is_active: boolean;
}

/**
 * Fetch master_data records for a given master_definition ID.
 * Used in the Department dropdown of the Add/Edit Service form.
 * Returns all active records (no pagination).
 */
export const useMasterDataByDefinition = (masterDefinitionId?: number | null) => {
  return useQuery<MasterDataOption[]>({
    queryKey: ['master-data-by-definition', masterDefinitionId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/master/data/by-master/${masterDefinitionId}?is_active=true&limit=1000`,
      );
      // findByMasterId returns { total, page, limit, data: [...] }
      const raw = response.data;
      const records: any[] = Array.isArray(raw) ? raw : (raw?.data ?? []);
      return records.map((r: any) => ({
        id: String(r.id),
        name: r.name ?? (r.data as any)?.name ?? '',
        abbr: r.abbr ?? (r.data as any)?.abbr ?? undefined,
        is_active: r.is_active ?? true,
      }));
    },
    enabled: !!masterDefinitionId,
    staleTime: 5 * 60 * 1000,
  });
};
