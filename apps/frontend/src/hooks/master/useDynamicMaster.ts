import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtraField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required?: boolean;
  options?: { label: string; value: string }[];
}

export interface MasterDefinition {
  id: number;
  uid: string;
  name: string;
  abbr?: string;
  code: string;
  parent_code?: string;
  parent_master_code?: string | null;
  json_definition?: { extra_fields?: ExtraField[] } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: { id: number; name: string; code: string } | null;
  children?: { id: number; name: string; code: string; is_active: boolean }[];
  _count?: { data: number; children: number };
}

export interface MasterData {
  id: string;
  uid: string;
  code: string;
  name: string;
  abbr?: string;
  master_definition_id: number;
  json_definition?: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_definition_name?: string | null;
  created_by_email?: string | null;
  updated_by_email?: string | null;
}

export interface MasterDataPage {
  total: number;
  page: number;
  limit: number;
  data: MasterData[];
}

// ─── Master Definition Hooks ──────────────────────────────────────────────────

export const useMasterDefinitions = (search?: string, isActive?: boolean) =>
  useQuery<MasterDefinition[]>({
    queryKey: ['master-definitions', search, isActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (isActive !== undefined) params.append('is_active', String(isActive));
      const res = await apiClient.get(`/master/definitions?${params}`);
      return res.data;
    },
  });

export const useMasterDefinition = (id: number) =>
  useQuery<MasterDefinition>({
    queryKey: ['master-definition', id],
    queryFn: async () => {
      const res = await apiClient.get(`/master/definitions/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

export const useCreateMasterDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/master/definitions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-definitions'] }),
  });
};

export const useUpdateMasterDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/master/definitions/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-definitions'] }),
  });
};

export const useDeleteMasterDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/master/definitions/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-definitions'] }),
  });
};

export const useToggleMasterDefinition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiClient.patch(`/master/definitions/${id}/toggle-active`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-definitions'] }),
  });
};

// ─── Master Data Hooks ────────────────────────────────────────────────────────

export const useMasterData = (
  masterDefinitionId: number,
  options?: { search?: string; page?: number; limit?: number; isActive?: boolean }
) =>
  useQuery<MasterDataPage>({
    queryKey: ['master-data', masterDefinitionId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.search) params.append('search', options.search);
      if (options?.page) params.append('page', String(options.page));
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.isActive !== undefined) params.append('is_active', String(options.isActive));
      const res = await apiClient.get(`/master/data/by-master/${masterDefinitionId}?${params}`);
      return res.data;
    },
    enabled: !!masterDefinitionId,
  });

export const useMasterDataByCode = (
  masterCode: string,
  tenantId?: number,
  options?: { isActive?: boolean }
) =>
  useQuery<MasterData[]>({
    queryKey: ['master-data-by-code', masterCode, tenantId, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('master_code', masterCode);
      if (options?.isActive !== undefined) params.append('is_active', String(options.isActive));
      if (tenantId !== undefined && tenantId !== null) {
        params.append('tenant_id', String(tenantId));
      }
      const res = await apiClient.get(`/master/data?${params}`);
      return res.data;
    },
    enabled: !!masterCode,
  });

export const useCreateMasterData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiClient.post('/master/data', data).then((r) => r.data),
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['master-data', vars.master_definition_id] }),
  });
};

export const useUpdateMasterData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.patch(`/master/data/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

export const useDeleteMasterData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/master/data/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

export const useToggleMasterData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/master/data/${id}/toggle-active`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

export const useImportMasterData = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ masterDefinitionId, file }: { masterDefinitionId: number; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post(`/master/data/${masterDefinitionId}/import-csv`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['master-data'] }),
  });
};
