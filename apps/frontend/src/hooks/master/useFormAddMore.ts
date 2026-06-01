import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export function useFormAddMoreGroups(params?: {
  serviceId?: string;
  formTypeId?: number;
  pageId?: number;
  categoryId?: number;
  triggerBuilderFieldId?: number;
}) {
  const enabled = !!params?.serviceId && !!params?.formTypeId && !!params?.pageId && !!params?.categoryId;

  return useQuery({
    queryKey: ['fb-addmore-groups', params], // ✅ This is the correct key
    enabled,
    queryFn: async () => {
      const res = await apiClient.get('/master/form-builder/addmore/groups', { params });
      return res.data;
    },
  });
}

export function useCreateFormAddMoreGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: any) => (await apiClient.post('/master/form-builder/addmore/groups', dto)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fb-addmore-groups'] }),
  });
}

export function useSetFormAddMoreColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { groupId: number; columnBuilderFieldIds: number[] }) =>
      (await apiClient.put(`/master/form-builder/addmore/groups/${payload.groupId}/columns`, {
        columnBuilderFieldIds: payload.columnBuilderFieldIds,
      })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fb-addmore-groups'] }),
  });
}

export function useUpdateFormAddMoreGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, ...data }: any) => {
      const res = await apiClient.patch(`/master/form-builder/addmore/groups/${groupId}`, data);
      return res.data;
    },
    onSuccess: () => {
      // ✅ FIX: Corrected typo 'form-addmore-groups' -> 'fb-addmore-groups'
      queryClient.invalidateQueries({ queryKey: ['fb-addmore-groups'] });
      queryClient.invalidateQueries({ queryKey: ['fb-form-preview'] }); 
    },
  });
}