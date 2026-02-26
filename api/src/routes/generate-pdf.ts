import { Hono } from "hono";
import type { AppEnv } from "../server.js";
import { generatePdfBuffer } from "../../../src/export/pdf.js";

export const generatePdfRoute = new Hono<AppEnv>();

generatePdfRoute.post("/", async (c) => {
  const { content, title, language } = await c.req.json<{
    content: string;
    title: string;
    language?: string;
  }>();

  if (!content || !title) {
    return c.json({ error: "content and title are required" }, 400);
  }

  const pdfBuffer = await generatePdfBuffer({
    content,
    title,
    language: language ?? "de",
  });

  const base64 = pdfBuffer.toString("base64");
  return c.json({ base64 });
});
