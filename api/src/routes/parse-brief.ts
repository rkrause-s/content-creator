import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { parseBrief } from "../../../src/pipeline/stages/parse-brief.js";

export const parseBriefRoute = new Hono<AppEnv>();

parseBriefRoute.post("/", async (c) => {
  const { prompt, language } = await c.req.json<{ prompt: string; language?: string }>();

  if (!prompt) {
    return c.json({ error: "prompt is required" }, 400);
  }

  const brandConfig = c.get("brandConfig");
  const brief = await parseBrief(
    prompt,
    language ?? "de",
    brandConfig.loaded ? brandConfig.textContext : undefined
  );

  return c.json(brief);
});
