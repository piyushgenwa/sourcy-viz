import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type {
  PGEFlowStep,
  ClarificationQuestion,
  ImagePromptVariant,
  GeneratedImageVariant,
  HeroBannerVariant,
  HeroBannerViewDirection,
  FeasibilityInput,
  AIFeasibilityResult,
} from '@/types/product';

const GRADIENTS = [
  'from-blue-200 to-blue-400',
  'from-emerald-200 to-emerald-400',
  'from-amber-200 to-amber-400',
  'from-rose-200 to-rose-400',
  'from-violet-200 to-violet-400',
  'from-cyan-200 to-cyan-400',
  'from-orange-200 to-orange-400',
  'from-teal-200 to-teal-400',
];

function toGeneratedVariants(
  prompts: ImagePromptVariant[],
  gradientOffset = 0
): GeneratedImageVariant[] {
  return prompts.map((p, i) => ({
    ...p,
    id: p.id || uuid(),
    placeholderGradient: GRADIENTS[(i + gradientOffset) % GRADIENTS.length],
    isLoading: true,
    hasError: false,
    selected: false,
  }));
}

async function callPGE2(
  productDescription: string,
  userAnswers: Record<string, string>,
  referenceImageData?: string | null,
  referenceImageMimeType?: string | null,
  referenceUrl?: string
): Promise<ImagePromptVariant[]> {
  const res = await fetch('/api/pge2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productDescription,
      answers: userAnswers,
      referenceImageData: referenceImageData || undefined,
      referenceImageMimeType: referenceImageMimeType || undefined,
      referenceUrl: referenceUrl || undefined,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'PGE2 failed');
  return data.prompts as ImagePromptVariant[];
}

async function callPGE3(
  productDescription: string,
  userAnswers: Record<string, string>,
  selectedPrompt: string,
  selectedName: string,
  level: 1 | 2
): Promise<ImagePromptVariant[]> {
  const res = await fetch('/api/pge3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productDescription,
      answers: userAnswers,
      selectedPrompt,
      selectedName,
      level,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'PGE3 failed');
  return data.prompts as ImagePromptVariant[];
}

async function callPGE4(
  productDescription: string,
  selectedPrompt: string,
  selectedName: string,
  selectedDescription: string
): Promise<ImagePromptVariant[]> {
  const res = await fetch('/api/pge4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productDescription,
      selectedPrompt,
      selectedName,
      selectedDescription,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'PGE4 failed');
  return data.prompts as ImagePromptVariant[];
}

const HERO_BANNER_GRADIENTS: Record<string, string> = {
  'hero-front': 'from-indigo-200 to-indigo-400',
  'hero-side': 'from-purple-200 to-purple-400',
  'hero-top': 'from-fuchsia-200 to-fuchsia-400',
};

const HERO_BANNER_VIEW_DIRECTIONS: Record<string, HeroBannerViewDirection> = {
  'hero-front': 'front',
  'hero-side': 'side',
  'hero-top': 'top',
};

function toHeroBannerVariants(prompts: ImagePromptVariant[]): HeroBannerVariant[] {
  return prompts.map((p) => ({
    ...p,
    id: p.id || uuid(),
    placeholderGradient: HERO_BANNER_GRADIENTS[p.id] ?? 'from-gray-200 to-gray-400',
    viewDirection: HERO_BANNER_VIEW_DIRECTIONS[p.id] ?? 'front',
    isLoading: true,
    hasError: false,
    selected: false,
  }));
}

interface PGEStore {
  step: PGEFlowStep;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;

  productDescription: string;

  // Reference inputs
  referenceImageData: string | null;
  referenceImageMimeType: string | null;
  referenceUrl: string;

  // PGE1 output
  clarificationQuestions: ClarificationQuestion[];
  userAnswers: Record<string, string>; // question text -> chosen answer

  // L0 — 5 variants from PGE2
  l0Variants: GeneratedImageVariant[];
  selectedL0: GeneratedImageVariant | null;

  // L1 — 3 variants from PGE3 run 1
  l1Variants: GeneratedImageVariant[];
  selectedL1: GeneratedImageVariant | null;

  // L2 — 3 variants from PGE3 run 2
  l2Variants: GeneratedImageVariant[];
  selectedL2: GeneratedImageVariant | null;

  // Feasibility checker state
  feasibilityInput: FeasibilityInput | null;
  feasibilityResult: AIFeasibilityResult | null;

  // PGE4: hero banner views (front, side, top)
  heroBannerViews: HeroBannerVariant[];
  heroBannerError: string | null;

