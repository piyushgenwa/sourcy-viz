import { v4 as uuid } from 'uuid';
import type { ProductRequest, ProductCategory, LogoSpec, CustomizationInput } from '@/types/product';

/**
 * Parse a free-text product request into a structured ProductRequest object.
 * This handles the "textual entry" mode where users describe their product in natural language.
 */
export function parseTextRequest(rawText: string): Partial<ProductRequest> {
  const text = rawText.toLowerCase();

  return {
    id: uuid(),
    description: extractDescription(rawText),
    size: extractSize(text),
    material: extractMaterial(text),
    colors: extractColors(text),
    customization: extractCustomization(text),
    category: detectCategory(text),
    priceTarget: extractPrice(text),
    moq: extractMoq(text),
    rawText,
    createdAt: new Date().toISOString(),
  };
}

function extractDescription(text: string): string {
  // Take the first sentence or up to 200 chars as the description
  const firstSentence = text.split(/[.!?\n]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= 200) return firstSentence;
  return text.substring(0, 200).trim();
}

function extractSize(text: string): string | undefined {
  // Match dimensions like 21x14x27cm, 10"x8", etc.
  const dimMatch = text.match(/(\d+\s*[x×]\s*\d+(?:\s*[x×]\s*\d+)?)\s*(cm|mm|in|inch|inches|")/i);
  if (dimMatch) return dimMatch[0];

  // Match size keywords
  const sizeMatch = text.match(/\b(small|medium|large|xl|xxl|xs|mini|standard|oversized|compact)\b/i);
  if (sizeMatch) return sizeMatch[0];

  return undefined;
}

function extractMaterial(text: string): string | undefined {
  const materials = [
    'leather', 'pu leather', 'genuine leather', 'faux leather', 'vegan leather',
    'canvas', 'cotton', 'polyester', 'nylon', 'silk', 'linen', 'denim',
    'kraft', 'cardboard', 'paper', 'corrugated',
    'metal', 'stainless steel', 'aluminum', 'brass', 'copper',
    'plastic', 'acrylic', 'silicone', 'rubber',
    'wood', 'bamboo', 'cork',
    'glass', 'ceramic', 'porcelain',
  ];

  for (const mat of materials) {
    if (text.includes(mat)) return mat;
  }

  return undefined;
}

function extractColors(text: string): string[] {
  const colorWords = [
    'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'violet',
    'pink', 'black', 'white', 'grey', 'gray', 'brown', 'beige', 'tan',
    'navy', 'teal', 'coral', 'burgundy', 'maroon', 'gold', 'silver',
    'rose gold', 'champagne', 'ivory', 'cream', 'olive', 'mint',
    'natural', 'nude', 'charcoal', 'forest green', 'sky blue',
  ];

  const found: string[] = [];
  for (const color of colorWords) {
    if (text.includes(color)) found.push(color);
  }

  return found;
}

function extractCustomization(text: string): CustomizationInput {
  const logo = extractLogo(text);
  const features = extractFeatures(text);
  const colorVariations = extractColorVariations(text);

  return { logo: logo || undefined, features, colorVariations };
}

function extractLogo(text: string): LogoSpec | null {
  if (text.includes('emboss')) return { type: 'embossing', description: 'Logo embossing' };
  if (text.includes('engrav')) return { type: 'engraving', description: 'Logo engraving' };
  if (text.includes('heat press')) return { type: 'heat-press', description: 'Heat press logo' };
  if (text.includes('rubber tag')) return { type: 'rubber-tag', description: 'Rubber tag logo' };
  if (text.includes('label') && text.includes('logo')) return { type: 'label', description: 'Label logo' };
  if (text.includes('print') && text.includes('logo')) return { type: 'printing', description: 'Printed logo' };
  if (text.includes('logo')) return { type: 'printing', description: 'Logo application' };

  return null;
}

function extractFeatures(text: string): string[] {
  const featureKeywords = [
    'd-ring', 'strap', 'hardware', 'zipper', 'pocket', 'compartment',
    'handle', 'magnetic closure', 'velcro', 'snap button',
    'custom box', 'insert', 'foam insert', 'divider',
    'size modification', 'structural', 'mold', 'tooling',
    'assembly', 'multi-component', 'embossing', 'debossing',
    'foil stamping', 'spot uv', 'lamination', 'coating',
    'printing', 'screen print', 'digital print',
  ];

  const found: string[] = [];
  for (const kw of featureKeywords) {
    if (text.includes(kw)) found.push(kw);
  }

  return found;
}

function extractColorVariations(text: string): string[] {
  const variationMatch = text.match(/(\d+)\s*color\s*variation/i);
  if (variationMatch) {
    const count = parseInt(variationMatch[1]);
    return Array.from({ length: count }, (_, i) => `Variation ${i + 1}`);
  }
  return [];
}

function detectCategory(text: string): ProductCategory {
  if (/\bbag|tote|backpack|handbag|purse|clutch|wallet|briefcase|leather\s*goods?\b/.test(text)) return 'bags-leather';
  if (/\bpaper\s*bag|shopping\s*bag|kraft|carrier\s*bag\b/.test(text)) return 'packaging-paper';
  if (/\bbox|packaging|carton|mailer\b/.test(text)) return 'packaging-box';
  if (/\bshirt|dress|jacket|hoodie|apparel|clothing|garment\b/.test(text)) return 'apparel';
  if (/\bjewelry|watch|sunglasses|scarf|hat|belt|accessory|accessories\b/.test(text)) return 'accessories';
  if (/\bmug|candle|cushion|blanket|home\b/.test(text)) return 'homeware';
  if (/\bphone|cable|charger|speaker|electronic\b/.test(text)) return 'electronics';
  if (/\blipstick|cream|serum|cosmetic|beauty\b/.test(text)) return 'cosmetics';
  if (/\bfood.*pack|tin|jar|bottle|pouch\b/.test(text)) return 'food-packaging';
  return 'other';
}

function extractPrice(text: string): { min?: number; max?: number; currency: string } | undefined {
  // Match patterns like $2-5, USD 2-5, ¥0.58, etc.
  const priceMatch = text.match(/[\$\u00A5\u20AC\u00A3]?\s*(\d+(?:\.\d+)?)\s*[-\u2013to]+\s*(\d+(?:\.\d+)?)/);
  if (priceMatch) {
    const currency = text.includes('\u00A5') ? 'CNY' : text.includes('\u20AC') ? 'EUR' : text.includes('\u00A3') ? 'GBP' : 'USD';
    return { min: parseFloat(priceMatch[1]), max: parseFloat(priceMatch[2]), currency };
  }

  const singlePrice = text.match(/[\$\u00A5\u20AC\u00A3]\s*(\d+(?:\.\d+)?)/);
  if (singlePrice) {
    const currency = text.includes('\u00A5') ? 'CNY' : text.includes('\u20AC') ? 'EUR' : text.includes('\u00A3') ? 'GBP' : 'USD';
    return { max: parseFloat(singlePrice[1]), currency };
  }

  return undefined;
}

function extractMoq(text: string): number | undefined {
  const moqMatch = text.match(/\bmoq\s*:?\s*(\d[\d,]*)/i);
  if (moqMatch) return parseInt(moqMatch[1].replace(/,/g, ''));

  const unitMatch = text.match(/(\d[\d,]*)\s*(units?|pieces?|pcs|qty)/i);
  if (unitMatch) return parseInt(unitMatch[1].replace(/,/g, ''));

  return undefined;
}
