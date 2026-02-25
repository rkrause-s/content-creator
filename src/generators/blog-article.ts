import { AssetGenerator, type GeneratorOptions } from "./base.js";
import type { AssetType, GeneratedAsset, PlannedAsset } from "../pipeline/types.js";
import { generateText } from "../claude/client.js";
import { BLOG_SYSTEM, blogPrompt } from "../prompts/assets/blog.js";

export class BlogArticleGenerator extends AssetGenerator {
  readonly type: AssetType = "blog-article";
  readonly label = "Blog Article";
  readonly description = "SEO-optimized blog article in Markdown (800-1500 words)";

  async generate(asset: PlannedAsset, options: GeneratorOptions): Promise<GeneratedAsset> {
    const content = await generateText({
      system: BLOG_SYSTEM,
      prompt: blogPrompt({
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
      metadata: { platform: "Blog/Website", format: "article" },
    };
  }
}
