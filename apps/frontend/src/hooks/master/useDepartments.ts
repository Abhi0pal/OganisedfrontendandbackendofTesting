import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface Department {
  id: number;
  name: string;
  uniqueTag: string;
  ip: string;
  secretKey: string;
  baseUrl: string;
  publicKey: string;
  abbreviation: string;
  boDeptId?: number;
  order?: number;
  icon?: string;
  issuerId?: number;
  issuer?: {
    id: number;
    name: string;
    isIssuerActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant_id?: number;
}

interface CreateDepartmentDto {
  name: string;
  uniqueTag: string;
  ip: string;
  secretKey: string;
  baseUrl: string;
  publicKey: string;
  abbreviation: string;
  boDeptId?: number | null;
  order?: number | null;
  icon?: string | null;
  issuerId?: number | null;
  isActive: boolean;
}

interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {}

// Fetch all departments
export const useDepartments = (enabled: boolean = true) => {
  return useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await apiClient.get("/departments");
      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch single department
export const useDepartment = (id: number) => {
  return useQuery<Department>({
    queryKey: ["departments", id],
    queryFn: async () => {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

// Create department
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepartmentDto) => {
      const response = await apiClient.post("/departments", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Update department
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateDepartmentDto;
    }) => {
      const response = await apiClient.patch(`/departments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Delete department
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(`/departments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};

// Toggle department status
export const useToggleDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.patch(`/departments/${id}/toggle`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
};
