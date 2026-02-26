import type { APIRoute } from "astro";
import { batchUpdateRows } from "../../lib/seatable";

/** POST: Mark selected assets as publish-queued for n8n pickup */
export const POST: APIRoute = async ({ request }) => {
  const { assetRowIds } = await request.json();

  if (!assetRowIds?.length) {
    return new Response(
      JSON.stringify({ error: "assetRowIds[] is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  await batchUpdateRows(
    "Assets",
    assetRowIds.map((id: string) => ({
      row_id: id,
      row: { Status: "publish-queued" },
    }))
  );

  return new Response(JSON.stringify({ ok: true, queued: assetRowIds.length }), {
    headers: { "Content-Type": "application/json" },
  });
};
