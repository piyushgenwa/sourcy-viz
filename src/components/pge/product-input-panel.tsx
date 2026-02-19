'use client';

import { useState, useRef } from 'react';

interface ProductInputPanelProps {
  value: string;
  onChange: (desc: string) => void;
  onSubmit: () => Promise<void>;
  isLoading: boolean;
  referenceImageData: string | null;
  referenceImageMimeType: string | null;
  referenceUrl: string;
  onReferenceImageChange: (data: string | null, mimeType: string | null) => void;
  onReferenceUrlChange: (url: string) => void;
}

const EXAMPLES = [
  'A premium leather laptop bag for urban professionals, structured silhouette, fits 15" laptop',
  'A minimalist kraft paper tote bag with rope handles for a sustainable lifestyle brand',
  'A luxury rigid gift box for cosmetics with magnetic closure and soft-touch finish',
];

export function ProductInputPanel({
  value,
  onChange,
  onSubmit,
  isLoading,
  referenceImageData,
  referenceImageMimeType,
  referenceUrl,
  onReferenceImageChange,
  onReferenceUrlChange,
}: ProductInputPanelProps) {
  const [focused, setFocused] = useState(false);
  const [urlFocused, setUrlFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) onSubmit();
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      // Strip the data URL prefix to get raw base64
      const base64 = result.split(',')[1];
      onReferenceImageChange(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearImage = () => {
    onReferenceImageChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Describe Your Product</h2>
        <p className="mt-2 text-gray-500">
          Tell us what you want to visualize. Be as specific or as broad as you like — we&apos;ll
          ask the right follow-up questions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description textarea */}
        <div
          className={`rounded-xl border-2 transition-colors ${
            focused ? 'border-blue-500' : 'border-gray-200'
          } bg-white`}
        >
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. A leather tote bag for professionals with a structured shape, internal laptop sleeve, and a minimal logo emboss..."
            rows={5}
            className="w-full resize-none rounded-xl bg-transparent px-4 pt-4 text-gray-900 placeholder-gray-400 outline-none text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
            <span className="text-xs text-gray-400">{value.length} characters</span>
            <button
              type="submit"
              disabled={!value.trim() || isLoading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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
                  Analyzing…
                </>
              ) : (
                <>
                  Analyze
                  <span className="text-blue-200">&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reference inputs section */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Reference inputs <span className="normal-case font-normal text-gray-400">(optional)</span>
          </p>

          {/* Reference image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reference image
            </label>
            {referenceImageData ? (
              <div className="flex items-center gap-3">
                <img
                  src={`data:${referenceImageMimeType};base64,${referenceImageData}`}
                  alt="Reference"
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium">Image uploaded</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    AI will use this as a style reference when generating designs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer py-5 px-4 transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg
                  className="h-8 w-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Reference URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reference product URL
            </label>
            <div
              className={`flex items-center gap-2 rounded-lg border transition-colors ${
                urlFocused ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200'
              } bg-white px-3 py-2`}
            >
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => onReferenceUrlChange(e.target.value)}
                onFocus={() => setUrlFocused(true)}
                onBlur={() => setUrlFocused(false)}
                placeholder="https://example.com/product-page"
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
              />
              {referenceUrl && (
                <button
                  type="button"
                  onClick={() => onReferenceUrlChange('')}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Product details will be scraped and used to inform design generation
            </p>
          </div>
        </div>
      </form>

      {/* Example prompts */}
      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Try an example
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="w-full rounded-lg border border-dashed border-gray-200 px-4 py-3 text-left text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
