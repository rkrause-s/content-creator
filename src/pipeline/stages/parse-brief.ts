import { generateStructured } from "../../claude/client.js";
import { CampaignBriefSchema, type CampaignBrief } from "../types.js";
import { BRIEF_PARSING_SYSTEM, briefParsingPrompt } from "../../prompts/brief-parsing.js";

export async function parseBrief(userPrompt: string, language: string, brandContext?: string): Promise<CampaignBrief> {
  const brief = await generateStructured({
    system: BRIEF_PARSING_SYSTEM,
    prompt: briefParsingPrompt(userPrompt, brandContext),
    schema: CampaignBriefSchema,
    schemaName: "CampaignBrief",
  });

  // Override language if explicitly set by CLI
  if (language) {
    brief.language = language;
  }

  return brief;
}
