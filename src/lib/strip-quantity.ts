/**
 * Strips quantity/MOQ references from a product description.
 * Quantity is an MOQ attribute used for sourcing, not a visual parameter
 * for image generation. Removing it keeps image prompts focused on the
 * product's visual identity.
 */
export function stripQuantityFromDescription(description: string): string {
  return description
    // Remove explicit MOQ patterns: "MOQ: 500", "MOQ 1,000 units"
    .replace(/\bmoq\s*:?\s*\d[\d,]*\s*(units?|pieces?|pcs|qty)?\b/gi, '')
    // Remove quantity + unit patterns: "500 units", "1,000 pieces", "2000 pcs"
    .replace(/\b\d[\d,]*\s*(units?|pieces?|pcs|qty)\b/gi, '')
    // Remove leading quantity phrases: "I need 500", "we need 2000", "order of 1000"
    .replace(/\b(i need|we need|order of|ordering)\s+\d[\d,]*\b/gi, '')
    // Clean up artefacts: double commas, leading/trailing commas, extra spaces
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
