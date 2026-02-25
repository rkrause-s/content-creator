import fs from "node:fs/promises";
import path from "node:path";
import type { PipelineState } from "../pipeline/types.js";

export async function exportMarkdown(outputDir: string, state: PipelineState): Promise<void> {
  if (!state.plan || !state.assets) return;

  // Content plan as markdown
  const planMd = renderContentPlan(state);
  await fs.writeFile(path.join(outputDir, "content-plan.md"), planMd, "utf-8");

  // Individual asset files
  for (const asset of state.assets) {
    const typeDir = path.join(outputDir, "assets", asset.type.replace("-", "/").replace("-", "-"));
    // Map type to folder: linkedin-post → linkedin, blog-article → blog, etc.
    const folder = asset.type.split("-")[0];
    const assetDir = path.join(outputDir, "assets", folder);
    await fs.mkdir(assetDir, { recursive: true });

    const filename = `${asset.id.split("-").slice(-1)[0] || asset.id}.md`;
    const content = `# ${asset.title}\n\n> Type: ${asset.type} | ID: ${asset.id}\n\n${asset.content}\n`;
    await fs.writeFile(path.join(assetDir, filename), content, "utf-8");
  }
}

function renderContentPlan(state: PipelineState): string {
  const plan = state.plan!;
  let md = `# ${plan.campaignName}\n\n`;
  md += `${plan.summary}\n\n`;
  md += `## Content Pillars\n\n`;

  for (const pillar of plan.pillars) {
    md += `### ${pillar.name}\n\n${pillar.description}\n\n`;
    md += pillar.keyMessages.map((m) => `- ${m}`).join("\n") + "\n\n";
  }

  md += `## Planned Assets\n\n`;
  for (const asset of plan.assets) {
    md += `### ${asset.id}: ${asset.title}\n\n`;
    md += `- **Type**: ${asset.type}\n`;
    md += `- **Angle**: ${asset.angle}\n`;
    md += `- **Pillar**: ${asset.pillar}\n`;
    md += `- **CTA**: ${asset.cta}\n`;
    md += `- **Key Points**:\n${asset.keyPoints.map((p) => `  - ${p}`).join("\n")}\n\n`;
  }

  md += `## Brand Voice Guidelines\n\n${plan.brandVoiceGuidelines}\n`;
  return md;
}
