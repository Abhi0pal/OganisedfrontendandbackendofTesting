import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export const useInformationWizards = (filters?: {
  isActive?: boolean;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['informationWizards', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await apiClient.get(
        `/information-wizard?${params.toString()}`
      );
      return response.data;
    },
  });
};

export const useCreateInformationWizard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/information-wizard', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informationWizards'] });
    },
  });
};

export const useUpdateInformationWizard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiClient.put(`/information-wizard/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informationWizards'] });
    },
  });
};

export const useDeleteInformationWizard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/information-wizard/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informationWizards'] });
    },
  });
};

export const useToggleInformationWizard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.put(
        `/information-wizard/${id}/toggle`,
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['informationWizards'] });
    },
  });
};

export const useUploadInformationWizardDocument = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(
        '/information-wizard/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data; // { filePath: string }
    },
  });
};

export const usePublicInformationWizards = () => {
  return useQuery({
    queryKey: ['publicInformationWizards'],
    queryFn: async () => {
      const response = await apiClient.get('/information-wizard/public');
      return response.data;
    },
  });
};
