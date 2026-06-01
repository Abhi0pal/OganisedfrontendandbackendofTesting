"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/common/useTenants";

export default function DepartmentFooter() {
  const { user } = useAuth();
  const { data: tenant } = useTenant(user?.tenantId);
  const tenantName = tenant?.name?.trim() || user?.tenantName?.trim() || "Tenant";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto investor-bg px-4 py-2 footer-main">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-3 text-slate-700">
          <div className="leading-tight">
            <p className="text-primary" data-tenant-id={tenant?.id ?? user?.tenantId ?? ""}>
              &copy; {year} Copyright | {tenantName} | All Rights Reserved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-slate-500">
          <a href="#" className="text-primary transition-colors">Terms & Conditions</a>
          <a href="#" className="text-primary transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
