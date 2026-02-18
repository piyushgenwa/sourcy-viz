import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Image model — configurable via GEMINI_IMAGE_MODEL env var (falls back to legacy NANOBANANA_MODEL)
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let prompt: string;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: prompt,
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
