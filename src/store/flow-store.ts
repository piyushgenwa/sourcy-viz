import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  FlowStep,
  ProductRequest,
  ProductRequestJson,
  VisualizationSession,
  CustomizationClassification,
  PreliminaryQuote,
  CustomizationInput,
  ProductCategory,
  PriceTarget,
  VisualizationItem,
  VisualizationLevel,
} from '@/types/product';
import { classifyCustomization } from '@/lib/customization-engine';
import { generateVisualizationItems, branchFromItem } from '@/lib/visualization-engine';

interface FlowStore {
  // State
  currentStep: FlowStep;
  request: ProductRequest | null;
  requestJson: ProductRequestJson | null;
  visualizationSession: VisualizationSession | null;
  customization: CustomizationClassification | null;
  quote: PreliminaryQuote | null;

  // Actions
  setStep: (step: FlowStep) => void;
  submitRequest: (request: ProductRequest) => void;
  convertToJson: () => void;
  startVisualizationV1: () => void;
  selectVisualizationItem: (itemId: string, level: number) => void;
  runCustomizationIntelligence: () => void;
  startVisualizationV2: (alternativeId?: string) => void;
  generateQuote: () => void;
  reset: () => void;
}

export const useFlowStore = create<FlowStore>((set, get) => ({
  currentStep: 'request-entry',
  request: null,
  requestJson: null,
  visualizationSession: null,
  customization: null,
  quote: null,

  setStep: (step) => set({ currentStep: step }),

  submitRequest: (request) => {
    set({ request, currentStep: 'request-review' });
  },

  convertToJson: () => {
    const { request } = get();
    if (!request) return;

    const json: ProductRequestJson = {
      product: {
        description: request.description,
        category: request.category || 'other',
        size: request.size || '',
        material: request.material || '',
        colors: request.colors || [],
      },
      customization: {
        logo: request.customization.logo || null,
        features: request.customization.features || [],
        colorVariations: request.customization.colorVariations || [],
      },
      requirements: {
        priceTarget: request.priceTarget || null,
        moq: request.moq || null,
      },
    };

    set({ requestJson: json });
  },

  startVisualizationV1: () => {
    const { requestJson, request } = get();
    if (!requestJson || !request) return;

    const items = generateVisualizationItems(requestJson, 5);
    const session: VisualizationSession = {
      id: uuid(),
      requestId: request.id,
      levels: [{ level: 0, items }],
      currentLevel: 0,
      selectedPath: [],
      phase: 'v1',
    };

    set({ visualizationSession: session, currentStep: 'visualization-v1' });
  },

  selectVisualizationItem: (itemId, level) => {
    const { visualizationSession, requestJson } = get();
    if (!visualizationSession || !requestJson) return;

    const currentLevel = visualizationSession.levels[level];
    if (!currentLevel) return;

    // Mark selected
    const updatedItems = currentLevel.items.map((item) => ({
      ...item,
      selected: item.id === itemId,
    }));

    const updatedLevels = [...visualizationSession.levels];
    updatedLevels[level] = { ...currentLevel, items: updatedItems };

    // Remove any deeper levels (user is re-selecting at this level)
    const trimmedLevels = updatedLevels.slice(0, level + 1);
    const selectedPath = [...visualizationSession.selectedPath.slice(0, level), itemId];

    const selectedItem = updatedItems.find((i) => i.id === itemId)!;

    if (level < 2) {
      // Branch out: generate 3 variations from selected item
      const branchedItems = branchFromItem(selectedItem, requestJson, 3);
      const newLevel: VisualizationLevel = {
        level: level + 1,
        items: branchedItems,
        parentItemId: itemId,
      };
      trimmedLevels.push(newLevel);
    }

    set({
      visualizationSession: {
        ...visualizationSession,
        levels: trimmedLevels,
        currentLevel: Math.min(level + 1, 2),
        selectedPath,
        finalSelection: level === 2 ? selectedItem : undefined,
      },
    });
  },

  runCustomizationIntelligence: () => {
    const { requestJson, visualizationSession } = get();
    if (!requestJson) return;

    const finalItem = visualizationSession?.finalSelection;
    const classification = classifyCustomization(requestJson, finalItem);

    set({ customization: classification, currentStep: 'customization-analysis' });
  },

  startVisualizationV2: (alternativeId) => {
    const { customization, requestJson, visualizationSession, request } = get();
    if (!requestJson || !request) return;

    let items: VisualizationItem[];
    if (alternativeId && customization) {
      const alt = customization.alternatives.find((a) => a.id === alternativeId);
      if (alt) {
        items = generateVisualizationItems(requestJson, 3, alt.description);
      } else {
        items = generateVisualizationItems(requestJson, 3);
      }
    } else {
      items = generateVisualizationItems(requestJson, 3);
    }

    const session: VisualizationSession = {
      id: uuid(),
      requestId: request.id,
      levels: [{ level: 0, items }],
      currentLevel: 0,
      selectedPath: [],
      phase: 'v2',
    };

    set({ visualizationSession: session, currentStep: 'visualization-v2' });
  },

  generateQuote: () => {
    const { request, visualizationSession, customization } = get();
    if (!request || !visualizationSession || !customization) return;

    const selectedItem = visualizationSession.finalSelection ||
      visualizationSession.levels[visualizationSession.currentLevel]?.items.find((i) => i.selected);

    if (!selectedItem) return;

    const quote: PreliminaryQuote = {
      id: uuid(),
      requestId: request.id,
      selectedItem,
      customization,
      unitPrice: selectedItem.estimatedPrice || { min: 1, max: 5, currency: 'USD' },
      moq: selectedItem.estimatedMoq || request.moq || 500,
      setupFees: customization.level <= 2 ? 150 : customization.level <= 3 ? 500 : customization.level <= 4 ? 2000 : 5000,
      leadTime: customization.levelInfo.developmentTime,
      notes: customization.warnings.map((w) => w.message),
      alternatives: customization.alternatives.map((alt) => ({
        id: alt.id,
        description: alt.description,
        unitPrice: alt.newPrice || { min: 0.5, max: 3, currency: 'USD' },
        moq: alt.newMoq || 500,
        tradeoffs: alt.tradeoffs,
      })),
    };

    set({ quote, currentStep: 'preliminary-quote' });
  },

  reset: () =>
    set({
      currentStep: 'request-entry',
      request: null,
      requestJson: null,
      visualizationSession: null,
      customization: null,
      quote: null,
    }),
}));
