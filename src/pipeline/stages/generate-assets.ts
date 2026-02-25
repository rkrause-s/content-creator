import type { ContentPlan, GeneratedAsset } from "../types.js";
import { getGenerator } from "../../generators/registry.js";
import { config } from "../../config.js";

export async function generateAssets(
  plan: ContentPlan,
  language: string,
  brandContext?: string
): Promise<GeneratedAsset[]> {
  const assets: GeneratedAsset[] = [];
  const queue = [...plan.assets];
  const concurrency = config.maxConcurrent;

  // Process in batches for rate-limit friendliness
  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const results = await Promise.all(
      batch.map((planned) => {
        const generator = getGenerator(planned.type);
        return generator.generate(planned, {
          brandVoice: plan.brandVoiceGuidelines,
          language,
          brandContext,
        });
      })
    );
    assets.push(...results);
  }

  return assets;
}
