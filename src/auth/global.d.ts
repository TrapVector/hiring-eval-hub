import type { GoogleTokenClient, GoogleTokenClientConfig } from './googleIdentityTypes'

export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GoogleTokenClientConfig): GoogleTokenClient
        }
      }
    }
  }
}