  // Actions
  setProductDescription: (desc: string) => void;
  setReferenceImage: (data: string | null, mimeType: string | null) => void;
  setReferenceUrl: (url: string) => void;
  runPGE1: () => Promise<void>;
  setAnswer: (question: string, answer: string) => void;
  submitAnswers: () => Promise<void>;
  skipClarification: () => Promise<void>;
  updateVariant: (level: 0 | 1 | 2, id: string, update: Partial<GeneratedImageVariant>) => void;
  selectVariant: (level: 0 | 1 | 2, id: string) => void;
  selectL0: (id: string) => Promise<void>;
  selectL1: (id: string) => Promise<void>;
  selectL2: (id: string) => void;
  finalizeSelection: (variant: GeneratedImageVariant) => void;
  updateHeroBannerView: (id: string, update: Partial<HeroBannerVariant>) => void;
  goToFeasibilityInput: () => void;
  runFeasibilityCheck: (input: FeasibilityInput) => Promise<void>;
  reset: () => void;
}

const INITIAL: Omit<
  PGEStore,
  | 'setProductDescription'
  | 'setReferenceImage'
  | 'setReferenceUrl'
  | 'runPGE1'
  | 'setAnswer'
  | 'submitAnswers'
  | 'skipClarification'
  | 'updateVariant'
  | 'selectVariant'
  | 'selectL0'
  | 'selectL1'
  | 'selectL2'
  | 'finalizeSelection'
  | 'updateHeroBannerView'
  | 'goToFeasibilityInput'
  | 'runFeasibilityCheck'
  | 'reset'
> = {
  step: 'product-input',
  isLoading: false,
  loadingMessage: '',
  error: null,
  productDescription: '',
  referenceImageData: null,
  referenceImageMimeType: null,
  referenceUrl: '',
  clarificationQuestions: [],
  userAnswers: {},
  l0Variants: [],
  selectedL0: null,
  l1Variants: [],
  selectedL1: null,
  l2Variants: [],
  selectedL2: null,
  feasibilityInput: null,
  feasibilityResult: null,
  heroBannerViews: [],
  heroBannerError: null,
};

