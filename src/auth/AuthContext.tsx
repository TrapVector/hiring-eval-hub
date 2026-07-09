import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GoogleAuthClient } from './GoogleAuthClient'
import type { AuthState } from './types'

interface AuthContextValue extends AuthState {
  connect: (clientId: string) => Promise<string>
  reconnect: () => Promise<string>
  getAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new GoogleAuthClient(), [])
  const [state, setState] = useState<AuthState>(() => client.getState())

  useEffect(() => client.subscribe(setState), [client])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      connect: (clientId) => client.connect(clientId),
      reconnect: () => client.reconnect(),
      getAccessToken: () => client.getAccessToken(),
    }),
    [state, client],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
