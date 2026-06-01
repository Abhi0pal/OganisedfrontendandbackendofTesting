import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Field {
    id: number;
    field_code: string;
    field_label: string;
    component_type: string;
    data_type: string;
    lookup_config?: any;
    default_validation?: any;
    is_active: boolean;
    created_at: string;
}

export const useFields = (filters?: { isActive?: boolean; search?: string }) => {
    return useQuery({
        queryKey: ['fields', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.isActive !== undefined) {
                params.append('isActive', filters.isActive.toString());
            }
            if (filters?.search) {
                params.append('search', filters.search);
            }

            const response = await apiClient.get(`/master/fields?${params}`);
            return response.data;
        },
    });
};

export const useCreateField = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/master/fields', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fields'] });
        },
    });
};

export const useUpdateField = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await apiClient.put(`/master/fields/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fields'] });
        },
    });
};

export const useDeleteField = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/master/fields/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fields'] });
        },
    });
};

export const useToggleField = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.put(`/master/fields/${id}/toggle`, {});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fields'] });
        },
    });
};

export const useBulkCreateFields = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (fields: Array<{ field_code: string; field_label: string; data_type: string; is_active?: boolean }>) => {
            const response = await apiClient.post('/master/fields/bulk', { fields });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fields'] });
        },
    });
};
