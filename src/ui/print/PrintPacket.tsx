import { resolveFields } from '../../data/fields'
import type { ApplicantRecord } from '../../data/types'
import { useStore } from '../../store/StoreContext'
import styles from './PrintPacket.module.css'

interface PrintPacketProps {
  queueEmails: string[]
  onBack: () => void
}

export function PrintPacket({ queueEmails, onBack }: PrintPacketProps) {
  const { applicants, fields } = useStore()
  const { nameColumn, preferredNameColumn, longColumns, keyInfoColumns } = resolveFields(fields)

  const byEmail = new Map(applicants.map((a) => [a.email, a]))
  const packetApplicants = queueEmails.map((email) => byEmail.get(email)).filter((a): a is ApplicantRecord => Boolean(a))

  return (
    <div>
      <div className={`${styles.toolbar} ${styles.noPrint}`}>
        <button type="button" onClick={onBack}>
          ← Back
        </button>
        <button type="button" onClick={() => window.print()}>
          Print
        </button>
        <span>
          {packetApplicants.length} {packetApplicants.length === 1 ? 'packet' : 'packets'}
        </span>
      </div>

      <div className={styles.packets}>
        {packetApplicants.map((applicant) => {
          const fullName = (nameColumn ? applicant.applicationValues[nameColumn] : '') || applicant.email
          const preferredName = preferredNameColumn ? applicant.applicationValues[preferredNameColumn] : ''

          return (
            <article key={applicant.email} className={styles.page}>
              <h1 className={styles.name}>{fullName}</h1>
              {preferredName && <p className={styles.preferredName}>Preferred name: {preferredName}</p>}

              {keyInfoColumns.length > 0 && (
                <div className={styles.keyInfo}>
                  {keyInfoColumns.map((f) => (
                    <div key={f.column} className={styles.keyInfoItem}>
                      <span className={styles.keyInfoLabel}>{f.column}</span>
                      <span>{applicant.applicationValues[f.column] || '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              {applicant.note && (
                <section className={styles.note}>
                  <h2>Notes</h2>
                  <p>{applicant.note}</p>
                </section>
              )}

              {longColumns.length > 0 && (
                <section className={styles.answers}>
                  <h2>Answers</h2>
                  {longColumns.map((column) => (
                    <div key={column} className={styles.answer}>
                      <h3>{column}</h3>
                      <p>{applicant.applicationValues[column] || '—'}</p>
                    </div>
                  ))}
                </section>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
