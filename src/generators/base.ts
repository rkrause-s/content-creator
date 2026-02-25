import type { AssetType, GeneratedAsset } from "../pipeline/types.js";
import type { PlannedAsset } from "../pipeline/types.js";

export interface GeneratorOptions {
  brandVoice: string;
  language: string;
  brandContext?: string;
}

/** Appends brand context to a system prompt if available */
export function withBrandContext(systemPrompt: string, brandContext?: string): string {
  if (!brandContext) return systemPrompt;
  return `${systemPrompt}\n\n---\n\nIMPORTANT - Follow these brand guidelines closely in tone, terminology, and style:\n\n${brandContext}`;
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
