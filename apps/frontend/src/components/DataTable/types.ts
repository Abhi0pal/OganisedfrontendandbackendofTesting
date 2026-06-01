
import { ReactNode } from 'react';

/**
 * Configuration for a column in the reusable DataTable
 */
export interface DataTableColumnConfig<T> {
  /** Field name from the data object; supports dot-paths for nested fields */
  field: keyof T | string;
  /** Column header label */
  header: string;
  /** Column width percentage */
  width?: string;
  /** Custom body template function */
  body?: (rowData: T) => ReactNode;
  /** Filter type */
  filterType?: 'text' | 'number' | 'date' | 'select' | 'none';
  /** Filter options (for select filter type) */
  filterOptions?: { label: string; value: any }[];
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom filter template */
  filterElement?: (options: any) => ReactNode;
  /** Optional match mode for text/number filters; defaults to 'contains' */
  filterMatchMode?: 'contains' | 'startsWith' | 'equals';
}

/**
 * Configuration for the reusable DataTable
 */
export interface ReusableDataTableConfig<T> {
  /** Array of column configurations */
  columns: DataTableColumnConfig<T>[];
  /** Unique key field; supports dot-paths (although a flat id is recommended) */
  dataKey: keyof T | string;
  /** Number of rows per page */
  rows?: number;
  /** Rows per page options */
  rowsPerPageOptions?: number[];
  /** Global filter fields (if provided, only these fields are searched); supports dot-paths */
  globalFilterFields?: (keyof T | string)[];
  /** Enable row selection */
  selectable?: boolean;
  /** Selection mode */
  selectionMode?: 'single' | 'multiple';
  /** Width for selection column */
  selectionColumnWidth?: string;
  /** Padding for selection column */
  selectionColumnPadding?: string;
  /** Enable pagination */
  paginator?: boolean;
  /** Show striped rows */
  stripedRows?: boolean;
  /** Show gridlines */
  showGridlines?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Enable scrollable header/body */
  scrollable?: boolean;
  /** Scroll height when scrollable */
  scrollHeight?: string;
  /** Show default header with global search */
  showHeader?: boolean;
  /** Optional DataTable className */
  tableClassName?: string;
  /** Filter display mode */
  filterDisplay?: 'row' | 'menu';
  /** Enable row expansion */
  expandable?: boolean;
  /** Row expansion template */
  rowExpansionTemplate?: (rowData: T) => ReactNode;
}

/**
 * Props for the reusable DataTable component
 */
export interface ReusableDataTableProps<T> {
  /** Data to display */
  data: T[];
  /** Configuration */
  config: ReusableDataTableConfig<T>;
  /** Loading state */
  loading?: boolean;
  /** Selected rows */
  selectedRows?: T[];
  /** Callback when rows are selected */
  onSelectionChange?: (selectedRows: T[]) => void;
  /** Callback when row is edited */
  onEdit?: (row: T) => void;
  /** Callback when row is deleted */
  onDelete?: (row: T) => void;
  /** Callback when row action is performed */
  onAction?: (action: string, row: T) => void;
  /** Custom actions for each row */
  rowActions?: RowAction<T>[];
  /** Callback for filters change */
  onFiltersChange?: (filters: any) => void;
  /** Callback for global filter change */
  onGlobalFilterChange?: (value: string) => void;
  /** Callback to get filtered data for export (optional) */
  getFilteredData?: (rows: T[]) => void;
  /** ✅ External filters state (for syncing clear action) */
  externalFilters?: any;
  /** ✅ External global filter state (for syncing clear action) */
  externalGlobalFilter?: string;
}

/**
 * Row action button configuration
 */
export interface RowAction<T> {
  icon?: string | ReactNode;
  label: string;
  severity?: 'success' | 'info' | 'secondary' | 'error' | 'warn' | 'contrast';
  onClick: (row: T) => void;
  tooltip?: string;
  visible?: (row: T) => boolean;
}
