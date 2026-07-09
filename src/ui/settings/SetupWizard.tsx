import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { defaultStages, guessFields } from '../../config/seedDefaults'
import { writeConfigTables } from '../../config/writeConfigTables'
import { readApplicationsHeader, resolveApplicationsTabName } from '../../sheets/applicationsSheet'
import { ensureReviewsWorkbook, readFields, readPositions, readStages } from '../../sheets/reviewsSheet'
import type { FieldRole, FieldRow, PositionRow, StageRow } from '../../sheets/types'
import { saveConfig } from '../../store/configStore'
import type { AppConfig } from '../../store/db'
import styles from './SetupWizard.module.css'

interface SetupWizardProps {
  initialConfig?: AppConfig | null
  onComplete: () => void
}

type Step = 'ids' | 'config'

const FIELD_ROLE_OPTIONS: { value: FieldRole; label: string }[] = [
  { value: '', label: 'Short field' },
  { value: 'key', label: 'Email (key)' },
  { value: 'name', label: 'Name' },
  { value: 'long', label: 'Long-form answer' },
]

export function SetupWizard({ initialConfig, onComplete }: SetupWizardProps) {
  const auth = useAuth()
  const [step, setStep] = useState<Step>('ids')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [applicationsSheetId, setApplicationsSheetId] = useState(initialConfig?.applicationsSheetId ?? '')
  const [applicationsTabName, setApplicationsTabName] = useState(initialConfig?.applicationsTabName ?? '')
  const [reviewsSheetId, setReviewsSheetId] = useState(initialConfig?.reviewsSheetId ?? '')
  const [oauthClientId, setOauthClientId] = useState(initialConfig?.oauthClientId ?? '')

  const [fields, setFields] = useState<FieldRow[]>([])
  const [stages, setStages] = useState<StageRow[]>([])
  const [positions, setPositions] = useState<PositionRow[]>([])

  const canContinue = Boolean(
    applicationsSheetId.trim() && reviewsSheetId.trim() && oauthClientId.trim() && !busy,
  )

  async function handleContinue() {
    setBusy(true)
    setError(null)
    try {
      const appsId = applicationsSheetId.trim()
      const reviewsId = reviewsSheetId.trim()
      await auth.connect(oauthClientId.trim())
      await ensureReviewsWorkbook(reviewsId, auth)
      const tabName = await resolveApplicationsTabName(appsId, applicationsTabName.trim() || undefined, auth)
      const [header, existingStages, existingPositions, existingFields] = await Promise.all([
        readApplicationsHeader(appsId, tabName, auth),
        readStages(reviewsId, auth),
        readPositions(reviewsId, auth),
        readFields(reviewsId, auth),
      ])
      setStages(existingStages.length ? existingStages : defaultStages())
      setPositions(existingPositions)
      setFields(existingFields.length ? existingFields : guessFields(header))
      setStep('config')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleSave() {
    const keyCount = fields.filter((f) => f.role === 'key').length
    const nameCount = fields.filter((f) => f.role === 'name').length
    if (keyCount !== 1 || nameCount !== 1) {
      setError('Exactly one field must be marked Email (key) and one Name.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const reviewsId = reviewsSheetId.trim()
      await writeConfigTables(reviewsId, { stages, positions, fields }, auth)
      await saveConfig({
        applicationsSheetId: applicationsSheetId.trim(),
        applicationsTabName: applicationsTabName.trim() || null,
        reviewsSheetId: reviewsId,
        oauthClientId: oauthClientId.trim(),
        pollIntervalMinutes: initialConfig?.pollIntervalMinutes ?? 3,
      })
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (step === 'ids') {
    return (
      <div className={styles.wizard}>
        <h2>Connect your sheets</h2>
        <label className={styles.field}>
          Applications Sheet ID
          <input value={applicationsSheetId} onChange={(e) => setApplicationsSheetId(e.target.value)} />
        </label>
        <label className={styles.field}>
          Applications tab name (optional)
          <input
            value={applicationsTabName}
            onChange={(e) => setApplicationsTabName(e.target.value)}
            placeholder="defaults to first tab"
          />
        </label>
        <label className={styles.field}>
          Reviews Sheet ID
          <input value={reviewsSheetId} onChange={(e) => setReviewsSheetId(e.target.value)} />
        </label>
        <label className={styles.field}>
          OAuth Client ID
          <input
            value={oauthClientId}
            onChange={(e) => setOauthClientId(e.target.value)}
            placeholder="xxxx.apps.googleusercontent.com"
          />
        </label>
        <button type="button" onClick={handleContinue} disabled={!canContinue}>
          {busy ? 'Connecting…' : 'Connect & continue'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    )
  }

  return (
    <div className={styles.wizard}>
      <h2>Review your configuration</h2>

      <section>
        <h3>Fields</h3>
        <FieldsEditor fields={fields} onChange={setFields} />
      </section>

      <section>
        <h3>Pipeline stages</h3>
        <StagesEditor stages={stages} onChange={setStages} />
      </section>

      <section>
        <h3>Open positions</h3>
        <PositionsEditor positions={positions} onChange={setPositions} />
      </section>

      <button type="button" onClick={handleSave} disabled={busy}>
        {busy ? 'Saving…' : 'Save configuration'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}

function FieldsEditor({ fields, onChange }: { fields: FieldRow[]; onChange: (fields: FieldRow[]) => void }) {
  function update(index: number, patch: Partial<FieldRow>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Column</th>
          <th>Role</th>
          <th>Show</th>
          <th>Order</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field, i) => (
          <tr key={field.column}>
            <td>{field.column}</td>
            <td>
              <select value={field.role} onChange={(e) => update(i, { role: e.target.value as FieldRole })}>
                {FIELD_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input type="checkbox" checked={field.show} onChange={(e) => update(i, { show: e.target.checked })} />
            </td>
            <td>
              <input
                type="number"
                value={field.order ?? ''}
                onChange={(e) => update(i, { order: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StagesEditor({ stages, onChange }: { stages: StageRow[]; onChange: (stages: StageRow[]) => void }) {
  function update(index: number, patch: Partial<StageRow>) {
    onChange(stages.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  function remove(index: number) {
    onChange(stages.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...stages, { stage: '', isActionQueue: false }])
  }

  return (
    <div>
      {stages.map((stage, i) => (
        <div key={i} className={styles.row}>
          <input value={stage.stage} onChange={(e) => update(i, { stage: e.target.value })} />
          <label>
            <input
              type="checkbox"
              checked={stage.isActionQueue}
              onChange={(e) => update(i, { isActionQueue: e.target.checked })}
            />
            Action queue
          </label>
          <button type="button" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={add}>
        Add stage
      </button>
    </div>
  )
}

function PositionsEditor({
  positions,
  onChange,
}: {
  positions: PositionRow[]
  onChange: (positions: PositionRow[]) => void
}) {
  function update(index: number, position: string) {
    onChange(positions.map((p, i) => (i === index ? { position } : p)))
  }

  function remove(index: number) {
    onChange(positions.filter((_, i) => i !== index))
  }

  function add() {
    onChange([...positions, { position: '' }])
  }

  return (
    <div>
      {positions.map((position, i) => (
        <div key={i} className={styles.row}>
          <input value={position.position} onChange={(e) => update(i, e.target.value)} />
          <button type="button" onClick={() => remove(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={add}>
        Add position
      </button>
    </div>
  )
}
