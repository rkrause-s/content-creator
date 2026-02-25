import { AssetGenerator, withBrandContext, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { INSTAGRAM_SYSTEM, instagramPrompt } from "../prompts/assets/instagram.js";

export class InstagramCaptionGenerator extends AssetGenerator {
  readonly type: AssetType = "instagram-caption";
  readonly label = "Instagram Caption";
  readonly description = "Engaging caption with hashtags for Instagram";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: withBrandContext(INSTAGRAM_SYSTEM, options.brandContext),
      prompt: instagramPrompt({
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
      metadata: { platform: "Instagram", format: "caption" },
    };
  }
}
