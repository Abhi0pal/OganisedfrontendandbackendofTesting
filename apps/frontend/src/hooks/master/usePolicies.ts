import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface Policy {
    id: number;
    department_id: number;
    policy_name: string;
    policy_code: string;
    description?: string;
    valid_from: string;
    valid_to: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    department?: {
        id: number;
        name: string;
    };
}

export const usePolicies = (filters?: { isActive?: boolean; search?: string; departmentId?: number }) => {
    return useQuery({
        queryKey: ['policies', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.isActive !== undefined) {
                params.append('isActive', filters.isActive.toString());
            }
            if (filters?.search) {
                params.append('search', filters.search);
            }
            if (filters?.departmentId !== undefined) {
                params.append('departmentId', filters.departmentId.toString());
            }

            const response = await apiClient.get(`/master/policies?${params}`);
            return response.data;
        },
    });
};

export const useCreatePolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: any) => {
            const response = await apiClient.post('/master/policies', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
    });
};

export const useUpdatePolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            const response = await apiClient.put(`/master/policies/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
    });
};

export const useDeletePolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/master/policies/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
    });
};

export const useTogglePolicy = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiClient.put(`/master/policies/${id}/toggle`, {});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['policies'] });
        },
    });
};
