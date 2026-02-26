import type { APIRoute } from "astro";
import { insertRow, getCampaign } from "../../lib/seatable";
import { triggerCampaignPipeline } from "../../lib/n8n";

/** POST: Create new campaign, insert into SeaTable, trigger n8n */
export const POST: APIRoute = async ({ request }) => {
  const { prompt, language } = await request.json();

  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const campaignId = await insertRow("Campaigns", {
    Name: "",
    Status: "draft",
    Prompt: prompt,
    Language: language ?? "de",
  });

  // Fire-and-forget: trigger n8n webhook
  triggerCampaignPipeline({
    prompt,
    language: language ?? "de",
    campaignRowId: campaignId,
  }).catch((err) => {
    console.error("Failed to trigger n8n campaign pipeline:", err);
  });

  return new Response(JSON.stringify({ campaignId }), {
    headers: { "Content-Type": "application/json" },
  });
};

/** GET: Read campaign status (for polling) */
export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const campaign = await getCampaign(id);

  if (!campaign) {
    return new Response(JSON.stringify({ error: "not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(campaign), {
    headers: { "Content-Type": "application/json" },
  });
};
