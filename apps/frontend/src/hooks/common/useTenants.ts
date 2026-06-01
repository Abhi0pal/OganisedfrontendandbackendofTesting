import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  logo_url?: string;
  availableThemes?: unknown;
  primary_color?: string;
  plan: "FREE" | "STANDARD" | "ENTERPRISE";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTenants = (filters?: {
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery<Tenant[]>({
    queryKey: ["tenants", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append("is_active", filters.isActive.toString());
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }

      const response = await apiClient.get(`/tenants?${params}`);
      return response.data;
    },
  });
};

export const useTenant = (tenantId?: number | null) => {
  return useQuery<Tenant | null>({
    queryKey: ["tenant", tenantId],
    enabled: Boolean(tenantId),
    queryFn: async () => {
      if (!tenantId) return null;
      const response = await apiClient.get(`/tenants/${tenantId}`);
      return response.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post("/tenants", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.patch(`/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useToggleTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(`/tenants/${id}/toggle`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};
