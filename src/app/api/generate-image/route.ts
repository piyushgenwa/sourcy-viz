import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Image model — text→image only, does NOT accept image input
const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || process.env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';

// Vision/text model used to describe a reference image before passing to the image model
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

/**
 * Uses a vision-capable text model to describe a reference image's visual style.
 * Returns a concise style description to inject into the image generation prompt.
 */
async function describeReferenceImage(
  apiKey: string,
  imageData: string,
  imageMimeType: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

  const result = await model.generateContent([
    { inlineData: { data: imageData, mimeType: imageMimeType } },
    'Describe this product image in 2–3 concise sentences focusing only on visual and design attributes: materials, textures, color palette, finish, structural style, and aesthetic. Do not mention brand names, prices, or text visible in the image.',
  ]);

  return result.response.text().trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let prompt: string;
  let referenceImageData: string | undefined;
  let referenceImageMimeType: string | undefined;
  try {
    const body = await request.json();
    prompt = body.prompt;
    referenceImageData = body.referenceImageData;
    referenceImageMimeType = body.referenceImageMimeType;
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Step 1: If a reference image is provided, describe its visual style using a vision model.
  // The gemini image model (text→image) cannot accept image input directly.
  let enrichedPrompt = prompt;
  if (referenceImageData && referenceImageMimeType) {
    try {
      const styleDescription = await describeReferenceImage(
        apiKey,
        referenceImageData,
        referenceImageMimeType
      );
      enrichedPrompt = `${prompt} — Reference style: ${styleDescription}`;
    } catch {
      // Non-fatal: fall back to the original prompt if vision description fails
    }
  }

  // Step 2: Generate the image using the text→image model with the (possibly enriched) prompt
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: enrichedPrompt,
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
