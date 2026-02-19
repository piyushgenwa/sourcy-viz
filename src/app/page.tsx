'use client';

import { useState } from 'react';
import { usePGEStore } from '@/store/pge-store';
import { PGEStepIndicator } from '@/components/pge/pge-step-indicator';
import { ProductInputPanel } from '@/components/pge/product-input-panel';
import { ClarificationPanel } from '@/components/pge/clarification-panel';
import { ImageGalleryPanel } from '@/components/pge/image-gallery-panel';
import { KnowledgePanel } from '@/components/knowledge-base/knowledge-panel';
import { FeasibilityInputPanel } from '@/components/feasibility/feasibility-input-panel';
import { FeasibilityResultPanel } from '@/components/feasibility/feasibility-result-panel';
import type { GeneratedImageVariant } from '@/types/product';

type Tab = 'flow' | 'knowledge';

function selectionCrumb(variant: GeneratedImageVariant | null, label: string) {
  if (!variant) return null;
  return {
    label,
    name: variant.name,
    imageData: variant.imageData,
    imageMimeType: variant.imageMimeType,
    placeholderGradient: variant.placeholderGradient,
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('flow');
  const store = usePGEStore();

  const l0SelectedId = store.l0Variants.find((v) => v.selected)?.id ?? null;
  const l1SelectedId = store.l1Variants.find((v) => v.selected)?.id ?? null;
  const l2SelectedId = store.l2Variants.find((v) => v.selected)?.id ?? null;

  const l0Crumb = selectionCrumb(store.selectedL0, 'L0 · Initial');
  const l1Crumb = selectionCrumb(store.selectedL1, 'L1 · Refined');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Sourcy</h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Visual Design Flow
            </span>
          </div>
          <div className="flex items-center gap-3">
            {store.step !== 'product-input' && (
              <button
                onClick={store.reset}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Start over
              </button>
            )}
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('flow')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'flow'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Design Flow
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'knowledge'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Knowledge Base
              </button>
            </nav>
          </div>
        </div>
      </header>

      {activeTab === 'flow' && (
        <>
          {/* Step indicator */}
          <div className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl">
              <PGEStepIndicator currentStep={store.step} />
            </div>
          </div>

          {/* Error banner */}
          {store.error && (
            <div className="mx-auto mt-4 max-w-6xl px-4">
              <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-medium">Error:</span> {store.error}
                <button
                  onClick={() => usePGEStore.setState({ error: null })}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {/* Main content */}
          <main className="mx-auto max-w-6xl px-4 py-8">
            {/* ── Step 1: Product description input ── */}
            {store.step === 'product-input' && (
              <ProductInputPanel
                value={store.productDescription}
                onChange={store.setProductDescription}
                onSubmit={store.runPGE1}
                isLoading={store.isLoading}
              />
            )}

            {/* ── Step 2: PGE1 clarification questions ── */}
            {store.step === 'clarification' && (
              <ClarificationPanel
                questions={store.clarificationQuestions}
                answers={store.userAnswers}
                onAnswer={store.setAnswer}
                onSubmit={store.submitAnswers}
                onSkip={store.skipClarification}
                isLoading={store.isLoading}
                productDescription={store.productDescription}
              />
            )}

            {/* ── Step 3: L0 — 5 initial image variations (PGE2 output) ── */}
            {store.step === 'l0-variants' && (
              <ImageGalleryPanel
                title="Initial Directions"
                subtitle="PGE2 generated 5 diverse design directions. Select the one that resonates most."
                level={0}
                variants={store.l0Variants}
                selectedId={l0SelectedId}
                selectionPath={[]}
                onSelectVariant={(id) => store.selectVariant(0, id)}
                onUpdateVariant={(id, update) => store.updateVariant(0, id, update)}
                onConfirmSelection={store.selectL0}
                isLoading={store.isLoading}
                confirmLabel="Explore Refinements →"
              />
            )}

            {/* ── Step 4: L1 — 3 refinements (PGE3 run 1) ── */}
            {store.step === 'l1-variants' && (
              <ImageGalleryPanel
                title="First Refinements"
                subtitle="PGE3 generated 3 focused refinements anchored to your L0 selection."
                level={1}
                variants={store.l1Variants}
                selectedId={l1SelectedId}
                selectionPath={l0Crumb ? [l0Crumb] : []}
                onSelectVariant={(id) => store.selectVariant(1, id)}
                onUpdateVariant={(id, update) => store.updateVariant(1, id, update)}
                onConfirmSelection={store.selectL1}
                isLoading={store.isLoading}
                confirmLabel="Go Deeper →"
              />
            )}

            {/* ── Step 5: L2 — 3 deep refinements (PGE3 run 2) ── */}
            {(store.step === 'l2-variants' || store.step === 'complete') && (
              <ImageGalleryPanel
                title="Deep Refinements"
                subtitle="PGE3 generated final micro-variations. Select your preferred design."
                level={2}
                variants={store.l2Variants}
                selectedId={l2SelectedId}
                selectionPath={[l0Crumb, l1Crumb].filter(Boolean) as NonNullable<typeof l0Crumb>[]}
                onSelectVariant={(id) => store.selectVariant(2, id)}
                onUpdateVariant={(id, update) => store.updateVariant(2, id, update)}
                onConfirmSelection={(id) => {
                  store.selectL2(id);
                }}
                isLoading={store.isLoading}
                confirmLabel="Confirm Selection ✓"
              />
            )}

            {/* ── Complete state summary ── */}
            {store.step === 'complete' && store.selectedL2 && (
              <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
                <div className="flex items-start gap-4">
                  {store.selectedL2.imageData && (
                    <img
                      src={`data:${store.selectedL2.imageMimeType};base64,${store.selectedL2.imageData}`}
                      alt={store.selectedL2.name}
                      className="h-24 w-24 flex-shrink-0 rounded-xl object-cover shadow"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">&#10003;</span>
                      <h3 className="text-lg font-bold text-gray-900">Design Selected</h3>
                    </div>
                    <p className="mt-1 font-semibold text-gray-800">{store.selectedL2.name}</p>
                    <p className="mt-1 text-sm text-gray-600">{store.selectedL2.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {store.selectedL2.anchoredAspects.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={store.reset}
                    className="rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                  >
                    Start new design
                  </button>
                  <button
                    onClick={store.goToFeasibilityInput}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Check Feasibility →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 7: Feasibility input form ── */}
            {store.step === 'feasibility-input' && store.selectedL2 && (
              <FeasibilityInputPanel
                selectedDesign={store.selectedL2}
                productDescription={store.productDescription}
                isLoading={store.isLoading}
                onSubmit={store.runFeasibilityCheck}
                onBack={() => usePGEStore.setState({ step: 'complete' })}
              />
            )}

            {/* ── Step 8: Feasibility result report ── */}
            {store.step === 'feasibility-result' &&
              store.feasibilityResult &&
              store.feasibilityInput && (
                <FeasibilityResultPanel
                  result={store.feasibilityResult}
                  feasibilityInput={store.feasibilityInput}
                  onBack={() => usePGEStore.setState({ step: 'feasibility-input' })}
                  onStartOver={store.reset}
                />
              )}

            {/* Loading overlay (full-panel blocker while PGE is calling AI) */}
            {store.isLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{store.loadingMessage}</p>
                </div>
              </div>
            )}
          </main>
        </>
      )}

      {activeTab === 'knowledge' && (
        <main className="mx-auto max-w-6xl px-4 py-8">
          <KnowledgePanel />
        </main>
      )}
    </div>
  );
}
