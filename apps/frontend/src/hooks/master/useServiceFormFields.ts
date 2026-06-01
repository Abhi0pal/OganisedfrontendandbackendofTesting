import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export type ServiceFormFieldOption = { label: string; value: string };

export const useServiceFormFields = (serviceId?: string, serviceStatus?: string | null) => {
  const isIncentive = serviceStatus === 'INCENTIVE';
  const schemesEndpoint = `/master/schemes/condition-fields?serviceId=${serviceId}`;
  const formBuilderEndpoint = `/master/form-builder/fields?serviceId=${serviceId}`;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['service-form-fields', serviceId, serviceStatus],
    queryFn: async () => {
      const normalizeFields = (payload: any): ServiceFormFieldOption[] => {
        const fields = Array.isArray(payload) ? payload : payload?.fields || [];
        return fields.map((field: any) => ({
          label: field.label ?? field.name ?? field.value ?? '',
          value: field.value ?? field.formchk_id ?? '',
        }));
      };

      if (isIncentive) {
        const schemeRes = await apiClient.get(schemesEndpoint);
        const schemeFields = normalizeFields(schemeRes.data).filter((field) => Boolean(field.value));
        if (schemeFields.length > 0) return schemeFields;
      }

      const builderRes = await apiClient.get(formBuilderEndpoint);
      return normalizeFields(builderRes.data).filter((field) => Boolean(field.value));
    },
    enabled: !!serviceId,
  });

  const options: ServiceFormFieldOption[] = (data || []).filter((field) => Boolean(field.value));

  return useMemo(() => {
    return { options, isLoading, isError };
  }, [options, isLoading, isError]);
};
