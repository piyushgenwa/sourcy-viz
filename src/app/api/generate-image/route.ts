import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Nano Banana = Gemini 2.5 Flash Image model
const NANOBANANA_MODEL = process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image-preview';

// Extend Vercel function timeout – image generation can take 20-40s
export const maxDuration = 60;

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
      model: NANOBANANA_MODEL,
      contents: prompt,
      config: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType) {
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
