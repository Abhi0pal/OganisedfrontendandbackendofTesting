'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { CheckCircle, AlertCircle, Archive, CircleDot } from 'lucide-react';

import {
  WorkflowConfig,
  useCreateWorkflowConfig,
  useDeleteWorkflowConfig,
  useUpdateWorkflowConfig,
  useWorkflowConfigs,
} from '@/hooks/master/useWorkflowConfigs';
import { useDepartments } from '@/hooks/master/useDepartments';
import { useFormTypes } from '@/hooks/master/useFormTypes';
import { useServices } from '@/hooks/master/useServices';
import { useWorkflowActions } from '@/hooks/master/useWorkflowActions';
import { useWorkflowAssignmentStrategies } from '@/hooks/master/useWorkflowAssignmentStrategies';
import { useWorkflowJurisdictionLevels } from '@/hooks/master/useWorkflowJurisdictionLevels';
import { useRoles } from '@/hooks/useAdminData';
import { useDataTableManager } from '@/hooks/useDataTableManager';
import { ReusableDataTable } from '@/components/DataTable/ReusableDataTable';
import { ReusableDataTableConfig, RowAction } from '@/components/DataTable/types';
import { exportToCSV, exportToExcel, exportToPDF, prepareModuleExportData } from '@/lib/export-utils';

type TransitionEntry = {
  id: string;
  actionCode: string;
  nextStep: number;
  nextRoleIds: number[];
};

type TransitionEntryDraft = Omit<TransitionEntry, 'id'>;

type WorkflowRowForm = {
  id?: number;
  step: number;
  formTypeId: number;
  roleId: number;
  jurisdictionLevelId?: number | null;
  assignmentStrategyId?: number | null;
  actionMasterIds: number[];
  assignmentRuleJsonText: string;
  transitionMapJsonText: string;
  slaHours: number;
  slaBreachRequiresReason: boolean;
  nextAllocationRoleId?: number | null;
  transitionEntries: TransitionEntry[];
  subformActionName: string;
  assignmentTargetRoleIds: number[];
  assignmentTargetUserIdsCsv: string;
};

type WorkflowGroup = {
  id: string;
  serviceId: string;
  serviceName: string;
  departmentId: number;
  departmentName: string;
  configVersion: number;
  status: string;
  count: number;
  rows: WorkflowConfig[];
};

const statusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const defaultTransition = JSON.stringify(
  {
    FORWARD: { next_step: 1, next_roles: [] },
    APPROVE: { next_step: 1, next_roles: [] },
    REJECT: { next_step: 0, next_roles: [] },
  },
  null,
  2
);

const SUB_RESPONSIBILITY_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Document Verification', value: 'DOCUMENT_VERIFICATION' },
  { label: 'Inspection', value: 'INSPECTION' },
  { label: 'Transaction / Audit', value: 'TRANSACTION' },
];

const createTransitionEntry = (overrides: Partial<Omit<TransitionEntry, 'id'>> = {}): TransitionEntry => ({
  id: `entry-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`,
  actionCode: '',
  nextStep: 0,
  nextRoleIds: [],
  ...overrides,
});

const generateTransitionMapFromEntries = (entries: TransitionEntry[]) => {
  const map: Record<string, { next_step?: number; next_roles?: number[] }> = {};
  entries.forEach((entry) => {
    const code = String(entry.actionCode || '').toUpperCase();
    if (!code) return;
    map[code] = {
      next_step: entry.nextStep || 0,
      next_roles: (entry.nextRoleIds || []).filter((role) => Number.isFinite(Number(role))),
    };
  });
  return JSON.stringify(map, null, 2);
};

const parseTransitionEntriesFromMap = (transitionMap?: Record<string, any>): TransitionEntry[] => {
  if (!transitionMap || typeof transitionMap !== 'object') return [];
  return Object.entries(transitionMap).map(([actionCode, payload]) =>
    createTransitionEntry({
      actionCode: String(actionCode || '').toUpperCase(),
      nextStep: Number(payload?.next_step || 0),
      nextRoleIds: Array.isArray(payload?.next_roles)
        ? payload.next_roles
            .map((item: any) => Number(item))
            .filter((value: number) => Number.isFinite(value))
        : [],
    })
  );
};

const createTransitionDraft = (step = 1): TransitionEntryDraft => {
  const normalizedStep = Number.isFinite(Number(step)) ? Number(step) : 1;
  return {
    actionCode: '',
    nextStep: Math.max(1, normalizedStep + 1),
    nextRoleIds: [],
  };
};

const buildAutoAssignmentRule = (params: {
  assignmentCode?: string;
  jurisdictionCode?: string;
  roleId: number;
  assignmentTargetRoleIds?: number[];
  assignmentTargetUserIdsCsv?: string;
}) => {
  const assignmentCode = String(params.assignmentCode || '').toUpperCase();
  if (!assignmentCode) return '';

  const baseRule: Record<string, any> = {
    jurisdiction_level: String(params.jurisdictionCode || '').toUpperCase() || null,
    role_id: Number(params.roleId || 0) || null,
  };
  const manualUserIds = String(params.assignmentTargetUserIdsCsv || '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (params.assignmentTargetRoleIds && params.assignmentTargetRoleIds.length) {
    baseRule.assignment_targets = params.assignmentTargetRoleIds.map((roleId) => ({
      role_id: Number(roleId),
    }));
  }
  if (manualUserIds.length) {
    baseRule.user_ids = manualUserIds;
  }

  if (assignmentCode === 'ROLE') {
    return JSON.stringify({ strategy: 'ROLE', ...baseRule }, null, 2);
  }
  if (assignmentCode === 'USER') {
    return JSON.stringify({ strategy: 'USER', ...baseRule, assignee_user_ids: [] }, null, 2);
  }
  if (assignmentCode === 'OFFICE') {
    return JSON.stringify({ strategy: 'OFFICE', ...baseRule, office_ids: [] }, null, 2);
  }
  if (assignmentCode === 'RULE') {
    return JSON.stringify({ strategy: 'RULE', ...baseRule, conditions: [] }, null, 2);
  }

  return JSON.stringify({ strategy: assignmentCode, ...baseRule }, null, 2);
};

const parseAssignmentTargetsFromRule = (ruleJsonText: string) => {
  try {
    const parsed = JSON.parse(ruleJsonText);
    const targets: Array<{ role_id?: number; roleId?: number }> = Array.isArray(parsed?.assignment_targets)
      ? parsed.assignment_targets
      : [];
    const roles = targets
      .map((target) => Number(target?.role_id ?? target?.roleId))
      .filter((value) => Number.isFinite(value) && value > 0);
    const userIds = Array.isArray(parsed?.user_ids)
      ? parsed.user_ids
          .map((item: any) => Number(item))
          .filter((value: number) => Number.isFinite(value) && value > 0)
      : [];
    return { assignmentTargetRoleIds: roles, assignmentTargetUserIdsCsv: userIds.join(',') };
  } catch {
    return { assignmentTargetRoleIds: [], assignmentTargetUserIdsCsv: '' };
  }
};

