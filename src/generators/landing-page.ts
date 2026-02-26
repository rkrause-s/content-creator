import { AssetGenerator, withBrandContext, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { LANDING_PAGE_SYSTEM, landingPagePrompt } from "../prompts/assets/landing-page.js";

export class LandingPageGenerator extends AssetGenerator {
  readonly type: AssetType = "landing-page";
  readonly label = "Landing Page";
  readonly description = "Conversion-optimized landing page copy with hero, benefits, FAQ, and CTA";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: withBrandContext(LANDING_PAGE_SYSTEM, options.brandContext),
      prompt: landingPagePrompt({
        title: asset.title,
        angle: asset.angle,
        keyPoints: asset.keyPoints,
        cta: asset.cta,
        brandVoice: options.brandVoice,
        language: options.language,
      }),
      maxTokens: 8192,
    });

    return {
      id: asset.id,
      type: this.type,
      title: asset.title,
      content,
      metadata: { platform: "Website", format: "landing-page" },
    };
  }
}
