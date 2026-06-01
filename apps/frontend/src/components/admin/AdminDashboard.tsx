'use client';

import { useState, useMemo } from 'react';
import { useUsers, useRoles, usePermissions } from '@/hooks/useAdminData';
import { useAuth } from '@/hooks/useAuth';
import { useTenants } from '@/hooks/common/useTenants';
import { useMasterDataByCode } from '@/hooks/master/useDynamicMaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  User, Mail, Shield, CheckCircle, Clock, Info, Hash, 
  Grid2X2, Calendar, Tag, Layers, FileText 
} from 'lucide-react';

const EY_YELLOW = '#FFE600';
const EY_DARK = '#2E2E38';
interface Role {
  id: number;
  name: string;
  _count?: {
    users: number;
  };
}

interface Permission {
  id: number;
  code: string;
}

interface MasterDataItem {
  id: string;
  data: {
    code?: string;
    name?: string;
    abbr?: string;
    icon?: string;
    dept_type?: string;
    unique_tag?: string;
    description?: string;
    department_id?: string;
    department_name?: string;
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  email: string;
  user_type: string;
  role?: {
    name: string;
  };
  is_email_verified: number;
  last_login_at: string | null;
}

export const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  // Data table state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError
  } = useUsers();
  const {
    data: rolesData,
    isLoading: rolesLoading,
    error: rolesError
  } = useRoles();

  const {
    data: permissionsData,
    isLoading: permsLoading,
    error: permsError
  } = usePermissions();

  const {
    data: tenants,
    isLoading: tenantsLoading,
    error: tenantsError,
  } = useTenants({ isActive: true });

  const selectedTenantId = tenantFilter === 'all' ? undefined : Number(tenantFilter);

  const {
    data: departmentData,
    isLoading: departmentsLoading,
    error: departmentsError,
  } = useMasterDataByCode('DEPARTMENT', selectedTenantId, { isActive: true });

  const {
    data: subDepartmentData,
    isLoading: subDepartmentsLoading,
    error: subDepartmentsError,
  } = useMasterDataByCode('SUB_DEPARTMENT', selectedTenantId, { isActive: true });

  const {
    data: modulesData,
    isLoading: modulesLoading,
    error: modulesError,
  } = useMasterDataByCode('MODULE', selectedTenantId, { isActive: true });

  const users: User[] = usersData || [];
  const roles: Role[] = rolesData || [];
  const permissions: Permission[] = permissionsData || [];
  const tenantsList = tenants || [];
  const departmentCount = departmentData?.length ?? 0;
  const subDepartmentCount = subDepartmentData?.length ?? 0;
  const moduleCount = modulesData?.length ?? 0;

  // Dynamic card configuration
  const dashboardCards = [
    {
      title: "Project",
      value: users.length,
      className: "cc-1",
      filterType: "all"
    },
    {
      title: "Department",
      value: departmentCount,
      className: "cc-2",
      filterType: "roles"
    },
    {
      title: "Sub Department",
      value: subDepartmentCount,
      className: "cc-3",
      filterType: "assignments"
    },
    {
      title: "Modules",
      value: moduleCount,
      className: "cc-5",
      filterType: "modules"
    },
    {
      title: "Sub Modules",
      value: permissions.length,
      className: "cc-6",
      filterType: "permissions"
    },
    {
      title: "Masters",
      value: 6,
      className: "cc-7",
      filterType: "overrides"
    },
    {
      title: "Users",
      value: 18,
      className: "cc-4",
      filterType: "transfers"
    }
  ];

  const selectedCard = dashboardCards[selectedCardIndex];

  const masterTableData = useMemo<MasterDataItem[]>(() => {
    switch (selectedCard.title) {
      case 'Department':
        return (departmentData || []) as unknown as MasterDataItem[];
      case 'Sub Department':
        return (subDepartmentData || []) as unknown as MasterDataItem[];
      case 'Modules':
        return (modulesData || []) as unknown as MasterDataItem[];
      default:
        return [];
    }
  }, [selectedCard.title, departmentData, subDepartmentData, modulesData]);

  const isMasterDetailView = ['Department', 'Sub Department', 'Modules'].includes(selectedCard.title);

  // Filter users based on selected card
  const filteredUsers = () => {
    let filtered = [...users];

    switch (selectedCard.filterType) {
      case "roles":
        filtered = users.filter(u => u.role);
        break;
      case "assignments":
        filtered = users.slice(0, Math.min(users.length, 5));
        break;
      case "transfers":
        filtered = users.slice(0, Math.min(users.length, 3));
        break;
      case "permissions":
        filtered = users.filter(u => u.is_email_verified === 1);
        break;
      case "overrides":
        filtered = users.slice(0, Math.min(users.length, 2));
        break;
      case "projects":
        filtered = users.slice(0, Math.min(users.length, 4));
        break;
      default:
        filtered = users;
    }

    return filtered.slice(0, 10);
  };

  const filteredUsersData = filteredUsers();

  const isLoading = authLoading || usersLoading || rolesLoading || permsLoading || tenantsLoading || departmentsLoading || subDepartmentsLoading || modulesLoading;
  const hasError = usersError || rolesError || permsError || tenantsError || departmentsError || subDepartmentsError || modulesError;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error Loading Dashboard</h4>
        <p>Failed to load admin data. Please try again.</p>
        <hr />
        <p className="mb-0">
          <small>
            Users: {usersError ? 'Failed' : 'OK'} |
            Roles: {rolesError ? 'Failed' : 'OK'} |
            Permissions: {permsError ? 'Failed' : 'OK'} |
            Tenants: {tenantsError ? 'Failed' : 'OK'} |
            Departments: {departmentsError ? 'Failed' : 'OK'} |
            Sub Departments: {subDepartmentsError ? 'Failed' : 'OK'} |
            Modules: {modulesError ? 'Failed' : 'OK'}
          </small>
        </p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="container-fluid py-4 px-4">

        <div className="row mb-3 justify-content-end">
          <div className="col-md-3">
            <select
              className="form-select"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
            >
              <option value="all">All Tenants</option>
              {tenantsList.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="row gap-1 card-wrapper mt-5">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="col mb-4"
              onClick={() => setSelectedCardIndex(index)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={`custom-card ${card.className}`}
                style={{
                  opacity: selectedCardIndex === index ? 1 : 0.7,
                  transform: selectedCardIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCardIndex === index ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <div className="title-text">{card.title}</div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="value-text">{card.value}</div>
                  <a className="arrow-circle" href='javascript:void(0);'>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.6667 11L22.6667 16M22.6667 16L17.6667 21M22.6667 16H9.33333M31 16C31 24.2843 24.2843 31 16 31C7.71573 31 1 24.2843 1 16C1 7.71567 7.71573 1 16 1C24.2843 1 31 7.71567 31 16Z" stroke="#B4A37A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row mb-4 d-none">
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-white p-3 rounded">
                      <i className="bi bi-people-fill fs-4"></i>
                    </div>
                  </div>
                  <div className="ms-3">
                    <div className="text-muted small">Total Users</div>
                    <div className="h3 mb-0">{users.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-success text-white p-3 rounded">
                      <i className="bi bi-person-badge fs-4"></i>
                    </div>
                  </div>
                  <div className="ms-3">
                    <div className="text-muted small">Total Roles</div>
                    <div className="h3 mb-0">{roles.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-warning text-white p-3 rounded">
                      <i className="bi bi-shield-lock fs-4"></i>
                    </div>
                  </div>
                  <div className="ms-3">
                    <div className="text-muted small">Total Permissions</div>
                    <div className="h3 mb-0">{permissions.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        <div className="card shadow-sm mb-4 border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
      {/* Top Accent Bar */}
      <div style={{ height: '4px', backgroundColor: EY_YELLOW }}></div>
      
      {/* HEADER */}
      <div className="card-header d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
        <div>
          <h5 className="mb-1 fw-bold fs-6" style={{ color: EY_DARK }}>
            <Grid2X2 size={18} className="me-2" style={{ color: EY_DARK }} />
            {isMasterDetailView ? `${selectedCard.title}` : `Users - ${selectedCard.title}`}
          </h5>
          <small className="text-muted d-flex align-items-center">
            <Info size={14} className="me-1" />
            {isMasterDetailView
              ? `Showing ${selectedCard.title} data for the selected tenant`
              : `Last 10 users related to ${selectedCard.title}`}
          </small>
        </div>
      </div>

      {/* BODY */}
      <div className="card-body p-0">
        <div className="table-responsive">
          {isMasterDetailView ? (
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr style={{ borderBottom: `2px solid ${EY_YELLOW}` }}>
                  <th className="ps-3 py-3 text-uppercase small fw-bold text-primary">ID</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Code</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Name</th>

                  {/* Conditional Logic: Department */}
                  {selectedCard.title === "Department" && (
                    <>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Icon</th>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Dept Type</th>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Unique Tag</th>
                    </>
                  )}

                  {/* Conditional Logic: Sub Department */}
                  {selectedCard.title === "Sub Department" && (
                    <>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Description</th>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Department</th>
                      <th className="py-3 text-uppercase small fw-bold text-dark">Unique Tag</th>
                    </>
                  )}

                  <th className="py-3 text-uppercase small fw-bold text-dark">Active</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Created</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Updated</th>
                </tr>
              </thead>

              <tbody>
                {masterTableData.length > 0 ? (
                  masterTableData.map((item: any) => (
                    <tr key={item.id} className="ey-row-hover">
                      <td className="ps-3 fw-semibold text-muted small"><Hash size={12} />{item.id}</td>
                      <td><span className="badge bg-light text-dark border font-monospace">{item.data?.code || "—"}</span></td>
                      <td className="fw-bold" style={{ color: EY_DARK }}>{item.data?.name || "—"}</td>

                      {selectedCard.title === "Department" && (
                        <>
                          <td className="text-muted">{item.data?.icon || "—"}</td>
                          <td><span className="badge bg-white border text-dark fw-normal">{item.data?.dept_type || "—"}</span></td>
                          <td><Tag size={12} className="me-1 text-muted" />{item.data?.unique_tag || "—"}</td>
                        </>
                      )}

                      {selectedCard.title === "Sub Department" && (
                        <>
                          <td className="small text-muted">{item.data?.description || "—"}</td>
                          <td><Layers size={14} className="me-1 text-muted" />{item.data?.department_name || "—"}</td>
                          <td><Tag size={12} className="me-1 text-muted" />{item.data?.unique_tag || "—"}</td>
                        </>
                      )}

                      <td>
                       <div className="d-flex align-items-center">
                            <div style={{ 
                              width: '8px', height: '8px', borderRadius: '50%', 
                              backgroundColor: item.is_active ? EY_YELLOW : '#ccc',
                              marginRight: '8px', boxShadow: item.is_active ? `0 0 6px ${EY_YELLOW}` : 'none'
                            }} />
                            <span className="fw-bold small" style={{ color: item.is_active ? EY_DARK : '#999', fontSize: '0.7rem' }}>
                              {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                      </td>

                      <td className="text-muted small">
                        <Calendar size={12} className="me-1" />
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="text-muted small">
                        <Clock size={12} className="me-1" />
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={selectedCard.title === "Department" || selectedCard.title === "Sub Department" ? 10 : 8} 
                      className="text-center py-5 text-muted"
                    >
                      <FileText size={24} className="d-block mx-auto mb-2 opacity-25" />
                      No {selectedCard.title.toLowerCase()} found for this tenant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="table table-hover mb-0 align-middle">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr style={{ borderBottom: `2px solid ${EY_YELLOW}` }}>
                  <th className="ps-3 py-3 text-uppercase small fw-bold text-dark">ID</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Email</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">User Type</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Role</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Status</th>
                  <th className="py-3 text-uppercase small fw-bold text-dark">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsersData.map((user: any) => (
                  <tr key={user.id} className="ey-row-hover">
                    <td className="ps-3 fw-semibold text-muted small">#{user.id}</td>
                    <td className="fw-medium"><Mail size={14} className="me-2 text-muted" />{user.email}</td>
                    <td>
                      <span className="badge border text-dark fw-normal" style={{ backgroundColor: '#f0f0f0' }}>
                        <User size={12} className="me-1" /> {user.user_type}
                      </span>
                    </td>
                    <td>
                      <span className="text-secondary small d-flex align-items-center">
                        <Shield size={14} className="me-1 text-primary" style={{ color: '#005a9c !important' }} />
                        {user.role?.name || "N/A"}
                      </span>
                    </td>
                    <td>
                      {user.is_email_verified ? (
                        <span className="text-success small fw-bold d-flex align-items-center">
                          <CheckCircle size={14} className="me-1" /> Verified
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">Pending</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      <Clock size={14} className="me-1" />
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style jsx>{`
        .ey-row-hover {
          transition: background-color 0.2s ease;
          cursor: pointer;
        }
        .ey-row-hover:hover {
          background-color: rgba(255, 230, 0, 0.08) !important;
          box-shadow: inset 2px 0 0 ${EY_YELLOW};
        }
        .table thead th {
          font-size: 0.7rem;
          letter-spacing: 0.03rem;
        }
        .font-monospace {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
          font-size: 0.8rem;
        }
      `}</style>
    </div>


      </div>
    </ProtectedRoute>
  );
};