const parseAssignmentRuleObject = (ruleJsonText: string) => {
  const raw = String(ruleJsonText || '').trim();
  if (!raw) return {} as Record<string, any>;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const buildDefaultRow = (step = 1): WorkflowRowForm => ({
  step: step,
  formTypeId: 1,
  roleId: 0,
  jurisdictionLevelId: null,
  assignmentStrategyId: null,
  actionMasterIds: [],
  assignmentRuleJsonText: '',
  transitionMapJsonText: defaultTransition,
  slaHours: 0,
  slaBreachRequiresReason: true,
  nextAllocationRoleId: null,
  transitionEntries: [],
  subformActionName: '',
  assignmentTargetRoleIds: [],
  assignmentTargetUserIdsCsv: '',
});

const normalizeWorkflowFormType = (value?: string | null) => {
  const raw = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  const aliasMap: Record<string, string> = {
    AF: 'APPLICANT_FORM',
    APPLICANT_FORM: 'APPLICANT_FORM',
    PF: 'PROCESSING_FORM',
    PROCESSING_FORM: 'PROCESSING_FORM',
    PV: 'PROCESSING_FORM_VERIFIER_LEVEL',
    PFVL: 'PROCESSING_FORM_VERIFIER_LEVEL',
    PROCESSING_FORM_VERIFICATION_LEVEL: 'PROCESSING_FORM_VERIFIER_LEVEL',
    PROCESSING_FORM_VERIFIER_LEVEL: 'PROCESSING_FORM_VERIFIER_LEVEL',
    AL: 'APPROVER_LEVEL_PROCESSING_FORM',
    PFAL: 'APPROVER_LEVEL_PROCESSING_FORM',
    APPROVER_LEVEL_PROCESSING_FORM: 'APPROVER_LEVEL_PROCESSING_FORM',
  };
  return aliasMap[raw] || raw;
};

const getSuggestedStep = (existingRows: WorkflowRowForm[]) => {
  const maxStep = existingRows.reduce((acc, row) => Math.max(acc, Number(row.step) || 0), 0);
  return Math.max(1, maxStep + 1);
};

const toRowForm = (row: WorkflowConfig): WorkflowRowForm => {
  const assignmentRuleJsonText = row.assignmentRuleJson ? JSON.stringify(row.assignmentRuleJson, null, 2) : '';
  const parsedTargets = assignmentRuleJsonText
    ? parseAssignmentTargetsFromRule(assignmentRuleJsonText)
    : { assignmentTargetRoleIds: [], assignmentTargetUserIdsCsv: '' };
  return {
    id: row.id,
    step: row.step ?? 0,
    formTypeId: row.formTypeId ?? 1,
    roleId: row.roleId ?? row.currentRoleId ?? 0,
    jurisdictionLevelId: row.jurisdictionLevelId ?? null,
    assignmentStrategyId: row.assignmentStrategyId ?? null,
    actionMasterIds: Array.isArray(row.actionMasterIdsJson)
      ? row.actionMasterIdsJson.map((x) => Number(x)).filter((x) => Number.isFinite(x))
      : [],
    assignmentRuleJsonText,
    transitionMapJsonText: row.transitionMapJson
      ? JSON.stringify(row.transitionMapJson, null, 2)
      : defaultTransition,
    slaHours: row.slaHours ?? Number(row.timeInHours || 0),
    slaBreachRequiresReason:
      row.slaBreachRequiresReason ?? String(row.isDelayReasonRequired || 'N') === 'Y',
    nextAllocationRoleId: row.nextAllocationRoleId ?? row.nextRoleId ?? null,
    transitionEntries: parseTransitionEntriesFromMap(row.transitionMapJson),
    subformActionName: row.subformActionName || '',
    assignmentTargetRoleIds: parsedTargets.assignmentTargetRoleIds,
    assignmentTargetUserIdsCsv: parsedTargets.assignmentTargetUserIdsCsv,
  };
};

export const WorkflowConfigMaster = () => {
  const searchParams = useSearchParams();
  const serviceIdFromUrl = searchParams.get('serviceId') || '';

  const { data: workflowConfigs = [], isLoading } = useWorkflowConfigs(
    serviceIdFromUrl ? { serviceId: serviceIdFromUrl } : undefined
  );
  const { data: departments = [] } = useDepartments();
  const { data: services = [] } = useServices();
  const { data: formTypes = [] } = useFormTypes();
  const { data: roles = [] } = useRoles();
  const { data: workflowJurisdictionLevels = [] } = useWorkflowJurisdictionLevels({
    isActive: true,
  });
  const { data: workflowAssignmentStrategies = [] } = useWorkflowAssignmentStrategies({
    isActive: true,
  });
  const { data: workflowActions = [] } = useWorkflowActions({ isActive: true });

  const createMutation = useCreateWorkflowConfig();
  const updateMutation = useUpdateWorkflowConfig();
  const deleteMutation = useDeleteWorkflowConfig();

  const toastRef = useRef<Toast>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceIdFromUrl);
  const [configVersion, setConfigVersion] = useState<number>(1);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'INACTIVE' | 'ARCHIVED'>('DRAFT');
  const [rows, setRows] = useState<WorkflowRowForm[]>([]);
  const [rowEditor, setRowEditor] = useState<WorkflowRowForm>(buildDefaultRow());
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [transitionDraft, setTransitionDraft] = useState<TransitionEntryDraft>(() =>
    createTransitionDraft(1)
  );
  const [editingTransitionIndex, setEditingTransitionIndex] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isTransitionJsonTouched, setIsTransitionJsonTouched] = useState(false);
  const [isAssignmentRuleJsonTouched, setIsAssignmentRuleJsonTouched] = useState(false);

  useEffect(() => {
    if (serviceIdFromUrl) setSelectedServiceId(serviceIdFromUrl);
  }, [serviceIdFromUrl]);

  useEffect(() => {
    if (!selectedServiceId || selectedDepartmentId) return;
    const matched = (services as any[]).find(
      (s) => String(s.service_id) === String(selectedServiceId)
    );
    if (matched?.department_id) {
      setSelectedDepartmentId(Number(matched.department_id));
    }
  }, [selectedDepartmentId, selectedServiceId, services]);

  const roleOptions = useMemo(
    () =>
      roles.map((r: any) => ({
        label: `${r.name} (${r.id})`,
        value: Number(r.id),
      })),
    [roles]
  );

  const formTypeOptions = useMemo(
    () => (formTypes as any[]).map((f) => ({ label: f.name, value: Number(f.id) })),
    [formTypes]
  );
  const processingFormTypeId = useMemo(() => {
    const hit = (formTypes as any[]).find((f) => {
      const canonical = normalizeWorkflowFormType(String(f?.abbr || f?.name || ''));
      return canonical === 'PROCESSING_FORM';
    });
    return hit ? Number(hit.id) : null;
  }, [formTypes]);
  const verifierFormTypeId = useMemo(() => {
    const hit = (formTypes as any[]).find((f) => {
      const canonical = normalizeWorkflowFormType(String(f?.abbr || f?.name || ''));
      return canonical === 'PROCESSING_FORM_VERIFIER_LEVEL';
    });
    return hit ? Number(hit.id) : null;
  }, [formTypes]);
  const isParallelForwardToggleApplicable = useMemo(() => {
    const hasForwardTransition = (rowEditor.transitionEntries || []).some((entry) => {
      const code = String(entry?.actionCode || '').trim().toUpperCase();
      return code === 'F' || code === 'FORWARD';
    });
    return (
      Number(rowEditor.step) === 2 &&
      Number(rowEditor.roleId) === 7 &&
      hasForwardTransition
    );
  }, [rowEditor.roleId, rowEditor.step, rowEditor.transitionEntries]);
  const isParallelForwardRetainOwnershipEnabled = useMemo(() => {
    const rule = parseAssignmentRuleObject(rowEditor.assignmentRuleJsonText);
    return rule.allowParallelForwardWhileRetainOwnership === true;
  }, [rowEditor.assignmentRuleJsonText]);
  const isParallelForwardEnabled = useMemo(() => {
    const rule = parseAssignmentRuleObject(rowEditor.assignmentRuleJsonText);
    return rule.allowParallelForward === true;
  }, [rowEditor.assignmentRuleJsonText]);

  const departmentOptions = useMemo(
    () => departments.map((d: any) => ({ label: d.name, value: Number(d.id) })),
    [departments]
  );

  const serviceOptions = useMemo(() => {
    if (!selectedDepartmentId) return [];
    return (services as any[])
      .filter((s) => Number(s.department_id) === Number(selectedDepartmentId))
      .map((s) => ({
        label: `${s.service_name || s.name || s.service_id} (${s.service_id})`,
        value: String(s.service_id),
      }));
  }, [services, selectedDepartmentId]);

  const jurisdictionOptions = useMemo(
    () =>
      (workflowJurisdictionLevels as any[]).map((item) => ({
        label: `${item.name} (${item.code})`,
        value: Number(item.id),
        code: String(item.code || '').toUpperCase(),
      })),
    [workflowJurisdictionLevels]
  );

  const assignmentOptions = useMemo(
    () =>
      (workflowAssignmentStrategies as any[]).map((item) => ({
        label: `${item.name} (${item.code})`,
        value: Number(item.id),
        code: String(item.code || '').toUpperCase(),
      })),
    [workflowAssignmentStrategies]
  );

  const workflowActionOptions = useMemo(
    () =>
      (workflowActions as any[]).map((item) => ({
        label: `${item.name} (${item.code})`,
        value: Number(item.id),
        code: String(item.code || '').toUpperCase(),
      })),
    [workflowActions]
  );

  const workflowActionIdByCode = useMemo(() => {
    const map = new Map<string, number>();
    workflowActionOptions.forEach((option) => {
      const code = String(option.code || '').toUpperCase();
      if (code) map.set(code, Number(option.value));
    });
    return map;
  }, [workflowActionOptions]);

  const transitionActionOptions = useMemo(
    () =>
      workflowActionOptions.map((option) => ({
        label: option.label,
        value: String(option.code || '').toUpperCase(),
      })),
    [workflowActionOptions]
  );

  const jurisdictionCodeById = useMemo(() => {
    const map = new Map<number, string>();
    jurisdictionOptions.forEach((option) => {
      map.set(Number(option.value), String(option.code || '').toUpperCase());
    });
    return map;
  }, [jurisdictionOptions]);

  const assignmentCodeById = useMemo(() => {
    const map = new Map<number, string>();
    assignmentOptions.forEach((option) => {
      map.set(Number(option.value), String(option.code || '').toUpperCase());
    });
    return map;
  }, [assignmentOptions]);

  const grouped = useMemo<WorkflowGroup[]>(() => {
    const map = new Map<string, WorkflowGroup>();
    workflowConfigs.forEach((item) => {
      const key = `${item.serviceId}::${item.configVersion}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          serviceId: item.serviceId,
          serviceName: item.service?.service_name || item.serviceId,
          departmentId: item.departmentId,
          departmentName: item.department?.name || String(item.departmentId),
          configVersion: item.configVersion || 1,
          status: item.status || 'DRAFT',
          count: 0,
          rows: [],
        });
      }
      const group = map.get(key)!;
      group.rows.push(item);
      group.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.serviceId === b.serviceId) return b.configVersion - a.configVersion;
      return a.serviceId.localeCompare(b.serviceId);
    });
  }, [workflowConfigs]);

  const initialData = useMemo(() => grouped, [grouped]);
  const {
    data: tableData,
    filteredData,
    selectedRows,
    globalFilter,
    filters,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
  } = useDataTableManager<WorkflowGroup>(initialData);

  const tableConfig: ReusableDataTableConfig<WorkflowGroup> = useMemo(
    () => ({
      columns: [
        {
          field: 'serviceName',
          header: 'Service',
          width: '28%',
          filterType: 'text',
          body: (row) => (
            <div>
              <div className="fw-medium">{row.serviceName}</div>
              <div className="text-muted small">{row.serviceId}</div>
            </div>
          ),
        },
        {
          field: 'configVersion',
          header: 'Version',
          width: '10%',
          filterType: 'number',
          body: (row) => (
            <span style={{ color: '#6c757d', fontFamily: 'monospace', fontWeight: 500 }}>
              v{row.configVersion}
            </span>
          ),
        },
        {
          field: 'status',
          header: 'Status',
          width: '12%',
          filterType: 'select',
          filterOptions: statusOptions.map((x) => ({ label: x.label, value: x.value })),
          body: (row) => {
            const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
              PUBLISHED: { color: '#28a745', icon: <CheckCircle size={14} /> },
              INACTIVE: { color: '#ffc107', icon: <AlertCircle size={14} /> },
              ARCHIVED: { color: '#6c757d', icon: <Archive size={14} /> },
              DRAFT: { color: '#0d6efd', icon: <CircleDot size={14} /> },
            };
            const config = statusConfig[row.status] || statusConfig.DRAFT;
            return (
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span style={{ color: config.color, fontWeight: 500 }}>{row.status}</span>
              </div>
            );
          },
        },
        {
          field: 'departmentName',
          header: 'Department',
          width: '24%',
          filterType: 'text',
        },
        {
          field: 'count',
          header: 'Steps',
          width: '8%',
          filterType: 'number',
        },
      ],
      dataKey: 'id',
      rows: 10,
      rowsPerPageOptions: [5, 10, 25, 50],
      globalFilterFields: ['serviceName', 'serviceId', 'departmentName', 'status'],
      selectable: true,
      selectionMode: 'multiple',
      paginator: true,
      stripedRows: true,
      showGridlines: true,
      emptyMessage: 'No workflow configuration found.',
    }),
    []
  );

  const workflowExportConfig = useMemo(
    () => ({
      moduleName: 'workflow-configurations',
      title: 'Workflow Configurations',
      columns: [
        { header: 'Service ID', field: 'serviceId' },
        { header: 'Service Name', field: 'serviceName' },
        { header: 'Version', field: 'configVersion' },
        { header: 'Status', field: 'status' },
        { header: 'Department', field: 'departmentName' },
        { header: 'Steps', field: 'count' },
      ],
    }),
    []
  );

  const handleExportCSV = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, workflowExportConfig);
      exportToCSV(exportData);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `CSV exported (${filteredData.length})`,
      });
    } finally {
      setExporting(false);
    }
  }, [filteredData, workflowExportConfig]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, workflowExportConfig);
      await exportToExcel(exportData, workflowExportConfig);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Excel exported (${filteredData.length})`,
      });
    } finally {
      setExporting(false);
    }
  }, [filteredData, workflowExportConfig]);

  const handleExportPDF = useCallback(() => {
    setExporting(true);
    try {
      if (filteredData.length === 0) {
        toastRef.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No data to export.' });
        return;
      }
      const exportData = prepareModuleExportData(filteredData, workflowExportConfig);
      exportToPDF(exportData, workflowExportConfig);
      toastRef.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `PDF exported (${filteredData.length})`,
      });
    } finally {
      setExporting(false);
    }
  }, [filteredData, workflowExportConfig]);

  const summary = useMemo(() => {
    const total = grouped.length;
    const draft = grouped.filter((g) => String(g.status).toUpperCase() === 'DRAFT').length;
    const published = grouped.filter((g) => String(g.status).toUpperCase() === 'PUBLISHED').length;
    const totalSteps = grouped.reduce((acc, group) => acc + Number(group.count || 0), 0);
    return { total, draft, published, totalSteps };
  }, [grouped]);

  const resetEditor = useCallback(() => {
    setRows([]);
    setDeletedIds([]);
    setEditingRowIndex(null);
    setRowEditor(buildDefaultRow());
    setTransitionDraft(createTransitionDraft(1));
    setEditingTransitionIndex(null);
    setIsTransitionJsonTouched(false);
    setIsAssignmentRuleJsonTouched(false);
  }, []);

  const openNew = useCallback(() => {
    setConfigVersion(1);
    setStatus('DRAFT');
    resetEditor();
    setDialogOpen(true);
  }, [resetEditor]);

  const openEdit = useCallback((group: WorkflowGroup) => {
    setSelectedDepartmentId(group.departmentId);
    setSelectedServiceId(group.serviceId);
    setConfigVersion(group.configVersion);
    setStatus((group.status as any) || 'DRAFT');
    setRows(
      group.rows
        .sort((a, b) => a.step - b.step)
        .map((item) => {
          const row = toRowForm(item);
          if (!row.jurisdictionLevelId && item.jurisdictionLevel) {
            const matched = jurisdictionOptions.find(
              (opt) => String(opt.code || '').toUpperCase() === String(item.jurisdictionLevel || '').toUpperCase()
            );
            row.jurisdictionLevelId = matched?.value ?? null;
          }
          if (!row.assignmentStrategyId && item.assignmentStrategy) {
            const matched = assignmentOptions.find(
              (opt) =>
                String(opt.code || '').toUpperCase() === String(item.assignmentStrategy || '').toUpperCase()
            );
            row.assignmentStrategyId = matched?.value ?? null;
          }
          if ((!row.actionMasterIds || row.actionMasterIds.length === 0) && Array.isArray(item.actionAllowedJson)) {
            row.actionMasterIds = workflowActionOptions
              .filter((opt) =>
                (item.actionAllowedJson as string[])
                  .map((x) => String(x || '').toUpperCase())
                  .includes(String(opt.code || '').toUpperCase())
              )
              .map((opt) => Number(opt.value));
          }
          return row;
        })
    );
    setDeletedIds([]);
    setEditingRowIndex(null);
    setRowEditor(buildDefaultRow());
    setTransitionDraft(createTransitionDraft(1));
    setEditingTransitionIndex(null);
    setIsTransitionJsonTouched(false);
    setIsAssignmentRuleJsonTouched(false);
    setDialogOpen(true);
  }, [assignmentOptions, jurisdictionOptions, workflowActionOptions]);

  const handleDeleteGroup = useCallback(
    async (group: WorkflowGroup) => {
      if (!confirm(`Delete all workflow rows for service ${group.serviceId} version ${group.configVersion}?`))
        return;
      try {
        for (const row of group.rows) {
          await deleteMutation.mutateAsync(row.id);
        }
        toastRef.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Workflow group deleted' });
      } catch (error: any) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error?.response?.data?.message || 'Delete failed',
        });
      }
    },
    [deleteMutation]
  );

  const rowActions: RowAction<WorkflowGroup>[] = useMemo(
    () => [
      {
        icon: 'pi pi-pencil',
        label: 'Edit',
        severity: 'info',
        onClick: openEdit,
        tooltip: 'Edit Workflow',
      },
      {
        icon: 'pi pi-trash',
        label: 'Delete',
        severity: 'error',
        onClick: handleDeleteGroup,
        tooltip: 'Delete Workflow',
      },
    ],
    [handleDeleteGroup, openEdit]
  );

  const leftToolbarTemplate = useCallback(
    () => <Button label="Add Workflow" icon="pi pi-plus" onClick={openNew} severity="success" />,
    [openNew]
  );

  const rightToolbarTemplate = useCallback(
    () => (
      <div className="d-flex gap-2">
        <Button
          label="Clear Filters"
          icon="pi pi-filter-slash"
          severity="secondary"
          outlined
          onClick={() => {
            clearFilters();
            handleGlobalFilterChange('');
            handleFiltersChange({});
          }}
        />
        <Button
          label="CSV"
          icon="pi pi-download"
          severity="info"
          rounded
          onClick={handleExportCSV}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="Excel"
          icon="pi pi-file-excel"
          severity="success"
          rounded
          onClick={handleExportExcel}
          loading={exporting}
          disabled={isLoading}
        />
        <Button
          label="PDF"
          icon="pi pi-file-pdf"
          severity="warning"
          rounded
          onClick={handleExportPDF}
          loading={exporting}
          disabled={isLoading}
        />
      </div>
    ),
    [
      clearFilters,
      exporting,
      handleExportCSV,
      handleExportExcel,
      handleExportPDF,
      handleFiltersChange,
      handleGlobalFilterChange,
      isLoading,
    ]
  );

  const handleAddOrUpdateRow = useCallback(() => {
    try {
      if (rowEditor.assignmentRuleJsonText.trim()) {
        JSON.parse(rowEditor.assignmentRuleJsonText);
      }
      JSON.parse(rowEditor.transitionMapJsonText);
    } catch {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'Assignment Rule / Transition Map is not valid JSON',
      });
      return;
    }

    const stepNumber = Number(rowEditor.step);
    if (!stepNumber || stepNumber < 1) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Invalid Step',
        detail: 'Step number must be a positive integer',
      });
      return;
    }

    const duplicateStep = rows.some(
      (row, index) => index !== editingRowIndex && Number(row.step) === stepNumber
    );
    if (duplicateStep) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Duplicate Step',
        detail: `Step ${stepNumber} already exists`,
      });
      return;
    }

    if (!rowEditor.transitionEntries.length) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Missing Actions',
        detail: 'Add at least one transition action for this step',
      });
      return;
    }

    const updatedRows =
      editingRowIndex === null
        ? [...rows, rowEditor]
        : rows.map((row, index) => (index === editingRowIndex ? rowEditor : row));
    setRows(updatedRows);
    setEditingRowIndex(null);
    const nextStep = getSuggestedStep(updatedRows);
    setRowEditor(buildDefaultRow(nextStep));
    setTransitionDraft(createTransitionDraft(nextStep));
    setEditingTransitionIndex(null);
    setIsTransitionJsonTouched(false);
    setIsAssignmentRuleJsonTouched(false);
  }, [
    editingRowIndex,
    rowEditor,
    rows,
  ]);

  const applyTransitionEntries = useCallback(
    (entries: TransitionEntry[]) => {
      const normalized = entries.map((entry) => ({
        ...entry,
        actionCode: String(entry.actionCode || '').toUpperCase(),
      }));
      const actionIds = Array.from(
        new Set(
          normalized
            .map((entry) => workflowActionIdByCode.get(entry.actionCode))
            .filter((id): id is number => Number.isFinite(id))
        )
      );
      setRowEditor((prev) => {
        const next = { ...prev, transitionEntries: normalized, actionMasterIds: actionIds };
        if (isTransitionJsonTouched) return next;
        const generated = generateTransitionMapFromEntries(normalized);
        if (next.transitionMapJsonText === generated) return next;
        return { ...next, transitionMapJsonText: generated };
      });
    },
    [isTransitionJsonTouched, workflowActionIdByCode]
  );

  const handleTransitionEntrySubmit = useCallback(() => {
    const actionCode = String(transitionDraft.actionCode || '').trim().toUpperCase();
    if (!actionCode) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Select Action',
        detail: 'Choose an action before adding it to transitions.',
      });
      return;
    }
    const nextStep = Number(transitionDraft.nextStep);
    if (!Number.isFinite(nextStep) || nextStep < 1) {
      toastRef.current?.show({
        severity: 'warn',
        summary: 'Invalid Step',
        detail: 'Next step must be a positive number.',
      });
      return;
    }

    const entryPayload: TransitionEntry = createTransitionEntry({
      actionCode,
      nextStep,
      nextRoleIds: transitionDraft.nextRoleIds || [],
    });

    const updatedEntries = [...rowEditor.transitionEntries];
    if (editingTransitionIndex !== null && updatedEntries[editingTransitionIndex]) {
      updatedEntries[editingTransitionIndex] = {
        ...updatedEntries[editingTransitionIndex],
        actionCode,
        nextStep,
        nextRoleIds: transitionDraft.nextRoleIds || [],
      };
    } else {
      const existingIndex = updatedEntries.findIndex((entry) => entry.actionCode === actionCode);
      if (existingIndex >= 0) {
        updatedEntries[existingIndex] = {
          ...updatedEntries[existingIndex],
          nextStep,
          nextRoleIds: transitionDraft.nextRoleIds || [],
        };
      } else {
        updatedEntries.push(entryPayload);
      }
    }

    applyTransitionEntries(updatedEntries);
    setTransitionDraft(createTransitionDraft(rowEditor.step));
    setEditingTransitionIndex(null);
  }, [
    applyTransitionEntries,
    editingTransitionIndex,
    rowEditor.step,
    rowEditor.transitionEntries,
    transitionDraft,
  ]);

  const handleEditTransitionEntry = useCallback(
    (index: number) => {
      const entry = rowEditor.transitionEntries[index];
      if (!entry) return;
      setEditingTransitionIndex(index);
      setTransitionDraft({
        actionCode: entry.actionCode,
        nextStep: entry.nextStep,
        nextRoleIds: entry.nextRoleIds || [],
      });
    },
    [rowEditor.transitionEntries]
  );

  const handleRemoveTransitionEntry = useCallback(
    (index: number) => {
      const updatedEntries = rowEditor.transitionEntries.filter((_, idx) => idx !== index);
      applyTransitionEntries(updatedEntries);
      if (editingTransitionIndex === index) {
        setEditingTransitionIndex(null);
        setTransitionDraft(createTransitionDraft(rowEditor.step));
      }
    },
    [applyTransitionEntries, editingTransitionIndex, rowEditor.step, rowEditor.transitionEntries]
  );

  useEffect(() => {
    if (editingTransitionIndex !== null) return;
    setTransitionDraft((prev) => ({
      ...prev,
      nextStep: Math.max(1, Number(rowEditor.step || 1) + 1),
    }));
  }, [editingTransitionIndex, rowEditor.step]);

  useEffect(() => {
    if (!verifierFormTypeId || !processingFormTypeId) return;
    // BUSINESS RULE: step 2 nodal role (7) must use verifier-level processing form.
    if (
      Number(rowEditor.step) === 2 &&
      Number(rowEditor.roleId) === 7 &&
      Number(rowEditor.formTypeId) === Number(processingFormTypeId)
    ) {
      setRowEditor((prev) => ({ ...prev, formTypeId: Number(verifierFormTypeId) }));
    }
  }, [
    processingFormTypeId,
    rowEditor.formTypeId,
    rowEditor.roleId,
    rowEditor.step,
    verifierFormTypeId,
  ]);

  useEffect(() => {
    if (isAssignmentRuleJsonTouched) return;
    const assignmentCode = assignmentCodeById.get(Number(rowEditor.assignmentStrategyId || 0));
    const jurisdictionCode = jurisdictionCodeById.get(Number(rowEditor.jurisdictionLevelId || 0));
    const generated = buildAutoAssignmentRule({
      assignmentCode,
      jurisdictionCode,
      roleId: rowEditor.roleId,
      assignmentTargetRoleIds: rowEditor.assignmentTargetRoleIds,
      assignmentTargetUserIdsCsv: rowEditor.assignmentTargetUserIdsCsv,
    });
    setRowEditor((prev) => {
      if (prev.assignmentRuleJsonText === generated) return prev;
      return { ...prev, assignmentRuleJsonText: generated };
    });
  }, [
    assignmentCodeById,
    isAssignmentRuleJsonTouched,
    jurisdictionCodeById,
    rowEditor.assignmentStrategyId,
    rowEditor.jurisdictionLevelId,
    rowEditor.roleId,
    rowEditor.assignmentTargetRoleIds,
    rowEditor.assignmentTargetUserIdsCsv,
  ]);

  const handleSave = useCallback(async () => {
    if (!selectedDepartmentId || !selectedServiceId) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Missing Data',
        detail: 'Department and Service are required',
      });
      return;
    }
    if (!rows.length) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Missing Rows',
        detail: 'Add at least one step',
      });
      return;
    }

    setSaving(true);
    try {
      for (const id of deletedIds) {
        await deleteMutation.mutateAsync(id);
      }

      for (const row of rows) {
        if (!row.jurisdictionLevelId || !row.assignmentStrategyId) {
          throw new Error('Jurisdiction and Assignment Strategy are required for each step');
        }
        if (!Array.isArray(row.actionMasterIds) || row.actionMasterIds.length === 0) {
          throw new Error('At least one action is required for each step');
        }
        if (!row.transitionEntries.length) {
          throw new Error('Transition entries are required for each step');
        }

        const assignmentRuleJson = row.assignmentRuleJsonText.trim()
          ? JSON.parse(row.assignmentRuleJsonText)
          : null;
        const transitionMapJson = JSON.parse(row.transitionMapJsonText || '{}');
        const selectedActionOptions = workflowActionOptions.filter((option) =>
          row.actionMasterIds.includes(Number(option.value))
        );
        const actionAllowedJson = selectedActionOptions.map((option) => option.code);
        const selectedJurisdiction = jurisdictionOptions.find(
          (option) => Number(option.value) === Number(row.jurisdictionLevelId)
        );
        const effectiveFormTypeId =
          verifierFormTypeId &&
          processingFormTypeId &&
          Number(row.step) === 2 &&
          Number(row.roleId) === 7 &&
          Number(row.formTypeId) === Number(processingFormTypeId)
            ? Number(verifierFormTypeId)
            : Number(row.formTypeId || 1);

        const payload: Partial<WorkflowConfig> = {
          step: Number(row.step),
          departmentId: Number(selectedDepartmentId),
          serviceId: String(selectedServiceId),
          configVersion: Number(configVersion),
          status: status as any,
          roleId: Number(row.roleId),
          jurisdictionLevelId: row.jurisdictionLevelId ? Number(row.jurisdictionLevelId) : undefined,
          assignmentStrategyId: row.assignmentStrategyId ? Number(row.assignmentStrategyId) : undefined,
          actionMasterIds: row.actionMasterIds,
          assignmentRuleJson,
          actionAllowedJson,
          transitionMapJson,
          slaHours: Number(row.slaHours || 0),
          slaBreachRequiresReason: !!row.slaBreachRequiresReason,
          nextAllocationRoleId: row.nextAllocationRoleId || null,
          formTypeId: effectiveFormTypeId,
          currentRoleId: Number(row.roleId || 0),
          nextRoleId: Number(row.nextAllocationRoleId || 0),
          forwardRoleId: Number(row.nextAllocationRoleId || 0),
          revertRoleId: 0,
          approverId: 0,
          processingLevel: selectedJurisdiction?.code === 'STATE' ? 'State' : 'District',
          timeInHours: String(row.slaHours || 0),
          isDelayReasonRequired: row.slaBreachRequiresReason ? 'Y' : 'N',
          canRevertToInvestor:
            actionAllowedJson.includes('RBI') || actionAllowedJson.includes('REVERT_TO_INVESTOR')
              ? 'Y'
              : 'N',
          canVerifyDocument: 'N',
          isOwnDepartment: 'N',
          permissableTabFormId: '',
          documentShowLast: 'N',
          processAnytime: 'N',
          showLiceneceList: '0',
          showFieldEditableOrNot: '0',
          formServiceJs: '',
          formActionController: '',
          subformActionName: row.subformActionName || '',
        };

        if (row.id) {
          await updateMutation.mutateAsync({ id: row.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload);
        }
      }

      toastRef.current?.show({
        severity: 'success',
        summary: 'Saved',
        detail: 'Workflow configuration saved',
      });
      setDialogOpen(false);
      resetEditor();
    } catch (error: any) {
      toastRef.current?.show({
        severity: 'error',
        summary: 'Save Failed',
        detail: error?.response?.data?.message || 'Could not save workflow configuration',
      });
    } finally {
      setSaving(false);
    }
  }, [
    configVersion,
    createMutation,
    deleteMutation,
    deletedIds,
    resetEditor,
    rows,
    selectedDepartmentId,
    selectedServiceId,
    status,
    updateMutation,
    jurisdictionOptions,
    workflowActionOptions,
    processingFormTypeId,
    verifierFormTypeId,
  ]);

  const handleToggleParallelForwardRetainOwnership = useCallback(
    (checked: boolean) => {
      setIsAssignmentRuleJsonTouched(true);
      setRowEditor((prev) => {
        const nextRule = parseAssignmentRuleObject(prev.assignmentRuleJsonText);
        if (checked) {
          nextRule.allowParallelForwardWhileRetainOwnership = true;
        } else {
          delete nextRule.allowParallelForwardWhileRetainOwnership;
        }
        const hasAnyKeys = Object.keys(nextRule).length > 0;
        return {
          ...prev,
          assignmentRuleJsonText: hasAnyKeys
            ? JSON.stringify(nextRule, null, 2)
            : '',
        };
      });
    },
    [],
  );
  const handleToggleParallelForwardEnabled = useCallback(
    (checked: boolean) => {
      setIsAssignmentRuleJsonTouched(true);
      setRowEditor((prev) => {
        const nextRule = parseAssignmentRuleObject(prev.assignmentRuleJsonText);
        if (checked) {
          nextRule.allowParallelForward = true;
        } else {
          delete nextRule.allowParallelForward;
          delete nextRule.allowParallelForwardWhileRetainOwnership;
        }
        const hasAnyKeys = Object.keys(nextRule).length > 0;
        return {
          ...prev,
          assignmentRuleJsonText: hasAnyKeys
            ? JSON.stringify(nextRule, null, 2)
            : '',
        };
      });
    },
    [],
  );

  return (
    <div className="p-4">
      <Toast ref={toastRef} />
      <div className="mb-4 p-3 p-md-4 bg-white border rounded-3 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h1 className="h3 mb-1">Workflow Configurator</h1>
            <p className="text-muted mb-0">
              Configure service-wise workflow versions, step actions, and officer routing.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {serviceIdFromUrl && (
              <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-2">
                Service: {serviceIdFromUrl}
              </span>
            )}
          </div>
        </div>

        <div className="row g-2 mt-3">
          <div className="col-6 col-md-3">
            <div className="border rounded-3 p-2 bg-light-subtle">
              <div className="text-muted small">Workflow Versions</div>
              <div className="fw-semibold fs-5">{summary.total}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded-3 p-2 bg-light-subtle">
              <div className="text-muted small">Draft</div>
              <div className="fw-semibold fs-5 text-info-emphasis">{summary.draft}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded-3 p-2 bg-light-subtle">
              <div className="text-muted small">Published</div>
              <div className="fw-semibold fs-5 text-success-emphasis">{summary.published}</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="border rounded-3 p-2 bg-light-subtle">
              <div className="text-muted small">Total Steps</div>
              <div className="fw-semibold fs-5">{summary.totalSteps}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <Toolbar left={leftToolbarTemplate} right={rightToolbarTemplate} />
      </div>

      <div className="border rounded-3 shadow-sm bg-white p-2">
        <ReusableDataTable<WorkflowGroup>
          data={tableData}
          config={tableConfig}
          loading={isLoading}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          onFiltersChange={handleFiltersChange}
          rowActions={rowActions}
          externalFilters={filters}
          externalGlobalFilter={globalFilter}
        />
      </div>

      <Dialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        header="Workflow Configurator"
        modal
        style={{ width: '90vw' }}
        breakpoints={{ '960px': '98vw' }}
      >
        <div className="row g-3 p-2 border rounded bg-light-subtle">
          <div className="col-md-3">
            <label className="form-label">Department *</label>
            <Dropdown
              value={selectedDepartmentId || undefined}
              options={departmentOptions}
              onChange={(e) => {
                setSelectedDepartmentId(e.value || 0);
                if (!serviceIdFromUrl) setSelectedServiceId('');
              }}
              className="w-100 border"
              placeholder="Select Department"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Service *</label>
            <Dropdown
              value={selectedServiceId || undefined}
              options={serviceOptions}
              onChange={(e) => setSelectedServiceId(e.value || '')}
              className="w-100 border"
              placeholder="Select Service"
              disabled={!selectedDepartmentId}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Version</label>
            <InputNumber
              value={configVersion}
              onValueChange={(e) => setConfigVersion(Number(e.value || 1))}
              className="w-100"
              inputClassName="w-100 border rounded p-2"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Status</label>
            <Dropdown
              value={status}
              options={statusOptions}
              onChange={(e) => setStatus(e.value)}
              className="w-100 border"
            />
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
          <h6 className="mb-0">Workflow Step Editor</h6>
          <span className="text-muted small">Define one step at a time, then add it to the grid</span>
        </div>
        <div className="row g-3">
          <div className="col-md-2">
            <label className="form-label">Step</label>
            <InputNumber
              value={rowEditor.step}
              onValueChange={(e) =>
                setRowEditor((prev) => ({ ...prev, step: Number(e.value || 0) }))
              }
              className="w-100"
              inputClassName="w-100 border rounded p-2"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Form Type</label>
            <Dropdown
              value={rowEditor.formTypeId}
              options={formTypeOptions}
              onChange={(e) =>
                setRowEditor((prev) => {
                  const selected = Number(e.value || 1);
                  if (
                    verifierFormTypeId &&
                    processingFormTypeId &&
                    Number(prev.step) === 2 &&
                    Number(prev.roleId) === 7 &&
                    selected === Number(processingFormTypeId)
                  ) {
                    return { ...prev, formTypeId: Number(verifierFormTypeId) };
                  }
                  return { ...prev, formTypeId: selected };
                })
              }
              className="w-100 border"
              filter
              filterBy="label"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Current Role</label>
            <Dropdown
              value={rowEditor.roleId}
              options={roleOptions}
              filter
              filterBy="label"
              showClear
              onChange={(e) =>
                setRowEditor((prev) => ({ ...prev, roleId: Number(e.value || 0) }))
              }
              className="w-100 border"
              placeholder="Search Role"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Jurisdiction</label>
            <Dropdown
              value={rowEditor.jurisdictionLevelId || undefined}
              options={jurisdictionOptions}
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  jurisdictionLevelId:
                    e.value !== undefined && e.value !== null ? Number(e.value) : null,
                }))
              }
              className="w-100 border"
              placeholder="Select Jurisdiction"
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Assignment</label>
            <Dropdown
              value={rowEditor.assignmentStrategyId || undefined}
              options={assignmentOptions}
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  assignmentStrategyId:
                    e.value !== undefined && e.value !== null ? Number(e.value) : null,
                }))
              }
              className="w-100 border"
              placeholder="Select Assignment"
            />
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Sub-Responsibility</label>
            <Dropdown
              value={rowEditor.subformActionName || ''}
              options={SUB_RESPONSIBILITY_OPTIONS}
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  subformActionName: String(e.value || ''),
                }))
              }
              className="w-100 border"
              placeholder="Select Sub-Responsibility"
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">SLA (hours)</label>
            <InputNumber
              value={rowEditor.slaHours}
              onValueChange={(e) =>
                setRowEditor((prev) => ({ ...prev, slaHours: Number(e.value || 0) }))
              }
              className="w-100"
              inputClassName="w-100 border rounded p-2"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Next Allocation Role</label>
            <Dropdown
              value={rowEditor.nextAllocationRoleId || undefined}
              options={roleOptions}
              filter
              filterBy="label"
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  nextAllocationRoleId:
                    e.value !== undefined && e.value !== null ? Number(e.value) : null,
                }))
              }
              className="w-100 border"
              showClear
              placeholder="Search Next Allocation Role"
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <div className="form-check">
              <input
                id="sla-reason-required"
                className="form-check-input"
                type="checkbox"
                checked={rowEditor.slaBreachRequiresReason}
                onChange={(e) =>
                  setRowEditor((prev) => ({
                    ...prev,
                    slaBreachRequiresReason: e.target.checked,
                  }))
                }
              />
              <label htmlFor="sla-reason-required" className="form-check-label">
                Require Delay Reason on SLA Breach
              </label>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Assignment Target Roles</label>
            <MultiSelect
              value={rowEditor.assignmentTargetRoleIds}
              options={roleOptions}
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  assignmentTargetRoleIds: Array.isArray(e.value)
                    ? e.value
                        .map((id: any) => Number(id))
                        .filter((value: number) => Number.isFinite(value) && value > 0)
                    : [],
                }))
              }
              display="chip"
              filter
              filterBy="label"
              className="w-100 border"
              placeholder="Select roles to assign"
            />
            <small className="text-muted">Forward actions will target these roles in addition to the next step.</small>
          </div>
          <div className="col-md-4">
            <label className="form-label">Manual User IDs (CSV)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 1001,1005"
              value={rowEditor.assignmentTargetUserIdsCsv}
              onChange={(e) =>
                setRowEditor((prev) => ({
                  ...prev,
                  assignmentTargetUserIdsCsv: e.target.value,
                }))
              }
            />
            <small className="text-muted">Optional: comma-separated user IDs for direct assignment.</small>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="d-flex flex-column gap-2">
              <div className="form-check">
                <input
                  id="parallel-forward-enabled"
                  className="form-check-input"
                  type="checkbox"
                  checked={isParallelForwardEnabled}
                  disabled={!isParallelForwardToggleApplicable}
                  onChange={(e) => handleToggleParallelForwardEnabled(e.target.checked)}
                />
                <label htmlFor="parallel-forward-enabled" className="form-check-label">
                  Enable Parallel Forward (F)
                </label>
              </div>
              <div className="form-check">
                <input
                  id="parallel-forward-retain-owner"
                  className="form-check-input"
                  type="checkbox"
                  checked={isParallelForwardRetainOwnershipEnabled}
                  disabled={!isParallelForwardToggleApplicable || !isParallelForwardEnabled}
                  onChange={(e) =>
                    handleToggleParallelForwardRetainOwnership(e.target.checked)
                  }
                />
                <label htmlFor="parallel-forward-retain-owner" className="form-check-label">
                  Retain Role Ownership On Parallel Forward (F)
                </label>
                <div className="small text-muted">
                  Applies only to Step 2 / Role 7 with Forward action configured.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12">
            <div className="border rounded p-3 bg-white">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Transition Action</label>
                  <Dropdown
                    value={transitionDraft.actionCode || undefined}
                    options={transitionActionOptions}
                    onChange={(e) =>
                      setTransitionDraft((prev) => ({
                        ...prev,
                        actionCode: String(e.value || '').toUpperCase(),
                      }))
                    }
                    className="w-100 border"
                    placeholder="Select Action"
                    filter
                    filterBy="label"
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Next Step</label>
                  <InputNumber
                    value={transitionDraft.nextStep}
                    onValueChange={(e) =>
                      setTransitionDraft((prev) => ({
                        ...prev,
                        nextStep: Number(e.value || prev.nextStep || 0),
                      }))
                    }
                    className="w-100"
                    inputClassName="w-100 border rounded p-2"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Next Roles</label>
                  <MultiSelect
                    value={transitionDraft.nextRoleIds}
                    options={roleOptions}
                    onChange={(e) =>
                      setTransitionDraft((prev) => ({
                        ...prev,
                        nextRoleIds: Array.isArray(e.value)
                          ? e.value
                              .map((id: any) => Number(id))
                              .filter((value: number) => Number.isFinite(value))
                          : [],
                      }))
                    }
                    display="chip"
                    className="w-100 border"
                    placeholder="Select roles"
                  />
                </div>
                <div className="col-md-3 d-flex flex-wrap gap-2">
                  <Button
                    label={editingTransitionIndex === null ? 'Add Action' : 'Update Action'}
                    icon={editingTransitionIndex === null ? 'pi pi-plus' : 'pi pi-check'}
                    onClick={handleTransitionEntrySubmit}
                    className="flex-grow-1"
                    severity="success"
                  />
                  {editingTransitionIndex !== null && (
                    <Button
                      label="Cancel"
                      icon="pi pi-times"
                      onClick={() => {
                        setEditingTransitionIndex(null);
                        setTransitionDraft(createTransitionDraft(rowEditor.step));
                      }}
                      className="flex-grow-1"
                      severity="secondary"
                    />
                  )}
                </div>
              </div>
              <div className="table-responsive mt-3">
                <table className="table table-sm table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Action</th>
                      <th>Next Step</th>
                      <th>Next Roles</th>
                      <th style={{ width: 140 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowEditor.transitionEntries.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-3">
                          No transition entries added yet.
                        </td>
                      </tr>
                    ) : (
                      rowEditor.transitionEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td>{entry.actionCode || '—'}</td>
                          <td>{entry.nextStep || '—'}</td>
                          <td>
                            {(entry.nextRoleIds || [])
                              .map((roleId) => roleOptions.find((opt) => opt.value === roleId)?.label || roleId)
                              .join(', ') || '—'}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                icon="pi pi-pencil"
                                text
                                onClick={() => handleEditTransitionEntry(index)}
                              />
                              <Button
                                icon="pi pi-trash"
                                text
                                severity="danger"
                                onClick={() => handleRemoveTransitionEntry(index)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Transition Map JSON (auto-generated, editable)</label>
            <InputTextarea
              rows={7}
              value={rowEditor.transitionMapJsonText}
              onChange={(e) => {
                setIsTransitionJsonTouched(true);
                setRowEditor((prev) => ({
                  ...prev,
                  transitionMapJsonText: e.target.value,
                }));
              }}
              className="w-100 border"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Assignment Rule JSON (auto-generated, optional, editable)</label>
            <InputTextarea
              rows={7}
              value={rowEditor.assignmentRuleJsonText}
              onChange={(e) => {
                setIsAssignmentRuleJsonTouched(true);
                setRowEditor((prev) => ({
                  ...prev,
                  assignmentRuleJsonText: e.target.value,
                }));
              }}
              className="w-100 border"
            />
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <Button
            label={editingRowIndex === null ? 'Add Step' : 'Update Step'}
            icon="pi pi-plus"
            onClick={handleAddOrUpdateRow}
            severity={(editingRowIndex === null ? 'primary' : 'warning') as any}
          />
        </div>

        <div className="table-responsive border rounded mt-3 bg-white">
          <table className="table table-sm table-bordered table-hover align-middle mb-0">
            <thead className="table-light">
            <tr>
              <th>Step</th>
              <th>Role</th>
              <th>Form Type</th>
              <th>Sub-Responsibility</th>
              <th>Jurisdiction</th>
              <th>Actions</th>
              <th>Assignment Targets</th>
              <th>SLA</th>
              <th style={{ width: 140 }}>Action</th>
            </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No steps added yet.
                  </td>
                </tr>
              )}
              {rows.map((row, index) => (
                <tr key={row.id ?? `new-${index}`}>
                  <td>{row.step}</td>
                  <td>{roleOptions.find((r) => r.value === row.roleId)?.label || row.roleId}</td>
                  <td>{formTypeOptions.find((f) => f.value === row.formTypeId)?.label || row.formTypeId}</td>
                  <td>{row.subformActionName || '—'}</td>
                  <td>
                    {jurisdictionOptions.find((j) => j.value === row.jurisdictionLevelId)?.label ||
                      row.jurisdictionLevelId ||
                      '-'}
                  </td>
                  <td className="text-wrap">
                    {workflowActionOptions
                      .filter((option) => row.actionMasterIds.includes(Number(option.value)))
                      .map((option) => option.code)
                      .join(', ') || '-'}
                  </td>
                  <td>
                    {[
                      row.assignmentTargetRoleIds.length
                        ? row.assignmentTargetRoleIds
                            .map((roleId) => roleOptions.find((opt) => opt.value === roleId)?.label || `Role ${roleId}`)
                            .join(', ')
                        : null,
                      row.assignmentTargetUserIdsCsv
                        ? `Users: ${row.assignmentTargetUserIdsCsv}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' | ') || '-'}
                  </td>
                  <td>{row.slaHours}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button
                        icon="pi pi-pencil"
                        text
                        onClick={() => {
                          setEditingRowIndex(index);
                          setRowEditor(row);
                          setTransitionDraft(createTransitionDraft(row.step));
                          setEditingTransitionIndex(null);
                          setIsTransitionJsonTouched(true);
                          setIsAssignmentRuleJsonTouched(true);
                        }}
                      />
                      <Button
                        icon="pi pi-trash"
                        text
                        severity="danger"
                        onClick={() => {
                          if (row.id) setDeletedIds((prev) => [...prev, row.id as number]);
                          setRows((prev) => prev.filter((_, i) => i !== index));
                          if (editingRowIndex === index) {
                            setEditingRowIndex(null);
                            setRowEditor(buildDefaultRow());
                            setIsTransitionJsonTouched(false);
                            setIsAssignmentRuleJsonTouched(false);
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="d-flex gap-2 mt-4">
          <Button
            label="Save Workflow"
            icon="pi pi-check"
            onClick={handleSave}
            loading={saving || createMutation.isPending || updateMutation.isPending}
            className="flex-grow-1"
            severity="success"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            onClick={() => setDialogOpen(false)}
          />
        </div>
      </Dialog>
    </div>
  );
};
