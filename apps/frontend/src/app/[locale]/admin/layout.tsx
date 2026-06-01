import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import '@/components/admin/style.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <div style={{ display: 'flex', width: '100vw', maxWidth: '100vw', overflow: 'hidden' }}>
        <AdminSidebar />
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, overflowX: 'clip' }}>
          <DashboardHeader />
          <main>{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
