'use client';

import { useRef, useState, useCallback } from 'react';
import type { KnowledgeEntry } from '@/types/product';
import { Badge } from '@/components/ui/badge';

const TYPE_LABELS: Record<KnowledgeEntry['type'], string> = {
  'request-pattern': 'Request Pattern',
  'supplier-constraint': 'Supplier Constraint',
  'tradeoff': 'Tradeoff',
  'pricing-insight': 'Pricing Insight',
  'moq-data': 'MOQ Data',
};

const TYPE_VARIANTS: Record<
  KnowledgeEntry['type'],
  'info' | 'warning' | 'error' | 'success' | 'default'
> = {
  'request-pattern': 'info',
  'supplier-constraint': 'warning',
  'tradeoff': 'default',
  'pricing-insight': 'success',
  'moq-data': 'error',
};

interface ParseStats {
  totalConversations: number;
  totalChunksProcessed: number;
  totalEntriesExtracted: number;
  detectedLanguages: string[];
  warnings: string[];
}

interface BulkUploadPanelProps {
  onImport: (entries: KnowledgeEntry[]) => void;
  onClose: () => void;
}

export function BulkUploadPanel({ onImport, onClose }: BulkUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<KnowledgeEntry[] | null>(null);
  const [stats, setStats] = useState<ParseStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const all = Array.from(incoming);
    if (all.length === 0) return;
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const deduped = all.filter((f) => !existing.has(f.name));
      const merged = [...prev, ...deduped];
      if (merged.length > 20) {
        setError('Maximum 20 conversation files per batch.');
        return prev;
      }
      return merged;
    });
    setError(null);
    setParsedEntries(null);
    setStats(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setParsedEntries(null);
    setStats(null);
  };

  const handleParse = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setParsedEntries(null);
    setStats(null);

    try {
      // Read all files as text
      const conversations = await Promise.all(
        files.map(
          (f) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (ev) => resolve(ev.target?.result as string);
              reader.onerror = () => reject(new Error(`Failed to read ${f.name}`));
              reader.readAsText(f, 'utf-8');
            })
        )
      );

      const res = await fetch('/api/parse-supplier-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversations }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errBody.error || `API error ${res.status}`);
      }

      const data = await res.json() as {
        entries: KnowledgeEntry[];
        stats: ParseStats;
      };

      setParsedEntries(data.entries);
      setStats(data.stats);
      setSelectedIds(new Set(data.entries.map((e) => e.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during parsing');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleEntry = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = () => {
    if (!parsedEntries) return;
    const toImport = parsedEntries.filter((e) => selectedIds.has(e.id));
    if (toImport.length === 0) return;
    onImport(toImport);
  };

  const confidenceLabel = (c?: number) => {
    if (c === undefined) return null;
    if (c >= 0.75) return { label: 'High', color: 'text-green-700 bg-green-100' };
    if (c >= 0.4) return { label: 'Medium', color: 'text-yellow-700 bg-yellow-100' };
    return { label: 'Low', color: 'text-red-700 bg-red-100' };
  };

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-purple-900">Bulk Upload Supplier Conversations</h3>
          <p className="text-xs text-purple-700 mt-0.5">
            Upload .txt / .csv conversation files (Chinese or English). AI will translate, extract
            constraints, and score confidence based on occurrence frequency.
          </p>
        </div>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">
          Dismiss
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-purple-500 bg-purple-100'
            : 'border-purple-300 hover:border-purple-400 hover:bg-purple-100/50'
        }`}
      >
        <p className="text-sm text-purple-700">
          Drop conversation files here, or{' '}
          <span className="font-medium underline">click to browse</span>
        </p>
        <p className="text-xs text-purple-500 mt-1">.txt, .csv, .md — max 20 files</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.md,text/plain,text/csv"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-purple-800">{files.length} file(s) queued</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs border border-purple-100"
              >
                <span className="truncate text-gray-700 max-w-xs">{f.name}</span>
                <span className="ml-2 shrink-0 text-gray-400">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                  className="ml-2 shrink-0 text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Parse button */}
      {files.length > 0 && !parsedEntries && (
        <button
          onClick={handleParse}
          disabled={isProcessing}
          className="w-full rounded bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Translating &amp; extracting knowledge…
            </span>
          ) : (
            `Parse ${files.length} conversation${files.length > 1 ? 's' : ''} with AI`
          )}
        </button>
      )}

      {/* Results */}
      {parsedEntries !== null && (
        <div className="space-y-3">
          {/* Stats */}
          {stats && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3 rounded bg-white border border-purple-100 px-3 py-2">
                <span className="text-xs text-gray-600">
                  <span className="font-medium text-gray-900">{stats.totalConversations}</span> file{stats.totalConversations !== 1 ? 's' : ''}
                </span>
                {stats.totalChunksProcessed > stats.totalConversations && (
                  <span className="text-xs text-gray-600">
                    <span className="font-medium text-gray-900">{stats.totalChunksProcessed}</span> chunks processed
                  </span>
                )}
                <span className="text-xs text-gray-600">
                  <span className="font-medium text-gray-900">{stats.totalEntriesExtracted}</span> insights extracted
                </span>
                {stats.detectedLanguages.length > 0 && (
                  <span className="text-xs text-gray-600">
                    Languages: <span className="font-medium text-gray-900">{stats.detectedLanguages.join(', ')}</span>
                  </span>
                )}
              </div>
              {stats.warnings.length > 0 && (
                <div className="rounded bg-yellow-50 border border-yellow-200 px-3 py-2 space-y-0.5">
                  {stats.warnings.map((w, idx) => (
                    <p key={idx} className="text-xs text-yellow-800">{w}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {parsedEntries.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">
              No structured insights could be extracted from these conversations.
              {stats?.warnings.length ? ' Check the warnings above for details.' : ''}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-purple-800">
                  Preview — select entries to import
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIds(new Set(parsedEntries.map((e) => e.id)))}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>

              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {parsedEntries.map((entry) => {
                  const conf = confidenceLabel(entry.confidence);
                  const isSelected = selectedIds.has(entry.id);
                  return (
                    <li
                      key={entry.id}
                      onClick={() => toggleEntry(entry.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? 'border-purple-300 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEntry(entry.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <Badge variant={TYPE_VARIANTS[entry.type]}>
                              {TYPE_LABELS[entry.type]}
                            </Badge>
                            <Badge>{entry.category}</Badge>
                            {conf && (
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${conf.color}`}
                              >
                                {conf.label} confidence
                                {entry.confidence !== undefined &&
                                  ` (${Math.round(entry.confidence * 100)}%)`}
                              </span>
                            )}
                            {entry.occurrences !== undefined && entry.occurrences > 1 && (
                              <span className="text-xs text-gray-400">
                                seen in {entry.occurrences} conversations
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-800">{entry.content}</p>
                          {entry.originalText && (
                            <p className="mt-1 text-xs text-gray-400 italic">
                              Original: {entry.originalText}
                            </p>
                          )}
                          {Object.keys(entry.metadata).length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {Object.entries(entry.metadata).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                                >
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleImport}
                  disabled={selectedIds.size === 0}
                  className="flex-1 rounded bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Import {selectedIds.size} entr{selectedIds.size === 1 ? 'y' : 'ies'} to Knowledge Base
                </button>
                <button
                  onClick={() => { setParsedEntries(null); setStats(null); setFiles([]); }}
                  className="rounded border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
