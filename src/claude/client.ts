import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { config } from "../config.js";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, or set it as an environment variable."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function generateStructured<T>(options: {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
}): Promise<T> {
  const ai = getClient();
  const jsonSchema = z.toJSONSchema(options.schema);

  const response = await ai.models.generateContent({
    model: config.model,
    contents: options.prompt,
    config: {
      systemInstruction: options.system,
      responseMimeType: "application/json",
      responseSchema: jsonSchema as Record<string, unknown>,
      maxOutputTokens: 8192,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No structured output returned from Gemini");
  }

  return options.schema.parse(JSON.parse(text));
}

export async function generateText(options: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: config.model,
    contents: options.prompt,
    config: {
      systemInstruction: options.system,
      maxOutputTokens: options.maxTokens ?? 4096,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No text output returned from Gemini");
  }

  return text;
}
