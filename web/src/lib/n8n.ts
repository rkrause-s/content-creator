/**
 * n8n webhook trigger helpers.
 */

const N8N_WEBHOOK_BASE = import.meta.env.N8N_WEBHOOK_BASE ?? "https://n8n.seibert.tools/webhook";

export async function triggerCampaignPipeline(options: {
  prompt: string;
  language: string;
  campaignRowId: string;
}): Promise<void> {
  const res = await fetch(`${N8N_WEBHOOK_BASE}/campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    throw new Error(`n8n campaign webhook failed: ${res.status} ${await res.text()}`);
  }
}

export async function triggerPublish(options: {
  campaignRowId: string;
  assetRowIds: string[];
}): Promise<void> {
  const res = await fetch(`${N8N_WEBHOOK_BASE}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!res.ok) {
    throw new Error(`n8n publish webhook failed: ${res.status} ${await res.text()}`);
  }
}
