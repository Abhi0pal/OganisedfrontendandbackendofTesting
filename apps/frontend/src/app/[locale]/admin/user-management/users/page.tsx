"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  User,
  UserType,
} from "@/hooks/userManagement/useUsers";

import { useRoles, Role } from "@/hooks/userManagement/useRoles";
import {
  useDepartments,
  useSubDepartments,
} from "@/hooks/master/useMasterData";
import { useCountries } from "@/hooks/master/useCountries";
import { useStates } from "@/hooks/master/useStates";
import { useDistricts } from "@/hooks/master/useDistricts";
import { useTehsils } from "@/hooks/master/useTehsils";
import { useBlocks } from "@/hooks/master/useBlocks";

import { useDataTableManager } from "@/hooks/useDataTableManager";
import apiClient from "@/lib/api-client";

import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import { ReusableDataTableConfig } from "@/components/DataTable/types";

/* ================= INTERFACES ================= */

interface Tenant {
  id: number;
  name: string;
}

interface TenantProject {
  id: number;
  name: string;
  tenant_id: number;
}

interface MasterData {
  id: number;
  name: string;
  json_definition?: {
    department_id?: number;
  };
}

interface UserFormData{
  email:string;
  password:string;
  user_type:UserType;

  role_id:string;
  tenant_id:string;
  project_id:string;

  department_id: string;
  sub_department_id: string;

  first_name: string;
  last_name: string;
  country_name: string;
  state_name: string;
  city_name: string;
  district_name: string;
  pin_code: string;
  address: string;
  mobile_number: string;
  pan_card: string;
  adhaar_number: string;

  full_name: string;
  hindi_full_name: string;
  office_no: string;
  mobile: string;
  dept_id: string;
  district_id: string;
  tehsil_id: string;
  circle_id: string;
  block_id: string;
  office_id: string;
  division_id: string;

  is_active: boolean;
  is_email_verified:number;
}


/* ================= COMPONENT ================= */

