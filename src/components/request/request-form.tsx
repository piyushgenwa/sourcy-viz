'use client';

import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import type { ProductRequest, ProductCategory, LogoSpec } from '@/types/product';
import { parseTextRequest } from '@/lib/request-parser';

interface RequestFormProps {
  onSubmit: (request: ProductRequest) => void;
}

type InputMode = 'text' | 'progressive';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'bags-leather', label: 'Bags & Leather Goods' },
  { value: 'packaging-paper', label: 'Paper Packaging' },
  { value: 'packaging-box', label: 'Box Packaging' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'homeware', label: 'Homeware' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'cosmetics', label: 'Cosmetics' },
  { value: 'food-packaging', label: 'Food Packaging' },
  { value: 'other', label: 'Other' },
];

const LOGO_TYPES: { value: LogoSpec['type']; label: string }[] = [
  { value: 'printing', label: 'Printing' },
  { value: 'embossing', label: 'Embossing' },
  { value: 'engraving', label: 'Engraving' },
  { value: 'heat-press', label: 'Heat Press' },
  { value: 'label', label: 'Label' },
  { value: 'rubber-tag', label: 'Rubber Tag' },
];

export function RequestForm({ onSubmit }: RequestFormProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [rawText, setRawText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<ProductRequest> | null>(null);

  // Progressive input state
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [size, setSize] = useState('');
  const [material, setMaterial] = useState('');
  const [colors, setColors] = useState('');
  const [logoType, setLogoType] = useState<LogoSpec['type'] | ''>('');
  const [logoPlacement, setLogoPlacement] = useState('');
  const [features, setFeatures] = useState('');
  const [colorVariations, setColorVariations] = useState('');
  const [moq, setMoq] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleTextParse = () => {
    if (!rawText.trim()) return;
    const parsed = parseTextRequest(rawText);
    setParsedPreview(parsed);
  };

  const handleTextSubmit = () => {
    if (!parsedPreview) return;
    const request: ProductRequest = {
      id: parsedPreview.id || uuid(),
      description: parsedPreview.description || rawText,
      size: parsedPreview.size,
      material: parsedPreview.material,
      colors: parsedPreview.colors || [],
      customization: parsedPreview.customization || {},
      category: parsedPreview.category || 'other',
      priceTarget: parsedPreview.priceTarget,
      moq: parsedPreview.moq,
      rawText,
      createdAt: parsedPreview.createdAt || new Date().toISOString(),
    };
    onSubmit(request);
  };

  const handleProgressiveSubmit = () => {
    const request: ProductRequest = {
      id: uuid(),
      description,
      size: size || undefined,
      material: material || undefined,
      colors: colors ? colors.split(',').map((c) => c.trim()) : [],
      customization: {
        logo: logoType ? { type: logoType, placement: logoPlacement || undefined } : undefined,
        features: features ? features.split(',').map((f) => f.trim()) : [],
        colorVariations: colorVariations ? colorVariations.split(',').map((c) => c.trim()) : [],
      },
      category,
      priceTarget:
        priceMax
          ? {
              min: priceMin ? parseFloat(priceMin) : undefined,
              max: parseFloat(priceMax),
              currency,
            }
          : undefined,
      moq: moq ? parseInt(moq) : undefined,
      createdAt: new Date().toISOString(),
    };
    onSubmit(request);
  };

  const progressiveSteps = [
    // Step 0: Product description
    <div key="desc" className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Product Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your product... e.g., Leather tote bag with custom branding"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        rows={3}
      />
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </div>,

    // Step 1: Physical specs
    <div key="specs" className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Size / Dimensions</label>
      <input
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="e.g., 30x20x10cm, Medium, Standard"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
      <label className="block text-sm font-medium text-gray-700">Material</label>
      <input
        value={material}
        onChange={(e) => setMaterial(e.target.value)}
        placeholder="e.g., PU leather, kraft paper, cotton canvas"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
      <label className="block text-sm font-medium text-gray-700">Colors (comma-separated)</label>
      <input
        value={colors}
        onChange={(e) => setColors(e.target.value)}
        placeholder="e.g., black, navy, brown"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
    </div>,

    // Step 2: Customization
    <div key="custom" className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Logo Type</label>
      <select
        value={logoType}
        onChange={(e) => setLogoType(e.target.value as LogoSpec['type'] | '')}
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      >
        <option value="">No logo</option>
        {LOGO_TYPES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      {logoType && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Logo Placement</label>
          <input
            value={logoPlacement}
            onChange={(e) => setLogoPlacement(e.target.value)}
            placeholder="e.g., front center, bottom right"
            className="w-full rounded-lg border border-gray-300 p-3 text-sm"
          />
        </div>
      )}
      <label className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
      <input
        value={features}
        onChange={(e) => setFeatures(e.target.value)}
        placeholder="e.g., d-ring, hardware, zipper, custom box"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
      <label className="block text-sm font-medium text-gray-700">Color Variations (comma-separated)</label>
      <input
        value={colorVariations}
        onChange={(e) => setColorVariations(e.target.value)}
        placeholder="e.g., light brown variant, dark brown variant"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
    </div>,

    // Step 3: Requirements
    <div key="reqs" className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">MOQ (Minimum Order Quantity)</label>
      <input
        type="number"
        value={moq}
        onChange={(e) => setMoq(e.target.value)}
        placeholder="e.g., 500"
        className="w-full rounded-lg border border-gray-300 p-3 text-sm"
      />
      <label className="block text-sm font-medium text-gray-700">Price Target</label>
      <div className="flex gap-2">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-lg border border-gray-300 p-3 text-sm"
        >
          <option value="USD">USD</option>
          <option value="CNY">CNY</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        <input
          type="number"
          step="0.01"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          placeholder="Min"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm"
        />
        <span className="flex items-center text-gray-400">-</span>
        <input
          type="number"
          step="0.01"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          placeholder="Max"
          className="w-full rounded-lg border border-gray-300 p-3 text-sm"
        />
      </div>
    </div>,
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">New Product Request</h2>

      {/* Mode toggle */}
      <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Free Text Input
        </button>
        <button
          onClick={() => setMode('progressive')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            mode === 'progressive' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Step-by-Step Input
        </button>
      </div>

      {mode === 'text' ? (
        <div className="space-y-4">
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setParsedPreview(null);
            }}
            placeholder={`Describe your product request in detail...\n\nExample: "I need 500 custom leather tote bags in black and brown. Size 30x25x10cm. PU leather material with embossed logo on the front. Budget $3-5 per unit. Need d-ring hardware for shoulder strap attachment."`}
            className="w-full rounded-lg border border-gray-300 p-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            rows={6}
          />

          {!parsedPreview && (
            <button
              onClick={handleTextParse}
              disabled={!rawText.trim()}
              className="w-full rounded-lg bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Parse Request
            </button>
          )}

          {parsedPreview && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Parsed Preview</h3>
              <dl className="space-y-2 text-sm">
                {parsedPreview.description && (
                  <div><dt className="font-medium text-gray-500">Description</dt><dd>{parsedPreview.description}</dd></div>
                )}
                {parsedPreview.category && (
                  <div><dt className="font-medium text-gray-500">Category</dt><dd>{parsedPreview.category}</dd></div>
                )}
                {parsedPreview.size && (
                  <div><dt className="font-medium text-gray-500">Size</dt><dd>{parsedPreview.size}</dd></div>
                )}
                {parsedPreview.material && (
                  <div><dt className="font-medium text-gray-500">Material</dt><dd>{parsedPreview.material}</dd></div>
                )}
                {parsedPreview.colors && parsedPreview.colors.length > 0 && (
                  <div><dt className="font-medium text-gray-500">Colors</dt><dd>{parsedPreview.colors.join(', ')}</dd></div>
                )}
                {parsedPreview.customization?.logo && (
                  <div><dt className="font-medium text-gray-500">Logo</dt><dd>{parsedPreview.customization.logo.type}</dd></div>
                )}
                {parsedPreview.customization?.features && parsedPreview.customization.features.length > 0 && (
                  <div><dt className="font-medium text-gray-500">Features</dt><dd>{parsedPreview.customization.features.join(', ')}</dd></div>
                )}
                {parsedPreview.moq && (
                  <div><dt className="font-medium text-gray-500">MOQ</dt><dd>{parsedPreview.moq}</dd></div>
                )}
                {parsedPreview.priceTarget && (
                  <div>
                    <dt className="font-medium text-gray-500">Price Target</dt>
                    <dd>
                      {parsedPreview.priceTarget.currency} {parsedPreview.priceTarget.min || '?'} - {parsedPreview.priceTarget.max || '?'}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleTextSubmit}
                  className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Confirm & Continue
                </button>
                <button
                  onClick={() => setParsedPreview(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {progressiveSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === step ? 'bg-blue-600' : i < step ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-gray-500 text-center">
            Step {step + 1} of {progressiveSteps.length}:{' '}
            {['Product Details', 'Specifications', 'Customization', 'Requirements'][step]}
          </div>

          {progressiveSteps[step]}

          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {step < progressiveSteps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && !description.trim()}
                className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleProgressiveSubmit}
                disabled={!description.trim()}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Submit Request
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
