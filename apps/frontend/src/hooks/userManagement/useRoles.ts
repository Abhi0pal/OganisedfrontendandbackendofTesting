import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/**
 * Role interface (aligned with backend & UI)
 */
export interface Role {
  id: number;
  name: string;
  description?: string;

  // Relations
  tenant_id?: number;
  parent_id?: number | null;
  project_id?: number;

  // Hierarchy
  level?: number;

  // Status
  is_active: boolean;
  is_system: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Optional relation (read-only / edit support)
  roleProjects?: {
    project: {
      id: number;
      name?: string;
    };
  }[];
}

/**
 * Fetch all roles
 */
export const useRoles = () => {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get("/roles");
      return response.data;
    },
  });
};

/**
 * Fetch single role by ID
 */
export const useRole = (id: number) => {
  return useQuery<Role>({
    queryKey: ["roles", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await apiClient.get(`/roles/${id}`);
      return response.data;
    },
  });
};

/**
 * Create role
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      tenant_id: number | null;
      project_id?: number | null;
      parent_id?: number | null;
      level?: number;
      is_active?: boolean;
    }) => {
      const response = await apiClient.post("/roles", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

/**
 * Update role (supports toggle, hierarchy, project, tenant, etc.)
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        description?: string;
        tenant_id?: number | null;
        project_id?: number | null;
        parent_id?: number | null;
        level?: number;
        is_active?: boolean;
      };
    }) => {
      const response = await apiClient.patch(`/roles/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", id] });
    },
  });
};

/**
 * Delete role (hard delete)
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};