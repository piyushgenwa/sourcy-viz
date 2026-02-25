'use client';

import { useState } from 'react';
import type {
  AIFeasibilityResult,
  FeasibilityDimension,
  FeasibilityAlternative,
  FeasibilityStatus,
  FeasibilityVerdict,
  CustomizationLevel,
  FeasibilityInput,
} from '@/types/product';

interface FeasibilityResultPanelProps {
  result: AIFeasibilityResult;
  feasibilityInput: FeasibilityInput;
  onStartOver: () => void;
  onBack: () => void;
  onAddSuggestion?: (text: string) => void;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  FeasibilityStatus,
  { bg: string; border: string; text: string; badge: string; icon: string; label: string }
> = {
  feasible: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-700',
    icon: '✓',
    label: 'Feasible',
  },
  'at-risk': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700',
    icon: '!',
    label: 'At Risk',
  },
  infeasible: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-700',
    icon: '✕',
    label: 'Infeasible',
  },
};

const LEVEL_CONFIG: Record<
  CustomizationLevel,
  { color: string; bg: string; border: string; dot: string }
> = {
  1: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  2: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  3: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  4: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  5: { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', dot: 'bg-gray-700' },
};

const VERDICT_CONFIG: Record<
  FeasibilityVerdict,
  { bg: string; border: string; text: string; icon: string; label: string }
> = {
  proceed: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: '✓',
    label: 'Proceed',
  },
  'proceed-with-caution': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    icon: '!',
    label: 'Proceed with Caution',
  },
  reconsider: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    icon: '✕',
    label: 'Reconsider',
  },
};

const LEVEL_NAMES: Record<CustomizationLevel, string> = {
  1: 'Surface Customization',
  2: 'Component-Level',
  3: 'Structural (No Mold)',
  4: 'Mold / Engineering',
  5: 'Multi-Component System',
};

// ─── Dimension card ──────────────────────────────────────────────────────────

function DimensionCard({
  label,
  dimension,
}: {
  label: string;
  dimension: FeasibilityDimension;
}) {
  const cfg = STATUS_CONFIG[dimension.status];
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
          <span>{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${cfg.text}`}>{dimension.headline}</p>
      <p className="mt-1 text-xs text-gray-600 leading-relaxed">{dimension.detail}</p>
      {dimension.risks && dimension.risks.length > 0 && (
        <ul className="mt-2 space-y-1">
          {dimension.risks.map((risk, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
              <span className="mt-0.5 text-gray-400 flex-shrink-0">›</span>
              {risk}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Alternative card ────────────────────────────────────────────────────────

function AlternativeCard({ alternative }: { alternative: FeasibilityAlternative }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 rounded-lg bg-blue-100 p-2">
          <svg
            className="h-4 w-4 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">{alternative.title}</h4>
          <p className="mt-0.5 text-xs text-gray-600">{alternative.description}</p>
          {alternative.tradeoffs.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {alternative.tradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="flex-shrink-0 text-gray-400">·</span>
                  {t}
                </li>
              ))}
            </ul>
          )}
          {alternative.saves && (
            <p className="mt-2 text-xs font-medium text-green-700 bg-green-50 rounded px-2 py-1 inline-block">
              {alternative.saves}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function FeasibilityResultPanel({
  result,
  feasibilityInput,
  onStartOver,
  onBack,
  onAddSuggestion,
}: FeasibilityResultPanelProps) {
  const [suggestionText, setSuggestionText] = useState('');
  const levelCfg = LEVEL_CONFIG[result.classificationLevel];
  const verdictCfg = VERDICT_CONFIG[result.overallVerdict];

  const handleAddSuggestion = () => {
    const trimmed = suggestionText.trim();
    if (!trimmed || !onAddSuggestion) return;
    onAddSuggestion(trimmed);
    setSuggestionText('');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Feasibility Report</h2>
        <p className="mt-1 text-sm text-gray-500">
          Based on your customisation: &ldquo;{feasibilityInput.customizationDescription}&rdquo;
        </p>
      </div>

      {/* Overall verdict banner */}
      <div className={`rounded-xl border ${verdictCfg.border} ${verdictCfg.bg} p-5`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${
            result.overallVerdict === 'proceed'
              ? 'bg-green-200 text-green-800'
              : result.overallVerdict === 'proceed-with-caution'
              ? 'bg-amber-200 text-amber-800'
              : 'bg-red-200 text-red-800'
          }`}>
            {verdictCfg.icon}
          </div>
          <div>
            <p className={`text-sm font-bold ${verdictCfg.text}`}>
              Verdict: {verdictCfg.label}
            </p>
            <p className={`mt-0.5 text-sm ${verdictCfg.text} opacity-90 leading-relaxed`}>
              {result.overallSummary}
            </p>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className={`rounded-xl border ${levelCfg.border} ${levelCfg.bg} p-5`}>
        <div className="flex items-center gap-3">
          <div className={`h-4 w-4 flex-shrink-0 rounded-full ${levelCfg.dot}`} />
          <div>
            <p className={`text-sm font-bold ${levelCfg.color}`}>
              L{result.classificationLevel} — {LEVEL_NAMES[result.classificationLevel]}
            </p>
            <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
              {result.classificationRationale}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Feasibility Dimensions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Feasibility Breakdown
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DimensionCard label="Customisation" dimension={result.customizationFeasibility} />
          <DimensionCard label="MOQ" dimension={result.moqFeasibility} />
          <DimensionCard label="Price" dimension={result.priceFeasibility} />
          <DimensionCard label="Timeline" dimension={result.timelineFeasibility} />
        </div>
      </div>

      {/* Quality & product integrity risks */}
      {result.qualityRisks && result.qualityRisks.length > 0 && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-purple-800">
            Product Integrity &amp; Quality Risks
          </h3>
          <ul className="space-y-2">
            {result.qualityRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-purple-900">
                <span className="flex-shrink-0 mt-0.5 text-purple-400 font-bold">›</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {result.alternatives && result.alternatives.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Alternatives to Consider
          </h3>
          <div className="space-y-3">
            {result.alternatives.map((alt) => (
              <AlternativeCard key={alt.id} alternative={alt} />
            ))}
          </div>
        </div>
      )}

      {/* Add Suggestion */}
      {onAddSuggestion && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Add a suggestion to summary</p>
          <p className="mb-3 text-xs text-gray-400">
            Note a sourcing idea, constraint, or preference — it will be saved to your product summary.
          </p>
          <textarea
            value={suggestionText}
            onChange={(e) => setSuggestionText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddSuggestion();
            }}
            placeholder="e.g. Prefer suppliers with FSC certification, or consider unbranded version for lower MOQ…"
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">⌘↵ to submit</span>
            <button
              onClick={handleAddSuggestion}
              disabled={!suggestionText.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to Summary
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit Inputs
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Start New Design
        </button>
      </div>
    </div>
  );
}
