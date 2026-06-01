import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useFormFieldOptions(builderFieldId?: number | null) {
  return useQuery({
    queryKey: ['fb-field-options', builderFieldId],
    enabled: !!builderFieldId,
    queryFn: async () => {
      const res = await apiClient.get(`/master/form-builder/fields/${builderFieldId}/options`);
      return res.data; // may be null
    },
  });
}

export function useSaveFormFieldOptions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      builderFieldId: number;
      sourceType: 'STATIC' | 'MASTER';
      masterTableId?: number;
      staticOptions?: Array<{ label: string; value: string | number; disabled?: boolean; order?: number }>;
      parentBuilderFieldId?: number;
    }) => {
      const { builderFieldId, ...dto } = payload;
      const res = await apiClient.put(`/master/form-builder/fields/${builderFieldId}/options`, dto);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['fb-field-options', vars.builderFieldId] });
    },
  });
}