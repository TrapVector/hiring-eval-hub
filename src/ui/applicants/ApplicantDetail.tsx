import { useEffect, useRef, useState } from 'react'
import { resolveFields } from '../../data/fields'
import type { ApplicantRecord } from '../../data/types'
import { useStore } from '../../store/StoreContext'
import styles from './ApplicantDetail.module.css'

interface ApplicantDetailProps {
  applicant: ApplicantRecord
  queueEmails: string[]
  onBack: () => void
  onNavigate: (email: string) => void
}

const NOTE_AUTOSAVE_DELAY_MS = 800

export function ApplicantDetail({ applicant, queueEmails, onBack, onNavigate }: ApplicantDetailProps) {
  const { stages, positions, fields, editStage, editNote, editOfferedPosition } = useStore()
  const { nameColumn, longColumns, visible } = resolveFields(fields)
  const [note, setNote] = useState(applicant.note)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setNote(applicant.note)
  }, [applicant.email, applicant.note])

  useEffect(() => {
    return () => {
      if (noteTimer.current) clearTimeout(noteTimer.current)
    }
  }, [])

  function handleNoteChange(value: string) {
    setNote(value)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      editNote(applicant.email, value)
    }, NOTE_AUTOSAVE_DELAY_MS)
  }

  const index = queueEmails.indexOf(applicant.email)
  const hasPrev = index > 0
  const hasNext = index >= 0 && index < queueEmails.length - 1
  const prevEmail = hasPrev ? queueEmails[index - 1] : undefined
  const nextEmail = hasNext ? queueEmails[index + 1] : undefined

  const displayName = (nameColumn ? applicant.applicationValues[nameColumn] : '') || applicant.email
  const shortFields = visible.filter((f) => !longColumns.includes(f.column) && f.column !== nameColumn)

  return (
    <div className={styles.detail}>
      <div className={styles.nav}>
        <button type="button" onClick={onBack}>
          ← Back
        </button>
        {queueEmails.length > 0 && (
          <span className={styles.navButtons}>
            <button type="button" disabled={!prevEmail} onClick={() => prevEmail && onNavigate(prevEmail)}>
              ‹ Prev
            </button>
            <button type="button" disabled={!nextEmail} onClick={() => nextEmail && onNavigate(nextEmail)}>
              Next ›
            </button>
          </span>
        )}
      </div>

      <h2>{displayName}</h2>

      <div className={styles.controls}>
        <label>
          Stage
          <select value={applicant.stage} onChange={(e) => editStage(applicant.email, e.target.value)}>
            {stages.map((s) => (
              <option key={s.stage} value={s.stage}>
                {s.stage}
              </option>
            ))}
          </select>
        </label>
        <label>
          Offered position
          <select
            value={applicant.offeredPosition}
            onChange={(e) => editOfferedPosition(applicant.email, e.target.value)}
          >
            <option value="">—</option>
            {positions.map((p) => (
              <option key={p.position} value={p.position}>
                {p.position}
              </option>
            ))}
          </select>
        </label>
      </div>

      {longColumns.length > 0 && (
        <section className={styles.longAnswers}>
          {longColumns.map((column) => (
            <div key={column} className={styles.longAnswer}>
              <h3>{column}</h3>
              <p>{applicant.applicationValues[column] || '—'}</p>
            </div>
          ))}
        </section>
      )}

      {shortFields.length > 0 && (
        <section className={styles.shortFields}>
          {shortFields.map((f) => (
            <div key={f.column} className={styles.shortField}>
              <span className={styles.shortLabel}>{f.column}</span>
              <span>{applicant.applicationValues[f.column] || '—'}</span>
            </div>
          ))}
        </section>
      )}

      <label className={styles.noteLabel}>
        Note
        <textarea value={note} onChange={(e) => handleNoteChange(e.target.value)} rows={6} />
      </label>
    </div>
  )
}
