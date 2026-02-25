import type { AssetType, GeneratedAsset } from "../pipeline/types.js";
import type { PlannedAsset } from "../pipeline/types.js";

export interface GeneratorOptions {
  brandVoice: string;
  language: string;
}

export abstract class AssetGenerator {
  abstract readonly type: AssetType;
  abstract readonly label: string;
  abstract readonly description: string;

  abstract generate(
    asset: PlannedAsset,
    options: GeneratorOptions
  ): Promise<GeneratedAsset>;
}
