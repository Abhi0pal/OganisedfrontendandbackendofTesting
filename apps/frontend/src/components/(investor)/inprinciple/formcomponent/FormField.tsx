'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { AutoComplete } from 'primereact/autocomplete';
import { FormFieldConfig } from './types';

interface FormFieldProps {
    field: FormFieldConfig;
}

export default function FormField({ field }: FormFieldProps) {
    const formMethods = useFormContext();
    const {
        register,
        formState: { errors },
        watch,
    } = formMethods;

    const fieldValue = watch(field.name);
    const options = field.options || [];
    const optionsSignature = useMemo(
        () => options.map((opt) => `${String(opt.value)}::${opt.label}`).join('|'),
        [options]
    );
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        setFilteredOptions([...options]);
    }, [optionsSignature]);

    useEffect(() => {
        const selected = options.find(
            (opt) => String(opt.value) === String(fieldValue)
        );
        if (selected) {
            setSearchText('');
        }
    }, [fieldValue, optionsSignature]);
    useEffect(() => {
        if (field.onMount) {
            field.onMount(formMethods);
        }
    }, []);

    useEffect(() => {
        if (field.onChange && fieldValue !== undefined) {
            field.onChange(fieldValue, formMethods);
        }
    }, [fieldValue]);

    if (field.dependsOn) {
        const watchedValue = watch(field.dependsOn.field);
        const targetValues = Array.isArray(field.dependsOn.value)
            ? field.dependsOn.value
            : [field.dependsOn.value];
        const conditionMet = targetValues.includes(watchedValue);
        const shouldShow = field.dependsOn.show ? conditionMet : !conditionMet;
        if (!shouldShow) return null;
    }

    const getError = (name: string) => {
        const parts = name.split('.');
        let error: any = errors;
        for (const part of parts) {
            error = error?.[part];
        }
        return error;
    };

    const error = field.disabled ? null : getError(field.name);

    const getColSpanClass = () => {
        switch (field.colSpan) {
            case 2: return 'col-span-2';
            case 3: return 'col-span-3';
            case 4: return 'col-span-4';
            default: return 'col-span-1';
        }
    };

    const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

    // Handle blur callback
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (field.onBlur) {
            field.onBlur(e.target.value, formMethods);
        }
    };

    const getInputClasses = () => {
        const baseClasses = 'w-full px-3 py-2.5 border rounded text-sm transition-colors duration-200 outline-none bg-gray-50';
        const errorClasses = error ? 'border-red-500' : 'border-gray-200';
        const disabledClasses = field.disabled ? 'bg-gray-100 cursor-not-allowed' : '';
        return `${baseClasses} ${errorClasses} ${disabledClasses} focus:border-red-400 focus:ring-2 focus:ring-red-100`;
    };

    const renderField = () => {
        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        id={field.name}
                        {...register(field.name, field.validation)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        readOnly={field.readOnly}
                        rows={field.rows || 3}
                        className={`${getInputClasses()} resize-y`}
                        onBlur={handleBlur}
                    />
                );

            case 'select':
                if (field.searchable) {
                    const handleSearch = (event: { query: string }) => {
                        const query = (event.query || '').toLowerCase();
                        if (!query) {
                            setFilteredOptions([...options]);
                            return;
                        }
                        setFilteredOptions(
                            options.filter((opt) => opt.label.toLowerCase().includes(query))
                        );
                    };

                    return (
                        <Controller
                            name={field.name}
                            control={formMethods.control}
                            rules={field.validation}
                            render={({ field: controllerField }) => (
                                <AutoComplete
                                    id={field.name}
                                    value={
                                        options.find(
                                            (opt) => String(opt.value) === String(controllerField.value)
                                        ) || searchText || ''
                                    }
                                    suggestions={filteredOptions}
                                    completeMethod={handleSearch}
                                    field="label"
                                    dropdown
                                    placeholder={field.placeholder || 'Select...'}
                                    disabled={field.disabled}
                                    className="w-full"
                                    inputClassName={getInputClasses()}
                                    panelClassName="swcs-autocomplete-panel"
                                    panelStyle={{ width: '100%', maxWidth: '100%' }}
                                    appendTo="self"
                                    onFocus={() => setFilteredOptions([...options])}
                                    onChange={(e) => {
                                        if (e.value && typeof e.value === 'object' && 'value' in e.value) {
                                            controllerField.onChange(e.value.value);
                                            setSearchText('');
                                        } else {
                                            setSearchText(String(e.value || ''));
                                        }
                                    }}
                                    onClear={() => {
                                        controllerField.onChange('');
                                        setSearchText('');
                                    }}
                                    onBlur={() => {
                                        controllerField.onBlur();
                                        if (field.onBlur) {
                                            field.onBlur(controllerField.value, formMethods);
                                        }
                                    }}
                                />
                            )}
                        />
                    );
                }
                return (
                    <select
                        id={field.name}
                        {...register(field.name, field.validation)}
                        disabled={field.disabled}
                        multiple={field.multiple}
                        className={`${getInputClasses()} ${error ? '' : 'border-black'}`}
                        onBlur={handleBlur}
                    >
                        <option value="">{field.placeholder || 'Select...'}</option>
                        {field.options?.map((option, index) => (
                            <option
                                key={`${String(option.value)}-${String(option.label)}-${index}`}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'radio': {
                const radioValidation = field.disabled ? undefined : field.validation;
                const hiddenValue = fieldValue ?? '';
                return (
                    <div className="flex flex-wrap gap-4 mt-1">
                        {field.disabled && (
                            <input
                                type="hidden"
                                {...register(field.name, field.validation)}
                                value={hiddenValue}
                            />
                        )}
                        {field.options?.map((option) => (
                            <label key={option.value} className="inline-flex items-center cursor-pointer mr-2.5 radio-wrap">
                                <input
                                    type="radio"
                                    {...register(field.name, radioValidation)}
                                    value={option.value}
                                    disabled={option.disabled || field.disabled}
                                    className="w-4 h-4 mr-2"
                                />
                                <span className="text-sm text-gray-900">{option.label}</span>
                            </label>
                        ))}
                    </div>
                );
            }

            case 'checkbox':
                if (field.options && field.options.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-4 mt-1">
                            {field.options.map((option) => (
                                <label key={option.value} className="inline-flex items-center cursor-pointer mr-2.5 checkbox-wrap">
                                    <input
                                        type="checkbox"
                                        {...register(field.name, field.validation)}
                                        value={option.value}
                                        disabled={option.disabled || field.disabled}
                                        className="w-4 h-4 mr-2"
                                    />
                                    <span className="text-sm text-gray-900 ">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    );
                }
                return (
                    <label className="inline-flex items-center cursor-pointer mr-2.5 checkbox-wrap">
                        <input
                            type="checkbox"
                            {...register(field.name, field.validation)}
                            disabled={field.disabled}
                            className="w-4 h-4 mr-2"
                        />
                        <span className="text-sm text-gray-900">
                            {field.label}
                            {field.validation?.required && <span className="text-red-600 ml-1">*</span>}
                        </span>
                    </label>
                );

            case 'file':
                return (
                    <input
                        id={field.name}
                        type="file"
                        {...register(field.name, field.validation)}
                        accept={field.accept}
                        multiple={field.multiple}
                        disabled={field.disabled}
                        className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    />
                );

            case 'hidden':
                return <input type="hidden" {...register(field.name)} />;

            default:
                return (
                    <input
                        id={field.name}
                        type={field.type}
                        {...register(field.name, field.validation)}
                        placeholder={field.placeholder}
                        disabled={field.disabled}
                        readOnly={field.readOnly}
                        className={getInputClasses()}
                        onBlur={handleBlur}
                    />
                );
        }
    };

    if (field.type === 'hidden') {
        return renderField();
    }

    if (field.type === 'checkbox' && (!field.options || field.options.length === 0)) {
        return (
            <div className={`mb-2.5 ${getColSpanClass()}`}>
                {renderField()}
                {error && <p className="mt-1 text-sm text-red-600 font-medium">{error.message || 'This field is required'}</p>}
                {field.helpText && !error && <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>}
            </div>
        );
    }

    return (
        <div className={`mb-2.5 ${getColSpanClass()}`}>
            <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.validation?.required && <span className="text-red-600 ml-1">*</span>}
            </label>
            {renderField()}
            {error && <p className="mt-1 text-sm text-red-600 font-medium">{error.message || 'This field is required'}</p>}
            {field.helpText && !error && <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>}
        </div>
    );
}
