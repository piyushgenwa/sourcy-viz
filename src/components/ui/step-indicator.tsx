'use client';

import type { FlowStep } from '@/types/product';

const STEPS: { key: FlowStep; label: string; icon: string }[] = [
  { key: 'request-entry', label: 'Request', icon: '1' },
  { key: 'request-review', label: 'Review', icon: '2' },
  { key: 'visualization-v1', label: 'Visualize', icon: '3' },
  { key: 'customization-analysis', label: 'Customize', icon: '4' },
  { key: 'visualization-v2', label: 'Alternatives', icon: '5' },
  { key: 'preliminary-quote', label: 'Quote', icon: '6' },
];

export function StepIndicator({ currentStep }: { currentStep: FlowStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? '\u2713' : step.icon}
              </div>
              <span
                className={`mt-1 text-xs whitespace-nowrap ${
                  isActive ? 'font-semibold text-blue-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-6 sm:w-10 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
