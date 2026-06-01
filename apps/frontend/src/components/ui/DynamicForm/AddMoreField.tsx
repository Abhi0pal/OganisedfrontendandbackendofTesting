'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormFieldConfig, AddMoreColumnConfig, AddMoreConfig } from './types';

interface AddMoreFieldProps {
    field: FormFieldConfig;
}

export default function AddMoreField({ field }: AddMoreFieldProps) {
    const { control, register, formState: { errors }, watch } = useFormContext();

    const config: AddMoreConfig = field.addMoreConfig || { columns: [] };
    const { fields, append, remove } = useFieldArray({
        control,
        name: field.name,
    });

    const minRows = config.minRows ?? 1;
    const maxRows = config.maxRows;

    // Initialize with minimum rows if empty
    React.useEffect(() => {
        if (fields.length < minRows) {
            const rowsToAdd = minRows - fields.length;
            for (let i = 0; i < rowsToAdd; i++) {
                append(config.defaultRow || {});
            }
        }
    }, []);

    const handleAddRow = () => {
        if (maxRows && fields.length >= maxRows) return;
        append(config.defaultRow || {});
    };

    const handleRemoveRow = (index: number) => {
        if (fields.length <= minRows) return;
        remove(index);
    };

    const canAddMore = !maxRows || fields.length < maxRows;
    const canRemove = fields.length > minRows;

    // Get nested error
    const getError = (rowIndex: number, colName: string) => {
        const fieldErrors = errors[field.name] as any;
        return fieldErrors?.[rowIndex]?.[colName];
    };

    const getInputClasses = (hasError: boolean) => {
        const baseClasses = 'w-full px-2 py-1.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50';
        const errorClasses = hasError ? 'border-red-500' : 'border-gray-200';
        return `${baseClasses} ${errorClasses} focus:border-red-400 focus:ring-1 focus:ring-red-100`;
    };

    // Render a single cell based on column type
    const renderCell = (column: AddMoreColumnConfig, rowIndex: number) => {
        const fieldName = `${field.name}.${rowIndex}.${column.name}`;
        const error = getError(rowIndex, column.name);
        const hasError = !!error;

        switch (column.type) {
            case 'select':
                return (
                    <select
                        {...register(fieldName, column.validation)}
                        disabled={column.disabled}
                        multiple={column.multiple}
                        className={getInputClasses(hasError)}
                    >
                        <option value="">{column.placeholder || 'Select...'}</option>
                        {column.options?.map((option) => (
                            <option key={option.value} value={option.value} disabled={option.disabled}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'textarea':
                return (
                    <textarea
                        {...register(fieldName, column.validation)}
                        placeholder={column.placeholder}
                        disabled={column.disabled}
                        readOnly={column.readOnly}
                        rows={2}
                        className={`${getInputClasses(hasError)} resize-y`}
                    />
                );

            case 'radio':
                return (
                    <div className="flex flex-wrap gap-2">
                        {column.options?.map((option) => (
                            <label key={option.value} className="inline-flex items-center cursor-pointer text-xs">
                                <input
                                    type="radio"
                                    {...register(fieldName, column.validation)}
                                    value={option.value}
                                    disabled={option.disabled || column.disabled}
                                    className="w-3 h-3 mr-1"
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                if (column.options && column.options.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-2">
                            {column.options.map((option) => (
                                <label key={option.value} className="inline-flex items-center cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        {...register(fieldName, column.validation)}
                                        value={option.value}
                                        disabled={option.disabled || column.disabled}
                                        className="w-3 h-3 mr-1"
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    );
                }
                return (
                    <input
                        type="checkbox"
                        {...register(fieldName, column.validation)}
                        disabled={column.disabled}
                        className="w-4 h-4"
                    />
                );

            case 'file':
                return (
                    <input
                        type="file"
                        {...register(fieldName, column.validation)}
                        accept={column.accept}
                        multiple={column.multiple}
                        disabled={column.disabled}
                        className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                );

            case 'date':
            case 'datetime-local':
            case 'time':
                return (
                    <input
                        type={column.type}
                        {...register(fieldName, column.validation)}
                        disabled={column.disabled}
                        readOnly={column.readOnly}
                        className={getInputClasses(hasError)}
                    />
                );

            default:
                // text, email, password, number, tel, url
                return (
                    <input
                        type={column.type}
                        {...register(fieldName, column.validation)}
                        placeholder={column.placeholder}
                        disabled={column.disabled}
                        readOnly={column.readOnly}
                        className={getInputClasses(hasError)}
                    />
                );
        }
    };

    return (
        <div className="mb-4">
            {/* Label */}
            {field.label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.validation?.required && <span className="text-red-600 ml-1">*</span>}
                </label>
            )}

            {/* Help Text */}
            {field.helpText && (
                <p className="text-sm text-gray-500 mb-2">{field.helpText}</p>
            )}

            {/* Table Container */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            {config.columns.map((column) => (
                                <th
                                    key={column.name}
                                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b border-gray-200"
                                    style={{ width: column.width }}
                                >
                                    {column.label}
                                    {column.validation?.required && <span className="text-red-600 ml-1">*</span>}
                                </th>
                            ))}
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 border-b border-gray-200 w-16">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                {config.columns.map((column) => {
                                    const error = getError(index, column.name);
                                    return (
                                        <td
                                            key={column.name}
                                            className="px-2 py-2 border-b border-gray-100"
                                            style={{ width: column.width }}
                                        >
                                            {renderCell(column, index)}
                                            {error && (
                                                <p className="mt-0.5 text-xs text-red-600">
                                                    {(error as any).message || 'Required'}
                                                </p>
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-2 py-2 border-b border-gray-100 text-center">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRow(index)}
                                        disabled={!canRemove}
                                        className={`p-1.5 rounded transition-colors ${canRemove
                                            ? 'text-red-600 hover:bg-red-50 cursor-pointer'
                                            : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                        title={config.deleteButtonText || 'Delete'}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add More Button */}
            <div className="mt-3">
                <button
                    type="button"
                    onClick={handleAddRow}
                    disabled={!canAddMore}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all ${canAddMore
                        ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer'
                        : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                        }`}
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {config.addButtonText || 'Add More'}
                </button>
                {maxRows && (
                    <span className="ml-3 text-xs text-gray-500">
                        ({fields.length}/{maxRows} rows)
                    </span>
                )}
            </div>
        </div>
    );
}
