import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { publishToRepo } from "../../../src/pipeline/stages/publish-to-repo.js";
import type { GeneratedAsset } from "../../../src/pipeline/types.js";

export const publishRoute = new Hono<AppEnv>();

publishRoute.post("/", async (c) => {
  const { assets, campaignName, repo } = await c.req.json<{
    assets: GeneratedAsset[];
    campaignName: string;
    repo?: string;
  }>();

  if (!assets || !campaignName) {
    return c.json({ error: "assets and campaignName are required" }, 400);
  }

  const result = await publishToRepo(assets, campaignName, {
    repo,
    createPr: true,
  });

  return c.json(result);
});
