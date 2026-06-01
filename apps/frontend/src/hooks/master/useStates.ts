import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useStates = () => {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data } = await apiClient.get('/master/states');
      return data;
    },
  });
};

export const useCreateState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await apiClient.post('/master/states', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
    },
  });
};

export const useUpdateState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { data: response } = await apiClient.put(`/master/states/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
    },
  });
};

export const useDeleteState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/states/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
    },
  });
};

export const useToggleState = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.put(`/master/states/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['states'] });
    },
  });
};
