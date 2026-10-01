/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOCIAL_INSTAGRAM_URL?: string
  readonly VITE_SOCIAL_YOUTUBE_URL?: string
  readonly VITE_SOCIAL_TIKTOK_URL?: string
  readonly VITE_SOCIAL_X_URL?: string
  readonly VITE_SOCIAL_DISCORD_URL?: string
  readonly VITE_SOCIAL_LINKEDIN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
