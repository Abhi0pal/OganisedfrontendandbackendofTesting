import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface CafOption {
  submissionId: number;
  unitName: string;
  label: string;
}

export const useCafOptions = () => {
  return useQuery({
    queryKey: ['caf-options'],
    queryFn: async () => {
      const response = await apiClient.get('/investor/inprinciple/approved-sb');
      const items = Array.isArray(response?.data) ? response.data : [];
      return items.map((item: any) => {
        const submissionId = Number(item?.submissionId);
        const unitName = String(item?.unitName || '').trim();
        return {
          submissionId,
          unitName,
          label: `${unitName || 'CAF'} - ${submissionId}`,
        } as CafOption;
      });
    },
  });
};
