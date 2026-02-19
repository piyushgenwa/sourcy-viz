'use client';

import { useState, useRef } from 'react';
import { useKnowledgeStore, type ConversationContext } from '@/store/knowledge-store';
import type { KnowledgeEntry, ProductCategory } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { BulkUploadPanel } from '@/components/knowledge-base/bulk-upload-panel';

const TYPE_LABELS: Record<KnowledgeEntry['type'], string> = {
  'request-pattern': 'Request Pattern',
  'supplier-constraint': 'Supplier Constraint',
  'tradeoff': 'Tradeoff',
  'pricing-insight': 'Pricing Insight',
  'moq-data': 'MOQ Data',
};

const TYPE_VARIANTS: Record<KnowledgeEntry['type'], 'info' | 'warning' | 'error' | 'success' | 'default'> = {
  'request-pattern': 'info',
  'supplier-constraint': 'warning',
  'tradeoff': 'default',
  'pricing-insight': 'success',
  'moq-data': 'error',
};

export function KnowledgePanel() {
  const {
    entries,
    searchEntries,
    addEntry,
    deleteEntry,
    importEntries,
    importBulkUpload,
    exportEntries,
    learnFromConversation,
  } = useKnowledgeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLearnForm, setShowLearnForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = searchQuery ? searchEntries(searchQuery) : entries;

  const handleExport = () => {
    const json = exportEntries();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-base.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (Array.isArray(imported)) {
          importEntries(imported);
        }
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
          >
            Bulk Upload
          </button>
          <button
            onClick={() => setShowLearnForm(!showLearnForm)}
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            Learn from Conversation
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Add Entry
          </button>
          <button
            onClick={handleExport}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search knowledge base..."
        className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />

      {/* Bulk upload panel */}
      {showBulkUpload && (
        <BulkUploadPanel
          onImport={(entries) => {
            importBulkUpload(entries);
            setShowBulkUpload(false);
          }}
          onClose={() => setShowBulkUpload(false)}
        />
      )}

      {/* Learn from conversation form */}
      {showLearnForm && <LearnForm onLearn={learnFromConversation} onClose={() => setShowLearnForm(false)} />}

      {/* Add entry form */}
      {showAddForm && <AddEntryForm onAdd={addEntry} onClose={() => setShowAddForm(false)} />}

      {/* Entries */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500">{filteredEntries.length} entries</p>
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={TYPE_VARIANTS[entry.type]}>{TYPE_LABELS[entry.type]}</Badge>
                  <Badge>{entry.category}</Badge>
                  <span className="text-xs text-gray-400">{entry.source}</span>
                  {entry.confidence !== undefined && (
                    <ConfidencePill confidence={entry.confidence} occurrences={entry.occurrences} />
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-700">{entry.content}</p>
                {entry.originalText && (
                  <p className="mt-1 text-xs text-gray-400 italic">Original: {entry.originalText}</p>
                )}
                {Object.keys(entry.metadata).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(entry.metadata).map(([k, v]) => (
                      <span key={k} className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="ml-2 text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfidencePill({ confidence, occurrences }: { confidence: number; occurrences?: number }) {
  const pct = Math.round(confidence * 100);
  const colorClass =
    confidence >= 0.75
      ? 'bg-green-100 text-green-700'
      : confidence >= 0.4
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  const label = confidence >= 0.75 ? 'High' : confidence >= 0.4 ? 'Medium' : 'Low';
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {label} {pct}%{occurrences !== undefined && occurrences > 0 ? ` · ${occurrences}×` : ''}
    </span>
  );
}

function AddEntryForm({
  onAdd,
  onClose,
}: {
  onAdd: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<KnowledgeEntry['type']>('supplier-constraint');
  const [category, setCategory] = useState<ProductCategory>('other');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onAdd({ type, category, content, metadata: {}, source: 'manual' });
    onClose();
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-blue-900">Add Knowledge Entry</h3>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as KnowledgeEntry['type'])}
        className="w-full rounded border border-blue-200 p-2 text-sm"
      >
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        className="w-full rounded border border-blue-200 p-2 text-sm"
      >
        <option value="bags-leather">Bags & Leather Goods</option>
        <option value="packaging-paper">Paper Packaging</option>
        <option value="packaging-box">Box Packaging</option>
        <option value="apparel">Apparel</option>
        <option value="accessories">Accessories</option>
        <option value="homeware">Homeware</option>
        <option value="electronics">Electronics</option>
        <option value="cosmetics">Cosmetics</option>
        <option value="food-packaging">Food Packaging</option>
        <option value="other">Other</option>
      </select>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter knowledge entry content..."
        className="w-full rounded border border-blue-200 p-2 text-sm"
        rows={3}
      />
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
          Save
        </button>
        <button onClick={onClose} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}

function LearnForm({
  onLearn,
  onClose,
}: {
  onLearn: (ctx: ConversationContext) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<ProductCategory>('other');
  const [customizationType, setCustomizationType] = useState('');
  const [constraints, setConstraints] = useState('');
  const [tradeoffs, setTradeoffs] = useState('');
  const [resolution, setResolution] = useState('');
  const [moqRequested, setMoqRequested] = useState('');
  const [moqActual, setMoqActual] = useState('');
  const [priceQuoted, setPriceQuoted] = useState('');
  const [priceActual, setPriceActual] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = () => {
    const ctx: ConversationContext = {
      category,
      customizationType: customizationType || undefined,
      constraints: constraints ? constraints.split(';').map((s) => s.trim()) : undefined,
      tradeoffs: tradeoffs ? tradeoffs.split(';').map((s) => s.trim()) : undefined,
      resolution: resolution || undefined,
      moqData: moqRequested && moqActual
        ? { requested: parseInt(moqRequested), actual: parseInt(moqActual) }
        : undefined,
      pricingData: priceQuoted && priceActual
        ? { quoted: parseFloat(priceQuoted), actual: parseFloat(priceActual), currency }
        : undefined,
    };
    onLearn(ctx);
    onClose();
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-green-900">Learn from Conversation</h3>
      <p className="text-xs text-green-700">
        Enter data from a conversation to update the knowledge base. Separate multiple items with semicolons.
      </p>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        className="w-full rounded border border-green-200 p-2 text-sm"
      >
        <option value="bags-leather">Bags & Leather Goods</option>
        <option value="packaging-paper">Paper Packaging</option>
        <option value="packaging-box">Box Packaging</option>
        <option value="apparel">Apparel</option>
        <option value="accessories">Accessories</option>
        <option value="other">Other</option>
      </select>
      <input
        value={customizationType}
        onChange={(e) => setCustomizationType(e.target.value)}
        placeholder="Customization type (e.g., logo embossing)"
        className="w-full rounded border border-green-200 p-2 text-sm"
      />
      <input
        value={constraints}
        onChange={(e) => setConstraints(e.target.value)}
        placeholder="Constraints (semicolon-separated)"
        className="w-full rounded border border-green-200 p-2 text-sm"
      />
      <input
        value={tradeoffs}
        onChange={(e) => setTradeoffs(e.target.value)}
        placeholder="Tradeoffs (semicolon-separated)"
        className="w-full rounded border border-green-200 p-2 text-sm"
      />
      <input
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
        placeholder="Resolution / outcome"
        className="w-full rounded border border-green-200 p-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={moqRequested} onChange={(e) => setMoqRequested(e.target.value)} placeholder="MOQ requested" className="rounded border border-green-200 p-2 text-sm" />
        <input type="number" value={moqActual} onChange={(e) => setMoqActual(e.target.value)} placeholder="MOQ actual" className="rounded border border-green-200 p-2 text-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded border border-green-200 p-2 text-sm">
          <option value="USD">USD</option>
          <option value="CNY">CNY</option>
          <option value="EUR">EUR</option>
        </select>
        <input type="number" step="0.01" value={priceQuoted} onChange={(e) => setPriceQuoted(e.target.value)} placeholder="Price quoted" className="rounded border border-green-200 p-2 text-sm" />
        <input type="number" step="0.01" value={priceActual} onChange={(e) => setPriceActual(e.target.value)} placeholder="Price actual" className="rounded border border-green-200 p-2 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700">
          Learn
        </button>
        <button onClick={onClose} className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  );
}
