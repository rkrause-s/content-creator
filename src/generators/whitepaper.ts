import { AssetGenerator, withBrandContext, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { WHITEPAPER_SYSTEM, whitepaperPrompt } from "../prompts/assets/whitepaper.js";

export class WhitepaperGenerator extends AssetGenerator {
  readonly type: AssetType = "whitepaper";
  readonly label = "Whitepaper (PDF)";
  readonly description = "In-depth whitepaper (3000-5000 words), exported as PDF";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: withBrandContext(WHITEPAPER_SYSTEM, options.brandContext),
      prompt: whitepaperPrompt({
        title: asset.title,
        angle: asset.angle,
        keyPoints: asset.keyPoints,
        cta: asset.cta,
        brandVoice: options.brandVoice,
        language: options.language,
      }),
      maxTokens: 16384,
    });

    return {
      id: asset.id,
      type: this.type,
      title: asset.title,
      content,
      metadata: { platform: "Download/Gated Content", format: "whitepaper-pdf" },
    };
  }
}
