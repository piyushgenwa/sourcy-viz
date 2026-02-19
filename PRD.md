# Sourcy — Visual Design Flow & Feasibility Analysis Platform

## Product Requirements Document (PRD)

**Product:** Sourcy
**Version:** 1.0
**Date:** February 2026
**Status:** Implemented

---

## 1. Problem Statement

Buyers sourcing customized physical products (bags, packaging, apparel, accessories, etc.) from manufacturers face two critical, compounding challenges:

1. **The visual communication gap** — Buyers struggle to articulate precise design intent to suppliers. Descriptions like "a modern leather tote with my logo" carry enormous ambiguity. Material finish, color temperature, hardware style, proportions, and aesthetic mood are all left to interpretation, leading to mismatched samples, costly iterations, and wasted time.

2. **The feasibility blind spot** — Even when a design is well-defined, buyers often lack the manufacturing knowledge to assess whether their customization request is realistic given their budget, order quantity, and timeline. A request that seems simple (e.g., a custom rubber logo tag) may carry a hidden 1,000-unit MOQ minimum that makes a 100-unit pilot order impossible.

These two problems compound: buyers invest effort refining a design only to discover it's infeasible, or they over-constrain their vision preemptively out of fear of manufacturing complexity.

### Who experiences this pain?

- **Small-to-medium brand owners** sourcing their first product runs
- **Sourcing agents** translating client requests into supplier-ready specifications
- **E-commerce entrepreneurs** building private-label product lines
- **Procurement teams** evaluating customization options across product categories

---

## 2. Product Vision

Sourcy is an AI-powered design copilot that bridges the gap between visual ideation and manufacturing reality. It enables buyers to progressively refine a product design through AI-generated visual explorations, then immediately assess manufacturing feasibility — all in a single, guided flow.

The core insight: **design and feasibility should not be sequential, siloed activities. They should be integrated so buyers make informed creative decisions from the start.**

---

## 3. User Personas

### Persona 1: The First-Time Brand Owner
- Has a product idea but no manufacturing experience
- Needs help articulating design specifics they haven't thought about
- Needs early warning on what's realistic for their budget and volume

### Persona 2: The Sourcing Agent
- Handles multiple client requests across product categories
- Needs to quickly generate design options to share with clients
- Needs to assess feasibility before engaging suppliers to avoid wasted negotiations
- Accumulates supplier knowledge across conversations that should be reusable

### Persona 3: The Product Manager at a DTC Brand
- Wants to explore design variations quickly before committing to sampling
- Needs data-driven feasibility assessments to present to leadership
- Wants to understand trade-offs (e.g., "if we reduce MOQ, what design compromises apply?")

---

## 4. Features

### 4.1 Visual Design Flow (Core Feature)

A guided, multi-step flow that takes a buyer from a rough product idea to a finalized, AI-generated visual design.

#### 4.1.1 Product Input

**What it does:** The entry point where users describe their product and optionally provide reference material.

**Inputs:**
- Free-text product description (required)
- Reference image upload via drag-and-drop or file picker (optional)
- Reference product URL (optional) — the system scrapes the page and extracts design-relevant details (materials, colors, dimensions, style cues)

**Design decisions:**
- Quantity and sourcing parameters (MOQ, pricing) are intentionally stripped from the description before design generation. These are commercial constraints, not visual attributes, and including them pollutes image generation prompts.
- Reference images and URLs enrich the AI's understanding but are never required — the flow works with text alone.

#### 4.1.2 AI-Powered Clarification (PGE1)

**What it does:** Analyzes the product description and generates 3-5 targeted clarification questions to fill visual gaps before generating designs.

**Question focus areas:**
- Aesthetic style direction (modern, classic, bold, minimalist)
- Material and texture specifics (matte leather, glossy PU, woven fabric)
- Color palette and saturation preferences
- Scale, proportion, and form hints
- Target usage context (luxury retail, daily use, gifting)

**Design decisions:**
- Questions are generated dynamically based on what's *missing* from the description, not from a fixed template
- Users can skip clarification entirely — the system proceeds with reasonable defaults
- Each question offers predefined options plus a custom text input
- If a reference image or URL is provided, the AI factors that context into which questions it asks (avoiding redundant questions about details already visible)

#### 4.1.3 Initial Design Directions (PGE2) — Level 0

**What it does:** Generates exactly 5 diverse design directions based on the product description and user's clarification answers.

