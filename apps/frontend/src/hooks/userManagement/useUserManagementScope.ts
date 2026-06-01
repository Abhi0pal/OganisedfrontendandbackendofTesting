import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

export type ScopeType =
  | "STATE"
  | "DISTRICT"
  | "BLOCK"
  | "TEHSIL"
  | "CIRCLE"
  | "DIVISION"
  | "VILLAGE"
  | "PROJECT";

export const SCOPE_TYPE_OPTIONS: ScopeType[] = [
  "STATE",
  "DISTRICT",
  "BLOCK",
  "TEHSIL",
  "CIRCLE",
  "DIVISION",
  "VILLAGE",
  "PROJECT",
];

export interface ScopeOption {
  id?: number;
  value?: string;
  name: string;
  code?: string;
}

export interface UserManagementScope {
  id: number;
  assignment_id: string;
  assignment_identifier?: string | null;
  assignment?: {
    id: number;
    assignment_identifier?: string | null;
    role_id?: number;
    transfer_order_no?: string | null;
    role?: {
      id: number;
      name?: string | null;
    } | null;
  } | null;
  scope_type: ScopeType;
  scope: string;
  scope_label?: string | null;
  tenant?: string | null;
  project?: string | null;
  is_active: boolean;
  created_on: string;
  updated_on?: string | null;
}

export interface UserManagementScopePayload {
  assignment_id: string;
  scope_type: ScopeType;
  scope: string;
  scope_label?: string;
  tenant?: string;
  project?: string;
  is_active?: boolean;
}

export const useUserManagementScopes = () => {
  return useQuery<UserManagementScope[]>({
    queryKey: ["user-management-scopes"],
    queryFn: async () => {
      const response = await apiClient.get("/user-management-scopes");
      return response.data ?? [];
    },
  });
};

export const useUserManagementScope = (id: number | null) => {
  return useQuery<UserManagementScope>({
    queryKey: ["user-management-scopes", id],
    enabled: id != null,
    queryFn: async () => {
      const response = await apiClient.get(`/user-management-scopes/${id}`);
      return response.data;
    },
  });
};

export const useCreateUserManagementScope = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UserManagementScopePayload) => {
      const response = await apiClient.post("/user-management-scopes", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management-scopes"] });
    },
  });
};

export const useUpdateUserManagementScope = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<UserManagementScopePayload>;
    }) => {
      const response = await apiClient.put(`/user-management-scopes/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-management-scopes"] });
      queryClient.invalidateQueries({
        queryKey: ["user-management-scopes", variables.id],
      });
    },
  });
};

export const useDeleteUserManagementScope = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/user-management-scopes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management-scopes"] });
    },
  });
};
