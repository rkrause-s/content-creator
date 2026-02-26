import ora from "ora";
import chalk from "chalk";
import type { PipelineState } from "./types.js";
import { parseBrief } from "./stages/parse-brief.js";
import { planContent } from "./stages/plan-content.js";
import { generateAssets } from "./stages/generate-assets.js";
import { reviewAssets } from "./stages/review.js";
import { exportCampaign } from "./stages/export.js";
import { generateImages } from "./stages/generate-images.js";
import { generatePdfs } from "./stages/generate-pdfs.js";
import { publishToRepo, type PublishOptions, type PublishResult } from "./stages/publish-to-repo.js";
import { loadBrandConfig } from "../brand/loader.js";

export interface RunOptions {
  language: string;
  outputDir?: string;
  planOnly?: boolean;
  skipImages?: boolean;
  /** Publish blog-article/landing-page assets to a GitHub content repo */
  publish?: boolean;
  /** GitHub repo for publishing (default: seibert-external/go.seibert.group) */
  publishRepo?: string;
}

export async function runPipeline(userPrompt: string, options: RunOptions): Promise<PipelineState> {
  const state: PipelineState = {
    userPrompt,
    language: options.language,
    outputDir: options.outputDir,
  };

  // Load brand configuration
  const brand = await loadBrandConfig();
  if (brand.loaded) {
    state.brandTextContext = brand.textContext;
    state.brandImageContext = brand.imageContext;
    console.log(chalk.dim(`  Brand config loaded (${Object.keys(brand.files).join(", ")})`));
  }

  // Stage 1: Parse Brief
  let spinner = ora("Parsing campaign brief...").start();
  try {
    state.brief = await parseBrief(userPrompt, options.language, state.brandTextContext);
    spinner.succeed(
      `Brief parsed: ${chalk.bold(state.brief.topic)} → ${state.brief.requestedAssets.map((a) => `${a.count}x ${a.type}`).join(", ")}`
    );
  } catch (err) {
    spinner.fail("Failed to parse brief");
    throw err;
  }

  // Stage 2: Plan Content
  spinner = ora("Creating content plan...").start();
  try {
    state.plan = await planContent(state.brief, state.brandTextContext);
    spinner.succeed(
      `Content plan ready: ${chalk.bold(state.plan.campaignName)} (${state.plan.assets.length} assets planned)`
    );
  } catch (err) {
    spinner.fail("Failed to create content plan");
    throw err;
  }

  if (options.planOnly) {
    return state;
  }

  // Stage 3: Generate Assets (text content)
  spinner = ora(`Generating ${state.plan.assets.length} assets...`).start();
  try {
    state.assets = await generateAssets(state.plan, state.language, state.brandTextContext);
    spinner.succeed(`${state.assets.length} assets generated`);
  } catch (err) {
    spinner.fail("Failed to generate assets");
    throw err;
  }

  // Stage 4: Review
  spinner = ora("Reviewing assets for quality and consistency...").start();
  try {
    const { review, revisedAssets } = await reviewAssets(state.brief, state.plan, state.assets, state.brandTextContext);
    state.review = review;
    state.assets = revisedAssets;
    const revised = review.assetReviews.filter((r) => r.score < 7).length;
    spinner.succeed(
      `Review complete: ${chalk.bold(String(review.overallScore))}/10 overall${revised > 0 ? ` (${revised} assets revised)` : ""}`
    );
  } catch (err) {
    spinner.fail("Failed to review assets");
    throw err;
  }

  // Stage 5: Export (creates output directory)
  spinner = ora("Exporting campaign...").start();
  try {
    const outputDir = await exportCampaign(state);
    state.outputDir = outputDir;
    spinner.succeed(`Campaign exported to ${chalk.underline(outputDir)}`);
  } catch (err) {
    spinner.fail("Failed to export campaign");
    throw err;
  }

  // Stage 6: Generate Images (Gemini)
  if (!options.skipImages) {
    spinner = ora(`Generating images for ${state.assets.length} assets...`).start();
    try {
      state.assets = await generateImages(state.assets, state.brief, state.outputDir!, state.brandImageContext);
      const imageCount = state.assets.filter((a) => a.imagePath).length;
      spinner.succeed(`${imageCount} images generated`);
    } catch (err) {
      spinner.fail("Image generation failed (continuing without images)");
    }
  }

  // Stage 7: Generate PDFs (whitepapers)
  const hasWhitepapers = state.assets.some((a) => a.type === "whitepaper");
  if (hasWhitepapers) {
    spinner = ora("Generating whitepaper PDFs...").start();
    try {
      state.assets = await generatePdfs(state.assets, state.outputDir!, state.language);
      const pdfCount = state.assets.filter((a) => a.pdfPath).length;
      spinner.succeed(`${pdfCount} PDF(s) generated`);
    } catch (err) {
      spinner.fail("PDF generation failed (continuing without PDFs)");
    }
  }

  // Re-export HTML preview with image paths and PDF links
  if (state.assets.some((a) => a.imagePath || a.pdfPath)) {
    const { exportHtmlPreview } = await import("../export/html-preview.js");
    await exportHtmlPreview(state.outputDir!, state);
  }

  // Stage 8: Publish to GitHub repo (blog-article, landing-page)
  if (options.publish) {
    const publishable = state.assets.filter((a) => ["blog-article", "landing-page"].includes(a.type));
    if (publishable.length > 0) {
      spinner = ora(`Publishing ${publishable.length} page(s) to GitHub...`).start();
      try {
        const result = await publishToRepo(state.assets, state.plan!.campaignName, {
          repo: options.publishRepo,
          createPr: true,
        });
        state.publishResult = result;
        if (result.prUrl) {
          spinner.succeed(`PR created: ${chalk.underline(result.prUrl)}`);
        } else {
          spinner.succeed(`${result.published.length} page(s) pushed to ${result.repo}:${result.branch}`);
        }
      } catch (err) {
        spinner.fail(`Publishing failed: ${(err as Error).message}`);
      }
    }
  }

  return state;
}
