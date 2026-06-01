'use client';

import React from 'react';
import { FormStepConfig } from './types';

interface StepIndicatorProps {
    steps: FormStepConfig[];
    currentStep: number;
    completedSteps: number[];
    onStepClick?: (step: number) => void;
    allowNavigation?: boolean;
}

export default function StepIndicator({
    steps,
    currentStep,
    completedSteps,
    onStepClick,
    allowNavigation = false,
}: StepIndicatorProps) {
    const completionPercent = Math.round(
        (Math.min(completedSteps.length, steps.length) / steps.length) * 100
    );
    const handleClick = (index: number, canClick: boolean) => {
        if (allowNavigation && onStepClick && canClick) {
            onStepClick(index);
        }
    };

    const getCircleClasses = (index: number, isCompleted: boolean, isCurrent: boolean, isClickable: boolean) => {
        const baseClasses =
            'w-9 h-9 me-3 rounded-pill flex !border-[#525252] items-center justify-center text-sm transition-all duration-200 shadow-none font-bold';

        if (isCompleted) {
            return `${baseClasses} bg-green-500 text-white ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
        }
        if (isCurrent) {
            return `${baseClasses} bg-primary !border-[#ffefef] text-white ring-4 ring-blue-200 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
        }
        return `${baseClasses} bg-[#ffefef] border border-2 border-[#525252] text-gray-500 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`;
    };

    const getLabelClasses = (isCompleted: boolean, isCurrent: boolean) => {
        const baseClasses = 'flex-1 text-xs font-medium text-start leading-snug line-clamp-2';

        if (isCurrent) {
            return `${baseClasses} text-primary`;
        }
        if (isCompleted) {
            return `${baseClasses} text-green-500`;
        }
        return `${baseClasses} text-gray-500`;
    };

    return (
        <div className="mb-8 bg-[#FFEFEF] p-4 rounded-xl">
            <div className="mb-3 flex justify-end">
                <div className="flex flex-column items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                        {completionPercent}% Completed
                    </span>
                    <div className="h-2 w-[270px] overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full bg-primary"
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex items-start flex-column">
                {steps.map((step, index) => {
                    const isCompleted = completedSteps.includes(index);
                    const isCurrent = index === currentStep;
                    const isClickable =
                        allowNavigation && (isCompleted || isCurrent || index <= currentStep);

                    return (
                        <div key={step.id} className="flex w-100 flex-1 mb-2 flex-column">
                            <div className="flex min-w-[110px] flex-row items-center">
                                <button
                                    type="button"
                                    onClick={() => handleClick(index, isClickable)}
                                    disabled={!isClickable}
                                    className={getCircleClasses(index, isCompleted, isCurrent, isClickable)}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </button>
                                <span className={getLabelClasses(isCompleted, isCurrent)}>
                                    {step.title}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-none h-[30px] w-[2px] ml-[18px] mt-2 rounded ${completedSteps.includes(index) ? 'bg-green-500' : 'bg-[#D3B3B3]'}`}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
