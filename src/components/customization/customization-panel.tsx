'use client';

import type { CustomizationClassification, AlternativeOption } from '@/types/product';
import { Badge } from '@/components/ui/badge';

interface CustomizationPanelProps {
  classification: CustomizationClassification;
  onViewAlternativeVisualization: (alternativeId: string) => void;
  onProceedToQuote: () => void;
  onBack: () => void;
}

const SEVERITY_STYLES = {
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '\u{2139}\u{FE0F}' },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '\u26A0\u{FE0F}' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '\u{1F6A8}' },
};

export function CustomizationPanel({
  classification,
  onViewAlternativeVisualization,
  onProceedToQuote,
  onBack,
}: CustomizationPanelProps) {
  const { level, levelInfo, feasibilityScore, warnings, alternatives, constraints } = classification;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Customization Analysis</h2>

      {/* Level overview */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{levelInfo.emoji}</span>
              <h3 className="text-lg font-bold text-gray-900">
                Level {level}: {levelInfo.name}
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-600">{levelInfo.coreDefinition}</p>
          </div>
          <FeasibilityGauge score={feasibilityScore} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <LevelDetail label="Typical Forms" value={levelInfo.typicalForms.join(', ')} />
          <LevelDetail label="Development Time" value={levelInfo.developmentTime} />
          <LevelDetail label="Setup Fee" value={levelInfo.setupFee} />
          <LevelDetail label="MOQ Impact" value={levelInfo.moqImpact} />
          <LevelDetail label="Cost Behavior" value={levelInfo.costBehavior} />
          <LevelDetail label="Rework Cost" value={levelInfo.reworkCost} />
          <LevelDetail label="Timeline Risk" value={levelInfo.timelineRisk} />
          <LevelDetail label="Supplier Availability" value={levelInfo.supplierAvailability} />
          <LevelDetail label="Best For" value={levelInfo.bestFor} />
        </div>

        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs font-medium text-amber-800">
            Early Warning: {levelInfo.earlyWarningSignal}
          </p>
        </div>
      </div>

      {/* Constraints */}
      {constraints.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Identified Constraints</h3>
          <div className="space-y-3">
            {constraints.map((c, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <Badge variant={c.severity === 'critical' ? 'error' : c.severity === 'high' ? 'warning' : 'default'}>
                  {c.type.toUpperCase()}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{c.description}</p>
                  <div className="mt-1 flex gap-4 text-xs text-gray-500">
                    <span>Current: <strong>{c.currentValue}</strong></span>
                    <span>Required: <strong>{c.requiredValue}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feasibility warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Feasibility Warnings</h3>
          {warnings.map((w) => {
            const style = SEVERITY_STYLES[w.severity];
            return (
              <div key={w.id} className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
                <div className="flex items-start gap-2">
                  <span>{style.icon}</span>
                  <div>
                    <p className={`text-sm font-medium ${style.text}`}>{w.message}</p>
                    {w.suggestion && (
                      <p className="mt-1 text-xs text-gray-600">
                        Suggestion: {w.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Alternative Options</h3>
          <div className="space-y-4">
            {alternatives.map((alt) => (
              <AlternativeCard
                key={alt.id}
                alternative={alt}
                onVisualize={() => onViewAlternativeVisualization(alt.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={onProceedToQuote}
          className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Proceed to Preliminary Quote
        </button>
      </div>
    </div>
  );
}

function FeasibilityGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';
  const bg = score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-yellow-100' : 'bg-red-100';
  return (
    <div className={`flex flex-col items-center rounded-lg ${bg} px-4 py-2`}>
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-gray-500">Feasibility</span>
    </div>
  );
}

function LevelDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-xs text-gray-800">{value}</dd>
    </div>
  );
}

function AlternativeCard({
  alternative,
  onVisualize,
}: {
  alternative: AlternativeOption;
  onVisualize: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{alternative.description}</h4>
          <div className="mt-2 flex flex-wrap gap-1">
            {alternative.negotiableOn.map((n) => (
              <Badge key={n} variant="info">{n}</Badge>
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {alternative.tradeoffs.map((t, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-gray-400 mt-0.5">&bull;</span>
                {t}
              </li>
            ))}
          </ul>
          {alternative.estimatedSaving && (
            <p className="mt-2 text-xs font-medium text-green-600">{alternative.estimatedSaving}</p>
          )}
        </div>
        <button
          onClick={onVisualize}
          className="ml-3 shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Visualize
        </button>
      </div>
    </div>
  );
}
