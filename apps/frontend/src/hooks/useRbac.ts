
// apps/frontend/src/hooks/useRbac.ts
import { useAuthStore } from '../store/authStore';

export const useRbac = () => {
  const { resources, user } = useAuthStore();

  /** Check if the current user has a specific resource code */
  const hasResource = (resourceCode: string): boolean => {
    if (!user) return false;
    return resources.some((r) => r.code === resourceCode);
  };

  /** Check if the current user has ANY of the provided resource codes */
  const hasAnyResource = (resourceCodes: string[]): boolean => {
    if (!user) return false;
    return resourceCodes.some((code) => resources.some((r) => r.code === code));
  };

  /** (Optional) Check if the current user has ALL of the provided resource codes */
  const hasAllResources = (resourceCodes: string[]): boolean => {
    if (!user) return false;
    return resourceCodes.every((code) => resources.some((r) => r.code === code));
  };

  return {
    hasResource,
    hasAnyResource,
    hasAllResources, // optional helper
    user,
    resources,
  };
};
