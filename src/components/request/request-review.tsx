'use client';

import type { ProductRequest, ProductRequestJson } from '@/types/product';
import { Badge } from '@/components/ui/badge';

interface RequestReviewProps {
  request: ProductRequest;
  requestJson: ProductRequestJson | null;
  onConvert: () => void;
  onStartVisualization: () => void;
  onBack: () => void;
}

export function RequestReview({
  request,
  requestJson,
  onConvert,
  onStartVisualization,
  onBack,
}: RequestReviewProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Request Review</h2>
        <Badge variant="info">{request.category || 'other'}</Badge>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Product Details</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="Description" value={request.description} />
          <Detail label="Category" value={request.category || 'Not specified'} />
          <Detail label="Size" value={request.size || 'Not specified'} />
          <Detail label="Material" value={request.material || 'Not specified'} />
          <Detail label="Colors" value={request.colors?.join(', ') || 'Not specified'} />
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Customization</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail
            label="Logo"
            value={request.customization.logo ? `${request.customization.logo.type}${request.customization.logo.placement ? ` (${request.customization.logo.placement})` : ''}` : 'None'}
          />
          <Detail
            label="Features"
            value={request.customization.features?.join(', ') || 'None'}
          />
          <Detail
            label="Color Variations"
            value={request.customization.colorVariations?.join(', ') || 'None'}
          />
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Requirements</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail label="MOQ" value={request.moq ? `${request.moq} units` : 'Not specified'} />
          <Detail
            label="Price Target"
            value={
              request.priceTarget
                ? `${request.priceTarget.currency} ${request.priceTarget.min || '?'} - ${request.priceTarget.max || '?'}`
                : 'Not specified'
            }
          />
        </dl>
      </div>

      {requestJson && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">JSON Representation</h3>
          <pre className="overflow-auto rounded bg-gray-900 p-4 text-xs text-green-400">
            {JSON.stringify(requestJson, null, 2)}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Edit
        </button>
        {!requestJson ? (
          <button
            onClick={onConvert}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Convert to JSON
          </button>
        ) : (
          <button
            onClick={onStartVisualization}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start Visualization
          </button>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
