import dotenv from "dotenv";

dotenv.config();

export const config = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514",
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_GENERATORS ?? "3", 10),
  defaultLanguage: process.env.DEFAULT_LANGUAGE ?? "de",
};

export function validateConfig(): void {
  if (!config.anthropicApiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
    );
  }
}
