import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

interface DepartmentOption {
  id: number;
  name: string;
  tenant_id: number | null;
}

interface SubDepartmentOption {
  id: number;
  name_en: string;
  name_hi?: string;
  department_id: number;
}

interface ProjectOption {
  id: number;
  name: string;
  code: string;
  tenant_id: number;
}

interface TenantOption {
  id: number;
  tenant_ID?: string;
  name: string;
}

/**
 * Fetch projects by tenant_id for the Master Definition form
 */
export const useProjectsForMasterDefinition = (
  tenantId?: number | null,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['projects-dropdown', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        console.log('[useProjectsForMasterDefinition] No tenantId provided, returning empty array');
        return [];
      }

      try {
        console.log(`[useProjectsForMasterDefinition] Fetching projects for tenant_id=${tenantId}`);
        
        const response = await apiClient.get(`/projects?tenant_id=${tenantId}`);
        console.log(`[useProjectsForMasterDefinition] Response:`, response);
        
        // Handle various response formats
        let projects: ProjectOption[] = [];
        
        if (Array.isArray(response.data)) {
          projects = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          projects = response.data.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // If it's an object but not an array, try to extract data
          projects = Object.values(response.data).filter(item => 
            typeof item === 'object' && item !== null && 'name' in item && 'id' in item
          ) as ProjectOption[];
        }

        console.log(`[useProjectsForMasterDefinition] Extracted ${projects.length} projects for tenant ${tenantId}:`, projects);

        // Map to dropdown format
        return projects.map((proj: ProjectOption) => ({
          label: proj.name || 'Unnamed Project',
          value: proj.id,
          id: proj.id,
        }));
      } catch (error) {
        console.error(`[useProjectsForMasterDefinition] Error fetching projects for tenant ${tenantId}:`, error);
        return [];
      }
    },
    enabled: enabled && !!tenantId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

/**
 * Fetch departments by tenant_id for the Master Definition form
 * Maps to m_departments table
 */
export const useDepartmentsForMasterDefinition = (
  tenantId?: number | null,
  enabled: boolean = true
) => {
  // Hardcoded 5 departments - always available
  const departments = [
    { label: 'Agriculture Department (1)', value: 1, id: 1 },
    { label: 'Health Department (2)', value: 2, id: 2 },
    { label: 'Education Department (3)', value: 3, id: 3 },
    { label: 'Public Works Department (4)', value: 4, id: 4 },
    { label: 'Labor Department (5)', value: 5, id: 5 },
  ];
  
  return {
    data: departments,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

/**
 * Fetch subdepartments by department_id for the Master Definition form
 * Maps to m_sub_departments table
 */
export const useSubDepartmentsForMasterDefinition = (
  departmentId?: number | null,
  enabled: boolean = true
) => {
  // Hardcoded subdepartments mapped to departments
  const subdepartmentsByDept: Record<number, { label: string; value: number; id: number }[]> = {
    1: [ // Agriculture Department
      { label: 'Agricultural Extension', value: 1, id: 1 },
      { label: 'Soil & Water Conservation', value: 2, id: 2 },
    ],
    2: [ // Health Department
      { label: 'Public Health Division', value: 3, id: 3 },
      { label: 'Disease Surveillance', value: 4, id: 4 },
    ],
    3: [ // Education Department
      { label: 'Primary Education', value: 5, id: 5 },
      { label: 'Secondary Education', value: 6, id: 6 },
    ],
    4: [ // Public Works Department
      { label: 'Road Construction', value: 7, id: 7 },
      { label: 'Water Supply Division', value: 8, id: 8 },
    ],
    5: [ // Labor Department
      { label: 'Labor Standards', value: 9, id: 9 },
      { label: 'Mine Safety & Health', value: 10, id: 10 },
    ],
  };

  const subdepartments = departmentId && subdepartmentsByDept[departmentId] 
    ? subdepartmentsByDept[departmentId] 
    : [];

  return {
    data: subdepartments,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };
};

