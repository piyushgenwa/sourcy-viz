import { v4 as uuid } from 'uuid';
import type { ProductRequestJson, VisualizationItem, PriceTarget } from '@/types/product';

const ADJECTIVES = ['Classic', 'Modern', 'Minimalist', 'Premium', 'Artisan', 'Bold', 'Sleek', 'Rustic', 'Refined', 'Vintage'];
const STYLE_VARIANTS = ['streamlined', 'textured', 'matte finish', 'glossy', 'embossed', 'debossed', 'foil accent', 'woven', 'stitched', 'layered'];

/**
 * Generate a set of diverse visualization items for the divergence phase.
 * At L0 we generate 5 varied items, at deeper levels we generate 3 refined items.
 */
export function generateVisualizationItems(
  request: ProductRequestJson,
  count: number,
  altDescription?: string
): VisualizationItem[] {
  const items: VisualizationItem[] = [];
  const desc = altDescription || request.product.description;
  const material = request.product.material || 'standard material';
  const colors = request.product.colors.length > 0 ? request.product.colors : ['natural'];
  const category = request.product.category;

  for (let i = 0; i < count; i++) {
    const adj = ADJECTIVES[i % ADJECTIVES.length];
    const style = STYLE_VARIANTS[i % STYLE_VARIANTS.length];
    const colorChoice = colors[i % colors.length];
    const sizeVariant = request.product.size || 'standard';

    const price = generatePriceEstimate(request, i);
    const moq = generateMoqEstimate(request, i);

    items.push({
      id: uuid(),
      name: `${adj} ${capitalize(desc)}`,
      description: `${adj} ${desc} in ${colorChoice} with ${style} detail. Made from ${material}, sized ${sizeVariant}. ${getCategoryContext(category, i)}.`,
      imagePrompt: `Product photo: ${adj.toLowerCase()} ${desc}, ${colorChoice} color, ${material} material, ${style}, professional product photography, white background`,
      imagePlaceholder: generatePlaceholderGradient(i),
      specs: {
        Style: `${adj} ${style}`,
        Material: material,
        Color: colorChoice,
        Size: sizeVariant,
        Finish: style,
      },
      estimatedPrice: price,
      estimatedMoq: moq,
    });
  }

  return items;
}

/**
 * Branch from a selected item to create variations that converge toward
 * the user's vision. Each branch item is a refined variant of the parent.
 */
export function branchFromItem(
  parent: VisualizationItem,
  request: ProductRequestJson,
  count: number
): VisualizationItem[] {
  const items: VisualizationItem[] = [];
  const refinements = [
    { label: 'Material Variant', tweak: 'different material texture' },
    { label: 'Color Variant', tweak: 'alternative color palette' },
    { label: 'Detail Variant', tweak: 'enhanced finishing details' },
    { label: 'Size Variant', tweak: 'adjusted proportions' },
    { label: 'Structure Variant', tweak: 'modified structure' },
  ];

  for (let i = 0; i < count; i++) {
    const refinement = refinements[i % refinements.length];
    const price = parent.estimatedPrice
      ? {
          min: +(parent.estimatedPrice.min! * (0.9 + Math.random() * 0.3)).toFixed(2),
          max: +(parent.estimatedPrice.max! * (0.9 + Math.random() * 0.3)).toFixed(2),
          currency: parent.estimatedPrice.currency,
        }
      : undefined;

    items.push({
      id: uuid(),
      name: `${parent.name} - ${refinement.label}`,
      description: `Refined variant of "${parent.name}" with ${refinement.tweak}. ${parent.description}`,
      imagePrompt: `${parent.imagePrompt}, ${refinement.tweak}, refined variant`,
      imagePlaceholder: generatePlaceholderGradient(i + 5),
      specs: {
        ...parent.specs,
        Refinement: refinement.label,
        Tweak: refinement.tweak,
      },
      estimatedPrice: price,
      estimatedMoq: parent.estimatedMoq,
    });
  }

  return items;
}

function generatePriceEstimate(request: ProductRequestJson, index: number): PriceTarget {
  const target = request.requirements.priceTarget;
  const base = target?.max || 5;
  const variance = 0.6 + (index * 0.15);
  return {
    min: +(base * variance * 0.8).toFixed(2),
    max: +(base * variance * 1.2).toFixed(2),
    currency: target?.currency || 'USD',
  };
}

function generateMoqEstimate(request: ProductRequestJson, index: number): number {
  const baseMoq = request.requirements.moq || 500;
  const multipliers = [1, 0.8, 1.2, 1.5, 0.6];
  return Math.round(baseMoq * multipliers[index % multipliers.length]);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCategoryContext(category: string, index: number): string {
  const contexts: Record<string, string[]> = {
    'bags-leather': [
      'Reinforced stitching throughout',
      'Premium hardware fittings',
      'Adjustable strap included',
      'Internal pockets and organizer',
      'Water-resistant coating',
    ],
    'packaging-paper': [
      'FSC-certified paper stock',
      'Reinforced bottom gusset',
      'Premium rope handles',
      'Spot UV finish available',
      'Recyclable and eco-friendly',
    ],
    'packaging-box': [
      'Rigid board construction',
      'Magnetic closure',
      'Custom foam insert',
      'Debossed lid detail',
      'Matte lamination finish',
    ],
    'apparel': [
      'Pre-shrunk fabric',
      'Double-needle hem',
      'Tagless comfort label',
      'Reinforced seams',
      'Breathable construction',
    ],
    other: [
      'Quality assured construction',
      'Durable finish',
      'Versatile design',
      'Professional grade',
      'Customization ready',
    ],
  };

  const list = contexts[category] || contexts['other'];
  return list[index % list.length];
}

function generatePlaceholderGradient(index: number): string {
  const gradients = [
    'from-blue-200 to-blue-400',
    'from-emerald-200 to-emerald-400',
    'from-amber-200 to-amber-400',
    'from-rose-200 to-rose-400',
    'from-violet-200 to-violet-400',
    'from-cyan-200 to-cyan-400',
    'from-orange-200 to-orange-400',
    'from-teal-200 to-teal-400',
    'from-pink-200 to-pink-400',
    'from-indigo-200 to-indigo-400',
  ];
  return gradients[index % gradients.length];
}
