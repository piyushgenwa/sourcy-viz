import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { stripQuantityFromDescription } from '@/lib/strip-quantity';
import { extractProductDetailsFromUrl, formatProductDetailsForPrompt } from '@/lib/scrape-url';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const PGE1_SYSTEM = `You are a product design expert helping create product visualization images for manufacturing.

Analyze the user's product description and identify 3–5 critical pieces of missing visual information needed to generate accurate, diverse product images.

IMPORTANT: Ignore any quantity or order volume information (e.g. "500 units", "MOQ 1000"). Quantity is a sourcing constraint, not a visual parameter.

Generate focused questions targeting these visual dimensions ONLY:
- Aesthetic style and design language (modern vs classic, minimal vs ornate)
- Material and texture specifics
- Color direction (warmth, saturation, finish — not just color name)
- Scale, proportion, and form hints
- Target context and usage setting (luxury, everyday, industrial, etc.)

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "id": "q1",
    "question": "What design aesthetic are you targeting?",
    "options": ["Modern & Minimalist", "Classic & Traditional", "Bold & Expressive", "Natural & Organic"],
    "allowCustom": true,
    "required": true
  }
]

Rules:
- 3 to 5 questions maximum
- Each question must have exactly 3–4 options
- Keep questions concise (under 12 words each)
- Options must be visually distinct and span a meaningful range
- If the description is already visually detailed, return fewer questions`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let productDescription: string;
  let referenceImageData: string | undefined;
  let referenceImageMimeType: string | undefined;
  let referenceUrl: string | undefined;
  try {
    const body = await request.json();
    productDescription = body.productDescription;
    referenceImageData = body.referenceImageData;
    referenceImageMimeType = body.referenceImageMimeType;
    referenceUrl = body.referenceUrl;
    if (!productDescription || typeof productDescription !== 'string') {
      return NextResponse.json({ error: 'productDescription is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Optionally scrape URL for additional product context
  let urlContext = '';
  if (referenceUrl) {
    const details = await extractProductDetailsFromUrl(referenceUrl, apiKey, TEXT_MODEL);
    if (details) {
      urlContext = `\n\nReference product from URL:\n${formatProductDetailsForPrompt(details)}`;
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: PGE1_SYSTEM,
    });

    const visualDescription = stripQuantityFromDescription(productDescription);
    const promptText = `Product description: "${visualDescription}"${urlContext}\n\nGenerate clarification questions to fill critical visual gaps.`;

    // Use multimodal if reference image is provided
    const result =
      referenceImageData && referenceImageMimeType
        ? await model.generateContent([
            {
              inlineData: { data: referenceImageData, mimeType: referenceImageMimeType },
            },
            promptText,
          ])
        : await model.generateContent(promptText);

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PGE1 failed';
    console.error('[pge1]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
