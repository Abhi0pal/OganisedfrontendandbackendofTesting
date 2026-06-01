import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface ProjectStatusCafOption {
  submissionId: number;
  unitName: string;
  label: string;
}

export const useProjectStatusCafOptions = () => {
  return useQuery({
    queryKey: ['project-status-caf-options'],
    queryFn: async () => {
      const allowedServiceIds = new Set(['591', '591.0', '943', '943.0']);
      const getItems = (payload: any) =>
        Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

      let items: any[] = [];
      try {
        const response = await apiClient.get('/investor/project-status-update/caf-options');
        items = getItems(response?.data);
      } catch (primaryError) {
        console.error('CAF options primary API failed:', primaryError);
        const fallback = await apiClient.get('/investor/inprinciple/approved-sb');
        items = getItems(fallback?.data);
      }

      return items
        .filter((item: any) => {
          const rawServiceId = item?.serviceId;
          if (rawServiceId === undefined || rawServiceId === null) {
            return true;
          }
          return allowedServiceIds.has(String(rawServiceId).trim());
        })
        .map((item: any) => {
          const submissionId = Number(item?.submissionId);
          if (!Number.isFinite(submissionId) || submissionId <= 0) {
            return null;
          }
          const unitName = String(item?.unitName || '').trim();
          return {
            submissionId,
            unitName,
            label: `${unitName || 'CAF'} - ${submissionId}`,
          } as ProjectStatusCafOption;
        })
        .filter(Boolean) as ProjectStatusCafOption[];
    },
  });
};
