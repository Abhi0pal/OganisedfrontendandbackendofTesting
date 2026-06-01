import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

export interface MappingRegionCategory {
  id: number;
  blockId: number;
  regionCategoryId: number;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch Mapping Region Categories
 */
export const useMappingRegionCategories = (filters?: {
  isActive?: boolean;
  blockId?: number;
  regionCategoryId?: number;
}) => {
  return useQuery({
    queryKey: ['mappingRegionCategories', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.blockId) {
        params.append('blockId', filters.blockId.toString());
      }
      if (filters?.regionCategoryId) {
        params.append('regionCategoryId', filters.regionCategoryId.toString());
      }

      const response = await apiClient.get(`/master/mapping-region-categories?${params}`);
      return response.data;
    },
  });
};

/**
 * Create Mapping Region Category
 */
export const useCreateMappingRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      blockId: number;
      regionCategoryId: number;
      effectiveFrom: string;
      effectiveTo: string;
      isActive?: boolean;
    }) => {
      const response = await apiClient.post('/master/mapping-region-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappingRegionCategories'] });
    },
  });
};

/**
 * Update Mapping Region Category
 */
export const useUpdateMappingRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        blockId: number;
        regionCategoryId: number;
        effectiveFrom: string;
        effectiveTo: string;
        isActive?: boolean;
      };
    }) => {
      const response = await apiClient.put(`/master/mapping-region-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappingRegionCategories'] });
    },
  });
};

/**
 * Delete Mapping Region Category
 */
export const useDeleteMappingRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/master/mapping-region-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappingRegionCategories'] });
    },
  });
};

/**
 * Toggle Mapping Region Category (Active / Inactive)
 */
// export const useToggleMappingRegionCategory = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id: number) => {
//       const response = await apiClient.put(`/master/mapping-region-categories/${id}/toggle`, {});
//       return response.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['mappingRegionCategories'] });
//     },
//   });
// };
export const useToggleMappingRegionCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // now expects a categoryId, not mappingId
    mutationFn: async (regionCategoryId: number) => {
      const response = await apiClient.put(
        `/master/mapping-region-categories/${regionCategoryId}/toggle-by-category`,
        {}
      );
      return response.data;
    },
    onSuccess: () => {
      // refresh the table after toggling
      queryClient.invalidateQueries({ queryKey: ['mappingRegionCategories'] });
    },
  });
};