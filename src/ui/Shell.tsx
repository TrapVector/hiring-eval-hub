import { useState } from 'react'
import type { AppConfig } from '../store/db'
import { useStore } from '../store/StoreContext'
import { ApplicantDetail } from './applicants/ApplicantDetail'
import { ApplicantList } from './applicants/ApplicantList'
import { AuthControl } from './components/AuthControl'
import { StatusBar } from './components/StatusBar'
import { Dashboard } from './dashboard/Dashboard'
import { PrintPacket } from './print/PrintPacket'
import { SetupWizard } from './settings/SetupWizard'
import styles from './Shell.module.css'

export type View =
  | { name: 'dashboard' }
  | { name: 'queue'; stage: string | null }
  | { name: 'applicant'; email: string; queueEmails: string[]; back: View }
  | { name: 'print'; queueEmails: string[]; back: View }
  | { name: 'settings' }

interface ShellProps {
  config: AppConfig
  onConfigChanged: () => void
}

export function Shell({ config, onConfigChanged }: ShellProps) {
  const { applicants } = useStore()
  const [view, setView] = useState<View>({ name: 'dashboard' })

  const applicant = view.name === 'applicant' ? applicants.find((a) => a.email === view.email) : undefined

  // Print packets are a full takeover: no app header/status-bar/auth-row, since none of
  // that chrome belongs on a printed page or its print preview.
  if (view.name === 'print') {
    return <PrintPacket queueEmails={view.queueEmails} onBack={() => setView(view.back)} />
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={() => setView({ name: 'dashboard' })}>
          Arcade Hiring Review
        </button>
        <StatusBar />
        <button type="button" onClick={() => setView({ name: 'settings' })}>
          Settings
        </button>
      </header>

      <div className={styles.authRow}>
        <AuthControl defaultClientId={config.oauthClientId} />
      </div>

      <main className={styles.main}>
        {view.name === 'dashboard' && <Dashboard onOpenStage={(stage) => setView({ name: 'queue', stage })} />}

        {view.name === 'queue' && (
          <ApplicantList
            initialStage={view.stage}
            onBack={() => setView({ name: 'dashboard' })}
            onOpenApplicant={(email, queueEmails) => setView({ name: 'applicant', email, queueEmails, back: view })}
            onPrintQueue={(queueEmails) => setView({ name: 'print', queueEmails, back: view })}
          />
        )}

        {view.name === 'applicant' && applicant && (
          <ApplicantDetail
            applicant={applicant}
            queueEmails={view.queueEmails}
            onBack={() => setView(view.back)}
            onNavigate={(email) => setView({ ...view, email })}
          />
        )}

        {view.name === 'applicant' && !applicant && <p>Applicant not found.</p>}

        {view.name === 'settings' && (
          <SetupWizard
            initialConfig={config}
            onComplete={() => {
              onConfigChanged()
              setView({ name: 'dashboard' })
            }}
          />
        )}
      </main>
    </div>
  )
}
