import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import type { GeneratedAsset } from "../pipeline/types.js";
import { markdownToHtml } from "./markdown-to-html.js";

const WHITEPAPER_TEMPLATE = `<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2cm;
      @bottom-center { content: counter(page); font-size: 9pt; color: #999; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #2d3748;
    }

    /* Cover page */
    .cover {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 85vh;
      text-align: center;
    }
    .cover-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 3rem;
    }
    .cover h1 {
      font-size: 28pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    .cover .subtitle {
      font-size: 14pt;
      color: #667eea;
      font-weight: 400;
      margin-bottom: 2rem;
    }
    .cover .meta {
      font-size: 10pt;
      color: #a0aec0;
    }

    /* Content */
    h1 { font-size: 22pt; color: #1a202c; margin: 2rem 0 1rem; page-break-after: avoid; }
    h2 { font-size: 16pt; color: #2d3748; margin: 1.8rem 0 0.8rem; border-bottom: 2px solid #667eea; padding-bottom: 0.3rem; page-break-after: avoid; }
    h3 { font-size: 13pt; color: #4a5568; margin: 1.2rem 0 0.5rem; page-break-after: avoid; }
    p { margin-bottom: 0.8rem; text-align: justify; }
    ul, ol { margin: 0.5rem 0 1rem 1.5rem; }
    li { margin-bottom: 0.3rem; }

    blockquote {
      border-left: 3px solid #667eea;
      padding: 0.8rem 1.2rem;
      margin: 1rem 0;
      background: #f7fafc;
      font-style: italic;
      color: #4a5568;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 10pt;
    }
    th { background: #667eea; color: white; padding: 0.6rem 0.8rem; text-align: left; font-weight: 600; }
    td { padding: 0.5rem 0.8rem; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f7fafc; }

    code {
      background: #edf2f7;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      font-size: 9.5pt;
      font-family: 'SF Mono', Monaco, monospace;
    }
    pre {
      background: #2d3748;
      color: #e2e8f0;
      padding: 1rem;
      border-radius: 6px;
      margin: 1rem 0;
      overflow-x: auto;
      font-size: 9pt;
    }
    pre code { background: none; padding: 0; color: inherit; }

    .highlight-box {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border: 1px solid #667eea40;
      border-radius: 8px;
      padding: 1.2rem;
      margin: 1rem 0;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 2rem 0;
    }

    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="cover">
    {{#if coverImage}}
    <img class="cover-image" src="{{coverImage}}" alt="Cover">
    {{/if}}
    <h1>{{title}}</h1>
    <div class="subtitle">{{subtitle}}</div>
    <div class="meta">{{date}}</div>
  </div>

  <div class="content">
    {{{contentHtml}}}
  </div>
</body>
</html>`;

export async function generatePdf(options: {
  asset: GeneratedAsset;
  outputPath: string;
  coverImagePath?: string;
  language: string;
}): Promise<string> {
  const template = Handlebars.compile(WHITEPAPER_TEMPLATE);

  // Extract subtitle from first line after H1 if italic
  const lines = options.asset.content.split("\n");
  let subtitle = "";
  const firstH1Idx = lines.findIndex((l) => l.startsWith("# "));
  if (firstH1Idx >= 0 && lines[firstH1Idx + 2]?.startsWith("*")) {
    subtitle = lines[firstH1Idx + 2].replace(/^\*+|\*+$/g, "");
  }

  // Convert cover image to data URI if available
  let coverImage: string | undefined;
  if (options.coverImagePath) {
    try {
      const fs = await import("node:fs/promises");
      const imgBuffer = await fs.readFile(options.coverImagePath);
      const ext = options.coverImagePath.endsWith(".jpg") ? "jpeg" : "png";
      coverImage = `data:image/${ext};base64,${imgBuffer.toString("base64")}`;
    } catch {
      // Skip cover image if not available
    }
  }

  const contentHtml = markdownToHtml(options.asset.content);

  const html = template({
    title: options.asset.title,
    subtitle,
    date: new Date().toLocaleDateString(options.language === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
    }),
    language: options.language,
    coverImage,
    contentHtml,
  });

  const pdfPath = options.outputPath.replace(/\.[^.]+$/, "") + ".pdf";

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "2.5cm", right: "2cm", bottom: "2.5cm", left: "2cm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font-size:9px;color:#999;width:100%;text-align:center;padding:0 2cm;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`,
    });
  } finally {
    await browser.close();
  }

  return pdfPath;
}

/**
 * Generates a PDF and returns it as a Buffer instead of writing to disk.
 * Used by the API service.
 */
export async function generatePdfBuffer(options: {
  content: string;
  title: string;
  language: string;
  coverImageBase64?: string;
}): Promise<Buffer> {
  const template = Handlebars.compile(WHITEPAPER_TEMPLATE);

  const lines = options.content.split("\n");
  let subtitle = "";
  const firstH1Idx = lines.findIndex((l) => l.startsWith("# "));
  if (firstH1Idx >= 0 && lines[firstH1Idx + 2]?.startsWith("*")) {
    subtitle = lines[firstH1Idx + 2].replace(/^\*+|\*+$/g, "");
  }

  const contentHtml = markdownToHtml(options.content);

  const html = template({
    title: options.title,
    subtitle,
    date: new Date().toLocaleDateString(options.language === "de" ? "de-DE" : "en-US", {
      year: "numeric",
      month: "long",
    }),
    language: options.language,
    coverImage: options.coverImageBase64,
    contentHtml,
  });

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "2.5cm", right: "2cm", bottom: "2.5cm", left: "2cm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="font-size:9px;color:#999;width:100%;text-align:center;padding:0 2cm;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>`,
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
