import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useServiceDms = (serviceId?: string | null) => {
  return useQuery({
    queryKey: ['service-dms', serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      if (!serviceId) return null;
      const response = await apiClient.get('/master/service/dms/by-service-id', {
        params: { serviceId },
      });
      return response.data;
    },
  });
};

export const useSaveServiceDms = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, data }: { serviceId: string; data: any }) => {
      const response = await apiClient.put('/master/service/dms/by-service-id', data, {
        params: { serviceId },
      });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-dms', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const uploadServiceDmsFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/master/service/dms/upload', formData);
  return response.data;
};
