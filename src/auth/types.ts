export type AuthStatus = 'signed-out' | 'connecting' | 'signed-in' | 'reauth-required'

export interface AuthState {
  status: AuthStatus
  error?: string
}
