import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  userType: string;
  roleId: number;
  roleName: string;
  isEmailVerified: number;
  lastLoginAt: string;
  firstName?: string;
  lastName?: string;
  deptId?: number;
  tenantId?: number | null;
  projectId?: number | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  logoUrl?: string | null;
  availableThemes?: unknown;
  tenantSource?: string | null;
  userTenantId?: number | null;
  userProjectId?: number | null;
  assignmentTenantId?: number | null;
  assignmentProjectId?: number | null;
}

interface Role {
  id: number;
  name: string;
}

interface Resource {
  code: string;
  path: string;
}

interface AuthState {
  user: User | null;
  roles: Role[]; // All available roles from DB
  resources: Resource[]; // Resources assigned to the current user
  loading: boolean;
  error: string | null;
  hasFetched: boolean; // Track if initial fetch has been attempted
  setUser: (user: User | null) => void;
  setRoles: (roles: Role[]) => void;
  setResources: (resources: Resource[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasFetched: (hasFetched: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  roles: [],
  resources: [],
  loading: true,
  error: null,
  hasFetched: false,
  setUser: (user) => set({ user }),
  setRoles: (roles) => set({ roles }),
  setResources: (resources) => set({ resources }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHasFetched: (hasFetched) => set({ hasFetched }),
}));
