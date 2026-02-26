import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { planContent } from "../../../src/pipeline/stages/plan-content.js";
import type { CampaignBrief } from "../../../src/pipeline/types.js";

export const planContentRoute = new Hono<AppEnv>();

planContentRoute.post("/", async (c) => {
  const { brief } = await c.req.json<{ brief: CampaignBrief }>();

  if (!brief) {
    return c.json({ error: "brief is required" }, 400);
  }

  const brandConfig = c.get("brandConfig");
  const plan = await planContent(
    brief,
    brandConfig.loaded ? brandConfig.textContext : undefined
  );

  return c.json(plan);
});