export const usePGEStore = create<PGEStore>((set, get) => ({
  ...INITIAL,

  setProductDescription: (desc) => set({ productDescription: desc }),
  setReferenceImage: (data, mimeType) =>
    set({ referenceImageData: data, referenceImageMimeType: mimeType }),
  setReferenceUrl: (url) => set({ referenceUrl: url }),

  // ── PGE1: analyse description → clarification questions ──────────────────
  runPGE1: async () => {
    const { productDescription, referenceImageData, referenceImageMimeType, referenceUrl } = get();
    if (!productDescription.trim()) return;

    set({ isLoading: true, loadingMessage: 'Analyzing your product description…', error: null });

    try {
      const res = await fetch('/api/pge1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription,
          referenceImageData: referenceImageData || undefined,
          referenceImageMimeType: referenceImageMimeType || undefined,
          referenceUrl: referenceUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PGE1 failed');

      set({
        clarificationQuestions: data.questions,
        step: 'clarification',
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to analyze description',
      });
    }
  },

  setAnswer: (question, answer) =>
    set((s) => ({ userAnswers: { ...s.userAnswers, [question]: answer } })),

  // ── PGE2: full input → 5 L0 image prompts ───────────────────────────────
  submitAnswers: async () => {
    const { productDescription, userAnswers, referenceImageData, referenceImageMimeType, referenceUrl } = get();
    set({ isLoading: true, loadingMessage: 'Generating initial design directions…', error: null });
    try {
      const prompts = await callPGE2(productDescription, userAnswers, referenceImageData, referenceImageMimeType, referenceUrl);
      set({ l0Variants: toGeneratedVariants(prompts), step: 'l0-variants', isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate prompts',
      });
    }
  },

  skipClarification: async () => {
    const { productDescription, userAnswers, referenceImageData, referenceImageMimeType, referenceUrl } = get();
    set({ isLoading: true, loadingMessage: 'Generating initial design directions…', error: null });
    try {
      const prompts = await callPGE2(productDescription, userAnswers, referenceImageData, referenceImageMimeType, referenceUrl);
      set({ l0Variants: toGeneratedVariants(prompts), step: 'l0-variants', isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate prompts',
      });
    }
  },

  updateVariant: (level, id, update) =>
    set((s) => {
      const key = (['l0Variants', 'l1Variants', 'l2Variants'] as const)[level];
      return { [key]: s[key].map((v) => (v.id === id ? { ...v, ...update } : v)) };
    }),

  // Exclusive selection: marks one variant selected, clears others in the same level
  selectVariant: (level, id) =>
    set((s) => {
      const key = (['l0Variants', 'l1Variants', 'l2Variants'] as const)[level];
      return { [key]: s[key].map((v) => ({ ...v, selected: v.id === id })) };
    }),

  // ── PGE3 run 1: selected L0 → 3 L1 prompts ──────────────────────────────
  selectL0: async (id) => {
    const { l0Variants, productDescription, userAnswers } = get();
    const selected = l0Variants.find((v) => v.id === id);
    if (!selected) return;

    set({
      l0Variants: l0Variants.map((v) => ({ ...v, selected: v.id === id })),
      selectedL0: selected,
      isLoading: true,
      loadingMessage: 'Generating refinements from your selection…',
      error: null,
    });

    try {
      const prompts = await callPGE3(
        productDescription,
        userAnswers,
        selected.prompt,
        selected.name,
        1
      );
      set({ l1Variants: toGeneratedVariants(prompts, 3), step: 'l1-variants', isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate L1 refinements',
      });
    }
  },

  // ── PGE3 run 2: selected L1 → 3 L2 prompts ──────────────────────────────
  selectL1: async (id) => {
    const { l1Variants, productDescription, userAnswers } = get();
    const selected = l1Variants.find((v) => v.id === id);
    if (!selected) return;

    set({
      l1Variants: l1Variants.map((v) => ({ ...v, selected: v.id === id })),
      selectedL1: selected,
      isLoading: true,
      loadingMessage: 'Generating deep refinements…',
      error: null,
    });

    try {
      const prompts = await callPGE3(
        productDescription,
        userAnswers,
        selected.prompt,
        selected.name,
        2
      );
      set({ l2Variants: toGeneratedVariants(prompts, 5), step: 'l2-variants', isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate L2 refinements',
      });
    }
  },

  selectL2: (id) => {
    const { l2Variants, productDescription } = get();
    const selected = l2Variants.find((v) => v.id === id);
    if (!selected) return;
    set({
      l2Variants: l2Variants.map((v) => ({ ...v, selected: v.id === id })),
      selectedL2: selected,
      step: 'complete',
      heroBannerViews: [],
      heroBannerError: null,
    });
    // Trigger PGE4 to generate hero banner views in the background
    callPGE4(productDescription, selected.prompt, selected.name, selected.description)
      .then((prompts) => {
        set({ heroBannerViews: toHeroBannerVariants(prompts) });
      })
      .catch((err) => {
        set({ heroBannerError: err instanceof Error ? err.message : 'Failed to generate hero banner views' });
      });
  },

  // Finalize any variant (from L0 or L1) as the final selection, skipping deeper refinements
  finalizeSelection: (variant) => {
    const { productDescription } = get();
    set({
      selectedL2: variant,
      step: 'complete',
      heroBannerViews: [],
      heroBannerError: null,
    });
    // Trigger PGE4 to generate hero banner views in the background
    callPGE4(productDescription, variant.prompt, variant.name, variant.description)
      .then((prompts) => {
        set({ heroBannerViews: toHeroBannerVariants(prompts) });
      })
      .catch((err) => {
        set({ heroBannerError: err instanceof Error ? err.message : 'Failed to generate hero banner views' });
      });
  },

  updateHeroBannerView: (id, update) =>
    set((s) => ({
      heroBannerViews: s.heroBannerViews.map((v) => (v.id === id ? { ...v, ...update } : v)),
    })),

  goToFeasibilityInput: () => {
    set({ step: 'feasibility-input', feasibilityResult: null, error: null });
  },

  runFeasibilityCheck: async (input: FeasibilityInput) => {
    const { productDescription, selectedL2 } = get();
    set({
      feasibilityInput: input,
      isLoading: true,
      loadingMessage: 'Analysing feasibility…',
      error: null,
    });
    try {
      const res = await fetch('/api/feasibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription,
          selectedDesignName: selectedL2?.name ?? '',
          selectedDesignDescription: selectedL2?.description ?? '',
          customizationDescription: input.customizationDescription,
          moq: input.moq,
          targetPriceMin: input.targetPriceMin,
          targetPriceMax: input.targetPriceMax,
          priceCurrency: input.priceCurrency,
          timeline: input.timeline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Feasibility check failed');
      set({
        feasibilityResult: data.analysis,
        step: 'feasibility-result',
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Feasibility check failed',
      });
    }
  },

  reset: () => set({ ...INITIAL }),
}));
