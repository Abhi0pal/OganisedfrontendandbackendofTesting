import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

export type PermissionEffect =
  | "ALLOW"
  | "DENY";
/**
 * RolePermission interface (aligned with backend)
 */

export interface RolePermission {
  id: number;

  role_id: number;
  permission_id: number;

  effect: PermissionEffect;
  is_active: boolean;

  created_at: string;
  updated_at: string;

  role?: {
    id: number;
    name: string;
  };

  permission?: {
    id: number;
    name: string;
    code?: string;
  };
}

/* ======================================================
   QUERIES
====================================================== */

/**
 * Fetch all role-permissions
 */
export const useRolePermissions = () => {
  return useQuery<RolePermission[]>({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const res = await apiClient.get("/role-permissions");
      return res.data;
    },
  });
};

/**
 * Fetch single role-permission by ID
 */
export const useRolePermission = (id: number) => {
  return useQuery<RolePermission>({
    queryKey: ["role-permissions", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/role-permissions/${id}`);
      return res.data;
    },
  });
};

/**
 * Fetch active permissions for a role (RBAC resolution)
 */
export const useRolePermissionsByRole = (roleId: number) => {
  return useQuery<RolePermission[]>({
    queryKey: ["role-permissions", "by-role", roleId],
    enabled: !!roleId,
    queryFn: async () => {
      const res = await apiClient.get(
        `/role-permissions/by-role/${roleId}`,
      );
      return res.data;
    },
  });
};

/* ======================================================
   MUTATIONS
====================================================== */

/**
 * Create role-permission mapping
 */
export const useCreateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      role_id: number;
      permission_id: number;
      effect?: PermissionEffect;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post("/role-permissions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
};

/**
 * Update role-permission (effect / is_active)
 */
export const useUpdateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        effect?: PermissionEffect;
        is_active?: boolean;
      };
    }) => {
      const res = await apiClient.patch(
        `/role-permissions/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", id],
      });
    },
  });
};

/**
 * Hard delete role-permission
 */
export const useDeleteRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/role-permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
};