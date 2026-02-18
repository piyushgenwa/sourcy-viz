'use client';

import { useState } from 'react';

interface ProductInputPanelProps {
  value: string;
  onChange: (desc: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
}

const EXAMPLES = [
  'A premium leather laptop bag for urban professionals, structured silhouette, fits 15" laptop',
  'A minimalist kraft paper tote bag with rope handles for a sustainable lifestyle brand',
  'A luxury rigid gift box for cosmetics with magnetic closure and soft-touch finish',
];

export function ProductInputPanel({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ProductInputPanelProps) {
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onSubmit();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Describe Your Product</h2>
        <p className="mt-2 text-gray-500">
          Tell us what you want to visualize. Be as specific or as broad as you like — we&apos;ll
          ask the right follow-up questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`rounded-xl border-2 transition-colors ${
            focused ? 'border-blue-500' : 'border-gray-200'
          } bg-white`}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. A leather tote bag for professionals with a structured shape, internal laptop sleeve, and a minimal logo emboss..."
            rows={5}
            className="w-full resize-none rounded-xl bg-transparent px-4 pt-4 text-gray-900 placeholder-gray-400 outline-none text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
            <span className="text-xs text-gray-400">{value.length} characters</span>
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze
                  <span className="text-blue-200">&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Example prompts */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Try an example
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="w-full rounded-lg border border-dashed border-gray-200 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
