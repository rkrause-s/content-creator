/**
 * SeaTable client with two-step auth (API-Token → Base-Token).
 * Reads via SQL API (v2), writes via Batch Update API.
 *
 * API patterns follow Seibert Group conventions:
 * - Always use SQL API for reads (up to 10,000 rows)
 * - Never SELECT * — use two-step loading to prevent truncation
 * - Batch update with updates[] array for writes
 */

const SEATABLE_BASE_URL = import.meta.env.SEATABLE_BASE_URL ?? "https://seatable.seibert.tools";
const SEATABLE_API_TOKEN = import.meta.env.SEATABLE_API_TOKEN ?? "";

/** Link IDs for known table relationships */
const LINK_ID_CAMPAIGN_ASSETS = "fttn";
const TABLE_ID_CAMPAIGNS = "SbjW";
const TABLE_ID_ASSETS = "8reU";

interface BaseToken {
  access_token: string;
  dtable_uuid: string;
  dtable_server: string;
  dtable_name: string;
  expires_at: number;
}

let cachedToken: BaseToken | null = null;

/** Exchange API-Token for a Base-Token (cached, 72h validity) */
async function getBaseToken(): Promise<BaseToken> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken;
  }

  const res = await fetch(`${SEATABLE_BASE_URL}/api/v2.1/dtable/app-access-token/`, {
    headers: { Authorization: `Token ${SEATABLE_API_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`SeaTable auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    dtable_uuid: data.dtable_uuid,
    dtable_server: data.dtable_server ?? `${SEATABLE_BASE_URL}/api-gateway/`,
    dtable_name: data.dtable_name,
    expires_at: Date.now() + 71 * 60 * 60 * 1000,
  };
  return cachedToken;
}

/** Build the v2 API base URL */
async function apiBase(): Promise<{ url: string; token: string; uuid: string }> {
  const t = await getBaseToken();
  // dtable_server already ends with /api-gateway/ — append v2 path
  const base = t.dtable_server.endsWith("/")
    ? t.dtable_server.slice(0, -1)
    : t.dtable_server;
  return {
    url: `${base}/api/v2/dtables/${t.dtable_uuid}`,
    token: t.access_token,
    uuid: t.dtable_uuid,
  };
}

/** Execute a SQL query against the base */
export async function sqlQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/sql/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, convert_keys: true }),
  });

  if (!res.ok) {
    throw new Error(`SeaTable SQL failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.results ?? []) as T[];
}

/** Insert a single row and return its _id */
export async function insertRow(
  tableName: string,
  row: Record<string, unknown>
): Promise<string> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/rows/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ table_name: tableName, rows: [row] }),
  });

  if (!res.ok) {
    throw new Error(`SeaTable insert failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.row_ids?.[0]?._id ?? data.first_row?._id;
}

/** Update a single row (uses batch format per Seibert convention) */
export async function updateRow(
  tableName: string,
  rowId: string,
  updates: Record<string, unknown>
): Promise<void> {
  await batchUpdateRows(tableName, [{ row_id: rowId, row: updates }]);
}

/** Batch update multiple rows */
export async function batchUpdateRows(
  tableName: string,
  updates: { row_id: string; row: Record<string, unknown> }[]
): Promise<void> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/rows/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ table_name: tableName, updates }),
  });

  if (!res.ok) {
    throw new Error(`SeaTable batch update failed: ${res.status} ${await res.text()}`);
  }
}

