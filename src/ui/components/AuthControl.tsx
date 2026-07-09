import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import styles from './AuthControl.module.css'

interface AuthControlProps {
  /** Pre-fills the Client ID field from stored config, so returning users don't retype it. */
  defaultClientId?: string
}

export function AuthControl({ defaultClientId = '' }: AuthControlProps) {
  const { status, error, connect, reconnect } = useAuth()
  const [clientId, setClientId] = useState(defaultClientId)
  const [busy, setBusy] = useState(false)

  async function handleConnect() {
    const trimmed = clientId.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await connect(trimmed)
    } catch {
      // Failure is already reflected in `error` via auth state.
    } finally {
      setBusy(false)
    }
  }

  async function handleReconnect() {
    setBusy(true)
    try {
      await reconnect()
    } catch {
      // Failure is already reflected in `error` via auth state.
    } finally {
      setBusy(false)
    }
  }

  if (status === 'signed-in') {
    return <p className={styles.status}>Signed in to Google.</p>
  }

  if (status === 'reauth-required') {
    return (
      <div className={styles.control}>
        <p className={styles.status}>Your Google session needs to be reconnected.</p>
        <button type="button" onClick={handleReconnect} disabled={busy}>
          {busy ? 'Reconnecting…' : 'Reconnect'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }

  return (
    <div className={styles.control}>
      <label className={styles.label} htmlFor="oauth-client-id">
        OAuth Client ID
      </label>
      <input
        id="oauth-client-id"
        type="text"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        placeholder="xxxx.apps.googleusercontent.com"
      />
      <button type="button" onClick={handleConnect} disabled={busy || !clientId.trim()}>
        {busy || status === 'connecting' ? 'Connecting…' : 'Connect Google Account'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
