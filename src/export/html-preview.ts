import fs from "node:fs/promises";
import path from "node:path";
import Handlebars from "handlebars";
import type { PipelineState } from "../pipeline/types.js";
import { markdownToHtml } from "./markdown-to-html.js";

const TEMPLATE = `<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{campaignName}} - Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }

    /* Header */
    header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem; }
    header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; font-size: 1.1rem; }
    .stats { display: flex; gap: 1rem; margin-top: 1.5rem; flex-wrap: wrap; }
    .stat { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; }

    /* Asset cards */
    .asset-card { background: white; border-radius: 12px; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
    .asset-image { width: 100%; max-height: 300px; object-fit: cover; display: block; }
    .asset-body { padding: 2rem; }
    .asset-card > .asset-body:first-child { padding-top: 2rem; }
    .asset-header { margin-bottom: 1rem; }
    .asset-header h2 { font-size: 1.3rem; margin-bottom: 0.4rem; }
    .asset-meta { color: #888; font-size: 0.85rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .asset-meta span { background: #f0f0f0; padding: 0.2rem 0.6rem; border-radius: 4px; }

    /* Rendered markdown content */
    .asset-content { font-size: 0.95rem; border-left: 3px solid #667eea; padding-left: 1.2rem; }
    .asset-content h1 { font-size: 1.2rem; margin: 1.2rem 0 0.5rem; color: #1a202c; }
    .asset-content h2 { font-size: 1.1rem; margin: 1rem 0 0.4rem; color: #2d3748; }
    .asset-content h3 { font-size: 1rem; margin: 0.8rem 0 0.3rem; color: #4a5568; }
    .asset-content p { margin-bottom: 0.6rem; }
    .asset-content ul, .asset-content ol { margin: 0.4rem 0 0.8rem 1.2rem; }
    .asset-content li { margin-bottom: 0.2rem; }
    .asset-content strong { color: #1a202c; }
    .asset-content em { color: #555; }
    .asset-content blockquote { border-left: 3px solid #cbd5e0; padding: 0.5rem 1rem; margin: 0.6rem 0; background: #f7fafc; color: #4a5568; font-style: italic; }
    .asset-content code { background: #edf2f7; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.88em; font-family: 'SF Mono', Monaco, Consolas, monospace; }
    .asset-content pre { background: #2d3748; color: #e2e8f0; padding: 0.8rem 1rem; border-radius: 6px; margin: 0.6rem 0; overflow-x: auto; font-size: 0.85em; }
    .asset-content pre code { background: none; padding: 0; color: inherit; }
    .asset-content table { width: 100%; border-collapse: collapse; margin: 0.6rem 0; font-size: 0.9em; }
    .asset-content th { background: #667eea; color: white; padding: 0.5rem 0.7rem; text-align: left; font-weight: 600; }
    .asset-content td { padding: 0.4rem 0.7rem; border-bottom: 1px solid #e2e8f0; }
    .asset-content tr:nth-child(even) td { background: #f7fafc; }
    .asset-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }

    /* Badges & links */
    .review-badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .score-high { background: #d4edda; color: #155724; }
    .score-mid { background: #fff3cd; color: #856404; }
    .score-low { background: #f8d7da; color: #721c24; }
    .pdf-link { display: inline-block; margin-top: 1rem; background: #667eea; color: white; padding: 0.5rem 1.2rem; border-radius: 6px; text-decoration: none; font-size: 0.9rem; font-weight: 500; }
    .pdf-link:hover { background: #5a6fd6; }
    .type-badge-whitepaper { background: #667eea !important; color: white !important; }

    footer { text-align: center; color: #999; padding: 2rem; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>{{campaignName}}</h1>
      <p>{{summary}}</p>
      <div class="stats">
        <span class="stat">{{assetCount}} Assets</span>
        {{#if imageCount}}<span class="stat">{{imageCount}} Images</span>{{/if}}
        {{#if pdfCount}}<span class="stat">{{pdfCount}} PDFs</span>{{/if}}
        {{#if overallScore}}<span class="stat">Score: {{overallScore}}/10</span>{{/if}}
        <span class="stat">{{language}}</span>
      </div>
    </header>

    {{#each assets}}
    <div class="asset-card">
      {{#if this.imageRelPath}}
      <img class="asset-image" src="{{this.imageRelPath}}" alt="{{this.title}}">
      {{/if}}
      <div class="asset-body">
        <div class="asset-header">
          <h2>{{this.title}}</h2>
          <div class="asset-meta">
            <span class="{{this.typeBadgeClass}}">{{this.type}}</span>
            <span>{{this.id}}</span>
            {{#if this.score}}<span class="review-badge {{this.scoreClass}}">Score: {{this.score}}/10</span>{{/if}}
          </div>
        </div>
        <div class="asset-content">{{{this.contentHtml}}}</div>
        {{#if this.pdfRelPath}}
        <a class="pdf-link" href="{{this.pdfRelPath}}">PDF herunterladen</a>
        {{/if}}
      </div>
    </div>
    {{/each}}

    <footer>
      Generated by Content Creator Pipeline &mdash; {{generatedAt}}
    </footer>
  </div>
</body>
</html>`;

export async function exportHtmlPreview(outputDir: string, state: PipelineState): Promise<void> {
  if (!state.plan || !state.assets) return;

  const template = Handlebars.compile(TEMPLATE);
  const previewDir = path.join(outputDir, "preview");

  const reviewMap = new Map(
    state.review?.assetReviews.map((r) => [r.assetId, r]) ?? []
  );

  const html = template({
    campaignName: state.plan.campaignName,
    summary: state.plan.summary,
    language: state.language,
    assetCount: state.assets.length,
    imageCount: state.assets.filter((a) => a.imagePath).length || undefined,
    pdfCount: state.assets.filter((a) => a.pdfPath).length || undefined,
    overallScore: state.review?.overallScore,
    generatedAt: new Date().toLocaleString(),
    assets: state.assets.map((a) => {
      const rev = reviewMap.get(a.id);
      const score = rev?.score;

      // Relative paths from preview/ to images/ and assets/
      let imageRelPath: string | undefined;
      if (a.imagePath) {
        imageRelPath = path.relative(previewDir, a.imagePath);
      }
      let pdfRelPath: string | undefined;
      if (a.pdfPath) {
        pdfRelPath = path.relative(previewDir, a.pdfPath);
      }

      // Render markdown to HTML
      const contentHtml = markdownToHtml(a.content);

      return {
        ...a,
        contentHtml,
        score,
        scoreClass: score ? (score >= 8 ? "score-high" : score >= 6 ? "score-mid" : "score-low") : "",
        typeBadgeClass: a.type === "whitepaper" ? "type-badge-whitepaper" : "",
        imageRelPath,
        pdfRelPath,
      };
    }),
  });

  await fs.writeFile(path.join(previewDir, "index.html"), html, "utf-8");
}
