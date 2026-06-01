import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/**
 * User Type Enum
 */
export enum UserType {
  INVESTOR = "INVESTOR",
  DEPARTMENT = "DEPARTMENT",
  INSPECTOR = "INSPECTOR",
  CIS_USER = "CIS_USER",
  THIRD_PARTY = "THIRD_PARTY",
}

/**
 * User interface
 */
export interface User {
  id: number;
  email: string;

  user_type: UserType;

  role_id?: number | null;
  tenant_id?: number | null;
  project_id?: number | null;

  department_id ?: number | null;
  sub_department_id ?: number | null;

  first_name ?: string | null;
  last_name ?: string | null;
  full_name ?: string | null;

  is_email_verified: number;
  is_active: boolean;

  last_login_at?: string | null;
  deleted_at?: string | null;

  created_at: string;
  updated_at: string;

  // Relations
  role?: {
    id: number;
    name: string;
  };

  tenant?: {
    id: number;
    name: string;
  };

  project?: {
    id: number;
    name: string;
  };

  investor_profile?: {
    first_name?: string;
    last_name?: string;
    country_name?: string;
    state_name?: string;
    city_name?: string;
    district_name?: string;
    pin_code?: string;
    address?: string;
    mobile_number?: string;
    pan_card?: string;
    adhaar_number?: string;
  };

  department_user?: {
    full_name?: string;
    hindi_full_name?: string;
    office_no?: string;
    mobile?: string;
    dept_id?: number | null;
    district_id?: number | null;
    tehsil_id?: number | null;
    circle_id?: string | null;
    block_id?: number | null;
    office_id?: number | null;
    division_id?: number | null;
  };

  name?: string;
}

/**
 * Helper → derive name
 */
 const getUserName = (user: User): string => {
  if (user.user_type === UserType.INVESTOR) {
    const investorName = `${user.investor_profile?.first_name ?? ""} ${
      user.investor_profile?.last_name ?? ""
    }`.trim();
    return investorName || user.name || user.full_name || "";
  }

  return user.department_user?.full_name || user.name || user.full_name || "";
};

/**
 * Fetch all users
 */
export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await apiClient.get("/users");

      return response.data.map((user: User) => ({
        ...user,
        name: getUserName(user),
      }));
    },
  });
};

/**
 * Fetch single user
 */
export const useUser = (id: number) => {
  return useQuery<User>({
    queryKey: ["users", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await apiClient.get(`/users/${id}`);

      const user = response.data;

      return {
        ...user,
        name: getUserName(user),
      };
    },
  });
};

/**
 * Create user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

/**
 * Update user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });
};

/**
 * Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};