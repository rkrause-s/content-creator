/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SEATABLE_API_TOKEN: string;
  readonly SEATABLE_BASE_URL: string;
  readonly N8N_WEBHOOK_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
