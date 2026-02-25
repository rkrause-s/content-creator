import { generateStructured } from "../../claude/client.js";
import { ContentPlanSchema, type CampaignBrief, type ContentPlan } from "../types.js";
import { CONTENT_PLANNING_SYSTEM, contentPlanningPrompt } from "../../prompts/content-planning.js";

export async function planContent(brief: CampaignBrief): Promise<ContentPlan> {
  return generateStructured({
    system: CONTENT_PLANNING_SYSTEM,
    prompt: contentPlanningPrompt(brief),
    schema: ContentPlanSchema,
    schemaName: "ContentPlan",
  });
}
