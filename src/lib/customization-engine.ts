import { v4 as uuid } from 'uuid';
import type {
  ProductRequestJson,
  CustomizationClassification,
  CustomizationLevel,
  CustomizationConstraint,
  FeasibilityWarning,
  AlternativeOption,
  VisualizationItem,
} from '@/types/product';
import { CUSTOMIZATION_LEVELS } from './customization-rulebook';

/**
 * Classify the customization level based on the product request JSON
 * and optional final selected visualization item.
 */
export function classifyCustomization(
  request: ProductRequestJson,
  selectedItem?: VisualizationItem
): CustomizationClassification {
  const level = determineLevel(request);
  const levelInfo = CUSTOMIZATION_LEVELS[level];
  const customizationType = describeCustomizationType(request);
  const constraints = identifyConstraints(request, level);
  const warnings = generateWarnings(request, level, constraints);
  const feasibilityScore = calculateFeasibility(level, constraints);
  const alternatives = generateAlternatives(request, level, constraints);

  return {
    level,
    levelInfo,
    customizationType,
    constraints,
    feasibilityScore,
    warnings,
    alternatives,
  };
}

function determineLevel(request: ProductRequestJson): CustomizationLevel {
  const { customization, product } = request;
  const features = customization.features || [];
  const logo = customization.logo;
  const colorVariations = customization.colorVariations || [];

  // Level 5: Multi-component system
  if (features.length > 3 && colorVariations.length > 3) return 5;
  if (features.some((f) => /assembly|multi-component|system|set/i.test(f))) return 5;

  // Level 4: Mold/engineering required
  if (features.some((f) => /mold|tooling|outsole|custom shape|injection/i.test(f))) return 4;
  if (features.some((f) => /specialized equipment|vending|machine/i.test(f))) return 4;

  // Level 3: Structural changes
  if (features.some((f) => /size modif|capacity change|structural|resize|dimension/i.test(f))) return 3;
  if (features.some((f) => /material composition|structural adjust/i.test(f))) return 3;

  // Level 2: Component-level changes
  if (features.some((f) => /custom box|label insert|motor|inner material|component/i.test(f))) return 2;
  if (logo && ['label', 'rubber-tag'].includes(logo.type)) return 2;
  if (features.some((f) => /hardware|d-ring|strap|zipper/i.test(f))) return 2;

  // Level 1: Surface customization
  if (logo) return 1;
  if (colorVariations.length > 0) return 1;
  if (features.some((f) => /print|engrav|emboss|color/i.test(f))) return 1;

  // Default to level 1 if any customization is requested
  if (features.length > 0) return 1;

  return 1;
}

function describeCustomizationType(request: ProductRequestJson): string {
  const parts: string[] = [];
  const { customization } = request;

  if (customization.logo) {
    parts.push(`${customization.logo.type} logo`);
  }
  if (customization.features?.length) {
    parts.push(customization.features.join(', '));
  }
  if (customization.colorVariations?.length) {
    parts.push(`${customization.colorVariations.length} color variation(s)`);
  }

  return parts.join(' + ') || 'No customization';
}

function identifyConstraints(
  request: ProductRequestJson,
  level: CustomizationLevel
): CustomizationConstraint[] {
  const constraints: CustomizationConstraint[] = [];
  const { requirements } = request;

  // MOQ constraints
  const moqThresholds: Record<CustomizationLevel, number> = {
    1: 500,
    2: 1000,
    3: 2000,
    4: 5000,
    5: 10000,
  };

  if (requirements.moq && requirements.moq < moqThresholds[level]) {
    constraints.push({
      type: 'moq',
      description: `Requested MOQ (${requirements.moq}) is below typical minimum for Level ${level} customization`,
      severity: level >= 4 ? 'critical' : level >= 3 ? 'high' : 'medium',
      currentValue: String(requirements.moq),
      requiredValue: String(moqThresholds[level]),
    });
  }

  // Price constraints
  const priceMultipliers: Record<CustomizationLevel, number> = {
    1: 1.2,
    2: 1.5,
    3: 2.0,
    4: 3.0,
    5: 4.0,
  };

  if (requirements.priceTarget?.max) {
    const estimatedBase = requirements.priceTarget.max / priceMultipliers[level];
    if (estimatedBase < 0.5) {
      constraints.push({
        type: 'price',
        description: `Price target may be too low for Level ${level} customization complexity`,
        severity: level >= 3 ? 'high' : 'medium',
        currentValue: `${requirements.priceTarget.currency} ${requirements.priceTarget.max}`,
        requiredValue: `~${requirements.priceTarget.currency} ${(requirements.priceTarget.max * priceMultipliers[level]).toFixed(2)} estimated`,
      });
    }
  }

  // Timeline constraints
  if (level >= 3) {
    constraints.push({
      type: 'timeline',
      description: `Level ${level} customization requires ${CUSTOMIZATION_LEVELS[level].developmentTime} development time`,
      severity: level >= 4 ? 'high' : 'medium',
      currentValue: 'Not specified',
      requiredValue: CUSTOMIZATION_LEVELS[level].developmentTime,
    });
  }

  // Supplier constraints
  if (level >= 4) {
    constraints.push({
      type: 'supplier',
      description: `Limited supplier availability for Level ${level} customization`,
      severity: 'high',
      currentValue: CUSTOMIZATION_LEVELS[level].supplierAvailability,
      requiredValue: 'Verified supplier with tooling capability required',
    });
  }

  // Tooling constraints
  if (level >= 4) {
    constraints.push({
      type: 'tooling',
      description: 'New tooling/mold investment required upfront',
      severity: 'critical',
      currentValue: 'No tooling',
      requiredValue: `${level === 4 ? 'Single mold fee' : 'Multiple tooling fees'} required`,
    });
  }

  return constraints;
}

