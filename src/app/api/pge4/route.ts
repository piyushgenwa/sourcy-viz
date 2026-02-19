import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { stripQuantityFromDescription } from '@/lib/strip-quantity';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const PGE4_SYSTEM = `You are an expert AI image prompt engineer specialising in hero product photography for manufacturing and sourcing platforms.

The user has finalised a product design. Generate exactly 3 image prompts — one for each of the following camera perspectives:

1. FRONT VIEW — camera directly facing the product, product fills the frame, frontal plane fully visible
2. SIDE VIEW — camera at a 90-degree profile (left or right side), showing depth, silhouette, and profile details
3. TOP VIEW — camera directly overhead (bird's-eye), product laid flat or displayed from above, showing the top face

STUDIO ENVIRONMENT (mandatory for all 3):
- Professional studio setting with controlled, soft diffused lighting
- Plain solid background — choose a color that is contextually harmonious with the product's color palette (e.g. warm ivory for tan leather, soft slate for charcoal, pale blush for rose-toned products)
- Do NOT use pure white unless the product is predominantly white; pick a subtle, complementary studio tone
- No props, no shadows on walls, no lifestyle context — pure product focus

WHAT TO PRESERVE across all 3 views:
- Exact same product design, materials, finish, color, and hardware as described
- Consistent lighting style and background color across all three prompts
- Commercial product photography quality

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "id": "hero-front",
    "name": "Front View",
    "description": "Direct frontal perspective showing the full face of the product",
    "prompt": "Professional hero product photography: [full product description], FRONT VIEW — camera directly facing the product, centered composition, [product color]-complementary plain studio background, soft diffused studio lighting, sharp focus throughout, commercial quality, no props",
    "anchoredAspects": ["front-facing camera angle", "studio environment"],
    "flexibleAspects": []
  },
  {
    "id": "hero-side",
    "name": "Side View",
    "description": "90-degree profile perspective revealing depth and silhouette",
    "prompt": "Professional hero product photography: [full product description], SIDE VIEW — camera at 90-degree profile showing the side silhouette and depth, [product color]-complementary plain studio background, soft diffused studio lighting, sharp focus throughout, commercial quality, no props",
    "anchoredAspects": ["side profile camera angle", "studio environment"],
    "flexibleAspects": []
  },
  {
    "id": "hero-top",
    "name": "Top View",
    "description": "Bird's-eye overhead perspective showing the top face",
    "prompt": "Professional hero product photography: [full product description], TOP VIEW — camera directly overhead showing the top face, flat-lay or elevated display, [product color]-complementary plain studio background, soft diffused studio lighting, sharp focus throughout, commercial quality, no props",
    "anchoredAspects": ["overhead camera angle", "studio environment"],
    "flexibleAspects": []
  }
]

Rules:
- Exactly 3 prompts required — one for each view: front, side, top
- IDs must be exactly: "hero-front", "hero-side", "hero-top"
- Each prompt must be fully self-contained and include complete product details
- The background color must be the same across all 3 prompts (pick once, use consistently)
- Prompts must clearly specify the camera angle/perspective so the image model renders the correct view
- Do NOT include quantity or MOQ in any prompt`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let productDescription: string;
  let selectedPrompt: string;
  let selectedName: string;
  let selectedDescription: string;

  try {
    const body = await request.json();
    productDescription = body.productDescription;
    selectedPrompt = body.selectedPrompt;
    selectedName = body.selectedName || 'finalised product';
    selectedDescription = body.selectedDescription || '';

    if (!productDescription || !selectedPrompt) {
      return NextResponse.json(
        { error: 'productDescription and selectedPrompt are required' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: PGE4_SYSTEM,
    });

    const visualDescription = stripQuantityFromDescription(productDescription);
    const prompt = `Product: "${visualDescription}"

Finalised design ("${selectedName}"): ${selectedPrompt}${selectedDescription ? `\nDesign summary: ${selectedDescription}` : ''}

Generate exactly 3 hero banner image prompts — front view, side view, and top view — for this finalised product. All must be shot in a professional studio environment with a plain background whose color is contextually matched to the product's color palette.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const prompts = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ prompts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PGE4 failed';
    console.error('[pge4]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
