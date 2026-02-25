# Content Creator Pipeline

## Quick Start
```bash
npm run build          # Compile TypeScript
npm run dev -- generate "Your campaign brief here"
npm run dev -- list-assets
```

## Architecture
5-stage pipeline: Parse Brief → Plan Content → Generate Assets → Review → Export

- `src/pipeline/types.ts` - All Zod schemas and TypeScript interfaces
- `src/claude/client.ts` - Anthropic SDK wrapper (structured output via tool_use, text generation)
- `src/generators/` - Asset generators (one per content type), registered in `registry.ts`
- `src/prompts/` - All prompt templates, organized by stage and asset type
- `src/export/` - Markdown, HTML preview, and JSON export

## Adding a New Asset Type
1. Add to `AssetTypeEnum` in `src/pipeline/types.ts`
2. Create prompt in `src/prompts/assets/`
3. Create generator in `src/generators/` extending `AssetGenerator`
4. Register in `src/generators/registry.ts`

## Key Decisions
- Structured output uses Anthropic tool_use with Zod schemas
- Assets generate in parallel batches (max 3 concurrent) for rate-limit safety
- Single review call evaluates all assets together for cross-asset consistency
- Markdown is the primary output format; HTML preview is generated via Handlebars
