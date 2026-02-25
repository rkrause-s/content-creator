import path from "node:path";
import type { GeneratedAsset, CampaignBrief } from "../types.js";
import { generateImage, buildImagePrompt } from "../../image/gemini.js";
import { config } from "../../config.js";

export async function generateImages(
  assets: GeneratedAsset[],
  brief: CampaignBrief,
  outputDir: string
): Promise<GeneratedAsset[]> {
  const imagesDir = path.join(outputDir, "images");
  const concurrency = config.maxConcurrent;
  const queue = [...assets];
  const result: GeneratedAsset[] = [];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const updated = await Promise.all(
      batch.map(async (asset) => {
        try {
          const prompt = buildImagePrompt({
            assetType: asset.type,
            title: asset.title,
            topic: brief.topic,
            tone: brief.tone,
          });

          const imagePath = await generateImage({
            prompt,
            outputPath: path.join(imagesDir, `${asset.id}.png`),
          });

          return { ...asset, imagePath };
        } catch (err) {
          // Image generation is non-fatal — continue without image
          console.error(`  Warning: Image generation failed for ${asset.id}: ${(err as Error).message}`);
          return asset;
        }
      })
    );
    result.push(...updated);
  }

  return result;
}
