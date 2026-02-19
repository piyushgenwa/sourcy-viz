import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Image model — text→image only, does NOT accept image input
const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let prompt: string;
  let referenceImageDescription: string | undefined;
  try {
    const body = await request.json();
    prompt = body.prompt;
    referenceImageDescription = body.referenceImageDescription;
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // If a reference image was uploaded, its visual style was pre-described once (by /api/describe-image)
  // and is passed here as text. Append it to the prompt before sending to the image model.
  const finalPrompt = referenceImageDescription
    ? `${prompt} — Visual style reference: ${referenceImageDescription}`
    : prompt;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: finalPrompt,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData) {
        return NextResponse.json({
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    return NextResponse.json({ error: 'No image in response' }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    console.error('[generate-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
