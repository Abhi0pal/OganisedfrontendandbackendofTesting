import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/* ------------------------------------------------------------------ */
/* Interfaces (aligned with backend + Prisma)                          */
/* ------------------------------------------------------------------ */

export interface UserRoleAssignment {
  id: number;
  assignment_identifier?: string | null;

  user_id: string; // bigint serialized as string
  role_id: number;
  tenant_id?: number | null;
  project_id?: number | null;

  valid_from?: string | null;
  valid_until?: string | null;

  transfer_order_no?: string | null;
  transfer_reason?: string | null;
  transferred_from_id?: number | null;

  assigned_by?: string | null; // bigint serialized as string
  remarks?: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

/**
 * ✅ Fetch all user-role assignments
 */
export const useUserRoleAssignments = () => {
  return useQuery<UserRoleAssignment[]>({
    queryKey: ["user-role-assignments"],
    queryFn: async () => {
      const res = await apiClient.get("/user-role-assignments");
      return res.data;
    },
  });
};

/**
 * ✅ Fetch a single assignment by ID
 */
export const useUserRoleAssignment = (id: number) => {
  return useQuery<UserRoleAssignment>({
    queryKey: ["user-role-assignments", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await apiClient.get(`/user-role-assignments/${id}`);
      return res.data;
    },
  });
};

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

/**
 * ✅ Create user-role assignment
 */
export const useCreateUserRoleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: number;
      roleId: number;
      tenantId?: number | null;
      projectId?: number | null;

      validFrom?: string | null;
      validUntil?: string | null;

      transferOrderNo?: string | null;
      transferReason?: string | null;
      transferredFromId?: number | null;

      assignedBy?: number | null;
      remarks?: string | null;

      isActive: boolean;
    }) => {
      const res = await apiClient.post("/user-role-assignments", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-role-assignments"] });
    },
  });
};

/**
 * ✅ Update user-role assignment
 */
export const useUpdateUserRoleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        roleId?: number;
        tenantId?: number | null;
        projectId?: number | null;

        validFrom?: string | null;
        validUntil?: string | null;

        transferOrderNo?: string | null;
        transferReason?: string | null;
        transferredFromId?: number | null;

        assignedBy?: number | null;
        remarks?: string | null;

        isActive?: boolean;
      };
    }) => {
      const res = await apiClient.put(
        `/user-role-assignments/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["user-role-assignments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-role-assignments", id],
      });
    },
  });
};

/**
 * ✅ Delete user-role assignment
 */
export const useDeleteUserRoleAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/user-role-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-role-assignments"] });
    },
  });
};
