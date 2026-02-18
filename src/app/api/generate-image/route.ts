import { NextRequest } from 'next/server';

// Use Edge Runtime for 30s timeout on Vercel Hobby plan
// (Serverless functions are capped at 10s on Hobby, too short for image gen)
export const runtime = 'edge';

// Nano Banana = Gemini 2.5 Flash Image model
const NANOBANANA_MODEL = process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image-preview';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let prompt: string;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (!prompt || typeof prompt !== 'string') {
      return Response.json({ error: 'prompt is required' }, { status: 400 });
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const url = `${GEMINI_API_BASE}/${NANOBANANA_MODEL}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[generate-image] Gemini API error:', res.status, errBody);
      return Response.json(
        { error: `Gemini API error: ${res.status}`, detail: errBody },
        { status: 502 },
      );
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType) {
        return Response.json({
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    return Response.json({ error: 'No image in response', parts }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    console.error('[generate-image]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
