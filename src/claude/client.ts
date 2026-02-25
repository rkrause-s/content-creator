import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { config } from "../config.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = config.anthropicApiKey
      ? new Anthropic({ apiKey: config.anthropicApiKey })
      : new Anthropic();
  }
  return client;
}

export async function generateStructured<T>(options: {
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  schemaName: string;
}): Promise<T> {
  const anthropic = getClient();
  const jsonSchema = z.toJSONSchema(options.schema);

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: 8192,
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
    tools: [
      {
        name: options.schemaName,
        description: `Output structured data as ${options.schemaName}`,
        input_schema: jsonSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: options.schemaName },
  });

  const toolBlock = response.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("No structured output returned from Claude");
  }

  return options.schema.parse(toolBlock.input);
}

export async function generateText(options: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: config.model,
    max_tokens: options.maxTokens ?? 4096,
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text output returned from Claude");
  }

  return textBlock.text;
}
