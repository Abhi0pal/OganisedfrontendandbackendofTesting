'use client';

import { CheckCircle, XCircle } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleService,
} from '@/hooks/master/useServices';
import { useIssuers } from '@/hooks/master/useIssuers';
import { useMasterDefinitions } from '@/hooks/master/useMasterDefinitions';
import { useMasterDataByDefinition } from '@/hooks/master/useMasterDataByDefinition';
import { useRouter } from 'next/navigation';
import { useServiceTypes } from '@/hooks/master/useServicetypes';
import { useServiceIncidences } from '@/hooks/master/useServiceincidences';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { exportToCSV, exportToExcel, exportToPDF, prepareModuleExportData } from '@/lib/export-utils';
import { serviceExportConfig } from '@/lib/export-configs';
import { Dropdown } from 'primereact/dropdown';
import { useTenants } from '@/hooks/common/useTenants';
import { useTenantProjects } from '@/hooks/common/useTenantProjects';

type ServiceStatus =
  | "NOT_APPLICABLE"
  | "Integrated"
  | "Onboarded"
  | "Offline"
  | "ONLINE_ON_DEPT_PORTAL"
  | "Incentives"
  | "";

interface Service {
  id: number;
  uid?: string | null;
  service_id: string;
  department_id: number;
  department_name?: string;
  issuer_id?: number | null;
  issuer_name?: string | null;
  service_level?: string | null;
  document_checklist?: string | null;
  document_checklist_mapping?: any[] | null;
  document_type_mapping?: any[] | null;
  document_checkpoint_mapping?: any[] | null;
  comments?: string | null;
  service_name: string;
  nameInHindi?: string | null;
  service_url?: string;
  development_url?: string;
  is_in_SWCS_act: boolean;
  description?: string;
  is_integrated_with_dms: boolean;
  service_status: ServiceStatus;
  service_go_live_date?: string | null;
  service_end_date?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenantId?: number | null;
  projectId?: number | null;
  tenant?: { id: number; name: string; tenant_ID?: string | null } | null;
  project?: { id: number; name: string; project_ID?: string | null; code: string } | null;
  popup_data?: string | null;
  enable_preview?: boolean;
}

interface ServiceFormData {
  service_id: string;
  department_id: number;
  issuer_id?: number | null;
  service_level: number[];
  comments: string;
  service_name: string;
  nameInHindi: string;
  is_in_SWCS_act: boolean;
  isActive: boolean;
  sub_department?: string;

  act_name?: string;

  service_status: ServiceStatus;

  service_go_live_date?: string | null;
  service_end_date?: string | null;

  tenantId?: number | null;
  projectId?: number | null;
  service_type_id?: number | null;
  popup_data?: string | null;
  enable_preview?: boolean;
}

