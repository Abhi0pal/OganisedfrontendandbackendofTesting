import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Export configuration for a module
 */
export interface ExportColumnConfig {
  /** Column header label */
  header: string;
  /** Field name from data object */
  field: string;
  /** Custom formatter function for the value */
  formatter?: (value: any, row?: any) => string;
  /** Column width for Excel (optional) */
  width?: number;
}

export interface ModuleExportConfig {
  /** Array of column configurations */
  columns: ExportColumnConfig[];
  /** Module name (e.g., 'countries', 'states') */
  moduleName: string;
  /** Title for PDF export (optional, defaults to capitalized moduleName) */
  title?: string;
}

interface ExportData {
  headers: string[];
  rows: any[][];
  filename: string;
}

/**
 * Generic function to prepare export data for any module
 */
export const prepareModuleExportData = (
  data: any[],
  config: ModuleExportConfig
): ExportData => {
  const headers = config.columns.map((col) => col.header);

  const rows = data.map((item) =>
    config.columns.map((col) => {
      const value = item[col.field];
      
      // Use custom formatter if provided
      if (col.formatter) {
        return col.formatter(value, item);
      }
      
      // Default formatters
      if (value === null || value === undefined) {
        return 'N/A';
      }
      
      // Format booleans
      if (typeof value === 'boolean') {
        return value ? 'Active' : 'Inactive';
      }
      
      // Format dates
      if (col.field.includes('At') || col.field.includes('Date')) {
        return new Date(value).toLocaleDateString();
      }
      
      return String(value);
    })
  );

  return {
    headers,
    rows,
    filename: config.moduleName,
  };
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: ExportData) => {
  const { headers, rows, filename } = data;

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

/**
 * Export data to Excel format with dynamic column widths
 */
export const exportToExcel = async (
  data: ExportData,
  config?: ModuleExportConfig
) => {
  const { headers, rows, filename } = data;

  try {
    const workbook = new ExcelJS.Workbook();
    const sheetName = config?.title || filename.charAt(0).toUpperCase() + filename.slice(1);
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0D6EFD' }, // Blue background
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add data rows
    rows.forEach((row, index) => {
      const dataRow = worksheet.addRow(row);

      // Alternate row colors
      if (index % 2 === 1) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }, // Light gray background
        };
      }

      // Align cells
      dataRow.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    // Set column widths dynamically
    if (config?.columns) {
      worksheet.columns = config.columns.map((col) => ({
        width: col.width || 15, // Default width 15 if not specified
      }));
    } else {
      // Auto-size columns based on content
      worksheet.columns = headers.map((header, index) => {
        const maxLength = Math.max(
          header.length,
          ...rows.map((row) => String(row[index]).length)
        );
        return { width: Math.min(maxLength + 2, 50) }; // Min 2 padding, max 50
      });
    }

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    saveAs(blob, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (data: ExportData, config?: ModuleExportConfig) => {
  const { headers, rows, filename } = data;

  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    const title = config?.title || filename.charAt(0).toUpperCase() + filename.slice(1);

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, pageWidth / 2, 15, {
      align: 'center',
    });

    // Add date
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, {
      align: 'center',
    });

    // Add table
    autoTable(pdf, {
      head: [headers],
      body: rows,
      startY: 30,
      styles: {
        fontSize: 9,
        cellPadding: 6,
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [13, 110, 253],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 30 },
      didDrawPage: (data) => {
        const pageCount = (pdf as any).internal.getNumberOfPages();
        const pageSize = pdf.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();

        pdf.setFontSize(8);
        pdf.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      },
    });

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Legacy function for backward compatibility (Country module)
 * @deprecated Use prepareModuleExportData with config instead
 */
export const prepareExportData = (countries: any[]) => {
  const headers = [
    'ID',
    'Country Name',
    'Abbreviation',
    'BO Country ID',
    'LR ID',
    'Status',
    'Created Date',
  ];

  const rows = countries.map((country) => [
    country.id,
    country.name,
    country.abbreviation || 'N/A',
    country.boCountryId || '-',
    country.lrId || '-',
    country.isActive ? 'Active' : 'Inactive',
    new Date(country.createdAt).toLocaleDateString(),
  ]);

  return { headers, rows, filename: 'countries' };
};
