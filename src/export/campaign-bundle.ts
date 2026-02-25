import fs from "node:fs/promises";
import path from "node:path";
import type { PipelineState } from "../pipeline/types.js";

export async function exportCampaignBundle(outputDir: string, state: PipelineState): Promise<void> {
  // campaign.json - complete pipeline output
  const bundle = {
    generatedAt: new Date().toISOString(),
    brief: state.brief,
    plan: state.plan,
    assets: state.assets?.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      metadata: a.metadata,
      contentLength: a.content.length,
    })),
    review: state.review,
  };
  await fs.writeFile(
    path.join(outputDir, "campaign.json"),
    JSON.stringify(bundle, null, 2),
    "utf-8"
  );

  // content-plan.json
  if (state.plan) {
    await fs.writeFile(
      path.join(outputDir, "content-plan.json"),
      JSON.stringify(state.plan, null, 2),
      "utf-8"
    );
  }

  // README.md
  const readme = generateReadme(state);
  await fs.writeFile(path.join(outputDir, "README.md"), readme, "utf-8");
}

function generateReadme(state: PipelineState): string {
  const plan = state.plan;
  const assets = state.assets ?? [];
  const review = state.review;

  let md = `# ${plan?.campaignName ?? "Campaign"}\n\n`;
  md += `> Generated on ${new Date().toLocaleString()}\n\n`;

  if (plan) {
    md += `## Overview\n\n${plan.summary}\n\n`;
  }

  if (state.brief) {
    md += `## Brief\n\n`;
    md += `- **Topic**: ${state.brief.topic}\n`;
    md += `- **Audience**: ${state.brief.targetAudience}\n`;
    md += `- **Language**: ${state.brief.language}\n`;
    md += `- **Tone**: ${state.brief.tone}\n\n`;
  }

  md += `## Generated Assets\n\n`;
  md += `| ID | Type | Title |\n|---|---|---|\n`;
  for (const a of assets) {
    md += `| ${a.id} | ${a.type} | ${a.title} |\n`;
  }

  if (review) {
    md += `\n## Review\n\n`;
    md += `- **Overall Score**: ${review.overallScore}/10\n`;
    md += `- **Consistency**: ${review.consistencyNotes}\n`;
  }

  md += `\n## Files\n\n`;
  md += `- \`content-plan.md\` - Content plan overview\n`;
  md += `- \`content-plan.json\` - Machine-readable content plan\n`;
  md += `- \`assets/\` - Individual asset files\n`;
  md += `- \`preview/index.html\` - Visual preview of all assets\n`;
  md += `- \`campaign.json\` - Complete pipeline output\n`;

  return md;
}
