import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Scheme {
    id: number | null;
    policy_id: number | null;
    scheme_name: string;
    scheme_code: string;
    form_structure_json: any;
    required_documents: any;
    calculation_logic: any;
    workflow_config: any;
    admin_view_config: any;
    version: number;
    is_current_version: boolean;
    valid_from: string;
    valid_to: string;
    created_at: string;
    policy?: {
        id: number;
        policy_name: string;
        department?: {
            id: number;
            name: string;
        };
    };
}
interface MasterTableRow {
    [key: string]: any;
}

interface MasterTable {
    master_code: string;
    master_name: string;
    label_column: string;
    value_column: string;
    data: MasterTableRow[]; // updated: includes all rows
    columns: { code: string; label: string }[]; // <-- add this
}


export const useSchemes = (filters?: {
    isCurrentVersion?: boolean;
    search?: string;
    policyId?: number;
    enabled?: boolean;
}) => {
    return useQuery({
        queryKey: ['schemes', filters],
        enabled: filters?.enabled ?? true,
        queryFn: async () => {
            const params = new URLSearchParams();
            
            if (filters?.isCurrentVersion !== undefined) {
                params.append('isCurrentVersion', filters.isCurrentVersion.toString());
            }
            if (filters?.search) {
                params.append('search', filters.search);
            }
            if (filters?.policyId !== undefined) {
                params.append('policyId', filters.policyId.toString());
            }

            const response = await apiClient.get(`/master/schemes?${params}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 10,
        refetchOnWindowFocus: false,
    });
};

export const useCreateScheme = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/master/schemes', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemes'] });
        },
    });
};

export const useUpdateScheme = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await apiClient.put(`/master/schemes/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemes'] });
        },
    });
};

export const useDeleteScheme = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/master/schemes/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemes'] });
        },
    });
};

export const useToggleScheme = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.put(`/master/schemes/${id}/toggle`, {});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemes'] });
        },
    });
};

export const useMasterTables = () => {
    return useQuery({
        queryKey: ['masterTables'],
        queryFn: async () => {
            const response = await apiClient.get('/master/schemes/master-tables');
            return response.data as MasterTable[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
        refetchOnWindowFocus: false,
    });
};