function generateWarnings(
  request: ProductRequestJson,
  level: CustomizationLevel,
  constraints: CustomizationConstraint[]
): FeasibilityWarning[] {
  const warnings: FeasibilityWarning[] = [];

  const moqConstraint = constraints.find((c) => c.type === 'moq');
  if (moqConstraint) {
    warnings.push({
      id: uuid(),
      type: 'moq-mismatch',
      message: `MOQ mismatch: Your requested quantity (${moqConstraint.currentValue}) is below the typical minimum (${moqConstraint.requiredValue}) for ${CUSTOMIZATION_LEVELS[level].name} customization.`,
      severity: moqConstraint.severity === 'critical' ? 'error' : 'warning',
      suggestion: `Consider increasing order quantity to ${moqConstraint.requiredValue} or reducing customization level.`,
    });
  }

  const priceConstraint = constraints.find((c) => c.type === 'price');
  if (priceConstraint) {
    warnings.push({
      id: uuid(),
      type: 'price-mismatch',
      message: `Price target may not accommodate ${CUSTOMIZATION_LEVELS[level].name} level complexity. ${CUSTOMIZATION_LEVELS[level].costBehavior} cost behavior expected.`,
      severity: 'warning',
      suggestion: 'Consider simplifying customization or adjusting price expectations.',
    });
  }

  if (level >= 3) {
    warnings.push({
      id: uuid(),
      type: 'timeline-risk',
      message: `Development timeline: ${CUSTOMIZATION_LEVELS[level].developmentTime}. Timeline risk is ${CUSTOMIZATION_LEVELS[level].timelineRisk}.`,
      severity: level >= 4 ? 'error' : 'warning',
    });
  }

  if (level >= 4) {
    warnings.push({
      id: uuid(),
      type: 'supplier-limited',
      message: `Supplier availability: ${CUSTOMIZATION_LEVELS[level].supplierAvailability}. ${CUSTOMIZATION_LEVELS[level].earlyWarningSignal}.`,
      severity: 'error',
    });
  }

  if (level >= 4) {
    warnings.push({
      id: uuid(),
      type: 'tooling-required',
      message: `Setup fees: ${CUSTOMIZATION_LEVELS[level].setupFee}. Mold/tooling investment is non-recoverable if project is cancelled.`,
      severity: 'error',
      suggestion: 'Ensure volume commitment before investing in tooling.',
    });
  }

  return warnings;
}

function calculateFeasibility(level: CustomizationLevel, constraints: CustomizationConstraint[]): number {
  const baseFeasibility: Record<CustomizationLevel, number> = {
    1: 95,
    2: 85,
    3: 65,
    4: 45,
    5: 25,
  };

  let score = baseFeasibility[level];

  for (const constraint of constraints) {
    switch (constraint.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'high':
        score -= 10;
        break;
      case 'medium':
        score -= 5;
        break;
      case 'low':
        score -= 2;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function generateAlternatives(
  request: ProductRequestJson,
  level: CustomizationLevel,
  constraints: CustomizationConstraint[]
): AlternativeOption[] {
  const alternatives: AlternativeOption[] = [];

  if (level > 1) {
    // Suggest reducing customization level
    const reducedLevel = (level - 1) as CustomizationLevel;
    alternatives.push({
      id: uuid(),
      description: `Reduce to ${CUSTOMIZATION_LEVELS[reducedLevel].name} (Level ${reducedLevel})`,
      negotiableOn: ['customization-level'],
      tradeoffs: [
        `Simplified to ${CUSTOMIZATION_LEVELS[reducedLevel].coreDefinition}`,
        `Faster turnaround: ${CUSTOMIZATION_LEVELS[reducedLevel].developmentTime}`,
        `Lower rework risk: ${CUSTOMIZATION_LEVELS[reducedLevel].reworkCost}`,
      ],
      estimatedSaving: `${(level - reducedLevel) * 20}% cost reduction estimated`,
      newLevel: reducedLevel,
    });
  }

  // MOQ alternative
  const moqConstraint = constraints.find((c) => c.type === 'moq');
  if (moqConstraint && request.requirements.moq) {
    alternatives.push({
      id: uuid(),
      description: `Increase MOQ to ${moqConstraint.requiredValue} units for better pricing`,
      negotiableOn: ['moq'],
      tradeoffs: [
        `Higher initial investment`,
        `Better per-unit pricing`,
        `More supplier options available`,
      ],
      newMoq: parseInt(moqConstraint.requiredValue),
    });
  }

  // Price-adjusted alternative
  if (request.requirements.priceTarget) {
    alternatives.push({
      id: uuid(),
      description: 'Adjust specifications for price target',
      negotiableOn: ['price', 'customization-type'],
      tradeoffs: [
        'Simplified customization to meet budget',
        'May use standard materials instead of premium',
        'Logo size or placement may be adjusted',
      ],
      newPrice: {
        min: request.requirements.priceTarget.min,
        max: request.requirements.priceTarget.max,
        currency: request.requirements.priceTarget.currency,
      },
      newLevel: Math.max(1, level - 1) as CustomizationLevel,
    });
  }

  return alternatives;
}
