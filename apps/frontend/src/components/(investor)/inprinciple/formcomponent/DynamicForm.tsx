'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { DynamicFormConfig, FormStepConfig } from './types';
import FormSection from './FormSection';
import StepIndicator from './StepIndicator';

interface DynamicFormProps {
  config: DynamicFormConfig;
  defaultValues?: Record<string, any>;
  isLoading?: boolean;
  initialStep?: number;
  initialCompletedSteps?: number[];
}

export default function DynamicForm({
  config,
  defaultValues = {},
  isLoading = false,
  initialStep = 0,
  initialCompletedSteps = [],
}: DynamicFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] =
    useState<number[]>(initialCompletedSteps);

  const methods = useForm({
    defaultValues,
    mode: 'onChange',
    shouldUnregister: false,
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

  const areArraysEqual = (a: number[], b: number[]) => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  useEffect(() => {
    if (Number.isFinite(initialStep)) {
      setCurrentStep(initialStep);
    }
  }, [initialStep]);

  useEffect(() => {
    if (!areArraysEqual(completedSteps, initialCompletedSteps)) {
      setCompletedSteps(initialCompletedSteps);
    }
  }, [initialCompletedSteps, completedSteps]);

  const getCurrentStepFieldNames = useCallback((): string[] => {
    const step = config.steps[currentStep];
    const fieldNames: string[] = [];

    step.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (!field.skipStepValidation) {
          fieldNames.push(field.name);
        }
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
      if (config.onStepChange) {
        const result = await config.onStepChange(
          currentStep + 1,
          getValues(),
          {
            fromStep: currentStep,
            toStep: currentStep + 1,
          }
        );

        if (result === false) return;
      } else {
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps([...completedSteps, currentStep]);
        }
      }

      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      if (config.onStepChange) {
        config.onStepChange(currentStep - 1, getValues(), {
          fromStep: currentStep,
          toStep: currentStep - 1,
        });
      }

      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = async (step: number) => {
    const maxCompleted = completedSteps.length
      ? Math.max(...completedSteps)
      : -1;

    const maxAllowed = Math.max(currentStep, maxCompleted);
    const canNavigate = step <= maxAllowed;

    if (config.allowStepNavigation && canNavigate) {
      if (config.onStepChange) {
        const result = await config.onStepChange(step, getValues(), {
          fromStep: currentStep,
          toStep: step,
        });

        if (result === false) return;
      }

      setCurrentStep(step);
    }
  };

  const onSubmit = async (data: any) => {
    if (
      isMultiStep &&
      !completedSteps.includes(currentStep) &&
      !config.onStepChange
    ) {
      setCompletedSteps([...completedSteps, currentStep]);
    }

    await config.onSubmit(data);
  };

  const renderStep = (step: FormStepConfig) => {
    return (
      <div className="caf-title">
        {isMultiStep && (
          <div className="mb-6 hidden">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {step.title}
            </h3>

            {step.description && (
              <p className="text-gray-500 mb-6">
                {step.description}
              </p>
            )}
          </div>
        )}

        {step.sections.map((section) => (
          <FormSection key={section.id} section={section} />
        ))}
      </div>
    );
  };

  const isDisabled = isSubmitting || isLoading;
  const nextButtonText =
    config.nextButtonTextByStep?.[currentStep] || 'Save and Proceed';

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`dynamic-form d-flex gap-3 ${config.className || ''}`}
      >
        {isMultiStep && config.showStepIndicator !== false && (
          <StepIndicator
            steps={config.steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            allowNavigation={config.allowStepNavigation}
          />
        )}

        {/* NEW .other wrapper */}
        <div className="other">
          {renderStep(config.steps[currentStep])}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div>
              {isMultiStep && !isFirstStep && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={isDisabled}
                  className={`px-6 py-2.5 text-gray-700 bg-gray-100 border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-gray-200 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
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
                  className={`px-6 py-2.5 bg-primary text-white border-none rounded-lg font-medium text-sm cursor-pointer transition-all hover:bg-red-700 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {nextButtonText} →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`px-6 py-2.5 bg-green-600 text-white border-none rounded-lg font-medium text-sm cursor-pointer flex items-center gap-2 transition-all hover:bg-green-700 ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isDisabled && (
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
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

