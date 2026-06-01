
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useFormCategoryRoots() {
  return useQuery({
    queryKey: ['form-categories', 'roots'],
    queryFn: async () => (await apiClient.get('/master/form-categories?parentId=0')).data,
  });
}
