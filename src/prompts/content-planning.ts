import type { CampaignBrief } from "../pipeline/types.js";

export const CONTENT_PLANNING_SYSTEM = `You are a senior content strategist creating a detailed content plan for a marketing campaign.

Your plan should:
1. Define 2-4 content pillars that support the campaign goals
2. Plan each requested asset with a specific angle, key points, and CTA
3. Ensure variety across assets - different angles, hooks, and CTAs
4. Maintain consistent brand voice guidelines
5. Each asset should be self-contained but part of the larger narrative

Asset IDs should follow the pattern: {type}-{number}, e.g. "linkedin-post-01", "blog-article-01"`;

export function contentPlanningPrompt(brief: CampaignBrief): string {
  return `Create a content plan for this campaign:

Topic: ${brief.topic}
Target Audience: ${brief.targetAudience}
Goals: ${brief.goals.join(", ")}
Tone: ${brief.tone}
Key Messages: ${brief.keyMessages.join("; ")}
Language: ${brief.language}
${brief.constraints?.length ? `Constraints: ${brief.constraints.join("; ")}` : ""}

Requested Assets:
${brief.requestedAssets.map((a) => `- ${a.count}x ${a.type}${a.notes ? ` (${a.notes})` : ""}`).join("\n")}`;
}
