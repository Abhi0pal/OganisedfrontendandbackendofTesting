"use client";

import { useRef, useState, useMemo } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Tag } from "primereact/tag";
import { Toolbar } from "primereact/toolbar";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";

// Existing Calculator Hooks
import {
  useKyiIcCalculators,
  useCreateKyiIcCalculator,
  useUpdateKyiIcCalculator,
  useDeleteKyiIcCalculator,
  useToggleKyiIcCalculator,
  KyiIcCalculator,
  CreateKyiIcCalculatorPayload,
} from "@/hooks/master/useKyiIcCalculator";

// --- START: Foreign Key Hooks ---
import { usePolicies } from "@/hooks/master/usePolicies";
import { useSectors } from "@/hooks/master/useSectors";
import { useSubSectors } from "@/hooks/master/useSubSectors";
import { useMsmeYears } from "@/hooks/master/useMsmeYear";
import { useUnitCategories } from "@/hooks/master/useUnitCategories";
import { useUnitTypes } from "@/hooks/master/useUnitTypes";
import { useOccurrences } from "@/hooks/master/useOccurrences";
import { useBlocks } from "@/hooks/master/useBlocks";
import { useRegionCategories } from "@/hooks/master/useRegionCategories";
import { useLandCategories } from "@/hooks/master/useLandCategories";
import { useBeneficiaryTypes } from "@/hooks/master/useBeneficiaryTypes";
import { useAnchorTypes } from "@/hooks/master/useAnchorTypes";
import { useFinancialParameters } from "@/hooks/master/useFinancialParameter";
import { useIncentiveTypes } from "@/hooks/master/useIncentiveTypes";
// --- END: Foreign Key Hooks ---

import { useDataTableManager } from "@/hooks/useDataTableManager";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import {
  ReusableDataTableConfig,
  RowAction,
} from "@/components/DataTable/types";

