import { useCallback, useRef } from 'react';
import { Toast } from 'primereact/toast';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareModuleExportData,
  ModuleExportConfig,
} from '@/lib/export-utils';

/**
 * Reusable hook for export functionality
 */
export const useExportHandler = (
  config: ModuleExportConfig,
  toastRef: React.RefObject<Toast>
) => {
  const handleExportCSV = useCallback(
    (filteredData: any[]) => {
      try {
        if (filteredData.length === 0) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No data to export. Please check your filters.',
          });
          return;
        }
        const exportData = prepareModuleExportData(filteredData, config);
        exportToCSV(exportData);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `CSV file exported successfully (${filteredData.length} records)`,
        });
      } catch (error) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export CSV file',
        });
      }
    },
    [config, toastRef]
  );

  const handleExportExcel = useCallback(
    async (filteredData: any[]) => {
      try {
        if (filteredData.length === 0) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No data to export. Please check your filters.',
          });
          return;
        }
        const exportData = prepareModuleExportData(filteredData, config);
        await exportToExcel(exportData, config);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `Excel file exported successfully (${filteredData.length} records)`,
        });
      } catch (error) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export Excel file',
        });
      }
    },
    [config, toastRef]
  );

  const handleExportPDF = useCallback(
    (filteredData: any[]) => {
      try {
        if (filteredData.length === 0) {
          toastRef.current?.show({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No data to export. Please check your filters.',
          });
          return;
        }
        const exportData = prepareModuleExportData(filteredData, config);
        exportToPDF(exportData, config);
        toastRef.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: `PDF file exported successfully (${filteredData.length} records)`,
        });
      } catch (error) {
        toastRef.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export PDF file',
        });
      }
    },
    [config, toastRef]
  );

  return {
    handleExportCSV,
    handleExportExcel,
    handleExportPDF,
  };
};
