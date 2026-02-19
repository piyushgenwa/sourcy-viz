import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Increase body size limit for this route (base64 images can be several MB)
export const maxDuration = 30;

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let imageData: string;
  let imageMimeType: string;
  try {
    const body = await request.json();
    imageData = body.imageData;
    imageMimeType = body.imageMimeType;
    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'imageData is required' }, { status: 400 });
    }
    if (!imageMimeType || typeof imageMimeType !== 'string') {
      return NextResponse.json({ error: 'imageMimeType is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

    const result = await model.generateContent([
      { inlineData: { data: imageData, mimeType: imageMimeType } },
      'Describe this product image in 2–3 concise sentences focusing only on visual and design attributes: materials, textures, color palette, finish, structural style, and aesthetic. Be specific. Do not mention brand names, prices, or any text visible in the image.',
    ]);

    const description = result.response.text().trim();
    return NextResponse.json({ description });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Image description failed';
    console.error('[describe-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
