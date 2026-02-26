import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { getGenerator } from "../../../src/generators/registry.js";
import type { PlannedAsset, AssetType } from "../../../src/pipeline/types.js";

export const generateAssetRoute = new Hono<AppEnv>();

generateAssetRoute.post("/", async (c) => {
  const { plannedAsset, brandVoice, language } = await c.req.json<{
    plannedAsset: PlannedAsset;
    brandVoice?: string;
    language?: string;
  }>();

  if (!plannedAsset) {
    return c.json({ error: "plannedAsset is required" }, 400);
  }

  const brandConfig = c.get("brandConfig");
  const generator = getGenerator(plannedAsset.type as AssetType);
  const asset = await generator.generate(plannedAsset, {
    brandVoice: brandVoice ?? "",
    language: language ?? "de",
    brandContext: brandConfig.loaded ? brandConfig.textContext : undefined,
  });

  return c.json(asset);
});
