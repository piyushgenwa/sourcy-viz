import { GoogleGenerativeAI } from '@google/generative-ai';

const SCRAPE_SYSTEM = `You are a product information extractor. Given raw text content from a product webpage, extract the key product details relevant for design and visualization.

Return ONLY a valid JSON object with these fields (omit fields you cannot determine):
{
  "productName": "...",
  "category": "...",
  "materials": ["..."],
  "colors": ["..."],
  "dimensions": "...",
  "style": "...",
  "keyFeatures": ["..."],
  "targetAudience": "...",
  "designDetails": "..."
}

Focus on visual and design-relevant attributes only. Ignore prices, reviews, shipping, and stock information.
Return ONLY valid JSON — no markdown, no explanation.`;

/** Strip HTML tags and collapse whitespace */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface ScrapedProductDetails {
  productName?: string;
  category?: string;
  materials?: string[];
  colors?: string[];
  dimensions?: string;
  style?: string;
  keyFeatures?: string[];
  targetAudience?: string;
  designDetails?: string;
}

/**
 * Fetches a URL, extracts its text, and uses Gemini to parse product design details.
 * Returns null if fetching or extraction fails.
 */
export async function extractProductDetailsFromUrl(
  url: string,
  apiKey: string,
  model = 'gemini-2.0-flash'
): Promise<ScrapedProductDetails | null> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    return null;
  }

  // Fetch the page
  let rawText: string;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sourcy/1.0; +https://sourcy.ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    rawText = stripHtml(html);

    // Truncate to ~20k chars to stay within token limits
    if (rawText.length > 20_000) {
      rawText = rawText.slice(0, 20_000);
    }
  } catch {
    return null;
  }

  // Use Gemini to extract product details
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model,
      systemInstruction: SCRAPE_SYSTEM,
    });

    const result = await geminiModel.generateContent(
      `Extract product design details from this webpage content:\n\n${rawText}`
    );

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]) as ScrapedProductDetails;
  } catch {
    return null;
  }
}

/** Convert ScrapedProductDetails to a concise text summary for prompt injection */
export function formatProductDetailsForPrompt(details: ScrapedProductDetails): string {
  const parts: string[] = [];
  if (details.productName) parts.push(`Product: ${details.productName}`);
  if (details.category) parts.push(`Category: ${details.category}`);
  if (details.style) parts.push(`Style: ${details.style}`);
  if (details.materials?.length) parts.push(`Materials: ${details.materials.join(', ')}`);
  if (details.colors?.length) parts.push(`Colors: ${details.colors.join(', ')}`);
  if (details.dimensions) parts.push(`Dimensions: ${details.dimensions}`);
  if (details.keyFeatures?.length) parts.push(`Key features: ${details.keyFeatures.join(', ')}`);
  if (details.targetAudience) parts.push(`Target audience: ${details.targetAudience}`);
  if (details.designDetails) parts.push(`Design details: ${details.designDetails}`);
  return parts.join('\n');
}
