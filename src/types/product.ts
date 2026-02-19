// ─── Product Request Types ───────────────────────────────────────────────────

export interface ProductRequest {
  id: string;
  description: string;
  size?: string;
  material?: string;
  colors?: string[];
  customization: CustomizationInput;
  category?: ProductCategory;
  priceTarget?: PriceTarget;
  moq?: number;
  rawText?: string;
  createdAt: string;
}

export interface CustomizationInput {
  logo?: LogoSpec;
  features?: string[];
  colorVariations?: string[];
}

export interface LogoSpec {
  type: 'embossing' | 'printing' | 'engraving' | 'label' | 'rubber-tag' | 'heat-press';
  description?: string;
  placement?: string;
}

export type ProductCategory =
  | 'bags-leather'
  | 'packaging-paper'
  | 'packaging-box'
  | 'apparel'
  | 'accessories'
  | 'homeware'
  | 'electronics'
  | 'cosmetics'
  | 'food-packaging'
  | 'other';

export interface PriceTarget {
  min?: number;
  max?: number;
  currency: string;
}

// ─── Customization Level Types ───────────────────────────────────────────────

export type CustomizationLevel = 1 | 2 | 3 | 4 | 5;

export interface CustomizationLevelInfo {
  level: CustomizationLevel;
  name: string;
  emoji: string;
  coreDefinition: string;
  typicalForms: string[];
  keyRisk: string;
  setupFee: string;
  moqImpact: string;
  costBehavior: string;
  reworkCost: string;
  timelineRisk: string;
  supplierAvailability: string;
  feasibility: string;
  developmentTime: string;
  bestFor: string;
  earlyWarningSignal: string;
}

export interface CustomizationClassification {
  level: CustomizationLevel;
  levelInfo: CustomizationLevelInfo;
  customizationType: string;
  constraints: CustomizationConstraint[];
  feasibilityScore: number; // 0-100
  warnings: FeasibilityWarning[];
  alternatives: AlternativeOption[];
}

export interface CustomizationConstraint {
  type: 'moq' | 'price' | 'timeline' | 'supplier' | 'tooling';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: string;
  requiredValue: string;
}

export interface FeasibilityWarning {
  id: string;
  type: 'moq-mismatch' | 'price-mismatch' | 'timeline-risk' | 'supplier-limited' | 'tooling-required';
  message: string;
  severity: 'info' | 'warning' | 'error';
  suggestion?: string;
}

export interface AlternativeOption {
  id: string;
  description: string;
  negotiableOn: ('customization-type' | 'customization-level' | 'price' | 'moq')[];
  tradeoffs: string[];
  estimatedSaving?: string;
  newLevel?: CustomizationLevel;
  newMoq?: number;
  newPrice?: PriceTarget;
}

// ─── Visualization Types ─────────────────────────────────────────────────────

export interface VisualizationItem {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
  imagePlaceholder: string;
  /** Base64-encoded image data returned by the Nano Banana (Gemini) API */
  generatedImageData?: string;
  /** MIME type of the generated image (e.g. "image/png") */
  generatedImageMimeType?: string;
  specs: Record<string, string>;
  estimatedPrice?: PriceTarget;
  estimatedMoq?: number;
  customizationLevel?: CustomizationLevel;
  selected?: boolean;
}

export interface VisualizationLevel {
  level: number; // 0, 1, 2
  items: VisualizationItem[];
  parentItemId?: string;
}

export interface VisualizationSession {
  id: string;
  requestId: string;
  levels: VisualizationLevel[];
  currentLevel: number;
  selectedPath: string[]; // chain of selected item IDs
  phase: 'v1' | 'v2';
  finalSelection?: VisualizationItem;
}

// ─── Preliminary Quote Types ─────────────────────────────────────────────────

