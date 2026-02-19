'use client';

import type { PGEFlowStep } from '@/types/product';

const STEPS: { key: PGEFlowStep; label: string; icon: string }[] = [
  { key: 'product-input', label: 'Describe', icon: '1' },
  { key: 'clarification', label: 'Clarify', icon: '2' },
  { key: 'l0-variants', label: 'Explore', icon: '3' },
  { key: 'l1-variants', label: 'Refine', icon: '4' },
  { key: 'l2-variants', label: 'Detail', icon: '5' },
  { key: 'feasibility-input', label: 'Feasibility', icon: '6' },
  { key: 'feasibility-result', label: 'Report', icon: '7' },
];

const STEP_ORDER: PGEFlowStep[] = [
  'product-input',
  'clarification',
  'l0-variants',
  'l1-variants',
  'l2-variants',
  'complete',           // kept in type but skipped visually
  'feasibility-input',
  'feasibility-result',
];

export function PGEStepIndicator({ currentStep }: { currentStep: PGEFlowStep }) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  // Map visual step index from logical step order (skip 'complete' slot index 5)
  const visualIndex = currentIndex > 5 ? currentIndex - 1 : currentIndex;

  return (
    <div className="flex items-center gap-1 overflow-x-auto px-4 py-3">
      {STEPS.map((step, i) => {
        const isActive = i === visualIndex;
        const isCompleted = i < visualIndex;

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
