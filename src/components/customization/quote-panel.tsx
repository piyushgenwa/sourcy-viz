'use client';

import type { PreliminaryQuote } from '@/types/product';
import { Badge } from '@/components/ui/badge';

interface QuotePanelProps {
  quote: PreliminaryQuote;
  onViewAlternativeQuote: (altId: string) => void;
  onNewRequest: () => void;
}

export function QuotePanel({ quote, onViewAlternativeQuote, onNewRequest }: QuotePanelProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Preliminary Quote</h2>
        <Badge variant="success">Draft</Badge>
      </div>

      {/* Selected product */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Selected Product</h3>
        <div className="flex gap-4">
          <div
            className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${quote.selectedItem.imagePlaceholder}`}
          >
            <span className="text-2xl opacity-50">{'\u{1F4E6}'}</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{quote.selectedItem.name}</h4>
            <p className="mt-1 text-sm text-gray-500">{quote.selectedItem.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {Object.entries(quote.selectedItem.specs).map(([key, value]) => (
                <span key={key} className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quote details */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Quote Details</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <QuoteDetail
            label="Unit Price"
            value={`${quote.unitPrice.currency} ${quote.unitPrice.min?.toFixed(2)} - ${quote.unitPrice.max?.toFixed(2)}`}
          />
          <QuoteDetail label="MOQ" value={`${quote.moq.toLocaleString()} units`} />
          <QuoteDetail label="Setup Fees" value={`$${quote.setupFees.toLocaleString()}`} />
          <QuoteDetail label="Lead Time" value={quote.leadTime} />
        </div>

        {/* Customization level summary */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">{quote.customization.levelInfo.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Level {quote.customization.level}: {quote.customization.levelInfo.name}
              </p>
              <p className="text-xs text-gray-500">
                Feasibility Score: {quote.customization.feasibilityScore}/100
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & warnings */}
      {quote.notes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="mb-3 text-sm font-semibold text-amber-800">Important Notes</h3>
          <ul className="space-y-2">
            {quote.notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="mt-0.5 text-amber-500">{'\u26A0\u{FE0F}'}</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternative quotes */}
      {quote.alternatives.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Alternative Quotes</h3>
          <div className="space-y-3">
            {quote.alternatives.map((alt) => (
              <div key={alt.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{alt.description}</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>
                        Price: {alt.unitPrice.currency} {alt.unitPrice.min?.toFixed(2)}-{alt.unitPrice.max?.toFixed(2)}
                      </span>
                      <span>MOQ: {alt.moq.toLocaleString()}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {alt.tradeoffs.map((t, i) => (
                        <li key={i} className="flex items-start gap-1 text-xs text-gray-600">
                          <span className="text-gray-400">&bull;</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => onViewAlternativeQuote(alt.id)}
                    className="ml-3 shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total estimate */}
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 text-lg font-semibold text-blue-900">Estimated Total</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-600">Product Cost</p>
            <p className="text-lg font-bold text-blue-900">
              {quote.unitPrice.currency} {((quote.unitPrice.max || 0) * quote.moq).toLocaleString()}
            </p>
            <p className="text-xs text-blue-500">
              ({quote.unitPrice.max?.toFixed(2)} x {quote.moq.toLocaleString()})
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Setup Fees</p>
            <p className="text-lg font-bold text-blue-900">
              ${quote.setupFees.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Est. Total</p>
            <p className="text-lg font-bold text-blue-900">
              {quote.unitPrice.currency}{' '}
              {((quote.unitPrice.max || 0) * quote.moq + quote.setupFees).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onNewRequest}
          className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          New Request
        </button>
      </div>
    </div>
  );
}

function QuoteDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
