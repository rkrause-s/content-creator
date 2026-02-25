import { AssetGenerator, withBrandContext, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { LINKEDIN_SYSTEM, linkedinPrompt } from "../prompts/assets/linkedin.js";

export class LinkedInPostGenerator extends AssetGenerator {
  readonly type: AssetType = "linkedin-post";
  readonly label = "LinkedIn Post";
  readonly description = "Professional LinkedIn post with hashtags and CTA";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: withBrandContext(LINKEDIN_SYSTEM, options.brandContext),
      prompt: linkedinPrompt({
        title: asset.title,
        angle: asset.angle,
        keyPoints: asset.keyPoints,
        cta: asset.cta,
        brandVoice: options.brandVoice,
        language: options.language,
      }),
    });

    return {
      id: asset.id,
      type: this.type,
      title: asset.title,
      content,
      metadata: { platform: "LinkedIn", format: "post" },
    };
  }
}
