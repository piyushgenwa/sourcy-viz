'use client';

import type { VisualizationSession, VisualizationItem } from '@/types/product';
import { Badge } from '@/components/ui/badge';

interface VisualizationPanelProps {
  session: VisualizationSession;
  onSelectItem: (itemId: string, level: number) => void;
  onFinalize: () => void;
  onBack: () => void;
  phase: 'v1' | 'v2';
}

export function VisualizationPanel({
  session,
  onSelectItem,
  onFinalize,
  onBack,
  phase,
}: VisualizationPanelProps) {
  const isV1 = phase === 'v1';
  const hasSelection = session.levels.some((l) => l.items.some((i) => i.selected));
  const isComplete = isV1
    ? session.currentLevel >= 2 && session.levels[2]?.items.some((i) => i.selected)
    : session.levels[0]?.items.some((i) => i.selected);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isV1 ? 'Product Visualization' : 'Alternative Options'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {isV1
              ? 'Select an option to explore variations. We\'ll refine toward your vision through divergence-convergence.'
              : 'Based on customization analysis, here are alternative options to consider.'}
          </p>
        </div>
        <Badge variant={isV1 ? 'info' : 'success'}>
          {isV1 ? `Phase 1` : `Phase 2`}
        </Badge>
      </div>

      {session.levels.map((level, levelIndex) => (
        <div key={levelIndex} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              {levelIndex === 0 ? (isV1 ? 'Initial Options (L0)' : 'Alternatives') : `Refinement L${levelIndex}`}
            </span>
            <span className="text-xs text-gray-400">
              {levelIndex === 0 && isV1 ? '5 varied options' : `${level.items.length} variations`}
            </span>
            {level.parentItemId && (
              <span className="text-xs text-blue-500">
                Branched from selected item
              </span>
            )}
          </div>

          <div
            className={`grid gap-4 ${
              levelIndex === 0 && isV1
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {level.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onSelect={() => onSelectItem(item.id, levelIndex)}
                compact={levelIndex === 0 && isV1}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        {isComplete && (
          <button
            onClick={onFinalize}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isV1 ? 'Run Customization Analysis' : 'Generate Quote'}
          </button>
        )}
        {!isComplete && hasSelection && isV1 && (
          <p className="flex items-center text-sm text-gray-500">
            Continue selecting items at each level to refine your choice (L0 &rarr; L1 &rarr; L2)
          </p>
        )}
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onSelect,
  compact,
}: {
  item: VisualizationItem;
  onSelect: () => void;
  compact: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`group relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
        item.selected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {item.selected && (
        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
          {'\u2713'}
        </div>
      )}

      {/* Placeholder image */}
      <div
        className={`mb-3 flex items-center justify-center rounded-lg bg-gradient-to-br ${item.imagePlaceholder} ${
          compact ? 'h-24' : 'h-32'
        }`}
      >
        <span className="text-2xl opacity-50">
          {'\u{1F4E6}'}
        </span>
      </div>

      <h4 className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
        {item.name}
      </h4>
      <p className={`mt-1 text-gray-500 line-clamp-2 ${compact ? 'text-xs' : 'text-xs'}`}>
        {item.description}
      </p>

      {/* Specs */}
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.entries(item.specs)
          .slice(0, compact ? 2 : 4)
          .map(([key, value]) => (
            <span
              key={key}
              className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
            >
              {key}: {value}
            </span>
          ))}
      </div>

      {/* Price & MOQ */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        {item.estimatedPrice && (
          <span>
            {item.estimatedPrice.currency} {item.estimatedPrice.min?.toFixed(2)}-{item.estimatedPrice.max?.toFixed(2)}
          </span>
        )}
        {item.estimatedMoq && <span>MOQ: {item.estimatedMoq}</span>}
      </div>
    </button>
  );
}
