import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useFormRules(serviceId: string, formTypeId: number) {
  return useQuery({
    queryKey: ['form-rules', serviceId, formTypeId],
    queryFn: async () => {
      // Fetch existing rules for this form
      const { data } = await apiClient.get(`/master/form-builder/rules/${serviceId}/${formTypeId}`);
      return data;
    },
    enabled: !!serviceId && !!formTypeId,
  });
}

export function useSaveFormRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const ruleId = Number(payload?.id || 0);
      if (Number.isFinite(ruleId) && ruleId > 0) {
        const updatePayload = {
          scope: payload?.scope,
          whenJson: payload?.when_json ?? payload?.whenJson,
          thenJson: payload?.then_json ?? payload?.thenJson,
          isActive: payload?.is_active ?? payload?.isActive ?? 'Y',
        };
        const { data } = await apiClient.patch(`/master/form-builder/rules/${ruleId}`, updatePayload);
        return data;
      }
      const createPayload = {
        service_id: payload?.service_id,
        form_id: payload?.form_id,
        scope: payload?.scope,
        when_json: payload?.when_json ?? payload?.whenJson,
        then_json: payload?.then_json ?? payload?.thenJson,
        isActive: payload?.is_active ?? payload?.isActive ?? 'Y',
      };
      const { data } = await apiClient.post('/master/form-builder/rules', createPayload);
      return data;
    },
    onSuccess: () => {
      // Refetch rules and form preview after saving
      queryClient.invalidateQueries({ queryKey: ['form-rules'] });
      queryClient.invalidateQueries({ queryKey: ['fb-form-preview'] });
    },
  });
}
