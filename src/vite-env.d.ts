/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Development only: `on`, `empty` or `not-ready` replaces the admin API with in-memory sample data. */
  readonly VITE_ADMIN_API_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
