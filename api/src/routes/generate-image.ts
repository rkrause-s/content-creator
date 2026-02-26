import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { generateImageBuffer, buildImagePrompt } from "../../../src/image/gemini.js";

export const generateImageRoute = new Hono<AppEnv>();

generateImageRoute.post("/", async (c) => {
  const { asset } = await c.req.json<{
    asset: {
      type: string;
      title: string;
      topic: string;
      tone: string;
    };
  }>();

  if (!asset) {
    return c.json({ error: "asset is required" }, 400);
  }

  const brandConfig = c.get("brandConfig");
  const prompt = buildImagePrompt({
    assetType: asset.type,
    title: asset.title,
    topic: asset.topic,
    tone: asset.tone,
    brandImageContext: brandConfig.loaded ? brandConfig.imageContext : undefined,
  });

  const { data, mimeType } = await generateImageBuffer({ prompt });
  const base64 = data.toString("base64");

  return c.json({ base64, mimeType });
});
