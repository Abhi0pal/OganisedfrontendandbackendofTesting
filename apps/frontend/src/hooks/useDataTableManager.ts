import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/** Resolve nested fields via dot-notation */
const resolveField = (obj: any, path: string) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
};

/** Deeply collect leaf values (strings/numbers/booleans/dates) for global search */
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

/**
 * Hook to manage DataTable state, filtering, and data operations
 * Provides a unified interface for all DataTable instances
 */
export const useDataTableManager = <T extends { id: number | string }>(
  initialData: T[] = [],
  onFiltersApply?: (filters: any) => void
) => {
  const [data, setData] = useState<T[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous data and only update if truly different
  const prevDataRef = useRef<T[]>(initialData);

  useEffect(() => {
    if (
      initialData.length !== prevDataRef.current.length ||
      JSON.stringify(initialData) !== JSON.stringify(prevDataRef.current)
    ) {
      setData(initialData);
      prevDataRef.current = initialData;
    }
  }, [initialData]);

  // Update data when prop changes
  const updateData = useCallback((newData: T[]) => {
    setData(newData);
    prevDataRef.current = newData;
  }, []);

  // Add row
  const addRow = useCallback((row: T) => {
    setData((prev) => {
      const newData = [row, ...prev];
      prevDataRef.current = newData;
      return newData;
    });
  }, []);

  // Update row
  const updateRow = useCallback((id: number | string, updatedRow: T) => {
    setData((prev) => {
      const newData = prev.map((row) => (row.id === id ? updatedRow : row));
      prevDataRef.current = newData;
      return newData;
    });
  }, []);

  // Delete row
  const deleteRow = useCallback((id: number | string) => {
    setData((prev) => {
      const newData = prev.filter((row) => row.id !== id);
      prevDataRef.current = newData;
      return newData;
    });
  }, []);

  // Delete multiple rows
  const deleteRows = useCallback((ids: (number | string)[]) => {
    setData((prev) => {
      const newData = prev.filter((row) => !ids.includes(row.id));
      prevDataRef.current = newData;
      return newData;
    });
  }, []);

  // Apply filters manually (simple key: value shape; resolves dot-paths)
  const applyFiltersManually = useCallback(
    (filterConfig: any) => {
      let filteredData = [...data];

      // Global filter
      if (globalFilter && globalFilter.trim() !== '') {
        const searchLower = globalFilter.toLowerCase();
        filteredData = filteredData.filter((item) => {
          const leafs = collectLeafStrings(item);
          return leafs.some((val) => String(val).toLowerCase().includes(searchLower));
        });
      }

      // Column filters
      Object.entries(filterConfig).forEach(([key, value]: any) => {
        if (value !== null && value !== undefined && value !== '') {
          filteredData = filteredData.filter((item) => {
            const raw = resolveField(item, String(key));
            if (raw == null) return false;

            // Date exact match (yyyy-mm-dd) for common date keys
            if (['createdAt', 'updatedAt', 'validFrom', 'validTo', 'documentDateOfIssuance'].includes(String(key))) {
              const itemDateString = String(raw).split('T')[0];
              return itemDateString === String(value);
            }

            // Boolean equality
            if (typeof value === 'boolean') return raw === value;
            if (value === 'true' || value === 'false') return String(raw) === String(value);

            const itemStr = String(raw).toLowerCase();
            const filterStr = String(value).toLowerCase();
            return itemStr.includes(filterStr);
          });
        }
      });

      return filteredData;
    },
    [data, globalFilter]
  );

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Global filter (deep search)
    if (globalFilter && globalFilter.trim() !== '') {
      const searchLower = globalFilter.toLowerCase();
      result = result.filter((item) => {
        const leafs = collectLeafStrings(item);
        return leafs.some((val) => String(val).toLowerCase().includes(searchLower));
      });
    }

    // Column filters (simple values; resolve dot-paths)
    Object.entries(filters).forEach(([key, value]: any) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter((item) => {
          const raw = resolveField(item, String(key));
          if (raw == null) return false;

          // Date exact match
          if (['createdAt', 'updatedAt', 'validFrom', 'validTo', 'documentDateOfIssuance'].includes(String(key))) {
            const itemDateString = String(raw).split('T')[0];
            return itemDateString === String(value);
          }

          // Boolean equality
          if (typeof value === 'boolean') return raw === value;
          if (value === 'true' || value === 'false') return String(raw) === String(value);

          const itemStr = String(raw).toLowerCase();
          const filterStr = String(value).toLowerCase();
          return itemStr.includes(filterStr);
        });
      }
    });

    return result;
  }, [data, globalFilter, filters]);

  // Handle selection change
  const handleSelectionChange = useCallback((selected: T[]) => {
    setSelectedRows(selected);
  }, []);

  // Handle global filter change
  const handleGlobalFilterChange = useCallback((value: string) => {
    setGlobalFilter(value);
  }, []);

  // Handle filters change
  const handleFiltersChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters); // simple key: value shape
      onFiltersApply?.(newFilters);
    },
    [onFiltersApply]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setGlobalFilter('');
    setFilters({});
    setSelectedRows([]);
  }, []);

  // Set loading state
  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return {
    // State
    data,
    selectedRows,
    globalFilter,
    filters,
    loading,
    filteredData,

    // Methods
    updateData,
    addRow,
    updateRow,
    deleteRow,
    deleteRows,
    handleSelectionChange,
    handleGlobalFilterChange,
    handleFiltersChange,
    clearFilters,
    setLoadingState,
    applyFiltersManually,
  };
};