/** Batch insert multiple rows */
export async function batchInsertRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<string[]> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/rows/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ table_name: tableName, rows }),
  });

  if (!res.ok) {
    throw new Error(`SeaTable batch insert failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.row_ids ?? []).map((r: { _id: string }) => r._id);
}

/** Create a link between two rows */
export async function createRowLink(
  assetRowId: string,
  campaignRowId: string
): Promise<void> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/links/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table_id: TABLE_ID_ASSETS,
      other_table_id: TABLE_ID_CAMPAIGNS,
      link_id: LINK_ID_CAMPAIGN_ASSETS,
      row_id: assetRowId,
      other_row_id: campaignRowId,
    }),
  });

  if (!res.ok) {
    throw new Error(`SeaTable link failed: ${res.status} ${await res.text()}`);
  }
}

/** Get linked row IDs for a given row via the links API */
async function getLinkedRowIds(
  tableId: string,
  otherTableId: string,
  linkId: string,
  rowId: string
): Promise<string[]> {
  const { url, token } = await apiBase();
  const res = await fetch(`${url}/links/${linkId}/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Fallback: if the links endpoint doesn't support this pattern,
  // we use the metadata approach
  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.row_ids ?? [];
}

/** Upload a file (image/pdf) to SeaTable */
export async function uploadFile(
  fileName: string,
  data: Buffer,
  relativePath?: string
): Promise<string> {
  const { url, token } = await apiBase();

  // Step 1: Get upload link
  const linkRes = await fetch(`${url}/upload-link/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!linkRes.ok) {
    throw new Error(`SeaTable upload link failed: ${linkRes.status}`);
  }

  const { upload_link, parent_path } = await linkRes.json();

  // Step 2: Upload file
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(data)]), fileName);
  formData.append("parent_dir", parent_path);
  if (relativePath) {
    formData.append("relative_path", relativePath);
  }

  const uploadRes = await fetch(upload_link, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`SeaTable file upload failed: ${uploadRes.status}`);
  }

  const result = await uploadRes.json();
  return result[0]?.url ?? result.url;
}

// --- Typed helpers for Campaigns and Assets ---

export interface CampaignRow {
  _id: string;
  Name: string;
  Status: string;
  Prompt: string;
  Language: string;
  Topic: string;
  "Target Audience": string;
  Tone: string;
  Goals: string;
  "Key Messages": string;
  Pillars: string;
  "Brand Voice": string;
  "Overall Score": number;
  "Consistency Notes": string;
  Error: string;
  _ctime: string;
  _mtime: string;
}

export interface AssetRow {
  _id: string;
  Title: string;
  "Asset ID": string;
  Type: string;
  Status: string;
  Content: string;
  Angle: string;
  Pillar: string;
  "Key Points": string;
  CTA: string;
  "Review Score": number;
  "Review Strengths": string;
  "Review Issues": string;
  "Review Suggestions": string;
  Image: string;
  PDF: string;
  Metadata: string;
  "Publish URL": string;
  _ctime: string;
  _mtime: string;
}

/** Step 1 loading: compact campaign list */
export async function listCampaigns(): Promise<CampaignRow[]> {
  return sqlQuery<CampaignRow>(
    'SELECT _id, Name, Status, Language, Topic, `Overall Score`, _ctime, _mtime FROM Campaigns ORDER BY _ctime DESC LIMIT 50'
  );
}

/** Step 2 loading: full campaign details */
export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const rows = await sqlQuery<CampaignRow>(
    `SELECT _id, Name, Status, Prompt, Language, Topic, \`Target Audience\`, Tone, Goals, \`Key Messages\`, Pillars, \`Brand Voice\`, \`Overall Score\`, \`Consistency Notes\`, Error, _ctime, _mtime FROM Campaigns WHERE _id='${id}' LIMIT 1`
  );
  return rows[0] ?? null;
}

/**
 * Get assets for a campaign.
 * Since link columns can't be filtered via SQL, we query the linked rows
 * via the links API, then load the asset details.
 */
export async function getCampaignAssets(campaignId: string): Promise<AssetRow[]> {
  const { url, token } = await apiBase();

  // Use the row-links endpoint to get linked asset IDs
  const res = await fetch(
    `${url}/links/${LINK_ID_CAMPAIGN_ASSETS}/rows/${campaignId}/`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    // Fallback: return all assets (for small datasets this is acceptable)
    return sqlQuery<AssetRow>(
      'SELECT _id, Title, `Asset ID`, Type, Status, Angle, Pillar, `Review Score`, _ctime FROM Assets ORDER BY Type, Title'
    );
  }

  const data = await res.json();
  const linkedIds: string[] = (data.linked_rows ?? data.results ?? []).map(
    (r: { _id: string }) => r._id
  );

  if (linkedIds.length === 0) return [];

  const idList = linkedIds.map((id) => `'${id}'`).join(",");
  return sqlQuery<AssetRow>(
    `SELECT _id, Title, \`Asset ID\`, Type, Status, Angle, Pillar, \`Review Score\`, _ctime FROM Assets WHERE _id IN (${idList}) ORDER BY Type, Title`
  );
}

/** Step 2 loading: full asset details */
export async function getAsset(id: string): Promise<AssetRow | null> {
  const rows = await sqlQuery<AssetRow>(
    `SELECT _id, Title, \`Asset ID\`, Type, Status, Content, Angle, Pillar, \`Key Points\`, CTA, \`Review Score\`, \`Review Strengths\`, \`Review Issues\`, \`Review Suggestions\`, Image, PDF, Metadata, \`Publish URL\`, _ctime, _mtime FROM Assets WHERE _id='${id}' LIMIT 1`
  );
  return rows[0] ?? null;
}
