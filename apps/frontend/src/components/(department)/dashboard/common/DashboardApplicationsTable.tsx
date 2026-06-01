"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { ReusableDataTable } from "@/components/DataTable/ReusableDataTable";
import { ReusableDataTableConfig, RowAction } from "@/components/DataTable/types";
import { useDataTableManager } from "@/hooks/useDataTableManager";
import { exportToExcel, exportToPDF, prepareModuleExportData } from "@/lib/export-utils";
import type { ModuleExportConfig } from "@/lib/export-utils";

export type DashboardApplicationsTableProps<T> = {
  title?: string;
  description?: string;
  rows: T[];
  loading: boolean;
  activeStatusLabel?: string;
  tableConfig: ReusableDataTableConfig<T>;
  exportConfig?: ModuleExportConfig;
  rowActions?: RowAction<T>[];
};

export function DashboardApplicationsTable<T extends { id: string | number }>({
  title,
  description,
  rows,
  loading,
  activeStatusLabel,
  tableConfig,
  exportConfig,
  rowActions,
}: DashboardApplicationsTableProps<T>) {
  const [tableFilteredRows, setTableFilteredRows] = useState<T[]>([]);
  const { globalFilter, filters, handleFiltersChange, handleGlobalFilterChange } =
    useDataTableManager<T>(rows);

  const handleFilteredData = useCallback((nextRows: T[]) => {
    setTableFilteredRows(nextRows);
  }, []);

  const shouldEnableExport = Boolean(exportConfig);

  return (
    <div className="card shadow-sm border-0 mt-4">
      <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 className="mb-1">{title || "Applications"}</h5>
          {description && <small className="text-muted">{description}</small>}
          {activeStatusLabel && (
            <div className="text-muted small mt-1">Showing {rows.length} entries for {activeStatusLabel}.</div>
          )}
        </div>
        {shouldEnableExport && exportConfig && (
          <div className="d-flex gap-2">
            <Button
              icon="pi pi-file-excel"
              label="Excel"
              severity="success"
              outlined
              onClick={async () => {
                const exportData = prepareModuleExportData(tableFilteredRows.length ? tableFilteredRows : rows, exportConfig);
                await exportToExcel(exportData, exportConfig);
              }}
            />
            <Button
              icon="pi pi-file-pdf"
              label="PDF"
              severity="danger"
              outlined
              onClick={() => {
                const exportData = prepareModuleExportData(tableFilteredRows.length ? tableFilteredRows : rows, exportConfig);
                exportToPDF(exportData, exportConfig);
              }}
            />
          </div>
        )}
      </div>
      <div className="card-body">
        <ReusableDataTable<T>
          data={rows}
          config={tableConfig}
          loading={loading}
          rowActions={rowActions}
          onFiltersChange={handleFiltersChange}
          onGlobalFilterChange={handleGlobalFilterChange}
          externalFilters={filters}
          externalGlobalFilter={globalFilter}
          getFilteredData={handleFilteredData}
        />
      </div>
    </div>
  );
}
