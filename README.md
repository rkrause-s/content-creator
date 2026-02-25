# Content Creator Pipeline

Automatisierte Marketing-Content-Pipeline powered by Claude AI und Gemini. Ein Prompt rein, eine komplette Kampagne raus: Content-Plan, Blog-Artikel, Social-Media-Posts, Newsletter, Whitepaper-PDFs und passende Grafiken.

## Quickstart

```bash
# Dependencies installieren
npm install

# API-Keys konfigurieren
cp .env.example .env
# ANTHROPIC_API_KEY und GEMINI_API_KEY in .env eintragen

# Bauen
npm run build

# Kampagne generieren
npx content-creator generate "Kampagne über unser neues Confluence Plugin für IT-Teams. 3 LinkedIn Posts und ein Blog-Artikel."
```

## CLI-Befehle

```bash
# Volle Pipeline (Brief → Plan → Assets → Review → Bilder → PDFs → Export)
npx content-creator generate "Beschreibung der Kampagne..."

# Nur Content-Plan (Stages 1-2)
npx content-creator plan "Remote Work Tools für HR-Manager"

# Mit Optionen
npx content-creator generate --language en --output ./meine-kampagne "..."
npx content-creator generate --skip-images "..."

# Verfügbare Asset-Typen auflisten
npx content-creator list-assets
```

## Asset-Typen

| Typ | Beschreibung |
|-----|-------------|
| `linkedin-post` | Professioneller LinkedIn-Post mit Hashtags und CTA |
| `twitter-post` | Tweet oder kurzer Thread (max 280 Zeichen) |
| `blog-article` | SEO-optimierter Blog-Artikel in Markdown (800-1500 Wörter) |
| `email-newsletter` | Newsletter-Email mit Betreffzeile und Preview-Text |
| `instagram-caption` | Instagram-Caption mit Hashtags |
| `whitepaper` | Whitepaper (3000-5000 Wörter), wird als PDF exportiert |

## Pipeline-Architektur

```
User-Prompt
  │
  ├─ 1. Parse Brief ──────── Freitext → strukturiertes CampaignBrief (Claude, structured output)
  ├─ 2. Plan Content ─────── Brief → ContentPlan mit Pillars, Assets, Brand Voice
  ├─ 3. Generate Assets ──── Parallele Textgenerierung (max 3 concurrent, Claude)
  ├─ 4. Review ────────────── Qualitätsprüfung + automatische Revision (Score < 7)
  ├─ 5. Export ────────────── Markdown, JSON, HTML-Preview
  ├─ 6. Generate Images ──── Grafiken pro Asset (Gemini, optional)
  └─ 7. Generate PDFs ────── Whitepaper als A4-PDF (Puppeteer)
```

## Output-Struktur

```
output/campaign-2026-02-25T21-41-42/
├── README.md                  # Kampagnen-Übersicht
├── content-plan.md            # Content-Plan als Markdown
├── content-plan.json          # Maschinenlesbar
├── campaign.json              # Kompletter Pipeline-Output
├── assets/
│   ├── blog/article-01.md
│   ├── linkedin/01.md
│   ├── twitter/01.md
│   ├── email/01.md
│   ├── instagram/01.md
│   └── whitepaper/
│       ├── 01.md
│       ├── whitepaper-01.pdf
│       └── whitepaper-02.pdf
├── images/
│   ├── blog-article-01.png
│   ├── linkedin-post-01.png
│   └── ...
└── preview/
    └── index.html             # HTML-Preview aller Assets mit Bildern
```

## Konfiguration

Über `.env` oder Umgebungsvariablen:

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | — | Claude API-Key (erforderlich) |
| `GEMINI_API_KEY` | — | Gemini API-Key für Bildgenerierung (optional) |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` | Claude-Modell |
| `MAX_CONCURRENT_GENERATORS` | `3` | Parallele Asset-Generierung |
| `DEFAULT_LANGUAGE` | `de` | Content-Sprache (`de` / `en`) |

## Neuen Asset-Typ hinzufügen

1. Typ in `AssetTypeEnum` ergänzen (`src/pipeline/types.ts`)
2. Prompt-Template erstellen (`src/prompts/assets/`)
3. Generator erstellen (`src/generators/`) — `AssetGenerator` erweitern
4. In Registry registrieren (`src/generators/registry.ts`)

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **AI Text**: Anthropic Claude SDK (structured output via tool_use)
- **AI Bilder**: Google Gemini (`gemini-2.5-flash-image`)
- **PDF**: Puppeteer (HTML → PDF)
- **CLI**: Commander + Ora + Chalk
- **Validation**: Zod
- **Templates**: Handlebars
