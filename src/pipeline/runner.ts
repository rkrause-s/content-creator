import ora from "ora";
import chalk from "chalk";
import type { PipelineState } from "./types.js";
import { parseBrief } from "./stages/parse-brief.js";
import { planContent } from "./stages/plan-content.js";
import { generateAssets } from "./stages/generate-assets.js";
import { reviewAssets } from "./stages/review.js";
import { exportCampaign } from "./stages/export.js";

export interface RunOptions {
  language: string;
  outputDir?: string;
  planOnly?: boolean;
}

export async function runPipeline(userPrompt: string, options: RunOptions): Promise<PipelineState> {
  const state: PipelineState = {
    userPrompt,
    language: options.language,
    outputDir: options.outputDir,
  };

  // Stage 1: Parse Brief
  let spinner = ora("Parsing campaign brief...").start();
  try {
    state.brief = await parseBrief(userPrompt, options.language);
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
    state.plan = await planContent(state.brief);
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

  // Stage 3: Generate Assets
  spinner = ora(`Generating ${state.plan.assets.length} assets...`).start();
  try {
    state.assets = await generateAssets(state.plan, state.language);
    spinner.succeed(`${state.assets.length} assets generated`);
  } catch (err) {
    spinner.fail("Failed to generate assets");
    throw err;
  }

  // Stage 4: Review
  spinner = ora("Reviewing assets for quality and consistency...").start();
  try {
    const { review, revisedAssets } = await reviewAssets(state.brief, state.plan, state.assets);
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

  // Stage 5: Export
  spinner = ora("Exporting campaign...").start();
  try {
    const outputDir = await exportCampaign(state);
    state.outputDir = outputDir;
    spinner.succeed(`Campaign exported to ${chalk.underline(outputDir)}`);
  } catch (err) {
    spinner.fail("Failed to export campaign");
    throw err;
  }

  return state;
}
