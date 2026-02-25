import { AssetGenerator, withBrandContext, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { EMAIL_SYSTEM, emailPrompt } from "../prompts/assets/email.js";

export class EmailNewsletterGenerator extends AssetGenerator {
  readonly type: AssetType = "email-newsletter";
  readonly label = "Email Newsletter";
  readonly description = "Newsletter email with subject line and preview text";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: withBrandContext(EMAIL_SYSTEM, options.brandContext),
      prompt: emailPrompt({
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
      metadata: { platform: "Email", format: "newsletter" },
    };
  }
}
