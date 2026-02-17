'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/flow-store';
import { StepIndicator } from '@/components/ui/step-indicator';
import { RequestForm } from '@/components/request/request-form';
import { RequestReview } from '@/components/request/request-review';
import { VisualizationPanel } from '@/components/visualization/visualization-panel';
import { CustomizationPanel } from '@/components/customization/customization-panel';
import { QuotePanel } from '@/components/customization/quote-panel';
import { KnowledgePanel } from '@/components/knowledge-base/knowledge-panel';

type Tab = 'flow' | 'knowledge';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('flow');
  const store = useFlowStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Sourcy</h1>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Product Request Flow
            </span>
          </div>
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('flow')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'flow'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Request Flow
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
      </header>

      {activeTab === 'flow' && (
        <>
          {/* Step indicator */}
          <div className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-6xl">
              <StepIndicator currentStep={store.currentStep} />
            </div>
          </div>

          {/* Main content */}
          <main className="mx-auto max-w-6xl px-4 py-8">
            {store.currentStep === 'request-entry' && (
              <RequestForm onSubmit={store.submitRequest} />
            )}

            {store.currentStep === 'request-review' && store.request && (
              <RequestReview
                request={store.request}
                requestJson={store.requestJson}
                onConvert={store.convertToJson}
                onStartVisualization={() => {
                  store.convertToJson();
                  store.startVisualizationV1();
                }}
                onBack={() => store.setStep('request-entry')}
              />
            )}

            {store.currentStep === 'visualization-v1' && store.visualizationSession && (
              <VisualizationPanel
                session={store.visualizationSession}
                onSelectItem={store.selectVisualizationItem}
                onFinalize={store.runCustomizationIntelligence}
                onBack={() => store.setStep('request-review')}
                phase="v1"
              />
            )}

            {store.currentStep === 'customization-analysis' && store.customization && (
              <CustomizationPanel
                classification={store.customization}
                onViewAlternativeVisualization={(altId) => store.startVisualizationV2(altId)}
                onProceedToQuote={store.generateQuote}
                onBack={() => store.setStep('visualization-v1')}
              />
            )}

            {store.currentStep === 'visualization-v2' && store.visualizationSession && (
              <VisualizationPanel
                session={store.visualizationSession}
                onSelectItem={store.selectVisualizationItem}
                onFinalize={store.generateQuote}
                onBack={() => store.setStep('customization-analysis')}
                phase="v2"
              />
            )}

            {store.currentStep === 'preliminary-quote' && store.quote && (
              <QuotePanel
                quote={store.quote}
                onViewAlternativeQuote={(altId) => store.startVisualizationV2(altId)}
                onNewRequest={store.reset}
              />
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
