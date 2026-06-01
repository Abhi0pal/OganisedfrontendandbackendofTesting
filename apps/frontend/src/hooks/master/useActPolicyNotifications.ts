import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

/**
 * Fetch Act / Policy / Notification list
 */
export const useActPolicyNotifications = (filters?: {
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['actPolicyNotifications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }

      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(
        `/master/actPolicyNotification?${params.toString()}`
      );

      return response.data;
    },
  });
};

/**
 * Create Act / Policy / Notification
 */
export const useCreateActPolicyNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post(
        '/master/actPolicyNotification',
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotifications'],
      });
    },
  });
};

/**
 * Update Act / Policy / Notification
 */
export const useUpdateActPolicyNotification = () => {
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
        `/master/actPolicyNotification/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotifications'],
      });
    },
  });
};

/**
 * Delete Act / Policy / Notification
 */
export const useDeleteActPolicyNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(
        `/master/actPolicyNotification/${id}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotifications'],
      });
    },
  });
};

/**
 * Toggle Active / Inactive
 */
export const useToggleActPolicyNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(
        `/master/actPolicyNotification/${id}/toggle`,
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotifications'],
      });
    },
  });
};

export const useUploadActPolicyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        '/master/actPolicyNotification/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data; // { filePath: string }
    },

    onSuccess: () => {
      // optional – only if listing depends on documents
      queryClient.invalidateQueries({
        queryKey: ['actPolicyNotifications'],
      });
    },
  });
};

/* ================= AMENDMENTS ================= */

export const useActPolicyNotificationAmendments = (id: number) => {
  return useQuery({
    queryKey: ['actPolicyNotificationAmendments', id],
    queryFn: async () => {
      const res = await apiClient.get(
        `/master/actPolicyNotification/${id}/amendments`
      );
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateAmendment = (id: number) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post(
        `/master/actPolicyNotification/${id}/amendments`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['actPolicyNotificationAmendments', id],
      });
    },
  });
};

export const useUpdateAmendment = (id: number) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ amendmentId, data }: any) => {
      const res = await apiClient.put(
        `/master/actPolicyNotification/amendments/${amendmentId}`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ['actPolicyNotificationAmendments', id],
      });
    },
  });
};

export const useUploadAmendmentDocument = (actId: number) => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file); // THIS IS CORRECT

      const res = await apiClient.post(
        `/master/actPolicyNotification/${actId}/amendments/upload`,
        fd,
        {
          headers: {
            // IMPORTANT: let axios set this automatically
            'Content-Type': undefined,
          },
        }
      );

      return res.data; // { filePath }
    },
  });
};



