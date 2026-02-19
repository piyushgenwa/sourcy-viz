'use client';

import { useState } from 'react';
import type { FeasibilityInput, GeneratedImageVariant } from '@/types/product';

interface FeasibilityInputPanelProps {
  selectedDesign: GeneratedImageVariant;
  productDescription: string;
  isLoading: boolean;
  onSubmit: (input: FeasibilityInput) => void;
  onBack: () => void;
}

const TIMELINE_OPTIONS = [
  { value: '', label: 'Select timeline…' },
  { value: '2-4 weeks', label: '2–4 weeks' },
  { value: '1-2 months', label: '1–2 months' },
  { value: '2-3 months', label: '2–3 months' },
  { value: '3-6 months', label: '3–6 months' },
  { value: '6+ months', label: '6+ months' },
  { value: 'Flexible', label: 'Flexible / Not urgent' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CNY', 'AUD', 'SGD'];

export function FeasibilityInputPanel({
  selectedDesign,
  productDescription,
  isLoading,
  onSubmit,
  onBack,
}: FeasibilityInputPanelProps) {
  const [customizationDescription, setCustomizationDescription] = useState('');
  const [moqStr, setMoqStr] = useState('');
  const [targetPriceMin, setTargetPriceMin] = useState('');
  const [targetPriceMax, setTargetPriceMax] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timeline, setTimeline] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!customizationDescription.trim()) {
      newErrors.customization = 'Please describe what you want to customise.';
    }
    if (moqStr && (isNaN(Number(moqStr)) || Number(moqStr) <= 0)) {
      newErrors.moq = 'Enter a valid order quantity.';
    }
    if (targetPriceMin && isNaN(Number(targetPriceMin))) {
      newErrors.priceMin = 'Enter a valid minimum price.';
    }
    if (targetPriceMax && isNaN(Number(targetPriceMax))) {
      newErrors.priceMax = 'Enter a valid maximum price.';
    }
    if (
      targetPriceMin &&
      targetPriceMax &&
      Number(targetPriceMin) > Number(targetPriceMax)
    ) {
      newErrors.priceMax = 'Max price must be greater than min price.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      customizationDescription: customizationDescription.trim(),
      moq: moqStr ? Number(moqStr) : null,
      targetPriceMin: targetPriceMin ? Number(targetPriceMin) : null,
      targetPriceMax: targetPriceMax ? Number(targetPriceMax) : null,
      priceCurrency: currency,
      timeline: timeline || '',
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feasibility Check</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tell us the details of your customisation request. We will analyse whether it is feasible by
          suppliers, and flag any MOQ, price, or timeline risks before you commit.
        </p>
      </div>

      {/* Selected design context */}
      <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        {selectedDesign.imageData ? (
          <img
            src={`data:${selectedDesign.imageMimeType};base64,${selectedDesign.imageData}`}
            alt={selectedDesign.name}
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <div
            className={`h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br ${selectedDesign.placeholderGradient}`}
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Selected Design</p>
          <p className="mt-0.5 font-semibold text-gray-900 truncate">{selectedDesign.name}</p>
          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{productDescription}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customization description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What do you want to customise? <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={customizationDescription}
            onChange={(e) => setCustomizationDescription(e.target.value)}
            placeholder="e.g. Add embossed logo on front panel, custom colour in navy blue, branded packaging box with tissue paper insert"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.customization ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.customization && (
            <p className="mt-1 text-xs text-red-600">{errors.customization}</p>
          )}
        </div>

        {/* MOQ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Order Quantity (MOQ)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={moqStr}
              onChange={(e) => setMoqStr(e.target.value)}
              placeholder="e.g. 500"
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.moq ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              units
            </span>
          </div>
          {errors.moq ? (
            <p className="mt-1 text-xs text-red-600">{errors.moq}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Leave blank if not yet determined</p>
          )}
        </div>

        {/* Target price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Target Price per Unit
          </label>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetPriceMin}
              onChange={(e) => setTargetPriceMin(e.target.value)}
              placeholder="Min"
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.priceMin ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetPriceMax}
              onChange={(e) => setTargetPriceMax(e.target.value)}
              placeholder="Max"
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.priceMax ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </div>
          {(errors.priceMin || errors.priceMax) && (
            <p className="mt-1 text-xs text-red-600">{errors.priceMin || errors.priceMax}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">Leave blank if not yet determined</p>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Required Timeline
          </label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {TIMELINE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">How soon do you need the finished product?</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Analysing feasibility…
              </>
            ) : (
              'Run Feasibility Check'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