export interface PreliminaryQuote {
  id: string;
  requestId: string;
  selectedItem: VisualizationItem;
  customization: CustomizationClassification;
  unitPrice: PriceTarget;
  moq: number;
  setupFees: number;
  leadTime: string;
  notes: string[];
  alternatives: AlternativeQuote[];
}

export interface AlternativeQuote {
  id: string;
  description: string;
  unitPrice: PriceTarget;
  moq: number;
  tradeoffs: string[];
  visualizationItem?: VisualizationItem;
}

// ─── Knowledge Base Types ────────────────────────────────────────────────────

export interface KnowledgeEntry {
  id: string;
  type: 'request-pattern' | 'supplier-constraint' | 'tradeoff' | 'pricing-insight' | 'moq-data';
  category: ProductCategory;
  content: string;
  metadata: Record<string, string>;
  source: 'conversation' | 'manual' | 'upload';
  /** Confidence score 0–1, based on occurrence frequency across uploaded conversations */
  confidence?: number;
  /** Number of conversations this insight was observed in */
  occurrences?: number;
  /** Original text in source language before translation */
  originalText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  entries: KnowledgeEntry[];
  lastUpdated: string;
}

// ─── PGE (Prompt Generation Engine) Types ────────────────────────────────────

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: string[];
  allowCustom?: boolean;
  required?: boolean;
}

export interface ImagePromptVariant {
  id: string;
  name: string;
  description: string;
  prompt: string;
  anchoredAspects: string[];
  flexibleAspects: string[];
}

export interface GeneratedImageVariant extends ImagePromptVariant {
  placeholderGradient: string;
  imageData?: string;
  imageMimeType?: string;
  isLoading: boolean;
  hasError: boolean;
  selected: boolean;
}

export type PGEFlowStep =
  | 'product-input'
  | 'clarification'
  | 'l0-variants'
  | 'l1-variants'
  | 'l2-variants'
  | 'complete'
  | 'feasibility-input'
  | 'feasibility-result';

// ─── Feasibility Checker Types ────────────────────────────────────────────────

export interface FeasibilityInput {
  customizationDescription: string;
  moq: number | null;
  targetPriceMin: number | null;
  targetPriceMax: number | null;
  priceCurrency: string;
  timeline: string;
}

export type FeasibilityStatus = 'feasible' | 'at-risk' | 'infeasible';

export interface FeasibilityDimension {
  status: FeasibilityStatus;
  headline: string;
  detail: string;
  risks: string[];
}

export interface FeasibilityAlternative {
  id: string;
  title: string;
  description: string;
  tradeoffs: string[];
  saves: string;
}

export type FeasibilityVerdict = 'proceed' | 'proceed-with-caution' | 'reconsider';

export interface AIFeasibilityResult {
  classificationLevel: CustomizationLevel;
  classificationRationale: string;
  customizationFeasibility: FeasibilityDimension;
  moqFeasibility: FeasibilityDimension;
  priceFeasibility: FeasibilityDimension;
  timelineFeasibility: FeasibilityDimension;
  qualityRisks: string[];
  alternatives: FeasibilityAlternative[];
  overallVerdict: FeasibilityVerdict;
  overallSummary: string;
}

// ─── Flow State Types ────────────────────────────────────────────────────────

export type FlowStep =
  | 'request-entry'
  | 'request-review'
  | 'visualization-v1'
  | 'customization-analysis'
  | 'visualization-v2'
  | 'preliminary-quote';

export interface FlowState {
  currentStep: FlowStep;
  request?: ProductRequest;
  requestJson?: ProductRequestJson;
  visualizationSession?: VisualizationSession;
  customization?: CustomizationClassification;
  quote?: PreliminaryQuote;
}

export interface ProductRequestJson {
  product: {
    description: string;
    category: ProductCategory;
    size: string;
    material: string;
    colors: string[];
  };
  customization: {
    logo: LogoSpec | null;
    features: string[];
    colorVariations: string[];
  };
  requirements: {
    priceTarget: PriceTarget | null;
    moq: number | null;
  };
}
