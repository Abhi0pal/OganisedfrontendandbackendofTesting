
'use client';

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSectionConfig } from './types';
import FormField from './FormField';
import AddMoreField from './AddMoreField';

interface FormSectionProps {
  section: FormSectionConfig;
}

export default function FormSection({ section }: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(section.defaultCollapsed || false);

  // Get a richer context so custom renderers have what they need
  const formCtx = useFormContext();
  const { watch, setValue, getValues, control, formState, trigger, register } = formCtx;

  // Dependency handling (show/hide section)
  if (section.dependsOn) {
    const watchedValue = watch(section.dependsOn.field);
    const targetValues = Array.isArray(section.dependsOn.value)
      ? section.dependsOn.value
      : [section.dependsOn.value];
    const conditionMet = targetValues.includes(watchedValue);
    const shouldShow = section.dependsOn.show ? conditionMet : !conditionMet;
    if (!shouldShow) return null;
  }

  const getGridClasses = () => {
    const cols = section.columns || 2;
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  // Build a render context object to pass into field.render(...)
  const buildRenderCtx = (field: any) => ({
    // react-hook-form helpers
    watch,
    setValue,
    getValues,
    control,
    formState,
    trigger,
    register,
    // current section/field meta if a custom renderer wants it
    section,
    field,
  });

  return (
    <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden p-2.5">
      <div
        className={`px-4 py-3 flex items-center justify-between ${section.collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => section.collapsible && setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h4 className="text-base font-semibold text-gray-800 m-0">{section.title}</h4>
          {section.description && <p className="text-sm text-gray-500 mt-1 mb-0">{section.description}</p>}
        </div>
        {section.collapsible && (
          <button
            type="button"
            className="p-1 text-gray-400 bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors hover:text-gray-600"
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4">
          <div className={`grid gap-4 ${getGridClasses()}`}>
            {section.fields.map((field) => {
              // ✅ Custom field rendering (call with a single context argument)
              if (field.type === 'custom' && field.render) {
                return (
                  <div
                    key={field.name}
                    className={`col-span-${field.colSpan || section.columns}`}
                  >
                    {field.render(buildRenderCtx(field))}
                  </div>
                );
              }

              // ✅ Add More field rendering (full width table)
              if (field.type === 'addmore' && field.addMoreConfig) {
                return (
                  <div
                    key={field.name}
                    className={`col-span-${field.colSpan || section.columns}`}
                  >
                    <AddMoreField field={field} />
                  </div>
                );
              }

              // ✅ Default field rendering
              return <FormField key={field.name} field={field} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
