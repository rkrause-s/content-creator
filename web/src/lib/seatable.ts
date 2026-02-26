/**
 * SeaTable client with two-step auth (API-Token → Base-Token).
 * Reads via SQL API, writes via Batch Update API.
 */

const SEATABLE_BASE_URL = import.meta.env.SEATABLE_BASE_URL ?? "https://seatable.seibert.tools";
const SEATABLE_API_TOKEN = import.meta.env.SEATABLE_API_TOKEN ?? "";

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
    dtable_server: data.dtable_server ?? SEATABLE_BASE_URL,
    dtable_name: data.dtable_name,
    // SeaTable base tokens are valid for 72 hours
    expires_at: Date.now() + 71 * 60 * 60 * 1000,
  };
  return cachedToken;
}

/** Execute a SQL query against the base */
export async function sqlQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const token = await getBaseToken();
  const res = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/sql/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    }
  );

  if (!res.ok) {
    throw new Error(`SeaTable SQL failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return (data.results ?? []) as T[];
}

/** Update a single row */
export async function updateRow(
  tableName: string,
  rowId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const token = await getBaseToken();
  const res = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/rows/`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        table_name: tableName,
        row: { _id: rowId, ...updates },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`SeaTable update failed: ${res.status} ${await res.text()}`);
  }
}

/** Insert a single row and return its _id */
export async function insertRow(
  tableName: string,
  row: Record<string, unknown>
): Promise<string> {
  const token = await getBaseToken();
  const res = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/rows/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ table_name: tableName, row }),
    }
  );

  if (!res.ok) {
    throw new Error(`SeaTable insert failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data._id;
}

/** Batch insert multiple rows */
export async function batchInsertRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  const token = await getBaseToken();
  const res = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/batch-append-rows/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ table_name: tableName, rows }),
    }
  );

  if (!res.ok) {
    throw new Error(`SeaTable batch insert failed: ${res.status} ${await res.text()}`);
  }
}

/** Batch update multiple rows */
export async function batchUpdateRows(
  tableName: string,
  updates: { row_id: string; row: Record<string, unknown> }[]
): Promise<void> {
  const token = await getBaseToken();
  const res = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/batch-update-rows/`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ table_name: tableName, updates }),
    }
  );

  if (!res.ok) {
    throw new Error(`SeaTable batch update failed: ${res.status} ${await res.text()}`);
  }
}

/** Upload a file (image/pdf) to SeaTable */
export async function uploadFile(
  fileName: string,
  data: Buffer,
  relativePath?: string
): Promise<string> {
  const token = await getBaseToken();

  // Step 1: Get upload link
  const linkRes = await fetch(
    `${token.dtable_server}/api/v1/dtables/${token.dtable_uuid}/upload-link/`,
    {
      headers: { Authorization: `Bearer ${token.access_token}` },
    }
  );

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
    headers: { Authorization: `Bearer ${token.access_token}` },
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

export async function listCampaigns(): Promise<CampaignRow[]> {
  return sqlQuery<CampaignRow>(
    `SELECT _id, Name, Status, Language, Topic, "Overall Score", _ctime, _mtime FROM Campaigns ORDER BY _ctime DESC LIMIT 50`
  );
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const rows = await sqlQuery<CampaignRow>(
    `SELECT * FROM Campaigns WHERE _id='${id}' LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function getCampaignAssets(campaignId: string): Promise<AssetRow[]> {
  // SeaTable link columns: query assets that belong to this campaign
  return sqlQuery<AssetRow>(
    `SELECT * FROM Assets WHERE Campaign='${campaignId}' ORDER BY Type, Title`
  );
}

export async function getAsset(id: string): Promise<AssetRow | null> {
  const rows = await sqlQuery<AssetRow>(
    `SELECT * FROM Assets WHERE _id='${id}' LIMIT 1`
  );
  return rows[0] ?? null;
}
