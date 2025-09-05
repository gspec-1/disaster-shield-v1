/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_FORCE_REAL_EMAILS?: string
  readonly DEV: boolean
  readonly PROD: boolean
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
