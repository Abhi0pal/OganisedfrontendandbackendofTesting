import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Fetch Amendments for a specific Act / Policy / Notification
 */
export const useActPolicyNotificationAmendments = (
  actPolicyNotificationId: number,
  filters?: {
    isActive?: boolean;
    search?: string;
  }
) => {
  return useQuery({
    queryKey: [
      'actPolicyNotificationAmendments',
      actPolicyNotificationId,
      filters,
    ],
    enabled: !!actPolicyNotificationId,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(
        `/master/actPolicyNotification/${actPolicyNotificationId}/amendments?${params.toString()}`
      );

      return response.data;
    },
  });
};

/**
 * Create Amendment
 */
export const useCreateActPolicyNotificationAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      actPolicyNotificationId: number;
      name: string;
      level?: string;
      brief?: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post(
        `/master/actPolicyNotification/amendments`,
        data
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'actPolicyNotificationAmendments',
          variables.actPolicyNotificationId,
        ],
      });
    },
  });
};

/**
 * Update Amendment
 */
export const useUpdateActPolicyNotificationAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: any;
    }) => {
      const response = await apiClient.put(
        `/master/actPolicyNotification/amendments/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotificationAmendments'],
      });
    },
  });
};

/**
 * Delete Amendment
 */
export const useDeleteActPolicyNotificationAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(
        `/master/actPolicyNotification/amendments/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotificationAmendments'],
      });
    },
  });
};

/**
 * Toggle Amendment Active / Inactive
 */
export const useToggleActPolicyNotificationAmendment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(
        `/master/actPolicyNotification/amendments/${id}/toggle`,
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotificationAmendments'],
      });
    },
  });
};