**Diversity dimensions across the 5 variants:**
- Design aesthetic (minimalist to ornate to industrial to luxury to organic)
- Material finish (matte, glossy, embossed, textured, woven)
- Color palette and saturation
- Hardware and detail emphasis
- Compositional mood and lighting

**Each variant includes:**
- A descriptive name (e.g., "Structured Urbanist")
- A narrative description of the design approach
- The full image generation prompt (visible for transparency)
- Anchored aspects — what stays fixed from the user's core intent
- Flexible aspects — what this variant intentionally varies

**Design decisions:**
- The anchoring principle is central: all 5 variants respect the user's core product identity while deliberately exploring different aesthetic dimensions. This prevents the common AI failure mode of generating 5 nearly identical outputs.
- Images are generated asynchronously per variant using Google Gemini's image generation model. Placeholder gradients are shown while images load.
- Users select one variant to proceed. They can also finalize early at this level if a design already meets their needs, using the "This looks good" shortcut.

#### 4.1.4 First Refinements (PGE3 Run 1) — Level 1

**What it does:** Takes the selected L0 variant and generates 3 focused refinements that explore primary design dimensions.

**Refinement strategy:**
- Each refinement builds *from* the parent design — it's an evolution, not a rewrite
- Explores material finish, color treatment, and proportional variations
- Maintains the parent's core aesthetic identity

**UI elements:**
- Selection breadcrumbs showing the user's L0 choice for context
- Same card layout as L0 with image generation, selection, and finalize options

#### 4.1.5 Deep Refinements (PGE3 Run 2) — Level 2

**What it does:** Takes the selected L1 variant and generates 3 micro-variations for final selection.

**Refinement focus:**
- Surface finish details (stitch patterns, edge treatments, hardware finishes)
- Subtle color temperature shifts
- Textural nuances
- Detail placement and proportions

**Design decisions:**
- By Level 2, the user's intent is highly constrained. Variations here are intentionally subtle — the goal is polish, not exploration.
- The three-level funnel (5 → 3 → 3) was chosen to balance exploration breadth with decision fatigue. 5 initial options give adequate diversity; 3 refinements at each level keep choices manageable.

#### 4.1.6 Design Completion

**What it does:** Displays the final selected design with a summary and provides two forward paths.

**Elements:**
- Final design image, name, and description
- Anchored design aspects shown as tags
- "Start new design" button to reset
- "Check Feasibility" button to proceed to feasibility analysis

**Early exit support:** Users can finalize their selection at L0 or L1 if they're satisfied early, skipping deeper refinements.

### 4.2 AI Image Generation Engine

**What it does:** Converts text prompts into product visualization images using Google Gemini's multimodal capabilities.

**Architecture:**
1. If a reference image is provided, a vision model (Gemini 2.0 Flash) analyzes it and generates a 2-3 sentence style description covering material, texture, color palette, and finish
2. The style description is appended to the image generation prompt for visual coherence
3. The image generation model (Gemini 2.5 Flash Image) produces the final image from the enriched prompt
4. Images are returned as base64-encoded PNG data

**Design decisions:**
- Two-step approach (describe reference → generate image) was chosen because the image generation model accepts text-only input. The vision model acts as a bridge.
- Style description is non-fatal — if the vision step fails, the system falls back to the original prompt.

### 4.3 Feasibility Analysis Engine

**What it does:** Assesses whether a buyer's customization request is realistic given their stated MOQ, budget, and timeline, using an AI expert system grounded in manufacturing domain knowledge.

#### 4.3.1 Feasibility Input

**Required inputs:**
- Customization description (what changes the buyer wants)
- Minimum order quantity (units)
- Target price range (min-max with currency)
- Timeline expectations

**Context inherited from design flow:**
- Product description
- Selected design name and description

#### 4.3.2 Feasibility Classification (5-Level Framework)

The system classifies every customization request into one of five levels:

| Level | Name | Color | Feasibility | Examples |
|-------|------|-------|------------|----------|
| L1 | Surface Customization | Green | ~95% | Logo printing, engraving, packaging print |
| L2 | Component-Level | Yellow | ~85% | Custom box design, label insert, inner material change |
| L3 | Structural (No Mold) | Orange | ~65% | Size modification, material composition change |
| L4 | Mold/Engineering | Red | ~45% | Custom outsole, specialized equipment, new tooling |
| L5 | Multi-Component System | Black | ~25% | Jewelry sets, multi-SKU assemblies, textile + metal + print |

