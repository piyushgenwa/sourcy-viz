import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const PGE3_SYSTEM = `You are an expert AI image prompt engineer specializing in product design refinement.

The user has selected a specific product design direction. Generate exactly 3 refined variation prompts that explore deeper nuances within that anchored design — not radical departures.

ANCHOR (must be preserved from the selected design):
- Core design language and aesthetic direction
- Overall style the user chose
- Primary material and structural approach

EXPLORE (vary within the anchored frame — pick one dimension per variation):
- Material finish and texture details (pebbled vs smooth vs brushed vs woven vs embossed)
- Color temperature and tonal shift (lighter/darker version, warm/cool shift, monochrome accent)
- Hardware and accent details (metal finish, closures, rivets, trims)
- Surface treatments (matte vs semi-gloss vs high-gloss vs satin)
- Proportion emphasis and silhouette refinement

Return ONLY a valid JSON array — no markdown, no explanation:
[
  {
    "id": "n1",
    "name": "Texture Deep Dive",
    "description": "Exploring material surface treatment",
    "prompt": "Professional product photography: [full self-contained description anchored to selected design with specific refinement], soft studio lighting, white background, sharp focus, commercial quality",
    "anchoredAspects": ["minimalist black leather tote", "structured silhouette"],
    "flexibleAspects": ["pebbled grain texture", "brushed gold hardware"]
  }
]

Rules:
- Exactly 3 prompts required
- Each must clearly build from the parent design — not a completely new design
- Each variation explores one distinct refinement dimension
- Prompts must be fully self-contained — include all context, do not reference "the selected image"
- Names must be 2–3 words max`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let productDescription: string;
  let answers: Record<string, string>;
  let selectedPrompt: string;
  let selectedName: string;
  let level: number;
  try {
    const body = await request.json();
    productDescription = body.productDescription;
    answers = body.answers || {};
    selectedPrompt = body.selectedPrompt;
    selectedName = body.selectedName || 'selected design';
    level = body.level || 1;

    if (!productDescription || !selectedPrompt) {
      return NextResponse.json(
        { error: 'productDescription and selectedPrompt are required' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const answersText =
    Object.keys(answers).length > 0
      ? `\nOriginal requirements: ${Object.entries(answers)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')}`
      : '';

  const levelContext =
    level === 2
      ? 'This is a second-level refinement — go even deeper into specific surface details, finishes, and micro-details.'
      : 'This is a first-level refinement — explore primary variation dimensions (texture, color shift, hardware).';

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: PGE3_SYSTEM,
    });

    const prompt = `Product: "${productDescription}"${answersText}

Selected design ("${selectedName}"): ${selectedPrompt}

${levelContext}

Generate exactly 3 refined nested variations anchored to the selected design above.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const prompts = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ prompts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PGE3 failed';
    console.error('[pge3]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