export const KyiIcCalculatorMaster = () => {
  // Master Data
  const { data = [], isLoading } = useKyiIcCalculators();

  // Dropdown Data Fetching
  const { data: policies = [] } = usePolicies();
  const { data: sectors = [] } = useSectors();
  const { data: subSectors = [] } = useSubSectors();
  const { data: msmeYears = [] } = useMsmeYears();
  const { data: unitCategories = [] } = useUnitCategories();
  const { data: unitTypes = [] } = useUnitTypes();
  const { data: occurrences = [] } = useOccurrences();
  const { data: blocks = [] } = useBlocks();
  const { data: regionCategories = [] } = useRegionCategories();
  const { data: landCategories = [] } = useLandCategories();
  const { data: beneficiaryTypes = [] } = useBeneficiaryTypes();
  const { data: anchorTypes = [] } = useAnchorTypes();
  const { data: financialParams = [] } = useFinancialParameters();
  const { data: incentiveTypes = [] } = useIncentiveTypes();

  const createMutation = useCreateKyiIcCalculator();
  const updateMutation = useUpdateKyiIcCalculator();
  const deleteMutation = useDeleteKyiIcCalculator();
  const toggleMutation = useToggleKyiIcCalculator();

  const toastRef = useRef<Toast | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateKyiIcCalculatorPayload>({
    benefit_percent_amount: undefined,
    cap_limit: undefined,
    extra_fixed_amount: undefined,
    above_calculating_amount: undefined,
    years_of_recurring: undefined,
    eligibility_notes: "",
    description: "",
    limitation: "",
    policy_id: undefined,
    msme_year_value: undefined,
    unit_category_value: undefined,
    unit_type_value: undefined,
    sector_value: undefined,
    sub_sector_value: undefined,
    ocurrance_value: undefined,
    block_value: undefined,
    region_category_value: undefined,
    land_type_value: undefined,
    beneficiary_type_value: undefined,
    anchor_unit_value: undefined,
    incentive_mapping_id: undefined,
    incentive_value: undefined,
    effectiveFrom: null as any,
    effectiveTo: null as any,
    isActive: true,
  });

  const {
    data: tableData,
    selectedRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
    filters,
    globalFilter,
  } = useDataTableManager<KyiIcCalculator>(data);

  /** ---------------- Handlers ---------------- */
  const handleFormChange = (
    name: keyof CreateKyiIcCalculatorPayload,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      benefit_percent_amount: undefined,
      cap_limit: undefined,
      extra_fixed_amount: undefined,
      above_calculating_amount: undefined,
      years_of_recurring: undefined,
      eligibility_notes: "",
      description: "",
      limitation: "",
      policy_id: undefined,
      msme_year_value: undefined,
      unit_category_value: undefined,
      unit_type_value: undefined,
      sector_value: undefined,
      sub_sector_value: undefined,
      ocurrance_value: undefined,
      block_value: undefined,
      region_category_value: undefined,
      land_type_value: undefined,
      beneficiary_type_value: undefined,
      anchor_unit_value: undefined,
      incentive_mapping_id: undefined,
      incentive_value: undefined,
      effectiveFrom: null as any,
      effectiveTo: null as any,
      isActive: true,
    });
    setEditingId(null);
  };

  /**
   * ✅ FIX: Explicit mapping from KyiIcCalculator row → CreateKyiIcCalculatorPayload
   * Do NOT spread `row` into formData; map fields individually.
   */
  const handleEdit = (row: KyiIcCalculator) => {
    const fromDate =
      (row.effectiveFrom as any) instanceof Date
        ? row.effectiveFrom
        : new Date(row.effectiveFrom);
    const toDate =
      (row.effectiveTo as any) instanceof Date
        ? row.effectiveTo
        : new Date(row.effectiveTo);

    setFormData({
      // numbers
      benefit_percent_amount: row.benefit_percent_amount ?? undefined,
      cap_limit: row.cap_limit ?? undefined,
      extra_fixed_amount: row.extra_fixed_amount ?? undefined,
      above_calculating_amount: row.above_calculating_amount ?? undefined,
      years_of_recurring: row.years_of_recurring ?? undefined,

      // text
      eligibility_notes: row.eligibility_notes ?? "",
      description: row.description ?? "",
      limitation: row.limitation ?? "",

      // foreign key/value mappings (prefer existing *_value or *_id, else nested object id)
      policy_id: (row as any).policy_id ?? (row as any).policy?.id ?? undefined,

      msme_year_value:
        (row as any).msme_year_value ?? (row as any).msmeYear?.id ?? undefined,

      unit_category_value:
        (row as any).unit_category_value ??
        (row as any).unitCategory?.id ??
        undefined,

      unit_type_value:
        (row as any).unit_type_value ?? (row as any).unitType?.id ?? undefined,

      sector_value:
        (row as any).sector_value ?? (row as any).sector?.id ?? undefined,

      sub_sector_value:
        (row as any).sub_sector_value ??
        (row as any).subSector?.id ??
        undefined,

      ocurrance_value:
        (row as any).ocurrance_value ??
        (row as any).occurrence?.id ??
        undefined,

      block_value:
        (row as any).block_value ?? (row as any).block?.id ?? undefined,

      region_category_value:
        (row as any).region_category_value ??
        (row as any).regionCategory?.id ??
        undefined,

      land_type_value:
        (row as any).land_type_value ??
        (row as any).landCategory?.id ??
        undefined,

      beneficiary_type_value:
        (row as any).beneficiary_type_value ??
        (row as any).beneficiaryType?.id ??
        undefined,

      anchor_unit_value:
        (row as any).anchor_unit_value ??
        (row as any).anchorType?.id ??
        undefined,

      incentive_mapping_id:
        (row as any).incentive_mapping_id ??
        (row as any).financialParameter?.id ??
        undefined,

      incentive_value:
        (row as any).incentive_value ??
        (row as any).incentiveType?.id ??
        undefined,

      // dates
      effectiveFrom: fromDate as any,
      effectiveTo: toDate as any,

      // flag
      isActive: !!row.isActive,
    });

    setEditingId(row.id);
    setShowDialog(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      toastRef.current?.show({
        severity: "success",
        summary: "Success",
        detail: "Record Saved",
      });
      setShowDialog(false);
      resetForm();
    } catch (err: any) {
      toastRef.current?.show({
        severity: "error",
        summary: "Error",
        detail: "Save Failed",
      });
    }
  }

  /** ---------------- Table Configuration ---------------- */
  const tableConfig: ReusableDataTableConfig<KyiIcCalculator> = useMemo(
    () => ({
      columns: [
        { field: "id", header: "ID", width: "5%" },
        { field: "description", header: "Description" },
        {
          field: "policy_id",
          header: "Policy",
          body: (row) => row.policy?.policy_name || "N/A",
        },
        { field: "benefit_percent_amount", header: "Benefit %" },
        {
          field: "effectiveFrom",
          header: "From",
          body: (r) =>
            r.effectiveFrom
              ? new Date(r.effectiveFrom).toLocaleDateString()
              : "",
        },
        {
          field: "effectiveTo",
          header: "To",
          body: (r) =>
            r.effectiveTo ? new Date(r.effectiveTo).toLocaleDateString() : "",
        },
        {
          field: "isActive",
          header: "Status",
          body: (r) => (
            <Tag
              severity={r.isActive ? "success" : "danger"}
              value={r.isActive ? "Active" : "Inactive"}
            />
          ),
        },
      ],
      dataKey: "id",
      rows: 10,
      paginator: true,
    }),
    [],
  );

  const rowActions: RowAction<KyiIcCalculator>[] = useMemo(
    () => [
      {
        label: "Edit",
        icon: "pi pi-pencil",
        severity: "info",
        onClick: handleEdit,
      },
      {
        label: "Delete",
        icon: "pi pi-trash",
        severity: "error",
        onClick: (r) => deleteMutation.mutate(r.id),
      },
    ],
    [deleteMutation],
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Toast ref={toastRef} />
      <Toolbar
        className="mb-4 shadow-sm bg-white"
        left={
          <Button
            label="Add New Calculator"
            icon="pi pi-plus"
            onClick={() => setShowDialog(true)}
          />
        }
      />

      <Dialog
        header={editingId ? "Edit Calculator" : "Add Calculator"}
        visible={showDialog}
        style={{ width: "85vw" }}
        onHide={() => {
          setShowDialog(false);
          resetForm();
        }}
        modal
        className="p-fluid"
      >
        <form onSubmit={handleSubmit} className="container-fluid px-0">
          <div className="row">
            {/* --- Row 1 --- */}

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Policy *</label>
              <Dropdown
                value={formData.policy_id}
                options={policies}
                optionLabel="policy_name"
                optionValue="id"
                onChange={(e) => handleFormChange("policy_id", e.value)}
                placeholder="Select Policy"
                filter
                required
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Incentive Type *</label>
              <Dropdown
                value={formData.incentive_value}
                options={incentiveTypes}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("incentive_value", e.value)}
                placeholder="Select Incentive"
                filter
                required
              />
            </div>

            {/* --- Row 5 --- */}
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Financial Parameter</label>
              <Dropdown
                value={formData.incentive_mapping_id}
                options={financialParams}
                optionLabel="name"
                optionValue="id"
                onChange={(e) =>
                  handleFormChange("incentive_mapping_id", e.value)
                }
                placeholder="Select Parameter"
                filter
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Benefit %</label>
              <InputNumber
                value={formData.benefit_percent_amount}
                onValueChange={(e) =>
                  handleFormChange("benefit_percent_amount", e.value)
                }
                minFractionDigits={2}
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Cap Limit (INR)</label>
              <InputNumber
                value={formData.cap_limit}
                onValueChange={(e) => handleFormChange("cap_limit", e.value)}
                mode="currency"
                currency="INR"
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">
                Extra Fixed Amount (INR)
              </label>
              <InputNumber
                value={formData.extra_fixed_amount}
                onValueChange={(e) =>
                  handleFormChange("extra_fixed_amount", e.value)
                }
                mode="currency"
                currency="INR"
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">
                Above Calculating Amount (INR)
              </label>
              <InputNumber
                value={formData.above_calculating_amount}
                onValueChange={(e) =>
                  handleFormChange("above_calculating_amount", e.value)
                }
                mode="currency"
                currency="INR"
              />
            </div>
            {/* --- Row 2 --- */}
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Sector</label>
              <Dropdown
                value={formData.sector_value}
                options={sectors}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("sector_value", e.value)}
                placeholder="Select Sector"
                filter
              />
            </div>

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Sub Sector</label>
              <Dropdown
                value={formData.sub_sector_value}
                options={subSectors}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("sub_sector_value", e.value)}
                placeholder="Select Sub Sector"
                filter
              />
            </div>
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Unit Type</label>
              <Dropdown
                value={formData.unit_type_value}
                options={unitTypes}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("unit_type_value", e.value)}
                placeholder="Select Type"
                filter
              />
            </div>

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Investment Year</label>
              <Dropdown
                value={formData.msme_year_value}
                options={msmeYears}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("msme_year_value", e.value)}
                placeholder="Select Year"
              />
            </div>

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Unit Category</label>
              <Dropdown
                value={formData.unit_category_value}
                options={unitCategories}
                optionLabel="name"
                optionValue="id"
                onChange={(e) =>
                  handleFormChange("unit_category_value", e.value)
                }
                placeholder="Select Category"
                filter
              />
            </div>

            {/* --- Row 3 --- */}

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Occurrence</label>
              <Dropdown
                value={formData.ocurrance_value}
                options={occurrences}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("ocurrance_value", e.value)}
                placeholder="Select Occurrence"
              />
            </div>

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Region Category</label>
              <Dropdown
                value={formData.region_category_value}
                options={regionCategories}
                optionLabel="name"
                optionValue="id"
                onChange={(e) =>
                  handleFormChange("region_category_value", e.value)
                }
                placeholder="Select Region"
              />
            </div>

            {/* --- Row 4 --- */}
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Block</label>
              <Dropdown
                value={formData.block_value}
                options={blocks}
                optionLabel="name"
                optionValue="id"
                onChange={(e) => handleFormChange("block_value", e.value)}
                placeholder="Select Block"
                filter
              />
            </div>

            {/* --- Row 6 --- */}
            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Effective From *</label>
              <Calendar
                value={formData.effectiveFrom as any}
                onChange={(e) => handleFormChange("effectiveFrom", e.value)}
                showIcon
                dateFormat="yy-mm-dd"
                required
              />
            </div>

            <div className="col-12 col-md-4 mb-3">
              <label className="form-label fw-bold">Effective To *</label>
              <Calendar
                value={formData.effectiveTo as any}
                onChange={(e) => handleFormChange("effectiveTo", e.value)}
                showIcon
                dateFormat="yy-mm-dd"
                required
              />
            </div>

            <div className="col-12 col-md-4 mb-3 d-flex align-items-center">
              <div className="mt-4">
                <Tag
                  severity={formData.isActive ? "success" : "danger"}
                  value={formData.isActive ? "Active" : "Inactive"}
                  className="me-2"
                />
                <label className="me-2 fw-bold">Active Status</label>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleFormChange("isActive", e.target.checked)
                  }
                />
              </div>
            </div>
            <div className="col-12 mb-3">
              <label className="form-label fw-bold">Description *</label>
              <InputTextarea
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                required
              />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label fw-bold">Limitation</label>
              <InputTextarea
                value={formData.limitation}
                onChange={(e) => handleFormChange("limitation", e.target.value)}
                rows={1}
                autoResize
              />
            </div>
            {/* --- Row 7 (Full Width Notes) --- */}
            <div className="col-12 mb-3">
              <label className="form-label fw-bold">Eligibility Notes</label>
              <InputTextarea
                value={formData.eligibility_notes}
                onChange={(e) =>
                  handleFormChange("eligibility_notes", e.target.value)
                }
                rows={2}
              />
            </div>
          </div>

          {/* --- Action Buttons --- */}
          <div className="d-flex justify-content-end mt-4">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text me-2"
              onClick={() => setShowDialog(false)}
            />
            <Button
              label={editingId ? "Update" : "Create"}
              icon="pi pi-check"
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </form>
      </Dialog>

      <ReusableDataTable
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
  );
};
