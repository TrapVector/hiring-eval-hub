import { useEffect, useState } from 'react'
import { AuthProvider } from './auth/AuthContext'
import { isConfigComplete } from './config/isConfigComplete'
import { loadConfig } from './store/configStore'
import type { AppConfig } from './store/db'
import { StoreProvider } from './store/StoreContext'
import { Shell } from './ui/Shell'
import { SetupWizard } from './ui/settings/SetupWizard'

function App() {
  return (
    <AuthProvider>
      <ConfigGate />
    </AuthProvider>
  )
}

function ConfigGate() {
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
    <StoreProvider config={config}>
      <Shell config={config} onConfigChanged={() => void loadConfig().then(setConfig)} />
    </StoreProvider>
  )
}

export default App
