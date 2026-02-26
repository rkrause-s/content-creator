import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { reviewAssets } from "../../../src/pipeline/stages/review.js";
import type { CampaignBrief, ContentPlan, GeneratedAsset } from "../../../src/pipeline/types.js";

export const reviewAssetsRoute = new Hono<AppEnv>();

reviewAssetsRoute.post("/", async (c) => {
  const { brief, plan, assets } = await c.req.json<{
    brief: CampaignBrief;
    plan: ContentPlan;
    assets: GeneratedAsset[];
  }>();

  if (!brief || !plan || !assets) {
    return c.json({ error: "brief, plan, and assets are required" }, 400);
  }

  const brandConfig = c.get("brandConfig");
  const result = await reviewAssets(
    brief,
    plan,
    assets,
    brandConfig.loaded ? brandConfig.textContext : undefined
  );

  return c.json(result);
});
