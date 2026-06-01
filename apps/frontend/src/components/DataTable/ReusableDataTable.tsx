
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { ReusableDataTableProps, DataTableColumnConfig } from './types';

/** Safely resolve nested fields using dot-notation */
const resolveField = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
};

/** Collect all leaf values (strings/numbers/booleans/dates) for deep global search */
const collectLeafStrings = (obj: any): string[] => {
  const out: string[] = [];
  const visit = (val: any) => {
    if (val == null) return;
    if (Array.isArray(val)) {
      val.forEach(visit);
      return;
    }
    if (val instanceof Date) {
      out.push(val.toISOString());
      return;
    }
    if (typeof val === 'object') {
      Object.values(val).forEach(visit);
      return;
    }
    if (['string', 'number', 'boolean'].includes(typeof val)) {
      out.push(String(val));
    }
  };
  visit(obj);
  return out;
};

export const ReusableDataTable = <T extends { id: number | string }>({
  data,
  config,
  loading = false,
  selectedRows = [],
  onSelectionChange,
  onFiltersChange,
  onGlobalFilterChange,
  rowActions = [],
  externalFilters,       // ✅ for syncing clear action
  externalGlobalFilter,  // ✅ for syncing clear action
  getFilteredData,       // optional callback to bubble filtered rows up
}: ReusableDataTableProps<T>) => {
  const dt = useRef<any>(null);
  const lastEmittedIdsRef = useRef<string>('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState<any>({});

  // ✅ Sync with external filters (when Clear Filters is clicked from parent)
  useEffect(() => {
    if (externalFilters !== undefined) {
      setFilters(externalFilters);
    }
  }, [externalFilters]);

  // ✅ Sync with external global filter
  useEffect(() => {
    if (externalGlobalFilter !== undefined) {
      setGlobalFilter(externalGlobalFilter);
    }
  }, [externalGlobalFilter]);

  // Helper to get local date string (yyyy-mm-dd)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle global filter change
  const handleGlobalFilterChangeLocal = (value: string) => {
    setGlobalFilter(value);
    onGlobalFilterChange?.(value);
  };

  // Handle column filter change
  const handleColumnFilterChange = (field: string, value: any) => {
    const newFilters = { ...filters };
    if (value === null || value === '') {
      delete newFilters[field];
    } else {
      newFilters[field] = value;
    }
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  // Render row actions
  const renderRowActions = (row: T) => {
    const visibleActions = rowActions.filter((action) => !action.visible || action.visible(row));
    if (visibleActions.length === 0) return null;

    return (
      <div className="d-flex gap-2">
        {visibleActions.map((action, idx) => (
          <Button
            key={`action-${String(row.id)}-${idx}`}
            icon={action.icon}
            rounded
            outlined
            severity={
              action.severity === 'warn' ? 'warning' : action.severity === 'error' ? 'danger' : action.severity || 'info'
            }
            className="btn-sm"
            onClick={() => action.onClick(row)}
            tooltip={action.tooltip || action.label}
            tooltipOptions={{ position: 'top' }}
            aria-label={action.tooltip || action.label}
            title={action.tooltip || action.label}
          />
        ))}
      </div>
    );
  };

  // Create filter input for each column
  const createTextFilterInput = (column: DataTableColumnConfig<T>) => (
    <InputText
      value={filters[String(column.field)] || ''}
      onChange={(e) => handleColumnFilterChange(String(column.field), e.target.value)}
      placeholder="Search"
      className="p-column-filter"
      style={{ width: '100%' }}
    />
  );

  const createNumberFilterInput = (column: DataTableColumnConfig<T>) => (
    <InputText
      value={filters[String(column.field)] || ''}
      onChange={(e) => handleColumnFilterChange(String(column.field), e.target.value)}
      placeholder="Filter"
      className="p-column-filter"
      style={{ width: '100%' }}
    />
  );

  const createDateFilterInput = (column: DataTableColumnConfig<T>) => {
    let calendarValue: Date | null = null;
    const fval = filters[String(column.field)];
    if (fval) {
      const [year, month, day] = String(fval).split('-');
      calendarValue = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return (
      <Calendar
        value={calendarValue}
        onChange={(e: any) => {
          if (e.value) {
            const dateString = getLocalDateString(e.value);
            handleColumnFilterChange(String(column.field), dateString);
          } else {
            handleColumnFilterChange(String(column.field), null);
          }
        }}
        placeholder="Date"
        inputClassName="p-column-filter-date-input"
        dateFormat="yy-mm-dd"
        showIcon
        style={{ width: '100%' }}
        className="p-column-filter"
      />
    );
  };

  const createSelectFilterInput = (column: DataTableColumnConfig<T>) => (
    <select
      value={
        filters[String(column.field)] === true
          ? 'true'
          : filters[String(column.field)] === false
            ? 'false'
            : filters[String(column.field)] || ''
      }
      onChange={(e) => {
        if (e.target.value === '') {
          handleColumnFilterChange(String(column.field), null);
        } else if (e.target.value === 'true' || e.target.value === 'false') {
          handleColumnFilterChange(String(column.field), e.target.value === 'true');
        } else {
          handleColumnFilterChange(String(column.field), e.target.value);
        }
      }}
      className="form-select p-column-filter"
      style={{ width: '100%' }}
    >
      <option value="">All</option>
      {column.filterOptions?.map((opt) => (
        <option key={`${String(column.field)}-${String(opt.value)}`} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  // Apply filters to data
  const filteredData = useMemo((): T[] => {
    let filtered = [...data];

    // Apply global filter
    if (globalFilter && globalFilter.trim() !== '') {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter((item) => {
        if (config.globalFilterFields && config.globalFilterFields.length > 0) {
          return config.globalFilterFields.some((f) => {
            const v = resolveField(item, String(f));
            return String(v ?? '').toLowerCase().includes(search);
          });
        }
        // Deep search across all leaf values
        const leafs = collectLeafStrings(item);
        return leafs.some((s) => s.toLowerCase().includes(search));
      });
    }

    // Apply column filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter((item) => {
          const raw = resolveField(item, field);
          if (raw == null) return false;

          const col = config.columns.find((c) => String(c.field) === field);
          // For select filters, default to 'equals'
          const matchMode = col?.filterType === 'select' ? 'equals' : col?.filterMatchMode ?? 'contains';

          // Date exact match (compare yyyy-mm-dd with date part before 'T')
          if (col?.filterType === 'date') {
            const itemDateString = String(raw).split('T')[0];
            return itemDateString === String(value);
          }

          // Boolean equality
          if (typeof value === 'boolean') {
            return raw === value;
          }
          if (value === 'true' || value === 'false') {
            return String(raw) === value;
          }

          const itemStr = String(raw).toLowerCase();
          const filterStr = String(value).toLowerCase();

          switch (matchMode) {
            case 'equals':
              return itemStr === filterStr;
            case 'startsWith':
              return itemStr.startsWith(filterStr);
            case 'contains':
            default:
              return itemStr.includes(filterStr);
          }
        });
      }
    });

    return filtered;
  }, [data, globalFilter, filters, config]);

  // Bubble filtered data up if needed (e.g., for exports)
  useEffect(() => {
    if (!getFilteredData) return;
    const nextIds = (filteredData as any[])
      .map((row) => String(row?.id ?? ''))
      .join('|');
    if (nextIds === lastEmittedIdsRef.current) return;
    lastEmittedIdsRef.current = nextIds;
    getFilteredData(filteredData);
  }, [filteredData, getFilteredData]);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <DataTable<T[]>
        ref={dt}
        value={filteredData}
        paginator={config.paginator !== false}
        rows={config.rows || 10}
        rowsPerPageOptions={config.rowsPerPageOptions || [5, 10, 25, 50]}
        tableStyle={{ minWidth: '50rem' }}
        className={config.tableClassName}
        loading={loading}
        dataKey={String(config.dataKey)}
        /** ❌ Do NOT set selectionMode on DataTable; that's for cell selection
         * If you ever need cell selection:
         *   selectionMode="cell"
         *   cellSelection="single" | "multiple"
         */
        selection={selectedRows as any}
        onSelectionChange={(e) => {
          // Normalize to T[] for consumer (your props expect arrays)
          const next = Array.isArray(e.value) ? e.value : e.value ? [e.value] : [];
          onSelectionChange?.(next as T[]);
        }}
        emptyMessage={config.emptyMessage || 'No records found.'}
        stripedRows={config.stripedRows !== false}
        showGridlines={config.showGridlines !== false}
        responsiveLayout="scroll"
        scrollable={!!config.scrollable}
        scrollHeight={config.scrollHeight}
        filterDisplay={config.filterDisplay || 'row'}
        header={
          config.showHeader === false ? null : (
            <div className="d-flex align-items-center gap-2">
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                  type="search"
                  value={globalFilter}
                  onChange={(e) => handleGlobalFilterChangeLocal(e.target.value)}
                  placeholder="Global search..."
                  className="dt-global-search"
                />
              </span>
            </div>
          )
        }
      >
        {config.selectable && (
          /** ✅ Row selection is configured on Column via selectionMode (no generics) */
          <Column
            selectionMode={config.selectionMode || 'multiple'}
            headerStyle={{ width: config.selectionColumnWidth || '2rem' }}
            bodyStyle={{ width: config.selectionColumnWidth || '2rem' }}
          />
        )}

        {config.columns.map((column) => {
          let filterInput: React.ReactNode = null;

          if (column.filterType !== 'none') {
            if (column.filterElement) {
              // If the project provides a function, call it with a simple options object.
              // Otherwise, if they pass a ReactNode, use it directly.
              filterInput =
                typeof column.filterElement === 'function'
                  ? column.filterElement({
                    value: filters[String(column.field)],
                    onChange: (val: any) => handleColumnFilterChange(String(column.field), val?.target?.value ?? val),
                  })
                  : (column.filterElement as any);
            } else {
              switch (column.filterType) {
                case 'text':
                  filterInput = createTextFilterInput(column);
                  break;
                case 'number':
                  filterInput = createNumberFilterInput(column);
                  break;
                case 'date':
                  filterInput = createDateFilterInput(column);
                  break;
                case 'select':
                  filterInput = createSelectFilterInput(column);
                  break;
                default:
                  break;
              }
            }
          }

          return (
            <Column
              key={String(column.field)}
              field={String(column.field)}
              header={column.header}
              body={column.body}
              style={{ width: column.width || '12%' }}
              filter={column.filterType !== 'none'}
              filterElement={filterInput ? <div style={{ padding: '0.5rem 0' }}>{filterInput}</div> : null}
              showFilterMenu={false}
              sortable={column.sortable !== false}
            />
          );
        })}

        {rowActions.length > 0 && (
          <Column body={(rowData: T) => renderRowActions(rowData)} header="Actions" style={{ width: '11%' }} />
        )}
      </DataTable>
    </div>
  );
};