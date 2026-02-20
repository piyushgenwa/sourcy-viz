'use client';

import type { GeneratedImageVariant, FeasibilityInput } from '@/types/product';

interface ProductSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productDescription: string;
  userAnswers: Record<string, string>;
  selectedDesign: GeneratedImageVariant | null;
  feasibilityInput: FeasibilityInput | null;
  suggestions: string[];
}

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-400">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
      Pending
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {value ? (
        <span className="text-sm text-gray-900">{value}</span>
      ) : (
        <PendingBadge />
      )}
    </div>
  );
}

export function ProductSummaryModal({
  isOpen,
  onClose,
  productDescription,
  userAnswers,
  selectedDesign,
  feasibilityInput,
  suggestions,
}: ProductSummaryModalProps) {
  if (!isOpen) return null;

  const hasAnswers = Object.keys(userAnswers).length > 0;
  const hasFeasibility = feasibilityInput !== null;

  const formatPriceRange = () => {
    if (!feasibilityInput) return null;
    const { targetPriceMin, targetPriceMax, priceCurrency } = feasibilityInput;
    if (targetPriceMin == null && targetPriceMax == null) return null;
    const currency = priceCurrency || 'USD';
    if (targetPriceMin != null && targetPriceMax != null) {
      return `${currency} ${targetPriceMin} – ${targetPriceMax}`;
    }
    if (targetPriceMin != null) return `${currency} ${targetPriceMin}+`;
    return `${currency} up to ${targetPriceMax}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative my-8 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Product Summary</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fills in as you progress through each step</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Product */}
          <div>
            <SectionLabel>Product</SectionLabel>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              {productDescription ? (
                <p className="text-sm text-gray-900 leading-relaxed">{productDescription}</p>
              ) : (
                <PendingBadge />
              )}
            </div>
          </div>

          {/* Design Brief (clarification answers) */}
          <div>
            <SectionLabel>Design Brief</SectionLabel>
            {hasAnswers ? (
              <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                {Object.entries(userAnswers).map(([question, answer]) => (
                  <div key={question} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-gray-500 leading-snug">{question}</span>
                    <span className="text-sm text-gray-900">{answer}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <PendingBadge />
              </div>
            )}
          </div>

          {/* Selected Design */}
          <div>
            <SectionLabel>Selected Design</SectionLabel>
            {selectedDesign ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex gap-3">
                  {selectedDesign.imageData ? (
                    <img
                      src={`data:${selectedDesign.imageMimeType};base64,${selectedDesign.imageData}`}
                      alt={selectedDesign.name}
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className={`h-16 w-16 flex-shrink-0 rounded-lg bg-gradient-to-br ${selectedDesign.placeholderGradient}`} />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedDesign.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500 leading-snug">{selectedDesign.description}</p>
                    {selectedDesign.anchoredAspects.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {selectedDesign.anchoredAspects.map((a) => (
                          <span key={a} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <PendingBadge />
              </div>
            )}
          </div>

          {/* Sourcing Requirements */}
          <div>
            <SectionLabel>Sourcing Requirements</SectionLabel>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <FieldRow
                  label="Customisation"
                  value={feasibilityInput?.customizationDescription || null}
                />
                <FieldRow
                  label="MOQ"
                  value={hasFeasibility && feasibilityInput!.moq != null ? `${feasibilityInput!.moq} units` : null}
                />
                <FieldRow
                  label="Price Range"
                  value={formatPriceRange()}
                />
                <FieldRow
                  label="Timeline"
                  value={feasibilityInput?.timeline || null}
                />
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <SectionLabel>Suggestions</SectionLabel>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-blue-400 font-bold text-xs">#{i + 1}</span>
                    <p className="text-sm text-blue-900 leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
