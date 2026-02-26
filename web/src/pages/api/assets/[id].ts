import type { APIRoute } from "astro";
import { updateRow } from "../../../lib/seatable";

/** PUT: Update asset content */
export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updates = await request.json();

  // Only allow updating specific fields
  const allowed = ["Content", "Status"];
  const filtered: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) {
      filtered[key] = updates[key];
    }
  }

  if (Object.keys(filtered).length === 0) {
    return new Response(JSON.stringify({ error: "no valid fields to update" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  await updateRow("Assets", id, filtered);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
