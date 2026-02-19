'use client';

import { useEffect, useRef } from 'react';
import type { HeroBannerVariant } from '@/types/product';

interface HeroBannerPanelProps {
  views: HeroBannerVariant[];
  error: string | null;
  onUpdateView: (id: string, update: Partial<HeroBannerVariant>) => void;
}

const VIEW_LABELS: Record<string, { label: string; icon: string; description: string }> = {
  'hero-front': {
    label: 'Front View',
    icon: '⬛',
    description: 'Direct frontal perspective',
  },
  'hero-side': {
    label: 'Side View',
    icon: '▬',
    description: '90° profile perspective',
  },
  'hero-top': {
    label: 'Top View',
    icon: '⬜',
    description: "Bird's-eye overhead perspective",
  },
};

interface ViewCardProps {
  view: HeroBannerVariant;
  onImageLoaded: (imageData: string, mimeType: string) => void;
  onImageError: () => void;
}

function ViewCard({ view, onImageLoaded, onImageError }: ViewCardProps) {
  const generationFiredRef = useRef(false);

  useEffect(() => {
    if (generationFiredRef.current) return;
    if (view.imageData) return;
    if (!view.isLoading && !view.hasError) return;

    generationFiredRef.current = true;

    let cancelled = false;

    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: view.prompt }),
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
  }, [view.id]);

  const meta = VIEW_LABELS[view.id] ?? {
    label: view.name,
    icon: '□',
    description: view.description,
  };

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:z-10 hover:shadow-xl">
      {/* Image area */}
      <div className="relative h-64 w-full overflow-hidden rounded-t-xl bg-gray-50">
        {view.imageData ? (
          <img
            src={`data:${view.imageMimeType};base64,${view.imageData}`}
            alt={meta.label}
            className="h-full w-full object-cover"
          />
        ) : view.hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-red-50 text-red-400">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span className="text-xs font-medium">Generation failed</span>
          </div>
        ) : (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br ${view.placeholderGradient}`}
          >
            <svg
              className="h-8 w-8 animate-spin text-white/80"
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
            <span className="text-xs font-semibold text-white/90">Generating {meta.label}…</span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
        <p className="mt-0.5 text-xs text-gray-500">{meta.description}</p>
      </div>
    </div>
  );
}

export function HeroBannerPanel({ views, error, onUpdateView }: HeroBannerPanelProps) {
  const isGenerating = views.length === 0 && !error;
  const hasViews = views.length > 0;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
          4
        </div>
        <h3 className="text-base font-semibold text-gray-900">Hero Banner Views</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
          PGE4
        </span>
      </div>
      <p className="mb-5 text-sm text-gray-500">
        Studio renders of your finalised product from three perspectives — front, side, and top.
        All images use a professional studio environment with a plain background toned to complement
        the product.
      </p>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Generating prompt state (PGE4 call in progress) */}
      {isGenerating && !error && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <span className="text-sm text-gray-500">Generating view prompts…</span>
        </div>
      )}

      {/* Three view cards */}
      {hasViews && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {views.map((view) => (
            <ViewCard
              key={view.id}
              view={view}
              onImageLoaded={(imageData, mimeType) =>
                onUpdateView(view.id, { imageData, imageMimeType: mimeType, isLoading: false })
              }
              onImageError={() => onUpdateView(view.id, { hasError: true, isLoading: false })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
