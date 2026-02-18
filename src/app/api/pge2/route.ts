import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const PGE2_SYSTEM = `You are an expert AI image prompt engineer specializing in product photography for manufacturing and sourcing.

Given a product description and optional user clarifications, create exactly 5 distinct image generation prompts. Each must produce a clearly different visual result while staying true to the core product identity.

ANCHORING REQUIREMENTS (keep consistent across all 5):
- Core product type, function, and identity
- Any constraints explicitly stated by the user

FLEXIBLE DIMENSIONS (vary meaningfully across the 5):
- Overall design aesthetic (minimalist / ornate / industrial / luxury / natural)
- Material feel and texture treatment
- Color palette direction (light/dark, warm/cool, saturated/muted, monochrome/vibrant)
- Design detail emphasis (hardware, stitching, surface texture, structural details)
- Compositional mood and lighting style

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "id": "v1",
    "name": "Modern Minimal",
    "description": "Clean lines, understated elegance",
    "prompt": "Professional product photography: [full detailed description], clean studio lighting, pure white background, sharp focus, commercial quality",
    "anchoredAspects": ["leather tote bag", "functional design"],
    "flexibleAspects": ["minimalist style", "charcoal grey", "smooth matte finish"]
  }
]

Rules:
- Exactly 5 prompts required
- Each prompt must be self-contained and complete — start with "Professional product photography:"
- End each prompt with: studio lighting details and "white background, sharp focus"
- Names must be 2–3 words max
- The 5 prompts must explore visually distinct territories — user should immediately see the difference`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let productDescription: string;
  let answers: Record<string, string>;
  try {
    const body = await request.json();
    productDescription = body.productDescription;
    answers = body.answers || {};
    if (!productDescription || typeof productDescription !== 'string') {
      return NextResponse.json({ error: 'productDescription is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const answersText =
    Object.keys(answers).length > 0
      ? `\n\nUser clarifications:\n${Object.entries(answers)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join('\n')}`
      : '';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: PGE2_SYSTEM,
    });

    const result = await model.generateContent(
      `Product description: "${productDescription}"${answersText}\n\nGenerate exactly 5 distinct image generation prompts.`
    );

    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const prompts = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ prompts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PGE2 failed';
    console.error('[pge2]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
