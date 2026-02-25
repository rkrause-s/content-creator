import { AssetGenerator, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { TWITTER_SYSTEM, twitterPrompt } from "../prompts/assets/twitter.js";

export class TwitterPostGenerator extends AssetGenerator {
  readonly type: AssetType = "twitter-post";
  readonly label = "Twitter/X Post";
  readonly description = "Tweet or short thread (max 280 chars per tweet)";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: TWITTER_SYSTEM,
      prompt: twitterPrompt({
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
      metadata: { platform: "Twitter/X", format: "tweet" },
    };
  }
}