export const ServiceMaster = () => {
  /** 🔥 Fetch API Data */
  const { data: services = [], isLoading } = useServices();
  const { data: issuers = [] } = useIssuers();
  const router = useRouter();
  const { data: servicetypes = [] } = useServiceTypes();
  const { data: serviceincidences = [] } = useServiceIncidences();
  const { data: tenants = [] } = useTenants();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const toggleMutation = useToggleService();

  const toastRef = useRef<Toast>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { data: tenantProjects = [] } = useTenantProjects(selectedTenantId);
  const { data: masterDefinitions = [], isLoading: isMasterDefsLoading } = useMasterDefinitions(selectedTenantId, selectedProjectId);

  // Auto-detect Department and Sub Department master definitions from the list
  // Priority: exact code match → code contains → name contains → index fallback
  const deptDefinition = useMemo(() => {
    if (!masterDefinitions.length) return null;
    const upper = (s: string) => (s || '').toUpperCase();
    const lower = (s: string) => (s || '').toLowerCase();
    return (
      // 1. Exact code match: DEPARTMENT
      masterDefinitions.find((d: any) => upper(d.code) === 'DEPARTMENT') ||
      // 2. Code contains 'DEPT' but not 'SUB'
      masterDefinitions.find(
        (d: any) => upper(d.code).includes('DEPT') && !upper(d.code).includes('SUB'),
      ) ||
      // 3. Name contains 'department' but not 'sub'
      masterDefinitions.find(
        (d: any) => lower(d.name).includes('department') && !lower(d.name).includes('sub'),
      ) ||
      // 4. Fallback: first definition
      masterDefinitions[0] ||
      null
    );
  }, [masterDefinitions]);

  const subDeptDefinition = useMemo(() => {
    if (!masterDefinitions.length) return null;
    const upper = (s: string) => (s || '').toUpperCase();
    const lower = (s: string) => (s || '').toLowerCase();
    return (
      // 1. Exact code match: SUB_DEPARTMENT
      masterDefinitions.find((d: any) => upper(d.code) === 'SUB_DEPARTMENT') ||
      // 2. Code contains 'SUB'
      masterDefinitions.find((d: any) => upper(d.code).includes('SUB')) ||
      // 3. Name contains 'sub'
      masterDefinitions.find((d: any) => lower(d.name).includes('sub')) ||
      // 4. Fallback: second definition (different from dept)
      masterDefinitions.find((d: any) => d.id !== deptDefinition?.id) ||
      null
    );
  }, [masterDefinitions, deptDefinition]);

  const { data: deptDataOptions = [], isLoading: isDeptLoading } = useMasterDataByDefinition(deptDefinition?.id ?? null);
  const { data: subDeptDataOptions = [], isLoading: isSubDeptLoading } = useMasterDataByDefinition(subDeptDefinition?.id ?? null);

  const tenantOptions = useMemo(
    () => tenants.map((t: any) => ({ label: t.name, value: t.id })),
    [tenants],
  );
  const projectOptions = useMemo(
    () => tenantProjects.map((p: any) => ({ label: `${p.code} — ${p.name}`, value: p.id })),
    [tenantProjects],
  );
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubService, setIsSubService] = useState(false);
  const [parentServiceBase, setParentServiceBase] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [serviceData, setformData] = useState<ServiceFormData>({
    service_id: "",
    department_id: 0,
    issuer_id: null,
    service_level: [],
    comments: '',
    service_name: "",
    nameInHindi: "",
    is_in_SWCS_act: false,
    service_status: "NOT_APPLICABLE",
    service_go_live_date: null,
    service_end_date: null,
    isActive: true,
    sub_department: "",
    tenantId: null,
    projectId: null,
    act_name: "",
    popup_data: "",
    enable_preview: false,
  });

  const serviceStatusOptions = [

    {
      label: "Integrated",
      value: "INTEGRATED"
    },

    {
      label: "Onboarded",
      value: "ONBOARDED"
    }

  ];

  const findBaseServiceTypeId = () => {
    const base = servicetypes.find((item: any) =>
      String(item.name || '').toLowerCase().includes('base')
    );
    return base?.id ?? 0;
  };

  const getServiceIdParts = (value?: string | null) => {
    const raw = String(value || '');
    const [baseRaw, decimalRaw] = raw.split('.');
    const base = Number(baseRaw);
    return {
      base: Number.isFinite(base) ? base : null,
      decimal: decimalRaw ? String(decimalRaw) : null,
    };
  };

  const getNextServiceIdBase = () => {
    const parts = (services || [])
      .map((s: any) => String(s.service_id || ''))
      .map((value: string) => value.split('.')[0])
      .map((value: string) => Number(value))
      .filter((value: number) => Number.isFinite(value));
    if (!parts.length) return 1;
    return Math.max(...parts) + 1;
  };

  // Derive decimal suffix from service type NAME (not ID) so DB auto-increment doesn't break mapping
  const resolveServiceTypeDecimal = (serviceTypeId?: number | null): string => {
    if (!serviceTypeId) return '0';
    const typeItem = servicetypes.find((t: any) => Number(t.id) === Number(serviceTypeId));
    if (!typeItem) return '0';
    const name = String(typeItem.name || '').toLowerCase();
    const nameToDecimal: Record<string, string> = {
      'amendment': '1',
      'cancellation': '2',
      'surrender': '3',
      'transfer': '4',
      'duplicate': '5',
      'renewal': '6',
      'return': '7',
      'maintenance': '8',
      'utilities': '9',
    };
    for (const [keyword, decimal] of Object.entries(nameToDecimal)) {
      if (name.includes(keyword)) return decimal;
    }
    return '0';
  };

  const findServiceTypeIdByDecimal = (decimal?: string | null) => {
    const key = String(decimal || '');
    if (key === '0') return 0;
    const nameMap: Record<string, string> = {
      '1': 'amendment',
      '2': 'cancellation',
      '3': 'surrender',
      '4': 'transfer',
      '5': 'duplicate',
      '6': 'renewal',
      '7': 'return',
      '8': 'maintenance',
      '9': 'utilities',
    };
    const term = nameMap[key];
    if (!term) return null;
    const match = servicetypes.find((item: any) =>
      String(item.name || '').toLowerCase().includes(term)
    );
    return match?.id ?? null;
  };

  const applyServiceIdFromType = (serviceTypeId?: number | null, baseNumber?: number | null) => {
    const nextBase = baseNumber && Number.isFinite(baseNumber) ? baseNumber : getNextServiceIdBase();
    const decimal = resolveServiceTypeDecimal(serviceTypeId);
    setformData((prev) => ({
      ...prev,
      service_type_id: serviceTypeId ?? null,
      service_id: `${nextBase}.${decimal}`,
    }));
  };

  const serviceLevelOptions = serviceincidences.map((item: any) => ({
    label: item.name,
    value: item.id,
  }));

  const getServiceIncidenceLabels = (value?: string | null) => {
    if (!value) return 'N/A';
    const ids = String(value)
      .split(',')
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));
    if (!ids.length) return 'N/A';
    const names = ids
      .map((id) => serviceincidences.find((item: any) => Number(item.id) === id))
      .filter(Boolean)
      .map((item: any) => item.name);
    return names.length ? names.join(', ') : 'N/A';
  };


  const activeIssuers = useMemo(
    () => issuers.filter((issuer) => issuer.isIssuerActive),
    [issuers]
  );

  // Auto-set service_id when dialog opens for new service (no editingId)
  useEffect(() => {
    if (editingId) return;
    if (!showDialog) return;
    if (serviceData.service_id) return;
    // Compute next base from loaded services
    const nextBase = getNextServiceIdBase();
    setformData((prev) => ({ ...prev, service_id: `${nextBase}.0` }));
  }, [showDialog, editingId]);

  // masterDefinitions already filtered by selectedTenantId + selectedProjectId via useMasterDefinitions hook

  /** 🔥 Memoize incoming server data */
  const initialData = useMemo(() => services, [services]);

  /** 🔥 Use DataTable Manager Hook */
  const {
    data: tableData,
    filteredData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<Service>(initialData);

  /** 🔥 Table Configuration */
  const tableConfig: ReusableDataTableConfig<Service> = useMemo(
    () => ({
      columns: [
        { field: 'id', header: 'ID', width: '4%', filterType: 'none' },
        {
          field: 'tenant',
          header: 'Tenant Name',
          width: '10%',
          filterType: 'text',
          body: (row) => row.tenant ? <span>{row.tenant.name}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'tenantId',
          header: 'Tenant Code',
          width: '8%',
          filterType: 'text',
          body: (row) => row.tenant?.tenant_ID ? <span>{row.tenant.tenant_ID}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'project',
          header: 'Project Name',
          width: '10%',
          filterType: 'text',
          body: (row) => row.project ? <span>{row.project.name}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'projectId',
          header: 'Project Code',
          width: '8%',
          filterType: 'text',
          body: (row) => row.project ? <span>{row.project.project_ID || row.project.code}</span> : <span className="text-muted">—</span>,
        },
        {
          field: 'service_id',
          header: 'Service ID',
          width: '12%',
          filterType: 'text',
          body: (row) => row.service_id || 'N/A',
        },
        {
          field: 'service_name',
          header: 'Service Name',
          width: '22%',
          filterType: 'text',
          body: (row) => <span className="font-semibold">{row.service_name}</span>,
        },
        {
          field: 'nameInHindi',
          header: 'Service Name (Hindi)',
          width: '20%',
          filterType: 'text',
          body: (row) => row.nameInHindi || 'N/A',
        },
        {
          field: 'service_level',
          header: 'Service Incidence',
          width: '16%',
          filterType: 'text',
          body: (row) => getServiceIncidenceLabels(row.service_level),
        },
        {
          field: 'department_name',
          header: 'Department',
          width: '20%',
          filterType: 'text',
        },
        {
          field: 'issuer_name',
          header: 'Issuer Type',
          width: '10%',
          filterType: 'text',
          body: (row) => row.issuer_name || 'N/A',
        },
        {
          field: 'isActive',
          header: 'Status',
          width: '10%',
          filterType: 'select',
          filterOptions: [
            { label: 'Active', value: true },
            { label: 'Inactive', value: false },
          ],
          body: (row) => (
            <div className="d-flex align-items-center gap-2">
              {row.isActive ? (
                <>
                  <CheckCircle size={14} style={{ color: '#28a745' }} />
                  <span style={{ color: '#28a745', fontWeight: 600 }}>Active</span>
                </>
              ) : (
                <>
                  <XCircle size={14} style={{ color: '#dc3545' }} />
                  <span style={{ color: '#dc3545', fontWeight: 600 }}>Inactive</span>
                </>
              )}
            </div>
          ),
        },
        {
          field: 'createdAt',
          header: 'Created Date',
          width: '10%',
          filterType: 'date',
          body: (row) => new Date(row.createdAt).toLocaleDateString('en-IN'),
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['service_name', 'nameInHindi'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No Service found.',
    }),
    []
  );


  /** 🔥 Input Change */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    const numericFields = ['department_id', 'issuer_id'];
    setformData({
      ...serviceData,
      [name]:
        type === 'checkbox'
          ? checked
          : numericFields.includes(name)
            ? value === ''
              ? null
              : Number(value)
            : value,
    });
  };

  /** 🔥 Submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        ...serviceData,
        service_level: serviceData.service_level.length
          ? serviceData.service_level.join(',')
          : undefined,
      };
      // remove frontend-only field — not stored in DB

      // convert date strings to ISO format
      if (serviceData.service_go_live_date) {
        submitData.service_go_live_date = new Date(serviceData.service_go_live_date).toISOString();
      } else {
        delete submitData.service_go_live_date;
      }
      if (serviceData.service_end_date) {
        submitData.service_end_date = new Date(serviceData.service_end_date).toISOString();
      } else {
        delete submitData.service_end_date;
      }

      const nextServiceId = String(submitData.service_id || '');
      if (nextServiceId) {
        const exists = (services || []).some((s: any) => {
          if (!s?.service_id) return false;
          if (editingId && Number(s.id) === Number(editingId)) return false;
          return String(s.service_id) === nextServiceId;
        });
        if (exists) {
          toastRef.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Service ID already exists. Please change Service Type.',
          });
          return;
        }
      }
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: submitData });
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service updated successfully' });
      } else {
        await createMutation.mutateAsync(submitData);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service created successfully' });
      }
      resetForm();
      setShowDialog(false);
    } catch (err: any) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error saving service' });
    }
  };

  /** 🔥 Edit */
  const handleEdit = (service: Service) => {
    const formatDate = (date?: string | null) =>
      date ? new Date(date).toISOString().split('T')[0] : null;

    const parsedLevels = service.service_level
      ? service.service_level
        .split(',')
        .map((value) => Number(value))
        .filter((value) => !Number.isNaN(value))
      : [];

    const issuerId =
      service.issuer_id ?? (service as any).department?.issuerId ?? null;
    const parts = getServiceIdParts(service.service_id);
    const serviceTypeId = parts.decimal === null || parts.decimal === '0'
      ? 0
      : findServiceTypeIdByDecimal(parts.decimal);

    const tId = service.tenantId ? Number(service.tenantId) : null;
    const pId = service.projectId ? Number(service.projectId) : null;
    setSelectedTenantId(tId);
    setSelectedProjectId(pId);
    // (master definition auto-detected from tenant+project)
    setformData((prev) => ({
      ...prev,
      service_id: service.service_id || '',
      department_id: service.department_id,
      issuer_id: issuerId,
      service_level: parsedLevels,
      comments: service.comments || '',
      service_name: service.service_name || '',
      nameInHindi: service.nameInHindi || '',
      is_in_SWCS_act: service.is_in_SWCS_act,
      service_status: service.service_status,
      service_go_live_date: formatDate((service as any).service_go_live_date),
      service_end_date: formatDate((service as any).service_end_date),
      isActive: service.isActive,
      tenantId: tId,
      projectId: pId,
      popup_data: service.popup_data || '',
      enable_preview: (service as any).enable_preview || false,
    }));

    setEditingId(service.id);
    setShowDialog(true);
  };

  const handleView = (service: Service) => {
    setSelectedService(service);
    setShowViewDialog(true);
  };

  const handleAddDms = (service: Service) => {
    if (!service?.service_id) return;
    if (typeof window !== 'undefined') {
      window.open(`/admin/master/service/dms?serviceId=${service.service_id}`, '_blank');
      return;
    }
    router.push(`/admin/master/service/dms?serviceid=${service.service_id}`);
  };

  const handleConfigureWorkflow = (service: Service) => {
    if (!service?.service_id) return;
    if (typeof window !== 'undefined') {
      window.open(`/admin/workflow-forms?serviceId=${service.service_id}`, '_blank');
      return;
    }
    router.push(`/admin/workflow-forms?serviceId=${service.service_id}`);
  };

  /** 🔥 Delete */
  const handleDelete = async (service: Service) => {
    if (confirm(`Are you sure you want to delete ${service.service_name}?`)) {
      try {
        await deleteMutation.mutateAsync(service.id);
        toastRef.current?.show({ severity: 'success', summary: 'Success', detail: 'Service deleted successfully' });
      } catch (err) {
        toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error deleting service' });
      }
    }
  };

  /** 🔥 Add Sub Service (Amendment, Renewal etc.) */
  const handleAddSubService = (service: Service) => {
    const parts = getServiceIdParts(service.service_id);
    const base = parts.base ?? getNextServiceIdBase();
    setParentServiceBase(base);
    setIsSubService(true);
    setEditingId(null);
    setSelectedTenantId(service.tenantId ?? null);
    setSelectedProjectId(service.projectId ?? null);
    setformData({
      service_id: `${base}.`,          // incomplete — user must select type
      department_id: service.department_id ?? 0,
      issuer_id: service.issuer_id ?? null,
      service_level: [],
      comments: '',
      service_name: '',
      nameInHindi: '',
      sub_department: '',
      act_name: '',
      is_in_SWCS_act: false,
      service_status: 'NOT_APPLICABLE',
      service_go_live_date: null,
      service_end_date: null,
      isActive: true,
      tenantId: service.tenantId ?? null,
      projectId: service.projectId ?? null,
      service_type_id: null,
      enable_preview: false,
    });
    setShowDialog(true);
  };

  /** 🔥 Toggle */
  const handleToggle = async (service: Service) => {
    try {
      await toggleMutation.mutateAsync(service.id);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Service ${service.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (err) {
      toastRef.current?.show({ severity: 'error', summary: 'Error', detail: 'Error updating service status' });
    }
  };

  /** 🔥 Row Actions */
  const rowActions: RowAction<Service>[] = [
    { icon: 'pi pi-eye', label: 'View', severity: 'secondary', onClick: handleView, tooltip: 'View Details' },
    { icon: 'pi pi-pencil', label: 'Edit', severity: 'info', onClick: handleEdit, tooltip: 'Edit' },
    {
      icon: 'pi pi-sitemap',
      label: 'Sub Service',
      severity: 'success' as any,
      onClick: handleAddSubService,
      tooltip: 'Add Sub Service (Amendment / Renewal etc.)',
      visible: (s) => String(s.service_id || '').endsWith('.0'),
    },
    { icon: 'pi pi-plus', label: 'Add DMS', severity: 'secondary', onClick: handleAddDms, tooltip: 'Add DMS' },
    {
      icon: 'pi pi-sitemap',
      label: 'Workflow',
      severity: 'help' as any,
      onClick: handleConfigureWorkflow,
      tooltip: 'Configure Workflow',
    },
    {
      icon: 'pi pi-check',
      label: 'Toggle',
      severity: 'success',
      onClick: handleToggle,
      tooltip: 'Toggle Status',
      visible: (s) => !s.isActive,
    },
    {
      icon: 'pi pi-times',
      label: 'Deactivate',
      severity: 'warn',
      onClick: handleToggle,
      tooltip: 'Deactivate',
      visible: (s) => s.isActive,
    },
    { icon: 'pi pi-trash', label: 'Delete', severity: 'error', onClick: handleDelete, tooltip: 'Delete' },
  ];


  /** 🔥 Reset Form */
  const resetForm = () => {
    const nextBase = getNextServiceIdBase();

    setSelectedTenantId(null);
    setSelectedProjectId(null);
    setformData({
      service_id: `${nextBase}.0`,   // simple default

      department_id: 0,
      issuer_id: null,

      service_level: [],
      comments: '',
      service_name: '',
      nameInHindi: '',
      sub_department: '',
      act_name: '',
      is_in_SWCS_act: false,
      service_status: 'NOT_APPLICABLE',
      service_go_live_date: null,
      service_end_date: null,
      isActive: true,
      tenantId: null,
      projectId: null,
      enable_preview: false,
    });

    setEditingId(null);
    setIsSubService(false);
    setParentServiceBase(null);
  };

  /** 🔥 Export handlers */
  const handleExportCSV = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      exportToCSV(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `CSV exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      await exportToExcel(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `Excel exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, serviceExportConfig);
      exportToPDF(exportData);
      toastRef.current?.show({ severity: 'success', summary: 'Success', detail: `PDF exported (${filteredData.length})` });
    } finally {
      setExporting(false);
    }
  };

  /** 🔥 Toolbar templates */
  const leftToolbarTemplate = () => (
    <Button
      label="Add Service"
      icon="pi pi-plus"
      severity="success"
      onClick={() => {
        resetForm();
        setShowDialog(true);
      }}
    />
  );

  const rightToolbarTemplate = () => (
    <div className="d-flex gap-2">
      <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" outlined onClick={() => { clearFilters(); handleGlobalFilterChange(''); handleFiltersChange({}); }} />
      <Button label="CSV" icon="pi pi-download" severity="info" rounded onClick={handleExportCSV} loading={exporting} disabled={isLoading} />
      <Button label="Excel" icon="pi pi-file-excel" severity="success" rounded onClick={handleExportExcel} loading={exporting} disabled={isLoading} />
      <Button label="PDF" icon="pi pi-file-pdf" severity="warning" rounded onClick={handleExportPDF} loading={exporting} disabled={isLoading} />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4">
        <h1 className="h2 mb-3">Service Master</h1>
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} className="mb-3" />
      </div>

      <Dialog
        visible={showDialog}
        onHide={() => { setShowDialog(false); setIsSubService(false); setParentServiceBase(null); }}
        header={editingId ? 'Edit Service' : isSubService ? 'Add Sub Service' : 'Add New Service'}
        modal
        style={{ width: '50vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Auto-generated Service ID — read-only display */}
            <div className="col-md-12 mb-3">
              <div style={{ background: '#f0f4ff', border: '1px solid #c7d4f0', borderRadius: 6, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 600, color: '#495057' }}>Service ID:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#0d6efd', fontWeight: 700 }}>
                  {serviceData.service_id || 'Auto-generating...'}
                </span>
                {!editingId && (
                  <span style={{ fontSize: '0.78rem', color: '#6c757d' }}>(auto-assigned on save)</span>
                )}
              </div>
            </div>

            {/* Service Type — only shown when adding a sub-service */}
            {isSubService && (
              <div className="col-md-12 mb-3">
                <label className="form-label">Service Type *</label>
                <Dropdown
                  value={serviceData.service_type_id ?? null}
                  options={servicetypes.map((t: any) => ({ label: t.name || t.service_type, value: t.id }))}
                  onChange={(e) => applyServiceIdFromType(e.value, parentServiceBase)}
                  placeholder="Select Service Type"
                  className="w-100"
                  filter
                  showClear
                  appendTo="self"
                  required
                />
                {!serviceData.service_type_id && (
                  <small className="text-muted">Selecting a type will auto-assign the Service ID</small>
                )}
              </div>
            )}

            <div className="col-md-6 mb-3">
              <label className="form-label">Tenant</label>
              <Dropdown
                value={serviceData.tenantId}
                options={tenantOptions}
                onChange={(e) => {
                  setSelectedTenantId(e.value ?? null);
                  setSelectedProjectId(null);
                  setformData((p) => ({ ...p, tenantId: e.value ?? null, projectId: null, department_id: 0, sub_department: '' }));
                }}
                placeholder="Select Tenant"
                className="w-100"
                filter
                showClear
                appendTo="self"
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Project</label>
              <Dropdown
                value={serviceData.projectId}
                options={projectOptions}
                onChange={(e) => {
                  setSelectedProjectId(e.value ?? null);
                  setformData((p) => ({ ...p, projectId: e.value ?? null, department_id: 0, sub_department: '' }));
                }}
                placeholder={serviceData.tenantId ? 'Select Project' : 'Select Tenant first'}
                className="w-100"
                filter
                showClear
                appendTo="self"
                disabled={!serviceData.tenantId}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Issuer Type *</label>
              <select
                name="issuer_id"
                className="form-select"
                value={serviceData.issuer_id ?? ''}
                onChange={(e) => {
                  const issuerId = e.target.value === '' ? null : Number(e.target.value);
                  setformData({
                    ...serviceData,
                    issuer_id: issuerId,
                  });
                }}
                required
              >
                <option value="">Select Issuer Type</option>
                {activeIssuers.map((issuer) => (
                  <option key={issuer.id} value={issuer.id}>
                    {issuer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">
                Department *
                {deptDefinition && (
                  <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: 6 }}>
                    ({deptDefinition.name})
                  </span>
                )}
              </label>
              <select
                name="department_id"
                className="form-select"
                value={serviceData.department_id ?? ''}
                onChange={handleInputChange}
                required
                disabled={!serviceData.tenantId || isDeptLoading}
              >
                <option value="">
                  {!serviceData.tenantId
                    ? 'Select Tenant first'
                    : isMasterDefsLoading || isDeptLoading
                      ? 'Loading...'
                      : masterDefinitions.length === 0
                        ? 'No masters configured for this tenant/project'
                        : deptDataOptions.length === 0
                          ? `No data in "${deptDefinition?.name || 'definition'}"`
                          : 'Select Department'}
                </option>
                {deptDataOptions?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">
                Sub Department
                {subDeptDefinition && (
                  <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: 6 }}>
                    ({subDeptDefinition.name})
                  </span>
                )}
              </label>
              <select
                name="sub_department"
                className="form-select"
                value={serviceData.sub_department ?? ''}
                onChange={handleInputChange}
                disabled={!serviceData.tenantId || isSubDeptLoading}
              >
                <option value="">
                  {!serviceData.tenantId
                    ? 'Select Tenant first'
                    : isMasterDefsLoading || isSubDeptLoading
                      ? 'Loading...'
                      : masterDefinitions.length === 0
                        ? 'No masters configured for this tenant/project'
                        : subDeptDataOptions.length === 0
                          ? 'No sub-department data'
                          : 'Select Sub Department'}
                </option>
                {subDeptDataOptions?.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">Service Name *</label>
              <InputText id="name" name="service_name" value={serviceData.service_name} onChange={handleInputChange} placeholder="Enter Service Name" className="w-100" required />
            </div>



            <div className="col-md-6 mb-3">
              <label htmlFor="nameInHindi" className="form-label">Service Name (Hindi)</label>
              <InputText
                id="nameInHindi"
                name="nameInHindi"
                value={serviceData.nameInHindi}
                onChange={handleInputChange}
                placeholder="सेवा का नाम हिंदी में"
                className="w-100"
              />
            </div>


            <div className="col-md-6 mb-3">
              <label className="form-label">Act / Rules</label>
              <InputText
                name="act_name"
                value={serviceData.act_name}
                onChange={handleInputChange}
                className="w-100"
              />
            </div>


            <div className="col-md-6 mb-3">
              <label className="form-label">Service Incidence *</label>
              <MultiSelect
                value={serviceData.service_level}
                options={serviceLevelOptions}
                display="chip"
                className="w-100"
                placeholder="Select Service Level"
                onChange={(e) =>
                  setformData({ ...serviceData, service_level: e.value })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Service Status *</label>
              <select name="service_status" className="form-select" value={serviceData.service_status} onChange={handleInputChange} required>
                <option value="">Select Service Status</option>
                <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                {/* <option value="ONLINE_ON_DEPT_PORTAL">Online on Department Portal</option> */}
                <option value="INTEGRATED">Integrated</option>
                <option value="ONBOARDED">Onboarded</option>
                {/* <option value="OFFLINE">Offline</option>
                <option value="INCENTIVE">Incentive</option> */}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Service Go-Live Date</label>
              <input
                type="date"
                name="service_go_live_date"
                className="form-control"
                value={serviceData.service_go_live_date ?? ''}
                onChange={(e) =>
                  setformData({
                    ...serviceData,
                    service_go_live_date: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Service End Date</label>
              <input
                type="date"
                name="service_end_date"
                className="form-control"
                value={serviceData.service_end_date ?? ''}
                onChange={(e) =>
                  setformData({
                    ...serviceData,
                    service_end_date: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Comments</label>
              <InputText
                name="comments"
                value={serviceData.comments}
                onChange={handleInputChange}
                placeholder="Enter comments"
                className="w-100"
              />
            </div>

            <div className="col-md-12 mb-3">
              <label className="form-label">Popup Content (shown to investor when opening the form)</label>
              <InputTextarea
                name="popup_data"
                value={serviceData.popup_data || ''}
                onChange={(e) => setformData({ ...serviceData, popup_data: e.target.value })}
                placeholder="Enter popup content to display when the service form is opened (leave blank for no popup)"
                rows={4}
                className="w-100"
              />
            </div>

            <div className="col-md-4 mb-3 form-check">
              <input id="is_in_SWCS_act" name="is_in_SWCS_act" type="checkbox" className="form-check-input" checked={serviceData.is_in_SWCS_act} onChange={handleInputChange} />
              <label className="form-check-label" htmlFor="is_in_SWCS_act">Is in SWCS Act</label>
            </div>

            <div className="col-md-4 mb-3 form-check">
              <input id="enable_preview" name="enable_preview" type="checkbox" className="form-check-input" checked={serviceData.enable_preview ?? false} onChange={(e) => setformData({ ...serviceData, enable_preview: e.target.checked })} />
              <label className="form-check-label" htmlFor="enable_preview">Enable Preview Feature</label>
            </div>

            <div className="col-md-4 mb-3 form-check">
              <input id="isActive" name="isActive" type="checkbox" className="form-check-input" checked={serviceData.isActive} onChange={handleInputChange} />
              <label className="form-check-label" htmlFor="isActive">Active</label>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button label={editingId ? 'Update' : 'Create'} icon="pi pi-check" type="submit" loading={createMutation.isPending || updateMutation.isPending} className="flex-grow-1" />
            <Button label="Cancel" icon="pi pi-times" severity="secondary" onClick={() => setShowDialog(false)} />
          </div>
        </form>
      </Dialog>

      <Dialog
        visible={showViewDialog}
        onHide={() => setShowViewDialog(false)}
        header="Service Details"
        modal
        style={{ width: '55vw' }}
        breakpoints={{ '960px': '75vw', '640px': '90vw' }}
      >
        {selectedService ? (
          <div className="row g-3">
            <div className="col-md-6">
              <div className="fw-semibold">Service ID</div>
              <div>{selectedService.service_id || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Name</div>
              <div>{selectedService.service_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Name (Hindi)</div>
              <div>{selectedService.nameInHindi || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Department</div>
              <div>{selectedService.department_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Issuer Type</div>
              <div>{selectedService.issuer_name || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Level</div>
              <div>{selectedService.service_level || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service Status</div>
              <div>{selectedService.service_status || 'N/A'}</div>
            </div>
            <div className="col-md-12">
              <div className="fw-semibold">Comments</div>
              <div>{selectedService.comments || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Service URL</div>
              <div>{selectedService.service_url || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Development URL</div>
              <div>{selectedService.development_url || 'N/A'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">SWCS Act</div>
              <div>{selectedService.is_in_SWCS_act ? 'Yes' : 'No'}</div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Go-Live Date</div>
              <div>
                {selectedService.service_go_live_date
                  ? new Date(selectedService.service_go_live_date).toLocaleDateString('en-IN')
                  : 'N/A'}
              </div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">End Date</div>
              <div>
                {selectedService.service_end_date
                  ? new Date(selectedService.service_end_date).toLocaleDateString('en-IN')
                  : 'N/A'}
              </div>
            </div>
            <div className="col-md-6">
              <div className="fw-semibold">Status</div>
              <div>{selectedService.isActive ? 'Active' : 'Inactive'}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted">No details available.</div>
        )}
      </Dialog>

      <ReusableDataTable<Service>
        data={tableData}
        config={tableConfig}
        loading={isLoading}
        selectedRows={selectedRows}
        onSelectionChange={handleSelectionChange}
        onGlobalFilterChange={handleGlobalFilterChange}
        onFiltersChange={handleFiltersChange}
        rowActions={rowActions}
      />
    </div>
  );
};
