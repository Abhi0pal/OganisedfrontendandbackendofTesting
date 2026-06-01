import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

export interface Permission {
  id: number;
  module_id: number;
  action: string;
  description?: string;
  is_active: boolean;
  created_at: string;

  module?: {
    id: number;
    name: string;
    code: string;
  };
}

/* ---------------------------- */
/* Fetch All Permissions */
/* ---------------------------- */

export const usePermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await apiClient.get("/permissions");
      return res.data?.data || [];
    },
  });
};

/* ---------------------------- */
/* Fetch One Permission */
/* ---------------------------- */

export const usePermission = (id: number) => {
  return useQuery({
    queryKey: ["permissions", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/permissions/${id}`);
      return res.data;
    },
  });
};

/* ---------------------------- */
/* Create Permission */
/* ---------------------------- */

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      module_id: number;
      action: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post("/permissions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};

/* ---------------------------- */
/* Update Permission */
/* ---------------------------- */

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        module_id?: number;
        action?: string;
        description?: string;
        is_active?: boolean;
      };
    }) => {
      const res = await apiClient.patch(
        `/permissions/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", id] });
    },
  });
};

/* ---------------------------- */
/* Delete Permission */
/* ---------------------------- */

export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
};