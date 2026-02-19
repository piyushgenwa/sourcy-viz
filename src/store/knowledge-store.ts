import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { KnowledgeEntry, KnowledgeBase, ProductCategory } from '@/types/product';

interface KnowledgeStore extends KnowledgeBase {
  addEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, updates: Partial<KnowledgeEntry>) => void;
  deleteEntry: (id: string) => void;
  searchEntries: (query: string) => KnowledgeEntry[];
  getByCategory: (category: ProductCategory) => KnowledgeEntry[];
  getByType: (type: KnowledgeEntry['type']) => KnowledgeEntry[];
  importEntries: (entries: KnowledgeEntry[]) => void;
  /**
   * Import AI-parsed entries from bulk upload. Merges with existing upload-sourced
   * entries: if an entry with the same content fingerprint already exists, the
   * occurrence count and confidence are averaged rather than duplicated.
   */
  importBulkUpload: (entries: KnowledgeEntry[]) => void;
  exportEntries: () => string;
  learnFromConversation: (context: ConversationContext) => void;
}

export interface ConversationContext {
  category: ProductCategory;
  customizationType?: string;
  constraints?: string[];
  tradeoffs?: string[];
  resolution?: string;
  supplierNotes?: string;
  moqData?: { requested: number; actual: number };
  pricingData?: { quoted: number; actual: number; currency: string };
}

export const useKnowledgeStore = create<KnowledgeStore>((set, get) => ({
  entries: getDefaultEntries(),
  lastUpdated: new Date().toISOString(),

  addEntry: (entry) => {
    const now = new Date().toISOString();
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      entries: [...state.entries, newEntry],
      lastUpdated: now,
    }));
  },

  updateEntry: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: now } : e
      ),
      lastUpdated: now,
    }));
  },

  deleteEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      lastUpdated: new Date().toISOString(),
    }));
  },

  searchEntries: (query) => {
    const q = query.toLowerCase();
    return get().entries.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        Object.values(e.metadata).some((v) => v.toLowerCase().includes(q))
    );
  },

  getByCategory: (category) => {
    return get().entries.filter((e) => e.category === category);
  },

  getByType: (type) => {
    return get().entries.filter((e) => e.type === type);
  },

  importEntries: (entries) => {
    set((state) => ({
      entries: [...state.entries, ...entries],
      lastUpdated: new Date().toISOString(),
    }));
  },

  importBulkUpload: (newEntries) => {
    const now = new Date().toISOString();
    set((state) => {
      // Build a fingerprint map of existing upload-sourced entries so we can merge
      // rather than duplicate when the user runs bulk upload multiple times.
      const existingMap = new Map<string, KnowledgeEntry>();
      for (const e of state.entries) {
        if (e.source === 'upload') {
          const fp = `${e.type}|${e.category}|${e.content.toLowerCase().slice(0, 80)}`;
          existingMap.set(fp, e);
        }
      }

      const toAdd: KnowledgeEntry[] = [];
      const toUpdate: Map<string, Partial<KnowledgeEntry>> = new Map();

      for (const incoming of newEntries) {
        const fp = `${incoming.type}|${incoming.category}|${incoming.content.toLowerCase().slice(0, 80)}`;
        const existing = existingMap.get(fp);
        if (existing) {
          // Merge: sum occurrences, average confidence
          const mergedOccurrences = (existing.occurrences ?? 1) + (incoming.occurrences ?? 1);
          const mergedConfidence =
            Math.round(
              (((existing.confidence ?? 0.5) + (incoming.confidence ?? 0.5)) / 2) * 100
            ) / 100;
          toUpdate.set(existing.id, {
            occurrences: mergedOccurrences,
            confidence: mergedConfidence,
            updatedAt: now,
          });
        } else {
          toAdd.push({ ...incoming, updatedAt: now });
        }
      }

      const updatedEntries = state.entries.map((e) => {
        const upd = toUpdate.get(e.id);
        return upd ? { ...e, ...upd } : e;
      });

      return {
        entries: [...updatedEntries, ...toAdd],
        lastUpdated: now,
      };
    });
  },

  exportEntries: () => {
    return JSON.stringify(get().entries, null, 2);
  },

  learnFromConversation: (context) => {
    const now = new Date().toISOString();
    const newEntries: KnowledgeEntry[] = [];

    if (context.constraints?.length) {
      newEntries.push({
        id: uuid(),
        type: 'supplier-constraint',
        category: context.category,
        content: `Supplier constraints for ${context.category}: ${context.constraints.join('; ')}`,
        metadata: {
          customizationType: context.customizationType || '',
          source: 'conversation',
        },
        source: 'conversation',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (context.tradeoffs?.length) {
      newEntries.push({
        id: uuid(),
        type: 'tradeoff',
        category: context.category,
        content: `Tradeoffs for ${context.category}: ${context.tradeoffs.join('; ')}`,
        metadata: {
          resolution: context.resolution || '',
        },
        source: 'conversation',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (context.moqData) {
      newEntries.push({
        id: uuid(),
        type: 'moq-data',
        category: context.category,
        content: `MOQ data for ${context.category}: Requested ${context.moqData.requested}, actual minimum ${context.moqData.actual}`,
        metadata: {
          requested: String(context.moqData.requested),
          actual: String(context.moqData.actual),
        },
        source: 'conversation',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (context.pricingData) {
      newEntries.push({
        id: uuid(),
        type: 'pricing-insight',
        category: context.category,
        content: `Pricing for ${context.category}: Quoted ${context.pricingData.currency} ${context.pricingData.quoted}, actual ${context.pricingData.currency} ${context.pricingData.actual}`,
        metadata: {
          quoted: String(context.pricingData.quoted),
          actual: String(context.pricingData.actual),
          currency: context.pricingData.currency,
        },
        source: 'conversation',
        createdAt: now,
        updatedAt: now,
      });
    }

    if (newEntries.length > 0) {
      set((state) => ({
        entries: [...state.entries, ...newEntries],
        lastUpdated: now,
      }));
    }
  },
}));

function getDefaultEntries(): KnowledgeEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      type: 'supplier-constraint',
      category: 'bags-leather',
      content: 'Logo rubber tags require minimum 1,000 units. Cannot fulfill for 100-unit orders.',
      metadata: { moqMin: '1000', component: 'rubber-tag' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      type: 'pricing-insight',
      category: 'bags-leather',
      content: 'D-ring hardware addition costs approximately \u00A52 extra per unit for bag customization.',
      metadata: { component: 'd-ring', costPerUnit: '2', currency: 'CNY' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      type: 'moq-data',
      category: 'packaging-paper',
      content: 'Color printing MOQ: 1,000 units (standard suppliers), 500 units available at premium pricing.',
      metadata: { standardMoq: '1000', premiumMoq: '500' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      type: 'pricing-insight',
      category: 'packaging-paper',
      content: 'Full color CMYK printing on paper bags: +400% vs stock (\u00A50.58 stock \u2192 \u00A53.00 custom).',
      metadata: { stockPrice: '0.58', customPrice: '3.00', currency: 'CNY', increase: '400%' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      type: 'supplier-constraint',
      category: 'packaging-paper',
      content: 'Custom paper bag lead time: 12-15 days for custom printing. Standard stock available immediately.',
      metadata: { leadTime: '12-15 days' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      type: 'tradeoff',
      category: 'bags-leather',
      content: 'Hair comb logo case: MOQ 6,000 vs client need of 5,000. Negotiated down but margin impacted.',
      metadata: { supplierMoq: '6000', clientNeed: '5000' },
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
