import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MasterTable {
    id: number;
    master_name: string;
    master_code: string;
    api_endpoint?: string;
    value_column: string;
    label_column: string;
    parent_master_id?: number;
    parent_column?: string;
}

export interface MasterTableOption {
    value: number | string;
    label: string;
}

/**
 * Hook to fetch list of available master tables for dropdown selection in Field Master
 */
export const useMasterTablesDropdown = () => {
    return useQuery<MasterTable[]>({
        queryKey: ['master-tables', 'dropdown'],
        queryFn: async () => {
            const response = await apiClient.get('/master/master-tables/dropdown');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
};

/**
 * Hook to fetch all master tables with full details (for admin management)
 */
export const useMasterTables = (filters?: { is_active?: boolean; search?: string }) => {
    return useQuery({
        queryKey: ['master-tables', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.is_active !== undefined) {
                params.append('is_active', filters.is_active.toString());
            }
            if (filters?.search) {
                params.append('search', filters.search);
            }

            const response = await apiClient.get(`/master/master-tables?${params.toString()}`);
            return response.data;
        },
    });
};

/**
 * Hook to fetch dropdown options from a specific master table
 * @param code - Master table code (e.g., 'DISTRICT')
 * @param parentValue - Optional parent value for cascading dropdowns
 */
export const useMasterTableOptions = (code: string, parentValue?: string | number) => {
    return useQuery<MasterTableOption[]>({
        queryKey: ['master-tables', 'options', code, parentValue],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (parentValue !== undefined && parentValue !== null && parentValue !== '') {
                params.append('parent', parentValue.toString());
            }

            const response = await apiClient.get(`/master/master-tables/${code}/options?${params.toString()}`);
            return response.data;
        },
        enabled: !!code, // Only fetch when code is provided
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
};
