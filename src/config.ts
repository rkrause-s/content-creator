import dotenv from "dotenv";

dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_GENERATORS ?? "3", 10),
  defaultLanguage: process.env.DEFAULT_LANGUAGE ?? "de",
};

export function validateConfig(): void {
  if (!config.geminiApiKey && !process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key, or set it as an environment variable."
    );
  }
}