Each level carries documented expectations for setup fees, MOQ impact, cost behavior, rework cost, timeline risk, supplier availability, and development time.

#### 4.3.3 Four-Dimension Analysis

The feasibility engine evaluates four independent dimensions:

1. **Customization Capability** — Is this type of customization technically achievable? Are suppliers available?
2. **MOQ Viability** — Does the buyer's order quantity meet or exceed the supplier's minimum for this customization level?
3. **Price Target Feasibility** — Is the buyer's price range realistic given setup fees, material costs, and customization complexity?
4. **Timeline Feasibility** — Can the work be completed within the buyer's timeframe given development, sampling, and production needs?

Each dimension returns:
- Status: `feasible` / `at-risk` / `infeasible`
- A headline summary
- Detailed analysis
- Specific risks

#### 4.3.4 Quality Risks & Alternatives

**Quality risks:** The system identifies potential quality issues specific to the customization type (e.g., "embossing on thin leather may cause warping").

**Alternatives:** When feasibility is constrained, the system suggests practical alternatives with clear trade-off descriptions and estimated savings (e.g., "Switch from embossing to heat-press printing — saves setup fee, reduces MOQ to 200 units").

#### 4.3.5 Verdict

Three possible outcomes:
- **Proceed** — All dimensions are feasible, no blockers
- **Proceed with caution** — 1-2 dimensions at risk, manageable with adjustments
- **Reconsider** — Multiple dimensions infeasible or a critical blocker exists

### 4.4 Knowledge Base

**What it does:** A persistent, searchable repository of supplier insights and sourcing patterns that accumulates over time and informs better decision-making.

#### 4.4.1 Knowledge Entry Types

| Type | Purpose | Example |
|------|---------|---------|
| `supplier-constraint` | Hard limits from suppliers | "Logo rubber tags require minimum 1,000 units" |
| `moq-data` | Specific minimum order quantities | "CMYK printing MOQ: 1,000 units standard, 500 at premium pricing" |
| `pricing-insight` | Cost structures and differentials | "Full color printing: +400% vs stock (¥0.58 → ¥3.00)" |
| `tradeoff` | Negotiated compromises | "Accepted single-color print to meet 500-unit MOQ" |
| `request-pattern` | Recurring buyer request patterns | "80% of leather bag requests include some form of logo customization" |

#### 4.4.2 Manual Entry Management

- Create, edit, and delete entries with type, category, and content fields
- Search across all entries by text
- Filter by product category (bags-leather, packaging-paper, apparel, etc.)
- Export/import as JSON for backup and sharing

#### 4.4.3 Bulk Conversation Upload

**What it does:** Accepts raw supplier-buyer conversation text (in Chinese or English), uses AI to extract all distinct sourcing insights, and adds them to the knowledge base.

**Capabilities:**
- Auto-detects language (Chinese, English, Mixed)
- Translates non-English content while preserving original text
- Extracts and classifies insights into the five entry types
- Assigns confidence scores based on occurrence frequency across multiple conversations
- Deduplicates entries on re-upload — merges similar entries rather than creating duplicates, updating confidence and occurrence counts

**Design decisions:**
- This feature exists because sourcing agents accumulate critical knowledge through WeChat conversations, emails, and supplier calls — but that knowledge typically lives in chat logs and is never systematically captured. Bulk upload makes knowledge extraction effortless.

### 4.5 Default Knowledge Base

The system ships with 6 hand-curated knowledge entries covering real supplier constraints across bags/leather and packaging categories, providing immediate value and demonstrating the knowledge entry format.

---

## 5. User Flows

### 5.1 Primary Flow: Design to Feasibility

```
Product Description → Clarification Questions → 5 Initial Designs (L0)
    → Select → 3 Refinements (L1) → Select → 3 Deep Refinements (L2)
    → Select → Design Complete → Feasibility Input → Feasibility Report
```

### 5.2 Quick Flow (Early Finalization)

```
Product Description → Skip Clarification → 5 Initial Designs (L0)
    → "This looks good" → Design Complete
```

### 5.3 Knowledge Management Flow

```
Upload Supplier Conversations → AI Extracts Insights → Review & Edit
    → Search/Filter Knowledge Base → Export for Sharing
```

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19 with Client Components |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 |
| AI Provider | Google Gemini (text: gemini-2.0-flash, image: gemini-2.5-flash-image) |
| ID Generation | UUID v4 |

### 6.2 API Surface

