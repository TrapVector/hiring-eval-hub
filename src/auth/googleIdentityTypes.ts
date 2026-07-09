export interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export interface GoogleTokenClientConfig {
  client_id: string
  scope: string
  callback: (response: GoogleTokenResponse) => void
}

export interface GoogleTokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void
}
