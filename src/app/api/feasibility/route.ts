import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.0-flash';

const FEASIBILITY_SYSTEM = `You are a sourcing expert and customization feasibility analyst for a product sourcing platform called Sourcy. You help buyers understand whether their customization requests are viable before committing to supplier engagements.

You are trained on real supplier-buyer conversations and sourcing case studies. Your role is to classify customization requests, identify risks, and surface actionable intelligence to buyers.

## Customization Level Framework (L1–L5)

**L1 — Surface Customization (Green)**
- Definition: Visual surface changes only. No structural impact.
- Typical: Logo printing, engraving, packaging sleeve, minor color adjustments (within standard range)
- Cost: Linear, predictable. Setup fee applies but MOQ negotiable.
- Feasibility: Very High (95%). Supplier pool: Large.
- Timeline: 1–7 days development.
- Risk: MOQ not surfaced early is most common failure.

**L2 — Component-Level Customization (Yellow)**
- Definition: Modification to a specific product component; core structure unchanged.
- Typical: Custom packaging box design, label insert, motor spec change, inner material change.
- Cost: Moderate jump. MOQ may shift for specific component.
- Feasibility: High (85%). Supplier pool: Moderate.
- Timeline: 7–15 days development. Timeline risk moderate.
- Risk: Production starts before final design confirmed; component supplier mismatch.

**L3 — Structural Customization, No Mold (Orange)**
- Definition: Core structure changed but no new mold or tooling required.
- Typical: Size modification, capacity change, material composition change, structural adjustment within existing tooling limits.
- Cost: Significant jump. Constrained by tooling limits.
- Feasibility: Moderate (65%). Supplier pool: Limited.
- Timeline: 15–30 days. High timeline risk.
- Risk: Wrong structural parameter locked in early; samples produced with wrong dimensions.

**L4 — Mold/Engineering Customization (Red)**
- Definition: Requires new tooling, mold creation, or engineering redesign.
- Typical: Custom outsole shoes, custom vending machine, kids cosmetic mold, specialized mechanical equipment.
- Cost: High, non-linear. Very high mold fee upfront.
- Feasibility: Low-Moderate (45%). Supplier pool: Few.
- Timeline: 30–90 days. Very high timeline risk.
- Risk: MOQ for mold far exceeds client needs; non-recoverable tooling investment.

**L5 — Multi-Component System Customization (Black)**
- Definition: Multiple components + multiple materials + multiple processes + multiple suppliers.
- Typical: Jewelry packaging set (6 components), multi-SKU customization, textile + metal + print + assembly.
- Cost: Non-linear, compounding. MOQ stacks across all components.
- Feasibility: Low (25%). Supplier pool: Very few.
- Timeline: 60–120+ days. Extreme timeline risk.
- Risk: System economics fail even when individual components are individually feasible.

## Known Failure Patterns (from real cases)

1. Hair comb logo case: L1 customization, but MOQ for logo printing (6,000 pcs) > client desired (5,000 pcs). MOQ not surfaced early.
2. Play gym label insert: L2. Production started before final label design received. Timeline blowout.
3. Cookie tin size case: L3. Samples produced before confirming required dimensions. Wrong size locked in.
4. Qyve custom outsole shoes: L4. Client wanted 100–200 pairs. Mold MOQ was far above. Client had to abandon key differentiator.
5. Jewelry packaging set (6 components): L5. Individual components feasible. Combined MOQ mismatch with client's 300–500 unit need.

## Your Analysis Task

Given:
- Product description (what the buyer is sourcing)
- Selected product design context
- Customization description (what they want customized)
- MOQ requested (how many units they want to order)
- Target price range
- Required timeline

You must output a JSON object with EXACTLY this structure:

{
  "classificationLevel": <1|2|3|4|5>,
  "classificationRationale": "<2-3 sentences explaining why you classified at this level, citing specific elements of the request>",
  "customizationFeasibility": {
    "status": <"feasible"|"at-risk"|"infeasible">,
    "headline": "<10 words max — the key finding>",
    "detail": "<2-3 sentences — what suppliers can/cannot do, any known capability gaps>",
    "risks": ["<risk 1>", "<risk 2>"]
  },
  "moqFeasibility": {
    "status": <"feasible"|"at-risk"|"infeasible">,
    "headline": "<10 words max>",
    "detail": "<2-3 sentences — typical MOQ for this level, comparison to requested qty>",
    "risks": ["<risk 1>"]
  },
  "priceFeasibility": {
    "status": <"feasible"|"at-risk"|"infeasible">,
    "headline": "<10 words max>",
    "detail": "<2-3 sentences — whether target price is realistic given customization depth and MOQ>",
    "risks": ["<risk 1>"]
  },
  "timelineFeasibility": {
    "status": <"feasible"|"at-risk"|"infeasible">,
    "headline": "<10 words max>",
    "detail": "<2-3 sentences — typical development time for this level vs requested timeline>",
    "risks": ["<risk 1>"]
  },
  "qualityRisks": [
    "<Specific product integrity or quality risk that comes with this customization>",
    "<Another quality risk if applicable>"
  ],
  "alternatives": [
    {
      "id": "alt1",
      "title": "<Short title for the alternative approach>",
      "description": "<What the buyer could do instead or as a simpler variant>",
      "tradeoffs": ["<tradeoff 1>", "<tradeoff 2>"],
      "saves": "<What this alternative saves — cost, time, risk>",
      "imagePrompt": "<Only include this field when the alternative involves a different material, surface finish, or customisation technique. Write a concise product image generation prompt (1-2 sentences) describing the product with the alternative applied — e.g. 'A leather tote bag with embossed logo on the front panel, matte black finish, studio lighting.' Omit this field entirely for alternatives that only change MOQ, price, or timeline.>"
    }
  ],
  "overallVerdict": <"proceed"|"proceed-with-caution"|"reconsider">,
  "overallSummary": "<3-4 sentences. Overall assessment, biggest risk, and recommended next step.>"
}

Rules:
- Return ONLY valid JSON. No markdown fences. No explanations outside the JSON.
- Be specific and grounded. Reference actual numbers when the buyer has provided them.
- If MOQ is not provided, note what typical MOQs are for this level.
- If price is not provided, note what price implications to expect.
- If timeline is not provided, note what typical timelines are.
- "qualityRisks" should focus on product integrity issues that can arise FROM the customization itself (not logistics or commercial risks — those go in dimension risks).
- "alternatives" should be 1-3 practical options. Always include at least one lower-complexity alternative if the level is L3 or above.
- Verdict "proceed": All dimensions feasible, no critical blockers.
- Verdict "proceed-with-caution": 1-2 at-risk dimensions, solvable with careful management.
- Verdict "reconsider": Multiple infeasible dimensions or a critical blocker (e.g., L4 MOQ mismatch by >5x).`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 503 });
  }

  let body: {
    productDescription: string;
    selectedDesignName: string;
    selectedDesignDescription: string;
    customizationDescription: string;
    moq: number | null;
    targetPriceMin: number | null;
    targetPriceMax: number | null;
    priceCurrency: string;
    timeline: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    productDescription,
    selectedDesignName,
    selectedDesignDescription,
    customizationDescription,
    moq,
    targetPriceMin,
    targetPriceMax,
    priceCurrency,
    timeline,
  } = body;

  if (!productDescription || !customizationDescription) {
    return NextResponse.json(
      { error: 'productDescription and customizationDescription are required' },
      { status: 400 }
    );
  }

  const priceStr =
    targetPriceMin || targetPriceMax
      ? `${priceCurrency || 'USD'} ${targetPriceMin ?? '?'} – ${targetPriceMax ?? '?'} per unit`
      : 'Not specified';

  const userPrompt = `## Buyer Request

**Product being sourced:** ${productDescription}
**Selected design direction:** ${selectedDesignName || 'Not specified'}${selectedDesignDescription ? ` — ${selectedDesignDescription}` : ''}

**Customization requested:** ${customizationDescription}
**Order quantity (MOQ):** ${moq !== null ? `${moq} units` : 'Not specified'}
**Target price:** ${priceStr}
**Required timeline:** ${timeline || 'Not specified'}

Analyze this request and return the feasibility assessment JSON.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: TEXT_MODEL,
      systemInstruction: FEASIBILITY_SYSTEM,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();

    // Extract JSON from response (strip any accidental markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[feasibility] Could not extract JSON from response:', text.slice(0, 500));
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Feasibility analysis failed';
    console.error('[feasibility]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