| Endpoint | Purpose | Input | Output |
|----------|---------|-------|--------|
| `POST /api/pge1` | Clarification questions | Product description, optional reference | 3-5 questions with options |
| `POST /api/pge2` | Initial design directions | Description + answers + reference | 5 prompt variants |
| `POST /api/pge3` | Refinement prompts | Description + answers + selected prompt + level | 3 prompt variants |
| `POST /api/generate-image` | Image generation | Prompt + optional reference image | Base64 PNG image |
| `POST /api/feasibility` | Feasibility analysis | Design + customization + MOQ/price/timeline | 5-level classification + 4D analysis |
| `POST /api/scrape-url` | Product page extraction | URL | Structured product details |
| `POST /api/parse-supplier-conversations` | Knowledge extraction | Conversation text array | Structured knowledge entries |

### 6.3 State Architecture

Single Zustand store (`usePGEStore`) manages the entire design flow state as a linear state machine:

```
product-input → clarification → l0-variants → l1-variants → l2-variants
    → complete → feasibility-input → feasibility-result
```

Separate Zustand store (`useKnowledgeStore`) manages the knowledge base with CRUD operations, search, and import/export.

---

## 7. Design Principles

1. **Progressive refinement over blank-canvas creation** — Users don't create from scratch. They select and refine, which is cognitively easier and produces better results.

2. **Anchored variation** — Every set of AI-generated variants shares a core identity (anchored aspects) while deliberately varying specific dimensions (flexible aspects). This prevents both convergence (all options look the same) and divergence (options are unrecognizably different).

3. **Feasibility as a first-class citizen** — Manufacturing constraints are not an afterthought. They're integrated into the same tool and flow, encouraging buyers to check feasibility before committing to sampling.

4. **Knowledge compounds** — Every supplier conversation is a learning opportunity. The knowledge base ensures insights are captured, deduplicated, and accessible rather than lost in chat histories.

5. **Quantity-design separation** — Commercial parameters (MOQ, pricing) are deliberately excluded from the design generation process. Design should be driven by aesthetic intent, not artificially constrained by order volume.

---

## 8. Key Metrics (Recommended)

| Metric | What it measures | Target |
|--------|-----------------|--------|
| Flow completion rate | % of users who reach design selection | >60% |
| Early finalization rate | % of users who finalize at L0 or L1 | Track (not minimize) |
| Feasibility check-through rate | % of completed designs that proceed to feasibility | >40% |
| Knowledge entries per user | Active knowledge base growth | >10 entries/month |
| Conversation upload frequency | Knowledge base enrichment behavior | >2 uploads/month |
| Feasibility "reconsider" rate | How often users hit hard blockers | <30% |

---

## 9. Known Limitations & Future Considerations

### Current Limitations
- **No persistence** — All state is in-memory (Zustand). Refreshing the page resets the design flow. No user accounts or saved sessions.
- **No collaborative features** — Designs and feasibility reports cannot be shared with team members or suppliers directly.
- **Single AI provider** — Tightly coupled to Google Gemini for both text and image generation.
- **No real supplier data integration** — Feasibility analysis uses AI reasoning based on domain knowledge encoded in prompts, not live supplier databases or pricing APIs.
- **Knowledge base is local** — No server-side persistence; entries exist only in the browser session (with JSON export as a workaround).

### Future Considerations
- User accounts with saved design sessions and persistent knowledge bases
- Direct supplier quote request integration from the feasibility report
- A/B testing different PGE prompt strategies for design quality
- Feedback loops where feasibility results inform design suggestions (e.g., "this design requires L4 customization — would you like to see L2-compatible alternatives?")
- Multi-user knowledge bases shared across sourcing teams
- Integration with supplier databases for real-time MOQ and pricing data

---

## 10. Appendix: Customization Level Reference

| Level | Name | Setup Fee | MOQ Impact | Timeline Risk | Supplier Availability | Dev Time |
|-------|------|-----------|------------|---------------|----------------------|----------|
| L1 | Surface Customization | Low | Negotiable | Low | Many | 1-7 days |
| L2 | Component-Level | Moderate | Shifts per component | Moderate | Moderate | 7-15 days |
| L3 | Structural (No Mold) | Moderate-High | Tooling-constrained | High | Limited | 15-30 days |
| L4 | Mold/Engineering | Very High (mold fee) | Very high, rarely negotiable | Very High | Few | 30-90 days |
| L5 | Multi-Component System | Multiple fees | Stacks across components | Extreme | Very Few | 60-120+ days |
