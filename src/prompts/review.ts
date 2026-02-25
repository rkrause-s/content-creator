import type { CampaignBrief, ContentPlan, GeneratedAsset } from "../pipeline/types.js";

export const REVIEW_SYSTEM = `You are a senior marketing editor reviewing a set of campaign assets for quality and consistency.

Evaluate each asset on:
1. Quality of writing (clarity, engagement, persuasiveness)
2. Adherence to brand voice and tone guidelines
3. Accuracy of key messages
4. Effectiveness of CTA
5. Platform-appropriateness (length, format, style)

Also check cross-asset consistency:
- Are key messages consistent across all assets?
- Is the brand voice uniform?
- Do CTAs complement each other without being repetitive?

Score each asset 1-10 and mark assets scoring below 7 for revision.
Provide an overall campaign score too.`;

export function reviewPrompt(
  brief: CampaignBrief,
  plan: ContentPlan,
  assets: GeneratedAsset[]
): string {
  const assetTexts = assets
    .map(
      (a) =>
        `### ${a.id} (${a.type}): ${a.title}\n\n${a.content}\n\nMetadata: ${JSON.stringify(a.metadata)}`
    )
    .join("\n\n---\n\n");

  return `Review these campaign assets for consistency and quality.

## Campaign Brief
- Topic: ${brief.topic}
- Audience: ${brief.targetAudience}
- Tone: ${brief.tone}
- Key Messages: ${brief.keyMessages.join("; ")}

## Brand Voice Guidelines
${plan.brandVoiceGuidelines}

## Assets to Review

${assetTexts}`;
}
