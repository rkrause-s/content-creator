import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import dotenv from "dotenv";

// Load env from api/.env, then fall back to root .env
dotenv.config();
dotenv.config({ path: "../.env" });

import { loadBrandConfig, type BrandConfig } from "../../src/brand/loader.js";
import { parseBriefRoute } from "./routes/parse-brief.js";
import { planContentRoute } from "./routes/plan-content.js";
import { generateAssetRoute } from "./routes/generate-asset.js";
import { reviewAssetsRoute } from "./routes/review-assets.js";
import { generateImageRoute } from "./routes/generate-image.js";
import { generatePdfRoute } from "./routes/generate-pdf.js";
import { publishRoute } from "./routes/publish.js";

export type AppEnv = {
  Variables: {
    brandConfig: BrandConfig;
  };
};

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use("*", cors());

// Load brand config once at startup, inject into all requests
let brandConfig: BrandConfig;

app.use("*", async (c, next) => {
  if (!brandConfig) {
    brandConfig = await loadBrandConfig();
  }
  c.set("brandConfig", brandConfig);
  await next();
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Pipeline stage routes
app.route("/parse-brief", parseBriefRoute);
app.route("/plan-content", planContentRoute);
app.route("/generate-asset", generateAssetRoute);
app.route("/review-assets", reviewAssetsRoute);
app.route("/generate-image", generateImageRoute);
app.route("/generate-pdf", generatePdfRoute);
app.route("/publish", publishRoute);

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`Content Creator API starting on port ${port}...`);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Content Creator API running at http://localhost:${port}`);
});

export default app;
