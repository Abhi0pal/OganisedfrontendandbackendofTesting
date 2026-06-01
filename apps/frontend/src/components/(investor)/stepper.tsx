'use client';

interface StepperProps {
  steps: string[];
  activeStep: number;
}

export default function Stepper({ steps, activeStep }: StepperProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = activeStep === stepNumber;
          const isCompleted = activeStep > stepNumber;

          return (
            <div key={`step-${index}`} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-[110px] flex-col items-center">
                <div
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-md border-2
                    ${isCompleted ? 'bg-green-600 text-white border-green-600' : ''}
                    ${isActive ? 'bg-primary text-white border-blue-600' : ''}
                    ${!isActive && !isCompleted ? 'border-gray-400 text-gray-500' : ''}
                  `}
                >
                  {stepNumber}
                </div>
                <p className="mt-2 text-center text-xs leading-snug text-gray-700 investor-stepper-label">{label}</p>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-2
                    ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                  `}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
