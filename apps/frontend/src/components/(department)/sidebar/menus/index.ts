import { getDefaultDepartmentMenus } from './default';
import { getRole7DepartmentMenus } from './role7';
import { getRole33DepartmentMenus } from './role33';
import { getRole222DepartmentMenus } from './role222';
import { getRole236DepartmentMenus } from './role236';
import { getRole237DepartmentMenus } from './role237';
import { DepartmentSidebarMenuItem } from './types';

type DepartmentMenuContext = {
  roleId?: number;
  roleName?: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
};

const normalizeRoleKey = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');

const isCpcbTenant = (tenantSlug?: string | null, tenantName?: string | null) => {
  const normalizedTenantSlug = String(tenantSlug || '').trim().toLowerCase();
  const normalizedTenantName = String(tenantName || '').trim().toLowerCase();

  return (
    normalizedTenantSlug === 'cpcb' ||
    normalizedTenantSlug === 'cp' ||
    normalizedTenantName.includes('cpcb') ||
    normalizedTenantName.includes('central pollution control board')
  );
};

export const getDepartmentMenuByRole = ({
  roleId,
  roleName,
  tenantSlug,
  tenantName,
}: DepartmentMenuContext = {}): DepartmentSidebarMenuItem[] => {
  if (roleId === 7) return getRole7DepartmentMenus();
  if (roleId === 33) return getRole33DepartmentMenus();
  if (roleId === 222) {
    const normalizedRoleName = normalizeRoleKey(roleName);
    if (isCpcbTenant(tenantSlug, tenantName) && normalizedRoleName === 'ulb') {
      return getRole222DepartmentMenus();
    }
    return getDefaultDepartmentMenus();
  }
  if (roleId === 236) return getRole236DepartmentMenus();
  if (roleId === 237) return getRole237DepartmentMenus();
  return getDefaultDepartmentMenus();
};

export type { DepartmentSidebarMenuItem, DepartmentSidebarChildItem, DepartmentSidebarIconKey } from './types';

