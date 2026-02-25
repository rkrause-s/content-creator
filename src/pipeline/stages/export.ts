import fs from "node:fs/promises";
import path from "node:path";
import type { PipelineState } from "../types.js";
import { exportMarkdown } from "../../export/markdown.js";
import { exportHtmlPreview } from "../../export/html-preview.js";
import { exportCampaignBundle } from "../../export/campaign-bundle.js";

export async function exportCampaign(state: PipelineState): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputDir = path.resolve(state.outputDir ?? "output", `campaign-${timestamp}`);

  await fs.mkdir(path.join(outputDir, "assets"), { recursive: true });
  await fs.mkdir(path.join(outputDir, "preview"), { recursive: true });

  // Export markdown files for each asset
  await exportMarkdown(outputDir, state);

  // Export HTML preview
  await exportHtmlPreview(outputDir, state);

  // Export campaign bundle (JSON + README)
  await exportCampaignBundle(outputDir, state);

  return outputDir;
}
