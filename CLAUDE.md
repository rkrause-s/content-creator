# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build              # Compile TypeScript (tsc → dist/)
npm run dev -- generate "prompt"   # Run without building (via tsx)
npm run dev -- plan "prompt"       # Plan-only mode
npm run dev -- list-assets         # Show available asset types
node dist/dry-run.js       # Full pipeline test with simulated data (needs GEMINI_API_KEY for images)
```

No test framework is configured yet. Verify changes with `npm run build` (strict TypeScript).

## Architecture

7-stage pipeline orchestrated by `src/pipeline/runner.ts`, which manages `PipelineState` through each stage sequentially:

1. **Parse Brief** (`stages/parse-brief.ts`) — Gemini structured output (`generateStructured`) converts free-text → `CampaignBrief` (Zod schema)
2. **Plan Content** (`stages/plan-content.ts`) — Gemini structured output produces `ContentPlan` with pillars, planned assets, brand voice
3. **Generate Assets** (`stages/generate-assets.ts`) — dispatches to generator registry, runs in parallel batches (`config.maxConcurrent`)
4. **Review** (`stages/review.ts`) — single Gemini call evaluates ALL assets together for cross-asset consistency; auto-revises assets scoring < 7
5. **Export** (`stages/export.ts`) — writes Markdown files, JSON bundle, HTML preview to `output/campaign-{timestamp}/`
6. **Generate Images** (`stages/generate-images.ts`) — Gemini image generation per asset (gracefully skipped if no `GEMINI_API_KEY`)
7. **Generate PDFs** (`stages/generate-pdfs.ts`) — Puppeteer HTML→PDF for whitepaper assets only

### Gemini AI clients

- **Text & Structured** (`src/claude/client.ts`): Two functions — `generateStructured<T>()` (Zod schema → `responseMimeType: "application/json"` + `responseSchema` → parsed result) and `generateText()`. Uses `@google/genai` SDK with `gemini-2.5-flash`. Zod v4 native `z.toJSONSchema()`.
- **Images** (`src/image/gemini.ts`): `generateImage()` via `@google/genai` SDK, model `gemini-2.5-flash-image`. `buildImagePrompt()` creates per-asset-type style prompts.

### Generator pattern

Each asset type is an `AssetGenerator` subclass (`src/generators/base.ts`) with `type`, `label`, `description`, and `generate(PlannedAsset, GeneratorOptions) → GeneratedAsset`. All generators are registered in `src/generators/registry.ts` on import. Each generator pairs with a prompt template in `src/prompts/assets/`.

### Adding a new asset type

1. Add to `AssetTypeEnum` in `src/pipeline/types.ts`
2. Create prompt in `src/prompts/assets/{name}.ts` (export system prompt + prompt builder function)
3. Create generator in `src/generators/{name}.ts` extending `AssetGenerator`
4. Import and `register()` in `src/generators/registry.ts`
5. Add image style mapping in `src/image/gemini.ts` → `buildImagePrompt()`

### Export / rendering

- `src/export/markdown-to-html.ts` — shared regex-based Markdown→HTML converter (used by both HTML preview and PDF)
- `src/export/html-preview.ts` — Handlebars inline template, renders asset cards with images, review scores, PDF download links
- `src/export/pdf.ts` — Puppeteer renders a Handlebars HTML template to A4 PDF with cover page, typography, page numbers
- `src/export/campaign-bundle.ts` — writes `campaign.json`, `content-plan.json`, `README.md`

### Brand configuration

`src/brand/loader.ts` reads all `.md` files from `brand/`, skips empty templates via `isEmptyTemplate()`, and builds two context strings:

- **textContext** — assembled from `identity`, `tone-of-voice`, `guidelines` (in that order), plus any extra files. Injected into system prompts via `withBrandContext()` (`src/generators/base.ts`) and passed as parameter to brief-parsing, content-planning, and review prompts.
- **imageContext** — assembled from `visual-identity`, `image-guidelines`, `identity` (in that order), plus extras. Appended to Gemini image prompts in `src/image/gemini.ts`.

The runner (`src/pipeline/runner.ts`) calls `loadBrandConfig()` at startup and stores both contexts in `PipelineState.brandTextContext` / `brandImageContext`.

## Key conventions

- ESM throughout (`"type": "module"` in package.json) — all imports use `.js` extensions
- Zod v4 (not v3) — use `z.toJSONSchema()` instead of `zod-to-json-schema`
- Single AI provider: Google Gemini for text, structured output, and images (all via `@google/genai`)
- `GEMINI_API_KEY` env var required; `GEMINI_MODEL` defaults to `gemini-2.5-flash`
- Image and PDF generation are non-fatal — failures log warnings and continue
- `src/dry-run.ts` contains hardcoded simulated pipeline data for testing export/image/PDF without Claude API calls
