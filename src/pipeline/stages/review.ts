import { generateStructured, generateText } from "../../claude/client.js";
import {
  ReviewResultSchema,
  type CampaignBrief,
  type ContentPlan,
  type GeneratedAsset,
  type ReviewResult,
} from "../types.js";
import { REVIEW_SYSTEM, reviewPrompt } from "../../prompts/review.js";

export async function reviewAssets(
  brief: CampaignBrief,
  plan: ContentPlan,
  assets: GeneratedAsset[],
  brandContext?: string
): Promise<{ review: ReviewResult; revisedAssets: GeneratedAsset[] }> {
  const review = await generateStructured({
    system: REVIEW_SYSTEM,
    prompt: reviewPrompt(brief, plan, assets, brandContext),
    schema: ReviewResultSchema,
    schemaName: "ReviewResult",
  });

  // Revise assets that scored below 7
  const revisedAssets = [...assets];
  const needsRevision = review.assetReviews.filter((r) => r.score < 7);

  for (const rev of needsRevision) {
    const idx = revisedAssets.findIndex((a) => a.id === rev.assetId);
    if (idx === -1) continue;

    const original = revisedAssets[idx];
    const brandNote = brandContext ? `\n\nBrand guidelines to follow:\n${brandContext}` : "";
    const revisedContent = await generateText({
      system: `You are revising a marketing asset based on editorial feedback. Maintain the same format and structure but address the issues.${brandNote}`,
      prompt: `Original ${original.type} asset:\n\n${original.content}\n\nIssues to fix:\n${rev.issues.map((i) => `- ${i}`).join("\n")}\n\nSuggestions:\n${rev.suggestions.map((s) => `- ${s}`).join("\n")}\n\nWrite the revised version:`,
      maxTokens: 8192,
    });

    revisedAssets[idx] = { ...original, content: revisedContent };
  }

  return { review, revisedAssets };
}
