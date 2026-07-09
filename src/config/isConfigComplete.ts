import type { AppConfig } from '../store/db'

/** Whether the four runtime-entered IDs are all present, so the app can skip the setup wizard. */
export function isConfigComplete(config: AppConfig | null): config is AppConfig {
  if (!config) return false
  return Boolean(config.applicationsSheetId.trim() && config.reviewsSheetId.trim() && config.oauthClientId.trim())
}
