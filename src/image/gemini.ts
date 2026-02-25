import { GoogleGenAI } from "@google/genai";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Add it to .env or set as environment variable.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateImage(options: {
  prompt: string;
  outputPath: string;
}): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: options.prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) {
    throw new Error("No content returned from Gemini image generation");
  }

  for (const part of parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const mimeType = part.inlineData.mimeType ?? "image/png";
      const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? ".jpg" : ".png";

      const finalPath = options.outputPath.replace(/\.[^.]+$/, "") + ext;
      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      await fs.writeFile(finalPath, Buffer.from(imageData!, "base64"));
      return finalPath;
    }
  }

  throw new Error("No image data found in Gemini response");
}

export function buildImagePrompt(options: {
  assetType: string;
  title: string;
  topic: string;
  tone: string;
  brandImageContext?: string;
}): string {
  const styleMap: Record<string, string> = {
    "blog-article":
      "Create a professional, modern blog header image. Clean design with subtle tech elements. No text in the image. 16:9 aspect ratio.",
    "linkedin-post":
      "Create a professional social media graphic for LinkedIn. Modern, corporate style with subtle gradients. No text in the image. Square format.",
    "twitter-post":
      "Create a clean, eye-catching social media graphic for Twitter/X. Minimalist design. No text in the image. 16:9 aspect ratio.",
    "email-newsletter":
      "Create a professional email header banner. Clean, inviting design. No text in the image. Wide format (3:1 ratio).",
    "instagram-caption":
      "Create a visually striking Instagram post image. Modern, vibrant design suitable for a tech company. No text in the image. Square format.",
    whitepaper:
      "Create a professional whitepaper cover design. Elegant, authoritative, business-appropriate. Abstract tech/data visualization elements. No text in the image. A4 portrait format.",
  };

  const style = styleMap[options.assetType] ?? styleMap["blog-article"];

  return `${style}

Topic: ${options.title}
Theme: ${options.topic}
Mood: ${options.tone}

The image should feel professional and be suitable for a B2B technology company. Use a cohesive color palette (blues, purples, teals). Photorealistic or high-quality illustration style.${options.brandImageContext ? `\n\nBrand visual guidelines (follow these closely):\n${options.brandImageContext}` : ""}`;
}
