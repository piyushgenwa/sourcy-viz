'use client';

import { useEffect, useRef } from 'react';
import type { GeneratedImageVariant } from '@/types/product';

interface SelectionCrumb {
  label: string;
  name: string;
  imageData?: string;
  imageMimeType?: string;
  placeholderGradient: string;
}

interface ImageGalleryPanelProps {
  title: string;
  subtitle: string;
  level: 0 | 1 | 2;
  variants: GeneratedImageVariant[];
  selectedId: string | null;
  selectionPath: SelectionCrumb[]; // previous levels' selections for context
  onSelectVariant: (id: string) => void; // exclusive card selection
  onUpdateVariant: (id: string, update: Partial<GeneratedImageVariant>) => void; // image data updates
  onConfirmSelection: (id: string) => Promise<void> | void;
  onFinalizeSelection?: (id: string) => void; // skip deeper refinements and finalize now
  isLoading: boolean;
  confirmLabel: string; // e.g. "Explore Refinements →" or "Confirm Selection"
  referenceImageData?: string | null;
  referenceImageMimeType?: string | null;
}

export function ImageGalleryPanel({
  title,
  subtitle,
  level,
  variants,
  selectedId,
  selectionPath,
  onSelectVariant,
  onUpdateVariant,
  onConfirmSelection,
  onFinalizeSelection,
  isLoading,
  confirmLabel,
  referenceImageData,
  referenceImageMimeType,
}: ImageGalleryPanelProps) {
  const selected = variants.find((v) => v.id === selectedId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              L{level}
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
          {variants.length} {level === 0 ? 'directions' : 'refinements'}
        </span>
      </div>

      {/* Selection breadcrumb path */}
      {selectionPath.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Your selection path
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {selectionPath.map((crumb, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-lg flex-shrink-0">
                  {crumb.imageData ? (
                    <img
                      src={`data:${crumb.imageMimeType};base64,${crumb.imageData}`}
                      alt={crumb.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${crumb.placeholderGradient}`}
                    />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{crumb.name}</p>
                  <p className="text-xs text-gray-400">{crumb.label}</p>
                </div>
                {i < selectionPath.length - 1 && (
                  <span className="text-gray-300">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image grid */}
      <div
        className={`grid gap-4 ${
          level === 0
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {variants.map((variant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            compact={level === 0}
            isSelected={variant.id === selectedId}
            onSelect={() => onSelectVariant(variant.id)}
            onImageLoaded={(imageData, imageMimeType) =>
              onUpdateVariant(variant.id, {
                imageData,
                imageMimeType,
                isLoading: false,
                hasError: false,
              })
            }
            onImageError={() =>
              onUpdateVariant(variant.id, { isLoading: false, hasError: true })
            }
            referenceImageData={referenceImageData}
            referenceImageMimeType={referenceImageMimeType}
          />
        ))}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
        {selected ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Selected:</span> {selected.name}
            </div>
            <div className="ml-auto flex items-center gap-3">
              {onFinalizeSelection && level < 2 && (
                <button
                  onClick={() => onFinalizeSelection(selectedId!)}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-5 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-40"
                >
                  This looks good
                </button>
              )}
              <button
                onClick={() => onConfirmSelection(selectedId!)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
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
                    Processing…
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Select an image above to continue</p>
        )}
      </div>

      {/* Anchored/flexible aspects legend for selected */}
      {selected && (
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 font-semibold text-gray-500 uppercase tracking-wide">
                Anchored
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.anchoredAspects.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 border border-blue-100"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 font-semibold text-gray-500 uppercase tracking-wide">
                Flexible
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.flexibleAspects.map((a) => (
                  <span
                    key={a}
                    className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 border border-amber-100"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual variant card ──────────────────────────────────────────────────

interface VariantCardProps {
  variant: GeneratedImageVariant;
  compact: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onImageLoaded: (imageData: string, imageMimeType: string) => void;
  onImageError: () => void;
  referenceImageData?: string | null;
  referenceImageMimeType?: string | null;
}

function VariantCard({
  variant,
  compact,
  isSelected,
  onSelect,
  onImageLoaded,
  onImageError,
  referenceImageData,
  referenceImageMimeType,
}: VariantCardProps) {
  const generationFiredRef = useRef(false);

  // Trigger image generation once per variant
  useEffect(() => {
    if (generationFiredRef.current) return;
    if (variant.imageData) return; // already have image
    if (!variant.isLoading && !variant.hasError) return;

    generationFiredRef.current = true;

    let cancelled = false;

    const body: Record<string, string> = { prompt: variant.prompt };
    if (referenceImageData && referenceImageMimeType) {
      body.referenceImageData = referenceImageData;
      body.referenceImageMimeType = referenceImageMimeType;
    }

    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.imageData && data.mimeType) {
          onImageLoaded(data.imageData, data.mimeType);
        } else {
          onImageError();
        }
      })
      .catch(() => {
        if (!cancelled) onImageError();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant.id]);

  const imageHeight = compact ? 'h-28' : 'h-48';

  return (
    <button
      onClick={onSelect}
      className={`group relative rounded-xl border-2 p-3 text-left transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white shadow">
          &#10003;
        </div>
      )}

      {/* Image */}
      <div className={`mb-3 overflow-hidden rounded-lg ${imageHeight}`}>
        {variant.imageData ? (
          <img
            src={`data:${variant.imageMimeType};base64,${variant.imageData}`}
            alt={variant.name}
            className="h-full w-full object-cover"
          />
        ) : variant.isLoading ? (
          <div
            className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${variant.placeholderGradient}`}
          >
            <svg
              className="h-5 w-5 animate-spin text-white/70"
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
            {!compact && (
              <span className="mt-1.5 text-xs text-white/70">Generating…</span>
            )}
          </div>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${variant.placeholderGradient}`}
          >
            <span className="text-2xl opacity-30">&#128246;</span>
          </div>
        )}
      </div>

      {/* Text */}
      <h4 className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
        {variant.name}
      </h4>
      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{variant.description}</p>

      {/* Aspect pills (non-compact only) */}
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1">
          {variant.flexibleAspects.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
