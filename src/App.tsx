import { useEffect, useState } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { isConfigComplete } from './config/isConfigComplete'
import { loadConfig } from './store/configStore'
import type { AppConfig } from './store/db'
import { AuthControl } from './ui/components/AuthControl'
import { SetupWizard } from './ui/settings/SetupWizard'

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
  const [config, setConfig] = useState<AppConfig | null | 'loading'>('loading')

  useEffect(() => {
    void loadConfig().then(setConfig)
  }, [])

  if (config === 'loading') {
    return (
      <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <p>Loading…</p>
      </main>
    )
  }

  if (!isConfigComplete(config)) {
    return (
      <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
        <h1>Arcade Hiring Review</h1>
        <SetupWizard initialConfig={config} onComplete={() => void loadConfig().then(setConfig)} />
      </main>
    )
  }

  return (
    <main style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
      <h1>Arcade Hiring Review</h1>
      <p>Configured. Dashboard lands in a later milestone.</p>
      <AuthControl defaultClientId={config.oauthClientId} />
    </main>
  )
}

export default App
