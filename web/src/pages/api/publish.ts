import type { APIRoute } from "astro";
import { triggerPublish } from "../../lib/n8n";

/** POST: Trigger publish workflow for selected assets */
export const POST: APIRoute = async ({ request }) => {
  const { campaignRowId, assetRowIds } = await request.json();

  if (!campaignRowId || !assetRowIds?.length) {
    return new Response(
      JSON.stringify({ error: "campaignRowId and assetRowIds[] are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await triggerPublish({ campaignRowId, assetRowIds });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
