import { SHEETS_SCOPE } from './constants'
import type { GoogleTokenClient, GoogleTokenResponse } from './googleIdentityTypes'
import { loadGoogleIdentityScript } from './loadGoogleIdentityScript'
import { isTokenFresh } from './tokenExpiry'
import type { AuthState } from './types'

type Listener = (state: AuthState) => void

/**
 * Wraps the GIS token-flow client in a promise-based API. The access token
 * is held in memory only (never persisted) per CLAUDE.md §7/§8.5.
 */
export class GoogleAuthClient {
  private clientId: string | null = null
  private tokenClient: GoogleTokenClient | null = null
  private accessToken: string | null = null
  private expiresAt: number | null = null
  private hadToken = false
  private state: AuthState = { status: 'signed-out' }
  private listeners = new Set<Listener>()
  private inFlight: Promise<string> | null = null
  private resolvePending: ((token: string) => void) | null = null
  private rejectPending: ((err: Error) => void) | null = null

  getState(): AuthState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  /** First-time sign-in; shows the Google consent screen. */
  connect(clientId: string): Promise<string> {
    return this.requestToken(clientId, 'consent')
  }

  /** Re-authenticate with the previously used client ID (Reconnect control). */
  reconnect(): Promise<string> {
    if (!this.clientId) {
      return Promise.reject(new Error('No client ID configured yet'))
    }
    return this.requestToken(this.clientId, '')
  }

  /** Returns a usable access token, silently refreshing if it's stale. */
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.expiresAt && isTokenFresh(this.expiresAt, Date.now())) {
      return this.accessToken
    }
    if (!this.clientId) {
      throw new Error('Not connected')
    }
    return this.requestToken(this.clientId, '')
  }

  private setState(next: AuthState): void {
    this.state = next
    for (const listener of this.listeners) {
      listener(next)
    }
  }

  private async ensureTokenClient(clientId: string): Promise<GoogleTokenClient> {
    if (this.tokenClient && this.clientId === clientId) {
      return this.tokenClient
    }
    await loadGoogleIdentityScript()
    if (!window.google) {
      throw new Error('Google Identity Services failed to load')
    }
    this.clientId = clientId
    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SHEETS_SCOPE,
      callback: (response) => this.handleTokenResponse(response),
    })
    return this.tokenClient
  }

  private handleTokenResponse(response: GoogleTokenResponse): void {
    if (response.error || !response.access_token) {
      this.accessToken = null
      this.expiresAt = null
      const message = response.error_description ?? response.error ?? 'Sign-in failed'
      this.setState({ status: this.hadToken ? 'reauth-required' : 'signed-out', error: message })
      this.rejectPending?.(new Error(message))
    } else {
      this.accessToken = response.access_token
      this.expiresAt = Date.now() + (response.expires_in ?? 3600) * 1000
      this.hadToken = true
      this.setState({ status: 'signed-in' })
      this.resolvePending?.(this.accessToken)
    }
    this.resolvePending = null
    this.rejectPending = null
    this.inFlight = null
  }

  private requestToken(clientId: string, prompt: string): Promise<string> {
    if (this.inFlight) {
      return this.inFlight
    }
    this.inFlight = new Promise<string>((resolve, reject) => {
      this.resolvePending = resolve
      this.rejectPending = reject
      this.ensureTokenClient(clientId)
        .then((client) => {
          this.setState({ status: 'connecting' })
          client.requestAccessToken({ prompt })
        })
        .catch((err: unknown) => {
          this.resolvePending = null
          this.rejectPending = null
          this.inFlight = null
          reject(err instanceof Error ? err : new Error(String(err)))
        })
    })
    return this.inFlight
  }
}
