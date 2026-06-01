import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Category } from '@/types/category';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data;
    },
  });
};

export const useCreateCategory = () => {
  return useMutation({
    mutationFn: (data: Omit<Category, 'id' | 'createdAt'>) =>
      apiClient.post('/categories', data),
  });
};

export const useUpdateCategory = () => {
  return useMutation({
    mutationFn: (data: { id: number; data: Partial<Category> }) =>
      apiClient.put(`/categories/${data.id}`, data.data),
  });
};

export const useDeleteCategory = () => {
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/categories/${id}`),
  });
};