export default function UsersPage() {
  const toastRef = useRef<Toast>(null);

  const { data: users = [], isLoading } = useUsers();
  const { data: roles = [] } = useRoles();

  const { data: departments = [] } = useDepartments() as {
    data: MasterData[];
  };

  const { data: subDepartments = [] } = useSubDepartments() as {
    data: MasterData[];
  };

  const { data: countries = [] } = useCountries();
  const { data: states = [] } = useStates();
  const { data: districts = [] } = useDistricts();
  const { data: tehsils = [] } = useTehsils();

  // Memoized options for dropdowns
  const countryOptions = useMemo(
    () => countries.map((country: any) => ({ label: country.name, value: country.name })),
    [countries]
  );

  const stateOptions = useMemo(
    () => states.map((state: any) => ({ label: state.name, value: state.name })),
    [states]
  );

  const districtOptions = useMemo(
    () => districts.map((district: any) => ({ label: district.name, value: district.id })),
    [districts]
  );

  const districtNameOptions = useMemo(
    () => districts.map((district: any) => ({ label: district.name, value: district.name })),
    [districts]
  );

  const tehsilOptions = useMemo(
    () => tehsils.map((tehsil: any) => ({ label: tehsil.name, value: tehsil.id })),
    [tehsils]
  );

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [projects, setProjects] = useState<TenantProject[]>([]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    user_type: UserType.INVESTOR,

    role_id: "",
    tenant_id: "",
    project_id: "",

    department_id: "",
    sub_department_id: "",

    first_name: "",
    last_name: "",
    country_name: "",
    state_name: "",
    city_name: "",
    district_name: "",
    pin_code: "",
    address: "",
    mobile_number: "",
    pan_card: "",
    adhaar_number: "",

    full_name: "",
    hindi_full_name: "",
    office_no: "",
    mobile: "",
    dept_id: "",
    district_id: "",
    tehsil_id: "",
    circle_id: "",
    block_id: "",
    office_id: "",
    division_id: "",

    is_active: true,
    is_email_verified: 0,
  });

  const districtId = formData.district_id ? Number(formData.district_id) : undefined;
  const { data: blocks = [] } = useBlocks({ districtId });

  const blockOptions = useMemo(
    () => blocks.map((block: any) => ({ label: block.name, value: block.id })),
    [blocks]
  );

  /* ---------- FETCH ---------- */

  useEffect(() => {
    const fetchData = async () => {
      const [tenantRes, projectRes] = await Promise.all([
        apiClient.get("/tenants"),
        apiClient.get("/projects"),
      ]);

      setTenants(tenantRes.data || []);
      setProjects(projectRes.data || []);
    };

    fetchData();
  }, []);

  /* ---------- ROLE AUTO FILL ---------- */

  useEffect(() => {
    const role = roles.find((r: Role) => r.id === Number(formData.role_id));

    if (role) {
      setFormData((prev) => ({
        ...prev,
        tenant_id: role.tenant_id?.toString() ?? "",
        project_id: role.project_id?.toString() ?? "",
      }));
    }
  }, [formData.role_id, roles]);

  /* ---------- TABLE ---------- */

  const {
    data: tableData,
    selectedRows,
    filters,
    globalFilter,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<User>(users);

  const enrichedData = useMemo(() => {
    return tableData.map((u) => ({
      ...u,
      role_name: roles.find((r: Role) => r.id === u.role_id)?.name || "",
    }));
  }, [tableData, roles]);

  const tableConfig: ReusableDataTableConfig<User> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%",filterType:"text" },
        { field: "name", header: "Name", width: "20%",filterType:"text", body: (row) => row.name || "-"},
        { field: "email", header: "Email", width: "20%" ,filterType:"text"},
        {
          field: "tenant_name",
          header: "Tenant",
          width: "10%",
          filterType: "text",
          body: (r) => {
            const tenant = tenants.find((t: Tenant) => t.id === r.tenant_id);
            return tenant?.name || "-";
          },
        },
        {
          field: "project_name",
          header: "Project",
          width: "10%",
          filterType: "text",
          body: (r) => {
            const project = projects.find(
              (p: TenantProject) => p.id === r.project_id,
            );
            return project?.name || "-";
          },
        },
        { field: "user_type",
          header: "Type",
          width: "10%",
          filterType:"select",
          filterOptions:Object.values(UserType).map((t) => ({
            label: t,
            value:t
          })),
        },
        { field: "role_name",
          header: "Role",
          width: "15%",
          filterType:"select",
          filterOptions: roles.map((r: Role) => ({
            label: r.name,
            value: r.name,
          }))
        },
        {
          field: "is_active",
          header: "Status",
          width: "10%",
          filterType: "select",
          filterOptions:[
            {label: "Active", value: true},
            {label: "InActive", value: false}
          ],
          body: (row) => (
            <Tag
              value={row.is_active ? "Active" : "Inactive"}
              severity={row.is_active ? "success" : "danger"}
            />
          ),
        },
        {
          field: "createdAt",
          header: "Created Date",
          width: "10%",
          filterType: "date",
          body: (r) =>
            new Date(r.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
        },
        {
          field: "updatedAt",
          header: "Updated Date",
          width: "10%",
          filterType: "date",
          body: (r) =>
            new Date(r.updated_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
        },
      ],
      dataKey: "id",
      paginator: true,
      rows: 10,
      selectable: true,
      selectionMode: "multiple",
      stripedRows: true,
      showGridlines: true,
    }),
    [roles]
  );

  /* ---------- RESET ---------- */

  const resetForm = useCallback(() => {
    setFormData({
      email: "",
      password: "",
      user_type: UserType.INVESTOR,

      role_id: "",
      tenant_id: "",
      project_id: "",

      department_id: "",
      sub_department_id: "",

      first_name: "",
      last_name: "",
      country_name: "",
      state_name: "",
      city_name: "",
      district_name: "",
      pin_code: "",
      address: "",
      mobile_number: "",
      pan_card: "",
      adhaar_number: "",

      full_name: "",
      hindi_full_name: "",
      office_no: "",
      mobile: "",
      dept_id: "",
      district_id: "",
      tehsil_id: "",
      circle_id: "",
      block_id: "",
      office_id: "",
      division_id: "",

      is_active: true,
      is_email_verified: 0,
    });

    setEditingUser(null);
  }, []);

  /* ---------- SUBMIT ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("SUBMIT editingUser:", editingUser);
    console.log("SUBMIT ID:",editingUser?.id);

    const payload = {
      email: formData.email,
      password: formData.password,
      user_type: formData.user_type,

      role_id: formData.role_id ? Number(formData.role_id) : null,
      tenant_id: formData.tenant_id ? Number(formData.tenant_id) : null,
      project_id: formData.project_id ? Number(formData.project_id) : null,

      department_id: formData.department_id
        ? Number(formData.department_id)
        : null,

      sub_department_id: formData.sub_department_id
        ? Number(formData.sub_department_id)
        : null,

      ...(formData.user_type === UserType.INVESTOR && {
        first_name: formData.first_name,
        last_name: formData.last_name,
        country_name: formData.country_name,
        state_name: formData.state_name,
        city_name: formData.city_name,
        district_name: formData.district_name,
        pin_code: formData.pin_code,
        address: formData.address,
        mobile_number: formData.mobile_number,
        pan_card: formData.pan_card,
        adhaar_number: formData.adhaar_number,
      }),

      ...(formData.user_type !== UserType.INVESTOR && {
        full_name: formData.full_name,
        hindi_full_name: formData.hindi_full_name,
        office_no: formData.office_no,
        mobile: formData.mobile,
        dept_id: formData.dept_id ? Number(formData.dept_id) : undefined,
        district_id: formData.district_id ? Number(formData.district_id) : undefined,
        tehsil_id: formData.tehsil_id ? Number(formData.tehsil_id) : undefined,
        circle_id: formData.circle_id || undefined,
        block_id: formData.block_id ? Number(formData.block_id) : undefined,
        office_id: formData.office_id ? Number(formData.office_id) : undefined,
        division_id: formData.division_id ? Number(formData.division_id) : undefined,
      }),

      is_active: formData.is_active,
      is_email_verified: formData.is_email_verified,
    };

    try {
      if (editingUser) {
        await updateUser.mutateAsync({
          id: editingUser.id,
          data: payload 
        });
        toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "User updated successfully",
      });
      } else {
        await createUser.mutateAsync(payload);
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: "User created successfully",
        });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message || "Operation failed",
      });
    }
  };

  /* ---------- EDIT ---------- */

  const handleEdit = (user: User) => {
    setEditingUser(user);

    setFormData({
      email: user.email,
      password: "",
      user_type: user.user_type,

      role_id: user.role_id?.toString() ?? "",
      tenant_id: user.tenant_id?.toString() ?? "",
      project_id: user.project_id?.toString() ?? "",

      department_id: user.department_id?.toString() ?? "",
      sub_department_id: user.sub_department_id?.toString() ?? "",

      first_name: user.investor_profile?.first_name ?? user.first_name ?? "",
      last_name: user.investor_profile?.last_name ?? user.last_name ?? "",
      country_name: user.investor_profile?.country_name ?? "",
      state_name: user.investor_profile?.state_name ?? "",
      city_name: user.investor_profile?.city_name ?? "",
      district_name: user.investor_profile?.district_name ?? "",
      pin_code: user.investor_profile?.pin_code ?? "",
      address: user.investor_profile?.address ?? "",
      mobile_number: user.investor_profile?.mobile_number ?? "",
      pan_card: user.investor_profile?.pan_card ?? "",
      adhaar_number: user.investor_profile?.adhaar_number ?? "",

      full_name: user.department_user?.full_name ?? user.full_name ?? "",
      hindi_full_name: user.department_user?.hindi_full_name ?? "",
      office_no: user.department_user?.office_no ?? "",
      mobile: user.department_user?.mobile ?? "",
      dept_id: user.department_user?.dept_id?.toString() ?? "",
      district_id: user.department_user?.district_id?.toString() ?? "",
      tehsil_id: user.department_user?.tehsil_id?.toString() ?? "",
      circle_id: user.department_user?.circle_id ?? "",
      block_id: user.department_user?.block_id?.toString() ?? "",
      office_id: user.department_user?.office_id?.toString() ?? "",
      division_id: user.department_user?.division_id?.toString() ?? "",

      is_active: user.is_active,
      is_email_verified: user.is_email_verified ?? 0,
    });

    setShowDialog(true);
  };

  const handleToggleRole = async (user: User) => {
      try {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            is_active: !user.is_active,
          },
        });
  
        toastRef.current?.show({
          severity: "success",
          summary: "Success",
          detail: `User ${user.is_active ? "deactivated" : "activated"} successfully`,
        });
      } catch (err: any) {
        toastRef.current?.show({
          severity: "error",
          summary: "Error",
          detail: err?.response?.data?.message || "Failed to update user status",
        });
      }
    };

  /* ---------- DELETE  ||---------- */

  const handleDelete = useCallback(
    async (user: User) => {
      console.log("DELETE USER:",user);
      console.log("DELETE USER ID:",user?.id);

    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toastRef.current?.show({
        severity: "success",
        summary: "Deleted",
        detail: "User deleted successfully",
      });
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: err?.response?.data?.message,
      });
    }
  },[deleteUser]);

  /* ---------- RENDER ---------- */

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Users Management</h1>
      <Toolbar
        left={
          <Button
            label="Add User"
            icon="pi pi-plus"
            severity="success"
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          />
        }
        right={
          <Button
            label="Clear Filters"
            icon="pi pi-filter-slash"
            outlined
            onClick={() => {
              clearFilters();
              handleGlobalFilterChange("");
              handleFiltersChange({});
            }}
          />
        }
        className="mb-3"
      />
      </div>

      <ReusableDataTable
        data={enrichedData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onFiltersChange={handleFiltersChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        externalFilters={filters}
        externalGlobalFilter={globalFilter}
        rowActions={[
          {
            icon: "pi pi-pencil",
            label: "Edit",
            severity: "info",
            onClick: handleEdit,
            tooltip: "Edit",
          },
          {
            icon: "pi pi-check",
            label: "Activate",
            severity: "success",
            tooltip: "Activate",
            visible: (user: User) => !user.is_active,
            onClick: (user: User) => handleToggleRole(user),
          },
          {
            icon: "pi pi-times",
            label: "Deactivate",
            severity: "warn",
            tooltip: "Deactivate",
            visible: (user: User) => user.is_active ,
            onClick: (user: User) => handleToggleRole(user),
          },
          {
            icon: "pi pi-trash",
            label: "Delete",
            severity: "error",
            onClick: handleDelete,
            tooltip:"Delete,"
          },
        ]}
      />

      <Dialog
        visible={showDialog}
        onHide={() => {
          resetForm();
          setShowDialog(false);
        }}
        header={
          <div className="ey-dialog-title">
            {editingUser ? "Edit User" : "Add New User"}
          </div>
        }
        modal
        className="ey-dialog"
        style={{ width: "50vw" }}
        breakpoints={{ "960px": "75vw", "640px": "90vw" }}
      >
        <form onSubmit={handleSubmit} className="text-sm">
  <div className="row">

    {/* EMAIL */}
    <div className="col-md-6 mb-3">
      <label className="form-label">Email *</label>
      <InputText
        value={formData.email}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, email: e.target.value }))
        }
        className="w-100"
        required
      />
    </div>

    {/* PASSWORD */}
    <div className="col-md-6 mb-3">
      <label className="form-label">Password *</label>
      <InputText
        type="password"
        value={formData.password}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, password: e.target.value }))
        }
        className="w-100"
        required={!editingUser}
      />
    </div>

    {/* USER TYPE */}
    <div className="col-md-6 mb-3">
      <label className="form-label">User Type *</label>
      <select
        className="form-select"
        value={formData.user_type}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            user_type: e.target.value as UserType,
          }))
        }
      >
        {Object.values(UserType).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>

    {/* ROLE */}
    <div className="col-md-6 mb-3">
      <label className="form-label">Role </label>
      <select
        className="form-select"
        value={formData.role_id}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            role_id: e.target.value?.toString()  ?? "",
          }))
        }
      >
        <option value="">Select Role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>

    {/* TENANT */}
    <div className="col-md-6 mb-3">
      <label className="form-label">Tenant</label>
      <InputText
        value={
          tenants.find((t) => formData.tenant_id && t.id === Number(formData.tenant_id))?.name || ""
        }
        className="w-100"
        disabled
      />
    </div>

    {/* PROJECT */}
    <div className="col-md-6 mb-3">
      <label className="form-label">Project</label>
      <InputText
        value={
          projects.find((p) => formData.project_id && p.id === Number(formData.project_id))?.name || ""
        }
        className="w-100"
        disabled
      />
    </div>

    {/* ===== DEPARTMENT USER ===== */}
    {formData.user_type !== UserType.INVESTOR && (
      <>
        {/* FULL NAME */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Full Name *</label>
          <InputText
            value={formData.full_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                full_name: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* HINDI NAME */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Hindi Full Name</label>
          <InputText
            value={formData.hindi_full_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                hindi_full_name: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* OFFICE NO */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Office No</label>
          <InputText
            value={formData.office_no}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                office_no: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* MOBILE */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Mobile</label>
          <InputText
            value={formData.mobile}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                mobile: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* DEPARTMENT */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Department *</label>
          <select
            className="form-select"
            value={formData.department_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                department_id: e.target.value ,
                sub_department_id: "",
              }))
            }
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* SUB-DEPARTMENT */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Sub Department </label>
          <select
            className="form-select"
            value={formData.sub_department_id}
            disabled={!formData.department_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sub_department_id: e.target.value ,
              }))
            }
          >
            <option value="">Select Sub Department</option>
            {subDepartments
              .filter(
                (s) =>
                  Number(s.json_definition?.department_id) ===
                  Number(formData.department_id)
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </div>

        

        {/* DISTRICT ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">District</label>
          <Dropdown
            value={formData.district_id ? Number(formData.district_id) : undefined}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                district_id: e.value?.toString() ?? "",
                block_id: "",
              }))
            }
            options={districtOptions}
            placeholder="Select District"
            className="w-100"
            showClear
            filter
          />
        </div>

        {/* TEHSIL ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Tehsil</label>
          <Dropdown
            value={formData.tehsil_id ? Number(formData.tehsil_id) : undefined}
            onChange={(e) => setFormData((prev) => ({ ...prev, tehsil_id: e.value?.toString() ?? "" }))}
            options={tehsilOptions}
            placeholder="Select Tehsil"
            className="w-100"
            showClear
            filter
          />
        </div>

        {/* CIRCLE ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Circle ID</label>
          <InputText
            value={formData.circle_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                circle_id: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* BLOCK ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Block</label>
          <Dropdown
            value={formData.block_id ? Number(formData.block_id) : undefined}
            onChange={(e) => setFormData((prev) => ({ ...prev, block_id: e.value?.toString() ?? "" }))}
            options={blockOptions}
            placeholder="Select Block"
            className="w-100"
            showClear
            filter
            disabled={!formData.district_id}
          />
        </div>

        {/* OFFICE ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Office ID</label>
          <InputText
            value={formData.office_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                office_id: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        {/* DIVISION ID */}
        <div className="col-md-6 mb-3">
          <label className="form-label">Division ID</label>
          <InputText
            value={formData.division_id}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                division_id: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>
      </>
    )}

    {/* ===== INVESTOR USER ===== */}
    {formData.user_type === UserType.INVESTOR && (
      <>
        <div className="col-md-6 mb-3">
          <label className="form-label">First Name *</label>
          <InputText
            value={formData.first_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                first_name: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Last Name</label>
          <InputText
            value={formData.last_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                last_name: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Country</label>
          <Dropdown
            value={formData.country_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, country_name: e.value }))}
            options={countryOptions}
            placeholder="Select Country"
            className="w-100"
            showClear
            filter
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">State</label>
          <Dropdown
            value={formData.state_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, state_name: e.value }))}
            options={stateOptions}
            placeholder="Select State"
            className="w-100"
            showClear
            filter
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">City</label>
          <InputText
            value={formData.city_name}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                city_name: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">District</label>
          <Dropdown
            value={formData.district_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, district_name: e.value }))}
            options={districtNameOptions}
            placeholder="Select District"
            className="w-100"
            showClear
            filter
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Pin Code</label>
          <InputText
            value={formData.pin_code}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pin_code: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">PAN Card</label>
          <InputText
            value={formData.pan_card}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pan_card: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Aadhar Number</label>
          <InputText
            value={formData.adhaar_number}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                adhaar_number: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Address</label>
          <InputText
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                address: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>

        <div className="col-md-6 mb-3">
          <label className="form-label">Mobile Number</label>
          <InputText
            value={formData.mobile_number}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                mobile_number: e.target.value,
              }))
            }
            className="w-100"
          />
        </div>
      </>
    )}

    {/* STATUS */}
    <div className="col-md-6 mb-3">
              <label className="form-label d-block">Status</label>

              <div className="form-check">
                <input
                  type="checkbox"
                  id="is_active"
                  className="form-check-input"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked, // ✅ true if checked, false if not
                    }))
                  }
                  style={{
                    width: "1.2rem",
                    height: "1.2rem",
                    cursor: "pointer",
                  }}
                />

                <label
                  htmlFor="is_active"
                  className="form-check-label"
                  style={{
                    marginLeft: "8px",
                    fontWeight: 500,
                    color: formData.is_active ? "#16a34a" : "#dc2626",
                  }}
                >
                  {formData.is_active ? "Active" : "Inactive"}
                </label>
              </div> 
      </div>
    

    {/* EMAIL VERIFIED */}
    <div className="col-md-6 mb-3">
      <label className="form-label d-block">Email Verified</label>
      <div className="form-check">
        <input
          type="checkbox"
          className="form-check-input"
          checked={formData.is_email_verified === 1}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              is_email_verified: e.target.checked ? 1 : 0,
            }))
          }
        />
        <label className="form-check-label ms-2">Verified</label>
      </div>
    </div>

  </div>

  {/* ACTIONS */}
  <div className="d-flex gap-3 justify-content-end mt-3 pt-3 border-top">
    <Button
      label="Cancel"
      severity="secondary"
      onClick={() => setShowDialog(false)}
    />
    <Button
      type="submit"
      label={editingUser ? "Update" : "Create"}
    />
  </div>
</form>
      </Dialog>
    </div>
  );
}