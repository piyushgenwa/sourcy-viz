import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { KnowledgeEntry, ProductCategory } from '@/types/product';
import { v4 as uuid } from 'uuid';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

/**
 * Large files (e.g. a dump of many conversations) are split into chunks so that
 * each Gemini extraction call can produce a complete JSON response within the
 * output token limit. Splits at natural line boundaries.
 */
const MAX_CHUNK_CHARS = 15_000;

function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > MAX_CHUNK_CHARS) {
    // Prefer splitting at a double newline, then a single newline
    let splitAt = remaining.lastIndexOf('\n\n', MAX_CHUNK_CHARS);
    if (splitAt < MAX_CHUNK_CHARS / 2) {
      splitAt = remaining.lastIndexOf('\n', MAX_CHUNK_CHARS);
    }
    if (splitAt < MAX_CHUNK_CHARS / 2) {
      splitAt = MAX_CHUNK_CHARS;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks.filter((c) => c.length > 100); // skip near-empty trailing pieces
}

const EXTRACT_SYSTEM = `You are an expert sourcing analyst who reads raw supplier-buyer conversations (which may be in Chinese, English, or mixed) and extracts structured knowledge for a product sourcing knowledge base.

## Your Task
Given a supplier conversation text, you must:
1. Detect the language. If the conversation is in Chinese (or other non-English), translate all relevant content to English.
2. Extract every distinct sourcing insight from the conversation.
3. Return a JSON object.

## Knowledge Entry Types
- "supplier-constraint": Hard limits a supplier states (MOQ floors, material restrictions, lead time minimums, capabilities they don't have)
- "moq-data": Specific minimum order quantity data points with numbers
- "pricing-insight": Pricing information, cost breakdowns, price differences between options
- "tradeoff": Trade-offs negotiated or discussed (e.g., lower MOQ accepted in exchange for higher price)
- "request-pattern": Common buyer request patterns or product customization requests

## Product Categories
Use exactly one of: bags-leather, packaging-paper, packaging-box, apparel, accessories, homeware, electronics, cosmetics, food-packaging, other

## Output Format
Return ONLY a valid JSON object (no markdown, no code fences) with this shape:
{
  "detectedLanguage": "Chinese" | "English" | "Mixed" | "Other",
  "entries": [
    {
      "type": "supplier-constraint" | "moq-data" | "pricing-insight" | "tradeoff" | "request-pattern",
      "category": "<one of the categories above>",
      "content": "<Clear English sentence describing the insight>",
      "metadata": { "<key>": "<value>", ... },
      "originalText": "<The original source language excerpt, if non-English; omit if already English>"
    }
  ]
}

## Rules
- Extract ALL distinct facts—do not summarise multiple facts into one entry
- Use specific numbers when mentioned (e.g., "MOQ 500 units", "¥2.50/unit")
- metadata should hold structured numeric/unit data: moqMin, moqMax, price, currency, leadTime, component, etc.
- If nothing useful can be extracted, return an empty entries array
- Do not invent data that is not in the conversation`;

const DEDUPLICATE_SYSTEM = `You are a knowledge base curator. You receive a list of raw knowledge entries extracted from multiple supplier conversations, where similar insights may appear multiple times (possibly worded differently).

## Your Task
Consolidate similar entries by:
1. Grouping entries that express the same core insight (regardless of wording differences)
2. For each group, write a single clear canonical English content string that captures the insight
3. Record how many source conversations each group appeared in (occurrences)
4. Assign confidence (0.0–1.0) = occurrences / totalConversations

## Output Format
Return ONLY a valid JSON object (no markdown, no code fences):
{
  "entries": [
    {
      "type": "...",
      "category": "...",
      "content": "...",
      "metadata": { ... },
      "originalText": "...",
      "occurrences": <number>,
      "confidence": <float 0-1>
    }
  ]
}

## Rules
- Merge only entries that are truly about the same constraint/insight
- Keep entries separate if they have different numeric values (different MOQs = different entries)
- Sort by confidence descending (highest confidence first)
- originalText should be from the first occurrence if non-English, omit if English`;

type RawEntry = {
  sourceIndex: number;
  type: KnowledgeEntry['type'];
  category: ProductCategory;
  content: string;
  metadata: Record<string, string>;
  originalText?: string;
};

/** Parse a Gemini response text, stripping code fences if present. Returns null on failure. */
function parseGeminiJson<T>(raw: string): T | null {
  try {
    const clean = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(clean) as T;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 503 });
  }

  let body: { conversations: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { conversations } = body;
  if (!Array.isArray(conversations) || conversations.length === 0) {
    return NextResponse.json(
      { error: 'conversations must be a non-empty array of strings' },
      { status: 400 }
    );
  }

  if (conversations.length > 20) {
    return NextResponse.json({ error: 'Maximum 20 conversations per batch' }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: TEXT_MODEL });

  // ── Step 1: Extract raw entries from each conversation (chunking large texts) ──
  const allRawEntries: RawEntry[] = [];
  const detectedLanguages: string[] = [];
  const extractionWarnings: string[] = [];
  let totalChunksProcessed = 0;

  for (let i = 0; i < conversations.length; i++) {
    const text = conversations[i].trim();
    if (!text) continue;

    const chunks = splitIntoChunks(text);

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      totalChunksProcessed++;

      try {
        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${EXTRACT_SYSTEM}\n\n---\nSUPPLIER CONVERSATION${chunks.length > 1 ? ` (part ${c + 1}/${chunks.length})` : ''}:\n${chunk}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            // Raised from 4096 – a 15 KB Chinese conversation can produce many entries
            maxOutputTokens: 8192,
          },
        });

        const parsed = parseGeminiJson<{
          detectedLanguage: string;
          entries: Array<{
            type: KnowledgeEntry['type'];
            category: ProductCategory;
            content: string;
            metadata: Record<string, string>;
            originalText?: string;
          }>;
        }>(result.response.text());

        if (!parsed) {
          extractionWarnings.push(
            `File ${i + 1} chunk ${c + 1}: AI returned unparseable JSON – skipped`
          );
          continue;
        }

        if (parsed.detectedLanguage) {
          detectedLanguages.push(parsed.detectedLanguage);
        }

        if (Array.isArray(parsed.entries)) {
          for (const entry of parsed.entries) {
            if (entry.type && entry.category && entry.content) {
              allRawEntries.push({
                sourceIndex: i,
                type: entry.type,
                category: entry.category,
                content: entry.content,
                metadata: entry.metadata || {},
                originalText: entry.originalText,
              });
            }
          }
        }
      } catch (err) {
        extractionWarnings.push(
          `File ${i + 1} chunk ${c + 1}: extraction failed – ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  if (allRawEntries.length === 0) {
    return NextResponse.json({
      entries: [],
      stats: {
        totalConversations: conversations.length,
        totalChunksProcessed,
        totalEntriesExtracted: 0,
        detectedLanguages: [...new Set(detectedLanguages)],
        warnings: extractionWarnings,
      },
    });
  }

  // ── Step 2: Deduplicate and assign confidence scores ──
  const totalConversations = conversations.length;

  let finalEntries: Array<{
    type: KnowledgeEntry['type'];
    category: ProductCategory;
    content: string;
    metadata: Record<string, string>;
    originalText?: string;
    occurrences: number;
    confidence: number;
  }> = [];

  try {
    const dedupePayload = JSON.stringify({
      totalConversations,
      rawEntries: allRawEntries.map(({ type, category, content, metadata, originalText }) => ({
        type,
        category,
        content,
        metadata,
        originalText,
      })),
    });

    const dedupeResult = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${DEDUPLICATE_SYSTEM}\n\n---\n${dedupePayload}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });

    const parsed = parseGeminiJson<{ entries: typeof finalEntries }>(
      dedupeResult.response.text()
    );

    if (parsed && Array.isArray(parsed.entries)) {
      finalEntries = parsed.entries.filter(
        (e) => e.type && e.category && e.content && typeof e.confidence === 'number'
      );
    } else {
      throw new Error('Deduplicate step returned unparseable JSON');
    }
  } catch (err) {
    extractionWarnings.push(
      `Deduplication failed (${err instanceof Error ? err.message : String(err)}), using raw entries`
    );
    // Fall back: fingerprint-based deduplication
    const fingerprints = new Map<
      string,
      { entry: RawEntry; sourceIndices: Set<number> }
    >();
    for (const entry of allRawEntries) {
      const key = `${entry.type}|${entry.category}|${entry.content.toLowerCase().slice(0, 80)}`;
      if (!fingerprints.has(key)) {
        fingerprints.set(key, { entry, sourceIndices: new Set() });
      }
      fingerprints.get(key)!.sourceIndices.add(entry.sourceIndex);
    }
    finalEntries = [...fingerprints.values()].map(({ entry, sourceIndices }) => {
      const occurrences = sourceIndices.size;
      return {
        type: entry.type,
        category: entry.category,
        content: entry.content,
        metadata: entry.metadata,
        originalText: entry.originalText,
        occurrences,
        confidence: Math.min(1, occurrences / totalConversations),
      };
    });
  }

  // ── Step 3: Stamp with IDs and timestamps ──
  const now = new Date().toISOString();
  const resultEntries: KnowledgeEntry[] = finalEntries.map((e) => ({
    id: uuid(),
    type: e.type,
    category: e.category,
    content: e.content,
    metadata: e.metadata || {},
    source: 'upload' as const,
    confidence: Math.round(e.confidence * 100) / 100,
    occurrences: e.occurrences,
    originalText: e.originalText || undefined,
    createdAt: now,
    updatedAt: now,
  }));

  return NextResponse.json({
    entries: resultEntries,
    stats: {
      totalConversations,
      totalChunksProcessed,
      totalEntriesExtracted: resultEntries.length,
      detectedLanguages: [...new Set(detectedLanguages)],
      warnings: extractionWarnings,
    },
  });
}
