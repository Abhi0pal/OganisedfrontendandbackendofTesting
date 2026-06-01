import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useFormBuilderFields(params?: {
  serviceId?: string;
  formTypeId?: number;
  mappingId?: string | null;
  pageId?: number | null;
  categoryId?: number | null;
  locale?: string;
}) {
  const enabled = !!params?.serviceId && !!params?.formTypeId && !!params?.pageId && !!params?.categoryId;

  return useQuery({
    queryKey: ['fb-builder-fields', params],
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { serviceId, formTypeId, mappingId, pageId, categoryId, locale } = params!;
      const res = await apiClient.get(
        `/master/form-builder/pages/${pageId}/categories/${categoryId}/fields`,
        { params: { serviceId, formTypeId, mappingId, locale } },
      );
      return res.data;
    },
  });
}

export function useCreateFormBuilderField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      pageId: number;
      categoryId: number;
      serviceId: string;
      formTypeId: number;
      formFieldId: number;
      inputType: string;
      customLabel?: string;
      helpText?: string;
      isRequired?: 'Y' | 'N';
      isEditable?: 'Y' | 'N';
      isReadonly?: 'Y' | 'N';
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      step?: string;
      validationRule?: any;
      rowType?: string;
      preference?: number;
    }) => {
      const { pageId, categoryId, ...dto } = payload;
      const res = await apiClient.post(
        `/master/form-builder/pages/${pageId}/categories/${categoryId}/fields`,
        dto,
      );
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: [
          'fb-builder-fields',
          { serviceId: vars.serviceId, formTypeId: vars.formTypeId, pageId: vars.pageId, categoryId: vars.categoryId },
        ],
      });
    },
  });
}

export function useUpdateFormBuilderField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: number; data: any; refetchKey?: any }) => {
      const res = await apiClient.patch(`/master/form-builder/fields/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      if (vars.refetchKey) qc.invalidateQueries({ queryKey: vars.refetchKey });
      qc.invalidateQueries({ queryKey: ['fb-builder-fields'] });
    },
  });
}

export function useDeleteFormBuilderField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/master/form-builder/fields/${id}`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fb-builder-fields'] }),
  });
}
