import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/* =========================================================
   TYPES
========================================================= */

export interface UserAssignmentPermissionOverride {
  id: number;
  assignment_id: string;
  assignment_identifier?: string | null;
  permission_id: number;
  effect: "ALLOW" | "DENY";
  reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  assignment?: {
    id: number;
    user_id: string;
    role_id: number;
    valid_from?: string | null;
    valid_until?: string | null;
    transfer_order_no?: string | null;
    assignment_identifier?: string | null;
  };
  permission?: {
    id: number;
    action: string;
    module_id?: number;
    description?: string | null;
  };
}

/* =========================================================
   FETCH ALL
========================================================= */

export const useUserAssignmentPermissionOverrides = () => {
  return useQuery<UserAssignmentPermissionOverride[]>({
    queryKey: ["user-assignment-permission-overrides"],
    queryFn: async () => {
      const res = await apiClient.get(
        "/user-assignment-permission-overrides",
      );
      return res.data;
    },
  });
};

/* =========================================================
   CREATE  ✅ includes created_by
========================================================= */

export const useCreateUserAssignmentPermissionOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      assignment_id: string;
      permission_id: number;
      effect: "ALLOW" | "DENY";
      reason?: string;
      is_active?: boolean;
    }) => {
      const res = await apiClient.post(
        "/user-assignment-permission-overrides",
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-assignment-permission-overrides"],
      });
    },
  });
};

/* =========================================================
   UPDATE  ❌ no assignment_id / permission_id / created_by
========================================================= */

export const useUpdateUserAssignmentPermissionOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        effect?: "ALLOW" | "DENY";
        reason?: string;
        is_active?: boolean;
      };
    }) => {
      const res = await apiClient.put(
        `/user-assignment-permission-overrides/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-assignment-permission-overrides"],
      });
    },
  });
};

/* =========================================================
   DELETE
========================================================= */

export const useDeleteUserAssignmentPermissionOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(
        `/user-assignment-permission-overrides/${id}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-assignment-permission-overrides"],
      });
    },
  });
};
