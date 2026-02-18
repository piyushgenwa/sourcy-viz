'use client';

import { useState } from 'react';
import type { ClarificationQuestion } from '@/types/product';

interface ClarificationPanelProps {
  questions: ClarificationQuestion[];
  answers: Record<string, string>;
  onAnswer: (question: string, answer: string) => void;
  onSubmit: () => Promise<void>;
  onSkip: () => Promise<void>;
  isLoading: boolean;
  productDescription: string;
}

export function ClarificationPanel({
  questions,
  answers,
  onAnswer,
  onSubmit,
  onSkip,
  isLoading,
  productDescription,
}: ClarificationPanelProps) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const answeredCount = questions.filter((q) => answers[q.question]).length;
  const allRequired = questions.filter((q) => q.required);
  const requiredAnswered = allRequired.every((q) => answers[q.question]);
  const canSubmit = requiredAnswered && !isLoading;

  const handleOptionSelect = (question: string, option: string) => {
    onAnswer(question, option);
    // Clear custom input if they select a preset option
    if (option !== '__custom__') {
      setCustomInputs((prev) => ({ ...prev, [question]: '' }));
    }
  };

  const handleCustomChange = (question: string, text: string) => {
    setCustomInputs((prev) => ({ ...prev, [question]: text }));
    onAnswer(question, text);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">A Few Quick Questions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Based on: &ldquo;{productDescription.slice(0, 80)}{productDescription.length > 80 ? '…' : ''}&rdquo;
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {answeredCount}/{questions.length}
          </span>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const selected = answers[q.question];
          const isCustomActive = customInputs[q.question] !== undefined && customInputs[q.question].length > 0;

          return (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-3 text-sm font-semibold text-gray-900">
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {qi + 1}
                </span>
                {q.question}
                {q.required && <span className="ml-1 text-red-400">*</span>}
              </p>

              {/* Option buttons */}
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(q.question, opt)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                      selected === opt && !isCustomActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Custom input */}
              {q.allowCustom && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customInputs[q.question] || ''}
                    onChange={(e) => handleCustomChange(q.question, e.target.value)}
                    placeholder="Or describe your own…"
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                      isCustomActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 focus:border-blue-300'
                    }`}
                  />
                </div>
              )}

              {/* Selected indicator */}
              {selected && (
                <p className="mt-2 text-xs text-green-600">
                  Selected: {selected}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Skip — use description only
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating designs…
            </>
          ) : (
            <>
              Generate Designs
              <span className="text-blue-200">&rarr;</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
