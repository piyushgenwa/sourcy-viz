import { NextRequest, NextResponse } from 'next/server';
import { extractProductDetailsFromUrl } from '@/lib/scrape-url';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let url: string;
  try {
    const body = await request.json();
    url = body.url;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }
    new URL(url); // validate URL format
  } catch {
    return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
  }

  const productDetails = await extractProductDetailsFromUrl(url, apiKey, TEXT_MODEL);
  if (!productDetails) {
    return NextResponse.json({ error: 'Failed to extract product details from URL' }, { status: 422 });
  }

  return NextResponse.json({ productDetails });
}
