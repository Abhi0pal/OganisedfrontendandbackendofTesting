'use client';

import React, { useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { DynamicFormConfig, FormStepConfig } from './types';
import FormSection from './FormSection';
import StepIndicator from './StepIndicator';

interface DynamicFormProps {
    config: DynamicFormConfig;
    defaultValues?: Record<string, any>;
    isLoading?: boolean;
}

export default function DynamicForm({
    config,
    defaultValues = {},
    isLoading = false,
}: DynamicFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    const methods = useForm({
        defaultValues,
        mode: 'onChange',
    });

    const {
        handleSubmit,
        trigger,
        getValues,
        formState: { isSubmitting },
    } = methods;

    const totalSteps = config.steps.length;
    const isMultiStep = totalSteps > 1;
    const isLastStep = currentStep === totalSteps - 1;
    const isFirstStep = currentStep === 0;

    const getCurrentStepFieldNames = useCallback((): string[] => {
        const step = config.steps[currentStep];
        const fieldNames: string[] = [];
        step.sections.forEach((section) => {
            section.fields.forEach((field) => {
                fieldNames.push(field.name);
            });
        });
        return fieldNames;
    }, [config.steps, currentStep]);

    const validateCurrentStep = async (): Promise<boolean> => {
        const fieldNames = getCurrentStepFieldNames();
        const isValid = await trigger(fieldNames);
        return isValid;
    };

    const handleNext = async () => {
        const shouldValidate = config.validateOnStepChange !== false;
        const isValid = shouldValidate ? await validateCurrentStep() : true;
        if (isValid) {
            if (!completedSteps.includes(currentStep)) {
                setCompletedSteps([...completedSteps, currentStep]);
            }
            if (config.onStepChange) {
                config.onStepChange(currentStep + 1, getValues());
            }
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstStep) {
            if (config.onStepChange) {
                config.onStepChange(currentStep - 1, getValues());
            }
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepClick = (step: number) => {
        if (config.allowStepNavigation) {
            if (config.onStepChange) {
                config.onStepChange(step, getValues());
            }
            setCurrentStep(step);
        }
    };

    const onSubmit = async (data: any) => {
        if (isMultiStep && !completedSteps.includes(currentStep)) {
            setCompletedSteps([...completedSteps, currentStep]);
        }
        await config.onSubmit(data);
    };

    const renderStep = (step: FormStepConfig) => {
        return (
            <div>
                {isMultiStep && (
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                        {step.description && <p className="text-gray-500 mb-6">{step.description}</p>}
                    </div>
                )}
                {step.sections.map((section) => (
                    <FormSection key={section.id} section={section} />
                ))}
            </div>
        );
    };

    const isDisabled = isSubmitting || isLoading;

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className={`dynamic-form d-flex gap-3 ${config.className || ''}`}>
                {isMultiStep && config.showStepIndicator !== false && (
                    <StepIndicator
                        steps={config.steps}
                        currentStep={currentStep}
                        completedSteps={completedSteps}
                        onStepClick={handleStepClick}
                        allowNavigation={config.allowStepNavigation}
                    />
                )}

                <div className="other flex-1">
                    {renderStep(config.steps[currentStep])}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                        <div>
                            {isMultiStep && !isFirstStep && (
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    disabled={isDisabled}
                                    className={`px-6 py-2.5 text-gray-700 bg-gray-100 border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-gray-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    ← Previous
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {isMultiStep && !isLastStep ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={isDisabled}
                                    className={`px-6 py-2.5 bg-primary text-white border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-red-700 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isDisabled}
                                    className={`px-6 py-2.5 bg-green-600 text-white border-none rounded-lg font-medium text-sm cursor-pointer flex items-center gap-2 transition-all hover:bg-green-700 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {isDisabled && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    )}
                                    {config.submitButtonText || 'Submit'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
